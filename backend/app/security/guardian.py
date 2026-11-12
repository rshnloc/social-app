import re
import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DetectionFinding(BaseModel):
    category: str  # "credential", "pii", "confidential"
    type: str      # e.g., "openai_api_key", "credit_card", "ssn", "private_key"
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    snippet: str   # masked snippet for display
    start: int
    end: int
    description: str
    recommendation: str

class GuardianReport(BaseModel):
    is_safe: bool
    risk_score: int  # 0 to 100
    findings_count: int
    findings: List[DetectionFinding]
    redacted_preview: str

class GuardianShield:
    """
    Advanced real-time scanner & sanitizer for credentials, PII, and confidential data.
    Ensures safe social posting and prevents intellectual property or private token leakage.
    """

    # --- Credential Patterns ---
    CREDENTIAL_PATTERNS = [
        (
            "private_key",
            r"-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP)?\s?PRIVATE KEY.*?(?:-----END (?:RSA|OPENSSH|DSA|EC|PGP)?\s?PRIVATE KEY-----|\Z)",
            "CRITICAL",
            "Asymmetric Private Key (RSA/OpenSSH/PGP)",
            "Never share private cryptographic keys publicly. Rotate immediately."
        ),
        (
            "openai_api_key",
            r"\bsk-(?:live-|proj-)?[A-Za-z0-9_-]{24,64}\b",
            "CRITICAL",
            "OpenAI API Secret Key",
            "Revoke this key immediately on platform.openai.com."
        ),
        (
            "aws_access_key",
            r"\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b",
            "CRITICAL",
            "AWS Access Key ID",
            "Deactivate and rotate via AWS IAM console."
        ),
        (
            "github_token",
            r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}\b",
            "CRITICAL",
            "GitHub Personal Access Token",
            "Revoke token on github.com/settings/tokens."
        ),
        (
            "slack_token",
            r"\bxox[baprs]-[0-9a-zA-Z]{10,48}\b",
            "CRITICAL",
            "Slack Bot or User OAuth Token",
            "Revoke token in Slack App Management."
        ),
        (
            "google_api_key",
            r"\bAIza[0-9A-Za-z-_]{35}\b",
            "HIGH",
            "Google Cloud / Gemini API Key",
            "Restrict or rotate key in Google Cloud Console."
        ),
        (
            "jwt_token",
            r"\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b",
            "HIGH",
            "JSON Web Token (JWT Session Token)",
            "Exposes active user session or authentication state."
        ),
        (
            "db_connection_string",
            r"(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9_.\-]+(?::\d+)?\/[^\s]+",
            "CRITICAL",
            "Database Connection String with Credentials",
            "Database credentials exposed. Rotate password immediately."
        ),
        (
            "password_in_code",
            r"(?i)\b(?:password|passwd|pwd|secret_key|api_secret)\s*[:=]\s*[\"']([^\"']{6,})[\"']",
            "HIGH",
            "Hardcoded Password or Secret Assignment",
            "Avoid placing plain-text secrets in post body."
        )
    ]

    # --- PII (Personally Identifiable Information) Patterns ---
    PII_PATTERNS = [
        (
            "credit_card",
            r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b",
            "CRITICAL",
            "Credit Card Number (PCI-DSS violation)",
            "Do not share payment card numbers on public feeds."
        ),
        (
            "ssn",
            r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b",
            "CRITICAL",
            "Social Security Number (SSN)",
            "Severe identity theft risk. Government ID numbers must remain private."
        ),
        (
            "phone_number",
            r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
            "MEDIUM",
            "Personal Telephone Number",
            "Sharing personal phone numbers invites spam or stalking."
        ),
        (
            "email_address",
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "LOW",
            "Personal Email Address",
            "Verify that sharing this email address is intentional."
        ),
        (
            "passport_or_national_id",
            r"\b(?:Aadhaar|National ID|Passport No\.?|ID Number)\s*[:#-]?\s*[A-Z0-9]{8,14}\b",
            "HIGH",
            "Government Identification Number",
            "National ID numbers are high-risk identifiers."
        ),
        (
            "medical_record",
            r"(?i)\b(?:medical record(?: number)?|MRN|patient ID|health insurance ID)\s*[:#-]?\s*[A-Z0-9-]{6,16}\b",
            "HIGH",
            "Protected Health Information (PHI)",
            "Medical and health records are legally protected private data."
        )
    ]

    # --- Confidential & Corporate IP Patterns ---
    CONFIDENTIAL_PATTERNS = [
        (
            "confidential_stamp",
            r"(?i)\b(?:STRICTLY CONFIDENTIAL|PROPRIETARY AND CONFIDENTIAL|INTERNAL USE ONLY|NOT FOR PUBLIC RELEASE|DO NOT DISTRIBUTE|TRADE SECRET)\b",
            "HIGH",
            "Confidentiality & Non-Disclosure Notice",
            "Content explicitly flagged as confidential proprietary information."
        ),
        (
            "client_ip_leak",
            r"(?i)\b(?:Client Privileged|Attorney-Client Privilege|Employee Salary List|Q[1-4] Unaudited Earnings|Non-Disclosure Agreement \(NDA\))\b",
            "HIGH",
            "Client Proprietary / Employee Internal Record",
            "May expose internal employee or corporate client materials."
        )
    ]

    @staticmethod
    def _shannon_entropy(data: str) -> float:
        """Calculate Shannon entropy to detect high-entropy hex/base64 strings (secret keys)."""
        if not data:
            return 0.0
        entropy = 0.0
        for x in set(data):
            p_x = float(data.count(x)) / len(data)
            entropy += - p_x * math.log2(p_x)
        return entropy

    @classmethod
    def scan(cls, text: str) -> GuardianReport:
        if not text:
            return GuardianReport(
                is_safe=True,
                risk_score=0,
                findings_count=0,
                findings=[],
                redacted_preview=""
            )

        findings: List[DetectionFinding] = []
        redacted_text = text

        # Helper to record matches
        def process_match(category: str, item_type: str, severity: str, desc: str, rec: str, match):
            matched_str = match.group(0)
            # Mask snippet for safety
            if len(matched_str) <= 6:
                masked_snippet = "*" * len(matched_str)
            else:
                masked_snippet = matched_str[:2] + ("*" * (len(matched_str) - 4)) + matched_str[-2:]

            finding = DetectionFinding(
                category=category,
                type=item_type,
                severity=severity,
                snippet=masked_snippet,
                start=match.start(),
                end=match.end(),
                description=desc,
                recommendation=rec
            )
            findings.append(finding)

        # 1. Credentials scan
        for item_type, pattern, severity, desc, rec in cls.CREDENTIAL_PATTERNS:
            flags = re.DOTALL if "private_key" in item_type else 0
            for match in re.finditer(pattern, text, flags):
                process_match("credential", item_type, severity, desc, rec, match)

        # 2. PII scan
        for item_type, pattern, severity, desc, rec in cls.PII_PATTERNS:
            for match in re.finditer(pattern, text):
                # Filter false positive for phone numbers if it looks like a year or short sequence
                if item_type == "phone_number":
                    digits = re.sub(r"\D", "", match.group(0))
                    if len(digits) < 10 or len(digits) > 15:
                        continue
                process_match("pii", item_type, severity, desc, rec, match)

        # 3. Confidential scan
        for item_type, pattern, severity, desc, rec in cls.CONFIDENTIAL_PATTERNS:
            for match in re.finditer(pattern, text):
                process_match("confidential", item_type, severity, desc, rec, match)

        # 4. High-entropy generic secret detection (e.g. standalone random 32+ hex/base64 strings)
        words = text.split()
        for word in words:
            clean_word = word.strip("'\":;,.<>{}[]()")
            if len(clean_word) >= 32 and re.match(r"^[A-Za-z0-9+/=_\-]+$", clean_word):
                entropy = cls._shannon_entropy(clean_word)
                if entropy > 4.5:  # High entropy indicates cryptographic material
                    # Avoid duplicate if already matched by specific pattern
                    if not any(f.snippet.replace("*", "") in clean_word for f in findings):
                        idx = text.find(clean_word)
                        if idx != -1:
                            masked_snippet = clean_word[:3] + ("*" * (len(clean_word) - 6)) + clean_word[-3:]
                            findings.append(DetectionFinding(
                                category="credential",
                                type="high_entropy_secret",
                                severity="HIGH",
                                snippet=masked_snippet,
                                start=idx,
                                end=idx + len(clean_word),
                                description="High-entropy string (likely secret API token or hash)",
                                recommendation="Verify this is not a confidential cryptographic secret before publishing."
                            ))

        # Calculate risk score
        risk_score = 0
        for f in findings:
            if f.severity == "CRITICAL":
                risk_score += 40
            elif f.severity == "HIGH":
                risk_score += 25
            elif f.severity == "MEDIUM":
                risk_score += 15
            elif f.severity == "LOW":
                risk_score += 5
        risk_score = min(risk_score, 100)

        # Build redacted preview
        redacted_preview = cls.redact(text)

        is_safe = risk_score < 30 and not any(f.severity == "CRITICAL" for f in findings)

        return GuardianReport(
            is_safe=is_safe,
            risk_score=risk_score,
            findings_count=len(findings),
            findings=findings,
            redacted_preview=redacted_preview
        )

    @classmethod
    def redact(cls, text: str) -> str:
        """
        Redacts credentials, PII, and confidential triggers with structured placeholders.
        """
        redacted = text
        # Redact private keys first
        redacted = re.sub(
            r"-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP)?\s?PRIVATE KEY.*?(?:-----END (?:RSA|OPENSSH|DSA|EC|PGP)?\s?PRIVATE KEY-----|\Z)",
            "[REDACTED_PRIVATE_KEY]",
            redacted,
            flags=re.DOTALL
        )
        # Redact known credentials
        for item_type, pattern, _, _, _ in cls.CREDENTIAL_PATTERNS:
            if item_type == "private_key":
                continue
            redacted = re.sub(pattern, f"[REDACTED_{item_type.upper()}]", redacted)

        # Redact credit cards and SSN
        redacted = re.sub(
            r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
            "[REDACTED_CREDIT_CARD]",
            redacted
        )
        redacted = re.sub(
            r"\b\d{3}-\d{2}-\d{4}\b",
            "[REDACTED_SSN]",
            redacted
        )
        # Redact phone numbers
        redacted = re.sub(
            r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
            "[REDACTED_PHONE]",
            redacted
        )

        return redacted

guardian_shield = GuardianShield()

