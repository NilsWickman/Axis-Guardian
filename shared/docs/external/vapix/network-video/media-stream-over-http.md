# Media stream over HTTP

**Source:** https://developer.axis.com/vapix/network-video/media-stream-over-http/
**Last Updated:** Aug 26, 2025

---

# Media stream over HTTP

## Use cases​

### Live streaming​

### Download a playable file​

### Fetch an encrypted stream​

## API specifications​

### media.cgi​

## Footnotes​

The Media stream over HTTP API provides the information that makes it possible to call for and obtain a media stream in a container format over HTTP using the features detailed below:

Media streams can be returned as either a Matroska or MP4 and supports both video and audio. Additionally, MP4 is compatible with the media container format supported by web browsers and can be rendered as a HTML5 video element.

Identification

This example will show you how to use a client application to live stream video and audio from a camera.

API references

media.cgi

This example will show you how to download and save a live media clip from a camera.

Download a 5–second clip.

Play the clip.

API references

media.cgi

This example will show you how to use a client application to download an encrypted media stream from a camera.

API references

media.cgi

This method should be used when you want to fetch a media stream packaged in a specific container format.

Request

Return value - Success

The codecs={codecs} parameters listed with the Content-Types below should contain a comma-separated list of compatible codec strings detailed in RFC 6381.

HTTP Code: 200 OK

Content-Type

Video-Metadata-Transform

A transformation matrix relative to the default rotation that describes how stream coordinates relates to the sensor coordinates. The matrix uses the following format: x1,y1,z1;x2,y2,z2;x3,y3,z3.

Video-Sensor-Transform

An unrotated transformation matrix describing how stream coordinates relate to sensor coordinates.

Response body: The media in a container format (in this case a chunked HTTP transfer encoding).

Return value - Error

HTTP code: An error code found in the table below

Content-Type: text/html

Response body: An HTML code describing the error

Error codes

Please note that baseline is not available on all products. For a list of available values, see the parameter Properties.Image.H264.Profiles. ↩

```
ffplay 'http://<IP>/axis-cgi/media.cgi'
```

```
curl --output file.mkv --max-time 5 'http://<IP>/axis-cgi/media.cgi'
```

```
vlc file.mkv
```

```
curl --output file.mkv 'https://<IP>/axis-cgi/media.cgi'
```

```
http://<IP>/axis-cgi/media.cgi?<argument>=<data>[&<argument>=<data>[&...]]
```

- Create and configure URL requests and retrieve media data streams from your Axis devices with media.cgi .
- Use standard media players and tools such as VLC and FFmpeg.

- API Discovery: id=media-cgi

- Request a live stream.

- Download a 5–second clip.
curl --output file.mkv --max-time 5 'http://<IP>/axis-cgi/media.cgi'
- Play the clip.
vlc file.mkv

- Use HTTPS for encrypted communication and download the media stream.

- Security level: Viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type

video/x-matroska; codecs={codecs}
video/mp4; codecs={codecs}
audio/x-matroska; codecs={codecs}
audio/mp4; codecs={codecs}
- video/x-matroska; codecs={codecs}
- video/mp4; codecs={codecs}
- audio/x-matroska; codecs={codecs}
- audio/mp4; codecs={codecs}
- Video-Metadata-Transform
A transformation matrix relative to the default rotation that describes how stream coordinates relates to the sensor coordinates. The matrix uses the following format: x1,y1,z1;x2,y2,z2;x3,y3,z3.
- Video-Sensor-Transform
An unrotated transformation matrix describing how stream coordinates relate to sensor coordinates.
- Response body: The media in a container format (in this case a chunked HTTP transfer encoding).

- video/x-matroska; codecs={codecs}
- video/mp4; codecs={codecs}
- audio/x-matroska; codecs={codecs}
- audio/mp4; codecs={codecs}

- HTTP code: An error code found in the table below
- Content-Type: text/html
- Response body: An HTML code describing the error

- Please note that baseline is not available on all products. For a list of available values, see the parameter Properties.Image.H264.Profiles. ↩

| URL option | Valid values | Default value | Description |
| --- | --- | --- | --- |
| audio | 1 (Audio) 0 (No audio) | Audio.A#.Enabled | Specifies whether the audio should be included in the stream. Please note that you also need to enable audio support for the audio source with AudioSource.A#.AudioSupport=yes. |
| audiobitrate | Integer | AudioSource.A#.BitRate | The audio bit rate. |
| audiochannel | 1 | Audio.A#.Source | The audio source. Please note that it can not be used together with audiodeviceid and audioinputid. |
| audiocodec | aac opus | aac | The audio codec. |
| audiodeviceid | 0 ... | Audio.A#.Source | The audio device ID. Please note that it can not be used together with audiochannel. |
| audioinputid | 0 ... | Audio.A#.Source | The audio input ID. Please note that it can not be used together with audiochannel. |
| audionbrofchannels | 1 (Mono) 2 (Stereo) | Audio.A#.NbrOfChannels | Can be either mono or stereo sound. |
| audiosamplerate | Integer | AudioSource.A#.SampleRate | The audio sample rate. |
| camera | 1... quad | 1 | Selects the video source. Please note that this argument is only valid on Axis products with more than one video source, i.e. cameras with multiple view areas or video encoders with multiple video channels. |
| container | matroska mp4 | matroska | The container format. |
| compression | 0...100 | Image.I#.Appearance.Compression | Adjusts the compression level of the image. Using a higher value corresponds to a higher compression, i.e. a lower quality and smaller image size. |
| fps | Integer | Image.I#.Stream.FPS | Selects the frame rate. 0 means unlimited. |
| h264profile | high main baseline(1) | Image.I#.MPEG.H264.Profile | The H.264 profile that should be used. |
| mirror | 1 (Mirrored) 0 (Not mirrored) | Image.I#.Appearance.MirrorEnabled | Specifies whether the image should be mirrored. |
| color | 1 (Color) 0 (Monochrome) | Image.I#.Appearance.ColorEnabled | Specifies whether the image should be in color or monochrome. |
| resolution | String | Image.I#.Appearance.Resolution | The resolution of the retrieved image. Use the parameter Properties.Image.Resolutions for a list of supported resolutions. |
| rotation | 0 90 180 270 | Product dependant | Rotates the image clockwise. The rotation alternatives on an Axis device is defined by the parameters Properties.Image.Rotation and Properties.Image.I#.Rotation. Please note that the URL option rotation is only valid on products without source rotation. Check if the parameter ImageSource.I#.SourceRotation=yes and if that is the case, use ImageSource.I#.Rotation instead. |
| streamprofile | String | N/A | The name of a saved stream profile. |
| squarepixel | 0 1 | Image.I#.Appearance SquarePixelEnabled | Enable/disable square pixel (aspect ratio) correction. The device will adjust the aspect ratio to make it appear as intended if the parameter is set to 1. |
| video | 1 (Video) 0 (No video) | 1 | Specify if video should be included in the stream. |
| videoabrmaxbitrate | Integer | Image.I#.RateControl ABR.MaxBitrate | The maximum bitrate when bitrate mode is ABR. |
| videoabrretentiontime | Integer | Image.I#.RateControl ABR.RetentionTime | Retention time when bitrate mode is ABR. |
| videoabrtargetbitrate | Integer | Image.I#.RateControl ABR.TargetBitrate | Target bitrate when bitrate mode is ABR. |
| videobitratemode | abr mbr vbr | Image.I#.RateControl Mode | The bitrate mode. |
| videobitratepriority | none framerate quality fullframerate | Image.I#.RateControl Priority | The bitrate priority. |
| videocodec | h264 h265 | h264 | The video codec. |
| videoframeskipmode | drop empty | Image.I#.MPEG.FrameSkipMode | Determines what should happen when either the rate controller or Zipstream skips a frame. drop: The frame won’t be transmitted. empty: An empty frame will be sent instead of the actual frame. |
| videomaxbitrate | Integer | Image.I#.RateControl MaxBitrate | The maximum bitrate when bitrate mode is MBR. |
| videozfpsmode | fixed dynamic | Image.I#.MPEG.ZFpsMode | The Zipstream fps mode. fixed: The FPS will have its default value set for the stream. This value might vary between devices due to rate control limitations. dynamic: FPS changes will be triggered by motions in the scene. |
| videozgopmode | fixed dynamic | Image.I#.MPEG.ZGopMode | The Zipstream GOP mode. fixed: The GOP length is fixed and set to the product’s default value. dynamic: Unnecessary I-frames are removed to further reduce the bit rate. The default GOP lengths and configurable maximum GOP lengths (videozmaxgoplength) may vary between Axis products. The maximum GOP length is used in scenes with little to no motion, while the default GOP length is used for busy scenes. |
| videozmaxgoplength | Integer | Image.I#.MPEG.ZMaxGopLength | The Zipstream maximum GOP length. |
| videozstrength | off Inter | Image.I#.MPEG.ZStrength | The Zipstream strength. |

| HTTP code | Description |
| --- | --- |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |
| 503 | Service Unavailable |

