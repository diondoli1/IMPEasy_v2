#!/bin/bash
# Start API and Web for sandbox desktop testing.
# Run from repo root: ./scripts/start-sandbox.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Ensuring database migrations ==="
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/impeasy}" npx prisma migrate deploy

echo "=== Starting API (port 3000) ==="
pkill -9 -f "nest start" 2>/dev/null || true
for pid in $(lsof -t -i :3000 2>/dev/null); do kill -9 "$pid" 2>/dev/null || true; done
sleep 3
npm run start:dev --workspace=@impeasy/api &
API_PID=$!

echo "=== Waiting for API to be ready ==="
for i in $(seq 1 15); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@impeasy.local","password":"Admin123!"}' 2>/dev/null | grep -q 200; then
    echo "API ready."
    break
  fi
  sleep 1
done

echo "=== Starting Web (port 3001) ==="
pkill -9 -f "next dev" 2>/dev/null || true
for pid in $(lsof -t -i :3001 2>/dev/null); do kill -9 "$pid" 2>/dev/null || true; done
sleep 3
npm run dev --workspace=@impeasy/web -- -p 3001 &
WEB_PID=$!

echo "=== Sandbox servers started ==="
echo "  API:  http://localhost:3000"
echo "  Web:  http://localhost:3001"
echo "  Login: admin@impeasy.local / Admin123!"
echo "  Kiosk: operator@impeasy.local / Operator123!"
echo ""
echo "Press Ctrl+C to stop both servers."

wait $API_PID 2>/dev/null || true
wait $WEB_PID 2>/dev/null || true
