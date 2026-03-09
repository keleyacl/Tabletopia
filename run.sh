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
start_project() {
  local project_dir="$1"
  local project_path="$SCRIPT_DIR/$project_dir"

  if [ ! -d "$project_path" ]; then
    echo "  [WARN] Directory $project_dir not found, skipping."
    return 1
  fi

  cd "$project_path" || return 1

  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies for $project_dir..."
    npm install
  fi

  # Start in background, redirect output to log file
  nohup npm run dev > "$SCRIPT_DIR/$project_dir.log" 2>&1 &
  echo "  $project_dir started (PID: $!, log: $project_dir.log)"
}

# ============================================================
# --all mode: start all games + portal
# ============================================================
if [ "$1" = "--all" ]; then
  echo "==========================="
  echo "  Multy - Start All"
  echo "==========================="
  echo ""

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
  echo ""
  echo "  Use ./stop.sh --all to stop all projects."
  exit 0
fi

# ============================================================
# Interactive mode: choose a single game to run (foreground)
# ============================================================
echo "==========================="
echo "  Multy Game Launcher"
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

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Run dev server (starts both server and client concurrently)
npm run dev
