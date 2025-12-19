#!/bin/bash

# 1. Update and install FFmpeg (Crucial for audio engine)
apt-get update && apt-get install -y ffmpeg

# 2. Start the server
# We use port 8000. Azure listens to this inside the container.
python -m uvicorn server:app --host 0.0.0.0 --port 8000