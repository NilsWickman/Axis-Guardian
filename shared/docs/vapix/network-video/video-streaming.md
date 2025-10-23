# Video streaming

**Source:** https://developer.axis.com/vapix/network-video/video-streaming/
**Last Updated:** Aug 28, 2025

---

# Video streaming

## Video streaming over HTTP​

### Identification​

### Common examples​

### Image resolution​

### Video status​

### Bitmap​

### JPEG image (snapshot)​

### Motion JPEG video​

### Image request arguments​

## Video streaming over RTSP​

### Identification​

### RTSP commands​

#### RTSP DESCRIBE​

#### SDP media attribute transform​

#### RTSP OPTIONS​

#### RTSP SETUP​

#### RTSP PLAY​

#### RTSP PAUSE​

#### RTSP PAUSE on live stream​

#### RTSP TEARDOWN​

#### RTSP SET_PARAMETER​

### RTSP over HTTP​

### Parameter specification RTSP URL​

#### Public parameter description​

#### Event filter parameters​

### Error messages RTSP​

### RTCP​

## Always multicast​

### Identification​

### SDP​

## Scene profile API​

### Description​

#### Identification​

#### Obsoletes​

### Common examples​

#### List supported scene profiles​

#### Change scene profiles​

### API specification​

#### Valid scene profiles​

#### Access control​

## Stream profiles​

### Identification​

### Common examples​

### Stream profile parameters​

### Motion JPEG video request​

### RTSP request​

## Source-specific multicast​

### Description​

#### Terminology​

### Common examples​

#### One media session and RTP ports​

#### One media session and static assigned RTP ports​

#### Multiple media sessions and RTP ports​

#### Multiple media sessions and static allocated RTP ports​

The HTTP-based video interface provides the functionality for requesting single and multipart images and for getting and setting internal parameter values. The image and CGI requests are handled by the built-in web server.

Check supported VAPIX® version.

Check supported resolutions.

Check supported image formats.

Check the default resolution of video source 1.

Request a Motion JPEG video stream.

Use imagesize.cgi to retrieve the real image resolution. The request can be used to verify that the image has the desired resolution and to check the resolution after rotation.

Retrieve the default resolution for video source 1.

Request:

Response:

Request a specific resolution with supplied parameters for video source 1.

Request:

Response:

Request

Syntax:

With the following arguments and values:

Response

Responses to imagesize.cgi.

Success

A successful request returns image height and width in pixels.

Body:

Error

If the Axis product does not support the requested resolution, an error message is returned.

Body (if argument "camera" is specified):

Body (if argument "camera" is not specified):

Example: <!-- Camera 1 not available. -->

Use videostatus.cgi to retrieve information about a video encoder’s video sources. The response shows if there is a video signal from a connected analog camera.

Request video status from video source 1, 2, 3 and 4.

Response:

The response no video means that there is no analog video signal.

Request

Request the status information for the video sources. The number of video sources in an Axis product is defined by the parameter ImageSource.NbrOfSources.

Syntax:

With the following argument and values:

Response

Responses to videostatus.cgi

Success

Body:

<information> could be either video or no video.

This method has been deprecated and will no longer receive any updates, nor be supported by devices running AXIS OS version 11.0 and beyond.

Use bitmap/image.bmp to request a bitmap image.

To check if the Axis product supports bitmap images, use

Request:

Response:

Request a bitmap image from the default video source using default settings:

Request a bitmap image from video source 1 with resolution 320x240:

Request

Syntax:

With the following arguments and values:

Response

Responses to bitmap/image.bmp.

Success

A successful request returns a bitmap image.

Body:

Use jpg/image.cgi to retrieve a JPEG image (a snapshot).

Please note that extensive usage of this feature can affect product performance.

Request a JPEG image from video source 1 with resolution 320x240 and compression 25:

Request a JPEG image from video source 2 with the text "My Camera" displayed:

Request

Syntax:

With the following arguments and values:

Response

Responses to jpg/image.cgi

Success

A successful request returns a JPEG image.

HTTP Code: 200 OK

Content-Type: image/jpeg

Content-length

<image size in bytes>

Body:

Use mjpg/video.cgi to retrieve Motion JPEG video. Arguments such as resolution and compression can be specified directly in the request, but it is also possible to use image settings saved in a stream profile. A setting saved in a stream profile can be overridden by specifying a new value after the stream profile argument.

See also Stream profiles.

Request a Motion JPEG video stream from video source 1 with resolution 320x240 and compression 25:

Request a Motion JPEG video stream from the default video source with frame rate 5:

Request a Motion JPEG video stream using the ‘myprofile’ stream profile but with a lower resolution:

Request

Syntax:

With the following arguments and values.

Response

Responses to mjpg/video.cgi

Success

A successful request returns a continuous flow of JPEG images. The content type is multipart/x-mixed-replace and each image ends with a boundary string <boundary>.

Body:

Where the returned <image> field is:

The following arguments and values can be used in JPEG, motion JPEG or bitmap CGI (deprecated as of AXIS OS version 11.0) requests. Unless overridden by an argument it is the default values as configured via the GUI (or param.cgi) that decides the characteristics of the image or video.

RTSP (Real Time Streaming Protocol) is a control protocol for media streams delivered by a media server. RTSP can be considered a "remote control" providing commands such as play and pause. In addition, RTSP API provides parameters controlling media stream properties such as resolution, compression, video bit rate and audio as well as parameters controlling the image settings.

Please refer to the release notes for the actual product for compliance information.

The RTSP server in the Axis products is based on RFC 2326 Real Time Streaming Protocol (RTSP), RFC 4566 SDP: Session Description Protocol and RFC 3550 RTP: A Transport Protocol for Real-Time Applications.

When streaming both video and audio the audio and video can be synchronized by using RTP timestamps as described in RFC 3550.

The RTSP API provides several commands for media stream control.

Request syntax

To send a RTPS request use the following example.

Syntax

COMMAND is any of DESCRIBE, SETUP, OPTIONS, PLAY, PAUSE, TEARDOWN, SET_PARAMETER or GET_PARAMETER. Lines are separated with Carriage Return and Line Feed (CRLF).

Supported RTSP URL parameters and their values are listed in sectionParameter specification RTSP URL.

RTSP requests always contain the absolute URL.

The following header fields are accepted by all commands. Some commands accept or require additional header fields:

Response syntax

The first response line contains a status code and a reason phrase indicating the success or failure of the request. The status codes are described in RFC 2326.

The following header fields can be included in all RTSP response messages:

The DESCRIBE command is used to request an SDP description of the media stream(s). The Session Description Protocol (SDP) is described in RFC 2327.

The DESCRIBE request accepts the additional header field:

The response to the DESCRIBE command contains the additional header fields:

Example 1:

Request

Response

Depending on product model, the SDP file may contain a video media attribute transform. If the streamed video is rotated, mirrored or cropped from the image source configuration, this video media attribute shows how the video stream is orientated in relation to the image source configuration. The orientation is described by a transformation matrix consisting of homogeneous coordinates for two-dimensional operations (a 3x3 matrix).

Syntax

The matrix is formatted using commas to separate columns and semicolons to separate rows. Decimal representations of fractional values using the notation "<integer>.<fraction>" are allowed.

Example 2:

A video stream which is rotated 90 degrees is described by:

The OPTIONS request returns a list of supported RTSP commands. The command can be used to keep RTSP sessions alive by repeating the OPTIONS request at regular intervals. The session timeout time is specified by the timeout parameter returned from the SETUP command.

The response to the OPTIONS command contains the additional header field:

Example 3:

List supported commands. The asterisk (*) makes the request apply to the server and not to a particular URL.

Request

Response

As indicated in the response, the GET_PARAMETER command is supported; there are however no parameters to retrieve.

The SETUP command is used to configure the data delivery method.

The SETUP request requires an additional header field which is also included in the response:

If using unicast in combination with TCP, it is recommended to increase the size of the RTP packets to 64 000 bytes (from the standard 1500 bytes), provided that the client can accept larger packets. Also for unicast streaming over RTP/UDP it might be beneficial to increase the packet size if no packets are dropped. The packet size is changed using the following header field in the SETUP request:

The response returns a session identifier that should be used together with the stream control commands (for example PLAY, PAUSE and TEARDOWN). If the session header includes the timeout parameter, the session will close after the timeout time unless explicitly kept alive. Session can be kept alive by sending RTSP requests to the Axis product containing the session identifier (for example OPTIONS) within the timeout time or by using RTCP messages. Reconfiguration of transport parameters is not supported.

Example 4:

The response to the first SETUP request returns the session identifier (Session) which is used in subsequent requests. The control URL should be read from DESCRIBE and used in SETUP.

Request

Response

Example 5:

Request

Response

The PLAY request starts (or restarts if paused) the data delivery to the client.

When playing a motion JPEG via RTSP there is a resolution limit of 2040x2040 pixels.

The response to the PLAY command contains the additional header fields:

Example 6:

Request

Response

Example 7:

Play the recording "myrecording".

Request

The PAUSE request is used to temporarily stop data delivery from the Axis product. Use PLAY to restart data delivery.

Example 8:

Request

Response

If PAUSE is requested during live streaming the data transmission will stop immediately. If PLAY later is requested the live steam starts on the latest sampled frame. That means that the client will lose the video during the time that the stream has been paused. The client is notified in the Range header which interval that will be streamed.

The TEARDOWN request is used to close the data delivery from the Axis product.

Example 9:

Request

Response

The SET_PARAMETER command is used to change session parameters, currently only I-frame request is supported. The command sets the Renew-Stream parameter to yes.

Renew-Stream must be sent in the body. The corresponding Renew-Stream parameter in some AXIS OS 4.xx products had to be sent in the header. See example 2 below.

Example 10:

Use of SET_PARAMETER in AXIS OS 5.xx products. Renew-Stream is sent in the body.

Request

Response

Example 11:

In some older Axis products, I-frames were requested using RenewStream:yes in the header. To find out whether Renew-Stream should be sent in the header or the body, the following method is recommended.

Send a request with Require and RenewStream:yes in the header.

Request

If the request is successful (response 200 OK), the stream is renewed. Else, the Axis product responds with 551 Option not supported (below) and RenewStream should be sent in the body.

Response:

Send a second request with RenewStream:yes in the body.

Request

Successful response

RTSP can be tunnelled over HTTP. This might prove necessary in order to pass firewalls etc. To tunnel RTSP over HTTP, two sessions are set up; one GET (for command replies and stream data) and one POST (for commands). RTSP commands sent on the POST connection are base64 encoded, but the replies on the GET connection are in plain text. To bind the two sessions together the Axis product needs a unique ID (conveyed in the x-sessioncookie header). The GET and POST requests are accepted on both the HTTP port (default 80) and the RTSP server port (default 554).

For further information information see http://developer.apple.com/quicktime/icefloe/dispatch028.html

Syntax

Supported methods are GET and POST.

Example 1:

GET request.

Request

Response

Example 2:

POST request. There is no response from the Axis product.

Request

After this request has been sent it is possible to send RTSP requests like below.

Network Parameters

The following parameters in the Network.RTSP group control RTSP authentication.

Network.RTSP

RTSP API provides parameters for requesting media streams with specific properties and for image settings. The parameters should be included in the RTSP URL.

Syntax

The following parameters are supported for H.264, H.265, MPEG-4 Part 2 and Motion JPEG streams:

H.264, H.265 and MPEG-4 Part 2 streams support the following additional parameters:

You can also use the following parameters from the Rate control API:

H.264 streams support the following additional parameter:

Motion JPEG streams support the following additional parameter:

For parameters used to control the bit rate of a video stream, see Rate control.

Metadata

The event filter parameters eventtopic and eventcontent allows you to specify the events that should be included in the metadata stream. The parameters are combined into a single filter expression and any event that matches the filter will be included into the stream. The syntax for parameters is based on the ONVIF specification, but will not be not identical.

eventtopic

Using eventtopic allows you to filter events by topics with the following syntax:

In this case <filter?> is a Topic Expression filter of the ConcreteSet dialect with predefined topic prefixes. Allowed topic prefixes are:

Multiple <filter?> can be combined into a single Topic Expression filter. A special case with an empty filter expression is allowed and will watch any event.

eventcontent

Using eventcontent allows you to filter event messages by the content with the following syntax:

In this case <filter> is a MessageContent filter expression in the ItemFilter dialect, as defined in the ONVIF specification. The filter expression can be URL encoded in cases where special characters must be included.

The error messages for RTSP are described in RFC 2326.

RTP Control Protocol (RTCP) is implemented according to the standard in RFC 3550.

Always multicast means starting a multicast stream and letting it run continuously. Enabling always multicast reduces the latency when connecting to an Axis product. The always multicast streams enabled on the Axis product are presented by a Session Description Protocol (SDP). Using this information the client can choose to connect to the service.

The client makes a request according to the example below. The camera parameter specifies the desired video source on the Axis product.

To make a SDP request it is required that Network.RTP.R0.AlwaysMulticastVideo=yes.

Request SDP URL

Response SDP URL

The Axis product responds the request with a SDP. The SDP is protected by the HTTP authentication of the Axis product. Viewer, operator, and admin can make SDP requests.

The scene profile functionality gives the user the ability to quickly change between pre-defined sets of image settings such as shutter and gain for example. All streams are affected by the Scene Profile setting, that is, it is not possible to have different scene profile settings for different streams. The scene profile parameter is accessed through the Parameter Management API, described in section Parameter management.

Supported functionality:

VAPIX® Scene Profile API is available if:

Use this example to retrieve a list of the supported Scene Profile settings.

The response gives information about the supported Scene profile values and names.

Response

The camera will be the same regardless if an invalid value is passed to the API. No changes will be made unless a valid value is received by the API.

Response

The response will be the same even if an invalid value is passed to the API. No changes will be made unless a valid value is received by the API.

Valid profiles are product dependent and the default profile may vary between cameras.

For more information, see Parameter management

A stream profile is a set of video stream parameters, for example video codec, resolution, frame rate and compression, and can be used when retrieving a video stream from the Axis product. All parameters that can be used in a video stream request (HTTP or RTSP) can be saved in a stream profile. One can for example create stream profiles suitable for different applications, devices or situations and then use the stream profiles when recording video or requesting live video.

Most Axis products have a number of predefined stream profiles. The predefined stream profiles are designed according to basic requirements and can be customized as needed. It is also possible to create new stream profiles. User-created profiles can also be removed. Predefined stream profiles cannot be removed.

Stream profile parameters are listed, updated, added and removed using the Parameter Management API, see Parameter management.

Add a new stream profile. In this example the new profile is the 5th stream profile so it will be referred to as StreamProfile.S4.

Request:

Response:

Add and configure a stream profile in one request. Here the profile is named myprofile2 and the Parameters string is videocodec=h264&resolution=4CIF&text=1&textstring=4CIF%20profile. SeeImage request arguments what arguments that could be used in the Parameters string.

Characters in the Parameters string must be percent-encoded, so resolution=CIF&text=1&textstring=CIF%20profile becomes resolution%3dCIF%26text%3d1%26textstring%3dCIF%2520profile\

The blank space is encoded as %20, the equal sign (=) as %3d, the ampersand (&) as %26 and the percent sign is encoded as %25.

Request:

Response:

Configure a stream profile. In this example the profile is named myprofile and the Parameters string contains the following arguments: resolution=CIF, text=1 and textstring=CIF profile. SeeImage request arguments what arguments that could be used in the Parameters string.

Characters in the Parameters string must be percent-encoded, so resolution=CIF&text=1&textstring=CIF%20profile becomes resolution%3dCIF%26text%3d1%26textstring%3dCIF%2520profile.\

The blank space is encoded as %20, the equal sign (=) as %3d, the ampersand (&) as %26 and the percent sign is encoded as %25.

Request:

Response:

List the parameters of a stream profile.

Request:

Response:

The parameters in the StreamProfile group control stream profile settings.

In order to create a new dynamic parameter admin or operator access control is needed.

[StreamProfile.S#]

The # is replaced by a group number, for example StreamProfile.S5. The first group numbers are reserved for stream profiles included in the product

Saved stream profiles are convenient when retrieving Motion JPEG video streams through video.cgi. The value of a parameter saved in a stream profile can be overridden by specifying a new parameter value after the streamprofile argument.

Syntax:

With the following arguments:

Request, over HTTP, a Motion JPEG video stream configured according to the stream profile myprofile.

Request:

Saved stream profiles are also convenient when requesting video streams using RTSP. The value of a parameter saved in the stream profile can be overridden in the RTSP request by specifying a new value after the streamprofile argument.

Syntax:

With the following arguments:

Stream profiles in RTSP requests. The value of a parameter saved in the stream profile can be overridden by specifying a new parameter value after streamprofile. Here, myprofile2 (defined above) is used but the resolution is changed to 640x480.

Request:

Source-specific multicast, or SSM for short, is a method that makes it possible to receive multicast packets from specific sources. This makes SSM different from a normal multicast, where a user receives all multicast packets independent of their origin.

An Axis camera can be configured to include all information required for SSM through the Session description protocol (SDP) generated by RTSP DESCRIBE.

The following parameters must be set prior to using SSM:

SSM itself is available through the following URL:

Please note that the current implementation of SSM doesn’t support the benefits from the RTCP receiver feedback, which notifies the multicast senders via a unicast transmission.

Use this example to request a video stream by using multicast with a dynamically allocated RTP port configuration.

Start with the following command:

Camera configuration

The purpose of Network.RTP.R0.VideoPort=0 is to make the RTSP server dynamically allocate the ports used during the session.

Example 1

Request

Response

Example 2

Request

Response

Use this example to request a video stream by using a multicast that has been pre-defined with an RTP port configuration that uses the 40000 port on the product.

Start with the following command:

Camera configuration

The purpose of Network.RTP.R0.VideoPort=40000 is to make sure that the RTSP server always use the 40000 port.

Example 1

Request

Response

Example 2

Request

Response

Use this example to request a video and audio stream by using a multicast containing a dynamically allocated RTP port configuration.

Start with the following commands:

Camera configuration

The purpose of Network.RTP.R0.VideoPort=0 and Network.RTP.R0.AudioPort=0 is to make the RTSP server dynamically allocate the ports used during the session.

Example 1

Request

Response

Example 2

Request

Response

Example 3

Request

Response

Use this example to request a video and audio stream by using a multicast with a pre-defined RTP port configuration on a product by using the 40000 port for video and 45000 port for audio.

Start with the following commands:

Camera configuration

The purpose of Network.RTP.RO.VideoPort=40000 and Network.RTP.R0.AudioPort=45000 is to make sure that the RTSP server uses the 40000 port for video and the 45000 port for audio.

Example 1

Request

Response

Example 2

Request

Response

Example 3

Request

Response

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.API.HTTP.Version
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.Image.Resolution
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.Image.Format
```

```
http://myserver/axis-cgi/imagesize.cgi?camera=1
```

```
http://myserver/axis-cgi/mjpg/video.cgi
```

```
http://myserver/axis-cgi/imagesize.cgi?camera=1
```

```
image width = 720image height = 576
```

```
http://myserver/axis-cgi/imagesize.cgi?resolution=QCIF&rotation=180&squarepixel=1&camera=1
```

```
image width = 192image height = 144
```

```
http://<servername>/axis-cgi/imagesize.cgi?camera=<value>[&<argument>=<value>...]
```

```
image width=<value>image height=<value>
```

```
<!-- [error message] -->
```

```
[error message]
```

```
http://myserver/axis-cgi/videostatus.cgi?status=1,2,3,4
```

```
HTTP 200 OKContent-Type: text/plainVideo 1 = videoVideo 2 = no videoVideo 3 = no videoVideo 4 = video
```

```
http://<servername>/axis-cgi/videostatus.cgi?<argument>=<value>
```

```
Video 1 = <information>...
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.Image.Format
```

```
Properties.Image.Format=jpeg,mjpeg,h264,h265,bitmap
```

```
http://myserver/axis-cgi/bitmap/image.bmp
```

```
http://myserver/axis-cgi/bitmap/image.bmp?resolution=320x240&camera=1
```

```
http://<servername>/axis-cgi/bitmap/image.bmp[?<argument>=<value<[&<argument>=<value>...]]
```

```
<bitmap image data>
```

```
http://myserver/axis-cgi/jpg/image.cgi?resolution=320x240&compression=25&camera=1
```

```
http://myserver/axis-cgi/jpg/image.cgi?text=1&textstring=My%20Camera&camera=2
```

```
http://<servername>/axis-cgi/jpg/image.cgi[?<argument>=<value>[&<argument>=<value>...]]
```

```
<JPEG image data>
```

```
http://myserver/axis-cgi/mjpg/video.cgi?resolution=320x240&compression=25&camera=1
```

```
http://myserver/axis-cgi/mjpg/video.cgi?fps=5
```

```
http://myserver/axis-cgi/mjpg/video.cgi?streamprofile=myprofile&resolution=CIF
```

```
http://<servername>/axis-cgi/mjpg/video.cgi[?<argument>=<value>[&<argument>=<value>...]]
```

```
--<boundary><image>--<boundary><image>
```

```
Content-Type: image/jpegContent-Length: <image size in bytes><JPEG image data>
```

```
COMMAND rtsp://<servername>/axis-media/media.amp[?<parameter>=<value>[&<parameter>=<value>...]] RTSP/1.0<CRLF>Headerfield1: val1<CRLF>Headerfield2: val2<CRLF>...<CRLF>[Body]
```

```
RTSP/1.0 <Status Code> <Reason Phrase> <CRLF>Headerfield1: val3<CRLF>Headerfield2: val4<CRLF>...[Body]
```

```
DESCRIBE rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=640x480  RTSP/1.0CSeq: 0User-Agent: Axis AMCAccept: application/sdp
```

```
RTSP/1.0 200 OKCSeq: 0Content-Type: application/sdpContent-Base: rtsp://myserver/axis-media/media.amp/Date: Wed, 16 Jul 2008 12:48:47 GMTContent-Length: 847v=0o=- 1216212527554872 1216212527554872 IN IP4 myservers=Media Presentatione=NONEc=IN IP4 0.0.0.0b=AS:50064t=0 0a=control:rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=640x480a=range:npt=0.000000-m=video 0 RTP/AVP 96b=AS:50000a=framerate:30.0a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000a=control:rtsp://myserver/axis-media/media.amp/trackID=1?videocodec=h264&resolution=640x480a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1; profile-level-id=420029;sprop-parameter-sets=Z0IAKeKQFAe2AtwEBAaQeJEV,aM48gA==m=audio 0 RTP/AVP 97b=AS:64a=control:rtsp://myserver/axis-media/media.amp/trackID=2?videocodec=h264&resolution=640x480a=rtpmap:97 mpeg4-generic/16000/1a=fmtp:97 profile-level-id=15; mode=AAC-hbr;config=1408; SizeLength=13; IndexLength=3;IndexDeltaLength=3; Profile=1; bitrate=64000;
```

```
a=transform:<MATRIX>
```

```
a=transform:0,-1,0;1,0,0;0,0,1
```

```
OPTIONS * RTSP/1.0CSeq: 1User-Agent: Axis AMCSession: 12345678
```

```
RTSP/1.0 200 OKCSeq: 1Session: 12345678Public: DESCRIBE, GET_PARAMETER, PAUSE, PLAY, SETUP, SET_PARAMETER, TEARDOWNDate: Wed, 16 Jul 2008 12:48:48 GMT
```

```
SETUP rtsp://myserver/axis-media/media.amp/trackID=1?videocodec=h264&resolution=640x480  RTSP/1.0CSeq: 2User-Agent: Axis AMCTransport: RTP/AVP;unicast;client_port=20000-20001
```

```
RTSP/1.0 200 OKCSeq: 2Session: 12345678; timeout=60Transport: RTP/AVP;unicast;client_port=20000-20001;server_port=50000-50001;ssrc=B0BA7855;mode="PLAY"Date: Wed, 16 Jul 2008 12:48:47 GMT
```

```
SETUP rtsp:///myserver//axis-media/media.amp/trackID=2?videocodec=h264&resolution=640x480  RTSP/1.0CSeq: 3User-Agent: Axis AMCTransport: RTP/AVP;unicast;client_port=20002-20003Session: 12345678
```

```
RTSP/1.0 200 OKCSeq: 3Session: 12345678; timeout=60Transport: RTP/AVP;unicast;client_port=20002-20003;server_port=50002-50003;ssrc=D7EB59C0;mode="PLAY"Date: Wed, 16 Jul 2008 12:48:48 GMT
```

```
PLAY rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=640x480 RTSP/1.0CSeq: 4User-Agent: Axis AMCSession: 12345678
```

```
RTSP/1.0 200 OKCSeq: 4Session: 12345678Range: npt=0.645272-RTP-Info: url=rtsp://myserver/axis-media/media.amp/trackID=1?videocodec=h264&resolution=640x480;seq=46932;rtptime=1027887748, url=rtsp://myserver/axis-media/media.amp/trackID=2?videocodec=h264&resolution=640x480;seq=3322;rtptime=611053482Date: Wed, 16 Jul 2008 12:48:48 GMT
```

```
PLAY rtsp://myserver/axis-media/media.amp?recordingid="myrecording"  RTSP/1.0CSeq: 4User-Agent: Axis AMCSession: 12345678
```

```
PAUSE rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=640x480 RTSP/1.0CSeq: 5User-Agent: Axis AMCSession: 12345678
```

```
RTSP/1.0 200 OKCSeq: 5Session: 12345678Date: Wed, 16 Jul 2008 12:48:49 GMT
```

```
TEARDOWN rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=640x480 RTSP/1.0CSeq: 6User-Agent: Axis AMCSession: 12345678
```

```
RTSP/1.0 200 OKCSeq: 6Session: 12345678Date: Wed, 16 Jul 2008 12:49:01 GMT
```

```
SET_PARAMETER rtsp://myserver/axis-media/media.amp RTSP/1.0CSeq: 7Session: 12345678Content-Type: text/parametersContent-Length: 19Renew-Stream: yes
```

```
RTSP/1.0 200 OKCSeq: 7Session: 12345678Date: Wed, 16 Jul 2008 13:01:25 GMT
```

```
SET_PARAMETER rtsp://myserver/axis-media/media.amp RTSP/1.0CSeq: 7Session: 12345678Require: com.axis.parameters-in-headerRenewStream: yes
```

```
RTSP/1.0 551 Option not supportedCSeq: 7Session: 12345678Unsupported: com.axis.parameters-in-headerDate: Wed, 16 Jul 2008 13:01:24 GMT
```

```
SET_PARAMETER rtsp://myserver/axis-media/media.amp RTSP/1.0CSeq: 8Session: 12345678Content-Type: text/parametersContent-Length: 19Renew-Stream: yes
```

```
RTSP/1.0 200 OKCSeq: 8Session: 12345678Date: Wed, 16 Jul 2008 13:01:25 GMT
```

```
http://<servername>/axis-media/media.amp
```

```
GET axis-media/media.amp?videocodec=h264&audio=0  HTTP/1.0x-sessioncookie: 123456789
```

```
HTTP/1.0 200 OKContent-Type: application/x-rtsp-tunnelled
```

```
POST axis-media/media.amp?videocodec=h264&audio=0  HTTP/1.0x-sessioncookie: 123456789Content-Length: 32767Content-Type: application/x-rtsp-tunnelled
```

```
DESCRIBE rtsp://myserver/axis-media/media.amp?videocodec=h264 RTSP/1.0CSeq: 14User-Agent: Axis AMCAccept: application/sdp
```

```
rtsp://<servername>/axis-media/media.amp[?<parameter>=<value>[&<parameter>=<value>...]]
```

```
http://myserver/axis-cgi/alwaysmulti.sdp?camera=1
```

```
v=0o=- 1284464363092904 1284464363092904 IN IP4 axiss=Multicast presentatione=NONEt=0 0a=range:npt=0.000000-m=video 50000 RTP/AVP 96c=IN IP4 239.225.149.138/0b=AS:50000a=framerate:25.0a=transform:1,0,0;0,1,0;0,0,1a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1; profile-level-id=420029;sprop-parameter-sets=Z0IAKeKQFgJNgScFAQXh4kRU,aM48gA==
```

```
http://<servername>/axis-cgi/param.cgi?action=listdefinitions&listformat=xmlschema&responseformat=rfc&responsecharset=utrf&group=ImageSource.I0.SceneProfile
```

```
<entry value="forensic" niceValue="Forensic" /><entry value="vivid" niceValue="Vivid" /><entry value="traffic_overview" niceValue="Traffic Overview" /><entry value="license_plate" niceValue="License Plate" />
```

```
http://<servername>/axis-cgi/param.cgi?action=update&ImageSource.I0.SceneProfile=vivid
```

```
http://myserver/axis-cgi/param.cgi?action=add&template=streamprofile&group=StreamProfile
```

```
S4 OK
```

```
http://myserver/axis-cgi/param.cgi?action=add&template=streamprofile&group=StreamProfile&StreamProfile.S.Name=myprofile2StreamProfile.S.Description=My%204CIF%20profile&StreamProfile.S.Parameters=videocodec%3dh264%26resolution%3d4CIF%26text%3d1%26textstring%3d4CIF%2520profile
```

```
S5 OK
```

```
http://myserver/axis-cgi/param.cgi?action=update&StreamProfile.S4.Name=myprofile&StreamProfile.S4.Description=My%20CIF%20profile&StreamProfile.S4.Parameters=resolution%3dCIF%26text%3d1%26textstring%3dCIF%2520 profile
```

```
OK
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=StreamProfile.S5
```

```
root.StreamProfile.S5.Name=myprofile2root.StreamProfile.S5.Description=My%204CIF%20profileroot.StreamProfile.S5.Parameters=videocodec%3dh264%26resolution%3d4CIF%26text%3d1%26textstring%3d4CIF%2520profile
```

```
http://<servername>/axis-cgi/mjpg/video.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/mjpg/video.cgi?&streamprofile=myprofile
```

```
COMMAND rtsp://<servername>/axis-media/media.amp?<argument>=<value>[&<argument>=<value>...] RTSP/1.0Headerfield1: val1<CRLF>Headerfield2: val1<CRLF>...<CRLF>[Body]
```

```
DESCRIBE rtsp://myserver/axis-media/media.amp?streamprofile=myprofile2&resolution=640x480 RTSP/1.0CSeq: 0User-Agent: Axis AMCAccept: application/sdp
```

```
Network.RTP.R0.VideoAddress="239.194.168.96"Network.RTP.R0.VideoPort="0"Network.RTP.R0.TTl="5"
```

```
rtsp://192.168.0.30/axis-media/ssm/media.amp
```

```
Network.RTP.R0.VideoPort=0
```

```
Network.RTP.R0.VideoAddress="239.194.168.96"Network.RTP.R0.VideoPort="0"Network.RTP.R0.TTL="5"
```

```
DESCRIBE rtsp://192.168.0.30:554/axis-media/ssm/media.amp RTSP/1.0CSeq: 2
```

```
CSeq: 2Content-Length: 705v=0o=- 2271184509297762952 1 IN IP4 192.168.0.30s=Session streamed with GStreameri=rtsp-serverc=IN IP4 239.194.168.96/5t=0 0a=tool:GStreamera=type:broadcasta=range:npt=now-a=control:rtsp://192.168.0.30:554/axis-media/ssm/media.ampa=source-filter: incl IN IP4 239.194.168.96 192.168.0.30m=video 0 RTP/AVP 96b=AS:50000a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0a=framerate:30.000000a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0 RTSP/1.0CSeq: 3Transport: RTP/AVP;multicast
```

```
CSeq: 3Transport: RTP/AVP;multicast;destination=239.194.168.96;ttl=5;port=50000-50001;mode="PLAY"Server: GStreamer RTSP server
```

```
Network.RTP.R0.VideoPort=40000
```

```
Network.RTP.R0.VideoAddress="239.194.168.96"Network.RTP.R0.VideoPort="40000"Network.RTP.R0.TTL="5"
```

```
DESCRIBE rtsp://192.168.0.30:554/axis-media/ssm/media.amp RTSP/1.0CSeq: 2
```

```
CSeq: 2Content-Type: application/sdpContent-Length: 705v=0o=- 2271184509297762952 1 IN IP4 192.168.0.30s=Session streamed with GStreameri=rtsp-serverc=IN IP4 239.194.168.96/5t=0 0a=tool:GStreamera=type:broadcasta=range:npt=now-a=control:rtsp://192.168.0.30:554/axis-media/ssm/media.ampa=source-filter: incl IN IP4 239.194.168.96 192.168.0.30m=video 40000 RTP/AVP 96b=AS:50000a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0a=framerate:30.000000a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0 RTSP/1.0CSeq: 3Transport: RTP/AVP;multicast
```

```
CSeq: 3Transport: RTP/AVP;multicast;destination=239.194.168.96;ttl=5;port=40000-40001;mode="PLAY"Server: GStreamer RTSP server
```

```
Network.RTP.R0.VideoPort=0Network.RTP.R0.AudioPort=0
```

```
Network.RTP.R0.VideoAddress="239.194.168.96"Network.RTP.R0.VideoPort="0"Network.RTP.R0.AudioAddress="239.194.168.224"Network.RTP.R0.AudioPort="0"Network.RTP.R0.TTL="5"
```

```
DESCRIBE rtsp://192.168.0.30:554/axis-media/ssm/media.amp?audio=1 RTSP/1.0CSeq: 2
```

```
CSeq: 2Content-Length: 1047v=0o=- 17865963052783635533 1 IN IP4 192.168.0.30s=Session streamed with GStreameri=rtsp-servert=0 0a=tool:GStreamera=type:broadcasta=range:npt=now-a=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp?audio=1a=source-filter: incl IN IP4 * 192.168.0.30m=video 0 RTP/AVP 96c=IN IP4 239.194.168.96/5b=AS:50000a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0?audio=1a=framerate:30.000000a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000m=audio 0 RTP/AVP 97c=IN IP4 239.194.168.224/5b=AS:32a=rtpmap:97 MPEG4-GENERIC/48000/1a=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1188;sizelength=13;indexlength=3;indexdeltalength=3;bitrate=32000a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=1?audio=1
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0?audio=1 RTSP/1.0CSeq: 3Transport: RTP/AVP;multicast
```

```
CSeq: 3Transport: RTP/AVP;multicast;destination=239.194.168.96;ttl=5;port=50000-50001;mode="PLAY"
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=1?audio=1 RTSP/1.0CSeq: 4Session: cFRDAXAYAqIYifvcTransport: RTP/AVP;multicast
```

```
CSeq: 4Transport: RTP/AVP;multicast;destination=239.194.168.224;ttl=5;port=50000-50001;mode="PLAY"
```

```
Network.RTP.R0.VideoPort=40000Network.RTP.R0.AudioPort=45000
```

```
Network.RTP.R0.VideoAddress="239.194.168.96"Network.RTP.R0.VideoPort="40000"Network.RTP.R0.AudioAddress="239.194.168.224"Network.RTP.R0.AudioPort="45000"Network.RTP.R0.TTL="5"
```

```
DESCRIBE rtsp://192.168.0.30:554/axis-media/ssm/media.amp?audio=1 RTSP/1.0CSeq: 2
```

```
CSeq: 2Content-Length: 1047v=0o=- 17865963052783635533 1 IN IP4 192.168.0.30s=Session streamed with GStreameri=rtsp-servert=0 0a=tool:GStreamera=type:broadcasta=range:npt=now-a=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp?audio=1a=source-filter: incl IN IP4 * 192.168.0.30m=video 40000 RTP/AVP 96c=IN IP4 239.194.168.96/5b=AS:50000a=rtpmap:96 H264/90000a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0?audio=1a=framerate:30.000000a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000m=audio 45000 RTP/AVP 97c=IN IP4 239.194.168.224/5b=AS:32a=rtpmap:97 MPEG4-GENERIC/48000/1a=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1188;sizelength=13;indexlength=3;indexdeltalength=3;bitrate=32000a=ts-refclk:locala=mediaclk:sendera=control:rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=1?audio=1
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=0?audio=1 RTSP/1.0CSeq: 3Transport: RTP/AVP;multicast
```

```
CSeq: 3Transport: RTP/AVP;multicast;destination=239.194.168.96;ttl=5;port=40000-40001;mode="PLAY"
```

```
SETUP rtsp://192.168.0.30:554/axis-media/ssm/media.amp/stream=1?audio=1 RTSP/1.0CSeq: 4Session: cFRDAXAYAqIYifvcTransport: RTP/AVP;multicast
```

```
CSeq: 4Transport: RTP/AVP;multicast;destination=239.194.168.224;ttl=5;port=45000-45001;mode="PLAY"
```

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later.

- Access control: viewer
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: image/bitmap
- Content-Length: <image size in bytes>

- Access control: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: image/jpeg
- Content-length
<image size in bytes>

- Access control: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: multipart/x-mixed-replace; boundary=<boundary>

- Property: Properties.API.RTSP.Version=2.01 and later
- Property: Properties.API.RTSP.RTSPAuth=yes

- videobitratemode
- videobitratepriority
- videobitrate
- videomaxbitrate
- videoabrtargetbitrate
- videoabrmaxbitrate
- videoabrretentiontime
- maxframesize

- Syntax: eventtopic=<filter1>[,<filter2>[...<filterN>]]

- Syntax: eventcontent=<filter>

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.40 and later.

- Property: Properties.API.HTTP.Version=3 and later.
- Property: ImageSource.I#.SceneProfile exists
- AXIS OS: 6.25 and later.
- Product category: Camera

- To list the supported Scene profiles:

- Parse the XML response.

- HTTP: 200 OK

- Switch to the Vivid scene profile (see the previous section).

- HTTP: 200 OK

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later.

- Template: streamprofile

- Method: GET

| Argument | Description |
| --- | --- |
| Supported arguments are listed in Image request arguments. |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| status=<int>[[,<int>],...] | 1 ... Product-dependent. | Check status of the listed video sources. |

| Argument | Description |
| --- | --- |
| Supported arguments are listed in Image request arguments. |  |

| Argument | Description |
| --- | --- |
| Supported arguments are listed in Image request arguments, |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| streamprofile=<string> | <stream profile name> | Use a predefined stream profile. Supported stream profile names are stored in the StreamProfile.S#.Name parameters. |
| duration=<int> | An unsigned integer | Specifies for how many seconds the video will be generated and pushed to the client.0= unlimited. |
| nbrofframes=<int> | An unsigned integer | Specifies how many frames the Axis product will generate and push.0= unlimited. |
| fps=<int> | An unsigned integer | Using fps it is possible to specify the frame rate from the Axis product.0=unlimited. |
| The arguments listed in Image request arguments. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| resolution=<string> | A string Product/release-dependent. | Resolution of the returned image. For supported resolutions, check in parameter Properties.Image.Resolution. |
| camera=<string> | 1 ... quad | Selects the video source. If omitted the default value camera=1 is used. This argument is only valid for Axis products with more than one video source. That is cameras with multiple view areas and video encoders with multiple video channels. |
| compression=<int> | 0 ... 100 (Product/release-dependent.) | Adjusts the compression level of the image. Higher values correspond to higher compression, that is lower quality and smaller image size. Note: This value is internally mapped and is therefore product-dependent. |
| rotation=<int> | 0 90 Product/release-dependent. 180 Product/release-dependent. 270 Product/release-dependent. | Rotate the image clockwise. The number of rotation alternatives in an Axis product is defined by the parameter Properties.Image.Rotation. |
| palette | Product dependent | Applies to thermal cameras. The color palette to use.Applicable if Properties.Image.Palette.StreamPalette=yes or does not exist.See Color palettes. |
| squarepixel=<int> | 0 1 | Enable/disable square pixel (aspect ratio) correction. If the parameter is set to 1 the Axis product will adjusts the aspect ratio to make it appear as intended. |

| Header field | Description |
| --- | --- |
| Authorization | Authorization information from the client. |
| CSeq | Request sequence number. |
| Session | Session identifier (returned by the Axis product in SETUP response). |
| Content-Length | Length of content. |
| Content-Type | The media type of the content. |
| User-Agent | Information about the client that initiates the request. |
| Require | Query whether an option is supported. Unsupported features are listed in the Unsupported header field. |

| Header field | Description |
| --- | --- |
| CSeq | Response sequence number (matches the sequence number of the request). |
| Session | Session identifier. |
| WWW-Authenticate | Authentication from client requested. |
| Date | Date and time of the response. |
| Unsupported | Features not supported by the Axis product. |

| Header field | Description |
| --- | --- |
| Accept | List of content types that client supports (application/sdp is the only supported type). |

| Header field | Description |
| --- | --- |
| Content-Type | Type of content (application/sdp). |
| Content-Length | Length of SDP description. |
| Content-Base | If relative URLs are used in the SDP description, this is the base URL. |

| Header field | Description |
| --- | --- |
| Public | Specify the supported RTSP commands. |

| Header field | Description |
| --- | --- |
| Transport | Specify how the data stream is transported. Supported variants are: RTP/AVP;unicast;client_port=port1-port2 RTP/AVP;multicast;port=port1-port2 RTP/AVP/TCP;unicast |

| Header field | Description |
| --- | --- |
| Blocksize | Request a specific media packet size. The packet size should be a positive decimal number measured in octets. |

| Header field | Description |
| --- | --- |
| Range | The play time period. |
| RTP-Info | Information about the RTP stream, including the sequence number of the first packet of the stream. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| AuthenticateOverHTTP | no Even if the current default behavior is not to require RTSP authentication when tunnelling through HTTP, this will probably change in the future. It is therefore strongly recommended to implement RTSP digest authentication for all clients that use RTSP over HTTP. | yes no | admin: read | Perform a RTSP authentication when tunneling RTSP over HTTP. yes = The RTSP server requests authentication. This is made regardless if the HTTP-connection is authenticated or not. no = The RTSP server will not request authentication. It is assumed that the HTTP-connection already is authenticated. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| videocodec | av1 Product/release-dependent. h264 Product/release-dependent. h265 Product/release-dependent. mpeg4 Product/release-dependent. jpeg | The selected video codec.Default: Product dependent; in order of priority: h264, h265, mpeg4, jpeg.Available values are defined by parameter Properties.Image.Format |
| streamprofile | A string | Name of a saved stream profile. A stream profile is a set of video stream parameters (including videocodec) and is defined in the HTTP API or the web GUI. Supported stream profile names are stored in the StreamProfile.S#.Name parameters. It is possible override parameter values saved in a stream profile by specifying new values after the stream profile. See Stream profiles section for details. |
| recordingid | A string | Name of a saved recording. |
| resolution | Product dependent | Specify the resolution of the returned image. Available values are defined by parameter Properties.Image.Resolution |
| audio | 0 1 | Specify whether audio shall be available in the stream (for compatibility with applications without audio control). 0 = No audio. 1 = Audio. Default: 1 |
| camera | 1 ... quad Product/release-dependent. | Select the video source or the quad stream. |
| compression | 0 … 100 Product/release-dependent. | Adjust the compression level of the image. Higher values correspond to higher compression, that is lower image quality and smaller image size.Note: This value is internally mapped and therefore product-dependent. |
| colorlevel Product/release-dependent. | 0 … 100 Product/release-dependent. | Set the level of color or grey scale.0 = Grey scale. 100 = Full color.Note: This value is internally mapped and therefore product-dependent. |
| color | 0 1 | Enable/disable color.0 = Black and white. 1 = Color. |
| palette | Product dependent | Applies to thermal cameras. The color palette to use.Applicable if Properties.Image.Palette.StreamPalette=yes or does not exist.See Color palettes. |
| clockNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | 0 1 | Show/hide the time stamp.0 = Hide. 1 = Show. |
| dateNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | 0 1 | Show/hide the date.0 = Hide. 1 = Show. |
| textNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | 0 1 | Show/hide the text.0 = Hide. 1 = Show. |
| textstringNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | A percent-encoded string | Set the text shown in the image. |
| textcolorNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | black white | Set the color of the text shown in the image. |
| textbackgroundcolorNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | black white transparent semitransparent | Set the color of the text background shown in the image. |
| rotation | 0 90 Product/release-dependent. 180 Product/release-dependent. 270 Product/release-dependent. | Rotate the image clockwise. Available values are defined by parameter Properties.Image.Rotation |
| textposNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | 0 1 | The position of the string shown in the image.0 = Top. 1 = Bottom. |
| overlayimageNote> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | 0 1 | Enable/disable overlay image.0 = Disable. 1 = Enable. |
| overlaypos=<int>,<int> overlaypos=<int>x<int>Note> This parameter has been deprecated. As of AXIS OS 10.6 it will not be possible to use it to create, remove or manipulate overlays using the URL. | Two unsigned integers | Set the x and y coordinates defining the position of the overlay image. |
| nbrofframesNote> This parameter has been deprecated and will no longer receive any updates. | An unsigned integer | Set the number of frames the Axis product will generate and push. 0 = Unlimited. |
| fps | An unsigned integer | Set the frame rate from the Axis product. 0 = Unlimited. |
| pull=<bool> | 0 1 | Optional parameter for use with the PLAY request when downloading a recording.1 = Stream as fast as possible. Should only be used when downloading a recording. Because the receiving part determines the transfer rate, this is only useful when tunneling RTSP over HTTP. 0 = Default. Pull disabled. Use this for real-time playback. |
| overlays | all text image application off | Parameter that makes it possible to show specific overlays.all: All configured overlays are visible. text: Only text overlays are visible. image: Only image overlays are visible. application: Only overlays created by an application are visible. off: No overlays are visible. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| videokeyframeinterval | An integer | Key frame interval. Please note that when using dynamic GOP mode, this value will correspond to the minimum GOP length, while videozmaxgoplength will be the maximum GOP length.Default: 32, which contains 1 I-frame and 31 P-frames. |
| videoframeskipmode | drop, empty | Determines what to do when either the rate controller or zipstream skips a frame.Set to drop means that the frame won’t be transmitted at all.Set to empty means that an empty frame will be sent in place of the actual frame. |
| videozprofile | classic storage | The Zipstream profile. Default value is classic. classic: All parameters has to be setup manually. storage: Setup parameters to optimize for storage. See setprofile.cgi for additional information. Please note that using any other profile than classic will result in dynamic GOP being handled automatically. |
| videozprofilelevel | 0... | The Zipstream profile level. See setprofile.cgi. |
| videozstrength Product/release-dependent. | See Zipstream strength. | Zipstream strength.Default: The current strength set by zipstream/setstrength.cgi. See Zipstream API. |
| videozgopmode Product/release-dependent. | fixed dynamic | Zipstream GOP mode.Default: The current GOP mode set by zipstream/setgop.cgi. See Zipstream API. |
| videozmaxgoplength Product/release-dependent. | 1 ... 1200 | Maximum GOP length for dynamic Zipstream GOP mode.Default: The current maximum GOP length set by zipstream/setgop.cgi. See Zipstream API. |
| videozfpsmode Product/release-dependent. | fixed dynamic | Zipstream FPS mode.Default: The current option to allow a dynamic fps decoding set by zipstream/setfpsmode.cgi. See Zipstream API. |
| videozminfps Product/release-dependent. | 0 ... | Minimum frame rate.Default: The current minimum frame rate set by zipstream/setminfps.cgi Zipstream API.This parameter can use either integers or fractions. Using integers means that the value can be anything between 0 and the number of fps of the stream. Fractions will equalize any negative number to 1. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| h264profile Product/release-dependent. | high Product/release-dependent. main Product/release-dependent. baseline | The H.264 profile to use. Available values are defined by parameter Properties.Image.H264.Profiles |

| Parameter | Valid values | Description |
| --- | --- | --- |
| squarepixel | 0 1 | Enable/disable square pixel (aspect ratio) correction. If the parameter is set to 1 the Axis product will adjusts the aspect ratio to make it appear as intended. |

| Argument | Valid values | Description |
| --- | --- | --- |
| audio | 0 1 | Specifies if the audio should be made available in the stream. 0 = no audio 1 = audio Default value: Configurable, see Audio.A0.Enabled in the Audio API for additional information. |
| video | 0 1 | Specifies if the video should be made available in the stream. 0 = no video 1 = video Default value: 1 |
| event | off on | Specifies if the event metadata should be made available in the stream. off = no event metadata on = event metadata Default value: off |
| eventtopic | String | A string containing the event topics filter. An empty string means that all events will be used. See the eventtopic section in Event filter parameters for the syntax. Only useful when the parameter event = on. |
| eventcontent | String | A string containing the event content filter. See the eventcontent section in Event filter parameters for the syntax. Only useful when the parameter event = on. |
| ptz | none all status position | none: No PTZ status or position information. all: Returns both PTZ status and position information. status: Returns PTZ status information. position: Returns PTZ position information. |
| analytics | off box polygon | off: No scene data in the stream. box: Scene objects is represented with a bounding box and object classification data (if the camera support or has been configured to use it). polygon: Scene objects is represented with both a polygon and a bounding box and object classification data (if the camera support or has been configured to use it). |
| ptz_pantilt_coordinate_space | generic degrees digital | Sets the coordinate space for the pan/tilt positions. Does not have any effect unless PTZ is set to either all or position. generic: Use http://www.onvif.org/ver10/tptz/PantiltSpaces/PositionGenericSpace degrees: Use http://www.onvif.org/ver10/tptz/PantiltSpaces/SphericalPositionSpaceDegrees digital: Use http://www.onvif.org/ver10/tptz/PantiltSpaces/DigitalPositionSpace |
| ptz_zoom_coordinate_space | generic digital | Sets the coordinate space for the zoom positions. Does not have any effect unless PTZ is set to either all or position. generic: Use http://www.onvif.org/ver10/tptz/ZoomSpaces/PositionGenericSpace digital: Use http://www.onvif.org/ver10/tptz/ZoomSpaces/NormalizedDigitalPosition |

| Prefix | Namespace url |
| --- | --- |
| onvif | http://www.onvif.org/ver10/topics |
| axis | http://www.axis.com/2009/event/topics |

| Parameter | Description |
| --- | --- |
| Get | Get the current scene profile settings. |
| Set | Set the scene profile settings. |

| Profile | Replacement |
| --- | --- |
| profile0 | forensic |
| profile1 | vivid |
| profile2 | traffic_overview |

| Valid values | Description |
| --- | --- |
| forensic | Profile with optimized image settings recommended for surveillance purposes. |
| vivid | Profile that add colors and produces an image with a higher contrast between dark and light areas. |
| traffic_overview | Profile that optimizes image settings for vehicle traffic monitoring. |
| indoor | Profile with optimized image settings for indoor monitoring. |
| outdoor | Profile with optimized image settings for outdoor monitoring. |
| license_plate | Profile with optimized image settings for detecting vehicle number plates. |

| User | Access control |
| --- | --- |
| admin | read, write |
| operator | read, write |
| viewer | — |

| Parameter | Valid values | Access control | Description |
| --- | --- | --- | --- |
| Name | A-Z a-z 0-9 -, _ | admin: read, write operator: read, write viewer: read | The name of the stream profile used in the requests.Note: Each profile must have a unique name. |
| Description | A string. | admin: read, write operator: read, write viewer: read | User-friendly description of the profile. |
| Parameters | <argument1>=<value1> &<argument2>=<value2> ... | admin: read, write operator: read, write viewer: read | List of arguments. See Image request arguments for a complete list.Note: The characters must be percent-encoded. |

| Argument | Valid values | Description |
| --- | --- | --- |
| streamprofile=<string> | Name of stream profile | The name of the stream profile. Supported stream profile names are stored in the StreamProfile.S#.Name parameters. |
| Additional arguments | See Image request arguments for a complete list. |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| streamprofile=<string> | Name of stream profile | The name of the stream profile. Supported stream profile names are stored in the StreamProfile.S#.Name parameters. |
| Additional arguments | See Parameter specification RTSP URL for a complete list. |  |

| Term | Description |
| --- | --- |
| RTCP | RTP Control Protocol |
| RTP | Real-Time Transport Protocol |
| SDP | Session Description Protocol |
| SSM | Source-specific Multicast |

