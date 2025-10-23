# Onvif Replay Extension

**Source:** https://developer.axis.com/vapix/network-video/onvif-replay-extension/
**Last Updated:** Aug 18, 2025

---

# Onvif Replay Extension

## Identification​

## Use cases​

### Retrieve video stream​

### Retrieve default values​

### Enable Onvif Replay Extension​

## API specifications​

### Check if the feature is supported​

#### Request​

#### Responses​

#### Schema​

### Check if the feature is enabled by default​

#### Request​

#### Responses​

#### Schema​

### Enable or disable the feature by default​

#### Request​

#### Responses​

#### Schema​

The VAPIX® Onvif Replay Extension API makes it possible to receive a Real-time Transport Protocol (RTP) header extension with a Network Time Protocol (NTP) timestamp for video and/or audio streams on an Axis device.
param.cgi can be used to enable Real-Time
Streaming Protocol (RTSP) parameters as a default.
Use cases include mapping a metadata object with a timestamp into a video frame within a video stream.
The Onvif Streaming specification specifies the RTP header extension.

Example

Check if the feature is supported. On an open terminal, send the following HTTP GET request to param.cgi:

curl --digest --user root:pass 'http://<ip>/axis-cgi/param.cgi?action=list&group=Properties.API.RTP.OnvifReplayExt'

A correct response will contain the property "Properties.API.RTP.OnvifReplayExt=yes".

Enable Onvif Replay Extension with the RTSP setup. NTP timestamps will be included in the RTP packets and the client can use them to map frames to metadata objects, synchronize video from different cameras, etc. RTP header extensions are enabled if the RTSP parameter is used.

Example

Open a streaming application, such as VLC, and a network URL (Media -> Open Network Stream):

rtsp://root:pass@<ip>:554/axis-media/media.amp?videocodec=h264&onvifreplayext=1

Check the network with, for example, a wireshark for an RTP header extension. This can also be used if you want to disable the feature in case it was enabled by default:

rtsp://root:pass@<ip>:554/axis-media/media.amp?videocodec=h264&onvifreplayext=0

Check if the RTP header extension is enabled by default. If it is, the feature will be used even if the RTSP setup doesn't contain any extra parameters.

Example

Check if the feature is enabled by default. On an open terminal, send the following HTTP GET request to param.cgi:

curl --digest --user root:pass 'http://<ip>/axis-cgi/param.cgi?action=list&group=Network.RTP.OnvifReplayExt'

If the feature is supported, the response will contain Network.RTP.OnvifReplayExt=yes.

Enable or disable the RTP header extension by default.

Example

Enable or disable the feature by default. On an open terminal, send the following HTTP GET request to param.cgi:

curl --digest --user root:pass 'http://<ip>/axis-cgi/param.cgi?action=update&Network.RTP.OnvifReplayExt=yes'

Check if RTP with the OnvifReplayExt feature is supported.

Example value

Feature is supported

Feature is not supported

Check if RTP with the OnvifReplayExt feature is enabled by default.

Example value

Feature is enabled

Feature is disabled

Feature is not supported

Enable RTP with the OnvifReplayExt feature by default.

Example value

Value is updated

Feature is not supported

```
GET /param.cgi?action=list&group=Properties.API.RTP.OnvifReplayExt
```

```
200 OK
```

```
Properties.API.RTP.OnvifReplayExt=yes
```

```
{    [        Properties.API.RTP.OnvifReplayExt=yes    ]}
```

```
{    [        # Error: Error -1 getting param in group 'Properties.API.RTP.OnvifReplayExt'    ]}
```

```
GET /param.cgi?action=list&group=Network.RTP.OnvifReplayExt
```

```
200 OK
```

```
Network.RTP.OnvifReplayExt=yes
```

```
{    [        Network.RTP.OnvifReplayExt=yes    ]}
```

```
{    [        Network.RTP.OnvifReplayExt=no    ]}
```

```
{    [        # Error: Error -1 getting param in group 'Network.RTP.OnvifReplayExt'    ]}
```

```
GET /param.cgi?action=update&Network.RTP.OnvifReplayExt=yes
```

```
200 OK
```

```
OK
```

```
{    [        OK    ]}
```

```
{    [        # Error: Error setting 'root.Network.RTP.OnvifReplayExt' to 'yes'!    ]}
```

- Property: Properties.API.RTP.OnvifReplayExt
- AXIS OS: 10.11 and later

| Parameter | Available values | Description |
| --- | --- | --- |
| action=<string> | list | The parameter action. |
| group=<string> | Properties.API.RTP.OnvifReplayExt | The parameter group name. |

| Parameter | Available values | Description |
| --- | --- | --- |
| action=<string> | list | The parameter action. |
| group=<string> | Network.RTP.OnvifReplayExt | The parameter group name. |

| Parameter | Available values | Description |
| --- | --- | --- |
| action=<string> | update | The parameter action. |
| Network.RTP.OnvifReplayExt=<string> | yes, no | The new default value for Network.RTP.OnvifReplayExt. |

