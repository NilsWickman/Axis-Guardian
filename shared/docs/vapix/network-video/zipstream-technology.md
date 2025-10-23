# Zipstream technology

**Source:** https://developer.axis.com/vapix/network-video/zipstream-technology/
**Last Updated:** Aug 28, 2025

---

# Zipstream technology

## Introduction​

### Identification​

### Zipstream strength​

### Zipstream GOP mode​

### Zipstream FPS mode​

### Zipstream minimum FPS mode​

### Zipstream in RTSP requests​

## Common examples​

### Set the Zipstream strength​

### List the available Zipstream strengths​

### Get the current Zipstream settings​

### Get the current Zipstream strength​

### Set the GOP data​

### List the available GOP modes​

### Get the current GOP data​

### Get supported and deprecated XML schema versions​

### Set the Zipstream FPS mode​

### List the available FPS modes​

### Set the minimum FPS​

### Get the current FPS data​

### Set the Zipstream profile​

### List available Zipstream profiles​

### Retrieve the current Zipstream profiles​

## Zipstream API​

### Description​

### Get schema versions​

### Set Zipstream strength​

### Set Zipstream GOP settings​

### Get Zipstream status​

### List Zipstream strengths​

### List Zipstream GOP modes​

### Set Zipstream FPS modes​

### List Zipstream FPS modes​

### Set minimum FPS​

### setprofile.cgi​

### listprofiles.cgi​

### General success response​

### General error response​

Zipstream is a bit rate reduction technology optimized for video surveillance that reduces the average bit rate by removing unnecessary data and makes it possible to allow higher resolutions, reduce storage cost or to keep recordings for a longer time. To reduce the bit rate, Zipstream reduces the number of bits in the areas of the image that are less interesting from a video surveillance perspective, for example the background. Image details that are important for forensic video analysis, for example faces and license plates, are preserved with enough number of bits.

Axis Zipstream technology for H.264 conforms to the H.264 standard and is compatible with third-party clients and VMS solutions that decode H.264 video. To use the Zipstream dynamic GOP mode, some clients might need to adapt their H.264 playback implementation. The fixed GOP mode works with all implementations.

For more information about Zipstream, see the Zipstream technology white paper.

If the Axis product supports Axis Zipstream technology, some Zipstream elements are enabled by default and will automatically be used when a client requests an H.264 stream. Zipstream can be used together with variable bit rate control (VBR) or with maximum bit rate control (MBR).

Zipstream is affected by the compression parameter in the RTSP request axis-media/media.amp?compression=30. When Zipstream is enabled, this parameter controls the amount of compression applied to the important forensic details. That is, compression only affects the important forensic details. Compression is usually set to 30 and this value is recommended also for Zipstream streams.

Using VAPIX, the Zipstream settings can be controlled through:

VAPIX® Zipstream API is available if

AXIS OS version 6.30 and later is required for FPS mode if root.Image.I#.MPEG.ZFpsMode exists.

Zipstream strength is a measure of the amount of bit rate savings. Increasing the strength reduces the bit rate but will also affect image quality outside the area of interest and not affect the forensic details.

By default, Axis products with Zipstream technology are configured to use strength 10 and fixed GOP mode. This setting reduces the bit rate significantly without affecting the visual image quality and is compatible with third-party clients and VMS solutions.

Zipstream strength 30 or higher (30 for cameras with AXIS OS before AXIS OS version 6.30) with dynamic GOP is recommended for cameras that are connected to the cloud and for cameras that record to SD cards and need to limit the bit rate in order to keep recordings for a longer time. To further optimize the use of storage, this setting can be combined with motion-triggered recording and/or maximum bit rate control (MBR).

The following table lists supported Zipstream strengths:

Zipstream can be used in fixed or dynamic GOP (Group of Picture) mode. Dynamic GOP will reduce bit rate even more and is recommended if the Zipstream strength is 30 or above.

The default GOP length is defined by parameter Image.I#.MPEG.PCount. In RTSP requests, the default GOP length can be overridden by videokeyframeinterval.

Using dynamic GOP can result in long key frame intervals. Depending on the H.264 playback implementation, long key frame intervals could cause problems viewing recorded video in some clients and VMS solutions.

For more information, see the Axis Zipstream Technology white paper.

There are two frame rate (fps) modes available.

It is the user’s choice to activate/deactivate this feature independently from the other Zipstream parameters.

The fps is defined by parameter Image.I#.MPEG.ZFpsMode

Some VMS might adversely affect the user experience, for example fps may reduce and the user may think the stream has frozen.

For more information, see the Axis Zipstream Technology white paper.

The minimum dynamic frame rate. This parameter is only relevant if Ziptream = ON and dynamic FPS = dynamic.

If the Axis product supports Zipstream technology for H.264, Zipstream is enabled by default and used in all RTSP streams. Zipstream settings, such as the strength and GOP mode, are defined by VAPIX® Zipstream API and will be used when a client requests an RTSP stream. Clients can override the Zipstream settings by including Zipstream URL parameters in the RTSP request.

RTSP video stream with Zipstream strength 20 and fixed GOP mode:

RTSP video stream with Zipstream strength 30 and dynamic GOP mode:

RTSP video stream with dynamic Zipstream GOP mode and maximum GOP length 400:

RTSP video stream with dynamic Zipstream GOP mode, maximum GOP length 400 and minimum GOP length 32:

RTSP video stream without Zipstream (not recommended):

RTSP video stream with fps mode dynamic:

RTSP video stream with videozminfps, set to 15 in this example (only when videozfpsmode is set to dynamic):

The RTSP API is described in Video streaming over RTSP. Available URL parameters are listed described in Parameter specification RTSP URL.

Use this example to set the Zipstream strength to 30 for channel 1:

Request

Response

Use this example to list available Zipstream strengths. For a description of the valid values, see Zipstream strength.

Request

Response

Use this example to retrieve the current Zipstream settings for all channels. All channels will be set to default if the camera parameter is omitted.

Request

Response

Use this example to receive the current Zipstream strength for channel 2.

Request

Response

The Zipstream strength is returned in the <Strength> XML element.

Use this example to set the Zipstream GOP mode to dynamic for all channels. All channels will be set to default if the camera parameter is omitted.

Request

Response

Then set the dynamic max GOP length to 300 for channel 1 using the following call:

Request

Response

Finally, try setting an invalid max GOP length. For a full list of error codes, see General error response.

Request

Response

Use this example to list the available GOP modes. Valid modes are either fixed or dynamic.

Request

Response

Use this example to retrieve the GOP data for channel 1.

Request

The GOP mode and max GOP length are returned in <GopMode> and <MaxGopLength> XML elements as seen in Get the current Zipstream settings and Get the current Zipstream strength.

Use this example to receive both supported and deprecated XML schema versions for the Zipstream technology API.

Request

Response

In this example version 2.0 is listed as supported while versions 1.0 and 1.1 are deprecated.

Use this example to set the FPS mode to dynamic for all channels. All channels will be set to default if the camera parameter is omitted.

Request

Response

Use this example to list the available FPS modes, which can be either fixed or dynamic.

Request

Response

Use this example to set the minimum FPS to 5 for all channels. All channels will be set to default if the camera parameter is omitted.

Request

Response

Use this example to receive the current FPS data for channel 1.

Request

The FPS mode and minimum FPS are returned in <FpsMode> and <MinFps> XML elements (see Get the current Zipstream settings and Get the current Zipstream strength.

Use this example to set the Zipstream profile to classic for all available channels. Please note that all channels will be set to default if this parameter is omitted.

Request

Response

Use this example to list all available Zipstream profiles (both classic and storage type).

Request

Response

Use this example to retrieve the current Zipstream profile for channel 1.

Request

Both the profile and profile level are returned as <Profile> and <ProfileLevel> XML elements as seen in the examples Get the current Zipstream settings and Get the current Zipstream strength.

VAPIX® Zipstream API is used to configure Zipstream technology. Using the API, the Axis products Zipstream settings such as the strength and GOP mode can be configured. The Zipstream settings are used for all RTSP streams but are overridden if Zipstream URL parameters are included in the RTSP request.

Supported functionality:

Zipstream is enabled by default but can be disabled by setting the strength to off.

Use zipstream/getschemaversions.cgi to retrieve the supported XML schema versions.

Request

Syntax:

Return value - Success

A successful request returns the supported schema versions.

Body:

Supported elements, attributes and values:

Use zipstream/setstrength.cgi to set the Zipstream strength. The strength can be set on all video channels or on an individual channel. The new strength will be used for new streams, ongoing streams will not be affected.

Request

Syntax:

with the following arguments and values:

Return value - Success

If the request is successful, the strength is set and a GeneralSuccess is returned. See General success response.

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40, 50

Use zipstream/setgop.cgi to set the GOP mode and the maximum GOP length. The GOP settings can be set on all video channels or on an individual video channel. The new settings will be used for new streams, ongoing streams will not be affected.

Request

Syntax:

with the following arguments and values:

Return value - Success

If the request is successful, the strength is set and a GeneralSuccess is returned. See General success response.

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40, 60, 70

Use zipstream/getstatus.cgi to retrieve the current Zipstream settings.

Request

Syntax:

with the following arguments and values:

Return value - Success

A successful request returns the current Zipstream settings.

Body:

Supported elements, attributes and values:

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use zipstream/liststrengths.cgi to retrieve the available Zipstream strengths.

Request

Syntax:

with the following arguments and values:

Return value - Success

A successful request returns available Zipstream strengths.

Body:

Supported elements, attributes and values:

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 40

Use zipstream/listgopmodes.cgi to list the available Zipstream GOP modes. See Zipstream GOP mode.

Request

Syntax:

with the following arguments and values:

Return value - Success

A successful request returns available Zipstream GOP modes.

Body:

Supported elements, attributes and values:

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 40

Use zipstream/setfpsmode.cgi to set the Zipstream FPS mode.

Request

Syntax:

Supported arguments and values:

Return value - Success

A successful request sets the Zipstream FPS modes.

Body:

Supported elements, attributes and values:

Return value - Error

If an error occurred, a GeneralError response is returned.

Use zipstream/listfpsmodes.cgi to list the available Zipstream FPS modes.

Request

Syntax:

Return value - Success

A successful request returns available Zipstream FPS modes.

Body:

Supported elements, attributes and values:

Return value - Error

If an error occurred, a GeneralError response is returned.

Use zipstream/setminfps.cgi to set the minimum FPS mode for the Zipstream.

Request

Syntax

Supported elements attributes and values:

Return value - Success

If the request is successful, a GeneralSuccess is returned. See General success response.

Return value - Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 40

Use setprofile.cgi to set the profile to classic on all available Zipstream channels.

Request

Syntax

Supported elements attributes and values:

Return value - Success

Body:

Supported elements, attributes and values:

Use listprofiles.cgi to list all available Zipstream profiles of the classic and storage types.

Request

Syntax

Supported elements attributes and values:

Return value - Success

Body:

Supported elements, attributes and values:

General success response in Zipstream API.

Body:

Supported elements, attributes and values:

General error response in Zipstream API.

Body:

Supported elements, attributes and values:

```
rtsp://myserver/axis-media/media.amp?videocodec=h264&resolution=1920x1080&videozstrength=20&videozgopmode=fixed
```

```
rtsp://myserver/axis-media/media.amp?videocodec=h264&videozstrength=30&videozgopmode=dynamic
```

```
rtsp://myserver/axis-media/media.amp?videocodec=h264&videozgopmode=dynamic&videozmaxgoplength=400
```

```
rtsp://myserver/axis-media/media.amp?videocodec=h264&videozgopmode=dynamic&videozmaxgoplength=400&videokeyframeinterval=32
```

```
rtsp://myserver/axis-media/media.amp?videocodec=h264&videozstrength=off
```

```
rtsp://myserver/axis-media/media.amp?videozfpsmode=dynamic
```

```
rtsp://myserver/axis-media/media.amp?videozminfps=15
```

```
http://myserver/axis-cgi/zipstream/setstrength.cgi?schemaversion=1&strength=30&camera=1
```

```
HTTP/1.0 200 OKContent-Type:text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/liststrengths.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>     <ListStrengthsSuccess>      <Strength>off</Strength>      <Strength>10</Strength>      <Strength>20</Strength>      <Strength>30</Strength>      <Strength>40</Strength>      <Strength>50</Strength>      ...    </ListStrengthsSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/getstatus.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GetStatusSuccess>      <Status>        <Channel>1</Channel>        <Strength>10</Strength>        <GopMode>fixed</GopMode>        <MaxGopLength>300</MaxGopLength>        <FpsMode>fixed</FpsMode>        <MinFps>0</MinFps>      </Status>      <Status>        <Channel>2</Channel>        <Strength>30</Strength>        <GopMode>dynamic</GopMode>        <MaxGopLength>100</MaxGopLength>        <FpsMode>fixed</FpsMode>        <MinFps>0</MinFps>      </Status>      <Status>        <Channel>3</Channel>        <Strength>off</Strength>        <GopMode>fixed</GopMode>        <MaxGopLength>300</MaxGopLength>        <FpsMode>fixed</FpsMode>        <MinFps>0</MinFps>      </Status>      <Status>        <Channel>4</Channel>        <Strength>off</Strength>        <GopMode>fixed</GopMode>        <MaxGopLength>300</MaxGopLength>        <FpsMode>fixed</FpsMode>        <MinFps>0</MinFps>      </Status>    </GetStatusSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/getstatus.cgi?schemaversion=1&camera=2
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GetStatusSuccess>      <Status>        <Channel>2</Channel>        <Strength>20</Strength>        <GopMode>dynamic</GopMode>        <MaxGopLength>60</MaxGopLength>        <FpsMode>fixed</FpsMode>        <MinFps>0</MinFps>      </Status>    </GetStatusSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/setgop.cgi?schemaversion=1&gopmode=dynamic
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/setgop.cgi?schemaversion=1&maxgoplength=300&camera=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/setgop.cgi?schemaversion=1&maxgoplength=100000
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Error>    <GeneralError>      <ErrorCode>70</ErrorCode>      <Description>Invalid max GOP length</Description>    </GeneralError>  </Error></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/listgopmodes.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <ListGopModesSuccess>      <GopMode>fixed</GopMode>      <GopMode>dynamic</GopMode>    </ListGopModesSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/getstatus.cgi?schemaversion=1&camera=1
```

```
http://myserver/axis-cgi/zipstream/getschemaversions.cgi
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GetSchemaVersionsSuccess>      <SchemaVersion>        <VersionNumber>1.0</VersionNumber>        <Deprecated>true</Deprecated>      </SchemaVersion>      <SchemaVersion>        <VersionNumber>1.1</VersionNumber>        <Deprecated>true</Deprecated>      </SchemaVersion>      <SchemaVersion>        <VersionNumber>2.0</VersionNumber>        <Deprecated>false</Deprecated>      </SchemaVersion>    </GetSchemaVersionsSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/setfpsmode.cgi?schemaversion=1&fpsmode=dynamic
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/listfpsmodes.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <ListFpsModesSuccess>      <FpsMode>fixed</FpsMode>      <FpsMode>dynamic</FpsMode>    </ListFpsModesSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/setminfps.cgi?schemaversion=1&minfps=5
```

```
HTTP/1.0 200 OK<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/getstatus.cgi?schemaversion=1&camera=1
```

```
http://myserver/axis-cgi/zipstream/setprofile.cgi?schemaversion=1&profile=classic&profilelevel=0
```

```
HTTP/1.0 200 OK<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.3" xmlns="http://www.axis.com/vapix/http_cgi/zipstream1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1 http://www.axis.com/vapix/http_cgi/zipstream1/zipstream1.xsd">  <Success>    <GeneralSuccess/>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/listprofiles.cgi?schemaversion=1
```

```
HTTP/1.0 200 OK<?xml version="1.0" encoding="utf-8"?><ZipStreamResponse SchemaVersion="1.3" xmlns="http://www.axis.com/vapix/http_cgi/zipstream1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1 http://www.axis.com/vapix/http_cgi/zipstream1/zipstream1.xsd">  <Success>    <ListProfilesSuccess>      <Profile>        <Name>classic</Name>        <MaxLevel>1</MaxLevel>      </Profile>      <Profile>        <Name>storage</Name>        <MaxLevel>2</MaxLevel>      </Profile>    </ListProfileSuccess>  </Success></ZipStreamResponse>
```

```
http://myserver/axis-cgi/zipstream/getstatus.cgi?schemaversion=1&camera=1
```

```
http://<servername>/axis-cgi/zipstream/getschemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GetSchemaVersionsSuccess>            <SchemaVersion>                <VersionNumber>[major.minor]</VersionNumber>                <Deprecated>[true/false]</Deprecated>            </SchemaVersion>        </GetSchemaVersionsSuccess>    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/setstrength.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/zipstream/setgop.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/zipstream/getstatus.cgi?<argument>=<value>&[<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GetStatusSuccess>            <Status>                <Channel>[channel]</Channel>                <Strength>[strength]</Strength>                <GopMode>[fixed/dynamic]</GopMode>                <MaxGopLength>[maximum GOP length]</MaxGopLength>            </Status>            ...        </GetStatusSuccess>    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/liststrengths.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <ListStrengthsSuccess>            <Strength>[value]</Strength>            <Strength>[value]</Strength>            ...        </ListStrengthsSuccess>    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/listgopmodes.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <ListGopModesSuccess>            <GopMode>[mode]</GopMode>            <GopMode>[mode]</GopMode>            ...        </ListGopModesSuccess>    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/setfpsmode.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GeneralSuccess />    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/listfpsmodes.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <ListFpsModesSuccess>            <FpsMode>[mode]</FpsMode>            <FpsMode>[mode]</FpsMode>            ...        </ListFpsModesSuccess>    </Success></ZipStreamResponse>
```

```
http://<servername/axis-cgi/zipstream/setminfps.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/zipstream/setprofile.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GeneralSuccess />    </Success></ZipStreamResponse>
```

```
http://<servername>/axis-cgi/zipstream/listprofiles.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GeneralSuccess />    </Success></ZipStreamResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Success>        <GeneralSuccess />    </Success></ZipStreamResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><ZipStreamResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/zipstream1.xsd">    <Error>        <GeneralError>            <ErrorCode>[error code]</ErrorCode>            <Description>[description]</Description>        </GeneralError>    </Error></ZipStreamResponse>
```

- Zipstream API – Retrieve and configure Zipstream settings such as the strength and GOP mode. These settings will be used for all streams unless overridden in an RTSP stream request. See Zipstream API.
- RTSP API – Specify Zipstream parameters when requesting a stream. The parameters are used only for the requested stream. See Zipstream in RTSP requests.

- Property: root.Properties.ZipStream.ZipStream=yes
- AXIS OS: 5.80 and later
- Product category: Network cameras using ARTPEC-5 and later

- List the current Zipstream settings.
- Set the Zipstream strength.
- Set the Zipstream GOP mode.
- Set the maximum Zipstream GOP length.
- Set the Zipstream FPS mode (from AXIS OS 6.30 and later).

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- Access control: admin, operator
- Method: GET

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: LIST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- Access control: Operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

| Zipstream strength | Description |
| --- | --- |
| off | Zipstream is disabled. |
| 10 20 30 40 50 | Valid Zipstream strengths. Default value: 10Increasing the strength reduces the bit rate but will also affect the visual image quality. At the default value 10, visual image quality is not affected, but as the strength increases, visual image quality is degraded in unprioritized image areas, for example the background. Image details important for forensic video analysis are kept. |
| 60 70 80 90 100 | Deprecated. |

| GOP mode | Description |
| --- | --- |
| fixed | The GOP length is fixed and set to the Axis product’s default GOP length. |
| dynamic | When possible, unnecessary I-frames are removed in order to further reduce the bit rate. The GOP length varies between the Axis product’s default GOP length and a configurable, maximum GOP length. The maximum GOP length is used for scenes with no or almost no motion; the default GOP length is used for busy scenes.Dynamic GOP mode is recommended when the Zipstream strength is 30 or above. |

| Fps mode | Description |
| --- | --- |
| fixed | The fps will be the default one set for the stream (it may vary due to rate control limitation). |
| dynamic | The dynamic fps mode shall be triggered by the motion in the scene, if using Zipstream strength of 30 or above it is recommended to use dynamic fps mode.Dynamic fps is off when Zipstream strength is set to off. |

| Minimum FPS mode | Description |
| --- | --- |
| 0 | 0 means that the FPS is allowed to go as low as the dynamic frame rate can go. If a value is greater than 0 the dynamic frame rate is not allowed to go below the specified value. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GetSchemaVersionsSuccess | Successful request |
| SchemaVersion | Contains one schema version. |
| VersionNumber | Schema version. See XML schemas. |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| camera=<string> | 1, ... | The video channel. If omitted, the Zipstream strength is set on all channels. |
| strength=<string> | See Zipstream strength | Required. The Zipstream strength to set. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| camera=<string> | 1, ... | The video channel. If omitted, the Zipstream GOP settings are set on all channels. |
| gopmode=<string> | dynamic fixed | The Zipstream GOP mode to set. If omitted, the current value will be used. |
| maxgoplength=<integer> | 1 ... 1023 | The Zipstream maximum GOP length. If omitted, the current value will be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| camera=<string> | 1, ... | The video channel. If omitted, the request returns Zipstream settings for all channels. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GetStatusSuccess | Successful request. |
| Status | Contains status information for one video channel. |
| Channel | The video channel. |
| Strength | Zipstream strength. See Zipstream strength. |
| GopMode | Zipstream GOP mode. See Zipstream GOP mode. |
| MaxGopLength | Maximum GOP length for Zipstream. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| ListStrengthsSuccess | Successful request. |
| Strength | Contains one available strength value. For available values, see Zipstream strength. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| ListGopModesSuccess | Successful request. |
| GopMode | Contains one available GOP mode. For modes, see Zipstream GOP mode. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| camera=<string> | Channel name |  |
| fpsmode=<string> | fixed, dynamic | The FPS mode. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| ListFpsModesSuccess | Successful request. |
| FpsMode | Fps mode. For modes, see Zipstream FPS mode. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas.. |
| camera<string> | 1, ... | The video channel. If omitted, the request returns Zipstream settings for all channels. |
| minfps<string> | 0, ... | The minimum FPS mode. Only relevant if FPS mode is set to dynamic. |

| Argument | Valid values | Default value | Description |
| --- | --- | --- | --- |
| schemaversion=<integer> | Integer | Must be specified | The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| camera=<string> | 1... Channel name |  | The video channel. The GOP values are set for all channels if this argument is omitted. |
| profile=<string> | classic storage | classic | The profile that should be used. |
| level=<integer> | 0... | 0 | The level of features. The 0 will be replaced with the highest available level. Please note that you should only include features included at a particular level, or the levels below it. The maximum level applicable for a specific profile can be obtained from the listprofiles.cgi response. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GeneralSuccess | Success. |

| Argument | Valid values | Default value | Description |
| --- | --- | --- | --- |
| schemaversion=<integer> | Integer | Must be specified | The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GeneralSuccess | Success. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GeneralSuccess | Success. |

| Element | Description |
| --- | --- |
| ZipStreamResponse | Contains the response to the CGI request. For information about XML schema versions, see XML schemas. |
| GeneralError | Error. |
| ErrorCode | A numeric error code. See table below. |
| Description | Description of the error. |

| Error code | Description | CGI request |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid channel. | setgop.cgi``getstatus.cgi``setstrength.cgi |
| 40 | Specified version is not supported. | All |
| 50 | Invalid Zipstream strength | setstrength.cgi |
| 60 | Invalid GOP mode. | setgop.cgi |
| 70 | Invalid maximum GOP length. | setgop.cgi |
| 80 | Invalid FPS mode. | setfpsmode.cgi |
| 90 | Invalid minimum FPS. | setminfps |

