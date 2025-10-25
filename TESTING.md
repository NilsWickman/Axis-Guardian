# Testing Guide

This document describes the testing infrastructure for the Axis Guardian surveillance system.

## Overview

The project includes comprehensive unit tests for both detection services:
- **Object Detection Service** (`simulation/object-detection/`)
- **WebRTC Detection Service** (`simulation/webrtc-detection/`)

## Test Structure

```
simulation/
├── object-detection/
│   └── tests/
│       ├── conftest.py           # Shared fixtures
│       ├── fixtures/              # Test utilities
│       │   └── mock_frames.py     # Frame generation helpers
│       └── unit/                  # Unit tests
│           ├── test_config.py
│           ├── test_detector.py
│           └── test_sync_adjuster.py
└── webrtc-detection/
    └── tests/
        ├── conftest.py
        ├── fixtures/
        │   └── mock_frames.py
        └── unit/
            ├── test_config.py
            └── test_detector.py
```

## Running Tests

### Prerequisites

Install test dependencies in each service's virtual environment:

```bash
# Object Detection Service
cd simulation/object-detection
source venv/bin/activate
pip install -r requirements.txt  # Includes pytest and dependencies

# WebRTC Detection Service
cd simulation/webrtc-detection
source venv/bin/activate
pip install -r requirements.txt
```

### Quick Start

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific service tests
make test-object-detection
make test-webrtc

# Run only unit tests
make test-unit
```

### Direct pytest Commands

From project root:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest simulation/object-detection/tests/unit/test_detector.py

# Run specific test
pytest simulation/object-detection/tests/unit/test_detector.py::TestObjectDetector::test_initialization

# Run with coverage
pytest --cov --cov-report=html --cov-report=term

# Run tests matching a keyword
pytest -k "sync_adjuster"

# Run tests with specific marker
pytest -m unit
```

### Test Markers

Tests are marked with the following markers:

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.uses_model` - Tests that load YOLO model (may be slow)
- `@pytest.mark.slow` - Slow-running tests

Example: Run only fast unit tests (skip slow model loading):

```bash
pytest -m unit -m "not uses_model"
```

## Test Coverage

Coverage reports are generated in `htmlcov/index.html`:

```bash
make test-cov
# Open htmlcov/index.html in browser
```

Target coverage:
- **Overall**: 60%+
- **Critical paths** (sync_adjuster, detector): 80%+

## Writing Tests

### Test Fixtures

Common fixtures are available in `conftest.py`:

```python
# Mock frames
def test_detection(mock_frame):
    # mock_frame: 640x480 random RGB frame
    detections = detector.detect(mock_frame)

# Mock YOLO results
def test_yolo_results(mock_yolo_results):
    # Factory for creating mock detection results
    results = mock_yolo_results(num_detections=2, confidence=0.85)
```

### Frame Utilities

Use `fixtures/mock_frames.py` for generating test frames:

```python
from tests.fixtures.mock_frames import (
    create_random_frame,
    create_solid_color_frame,
    create_corrupted_frame
)

# Create specific test frames
frame = create_solid_color_frame((255, 0, 0), width=640, height=480)
corrupted = create_corrupted_frame("black")
```

### Example Test

```python
import pytest
from unittest.mock import Mock, patch

@pytest.mark.unit
class TestDetector:
    @patch('detector.YOLO')
    @patch('detector.settings')
    def test_detect(self, mock_settings, mock_yolo, mock_frame):
        """Test detection with mocked YOLO."""
        mock_settings.confidence_threshold = 0.5
        detector = ObjectDetector()
        detections = detector.detect(mock_frame)
        assert isinstance(detections, list)
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    make test

- name: Check coverage
  run: |
    pytest --cov --cov-fail-under=60
```

## Troubleshooting

### Import Errors

If you see import errors, ensure the virtual environment is activated:

```bash
cd simulation/object-detection
source venv/bin/activate
pytest
```

### YOLO Model Missing

Tests use `shared/models/yolov8n.pt`. If missing:

```bash
# Model should be in project root
ls -la shared/models/yolov8n.pt
```

Most tests mock YOLO, so model isn't required for basic testing.

### Slow Tests

Skip slow tests during development:

```bash
pytest -m "not slow"
```

## Test Philosophy

1. **Unit tests** - Fast, isolated, mock external dependencies
2. **Integration tests** - Test component interactions (future)
3. **Test critical paths** - Prioritize sync_adjuster, detector, config

## Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/) - For async tests
- [pytest-cov](https://pytest-cov.readthedocs.io/) - Coverage reporting
