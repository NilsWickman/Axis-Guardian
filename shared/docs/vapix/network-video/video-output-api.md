# Video output API

**Source:** https://developer.axis.com/vapix/network-video/video-output-api/
**Last Updated:** Aug 28, 2025

---

# Video output API

## Prerequisites​

### Identification​

## Use cases​

## API documentation​

### Get schema versions​

### Get video sources​

### Set video source​

### Get mirroring​

### Set mirroring​

### Add element​

### Remove element​

### Update element​

### Get sequence​

### Clear sequence​

### Get quad view​

### Set quad view​

### Get rotation​

### Set rotation​

### Get source settings​

### Set source settings​

### Get supported CGI-API:s​

### Get active mode​

### Set active mode​

### Get PiP​

### Set PiP​

### Get dynamic overlays​

### Set dynamic overlays​

### General success response​

### General error response​

Use the Video output API to:

Settings done with this API will only affect the video output, the Image parameters set for that specific video source will have no affect on the output if this not explicitly requested through this API.

If no settings are made using the Video output API, the video stream shown on the video output will be a raw stream. In this document, a video channel or a view area (virtual video source), is referred to as "video source".

The Video output API is available on Axis devices that support HDMI and View areas and supported if:

Public view monitor

A user wants to install a video output screen as a Public view monitor in a store with the camera pointing in the same direction as the monitor, so that the customers who enter the store see themselves on the monitor. The user wants to use a mirrored (horizontally flipped) video stream, which feels more natural for the customers watching the monitor, since it generates the feeling of seeing yourself in a normal mirror. In some cases an overlay can be added to present some information to the customers entering the store.

In other cases a sequence between the video source and a bitmap source can be configured, where the bitmap source shows today’s special offers in the store. Bitmaps can be uploaded to the product using the VAPIX Overlay API. The user may want to use a rotated video stream where the monitor is installed upside down.

Surveillance

A user, who runs a store, wants a non-mirrored video stream when using video output for normal surveillance. In the store, which has four video sources, the operator wants to see all four sources at the same time using quad view to get an overview. If the monitor is small, the sequence mode where all sources are shown one after another in a sequence, can be used.

Use videooutput/getschemaversions.cgi to retrieve the supported XML schema versions.

Request

Syntax:

Responses

Responses from videooutput/getschemaversions.cgi

Success

A successful request returns the supported schema version.

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40, etc.

Use videooutput/getvideosources.cgi to retrieve available video sources from the Axis product. In the response, video sources used as video output are marked as "active".

Request

Syntax:

Response

Response from videooutput/getvideosources.cgi

Success

A successful request returns the available video sources.

Use videooutput/setvideosource.cgi to set the video source to display as video output.

Request

Syntax:

Responses

Responses from videooutput/setvideosource.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use videooutput/getmirroring.cgi to check if the video output is mirrored or not.

Request

Syntax:

Responses

Responses from videooutput/getmirroring.cgi

Success

A successful request shows if the video output is mirrored.

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40, etc.

Use videooutput/setmirroring.cgi to mirror the video output. Mirroring only affects the video output. Recordings and other video stream are not affected.

Request

Syntax:

Responses

Responses from videooutput/setmirroring.cgi

Success

If the request is successful, the video output is mirrored (or not mirrored) and a GeneralSuccess response is returned. See General success response.

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use addsequenceelement.cgi to add an element to the video/image sequence on the video output. This API returns a SequenceElementId, which can be used to remove or update the element.

Request

Syntax:

Responses

Responses from videooutput/addsequenceelement.cgi.

Successful request

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use removesequenceelement.cgi to remove an element from the video or image sequence.

Request

Syntax:

Responses

Responses from videooutput/removesequenceelement.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use updatesequenceelement.cgi to update an element in the video or image sequence on the video output.

Request

Syntax:

At least one of the fields sourceid, duration and mirror must be included in request.

Responses

Responses from videooutput/updatesequenceelement.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use getsequence.cgi to get the current video sources configured in a sequence.

Request

Syntax:

Response

Response from videooutput/getsequence.cgi

Successful request

Video sources show up as <VideoSource> tags in the order of the configured sequence.

Use clearsequence.cgi to remove the sequence.

Request

Syntax:

Responses

Responses from videooutput/clearsequence.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40

Use getquadview.cgi to get the current video sources configured in a quad view.

Request

Syntax:

Response

Response from videooutput/getquadview.cgi. The video sources are presented starting with the top left, then top right, then bottom left, and then bottom right.

Successful request

Use setquadview.cgi to configure and enable a quad view of video sources for the video output.

Request

Syntax:

Response

Response from videooutput/setquadview.cgi.

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Use getrotation.cgi to get the current rotation and available rotations on the video output.

Request

Syntax:

Response

Responses from videooutput/getrotation.cgi.

Successful request

Use setrotation.cgi to select a rotation on video output. Use getrotation.cgi to get the supported rotations.

Request

Syntax:

Responses

Responses from videooutput/setrotation.cgi.

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use getsourcesettingsenabled.cgi to get the current setting (using Image-parameters: enabled/disabled) on the available video sources.

Request

Syntax:

Response

Response from videooutput/getsourcesettingsenabled.cgi

Successful request

Use setsourcesettingsenabled.cgi to enable/disable mirroring, rotation and overlays (Image-parameters settings) on the selected video source.

Request

Syntax:

Responses

Responses from videooutput/setsourcesettingsenabled.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use getsupported.cgi to get the supported CGI-API:s for the product.

Request

Syntax:

Response

Response from videooutput/getsupported.cgi

Successful request

Use getactivemode.cgi to get all modes that are supported (none, source, quad, sequence). getactivemode.cgi also specifies if the mode is Active (true, false).

Request

Syntax:

Response

Response from videooutput/getactivemode.cgi.

Successful request

Use setactivemode.cgi to set the mode (source, sequence, or quad).

Request

Syntax:

Responses

Responses from videooutput/setactivemode.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use getpip.cgi to return the current available PiP (picture-in-picture) settings of the video output.

Request

Syntax

Response

Response from videooutput/getpip.cgi.

Successful request

A successful request returns the available video sources.

Use setpip.cgi to configure the parameters and search for the PiP (picture-in-picture).

Request

Syntax:

Responses

Responses from videooutput/setpip.cgi

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Failed request

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, etc.

Use getdynamicoverlays.cgi to return the current dynamic overlay setting.

Request

Syntax

Response

Response from videooutput/getdynamicoverlays.cgi.

Successful request

Use setdynamicoverlays.cgi to set status dynamic overlays. This will mirror dynamic overlays to hdmi outputs.

Request

Syntax

Response

Response from videooutput/setdynamicoverlays.cgi.

Successful request

If the request is successful, the video output is set to the submitted value and a GeneralSuccess response is returned. See General success response.

General success response from Video output API.

Body:

Supported elements, attributes and values:

General error response in Video output API.

Body:

Supported elements, attributes and values:

```
http://<servername>/axis-cgi/videooutput/getschemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8"?><VideoOutputResponse xmlns="http://www.axis.com/vapix/http_cgi/videooutput1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1" SchemaVersion="1.0">  <Success>    <GetSchemaVersionsSuccess>      <SchemaVersion>        <VersionNumber><schema version></VersionNumber>        <Deprecated><boolean></Deprecated>      </SchemaVersion>    </GetSchemaVersionsSuccess>  </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/getvideosources.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1"    SchemaVersion="1.0">    <Success>        <GetVideoSourcesSuccess>            <VideoSource>                <Name>[string]</Name>                <Id>[int]</Id>                <Active>[boolean]</Active>            </VideoSource>            ...            <VideoSource>                <Name>[string]</Name>                <Id>[int]</Id>                <Active>[boolean]</Active>            </VideoSource>        </GetVideoSourcesSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setvideosource.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getmirroring.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1"    SchemaVersion="1.0">    <Success>        <GetMirroringSuccess>            <MirroringEnabled>[boolean]</MirroringEnabled>        </GetMirroringSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setmirroring.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/addsequenceelement.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <AddSequenceSuccess>            <SequenceElementId>[int]</SequenceElementId>        </AddSequenceSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/removesequenceelement.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/updatesequenceelement.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getsequence.cgi?<argument>=<value>
```

```
<VideoOutputResponse xmlns="http://www.axis.com/vapix/http_cgi/videooutput1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"SchemaVersion="1.0" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">  <Success>    <GetSequenceSuccess>      <VideoSequenceElement>        <SequenceElementId>[string]</SequenceElementId>        <Source>[string]</Source>        <Duration>[int]</Duration>        <Mirror>[int]</Mirror>      </VideoSequenceElement>      <VideoSequenceElement>        <SequenceElementId>[string]</SequenceElementId>        <Source>[string]</Source>        <Duration>[int]</Duration>        <Mirror>[int]</Mirror>      </VideoSequenceElement>      ...      <VideoSequenceElement>        <SequenceElementId>[string]</SequenceElementId>        <Source>[string]</Source>        <Duration>[int]</Duration>        <Mirror>[int]</Mirror>      </VideoSequenceElement>  </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/clearsequence.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getquadview.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetQuadViewSuccess>            <QuadViewSource>                <QuadViewSource>[int]</QuadViewSource>            </QuadViewSource>            <QuadViewSource>                <QuadViewSource>[int]</QuadViewSource>            </QuadViewSource>            <QuadViewSource>                <QuadViewSource>[int]</QuadViewSource>            </QuadViewSource>            <QuadViewSource>                <QuadViewSource>[int]</QuadViewSource>            </QuadViewSource>        </GetQuadViewSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setquadview.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getrotation.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetRotationSuccess>            <Rotation>                <Degrees>[int]</Degrees>                <QuadViewSupport>[boolean]</QuadViewSupport>                <Active>[boolean]</Active>            </Rotation>            <Rotation>                <Degrees>[int]</Degrees>                <QuadViewSupport>[boolean]</QuadViewSupport>                <Active>[boolean]</Active>            </Rotation>            ...            <Rotation>                <Degrees>[int]</Degrees>                <QuadViewSupport>[boolean]</QuadViewSupport>                <Active>[boolean]</Active>            </Rotation>        </GetRotationSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setrotation.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getsourcesettingsenabled.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetSourceSettingsEnabledSuccess>            <SourceSetting>                <Id>[string]</Id>                <Enabled>[boolean]</Enabled>            </SourceSetting>            <SourceSetting>                <Id>[string]</Id>                <Enabled>[boolean]</Enabled>            </SourceSetting>            ...            <SourceSetting>                <Id>[string]</Id>                <Enabled>[boolean]</Enabled>            </SourceSetting>        </GetSourceSettingsEnabledSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setsourcesettingseanbled.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getsupported.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetSupportedSuccess>            <GetSchemaVersions>[boolean]</GetSchemaVersions>            <GetActiveMode>[boolean]</GetActiveMode>            <SetActiveMode>[boolean]</SetActiveMode>            <GetMirroring>[boolean]</GetMirroring>            <SetMirroring>[boolean]</SetMirroring>            <GetVideoSources>[boolean]</GetVideoSources>            <SetVideoSources>[boolean]</SetVideoSources>            <GetSequence>[boolean]</GetSequence>            <AddSequenceElement>[boolean]</AddSequenceElement>            <RemoveSequenceElement>[boolean]</RemoveSequenceElement>            <UpdateSequenceElement>[boolean]</UpdateSequenceElement>            <ClearSequence>[boolean]</ClearSequence>            <GetQuadView>[boolean]</GetQuadView>            <SetQuadView>[boolean]</SetQuadView>            <GetRotation>[boolean]</GetRotation>            <SetRotation>[boolean]</SetRotation>            <GetSourceSettingsEnabled>[boolean]</GetSourceSettingsEnabled>            <SetSourceSettingsEnabled>[boolean]</SetSourceSettingsEnabled>            <SetPiP>[boolean]</SetPiP>            <GetPiP>[boolean]</GetPiP>            <SetDynamicOverlays>[boolean]</SetDynamicOverlays>            <GetDynamicOverlays>[boolean]</GetDynamicOverlays>        </GetSupportedSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/getactivemode.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetActiveModeSuccess>            <Mode>                <Name>[string]</Name>                <Active>[boolean]</Active>            </Mode>            <Mode>                <Name>[string]</Name>                <Active>[boolean]</Active>            </Mode>            ...            <Mode>                <Name>[string]</Name>                <Active>[boolean]</Active>            </Mode>        </GetActiveModeSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setactivemode.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/videooutput/getpip.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetPiPSuccess>            <BorderColor>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </BorderColor>            <BorderEnabled>                <CurrentValue>[boolean]</CurrentValue>            </BorderEnabled>            <BorderWidth>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </BorderWidth>            <Height>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </Height>            <MainViewMirroring>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </MainViewMirroring>            <MainViewRotation>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </MainViewRotation>            <MainViewSource>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </MainViewSource>            <Position>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </Position>            <SubViewMirroring>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </SubViewMirroring>            <SubViewRotation>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </SubViewRotation>            <SubViewSource>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </SubViewSource>            <Width>                <CurrentValue>[string]</CurrentValue>                <AvailableValues>                    <Name>[string]</Name>                    ...                    <Name>[string]</Name>                </AvailableValues>            </Width>        </GetPiPSuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setpip.cgi?<argument>=<value>&<argument>=<value>&...
```

```
http://<servername>/axis-cgi/videooutput/getdynamicoverlays.cgi?<argument>=<value>
```

```
<VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.0"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1">    <Success>        <GetDynamicOverlaySuccess>            <DynamicOverlaysEnabled>[boolean]</DynamicOverlaysEnabled>        </GetDynamicOverlaySuccess>    </Success></VideoOutputResponse>
```

```
http://<servername>/axis-cgi/videooutput/setdynamicoverlays.cgi?<argument>=<value>&<argument>=<value>
```

```
<?xml version="1.0" encoding="UTF-8" ?><VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1"    SchemaVersion="1.0">    <Success>        <GeneralSuccess />    </Success></VideoOutputResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><VideoOutputResponse    xmlns="http://www.axis.com/vapix/http_cgi/videooutput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/videooutput1 http://www.axis.com/vapix/http_cgi/videooutput1"    SchemaVersion="1.0">    <Error>        <GeneralError>            <ErrorCode>[error code]</ErrorCode>            <ErrorDescription>[description]</ErrorDescription>        </GeneralError>    </Error></VideoOutputResponse>
```

- display video sources on a video output
- include overlays
- rotate and mirror the image
- list available sources and options

- Property: Properties.VideoOutputControl.VideoOutputControl=yes
- Property: Properties.VideoOutputControl.OutputType=[Output type]
- AXIS OS: 6.10 and later

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

| Element | Description |
| --- | --- |
| VideoOutputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetSchemaVersionsSuccess | Successful response from getschemaversions.cgi. |
| SchemaVersion | Contains one schema version. |
| VersionNumber | Schema version. See XML schemas. |
| Deprecated | If true, this version of the XML schema is deprecated and should not be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| VideoOutputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetVideoSourcesSuccess | Successful response from getvideosources.cgi. |
| VideoSource | Contains information about one video source. |
| Name | Video source name (string). |
| Id | Video source identifier (string). |
| Active | true = The video source is used for video output.false = The video source is not used for video output. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. See XML schemas. |
| id=<integer> | Integer | The video source identifier.To use video from the Axis product, enter the content of the <Id> tag returned by videooutput/getvideosources.cgi |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| VideoOutputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetMirroringSuccess | Successful response from getmirroring.cgi. |
| MirroringEnabled | true = The video output is mirrored.false = The video output is not mirrored. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. See XML schemas. |
| mirroringenabled=<string> | true, false | true = The video output is mirrored.false = The video output is not mirrored. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| source=<string> | String | Required. Specifies a video source/image to add to the sequence. If adding a video source, use the id tag received from getvideosources.cgi. If adding a bitmap, use the path to the bitmap. |
| duration=<integer> | Integer | Required. Specifies duration (in seconds) of the video source/image in the sequence. |
| mirror=<boolean> | Boolean | Specifies if the video source/image should be mirrored. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| sequenceelementid=<integer> | Integer | Required. Specifies the element to be removed from the sequence. SequenceElementId is return from addsequenceelement.cgi and getsequence.cgi. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| sequenceelementid=<integer> | Integer | Required. Specifies the element to be updated from the sequence. SequenceElementId is return from addsequenceelement.cgi and getsequence.cgi. |
| sourceid=<string> | String | Specifies what video source/image to use in the sequence element. Valid values are: Id tag received from getvideosources.cgi or a path to a bitmap. |
| duration=<integer> | Integer | Specifies duration (in seconds) of the video source/image in the sequence. |
| mirror=<boolean> | Boolean | Specifies if the video source/image should be mirrored. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| id=<int>,<int>,.. | Four <string> | Specifies the video sources to display in a quad view. The video sources are defined starting with the top left, then top right, then bottom left, and then bottom right. Id tags are obtained through getvideosources.cgi. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| rotation=<integer> | Integer | Specifies the clockwise rotation of the video output in degrees. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| id=<string> | String | Specifies the video source for the video output. Use value from Id tag from getvideosources.cgi to select source. |
| enabled=<string> | "true", "false" | Enable/disable mirroring, rotation and overlays (Image-parameters settings) on the selected video source. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| mode=<string> | "source" "sequence" "quad" "PiP" | The desired mode. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. Specifies which major version of the XML schema to use. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML schema to use for the response. |
| bordercolor=<string> | String | Set the border color.Red: 0 <= R <= 1.0Green: 0 <= G <= 1.0Blue: 0 <= B <= 1.0Example for the color Red: 1.0,0,0 |
| borderenabled=<string> | "true" or "false" | Show/hide the border for the picture-in-picture. |
| borderweight=<string> | String | Set the border weight in fractions of the picture-in-picture size, left, top, right and bottom. Example: 0.01, 0.01, 0.01, 0.01 for an equal border weight of 1 percent. |
| height=<string> | String | Height of the picture-in-picture in percentage of the output resolution height of the video output. Valid range: 0.0 < height < 1.0. |
| mainviewmirroring=<string> | "true" or "false" | If the mainview should be mirrored or not. |
| mainviewrotation=<string> | String | If the mainview should be rotated. Valid values 0/180. |
| mainviewsource=<string> | String | What camera source that should be shown in the mainview. Valid values: 1 – number of ports on the camera. |
| position=<string> | String | Position of the picture-in-picture. Valid values: "top_left", "top_right", "bottom_left", "bottom_right". |
| pipmirroring=<string> | "true" or "false" | If the picture-in-picture should be mirrored or not. |
| piprotation=<string> | String | If the picture-in-picture should be rotated. Valid values: 0/180. |
| pipsource=<string> | String | What camera source that should be shown in the picture-in-picture. Valid values: 1 – number of ports on the camera. |
| width=<string> | String | Width of the picture-in-picture in percentage of the output resolution width of the of the video output. Valid range: 0.0 < width < 1.0. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. Specifies which major version of the XML schema to use. The latest supported minor version of this is used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. Specifies which major version of the XML schema to use. The latest supported minor version of this is used. |
| dynamicoverlays=<boolean> | Boolean | Required. Enable/disable dynamic overlays. |

| Element | Description |
| --- | --- |
| VideoOutputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| GeneralSuccess | Successful request. |

| Element | Description |
| --- | --- |
| VideoOutputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Error | The request contains errors. |
| GeneralError | General error. |
| ErrorCode | A numeric error code. See table below. |
| ErrorDescription | Description of the error. |

| Error code | Description | CGI |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid value. |  |
| 30 | Invalid action. |  |
| 40 | Specified version is not supported. | All |
| 50 | Quad view is not configured. |  |
| 60 | Invalid quad view rotation. |  |
| 70 | Unsupported feature. |  |

