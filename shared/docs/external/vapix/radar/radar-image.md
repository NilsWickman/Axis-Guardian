# Radar image

**Source:** https://developer.axis.com/vapix/radar/radar-image/
**Last Updated:** Aug 18, 2025

---

# Radar image

## Description​

## Overview​

### Model​

### Identification​

## Common examples​

### Reference map calibration using tracking​

### Restart calibration​

### Find calibration state​

### Abort calibration​

### Remove reference map​

### Replace background image​

### Manual calibration​

### Set color scheme​

### Set trail lifetime​

### Set grid opaque​

### Set echo visualization level​

### Get metric size​

### Get file name​

### Get supported versions​

## API specification​

### uploadRadarImage​

### replaceRadarImage​

### startCalibrationTracking​

### setCalibrationPoint​

### stopCalibrationTracking​

### abortCalibration​

### resetCalibration​

### getCalibrationState​

### setManualRadarPosition​

### setManualCalibrationPoint​

### getTrailLifetime​

### setTrailLifetime​

### getColorScheme​

### setColorScheme​

### getGridOpaque​

### setGridOpaque​

### getEchoVisualizationLevel​

### setEchoVisualizationLevel​

### getImageMetricSize​

### getFilename​

### getSupportedVersions​

## General error codes​

Use the radar image API to:

The virtual video stream consist of the following elements:

Supported CGIs:

Supported methods:

The API consists of three CGI calls which should be called using the HTTP POST method. The calls uploadradarimage.cgi and replaceradarimage.cgi use multipart/form-data for sending binaries while radarimage.cgi accept JSON formatted data. All three return JSON formatted data. This all give the user the possibility to:

Application identification

Use this example to set up a reference map and align it with the radar data to identify the position of objects detected by the radar.

Upload image and us it as background in stream:

Input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Start tracking calibration object:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set a calibration point in the image:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set another calibration point in image:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Calibration is successful so stop tracking calibration object:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

uploadRadarImage

startCalibrationTracking

setCalibrationPoint

stopCalibrationTracking

Use this example to restart the calibration process.

Restart the calibration:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

startCalibrationTracking

Use this example to find the state of the calibration in order to present the user with useful options.

Get the state of the calibration process:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getCalibrationState

Use this example to abort an ongoing calibration process and re-start it later when there are no objects entering the radars’s field of view.

Abort the calibration:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

abortCalibration

Use this example to remove the reference map and the calibrated parameters in order to move the radar unit to a different location.

Reset calibration parameters and remove the reference map:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

resetCalibration

Use this example to update the reference map without having to redo the entire calibration process.

Replace the reference map with a new:

Input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

replaceRadarImage

Use this example to calibrate the radar remotely using the API.

Set radar position:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set calibration point position:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

setManualRadarPosition

setManualCalibrationPoint

Use this example to identify tracks in the video stream through the use of color coding.

List color schemes available and current color scheme:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set color scheme:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getColorScheme

setColorScheme

Use this example to increase the time the tracked objects history should be shown on a screen to make it easier to identify from where the objects came before entering the alarm area.

Get trail lifetime and boundaries:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set trail lifetime:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getTrailLifetime

setTrailLifetime

Use this example to make the video stream less cluttered and easier to follow separate objects.

Get grid opaque:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set grid opaque:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getGridOpaque

setGridOpaque

Use this example to lower the amount of information visualized to make the video stream look less cluttered.

Get the current echo visualization level:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

Set echo visualization level:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getEchoVisualizationLevel

setEchoVisualizationLevel

Use this example to enter parameters related to the reference map in meters instead of pixels.

Get image metric size:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getImageMetricSize

Use this example to receive and verify the names of the files uploaded from the computer to the radar unit.

Get file name:

JSON input parameters

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getFilename

Use this example to check if a feature is supported before an application try to use them.

Get supported API:

JSON input parameters:

Parse the JSON response.

a. Success response example.

b. Failure response example.

API references

getSupportedVersions

Upload an image to be used as a reference map to make it easier to relate a radar track to a position.

Supported image file formats are png and jpeg.

Request

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under section General error codes.

Upload an image and replace the existing calibrated image on the security radar, while still keeping all of the related parameters.

Supported image file formats are png and jpeg.

Request

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under section General error codes.

Track the installer (user) moving away from the radar within the radar’s field of view to set calibration points.

Request

Return value: Success

Response body syntax:

Return value: Error

Response body type:

Tells the package to use the supplied coordinates and current position of the tracked object.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under section General error codes.

Stop tracking the calibration object and store the result if the calibration was successful.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under section General error codes.

Stop tracking the calibration object and reset all parameters related to the current reference map.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Reset the calibration by removing the reference map and its parameters.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return the current state of the calibration.

Request

The following table lists the JSON parameters for this CGI method.

The following table lists the possible calibration states.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Calibrate the radar manually without the need to track an object.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Calibrate the radar manually without the need to track an object.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return current lifetime of the trails as well as the minimum and maximum value for trail lifetime.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Sets how long time the trail of a tracked object should be visible in the video stream.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return the current color scheme used in the video stream and a list of possible color schemes to choose between.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Set the colorScheme to be used when generating the video stream. ColorScheme will affect the grid, the echoes and the radar trail. The getColorScheme method list the available color schemes in its JSON response.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return current opaque level of the grid as well as minimum and maximum grid opaque level.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Set the opaque level of the grid. Level of zero mean that the grid is fully transparent and level 100 mean that the grid is fully opaque.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return current level of echo visualization and a list of possible levels.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Set the level of visualization of the radar echoes, i.e. the raw responses of the electromagnetic waves the radar sensor sends out.

Request

The following table lists the JSON parameters for this CGI method.

The following table lists the echo visualization levels.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Returns the height of the video stream in meters, i.e. can be used to transform the requested video stream resolution between meters and pixels and set parameter values in meters. The API only support an aspect ratio of 16:9.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Return the name of the reference map currently displayed in the video stream.

Request

The following table lists the JSON parameters for his CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under section General error codes.

A CGI method for retrieving the supported API versions. The returned list consists of the supported major versions, with the highest supported minor versions.

Request

The following table lists the JSON parameters for this CGI method.

Return value: Success

Response body syntax:

Return value: Error

Response body syntax:

The following table lists general errors that can occur for any CGI method. Errors that are specific for a method are listed under the API description for that method.

```
The getInfo method in axis-cgi/packagemanager.cgi lists axis-rmd as active.orThe property Properties.Radar.Radar equals "yes".
```

```
http://myserver/axis-cgi/radar/uploadradarimage.cgi
```

```
HTTP/1.0Content-Type: multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>"; filename="<filename>"Content-Type: image/png<file content>--<boundary>
```

```
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "uploadRadarImage",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "uploadRadarImage",    "error": {        "code": 5000,        "message": "File type is invalid. Support .png and .jpeg."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "starCalibrationTracking",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibrationTracking",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibrationTracking",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "params": {        "x_pos": -0.2,        "y-pos": 0.9    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'image_uploaded'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "params": {        "x-pos": 0.1,        "y-pos": 0.8    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "error": {        "code": 6001,        "message": "Tracked object moved out of range."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "error": {        "code": 6002,        "message": "Not enough calibration points set for successful calibration."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "data": {        "value": "tracking"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "error": {        "code": 8000,        "message": "Internal error."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}
```

```
http://myserver/axis-cgi/radar/replaceradarimage.cgi
```

```
HTTP/1.0Content-Type: multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>"; filename"<filename>"Content-Type: image/png<file content>--<boundary>
```

```
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "replaceRadarImage",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "replaceRadarImage",    "error": {        "code": 5002,        "message": "Invalid file content."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "params": {        "x_pos": -0.5,        "y_pos": -0.5    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "params": {        "x_pos": -0.5,        "y_pos": -0.5,        "range": 20,        "angle": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "data": {        "value": "green",        "allowedValues": ["black", "green", "blue"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "params": {        "value": "blue"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value orange for 'value'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "data": {        "value": 17,        "minValue": 0,        "maxValue": 600    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "params": {        "value": 30    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value -1 for 'value'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "data": {        "value": 55,        "minValue": 0,        "maxValue": 100    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "params": {        "value": 50    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value 123 for 'value'."    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "data": {        "value": "associated",        "allowedValues": ["disable", "associated", "all"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "error": {        "code": 4003,        "message": "Could not find implementation for method getEchoVisualizationLevel"    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "params": {        "value": "disable"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "error": {        "code": 4001,        "message": "Failed to find key 'value' in JSON input"    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "data": {        "value": "57"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "error": {        "code": 4004,        "message": "Failed to load JSON from HTTP POST data"    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "data": {        "value": "west_entrance.png"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "error": {        "code": 4004,        "message": "Failed to load JSON from HTTP POST data"    }}
```

```
http://myserver/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "data": {        "value": ["1.0", "2.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
```

```
http://<servername>/axis-cgi/radar/uploadradarimage.cgi
```

```
HTTP/1.0Content-Type: Multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>", filename="<filename>"Content-Type: image/png<file content>--<boundary>
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "uploadRadarImage",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "uploadRadarImage",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/replaceradarimage.cgi
```

```
HTTP/1.0Content-Type: Multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>", filename="<filename>"Content-Type: image/png<file content>--<boundary>
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "replaceRadarImage",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "replaceRadarImage",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "startCalibrationTracking",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "startCalibrationTracking",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCalibrationPoint",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setCalibrationPoint",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "stopCalibrationTracking",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "stopCalibrationTracking",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "abortCalibration",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "abortCalibration",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "resetCalibration",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "resetCalibration",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getCalibrationState",    "data": {        "value": "tracking"    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCalibrationState",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setManualRadarPosition",    "data": {        "x_pos": -0.5,        "y_pos": 0.5    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setManualRadarPosition",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setManualCalibrationPoint",    "data": {        "x_pos": -0.5,        "y_pos": 0.5,        "range": 15.5,        "angle": -21.3    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setManualCalibrationPoint",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request.",    "method": "getTrailLifetime",    "data": {        "value": 17,        "minValue": 0,        "maxValue": 60    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getTrailLifetime",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setTrailLifetime",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setTrailLifetime",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getColorScheme",    "data": {        "value": "green",        "allowedValues": ["black", "green", "blue"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getColorScheme",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setColorScheme",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setColorScheme",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getGridOpaque",    "data": {        "value": 70,        "minValue": 0,        "maxValue": 100    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getGridOpaque",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setGridOpaque",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setGridOpaque",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getEchoVisualizationLevel",    "data": {        "value": true,        "allowedValues": ["disable", "associated", "all"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getEchoVisualizationLevel",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setEchoVisualizationLevel",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setEchoVisualizationLevel",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getImageMetricSize",    "data": {        "value": 72    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getImageMetricSize",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getFilename",    "data": {        "value": "east_courtyard.png"    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getFilename",  "error": {    "code": <error code>    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/radar/radarimage.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "value": ["1.0", "2.0"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getSupportedVersions",  "error": {    "code": <error code>    "message": "Error message"  }}
```

- configure properties of virtual video streams generated to show information from a radar sensor.
- setting up a reference map for the video stream and align the radar data.

- Background: Either a solid color or a reference map added by the user.
- Grid: Marks the radar field of view and give the user a way to determine the distance to the tracked object.
- Echoes: Raw responses from the radar sensor.
- Radar tracks: Echoes grouped together from the same object, filtered to remove uninteresting ones.
- Radar track trails: Tracks history displayed in the image.

- Upload an image and set it as a reference map.
- Replace a reference map with a new image.
- Calibrate the radar so it aligns the grid and radar tracks to a reference map.
- Fetch image parameters like color scheme, opaque level, echo visualization level, filename and trail lifetime.
- Set how long a trail should be displayed.
- Set color scheme.
- Set grid opaque.
- Set level of echo visualization.
- Request a list with the supported API versions.

- Property: Properties.Radar.Radar=yes
- Property: Properties.AddOnFramework.AddOnFramework=yes
- Property: Properties.AddOnFramework.Version=1.0 or higher
- AXIS OS: 7.10 and later
- Product category: Axis cameras with application support

- Upload image and us it as background in stream:
http://myserver/axis-cgi/radar/uploadradarimage.cgi
Input parameters:
HTTP/1.0Content-Type: multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>"; filename="<filename>"Content-Type: image/png<file content>--<boundary>
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "uploadRadarImage",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "uploadRadarImage",    "error": {        "code": 5000,        "message": "File type is invalid. Support .png and .jpeg."    }}
- Start tracking calibration object:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "starCalibrationTracking",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibrationTracking",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibrationTracking",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}
- Set a calibration point in the image:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "params": {        "x_pos": -0.2,        "y-pos": 0.9    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'image_uploaded'."    }}
- Set another calibration point in image:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "params": {        "x-pos": 0.1,        "y-pos": 0.8    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setCalibrationPoint",    "error": {        "code": 6001,        "message": "Tracked object moved out of range."    }}
- Calibration is successful so stop tracking calibration object:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "stopCalibrationTracking",    "error": {        "code": 6002,        "message": "Not enough calibration points set for successful calibration."    }}

- Restart the calibration:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "startCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}

- Get the state of the calibration process:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "data": {        "value": "tracking"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getCalibrationState",    "error": {        "code": 8000,        "message": "Internal error."    }}

- Abort the calibration:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "abortCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}

- Reset calibration parameters and remove the reference map:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "resetCalibration",    "error": {        "code": 6000,        "message": "Invalid calibration state: 'reset'."    }}

- Replace the reference map with a new:
http://myserver/axis-cgi/radar/replaceradarimage.cgi
Input parameters:
HTTP/1.0Content-Type: multipart/form-data;boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>"; filename"<filename>"Content-Type: image/png<file content>--<boundary>
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "replaceRadarImage",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "Echoed if provided by the client in the corresponding request",    "method": "replaceRadarImage",    "error": {        "code": 5002,        "message": "Invalid file content."    }}

- Set radar position:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "params": {        "x_pos": -0.5,        "y_pos": -0.5    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualRadarPosition",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
- Set calibration point position:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "params": {        "x_pos": -0.5,        "y_pos": -0.5,        "range": 20,        "angle": 0    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setManualCalibrationPoint",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}

- List color schemes available and current color scheme:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "data": {        "value": "green",        "allowedValues": ["black", "green", "blue"]    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getColorScheme",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
- Set color scheme:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "params": {        "value": "blue"    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setColorScheme",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value orange for 'value'."    }}

- Get trail lifetime and boundaries:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "data": {        "value": 17,        "minValue": 0,        "maxValue": 600    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getTrailLifetime",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
- Set trail lifetime:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "params": {        "value": 30    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setTrailLifetime",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value -1 for 'value'."    }}

- Get grid opaque:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "data": {        "value": 55,        "minValue": 0,        "maxValue": 100    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getGridOpaque",    "error": {        "code": 8001,        "message": "Unexpected error."    }}
- Set grid opaque:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "params": {        "value": 50    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setGridOpaque",    "error": {        "code": 1000,        "message": "Invalid radarimage configuration value 123 for 'value'."    }}

- Get the current echo visualization level:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "data": {        "value": "associated",        "allowedValues": ["disable", "associated", "all"]    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getEchoVisualizationLevel",    "error": {        "code": 4003,        "message": "Could not find implementation for method getEchoVisualizationLevel"    }}
- Set echo visualization level:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "params": {        "value": "disable"    }}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "data": {}}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setEchoVisualizationLevel",    "error": {        "code": 4001,        "message": "Failed to find key 'value' in JSON input"    }}

- Get image metric size:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "data": {        "value": "57"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getImageMetricSize",    "error": {        "code": 4004,        "message": "Failed to load JSON from HTTP POST data"    }}

- Get file name:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "data": {        "value": "west_entrance.png"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getFilename",    "error": {        "code": 4004,        "message": "Failed to load JSON from HTTP POST data"    }}

- Get supported API:
http://myserver/axis-cgi/radar/radarimage.cgi
JSON input parameters:
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "params": {}}
- Parse the JSON response.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "data": {        "value": ["1.0", "2.0"]    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": {        "code": 8001,        "message": "Unexpected error."    }}

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| CGI | Usage |
| --- | --- |
| uploadradarimage.cgi | Upload an image and set it as a reference map in the video stream. |
| replaceradarimage.cgi | Replace an already calibrated reference map in the video stream. |
| radarimage.cgi | Control the calibration process and handle parameters for the virtual video stream. |

| Method | Usage |
| --- | --- |
| uploadImage | Response to uploadradarimage.cgi. |
| replaceImage | Response to replaceradarimage.cgi. |
| startCalibrationTracking | Start or restart the reference map calibration using tracking. |
| setCalibrationPoint | Set the coordinates in the reference map used by the back-end to calibrate the radar. |
| stopCalibrationTracking | Stop tracking and store the result if calibration was successful. |
| abortCalibration | Stop tracking and reset all parameters related to the current reference map. |
| resetCalibration | Stop tracking, remove the current reference map and reset the parameters related to the reference map. |
| getCalibrationState | Return the current state of calibration. |
| setManualRadarPosition | Manually set a point in the reference map as the new radar position. |
| setManualCalibrationPoint | Manually set a point in the reference map used to calibrate the radar. |
| setColorScheme | Set a predefined collection of colors used for the virtual video stream. |
| getColorScheme | Get current color scheme and a list of possible color scheme values. |
| setTrailLifetime | Set how many seconds a trail should be visible. |
| getTrailLifetime | Get the current value for trail lifetime and its minimum and maximum value. |
| setGridOpaque | Set opaque value of the grid. |
| getGridOpaque | Get opaque value for the grid and minimum and maximum opaque value. |
| setEchoVisualizationLevel | Set level for the visualization of echoes. |
| getEchoVisualizationLevel | Get current setting for the visualization of echoes. |
| getImageMetricSize | Get the metric size of the image to be able to transform between pixels and meters. |
| getFilename | Get the filename for the currently used reference map. |
| getSupportedVersions | Get a list of supported API versions. |

| Code | Definition | Description |
| --- | --- | --- |
| 2001 | RESOURCE_NO_FREE_SPACE_ERROR | No free space for the file on the radar unit. |
| 5000 | FILE_TYPE_INVALID_ERROR | File type is invalid. |
| 5001 | FILE_HEADER_INVALID_ERROR | File header is invalid. |
| 5002 | FILE_CONTENT_INVALID_ERROR | File content is invalid. |
| 5003 | FILE_WRITE_TO_SYSTEM_ERROR | Error writing to file system. |

| Code | Definition | Description |
| --- | --- | --- |
| 2001 | RESOURCE_NO_FREE_SPACE_ERROR | No free space for the file on the radar unit. |
| 5000 | FILE_TYPE_INVALID_ERROR | File type is invalid. |
| 5001 | FILE_HEADER_INVALID_ERROR | File header is invalid. |
| 5002 | FILE_CONTENT_INVALID_ERROR | File content is invalid. |
| 5003 | FILE_WRITE_TO_SYSTEM_ERROR | Error writing to file system. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | startCalibrationTracking |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setCalibrationPoint |
| params | JSON object | Container for the method specific parameters listed below. |
| x_pos | Number | The x coordinate for the calibration point normalized between -1 and 1. |
| y_pos | Number | The y coordinate for the calibration point normalized between -1 and 1. |

| Code | Definition | Description |
| --- | --- | --- |
| 6001 | CALIB_OUT_OF_RANGE_ERROR | The tracked object walked out of range so tracking is lost and calibration need to be restarted. |
| 6003 | CALIB_NOT_DETECTED_ERROR | Placed first calibration point before tracking detected any object close to the radar unit. |
| 6004 | CALIB_TOO_CLOSE_TO_RADAR_ERROR | The tracked object is too close to radar. |
| 6005 | CALIB_TOO_CLOSE_TO_POINT_ERROR | The tracked object is too close to last point. |
| 6006 | CALIB_INVALID_SCALE_ERROR | Calibration resulted in invalid scale. |
| 6007 | CALIB_INVALID_POSITION_ERROR | The calculated radar direction (x, y) is too far outside of the image. |
| 6008 | CALIB_GENERAL_CALC_ERROR | The calibration calculation result is invalid so calibration should be done again. |
| 6009 | CALIB_POINT_INVALID | The calibration point is out of range -1 to 1. |
| 6010 | CALIB_OBJ_MOVING | The tracked object was moving when setting calibration point. May indicate that the wrong object is being tracked. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | stopCalibrationTracking |

| Code | Definition | Description |
| --- | --- | --- |
| 6002 | CALIB_NOT_ENOUGH_POINTS_ERROR | Need at least two calibration points to stop calibration successfully. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | abortCalibration |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | resetCalibration |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getCalibrationState |

| State | Description |
| --- | --- |
| reset | The calibration is reset back to displaying the default background and grid. |
| image_uploaded | A reference map is uploaded for calibration. |
| tracking | User have started tracking of calibration object. |
| successful | Calibration is successful but user have not stopped it yet. |
| calibrated | The reference map is calibrated successfully. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setManualRadarPosition |
| params | JSON object | Container for the method specific parameters listed below. |
| x_pos | Number | The x coordinate for the calibration point normalized between -1 and 1. |
| y_pos | Number | The y coordinate for the calibration point normalized between -1 and 1. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the add-on echoes it back in the response. |
| method | String | setManualCalibrationPoint |
| params | JSON object | Container for the method specific parameters listed below. |
| x_pos | Number | The x coordinate for the calibration point normalized between -1 and 1. |
| y_pos | Number | The y coordinate for the calibration point normalized between -1 and 1. |
| range | Number | Actual distance of the calibration point from the radar in meters. |
| angle | Number | Actual angle from the radar to the calibration point in degrees. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getTrailLifetime |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setTrailLifetime |
| params | JSON object | Container for the method specific parameters listed below. |
| value | Integer | Value for how long the trails should be in seconds. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getColorScheme |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setColorScheme |
| params | JSON object | Container for the method specific parameters listed below. |
| value | String | Color scheme used in the video stream. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getGridOpaque |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setGridOpaque |
| params | JSON object | Container for the method specific parameters listed below. |
| value | Integer | Opaque level used for the grid in the video stream. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getEchoVisualizationLevel |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | setEchoVisualizationLevel |
| params | JSON object | Container for the method specific parameters listed below. |
| value | String | Value for visualization level. |

| Name | Description |
| --- | --- |
| disable | No echoes visualized. |
| associated | Echoes associated with a track is visualized. |
| all | All echoes are visualized. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getImageMetricSize |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getFilename |

| Code | Definition | Description |
| --- | --- | --- |
| 5002 | FILE_NOT_UPLOADED_ERROR | No image file uploaded to radar. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the package echoes it back in the response. |
| method | String | getSupportedVersions |

| Code | Definition | Description |
| --- | --- | --- |
| 1000 | PARAM_INVALID_VALUE_ERROR | Invalid parameter value. |
| 2000 | RESOURCE_MEM_ERROR | Failed to allocate memory. |
| 3000 | UNSUPPORTED_API_VERSION | The requested API version is not supported. |
| 3001 | CGI_INVALID_PARAM_ERROR | A CGI parameter is missing or invalid. |
| 3002 | CGI_NOT_FOUND | The cgi name was not found. |
| 4000 | JSON_INVALID_ERROR | The provided JSON input was invalid. |
| 4001 | JSON_KEY_NOT_FOUND_ERROR | A mandatory input parameter was not found in the input. |
| 4002 | JSON_INVALID_TYPE | The type of a provided JSON parameter was incorrect. |
| 4003 | JSON_METHOD_NOT_FOUND_ERROR | The JSON method was not found. |
| 4004 | JSON_FAIL_TO_LOAD_ERROR | Failed to load JSON from HTTP POST data. |
| 6000 | CALIB_INVALID_STATE_ERROR | Can not perform command in current calibration state. |
| 8000 | INTERNAL_ERROR | Internal error. |
| 8001 | UNEXPECTED_ERROR | Unexpected error. |
| 8002 | GENERIC_ERROR | Generic error. |

