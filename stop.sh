#!/bin/bash

# Ensure Homebrew binaries are in PATH
export PATH="/opt/homebrew/bin:$PATH"

echo "==========================="
echo "  Multy Game Stopper"
echo "==========================="
echo ""
echo "Which game would you like to stop?"
echo ""
echo "  1) splendor-duel"
echo "  2) azul"
echo "  3) all (stop both)"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

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

case $choice in
  1)
    stop_game "splendor-duel"
    ;;
  2)
    stop_game "azul"
    ;;
  3)
    stop_game "splendor-duel"
    stop_game "azul"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "Done."
