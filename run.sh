#!/bin/bash

# Ensure Homebrew binaries are in PATH
export PATH="/opt/homebrew/bin:$PATH"

echo "==========================="
echo "  Multy Game Launcher"
echo "==========================="
echo ""
echo "Which game would you like to run?"
echo ""
echo "  1) splendor-duel"
echo "  2) azul"
echo ""1
read -p "Enter your choice (1 or 2): " choice

case $choice in
  1)
    GAME_DIR="splendor-duel"
    ;;
  2)
    GAME_DIR="azul"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "Starting $GAME_DIR..."
echo ""

cd "$(dirname "$0")/$GAME_DIR" || { echo "Directory $GAME_DIR not found!"; exit 1; }

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Run dev server (starts both server and client concurrently)
npm run dev
