#!/bin/bash
# Lightpanda Setup Script
# Run once to install Lightpanda browser

set -e

INSTALL_DIR="${LIGHTPANDA_DIR:-$HOME/.local/bin}"
BINARY_NAME="lightpanda"

echo "=== Lightpanda Setup ==="
echo "Install directory: $INSTALL_DIR"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux)
        case "$ARCH" in
            x86_64)
                DOWNLOAD_URL="https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux"
                ;;
            aarch64|arm64)
                DOWNLOAD_URL="https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-aarch64-linux"
                ;;
            *)
                echo "ERROR: Unsupported architecture: $ARCH"
                exit 1
                ;;
        esac
        ;;
    Darwin)
        case "$ARCH" in
            x86_64)
                DOWNLOAD_URL="https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-macos"
                ;;
            arm64|aarch64)
                DOWNLOAD_URL="https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-aarch64-macos"
                ;;
            *)
                echo "ERROR: Unsupported architecture: $ARCH"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "ERROR: Unsupported OS: $OS"
        echo "For Windows, use WSL2 with Ubuntu and run the Linux version."
        exit 1
        ;;
esac

echo "Detected: $OS $ARCH"
echo "Download URL: $DOWNLOAD_URL"

# Check for curl
if ! command -v curl &> /dev/null; then
    echo "ERROR: curl not found. Please install curl."
    exit 1
fi

# Create install directory
mkdir -p "$INSTALL_DIR"

# Download binary
echo "Downloading Lightpanda..."
curl -L -o "$INSTALL_DIR/$BINARY_NAME" "$DOWNLOAD_URL"
chmod a+x "$INSTALL_DIR/$BINARY_NAME"

# Check if install directory is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "WARNING: $INSTALL_DIR is not in your PATH"
    echo "Add this to your shell profile (~/.bashrc or ~/.zshrc):"
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
fi

# Test installation
echo ""
echo "Testing Lightpanda..."
if "$INSTALL_DIR/$BINARY_NAME" --version 2>/dev/null || "$INSTALL_DIR/$BINARY_NAME" --help 2>/dev/null | head -1; then
    echo "Lightpanda installed successfully!"
else
    echo "Binary installed at: $INSTALL_DIR/$BINARY_NAME"
fi

echo ""
echo "=== Setup Complete ==="
echo "Binary location: $INSTALL_DIR/$BINARY_NAME"
echo "Run with: lightpanda serve --host 127.0.0.1 --port 9222"
