# RTSP Adjustable Live Stream

**Source:** https://developer.axis.com/vapix/network-video/rtsp-adjustable-live-stream/
**Last Updated:** Aug 26, 2025

---

# RTSP Adjustable Live Stream

## Description​

### Model​

### Identification​

## Common examples​

### Adjust the stream quality​

## API specifications​

### RTSP Adjustable-Stream-Settings​

### RTSP Adjustable-Stream-Configuration​

### Properties.API.RTSP.AdjustableStreamSettings​

The RTSP Adjustable Live Stream API provides the information that makes it possible to change a subset of the settings of a stream without having to restart it. Please note that videozprofile=storage is incompatible with this API and a 400 Bad Request will be returned if it is used.

The API consists of two RTSP methods that should be used with the URL option adjustablelivestream=1, detailed in the table below:

Please note that it is not recommended to increase the values above what was used when starting the stream as some video players cannot handle values above the initial SDP data.

To identify the presence of this API on your device you should use one of the two methods detailed below:

RTSP

Use the method GET_PARAMETER with the request parameter Adjustable-Stream-Settings. The request has to be made on a live stream with the URL option adjustablelivestream=1 set. The feature is supported if the response is 200 OK and one or more of the settings are listed. If, however, the response is 451 Parameter not understood, the feature is not supported.

Parameter CGI

If the property below exists and has one or more settings listed the Adjustable Stream Settings feature is supported.

This example could be used to retrieve supported, adjustable live stream settings. This can then be used to change the quality of an ongoing live stream.

This method should be used when you wish to retrieve the settings that can be applied with RTSP Adjustable-Stream-Configuration.

Request

Request body syntax

Return value - Success

Returns a comma separated list of supported adjustable stream settings.

Response body syntax

This method should be used when you wish to configure the settings of an ongoing stream. This will apply to either all settings or none if the request fails. Supported settings are:

Please note that the settings above will behave the same as the URL options found in the Video streaming API.

Request

Request body syntax

Return value - Success

Returns 200 OK if all settings were successfully applied.

Response body

Return value - Failure

Returns 400 Bad Request if the requested settings were invalid or failed to apply.

Response body

This method should be used when you wish to retrieve the supported settings that can be applied with RTSP Adjustable-Stream-Configuration.

Request

Request body syntax

Return value - Success

Returns a comma separated list of supported, adjustable stream settings.

Response body syntax

```
rtsp://<camera-ip>/axis-media/media.amp?adjustablelivestream=1
```

```
GET_PARAMETER rtsp://<camera-ip>/axis-media/media.amp?adjustablelivestream=1 RTSP/1.0CSeq: 9Content-Type: text/parametersSession: W1CzY9GU2dz8QMfEDate: Fri, 19 Nov 2021 15:54:48 GMTContent-Length: 29Adjustable-Stream-Settings:
```

```
RTSP/1.0 200 OKCSeq: 9Content-Type: text/parametersServer: GStreamer RTSP serverSession: W1CzY9GU2dz8QMfE;timeout=5Date: Fri, 19 Nov 2021 15:54:48 GMTContent-Length: 29Adjustable-Stream-Settings: compression,fps,videokeyframeinterval,videomaxbitrate,videozstrength
```

```
SET_PARAMETER rtsp://<camera-ip>/axis-media/media.amp?adjustablelivestream=1 RTSP/1.0CSeq: 10Content-Type: text/parametersSession: W1CzY9GU2dz8QMfEDate: Fri, 19 Nov 2021 15:54:48 GMTContent-Length: 79Adjustable-Stream-Configuration: fps=30,compression=30,videomaxbitrate=100000
```

```
RTSP/1.0 200 OKCSeq: 10Server: GStreamer RTSP serverSession: W1CzY9GU2dz8QMfE;timeout=5Date: Fri, 19 Nov 2021 15:54:48 GMT
```

```
GET_PARAMETER rtsp://<camera-ip>/axis-media/media.amp?adjustablelivestream=1 RTSP/1.0Content-Type: text/parametersAdjustable-Stream-Settings
```

```
RTSP/1.0 200 OKContent-Type: text/parametersAdjustable-Stream-Settings: compression,fps,videokeyframeinterval,videomaxbitrate,videozstrength
```

```
SET_PARAMETER rtsp://<camera-ip>/axis-media/media.amp?adjustablelivestream=1 RTSP/1.0Content-Type: text/parametersAdjustable-Stream-Configuration: fps=30,compression=30,videomaxbitrate=100000
```

```
RTSP/1.0 200 OK
```

```
RTSP/1.0 400 Bad Request
```

```
http://<camera-ip>/axis-cgi/param.cgi?action=list&group=root.Properties.API.RTSP.AdjustableStreamSettings
```

```
root.Properties.API.RTSP.AdjustableStreamSettings="compression,fps,videokeyframeinterval,videomaxbitrate,videozstrength"
```

- Property: Properties.API.RTSP.AdjustableStreamSettings=<one or more settings>

- Request a video stream with the default settings and enable the adjustable live stream.

- Retrieves the supported adjustable live settings for the stream.

- Change the settings of the ongoing stream.

- Security level: Viewer
- Method: GET_PARAMETER

- RTSP Code: 200 OK
- Content-Type: text/parameters

- compression
- fps
- videokeyframeinterval
- videomaxbitrate
- videozstrength

- Security level: Viewer
- Method: SET_PARAMETER

- RTSP Code: 200 OK

- RTSP Code: 400 Bad Request

- Security level: Viewer

- HTTP Code: 200 OK

| Method | Description |
| --- | --- |
| GET_PARAMETER Adjustable-Stream-Settings | Retrieves a list of supported settings that can be changed. |
| SET_PARAMETER Adjustable-Stream-Configuration | Applies updated settings to an ongoing stream. |

