#!/usr/bin/env python3
"""
Simple test to verify WebRTC connection works locally without Docker
This helps us identify if the issue is Docker networking or the WebRTC setup itself
"""

import asyncio
import sys
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration

async def test_local_connection():
    """Test if we can create a basic peer connection"""
    print("Testing basic RTCPeerConnection creation...")

    # Create peer connection with no ICE servers (local only)
    pc = RTCPeerConnection(
        configuration=RTCConfiguration(iceServers=[])
    )

    print(f"✓ Created peer connection")
    print(f"  Connection state: {pc.connectionState}")
    print(f"  ICE connection state: {pc.iceConnectionState}")
    print(f"  ICE gathering state: {pc.iceGatheringState}")

    # Create a data channel (required for offer)
    dc = pc.createDataChannel("test")
    print(f"✓ Created data channel: {dc.label}")

    # Create an offer
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    print(f"\n✓ Created and set local description")
    print(f"  ICE gathering state: {pc.iceGatheringState}")
    print(f"\n📋 SDP Offer:")
    print("=" * 60)
    print(pc.localDescription.sdp)
    print("=" * 60)

    # Check what IPs are in the SDP
    import re
    ips = re.findall(r'c=IN IP4 ([\d.]+)', pc.localDescription.sdp)
    candidates = re.findall(r'a=candidate:[^\s]+\s+\d+\s+\w+\s+\d+\s+([\d.]+)', pc.localDescription.sdp)

    print(f"\n📍 IP Addresses found in SDP:")
    print(f"  Connection IPs (c=IN IP4): {ips}")
    print(f"  ICE candidates: {candidates}")

    # Close
    await pc.close()
    print(f"\n✓ Connection closed")

    return ips, candidates

async def test_websocket_server():
    """Test if we can bind to the ports we expect"""
    print("\n" + "=" * 60)
    print("Testing if we can bind to ports 9101 and 9102...")
    print("=" * 60)

    from aiohttp import web

    async def health(request):
        return web.json_response({"status": "ok"})

    app = web.Application()
    app.router.add_get('/health', health)

    # Try to start server
    runner = web.AppRunner(app)
    await runner.setup()

    try:
        site = web.TCPSite(runner, 'localhost', 9101)
        await site.start()
        print(f"✓ Successfully bound to localhost:9101")
        await site.stop()
    except Exception as e:
        print(f"✗ Failed to bind to localhost:9101: {e}")
        return False

    try:
        site = web.TCPSite(runner, 'localhost', 9102)
        await site.start()
        print(f"✓ Successfully bound to localhost:9102")
        await site.stop()
    except Exception as e:
        print(f"✗ Failed to bind to localhost:9102: {e}")
        return False

    await runner.cleanup()
    return True

async def main():
    print("🧪 WebRTC Connection Test Suite")
    print("=" * 60)

    # Test 1: Basic peer connection
    try:
        ips, candidates = await test_local_connection()

        # Check if we got localhost IPs
        has_localhost = '127.0.0.1' in ips or '127.0.0.1' in candidates
        has_docker_ip = any(ip.startswith('172.') for ip in ips + candidates)

        print(f"\n🔍 Analysis:")
        print(f"  Has localhost (127.0.0.1): {has_localhost}")
        print(f"  Has Docker IP (172.x.x.x): {has_docker_ip}")

        if has_docker_ip:
            print(f"\n⚠️  ISSUE: aiortc is discovering Docker internal IPs")
            print(f"     This will prevent browser from connecting")
            print(f"     Need to rewrite these IPs or use host networking")
        elif has_localhost:
            print(f"\n✓ Good: Only localhost IPs found")
        else:
            print(f"\n⚠️  ISSUE: No valid IPs found")

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 2: Port binding
    try:
        await test_websocket_server()
    except Exception as e:
        print(f"\n✗ Port binding test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✓ All basic tests passed")
    print("=" * 60)
    return True

if __name__ == '__main__':
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
