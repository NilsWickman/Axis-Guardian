FROM python:3.11-slim

# Install system dependencies for aiortc and av
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    python3-dev \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libavfilter-dev \
    libswscale-dev \
    libswresample-dev \
    libopus-dev \
    libvpx-dev \
    libsrtp2-dev \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Create mount point for camera data
VOLUME ["/shared"]

# Expose ports for camera emulators
# 9101: Camera HC3
# 9102: Camera HC4
EXPOSE 9101 9102

# Environment variables
ENV CAMERA_DATA_PATH=/shared/cameras/preprocessed/1080p
ENV PYTHONUNBUFFERED=1

CMD ["python", "src/main.py"]
