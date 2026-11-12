import { GuardianFinding, GuardianReport } from '../types';

export class GuardianClient {
  /**
   * Fast client-side regex & entropy preflight scanner.
   * Runs in the browser on keystroke with zero network latency.
   */
  static scanLocal(text: string): GuardianReport {
    if (!text || text.trim().length === 0) {
      return {
        is_safe: true,
        risk_score: 0,
        findings_count: 0,
        findings: [],
        redacted_preview: '',
      };
    }

    const findings: GuardianFinding[] = [];

    // 1. Private Key
    const privKeyRegex = /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP)?\s?PRIVATE KEY/i;
    const privMatch = privKeyRegex.exec(text);
    if (privMatch) {
      findings.push({
        category: 'credential',
        type: 'private_key',
        severity: 'CRITICAL',
        snippet: '-----BEGIN PRIVATE KEY-----',
        start: privMatch.index,
        end: privMatch.index + 26,
        description: 'Private Cryptographic Key (RSA/OpenSSH)',
        recommendation: 'Never publish private cryptographic keys.',
      });
    }

    // 2. OpenAI Key
    const openaiRegex = /\bsk-(?:live-|proj-)?[A-Za-z0-9_-]{20,64}\b/g;
    let match: RegExpExecArray | null;
    while ((match = openaiRegex.exec(text)) !== null) {
      findings.push({
        category: 'credential',
        type: 'openai_api_key',
        severity: 'CRITICAL',
        snippet: match[0].substring(0, 5) + '••••••••' + match[0].slice(-3),
        start: match.index,
        end: match.index + match[0].length,
        description: 'OpenAI API Secret Key',
        recommendation: 'Revoke this API key immediately.',
      });
    }

    // 3. AWS Key
    const awsRegex = /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g;
    while ((match = awsRegex.exec(text)) !== null) {
      findings.push({
        category: 'credential',
        type: 'aws_access_key',
        severity: 'CRITICAL',
        snippet: match[0].substring(0, 4) + '••••••••',
        start: match.index,
        end: match.index + match[0].length,
        description: 'AWS Access Key ID',
        recommendation: 'Rotate AWS IAM Credentials immediately.',
      });
    }

    // 4. GitHub Token
    const ghRegex = /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{30,255}\b/g;
    while ((match = ghRegex.exec(text)) !== null) {
      findings.push({
        category: 'credential',
        type: 'github_token',
        severity: 'CRITICAL',
        snippet: match[0].substring(0, 6) + '••••••••',
        start: match.index,
        end: match.index + match[0].length,
        description: 'GitHub Personal Access Token',
        recommendation: 'Revoke token on github.com.',
      });
    }

    // 5. Credit Card
    const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
    while ((match = ccRegex.exec(text)) !== null) {
      findings.push({
        category: 'pii',
        type: 'credit_card',
        severity: 'CRITICAL',
        snippet: '••••-••••-••••-' + match[0].slice(-4),
        start: match.index,
        end: match.index + match[0].length,
        description: 'Credit Card Number (PCI-DSS)',
        recommendation: 'Do not publish financial card numbers.',
      });
    }

    // 6. Social Security Number
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    while ((match = ssnRegex.exec(text)) !== null) {
      findings.push({
        category: 'pii',
        type: 'ssn',
        severity: 'CRITICAL',
        snippet: '•••-••-' + match[0].slice(-4),
        start: match.index,
        end: match.index + match[0].length,
        description: 'Social Security Number (SSN)',
        recommendation: 'Severe identity exposure risk.',
      });
    }

    // 7. Phone Number
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      const digits = match[0].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        findings.push({
          category: 'pii',
          type: 'phone_number',
          severity: 'MEDIUM',
          snippet: '•••-•••-' + match[0].slice(-4),
          start: match.index,
          end: match.index + match[0].length,
          description: 'Personal Telephone Number',
          recommendation: 'Consider redacting personal contact information.',
        });
      }
    }

    // 8. Confidential markers
    const confRegex = /\b(?:STRICTLY CONFIDENTIAL|INTERNAL USE ONLY|NOT FOR PUBLIC RELEASE|DO NOT DISTRIBUTE|PROPRIETARY)\b/gi;
    while ((match = confRegex.exec(text)) !== null) {
      findings.push({
        category: 'confidential',
        type: 'confidential_stamp',
        severity: 'HIGH',
        snippet: match[0],
        start: match.index,
        end: match.index + match[0].length,
        description: 'Confidentiality or NDA Marker',
        recommendation: 'Content is flagged as proprietary corporate material.',
      });
    }

    // Calculate score
    let score = 0;
    for (const f of findings) {
      if (f.severity === 'CRITICAL') score += 40;
      else if (f.severity === 'HIGH') score += 25;
      else if (f.severity === 'MEDIUM') score += 15;
      else score += 5;
    }
    score = Math.min(score, 100);

    const is_safe = score < 30 && !findings.some((f) => f.severity === 'CRITICAL');
    const redacted_preview = this.redactLocal(text);

    return {
      is_safe,
      risk_score: score,
      findings_count: findings.length,
      findings,
      redacted_preview,
    };
  }

  static redactLocal(text: string): string {
    let result = text;
    // OpenAI keys
    result = result.replace(/\bsk-(?:live-|proj-)?[A-Za-z0-9_-]{20,64}\b/g, '[REDACTED_API_KEY]');
    // AWS keys
    result = result.replace(/\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]');
    // GitHub tokens
    result = result.replace(/\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{30,255}\b/g, '[REDACTED_GITHUB_TOKEN]');
    // Credit Cards
    result = result.replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, '[REDACTED_CREDIT_CARD]');
    // SSN
    result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');
    // Phone
    result = result.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
    return result;
  }
}

