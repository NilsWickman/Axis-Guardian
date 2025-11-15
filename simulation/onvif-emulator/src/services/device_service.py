"""ONVIF Device Management Service implementation."""

from datetime import datetime, timezone
from typing import Dict, Any
import socket

from loguru import logger

from ..camera_config import CameraConfig
from ..config import settings


class DeviceManagementService:
    """ONVIF Device Management Service (Profile S)."""

    def __init__(self, camera_config: CameraConfig):
        """Initialize device management service.

        Args:
            camera_config: Camera configuration instance
        """
        self.camera_config = camera_config
        self.device_base_url = f"http://{self._get_service_ip()}:{settings.onvif_port}"

    def _get_service_ip(self) -> str:
        """Get service IP address for external clients.

        Returns container IP if running in Docker, otherwise localhost.
        """
        try:
            # Try to get container IP from hostname
            hostname = socket.gethostname()
            ip = socket.gethostbyname(hostname)
            if ip.startswith("172.") or ip.startswith("192.168."):
                return ip
        except Exception:
            pass
        return "localhost"

    def get_device_information(self) -> Dict[str, Any]:
        """Get device information.

        Returns:
            Device information response
        """
        logger.debug(f"GetDeviceInformation request for {self.camera_config.camera_id}")

        return {
            "Manufacturer": self.camera_config.brand,
            "Model": self.camera_config.model,
            "FirmwareVersion": self.camera_config.firmware_version,
            "SerialNumber": self.camera_config.serial_number,
            "HardwareId": self.camera_config.hardware_id,
        }

    def get_system_date_and_time(self) -> Dict[str, Any]:
        """Get system date and time.

        Returns:
            System date and time response
        """
        logger.debug("GetSystemDateAndTime request")

        now = datetime.now(timezone.utc)

        return {
            "DateTimeType": "NTP",
            "DaylightSavings": False,
            "TimeZone": {
                "TZ": "UTC+00:00",
            },
            "UTCDateTime": {
                "Time": {
                    "Hour": now.hour,
                    "Minute": now.minute,
                    "Second": now.second,
                },
                "Date": {
                    "Year": now.year,
                    "Month": now.month,
                    "Day": now.day,
                },
            },
            "LocalDateTime": {
                "Time": {
                    "Hour": now.hour,
                    "Minute": now.minute,
                    "Second": now.second,
                },
                "Date": {
                    "Year": now.year,
                    "Month": now.month,
                    "Day": now.day,
                },
            },
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """Get device capabilities.

        Returns:
            Device capabilities response
        """
        logger.debug("GetCapabilities request")

        return {
            "Analytics": None,  # Not implemented
            "Device": {
                "XAddr": f"{self.device_base_url}/onvif/device_service",
                "Network": {
                    "IPFilter": False,
                    "ZeroConfiguration": False,
                    "IPVersion6": False,
                    "DynDNS": False,
                    "Extension": None,
                },
                "System": {
                    "DiscoveryResolve": False,
                    "DiscoveryBye": False,
                    "RemoteDiscovery": False,
                    "SystemBackup": False,
                    "SystemLogging": False,
                    "FirmwareUpgrade": False,
                    "SupportedVersions": [
                        {"Major": 2, "Minor": 0},
                        {"Major": 2, "Minor": 4},
                    ],
                    "Extension": None,
                },
                "IO": None,
                "Security": {
                    "TLS1.1": False,
                    "TLS1.2": True,
                    "OnboardKeyGeneration": False,
                    "AccessPolicyConfig": False,
                    "X.509Token": False,
                    "SAMLToken": False,
                    "KerberosToken": False,
                    "RELToken": False,
                    "Extension": None,
                },
            },
            "Events": {
                "XAddr": f"{self.device_base_url}/onvif/events_service",
                "WSSubscriptionPolicySupport": False,
                "WSPullPointSupport": True,
                "WSPausableSubscriptionManagerInterfaceSupport": False,
            },
            "Imaging": None,  # Not implemented
            "Media": {
                "XAddr": f"{self.device_base_url}/onvif/media_service",
                "StreamingCapabilities": {
                    "RTPMulticast": False,
                    "RTP_TCP": True,
                    "RTP_RTSP_TCP": True,
                    "Extension": None,
                },
            },
            "PTZ": None,  # Not implemented
            "Extension": None,
        }

    def get_services(self, include_capability: bool = True) -> Dict[str, Any]:
        """Get available ONVIF services.

        Args:
            include_capability: Include capability information

        Returns:
            Services list response
        """
        logger.debug(f"GetServices request (include_capability={include_capability})")

        services = [
            {
                "Namespace": "http://www.onvif.org/ver10/device/wsdl",
                "XAddr": f"{self.device_base_url}/onvif/device_service",
                "Version": {"Major": 2, "Minor": 5},
            },
            {
                "Namespace": "http://www.onvif.org/ver10/media/wsdl",
                "XAddr": f"{self.device_base_url}/onvif/media_service",
                "Version": {"Major": 2, "Minor": 5},
            },
            {
                "Namespace": "http://www.onvif.org/ver10/events/wsdl",
                "XAddr": f"{self.device_base_url}/onvif/events_service",
                "Version": {"Major": 2, "Minor": 5},
            },
        ]

        if include_capability:
            # Add capability information
            services[0]["Capabilities"] = self.get_capabilities()["Device"]
            services[1]["Capabilities"] = self.get_capabilities()["Media"]
            services[2]["Capabilities"] = self.get_capabilities()["Events"]

        return {"Service": services}

    def get_hostname(self) -> Dict[str, Any]:
        """Get device hostname.

        Returns:
            Hostname response
        """
        logger.debug("GetHostname request")

        return {
            "Name": self.camera_config.name.replace(" ", "-").lower(),
            "FromDHCP": False,
        }

    def get_network_interfaces(self) -> Dict[str, Any]:
        """Get network interface configuration.

        Returns:
            Network interfaces response
        """
        logger.debug("GetNetworkInterfaces request")

        # Get container/service IP
        service_ip = self._get_service_ip()

        return {
            "NetworkInterfaces": [
                {
                    "token": "eth0",
                    "Enabled": True,
                    "Info": {
                        "Name": "eth0",
                        "HwAddress": self.camera_config.mac_address,
                        "MTU": 1500,
                    },
                    "Link": {
                        "AdminSettings": {
                            "AutoNegotiation": True,
                            "Speed": 1000,
                            "Duplex": "Full",
                        },
                        "OperSettings": {
                            "AutoNegotiation": True,
                            "Speed": 1000,
                            "Duplex": "Full",
                        },
                        "InterfaceType": 6,  # ethernetCsmacd
                    },
                    "IPv4": {
                        "Enabled": True,
                        "Config": {
                            "Manual": [
                                {
                                    "Address": service_ip,
                                    "PrefixLength": 24,
                                }
                            ],
                            "DHCP": False,
                            "FromDHCP": {
                                "Address": service_ip,
                                "PrefixLength": 24,
                            },
                        },
                    },
                    "IPv6": None,
                }
            ]
        }

    def get_dns(self) -> Dict[str, Any]:
        """Get DNS configuration.

        Returns:
            DNS configuration response
        """
        logger.debug("GetDNS request")

        return {
            "FromDHCP": False,
            "DNSManual": [
                {"Type": "IPv4", "IPv4Address": "8.8.8.8"},
                {"Type": "IPv4", "IPv4Address": "8.8.4.4"},
            ],
            "DNSFromDHCP": None,
        }

    def get_scopes(self) -> Dict[str, Any]:
        """Get device scopes for WS-Discovery.

        Returns:
            Scopes response
        """
        logger.debug("GetScopes request")

        return {
            "Scopes": [
                {
                    "ScopeDef": "Fixed",
                    "ScopeItem": f"onvif://www.onvif.org/name/{self.camera_config.name.replace(' ', '_')}",
                },
                {
                    "ScopeDef": "Fixed",
                    "ScopeItem": f"onvif://www.onvif.org/location/{self.camera_config.location_name.replace(' ', '_')}",
                },
                {
                    "ScopeDef": "Fixed",
                    "ScopeItem": f"onvif://www.onvif.org/hardware/{self.camera_config.model.replace(' ', '_')}",
                },
                {
                    "ScopeDef": "Fixed",
                    "ScopeItem": f"onvif://www.onvif.org/Profile/Streaming",
                },
            ]
        }
