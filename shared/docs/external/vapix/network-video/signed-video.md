# Signed Video

**Source:** https://developer.axis.com/vapix/network-video/signed-video/
**Last Updated:** Aug 18, 2025

---

# Signed Video

## Description​

### Model​

### Identification​

## Use cases​

### Setup signed video​

## API specification​

### SignedVideo.Enabled​

### RTSP URL Options​

### General error codes​

The Signed Video API contains the settings that makes it possible for applications and users to retrieve signed video content from a channel. Utilizing the parameter group Image.I#.MPEG.SignedVideo, where I# is the name of the video channel, makes it possible to validate whether the video has been manipulated or tampered with after it was exported from the camera. Supported parameters are:

Signing a video can be done in two different ways:

Default

This method enables/disables video signing for a video channel with the regular Signed Video API parameter group Image.I#.MPEG.SignedVideo and the parameter Enabled.

Per stream

Signing can also be enabled/disabled directly in a stream with the Signed Video URL option, i.e. using the boolean videosigned that can have the values 1 or 0 and may look like this:

Use these examples to sign a video and ensure its origin and authenticity. The video can then be validated to prove that it has not been manipulated with after being transferred from the camera.

Setup signed video on a channel

To enable video signing by default on a channel you should use the Enabled parameter like this:

Setup signed video for a stream

To enable video signing for a stream you should use the videosigned URL-option like this:

The Enabled parameter is used when you wish to enable/disable video signing with the parameter handling API.

Valid values for # ranges from 0 and up to the maximum number of channels specified by the product -1. This means that the valid values for a product with 100 channels has a range between 0–99.

The following RTSP errors can be returned for all methods.

```
gst-launch-1.0 -v rtspsrc location="rtsp://<user:password>@<ip addr>/axis-media/media.amp?videosigned=1" ! fakesink silent=false
```

```
http://<servername>/axis-cgi/param.cgi?action=update&Image.I0.MPEG.SignedVideo.Enabled=yes
```

```
gst-launch-1.0 -v rtspsrc location="rtsp://<user:password>@<ip addr>/axis-media/media.amp?videosigned=1" ! fakesink silent=false
```

```
Image.I#.MPEG.SignedVideo.Enabled
```

```
gst-launch-1.0 -v rtspsrc location="rtsp://<user:password>@<ip addr>/axis-media/media.amp?videosigned=1" ! fakesink silent=false
```

- API Discovery: id=signed-video

- List security level: Operator, Viewer
- Update security level: Admin

| Parameter | Type | Description |
| --- | --- | --- |
| Enabled=<yes/no> | Boolean | Available values are yes or no. |

| Parameter | Description |
| --- | --- |
| Enabled=yes | no | Enables and disables signed video for a channel. The default value is no. |

| Parameter | Description |
| --- | --- |
| videosigned=1 | 0 | Enables and disables signed video for a stream. |

| Error code | Description |
| --- | --- |
| 400 Bad Request | An error in the request, e.g. an invalid URL option. |
| 503 Service Unavailable | An error in the service while handling the request. |

