"""ONVIF Events Service with preprocessed detection metadata."""

import time
import uuid
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional

from loguru import logger

from ..camera_config import CameraConfig
from ..config import settings
from ..preprocessed import DetectionMetadata, PlaybackSynchronizer


class PreprocessedEventGenerator:
    """Event generator using preprocessed detection metadata."""

    def __init__(
        self,
        camera_id: str,
        event_queue: Deque,
        video_path: Path,
        metadata_path: Path
    ):
        """Initialize preprocessed event generator.

        Args:
            camera_id: Camera identifier
            event_queue: Queue to push generated events
            video_path: Path to preprocessed video file
            metadata_path: Path to .detections.json file
        """
        self.camera_id = camera_id
        self.event_queue = event_queue

        # Initialize playback synchronizer
        self.synchronizer = PlaybackSynchronizer(
            video_path=video_path,
            metadata_path=metadata_path,
            fps=30.0,  # TODO: Get from config
            loop=True
        )

        # Track previous state for change detection
        self.previous_has_motion = False
        self.previous_objects: set = set()

        # Subscribe to frame updates
        self.synchronizer.subscribe_frame(self._on_frame_update)

        logger.info(
            f"Preprocessed event generator initialized for {camera_id}: "
            f"{self.synchronizer.metadata_loader.total_frames} frames, "
            f"{self.synchronizer.metadata_loader.total_detections} detections"
        )

    def start(self):
        """Start event generation from preprocessed data."""
        stats = self.synchronizer.metadata_loader.get_statistics()
        logger.info(
            f"Starting preprocessed playback for {self.camera_id}: "
            f"{stats['total_detections']} detections in {stats['duration']:.1f}s"
        )
        self.synchronizer.start()

    def stop(self):
        """Stop event generation."""
        self.synchronizer.stop()
        logger.info(f"Preprocessed event generator stopped for {self.camera_id}")

    def _on_frame_update(self, frame_number: int, metadata: DetectionMetadata):
        """Called by synchronizer for each frame.

        Args:
            frame_number: Current frame number
            metadata: Detection metadata for this frame
        """
        try:
            # Generate motion event if state changed
            has_motion = metadata.has_detections
            if has_motion != self.previous_has_motion:
                self._generate_motion_event(has_motion)
                self.previous_has_motion = has_motion

            # Generate object detection events for new objects
            if metadata.has_detections:
                current_objects = set()

                for detection in metadata.detections:
                    obj_class = detection.get('class', 'unknown')
                    track_id = detection.get('track_id')

                    # Create unique identifier for this object
                    obj_id = f"{obj_class}_{track_id}" if track_id else f"{obj_class}_{id(detection)}"
                    current_objects.add(obj_id)

                    # Generate event for new objects
                    if obj_id not in self.previous_objects:
                        self._generate_object_event(detection)

                self.previous_objects = current_objects
            else:
                self.previous_objects.clear()

        except Exception as e:
            logger.error(f"Error processing frame {frame_number}: {e}")

    def _generate_motion_event(self, is_motion: bool):
        """Generate a motion detection event.

        Args:
            is_motion: True if motion detected, False otherwise
        """
        event = {
            "Topic": {
                "_value_1": "tns1:VideoSource/MotionAlarm",
                "Dialect": "http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet",
            },
            "Message": {
                "PropertyOperation": "Changed",
                "Source": {
                    "SimpleItem": [
                        {
                            "Name": "VideoSourceConfigurationToken",
                            "Value": "video_source_config_1",
                        },
                        {
                            "Name": "VideoAnalyticsConfigurationToken",
                            "Value": "analytics_config_1",
                        },
                    ]
                },
                "Data": {
                    "SimpleItem": [
                        {
                            "Name": "State",
                            "Value": str(is_motion).lower(),
                        }
                    ]
                },
            },
        }

        self.event_queue.append(event)
        logger.debug(f"Generated motion event: motion={is_motion}")

    def _generate_object_event(self, detection: Dict[str, Any]):
        """Generate an object detection event from real detection.

        Args:
            detection: Detection dictionary from metadata
        """
        obj_class = detection.get('class', 'unknown')
        confidence = detection.get('confidence', 0.0)
        track_id = detection.get('track_id', str(uuid.uuid4()))

        event = {
            "Topic": {
                "_value_1": "tns1:RuleEngine/ObjectsInside/Detected",
                "Dialect": "http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet",
            },
            "Message": {
                "PropertyOperation": "Changed",
                "Source": {
                    "SimpleItem": [
                        {
                            "Name": "VideoSourceConfigurationToken",
                            "Value": "video_source_config_1",
                        },
                        {
                            "Name": "VideoAnalyticsConfigurationToken",
                            "Value": "analytics_config_1",
                        },
                        {
                            "Name": "Rule",
                            "Value": "ObjectDetectionRule",
                        },
                    ]
                },
                "Data": {
                    "SimpleItem": [
                        {
                            "Name": "ObjectId",
                            "Value": str(track_id),
                        },
                        {
                            "Name": "ObjectType",
                            "Value": obj_class,
                        },
                        {
                            "Name": "Confidence",
                            "Value": f"{confidence:.2f}",
                        },
                    ]
                },
            },
        }

        self.event_queue.append(event)
        logger.debug(f"Generated object event: {obj_class} (confidence={confidence:.2f})")


class PullPointSubscription:
    """ONVIF PullPoint subscription for event delivery."""

    def __init__(
        self,
        subscription_id: str,
        event_queue: Deque,
        initial_termination_time: str,
    ):
        """Initialize pull point subscription.

        Args:
            subscription_id: Unique subscription ID
            event_queue: Event queue to pull from
            initial_termination_time: Initial subscription timeout
        """
        self.subscription_id = subscription_id
        self.event_queue = event_queue
        self.termination_time = initial_termination_time
        self.created_at = time.time()

    def is_expired(self) -> bool:
        """Check if subscription has expired.

        Returns:
            True if subscription is expired
        """
        # For simplicity, never expire (PT0S means infinite)
        if self.termination_time == "PT0S":
            return False

        # Parse ISO 8601 duration (simplified - only handles PT format)
        try:
            if self.termination_time.startswith("PT") and self.termination_time.endswith("S"):
                seconds = int(self.termination_time[2:-1])
                elapsed = time.time() - self.created_at
                return elapsed > seconds
        except Exception:
            pass

        return False

    def pull_messages(
        self, timeout: str, message_limit: int
    ) -> List[Dict[str, Any]]:
        """Pull messages from event queue.

        Args:
            timeout: Pull timeout (ISO 8601 duration)
            message_limit: Maximum number of messages to return

        Returns:
            List of notification messages
        """
        messages = []

        # Pull available messages up to limit
        while len(messages) < message_limit and len(self.event_queue) > 0:
            event = self.event_queue.popleft()

            # Wrap event in NotificationMessage structure
            notification = {
                "Topic": event["Topic"],
                "Message": {
                    "_value_1": event["Message"],
                    "UtcTime": datetime.now(timezone.utc).isoformat(),
                    "PropertyOperation": event["Message"]["PropertyOperation"],
                    "Source": event["Message"]["Source"],
                    "Data": event["Message"]["Data"],
                },
            }
            messages.append(notification)

        return messages


class EventsServicePreprocessed:
    """ONVIF Events Service using preprocessed detection data."""

    def __init__(self, camera_config: CameraConfig, video_path: Path, metadata_path: Path):
        """Initialize events service with preprocessed data.

        Args:
            camera_config: Camera configuration instance
            video_path: Path to preprocessed video file
            metadata_path: Path to .detections.json file
        """
        self.camera_config = camera_config

        # Event queue (shared with generator)
        self.event_queue: Deque = deque(maxlen=100)  # Keep last 100 events

        # Active subscriptions
        self.subscriptions: Dict[str, PullPointSubscription] = {}

        # Event generator with preprocessed data
        self.event_generator = PreprocessedEventGenerator(
            camera_config.camera_id,
            self.event_queue,
            video_path,
            metadata_path
        )
        self.event_generator.start()

    def shutdown(self):
        """Shutdown events service."""
        self.event_generator.stop()
        logger.info(f"Events service shutdown for {self.camera_config.camera_id}")

    def get_event_properties(self) -> Dict[str, Any]:
        """Get event properties (supported topics).

        Returns:
            Event properties response
        """
        logger.debug("GetEventProperties request")

        return {
            "TopicNamespaceLocation": [
                "http://www.onvif.org/onvif/ver10/topics/topicns.xml"
            ],
            "FixedTopicSet": True,
            "TopicSet": {
                "tns1:VideoSource": {
                    "MotionAlarm": {
                        "MessageDescription": {
                            "IsProperty": True,
                            "Source": {
                                "SimpleItemDescription": [
                                    {
                                        "Name": "VideoSourceConfigurationToken",
                                        "Type": "tt:ReferenceToken",
                                    },
                                    {
                                        "Name": "VideoAnalyticsConfigurationToken",
                                        "Type": "tt:ReferenceToken",
                                    },
                                ]
                            },
                            "Data": {
                                "SimpleItemDescription": [
                                    {
                                        "Name": "State",
                                        "Type": "xs:boolean",
                                    }
                                ]
                            },
                        }
                    }
                },
                "tns1:RuleEngine": {
                    "ObjectsInside": {
                        "Detected": {
                            "MessageDescription": {
                                "IsProperty": False,
                                "Source": {
                                    "SimpleItemDescription": [
                                        {
                                            "Name": "VideoSourceConfigurationToken",
                                            "Type": "tt:ReferenceToken",
                                        },
                                        {
                                            "Name": "VideoAnalyticsConfigurationToken",
                                            "Type": "tt:ReferenceToken",
                                        },
                                        {
                                            "Name": "Rule",
                                            "Type": "xs:string",
                                        },
                                    ]
                                },
                                "Data": {
                                    "SimpleItemDescription": [
                                        {
                                            "Name": "ObjectId",
                                            "Type": "xs:string",
                                        },
                                        {
                                            "Name": "ObjectType",
                                            "Type": "xs:string",
                                        },
                                        {
                                            "Name": "Confidence",
                                            "Type": "xs:float",
                                        },
                                    ]
                                },
                            }
                        }
                    }
                },
            },
            "TopicExpressionDialect": [
                "http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet",
                "http://docs.oasis-open.org/wsn/t-1/TopicExpression/Concrete",
            ],
            "MessageContentFilterDialect": [
                "http://www.onvif.org/ver10/tev/messageContentFilter/ItemFilter"
            ],
            "ProducerPropertiesFilterDialect": [],
            "MessageContentSchemaLocation": [
                "http://www.onvif.org/onvif/ver10/schema/onvif.xsd"
            ],
        }

    def create_pullpoint_subscription(
        self,
        filter: Optional[Dict[str, Any]] = None,
        initial_termination_time: str = "PT0S",
    ) -> Dict[str, Any]:
        """Create a PullPoint subscription.

        Args:
            filter: Event filter (optional)
            initial_termination_time: Initial timeout (ISO 8601 duration)

        Returns:
            Subscription response with subscription reference
        """
        logger.debug(
            f"CreatePullPointSubscription: timeout={initial_termination_time}"
        )

        # Generate subscription ID
        subscription_id = str(uuid.uuid4())

        # Create subscription
        subscription = PullPointSubscription(
            subscription_id, self.event_queue, initial_termination_time
        )
        self.subscriptions[subscription_id] = subscription

        # Subscription reference URL
        subscription_ref = (
            f"http://{self.camera_config.camera_id}:80/"
            f"onvif/events_service/subscription/{subscription_id}"
        )

        logger.info(f"Created PullPoint subscription: {subscription_id}")

        return {
            "SubscriptionReference": {
                "Address": subscription_ref,
            },
            "CurrentTime": datetime.now(timezone.utc).isoformat(),
            "TerminationTime": initial_termination_time,
        }

    def pull_messages(
        self,
        subscription_id: str,
        timeout: str = "PT10S",
        message_limit: int = 10,
    ) -> Dict[str, Any]:
        """Pull messages from a subscription.

        Args:
            subscription_id: Subscription ID
            timeout: Pull timeout (ISO 8601 duration)
            message_limit: Maximum messages to return

        Returns:
            Notification messages response
        """
        logger.debug(
            f"PullMessages: subscription={subscription_id}, timeout={timeout}, limit={message_limit}"
        )

        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription not found: {subscription_id}")

        if subscription.is_expired():
            del self.subscriptions[subscription_id]
            raise ValueError(f"Subscription expired: {subscription_id}")

        # Pull messages
        messages = subscription.pull_messages(timeout, message_limit)

        current_time = datetime.now(timezone.utc).isoformat()

        return {
            "CurrentTime": current_time,
            "TerminationTime": subscription.termination_time,
            "NotificationMessage": messages,
        }

    def unsubscribe(self, subscription_id: str) -> Dict[str, Any]:
        """Unsubscribe from a PullPoint subscription.

        Args:
            subscription_id: Subscription ID

        Returns:
            Unsubscribe response
        """
        logger.debug(f"Unsubscribe: subscription={subscription_id}")

        if subscription_id in self.subscriptions:
            del self.subscriptions[subscription_id]
            logger.info(f"Unsubscribed: {subscription_id}")

        return {}

    def renew(
        self, subscription_id: str, termination_time: str
    ) -> Dict[str, Any]:
        """Renew a subscription.

        Args:
            subscription_id: Subscription ID
            termination_time: New termination time

        Returns:
            Renew response
        """
        logger.debug(
            f"Renew: subscription={subscription_id}, termination_time={termination_time}"
        )

        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            raise ValueError(f"Subscription not found: {subscription_id}")

        subscription.termination_time = termination_time
        subscription.created_at = time.time()  # Reset timer

        return {
            "CurrentTime": datetime.now(timezone.utc).isoformat(),
            "TerminationTime": termination_time,
        }
