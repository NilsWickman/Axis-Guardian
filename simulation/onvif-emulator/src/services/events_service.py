"""ONVIF Events Service implementation."""

import random
import threading
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional

from loguru import logger

from ..camera_config import CameraConfig
from ..config import settings


class EventGenerator:
    """Background event generator for simulating camera events."""

    def __init__(self, camera_id: str, event_queue: Deque):
        """Initialize event generator.

        Args:
            camera_id: Camera identifier
            event_queue: Queue to push generated events
        """
        self.camera_id = camera_id
        self.event_queue = event_queue
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        """Start event generation thread."""
        if self.running:
            return

        self.running = True
        self.thread = threading.Thread(target=self._generate_events, daemon=True)
        self.thread.start()
        logger.info(f"Event generator started for {self.camera_id}")

    def stop(self):
        """Stop event generation thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        logger.info(f"Event generator stopped for {self.camera_id}")

    def _generate_events(self):
        """Background thread for generating random events."""
        last_motion_time = time.time()
        last_object_time = time.time()

        while self.running:
            try:
                current_time = time.time()

                # Generate motion detection events
                motion_interval = settings.onvif_event_motion_interval
                if current_time - last_motion_time >= motion_interval + random.uniform(-10, 10):
                    self._generate_motion_event()
                    last_motion_time = current_time

                # Generate object detection events
                object_interval = settings.onvif_event_object_interval
                if current_time - last_object_time >= object_interval + random.uniform(-30, 30):
                    self._generate_object_event()
                    last_object_time = current_time

                time.sleep(1.0)  # Check every second

            except Exception as e:
                logger.error(f"Error generating events: {e}")
                time.sleep(5.0)

    def _generate_motion_event(self):
        """Generate a motion detection event."""
        is_motion = random.choice([True, False])

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

    def _generate_object_event(self):
        """Generate an object detection event."""
        object_types = ["person", "vehicle", "animal"]
        detected_object = random.choice(object_types)

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
                            "Value": "MyObjectDetectionRule",
                        },
                    ]
                },
                "Data": {
                    "SimpleItem": [
                        {
                            "Name": "ObjectId",
                            "Value": str(uuid.uuid4()),
                        },
                        {
                            "Name": "ObjectType",
                            "Value": detected_object,
                        },
                    ]
                },
            },
        }

        self.event_queue.append(event)
        logger.debug(f"Generated object detection event: {detected_object}")


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
        # Example: PT60S = 60 seconds
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


class EventsService:
    """ONVIF Events Service (Profile S with PullPoint)."""

    def __init__(self, camera_config: CameraConfig):
        """Initialize events service.

        Args:
            camera_config: Camera configuration instance
        """
        self.camera_config = camera_config

        # Event queue (shared with generator)
        self.event_queue: Deque = deque(maxlen=100)  # Keep last 100 events

        # Active subscriptions
        self.subscriptions: Dict[str, PullPointSubscription] = {}

        # Event generator
        self.event_generator = EventGenerator(camera_config.camera_id, self.event_queue)
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
