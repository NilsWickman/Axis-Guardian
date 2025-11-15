"""Tests for ONVIF Device Management Service."""

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from src.camera_config import CameraConfig
from src.services.device_service import DeviceManagementService


@pytest.fixture
def mock_camera_config():
    """Create mock camera configuration."""
    config = MagicMock(spec=CameraConfig)
    config.camera_id = "camera1"
    config.name = "Test Camera 1"
    config.brand = "Axis Communications"
    config.model = "AXIS P3245-LVE"
    config.serial_number = "ACCC8E112345"
    config.firmware_version = "11.11.77"
    config.mac_address = "AC:CC:8E:00:00:01"
    config.hardware_id = "ACCC8E000001"
    config.location_name = "Main Entrance"
    return config


class TestDeviceManagementService:
    """Test cases for Device Management Service."""

    def test_get_device_information(self, mock_camera_config):
        """Test GetDeviceInformation operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_device_information()

        assert response["Manufacturer"] == "Axis Communications"
        assert response["Model"] == "AXIS P3245-LVE"
        assert response["FirmwareVersion"] == "11.11.77"
        assert response["SerialNumber"] == "ACCC8E112345"
        assert response["HardwareId"] == "ACCC8E000001"

    def test_get_system_date_and_time(self, mock_camera_config):
        """Test GetSystemDateAndTime operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_system_date_and_time()

        assert "DateTimeType" in response
        assert "TimeZone" in response
        assert "UTCDateTime" in response
        assert "LocalDateTime" in response

        # Verify UTC time structure
        utc_time = response["UTCDateTime"]
        assert "Time" in utc_time
        assert "Date" in utc_time
        assert "Hour" in utc_time["Time"]
        assert "Minute" in utc_time["Time"]
        assert "Second" in utc_time["Time"]
        assert "Year" in utc_time["Date"]
        assert "Month" in utc_time["Date"]
        assert "Day" in utc_time["Date"]

    def test_get_capabilities(self, mock_camera_config):
        """Test GetCapabilities operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_capabilities()

        assert "Device" in response
        assert "Media" in response
        assert "Events" in response

        # Verify device capabilities
        assert "XAddr" in response["Device"]
        assert "device_service" in response["Device"]["XAddr"]

        # Verify media capabilities
        assert "XAddr" in response["Media"]
        assert "media_service" in response["Media"]["XAddr"]

        # Verify events capabilities
        assert "XAddr" in response["Events"]
        assert "events_service" in response["Events"]["XAddr"]
        assert response["Events"]["WSPullPointSupport"] is True

    def test_get_services(self, mock_camera_config):
        """Test GetServices operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_services(include_capability=True)

        assert "Service" in response
        services = response["Service"]

        # Should have 3 services (device, media, events)
        assert len(services) == 3

        # Verify service structure
        for svc in services:
            assert "Namespace" in svc
            assert "XAddr" in svc
            assert "Version" in svc
            assert "Capabilities" in svc  # Included due to flag

    def test_get_hostname(self, mock_camera_config):
        """Test GetHostname operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_hostname()

        assert "Name" in response
        assert "FromDHCP" in response
        assert response["FromDHCP"] is False
        # Hostname should be derived from camera name
        assert "camera" in response["Name"].lower() or "test" in response["Name"].lower()

    def test_get_network_interfaces(self, mock_camera_config):
        """Test GetNetworkInterfaces operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_network_interfaces()

        assert "NetworkInterfaces" in response
        interfaces = response["NetworkInterfaces"]

        assert len(interfaces) > 0
        iface = interfaces[0]

        assert "token" in iface
        assert "Enabled" in iface
        assert "Info" in iface
        assert "IPv4" in iface

        # Verify MAC address
        assert iface["Info"]["HwAddress"] == "AC:CC:8E:00:00:01"

    def test_get_dns(self, mock_camera_config):
        """Test GetDNS operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_dns()

        assert "FromDHCP" in response
        assert "DNSManual" in response

        # Should have manual DNS servers configured
        dns_servers = response["DNSManual"]
        assert len(dns_servers) > 0

    def test_get_scopes(self, mock_camera_config):
        """Test GetScopes operation."""
        service = DeviceManagementService(mock_camera_config)

        response = service.get_scopes()

        assert "Scopes" in response
        scopes = response["Scopes"]

        assert len(scopes) > 0

        # Verify scope structure
        for scope in scopes:
            assert "ScopeDef" in scope
            assert "ScopeItem" in scope
            assert scope["ScopeDef"] == "Fixed"
            assert "onvif://" in scope["ScopeItem"]
