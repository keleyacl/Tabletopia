#!/bin/bash

# Ensure Homebrew binaries are in PATH
export PATH="/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Auto-discover game directories (subdirectories containing package.json)
games=()
for dir in "$SCRIPT_DIR"/*/; do
  if [ -f "$dir/package.json" ]; then
    games+=("$(basename "$dir")")
  fi
done

if [ ${#games[@]} -eq 0 ]; then
  echo "No game projects found in $SCRIPT_DIR"
  exit 1
fi

stop_game() {
  local game_dir="$1"
  local pids

  echo ""
  echo "Stopping $game_dir..."

  # Kill tsx watch (server) processes
  pids=$(pgrep -f "$game_dir/packages/server" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing server processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  # Kill vite (client) processes
  pids=$(pgrep -f "$game_dir/packages/client" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing client processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  # Kill concurrently process
  pids=$(pgrep -f "concurrently.*$game_dir" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing concurrently processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  # Kill any npm processes related to this game
  pids=$(pgrep -f "npm.*--prefix.*$game_dir" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing npm processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  echo "  $game_dir stopped."
}

stop_portal() {
  echo ""
  echo "Stopping portal..."

  # Kill vite processes for portal
  local pids
  pids=$(pgrep -f "portal.*vite" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing portal vite processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  # Kill npm processes for portal
  pids=$(pgrep -f "npm.*portal" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing portal npm processes: $pids"
    echo "$pids" | xargs kill 2>/dev/null
  fi

  echo "  portal stopped."
}

# ============================================================
# --select mode: stop a specific game interactively
# ============================================================
if [ "$1" = "--select" ]; then
  echo "==========================="
  echo "  Tabletopia Game Stopper"
  echo "==========================="
  echo ""
  echo "Which game would you like to stop?"
  echo ""

  for i in "${!games[@]}"; do
    echo "  $((i + 1))) ${games[$i]}"
  done

  ALL_OPTION=$((${#games[@]} + 1))
  echo "  $ALL_OPTION) all (stop all games)"

  echo ""
  read -p "Enter your choice (1-$ALL_OPTION): " choice

  # Validate input
  if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "$ALL_OPTION" ]; then
    echo "Invalid choice. Exiting."
    exit 1
  fi

  if [ "$choice" -eq "$ALL_OPTION" ]; then
    for game in "${games[@]}"; do
      if [ "$game" = "portal" ]; then
        stop_portal
      else
        stop_game "$game"
      fi
    done
  else
    selected="${games[$((choice - 1))]}"
    if [ "$selected" = "portal" ]; then
      stop_portal
    else
      stop_game "$selected"
    fi
  fi

  echo ""
  echo "Done."
  exit 0
fi

# ============================================================
# Default mode: stop all games + portal
# ============================================================
echo "==========================="
echo "  Tabletopia - Stop All"
echo "==========================="

for game in "${games[@]}"; do
  if [ "$game" = "portal" ]; then
    stop_portal
  else
    stop_game "$game"
  fi
done

# Also kill any remaining processes on known ports
for port in 3000 3001 3002 3003 3004 3005 4000; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "  Killing process on port $port (PID: $pid)"
    echo "$pid" | xargs kill 2>/dev/null
  fi
done

echo ""
echo "All projects stopped."
