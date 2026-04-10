#!/bin/bash
# Move to the project root
cd /home/vllm/comfy

# Kill any existing processes on port 8189
fuser -k 8189/tcp || true
pkill -9 -f "main.py --port 8189" || true

# Environment variables for GPU 2 pinning
export CUDA_VISIBLE_DEVICES=2
export PYTHONIOENCODING=utf-8

echo "Starting ComfyUI on GPU 2, Port 8189..."
# Run with absolute path to venv python
nohup ./venv/bin/python3.11 main.py --port 8189 --listen 0.0.0.0 --normalvram > comfy_final.log 2>&1 &

# Give it a few seconds to start
sleep 5
ps -ef | grep "main.py --port 8189" | grep -v grep
echo "Check /home/vllm/comfy/comfy_final.log for details."
