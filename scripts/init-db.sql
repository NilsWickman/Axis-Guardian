-- Axis Guardian Database Initialization
-- Creates basic schema for development

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS surveillance;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path
SET search_path TO surveillance, public;

-- Cameras table
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    rtsp_url TEXT NOT NULL,
    location VARCHAR(255),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detection events table
CREATE TABLE IF NOT EXISTS detection_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id VARCHAR(50) REFERENCES cameras(camera_id),
    timestamp TIMESTAMP NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    bbox JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_detection_events_camera_timestamp
    ON detection_events(camera_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_detection_events_class
    ON detection_events(class_name);
CREATE INDEX IF NOT EXISTS idx_detection_events_timestamp
    ON detection_events(timestamp DESC);

-- Insert sample cameras
INSERT INTO cameras (camera_id, name, rtsp_url, location, model) VALUES
    ('camera1', 'Auditorium HC3', 'rtsp://localhost:8554/camera1', 'Auditorium - High Corner 3', 'AXIS P3245-LVE'),
    ('camera2', 'Auditorium HC4', 'rtsp://localhost:8554/camera2', 'Auditorium - High Corner 4', 'AXIS P3245-LVE'),
    ('camera3', 'Auditorium IP2', 'rtsp://localhost:8554/camera3', 'Auditorium - IP Camera 2', 'AXIS P1455-LE'),
    ('camera4', 'Auditorium IP5', 'rtsp://localhost:8554/camera4', 'Auditorium - IP Camera 5', 'AXIS P1455-LE')
ON CONFLICT (camera_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA surveillance TO dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA surveillance TO dev;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Axis Guardian database initialized successfully';
END $$;
