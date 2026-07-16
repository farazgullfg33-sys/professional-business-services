#!/bin/bash
# Deploy updated bridge.py to VPS
# Run by VPS Hermes after git pull

BRIDGE_DEST="${BRIDGE_DEST:-/opt/pro-bridge}"
CONTAINER="${BRIDGE_CONTAINER:-pro-bridge}"

set -e

echo "[deploy] Copying bridge.py to $BRIDGE_DEST"
mkdir -p "$BRIDGE_DEST"
cp hermes-bridge/bridge.py "$BRIDGE_DEST/bridge.py"

echo "[deploy] Restarting container $CONTAINER"
docker restart "$CONTAINER" 2>/dev/null || echo "[deploy] Container not found — start it manually"

echo "[deploy] Done"
