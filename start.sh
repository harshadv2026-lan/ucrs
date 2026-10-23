#!/bin/bash
# UCRS Quick Start Script
# Usage: chmod +x start.sh && ./start.sh

set -e

echo "=========================================="
echo "  UCRS - University Course Registration"
echo "  System Quick Start"
echo "=========================================="

JAVA17=/opt/homebrew/opt/openjdk@17/bin/java
MVN=/opt/homebrew/bin/mvn
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check Java 17
if [ -f "$JAVA17" ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17
  echo "✓ Using Java 17 from Homebrew"
elif java -version 2>&1 | grep -q "version \"17"; then
  echo "✓ Using system Java 17"
else
  echo "⚠ WARNING: Java 17 recommended. Current Java may cause Lombok issues."
  echo "  Install with: brew install openjdk@17"
fi

# Start backend
echo ""
echo "▶ Starting Spring Boot backend (port 8080, demo mode)..."
cd "$PROJECT_ROOT/backend"
if [ -f "target/ucrs-backend-1.0.0.jar" ]; then
  JAVA_HOME=/opt/homebrew/opt/openjdk@17 java -jar target/ucrs-backend-1.0.0.jar &
  BACKEND_PID=$!
  echo "  Backend PID: $BACKEND_PID"
else
  JAVA_HOME=/opt/homebrew/opt/openjdk@17 $MVN spring-boot:run &
  BACKEND_PID=$!
  echo "  Starting via Maven... PID: $BACKEND_PID"
fi

# Wait for backend to start
echo "  Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8080/api/departments > /dev/null 2>&1; then
    echo "  ✓ Backend is ready!"
    break
  fi
  sleep 2
  echo -n "."
done

# Start frontend
echo ""
echo "▶ Starting React frontend (port 5173)..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  UCRS is running!"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8080"
echo "  Swagger:   http://localhost:8080/swagger-ui/index.html"
echo "  H2 Console:http://localhost:8080/h2-console"
echo ""
echo "  Demo credentials:"
echo "    Student:  2021CS001 / student123"
echo "    Faculty:  alice.johnson@ucrs.edu / faculty123"
echo "    Admin:    admin / admin123"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "=========================================="

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
