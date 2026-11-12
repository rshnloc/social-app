#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Stopping NexusAI services..."
    if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
    wait 2>/dev/null || true
    echo "NexusAI services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "=========================================================="
echo "⚡ NexusAI — Autonomous Next-Gen AI Social Network"
echo "=========================================================="
echo "• Backend: Python 3.10 / FastAPI / Async SQLite / WebSockets"
echo "• Frontend: React 18 / TypeScript / Vite / Tailwind CSS"
echo "• Security: Guardian Shield Active (Zero Credentials/PII Leakage)"
echo "• Mode: Native Host (No Docker Needed)"
echo "=========================================================="

# Start Backend
./run_backend.sh &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend API to initialize..."
until curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; do
    sleep 0.5
done
echo "✅ Backend API online at http://127.0.0.1:8000"

# Start Frontend
./run_frontend.sh &
FRONTEND_PID=$!

echo "=========================================================="
echo "🚀 Application is running!"
echo "👉 Open Frontend: http://localhost:5173"
echo "👉 API Swagger Docs: http://127.0.0.1:8000/docs"
echo "👉 Demo User: username 'alex' / password 'password123'"
echo "Press Ctrl+C to terminate all services."
echo "=========================================================="

wait

