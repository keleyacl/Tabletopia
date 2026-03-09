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
