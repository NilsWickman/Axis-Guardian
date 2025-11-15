FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV, FFmpeg, and aiortc
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    libavfilter-dev \
    libopus-dev \
    libvpx-dev \
    pkg-config \
    ffmpeg \
    libsrtp2-dev \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Create shared models directory
RUN mkdir -p /app/shared/models

# Expose WebRTC signaling port
EXPOSE 8080

# Run the application
CMD ["python", "src/main.py"]
