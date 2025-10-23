"""WebRTC Detection Service - Main entry point."""

import sys
from loguru import logger

from config import settings
from signaling import WebRTCSignalingServer


def setup_logging():
    """Configure logging."""
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )


def main():
    """Main entry point."""
    setup_logging()

    logger.info("=" * 60)
    logger.info("WebRTC Detection Service")
    logger.info("=" * 60)
    logger.info(f"Model: {settings.model_path}")
    logger.info(f"Confidence threshold: {settings.confidence_threshold}")
    logger.info(f"Server: {settings.host}:{settings.port}")
    logger.info("=" * 60)

    # Create and run signaling server
    server = WebRTCSignalingServer()
    server.run()


if __name__ == "__main__":
    main()
