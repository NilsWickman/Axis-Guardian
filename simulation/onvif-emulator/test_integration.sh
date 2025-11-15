#!/bin/bash
# Integration test script for ONVIF camera emulator

set -e

echo "=== ONVIF Camera Emulator Integration Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
CAMERA_IP="172.20.0.11"
CAMERA_PORT="80"
USERNAME="admin"
PASSWORD="axis123"

echo -e "${YELLOW}Testing camera at ${CAMERA_IP}:${CAMERA_PORT}${NC}"
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health check endpoint${NC}"
if curl -s -f "http://${CAMERA_IP}:${CAMERA_PORT}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    curl -s "http://${CAMERA_IP}:${CAMERA_PORT}/health" | jq .
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Root endpoint
echo -e "${YELLOW}Test 2: Root endpoint${NC}"
if curl -s -f "http://${CAMERA_IP}:${CAMERA_PORT}/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Root endpoint accessible${NC}"
    curl -s "http://${CAMERA_IP}:${CAMERA_PORT}/" | jq .
else
    echo -e "${RED}✗ Root endpoint failed${NC}"
    exit 1
fi
echo ""

# Test 3: Check if python-onvif-zeep is installed
echo -e "${YELLOW}Test 3: Check python-onvif-zeep installation${NC}"
if python3 -c "import onvif" 2>/dev/null; then
    echo -e "${GREEN}✓ python-onvif-zeep is installed${NC}"
else
    echo -e "${YELLOW}! python-onvif-zeep not installed${NC}"
    echo "  Install with: pip install onvif-zeep"
    echo "  Skipping ONVIF-specific tests..."
    exit 0
fi
echo ""

# Test 4: ONVIF GetDeviceInformation
echo -e "${YELLOW}Test 4: ONVIF GetDeviceInformation${NC}"
python3 << 'PYTHON_EOF'
import sys
try:
    from onvif import ONVIFCamera

    # Connect to camera
    mycam = ONVIFCamera('172.20.0.11', 80, 'admin', 'axis123')

    # Get device information
    device_info = mycam.devicemgmt.GetDeviceInformation()

    print(f"✓ Manufacturer: {device_info.Manufacturer}")
    print(f"✓ Model: {device_info.Model}")
    print(f"✓ Firmware: {device_info.FirmwareVersion}")
    print(f"✓ Serial: {device_info.SerialNumber}")

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GetDeviceInformation passed${NC}"
else
    echo -e "${RED}✗ GetDeviceInformation failed${NC}"
    exit 1
fi
echo ""

# Test 5: ONVIF GetProfiles
echo -e "${YELLOW}Test 5: ONVIF GetProfiles${NC}"
python3 << 'PYTHON_EOF'
import sys
try:
    from onvif import ONVIFCamera

    mycam = ONVIFCamera('172.20.0.11', 80, 'admin', 'axis123')
    media = mycam.create_media_service()

    profiles = media.GetProfiles()

    print(f"✓ Found {len(profiles)} media profiles:")
    for profile in profiles:
        print(f"  - {profile.Name} (token: {profile.token})")

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GetProfiles passed${NC}"
else
    echo -e "${RED}✗ GetProfiles failed${NC}"
    exit 1
fi
echo ""

# Test 6: ONVIF GetStreamUri
echo -e "${YELLOW}Test 6: ONVIF GetStreamUri${NC}"
python3 << 'PYTHON_EOF'
import sys
try:
    from onvif import ONVIFCamera

    mycam = ONVIFCamera('172.20.0.11', 80, 'admin', 'axis123')
    media = mycam.create_media_service()

    profiles = media.GetProfiles()
    profile_token = profiles[0].token

    stream_uri = media.GetStreamUri({
        'StreamSetup': {
            'Stream': 'RTP-Unicast',
            'Transport': {'Protocol': 'RTSP'}
        },
        'ProfileToken': profile_token
    })

    print(f"✓ Stream URI: {stream_uri.Uri}")

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GetStreamUri passed${NC}"
else
    echo -e "${RED}✗ GetStreamUri failed${NC}"
    exit 1
fi
echo ""

# Test 7: ONVIF Events
echo -e "${YELLOW}Test 7: ONVIF CreatePullPointSubscription${NC}"
python3 << 'PYTHON_EOF'
import sys
try:
    from onvif import ONVIFCamera

    mycam = ONVIFCamera('172.20.0.11', 80, 'admin', 'axis123')
    events = mycam.create_events_service()

    # Create subscription
    subscription = events.CreatePullPointSubscription()

    print(f"✓ Subscription created")
    print(f"  Address: {subscription.SubscriptionReference.Address._value_1}")

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CreatePullPointSubscription passed${NC}"
else
    echo -e "${RED}✗ CreatePullPointSubscription failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}=== All tests passed! ===${NC}"
