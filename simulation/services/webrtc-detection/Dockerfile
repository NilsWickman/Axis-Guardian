FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY .env.example .env

# Download default YOLOv8 model
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Expose signaling server port
EXPOSE 8080

# Run the service
CMD ["python", "src/main.py"]
