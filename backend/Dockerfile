# Use Python 3.10
FROM python:3.10-slim

# --- INSTALL FFMPEG (CRITICAL FOR LIBROSA) ---
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to cache dependencies
COPY requirements.txt .

# Install Python libraries
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app
COPY . .

# Start the server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
