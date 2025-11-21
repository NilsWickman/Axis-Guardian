#!/usr/bin/env python3
"""Test if we can make aiortc bind to 0.0.0.0"""

import asyncio
import os

# Try to force binding to all interfaces
os.environ['AIORTC_BIND_ADDRESS'] = '0.0.0.0'

from aiortc import RTCPeerConnection, RTCConfiguration
from aiortc.contrib.media import MediaBlackhole

async def test():
    pc = RTCPeerConnection(configuration=RTCConfiguration(iceServers=[]))
    dc = pc.createDataChannel('test')

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    print("SDP:")
    print(pc.localDescription.sdp)
    print()

    # Check IPs
    import re
    ips = re.findall(r'a=candidate:[^\s]+\s+\d+\s+\w+\s+\d+\s+([\d.]+)', pc.localDescription.sdp)
    print(f"Candidate IPs: {ips}")
    print(f"Has 0.0.0.0: {'0.0.0.0' in ips}")
    print(f"Has 172.x: {any(ip.startswith('172.') for ip in ips)}")

    await pc.close()

asyncio.run(test())
