# Integrating AXIS Q6000-E

**Source:** https://developer.axis.com/vapix/network-video/integrating-axis-q6000-e/
**Last Updated:** Aug 28, 2025

---

# Integrating AXIS Q6000-E

## Configuring AXIS Q6000-E​

## Using AXIS Q6000-E​

## Remote camera control API​

### Description​

#### Identification​

### Common examples​

### Get VAPIX connection parameters​

### Set VAPIX connection parameters​

### Get VAPIX connection status​

### Get remote URL​

### XML schema versions​

### General success​

### General error​

## Remote PT Coordinate Calibration API​

### Description​

#### Identification​

### Calibrate a remote PTZ camera​

### Start calibration​

### Abort calibration​

### Select calibration target​

### On calibration target​

### Save calibration​

### Get calibration information​

### Get calibration status​

### XML schema versions​

### General success​

### General error​

## Footnotes​

The innovative AXIS Q6000-E network camera is constructed to be used together with an AXIS Q60-E PTZ camera. The four camera heads in AXIS Q6000-E provide a 360° overview and the PTZ camera offers high detail optical zoom.

AXIS Q6000-E is to be mounted on top of the AXIS Q60-E PTZ camera. When mounted correctly, a connection between the two cameras is established automatically. After software setup and calibration, an operator can control the PTZ camera’s pan, tilt and zoom movements by clicking in the image from AXIS Q6000-E. When clicking in the image and when using area zoom, the PTZ camera will be redirected to and zoom in on the object the operator clicked on.



The images above show how AXIS Q6000-E is mounted on top of the PTZ camera. The arrows in the image to the right indicate the four camera heads. For mounting instructions, see AXIS Q6000-E installation guide.

To configure AXIS Q6000-E, use the following APIs:

VAPIX® Remote camera control API

Manage the connection to a remote camera. See Remote camera control API.

VAPIX® Remote PT coordinate calibration API

Calibrate the pan and tilt coordinates in a remote camera. See Remote PT Coordinate Calibration API.

In the API descriptions, AXIS Q6000-E is referred to as the local camera and the PTZ camera is referred to as the remote camera.

The connection between AXIS Q6000-E and the PTZ camera is established automatically when the cameras are mounted. After calibration, the PTZ camera can be controlled from AXIS Q6000-E. When using area zoom or clicking in the image from AXIS Q6000-E, the remote PTZ camera will be redirected to and zoom in on the object the operator clicked on.

A client may, for example, display the four images from AXIS Q6000-E in a quad view and, at the same time, display the image from the PTZ camera in a separate window.

When sending the following area zoom command to AXIS Q6000-E, the PTZ camera will be redirected and will zoom in on the selected area.

It is also possible to use the center command (click-in-image) to control the PTZ camera:

For information about com/ptz.cgi, see PTZ control.

VAPIX® Remote camera control API is used to manage the connection to a remote camera. The connection between the local and remote camera is established automatically when the cameras are mounted correctly. The API is used to manage various connection parameters and to check the status of the connection.

The API provides the following functionality:

The Remote camera control API is supported if:

Get the connection parameters.

Request:

Response:

Set connection parameters. The parameters set in the request are only used in the connection to the remote camera, settings in the remote camera will not be changed. If a parameter is not specified, the remote camera’s current settings will be used.

Request:

Response:

Get connection status.

Request:

Response:

Use remotecameracontrol/getvapixparams.cgi to retrieve connection parameters.

Request

Syntax:

With the following arguments and values:

Response

Responses to remotecameracontrol/getvapixparams.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Success

A successful request returns information about the connection parameters.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error.

Use remotecameracontrol/setvapixparams.cgi to set connection parameters. The parameters are only used in the connection to the remote camera, settings in the remote camera will not be changed. If a parameter is not specified, the remote camera’s current settings will be used.

Request

Syntax:

With the following arguments and values:

Response

Responses to remotecameracontrol/setvapixparams.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Success

If parameters were set successfully, a GeneralSuccess response is returned. See General success.

Error

If an error occurred, a GeneralError response is returned. See General error.

Use remotecameracontrol/getvapixstatus.cgi to retrieve connection status.

Request

Syntax:

With the following arguments and values:

Response

Responses to remotecameracontrol/getvapixstatus.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Success

A successful request returns connection status.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error.

Use remotecameracontrol/getremoteurl.cgi to retrieve the URL of the remote camera.

Request

Syntax:

With the following arguments and values:

Response

Responses to remotecameracontrol/getremoteurl.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Success

A successful request returns the URL to the remote camera.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error.

The remotecameracontrol/schemaversions.cgi returns a list of supported versions of the XML schema for the Remote camera control API and whether the schemas are deprecated or not.

Request

Syntax:

This CGI has no arguments.

Response

Responses to remotecameracontrol/schemaversions.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Body:

Supported elements, attributes and values:

General success response in Remote camera control API.

The XML schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Body:

Supported elements, attributes and values:

General error response in Remote camera control API.

The XML schema is available at http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd

Body:

Supported elements, attributes and values:

VAPIX® Remote PT coordinate calibration API is used to calibrate the pan and tilt (PT) coordinates in a remote Axis PTZ camera that is connected to the local Axis product. The local Axis product is typically AXIS Q6000-E, see Integrating AXIS Q6000-E.

Calibration translates the coordinate spaces between the two cameras and is required for the Axis product to be able to accurately control the remote camera’s PTZ movements. After calibration, an operator can control the remote PTZ camera from the local Axis product by clicking in the local camera’s image or by using area zoom. The remote PTZ camera will be redirected to and zoom in on the position the operator clicked on.

The Remote PT coordinate calibration API provides the following functionality:

The Remote PT coordinate calibration API is supported if:

The following is an overview of the steps required to calibrate a remote PTZ camera using the API.

Step 1: Start calibration

Start calibration by sending the following request to the local Axis product. The request below starts calibration using camera head two.

Request:

For more information about the request, see Start calibration.

Step 2: Select first calibration target

Select the first calibration target. The calibration target is a point in the image from the camera specified in the start.cgi request. Select a point in the image that is easy to distinguish as the remote PTZ camera should be directed to the same point. The point should be specified as normalized x and y coordinates.

Request:

For more information about the request, see Select calibration target.

Step 3: Position the remote PTZ camera

Position the remote PTZ camera to center on the same point as the camera in step 2.

For information about how to control a PTZ camera using VAPIX, see Pan/tilt/zoom API.

Step 4: Save the remote position

On the local Axis product, use the ontarget.cgi request to inform the local Axis product about the remote PTZ camera’s position. If the local Axis product keeps track of the remote PTZ camera’s position, the request can be sent without arguments.

Request:

If the local Axis product does not keep track of the remote PTZ camera’s position, the remote camera’s pan and tilt coordinates must be specified in the request:

Request:

For more information about the request, see On calibration target.

Step 5: Select additional calibration targets.

Select the second calibration target:

Request:

The response to the second, third, etc selecttarget.cgi request returns approximate PT coordinates for the remote PTZ camera.

Response:

The coordinates in the response can be used to help position the remote PTZ:

Request:

When the remote PTZ camera is centered on the calibration target, save the remote position:

Request:

Continue to select calibration targets. It is recommended to use at least 4 points.

Step 6: Save calibration

When enough calibration targets have been set, the calibration data must be saved. During saving, a coordinate transformation curve is created and the calibration process is finalized.

Request:

The request returns an error if calibration is not possible, for example if too few points were selected or if one or more calibration points were too poorly matched between the local camera and the remote camera. If so, restart the calibration process using start.cgi and add calibration targets as above.

Step 7: Repeat

Repeat the calibration process for the remaining camera heads until all have been calibrated.

Use ptremotecalibration/start.cgi to start calibration.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/start.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

If the calibration was started successfully, a GeneralSuccess response is returned. See General success.

Error

If the calibration process could not be started, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 50

Use ptremotecalibration/abort.cgi to abort an ongoing calibration. All unsaved data will be lost.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/abort.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

If calibration was aborted successfully, a GeneralSuccess response is returned. See General success.

Error

If an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 54

Use ptremotecalibration/selecttarget.cgi to select a calibration target in the image from the local Axis product.

The calibration target should be specified as normalized x and y coordinates of a point in the image. Point (-1.0, -1.0) is the bottom left corner of the image, point (0.0, 0.0) is the center of the image and point (1.0, 1.0) is the upper right corner. Do not change the camera’s aspect ratio before calibration. The coordinates in the request are interpreted as normalized on an image with the same aspect ratio as the camera’s default resolution.

After sending a selecttarget.cgi request, position the remote PTZ camera to center on the same point and then send a ontarget.cgi request to the local Axis product. See Calibrate a remote PTZ camera.

If sending multiple selecttarget.cgi requests before an ontarget.cgi request, the coordinates in the last selecttarget.cgi request will be used for calibration.

The first selecttarget.cgi request returns a GeneralSuccess. Subsequent selecttarget.cgi requests return an approximation of a matching pan/tilt pair in the remote PTZ camera that can be used to make it easier to position the remote PTZ camera.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/selecttarget.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success (first calibration target)

The first successful request in each calibration process returns a GeneralSuccess response. See General success.

Success (second, third, etc target)

The second, third, etc successful request returns approximate pan and tilt coordinates for the remote PTZ camera.

Body:

Supported elements, attributes and values:

Error

If no calibration target is selected or if an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 54

Use ptremotecalibration/ontarget.cgi to inform the local Axis product that the remote PTZ camera is positioned at the point selected as calibration target.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/ontarget.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

If the PTZ camera’s position and the calibration target could be matched, a GeneralSuccess response is returned. See General success.

Error

If the PTZ camera’s position and the calibration target could not be matched, or if an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 52, 53

Use ptremotecalibration/save.cgi to save the calibration data. The save request finalizes the coordinate translation and stops the calibration process.

Saving is the last step in the calibration process. See Calibrate a remote PTZ camera. The save request saves the calibration data from the selecttarget.cgi and ontarget.cgi requests in the ongoing calibration process. After saving, the calibration sequence is stopped. Use start.cgi to start a new process.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/save.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

If the calibration data was saved and the calibration process was stopped successfully, a GeneralSuccess response is returned. See General success.

Error

If the coordinate translation is not good enough or if an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 51, 54

Use ptremotecalibration/getinformation.cgi to retrieve information about an ongoing calibration.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/getinformation.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

A successful request returns information about the ongoing calibration.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 54

Use ptremotecalibration/iscalibrated.cgi to retrieve information about calibration status. The request returns a list of all cameras and whether they are calibrated or not.

Request

Syntax:

With the following arguments and values:

Response

Responses to ptremotecalibration/iscalibrated.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Success

A successful request returns information about the cameras and their calibration status.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error.

Error codes: 10, 20, 40, 54

The ptremotecalibration/schemaversions.cgi returns a list of supported versions of the XML schema for the Remote PT coordinate calibration API and whether the schemas are deprecated or not.

Request

Syntax:

This CGI has no arguments.

Response

Responses to ptremotecalibration/schemaversions.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Body:

Supported elements, attributes and values:

General success response in Remote PT coordinate calibration API.

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Body:

Supported elements, attributes and values:

General error response in Remote PT coordinate calibration API.

The XML schema is available at http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd

Body:

Supported elements, attributes and values:

Values are product dependent. Check parameters PTZ.Limit.MaxPan and PTZ.Limit.MinPan. ↩

Values are product dependent. Check parameters PTZ.Limit.MaxTilt and PTZ.Limit.MinTilt. ↩

```
http://<Q6000-E address>/axis-cgi/com/ptz.cgi?camera=1&areazoom=0,0,300
```

```
http://<Q6000-E address>/axis-cgi/com/ptz.cgi?camera=1&center=20,50
```

```
http://<servername>/axis-cgi/remotecameracontrol/getvapixparams.cgi?schemaversion=1
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GetVapixParamsSuccess>        <BaseConnectionParams>            <MACAddress>ac:cc:8e:08:47:68</MACAddress>            <Host>169.254.0.123</Host>            <DiscoveryMode>auto</DiscoveryMode>        </BaseConnectionParams>        <VapixConnectionParams>            <HTTPPort>80</HTTPPort>            <HTTPSPort>443</HTTPSPort>            <RTSPPort>553</RTSPPort>            <Username>root</Username>        </VapixConnectionParams>    </GetVapixParamsSuccess></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/setvapixparams.cgi?schemaversion=1&password=pass
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GeneralSuccess /></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/getvapixstatus.cgi?schemaversion=1
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GetStatusSuccess>        <BaseConnectionStatus>            <StatusCode>0</StatusCode>            <Description>Connection OK</Description>        </BaseConnectionStatus>        <VapixConnectionStatus>            <HTTPStatus>                <StatusCode>0</StatusCode>                <Description>Connection OK</Description>            </HTTPStatus>            <HTTPSStatus>                <StatusCode>0</StatusCode>                <Description>Connection OK</Description>            </HTTPSStatus>            <RTSPStatus>                <StatusCode>0</StatusCode>                <Description>Connection OK</Description>            </RTSPStatus>        </VapixConnectionStatus>    </GetStatusSuccess></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/getvapixparams.cgi?<argument>=<value>[&<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GetVapixParamsSuccess>        <BaseConnectionParams>            <MACAddress>[Ethernet MAC address]</MACAddress>            <Host>[Host name, IPv4 address or IPv6 address]</Host>            <DiscoveryMode>[Address discovery mode]</DiscoveryMode>        </BaseConnectionParams>        <VapixConnectionParams>            <HTTPPort>[Port number for HTTP]</HTTPPort>            <HTTPSPort>[Port number for HTTPS]</HTTPSPort>            <RTSPPort>[Port number for RTSP]</RTSPPort>            <Username>[User name]</Username>        </VapixConnectionParams>    </GetVapixParamsSuccess></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/setvapixparams.cgi?<argument>=<value>[&<argument>=<value>]
```

```
http://<servername>/axis-cgi/remotecameracontrol/getvapixstatus.cgi?<argument>=<value>[&<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GetStatusSuccess>        <BaseConnectionStatus>            <StatusCode>[status code]</StatusCode>            <Description>[description]</Description>        </BaseConnectionStatus>        <VapixConnectionStatus>            <HTTPStatus>                <StatusCode>[status code]</StatusCode>                <Description>[description]</Description>            </HTTPStatus>            <HTTPSStatus>                <StatusCode>[status code]</StatusCode>                <Description>[description]</Description>            </HTTPSStatus>            <RTSPStatus>                <StatusCode>[status code]</StatusCode>                <Description>[description]</Description>            </RTSPStatus>        </VapixConnectionStatus>    </GetStatusSuccess></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/getremoteurl.cgi?<argument>=<value>[&<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GetRemoteURLSuccess>[URL]</GetRemoteURLSuccess></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/remotecameracontrol/schemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <SchemaVersionSuccess>        <SchemaVersion>            <VersionNumber>[major1].[minor1]</VersionNumber>            <Deprecated>[true/false]</Deprecated>        </SchemaVersion>        [...]    </SchemaVersionSuccess></RemoteCameraControlResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GeneralSuccess /></RemoteCameraControlResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RemoteCameraControlResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/RemoteCameraControl1.xsd">    <GeneralError>        <ErrorCode>[error code]</ErrorCode>        <Description>[description]</Description>    </GeneralError></RemoteCameraControlResponse>
```

```
http://<servername>/axis-cgi/ptremotecalibration/start.cgi?camera=2
```

```
http://<servername>/axis-cgi/ptremotecalibration/selecttarget.cgi?x=0.75&y=0.25
```

```
http://<servername>/axis-cgi/ptremotecalibration/ontarget.cgi
```

```
http://<servername>/axis-cgi/ptremotecalibration/ontarget.cgi?pan=124.7&tilt=44.2
```

```
http://<servername>/axis-cgi/ptremotecalibration/selecttarget.cgi?x=0.25&y=0.25
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><PTRemoteCalibrationResponse SchemaVersion="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">  <SelectTargetSuccess>    <Pan>-145.6</Pan>    <Tilt>-36.7</Tilt>  </SelectTargetSuccess></PTRemoteCalibrationResponse>
```

```
http://<remote_servername>/axis-cgi/com/ptz.cgi?pan=-145.6&tilt=-36.7
```

```
http://<servername>/axis-cgi/ptremotecalibration/ontarget.cgi
```

```
http://<servername>/axis-cgi/ptremotecalibration/save.cgi
```

```
http://<servername>/axis-cgi/ptremotecalibration/start.cgi?<argument>=<value>[&<argument>=<value>]
```

```
http://<servername>/axis-cgi/ptremotecalibration/abort.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/ptremotecalibration/selecttarget.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <SelectTargetSuccess>        <Pan>[pan coordinate]</Pan>        <Tilt>[tilt coordinate]</Tilt>    </SelectTargetSuccess></PTRemoteCalibrationResponse>
```

```
http://<servername>/axis-cgi/ptremotecalibration/ontarget.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/ptremotecalibration/save.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/ptremotecalibration/getinformation.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <GetInformationSuccess>        <Camera>[camera]</Camera>        <CurrentTarget>            <X>[x coordinate]</X>            <Y>[y coordinate]</Y>        </CurrentTarget>    </GetInformationSuccess></PTRemoteCalibrationResponse>
```

```
http://<servername>/axis-cgi/ptremotecalibration/iscalibrated.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <IsCalibratedSuccess>        <Camera>            <Id>[camera]</Id>            <Calibrated>[0,1]</Calibrated>        </Camera>        ...    </IsCalibratedSuccess></PTRemoteCalibrationResponse>
```

```
http://<servername>/axis-cgi/ptremotecalibration/schemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <SchemaVersionSuccess>        <SchemaVersion>            <VersionNumber>[major1].[minor1]</VersionNumber>            <Deprecated>[true/false]</Deprecated>        </SchemaVersion>        [...]    </SchemaVersionSuccess></PTRemoteCalibrationResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <GeneralSuccess /></PTRemoteCalibrationResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><PTRemoteCalibrationResponse    SchemaVersion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNamespaceSchemaLocation="http://www.axis.com/vapix/http_cgi/PTRemoteCalibration1.xsd">    <GeneralError>        <ErrorCode>[error code]</ErrorCode>        <Description>[description]</Description>    </GeneralError></PTRemoteCalibrationResponse>
```

- VAPIX® Remote camera control API
Manage the connection to a remote camera. See Remote camera control API.
- VAPIX® Remote PT coordinate calibration API
Calibrate the pan and tilt coordinates in a remote camera. See Remote PT Coordinate Calibration API.

- Get connection parameters
- Set connection parameters
- Get connection status
- Get remote URL

- Property: Properties.API.HTTP.Version=3
- Property: Properties.RemoteCameraControl.VAPIX=yes

- Access control: admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: GET/POST

- Access control: viewer
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: viewer
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: viewer
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Start calibration.
- Stop (abort) calibration.
- Select calibration targets.
- Match calibration targets in local and remote camera.
- Save calibration data.

- Property: Properties.API.HTTP.Version=3
- Property: Properties.PTRemoteCalibration.PTRemoteCalibration=yes

- Use com/ptz.cgi?center=<x>,<y> to center the camera at point <x>,<y>.
- Use com/ptz.cgi?query=position to retrieve the PTZ camera’s current position.

- Access control: admin
- Method: GET/POST

- Access control: admin
- Method: GET/POST

- Access control: admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: GET/POST

- Access control: admin
- Method: GET/POST

- Access control: admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Values are product dependent. Check parameters PTZ.Limit.MaxPan and PTZ.Limit.MinPan. ↩
- Values are product dependent. Check parameters PTZ.Limit.MaxTilt and PTZ.Limit.MinTilt. ↩

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GetVapixParamsSuccess | Successful request |  |  |
| BaseConnectionParams | Contains base connection parameters |  |  |
| MACAddress | The remote camera’s Ethernet MAC address. |  |  |
| Host | The host name, IPv4 address or IPv6 address used when connecting to the remote camera. |  |  |
| DiscoveryMode | Address discovery mode: auto = automatic mode manual = manual mode The discovery modes are described in section Set VAPIX connection parameters. |  |  |
| VapixConnectionParams | Contains VAPIX connection parameters |  |  |
| HTTPPort | The HTTP port used in the connection to the remote camera. |  |  |
| HTTPSPort | The HTTPS port used in the connection to the remote camera. |  |  |
| RTSPPort | The RTSP port used in the connection to the remote camera. |  |  |
| Username | User name for a user account on the remote camera. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |
| host=<string> | Host address or IP address | The remote camera’s host address, IPv4 address or IPv6 address. |
| discoverymode=<string> | auto manual | Address discovery mode.auto = Automatic mode. In automatic mode, the local camera discovers the remote camera’s IPv4 address automatically.manual = Manual mode. The remote camera’s address is not discovered automatically and must be set using the host argument. If using IPv6 addresses, manual mode and the host argument must be used.Default: auto |
| httpport=<integer> | 1 ... 65535 | The remote camera’s HTTP port.Default: The remote camera’s current HTTP port setting. |
| httpsport=<integer> | 1 ... 65535 | The remote camera’s HTTPS port.Default: The remote camera’s current HTTPS port setting. |
| rtspport=<integer> | 1 ... 65535 | The remote camera’s RTSP port.Default: The remote camera’s current RTSP port setting. |
| username=<string> | String | User name for a user account on the remote camera. |
| password=<string> | String | Password for the user account. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GetStatusSuccess | Successful request |  |  |
| BaseConnectionStatus | Contains base connection status. |  |  |
| StatusCode | Status code. See table below. |  |  |
| Description | Status description. |  |  |
| VapixConnectionStatus | Contains VAPIX connection status. |  |  |
| HTTPStatus | HTTP connection status. |  |  |
| HTTPSStatus | HTTPS connection status. |  |  |
| RTSPStatus | RTSP connection status. |  |  |

| Status code | Description |
| --- | --- |
| 0 | Connection OK. |
| 1 | Trying to connect. |
| 2 | No connection. |
| 3 | Not authorized. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GetRemoteURLSuccess | Successful request. Contains the URL to the remote camera. |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| SchemaVersionSuccess | Successful request |  |  |
| SchemaVersion | Supported version of the XML Schema. |  |  |
| VersionNumber | The version number of the XML Schema in the form [major].[minor] Example: 1.0 |  |  |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. Default: false |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GeneralSuccess | Successful request |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RemoteCameraControlResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GeneralError | Error |  |  |
| ErrorCode | A numeric error code. See table below. |  |  |
| ErrorDescription | Description of the error |  |  |

| Error code | Description | CGI request |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid request. | All |
| 40 | Specified version is not supported. | All |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |
| camera=<integer> | 1,2, .. n (Product dependent. The number of supported cameras is given by parameter ImageSource.NbrOfSources) | The camera to use for calibration.Default: 1 |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |
| x=<double> | Normalized coordinate | The x coordinate using the local Axis product’s coordinate system. For more information, see Select calibration target. |
| y=<double> | Normalized coordinate | The y coordinate using the local Axis product’s coordinate system. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| SelectTargetSuccess | Successful response. |  |  |
| Pan | Approximate value for the remote PTZ camera’s pan coordinate.Unit: degrees. |  |  |
| Tilt | Approximate value for the remote PTZ camera’s tilt coordinate.Unit: degrees. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |
| pan=<double> | Product-dependent(1) | Pan coordinate (in degrees) of the remote PTZ camera. If not specified, the coordinate is read from local status. |
| tilt=<double> | Product-dependent(2) | Tilt coordinate (in degrees) of the remote PTZ camera. If not specified, the coordinate is read from local status. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GetInformationSuccess | Successful request |  |  |
| Camera | The local camera (camera head) used in the calibration process. |  |  |
| CurrentTarget | The current calibration target. |  |  |
| X | Normalized x pixel coordinate of current calibration target. |  |  |
| Y | Normalized y pixel coordinate of current calibration target. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer>[.<integer>] | Integers | The version of the XML Schema to use for the response.The schema version should be in the form major.minor where major is the major version and minor is the minor version. The major version is required. If the minor version is not specified, the latest minor version will be used. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| IsCalibratedSuccess | Successful request |  |  |
| Camera | Information about one camera. |  |  |
| Id | The camera number. |  |  |
| Calibrated | 0 = Camera is not calibrated. 1 = Camera is calibrated. |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| SchemaVersionSuccess | Successful request |  |  |
| SchemaVersion | Supported version of the XML Schema. |  |  |
| VersionNumber | The version number of the XML Schema in the form [major].[minor] Example: 1.0 |  |  |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. Default: false |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GeneralSuccess | Successful request |  |  |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| PTRemoteCalibrationResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated and the response should not be used. false = SchemaVersion is not deprecated. |
| GeneralError | Error |  |  |
| ErrorCode | A numeric error code. See table below. |  |  |
| ErrorDescription | Description of the error |  |  |

| Error code | Description | CGI request |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid request. | All |
| 40 | Specified version is not supported. | All |
| 50 | Calibration is already ongoing. It is not possible to start a new calibration. | start.cgi |
| 51 | A satisfying coordinate matching could not be found. | save.cgi |
| 52 | The pan/tilt coordinates and the selected pixel coordinates (x and y) could not be matched. | ontarget.cgi |
| 53 | No pixel coordinates are selected. | ontarget.cgi |
| 54 | No calibration is ongoing. | abort.cgi, getinformation.cgi, ontarget.cgi, save.cgi, selecttarget.cgi |

