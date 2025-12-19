# Use Python 3.9
FROM python:3.9

# 1. Install FFmpeg (Crucial for audio processing)
RUN apt-get update && apt-get install -y ffmpeg

# 2. Set working directory
WORKDIR /app

# 3. Copy files
COPY . .

# 4. Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Create songs directory with permissions
RUN mkdir -p songs && chmod 777 songs

# 6. Run the app
# HUGGING FACE REQUIRES PORT 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]