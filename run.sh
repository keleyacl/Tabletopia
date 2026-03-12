#!/bin/bash

# Ensure Homebrew binaries are in PATH
export PATH="/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Auto-discover game directories (subdirectories containing package.json, excluding portal)
games=()
for dir in "$SCRIPT_DIR"/*/; do
  dirname="$(basename "$dir")"
  if [ -f "$dir/package.json" ] && [ "$dirname" != "portal" ]; then
    games+=("$dirname")
  fi
done

if [ ${#games[@]} -eq 0 ]; then
  echo "No game projects found in $SCRIPT_DIR"
  exit 1
fi

# ============================================================
# Start a single project in background
# ============================================================
ensure_dependencies() {
  local project_dir="$1"
  local install_reason=""
  local install_stamp="node_modules/.package-lock.json"

  if [ ! -d "node_modules" ]; then
    install_reason="node_modules is missing"
  elif [ ! -d "node_modules/.bin" ]; then
    install_reason="node_modules/.bin is missing"
  elif [ -f "package-lock.json" ] && [ ! -f "$install_stamp" ]; then
    install_reason="dependency metadata is missing"
  elif [ -f "package-lock.json" ] && [ "package-lock.json" -nt "$install_stamp" ]; then
    install_reason="package-lock.json changed"
  elif [ -f "package.json" ] && [ "package.json" -nt "$install_stamp" ]; then
    install_reason="package.json changed"
  fi

  if [ -n "$install_reason" ]; then
    echo "  Installing dependencies for $project_dir ($install_reason)..."
    if ! npm install --include=dev; then
      echo "  [ERROR] npm install failed for $project_dir."
      return 1
    fi
  fi

  return 0
}

start_project() {
  local project_dir="$1"
  local project_path="$SCRIPT_DIR/$project_dir"
  local pid

  if [ ! -d "$project_path" ]; then
    echo "  [WARN] Directory $project_dir not found, skipping."
    return 1
  fi

  cd "$project_path" || return 1

  if ! ensure_dependencies "$project_dir"; then
    echo "  [ERROR] Skipping $project_dir because dependencies are not ready."
    return 1
  fi

  # Start in background, redirect output to log file
  nohup npm run dev > "$SCRIPT_DIR/$project_dir.log" 2>&1 &
  pid=$!
  sleep 2

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "  [ERROR] $project_dir failed to stay running. Check $project_dir.log."
    return 1
  fi

  echo "  $project_dir started (PID: $pid, log: $project_dir.log)"
}

# ============================================================
# --select mode: choose a single game to run (foreground)
# ============================================================
if [ "$1" = "--select" ]; then
  echo "==========================="
  echo "  Tabletopia Game Launcher"
  echo "==========================="
  echo ""
  echo "Which game would you like to run?"
  echo ""

  for i in "${!games[@]}"; do
    echo "  $((i + 1))) ${games[$i]}"
  done

  echo ""
  read -p "Enter your choice (1-${#games[@]}): " choice

  # Validate input
  if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#games[@]} ]; then
    echo "Invalid choice. Exiting."
    exit 1
  fi

  GAME_DIR="${games[$((choice - 1))]}"

  echo ""
  echo "Starting $GAME_DIR..."
  echo ""

  cd "$SCRIPT_DIR/$GAME_DIR" || { echo "Directory $GAME_DIR not found!"; exit 1; }

  if ! ensure_dependencies "$GAME_DIR"; then
    exit 1
  fi

  # Run dev server (starts both server and client concurrently)
  npm run dev
  exit 0
fi

# ============================================================
# Default mode: start all games + portal
# ============================================================
echo "==========================="
echo "  Tabletopia - Start All"
echo "==========================="
echo ""

# Clean up any residual processes to avoid port conflicts
if [ -f "$SCRIPT_DIR/stop.sh" ]; then
  echo "Cleaning up residual processes..."
  bash "$SCRIPT_DIR/stop.sh" 2>/dev/null
  echo ""
fi

# Start all game projects
for game in "${games[@]}"; do
  echo "Starting $game..."
  start_project "$game"
  echo ""
done

# Start portal
echo "Starting portal..."
start_project "portal"
echo ""

echo "==========================="
echo "  All projects started!"
echo "==========================="
echo ""
echo "  Portal (首页):        http://localhost:4000"
echo "  Azul:                 http://localhost:3000"
echo "  Splendor Duel:        http://localhost:3002"
echo "  Lost Cities:          http://localhost:3004"
echo "  Jaipur:               http://localhost:3006"
echo ""
echo "  Use ./stop.sh to stop all projects."
