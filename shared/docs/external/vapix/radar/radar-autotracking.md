# Radar autotracking

**Source:** https://developer.axis.com/vapix/radar/radar-autotracking/
**Last Updated:** Aug 18, 2025

---

# Radar autotracking

## Description​

### Model​

### Identification​

## Common examples​

### Camera connection​

### Adjust camera mounting height​

### Adjust camera pan offset​

### Save camera pan offset​

### Adjust camera tilt offset​

### Save camera tilt offset​

### Adjust camera zoom degree​

### Enable/disable tracking​

### Enable/disable guard tour​

### Adjust guard tour time​

### Enable/disable return to home​

### Adjust return to home timeout​

### Adjust object types to track​

### Supported capabilities​

### Get supported versions​

### Camera connection state event​

## API specification​

### getCameraConnection​

### setCameraConnection​

### getCameraMountingHeight​

### setCameraMountingHeight​

### getCameraPanOffset​

### setCameraPanOffset​

### saveCameraPanOffset​

### getCameraTiltOffset​

### setCameraTiltOffset​

### saveCameraTiltOffset​

### getCameraZoomDegree​

### setCameraZoomDegree​

### getTrackingEnabled​

### setTrackingEnabled​

### getGuardTourEnabled​

### setGuardTourEnabled​

### getGuardTourTime​

### setGuardTourTime​

### getReturnToHomeEnabled​

### setReturnToHomeEnabled​

### getReturnToHomeTimeout​

### setReturnToHomeTimeout​

### getObjectTypesToTrack​

### setObjectTypesToTrack​

### getCapabilities​

### getSupportedVersions​

### General error codes​

The Axis Radar autotracking API makes it possible to configure the behavior of the autotracking software run on a radar unit such as the D2050–VE. The unit itself controls a PTZ camera through the ptz.cgi, which makes it possible to view the objects detected by the radar. The API can configure parameters such as PTZ camera IP address, credentials and mounting height and it can also be queried for information regarding Radar autotracking capabilities.

The API is built around the radar-autotracking.cgi, which makes it possible to control camera connections, camera mounting height, adjusting the camera pan/tilt offsets and switching the tracking between on and off.

The CGI consists of the following methods:

Use this example to configure the connection between the radar and camera. This is done during the setup process by entering the IP address of the camera and its login credentials, all of which can be cross-checked later on. The example also includes the steps required to receive the current IP address and credentials for the camera.

JSON request example

a) Successful response example that presents the current camera connection.

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCameraConnection

setCameraConnection

Use this example to cross-check the mounting height of the camera sensor, which was originally entered during the setup process.

JSON request example

a) Successful response example presenting the current mounting height and the allowed values (in meters).

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCameraMountingHeight

setCameraMountingHeight

Use this example to adjust the pan offset of the camera. This has to be done during the setup process, as the radar module needs to know what camera pan angle that corresponds to its own angle from the start.

JSON request example

a) Successful response example that presents the current camera pan offset and allowed value (in degrees).

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCameraPanOffset

setCameraPanOffset

Use this example to save the current camera pan position as a camera pan offset value. Once you have established a connection to the camera during the setup process, you will also be able to align the camera to the radar’s straight ahead direction and save this position as the camera’s pan offset.

JSON request example

a) Successful response example:

b) Failed response example:

API references

saveCameraPanOffset

Use this example to adjust the tilt offset of the camera. This has to be done during the setup process and makes the tilt offset adjust to the slope of the ground.

JSON request example

a) Successful response example that presents the current camera tilt offset and allowed values (in degrees).

b. Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCameraTiltOffset

setCameraTiltOffset

Use this example to save the current camera tilt position as a camera tilt offset value. This can be done once a connection to the camera has been established during the setup process and it becomes possible to aim the camera at the horizon and save the position as the camera tilt offset.

JSON request example

a) Successful response example.

b) Failed response example.

API references

saveCameraTiltOffset

Use this example to adjust the zoom degree of the camera. This is useful when the ground is uneven and less zoom is required to get a tracked object into the field of view of the camera.

JSON request example

a) Successful response example that will present the current camera zoom degree and the allowed values (in percent).

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCameraZoomDegree

setCameraZoomDegree

Use this example to enable or disable the tracking that is performed by the radar PTZ tracking software. When tracking is enabled, the PTZ camera is controlled by the Radar autotracking software whenever an object is detected by the radar.

JSON request example

a) Successful response example.

b) Failed response example.

JSON request example

a) Successful response example.

b) Failure response example.

API references

getTrackingEnabled

setTrackingEnabled

Use this example to enable or disable a guard tour between objects detected by the radar. When it is enabled, the Radar autotracking software will direct the PTZ at the objects detected in chronological order.

JSON request example

a) Successful response example.

b) Failure response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getGuardTourEnabled

setGuardTourEnabled

Use this example to adjust the time that the PTZ remains on each object during the guard tour. When the guard tour is enabled in the Radar autotracking software the PTZ will be directed to each object detected by the radar. The PTZ lingering time on each object depends on the configured guard tour time.

JSON request example

a) Successful response example that will present the current mounting height and the allowed values (in meters).

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getGuardTourTime

setGuardTourTime

Use this example to enable or disable the return to home-function. When it is enabled, the PTZ will be redirected towards the home position after an adjustable timeout.

JSON request example

a) Successful response example. The response will give you the currently enabled status.

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

getReturnToHomeEnabled

setReturnToHomeEnabled

Use this example to adjust the timeout of the return to home function and receive information on the min/max limit of the timeout. Once the return to home function is enabled, the PTZ will be redirected towards the home position after the timeout.

JSON request example

a) Successful response example that will present the current timeout value as well as its min/max values for the timeout (in seconds).

b) Failed response example.

JSON request example

a) Success response example.

b) Failure response example.

API references

getReturnToHomeTimeout

setReturnToHomeTimeout

Use this example to select which type of objects you want to track. The objects are divided into one of the following categories: small, humans, vehicles and unknown, and whenever any of them have been selected, the autotracking software will direct the PTZ camera towards that particular object upon detection.

JSON request example

a) Successful response example that will present the currently enabled tracking status for different objects types to track.

b) Failed response example.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getObjectTypesToTrack

setObjectTypesToTrack

An API might exist in several different versions and supported capabilities may differ depending on what version you are using. This example will show you how to check which capabilities you can access from a particular version of Radar autotracking.

JSON request example

a) Successful response example.

b) Failed response example.

API references

getCapabilities

Use this example to implement an application that uses Axis Radar autotracking. As an application might exists in several different versions, this example will show you how to write code that will check if the API version is supported before using the application.

JSON input parameters

a) Successful response example.

b) Failed response example.

API references

getSupportedVersions

Use this example to receive information when the Radar module gets connected/disconnected to the PTZ camera or when auto tuning is run.

Start a subscription to the camera connection state event.

This CGI method can be used to retrieve the current camera connection.

Request

getCameraConnection data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the camera connection of the radar. Once the new connection parameters are set an attempt to establish a connection will be made. Using an empty IP address will cause a disconnect. Information on connection state can be found in getCameraConnection.

Request

setCameraConnection data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed General error codes.

This CGI method can be used to retrieve the current mounting height and its allowed values.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the mounting height of the radar. Information on allowed values can be found in getCameraMountingHeight.

Request

setCameraMountingHeight data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current camera pan offset and its allowed values.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the camera pan offset of the radar. Information on allowed values can be found in getCameraPanOffset.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to read the current pan position from a connected camera and save it as a camera pan offset.

Request

saveCameraPanOffset data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Specific error codes for saveCameraPanOffset

General errors are listed in General error codes.

This CGI method can be used to retrieve the current camera tilt offset and its allowed values.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the camera tilt offset of the radar. Information on allowed values can be found in getCameraTiltOffset.

Request

setCameraTiltOffset data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to read the current tilt position from a connected camera and save it as a camera tilt offset.

Request

saveCameraTiltOffset data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes for saveCameraTiltOffset

General errors are listed in General error codes.

This CGI method can be used to retrieve the current zoom degree and its allowed values.

Request

getCameraZoomDegree data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the zoom degree (in percent) of the camera. Information on allowed values can be found in getCameraZoomDegree.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current status of the enabled tracking.

Request

Return value - Success

Response body syntax

Return value- Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to either enable or disable the radar tracking.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current status of the enabled guard tour.

Request

Return value - Success

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to either enable or disable the guard tour.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current guard tour time and its allowed values.

Request

getGuardTourTime data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the guard tour time. Information on allowed values can be found in getGuardTourTime.

Request

setGuardTourTime data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current status of return to home enabled.

Request

getReturnToHomeEnabled data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set return to home to enabled.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the current return to home timeout as well as its min/max values.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the return to home timeout.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve the currently enabled tracking status for different object types.

Request

getObjectTypesToTrack data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to set the enabled tracking status for different object types.

Request

setObjectTypesToTrack data parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to check which capabilities you can access from a particular version of the API. An API might exist in several different versions and the supported capabilities may differ depending on what version you are using.

Request

getCapabilities

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This CGI method can be used to retrieve supported API versions. The response consists of a list with the supported major versions and the highest supported minor versions. Please note that the version number is for the API as a whole and not for individual methods in the CGI.

Request

Return value

Response body syntax

The following table lists the general errors that can occur for any of the CGI methods. Method specific errors are listed in the API description for that method.

General error codes

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraConnection",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraConnection",    "data": {        "ip": "192.168.0.91",        "user": "operator",        "state": "connected"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraConnection",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraConnection",    "params": {        "ip": "192.168.0.91",        "user": "operator",        "pass": "secret"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraConnection",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setCameraConnection",    "error": {        "code": 300,        "message": "Invalid value '192.168.0.91' for parameter 'ip'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraMountingHeight",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraMountingHeight",    "data": {        "value": 5.1,        "minValue": 1.0,        "maxValue": 16.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraMountingHeight",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraMountingHeight",    "params": {        "value": 5.1    }}
```

```
{    "apiVersions": "1.0",    "context": "context",    "method": "setCameraMountingHeight",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setCameraMountingHeight",    "error": {        "code": 300,        "message": "Invalid value '8.1000' for parameter 'value'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraPanOffset",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraPanOffset",    "data": {        "value": 118.35,        "minValue": -360.0,        "maxValue": 360.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraPanOffet",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis.cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraPanOffset",    "params": {        "value": 118.35    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraPanOffset",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setCameraPanOffset",    "error": {        "code": 300,        "message": "Invalid value '375.1200' for parameter 'value'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "saveCameraPanOffset",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "saveCameraPanOffset",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "saveCameraPanOffset",    "error": {        "code": 301,        "message": "No camera connected"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraTiltOffset",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraTiltOffset",    "data": {        "value": -2.7,        "minValue": -10.0,        "maxValue": 10.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraTiltOffset",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraTiltOffset",    "params": {        "value": -1.2    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraTiltOffset",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setCameraTiltOffset",    "error": {        "code": 300,        "message": "Invalid value '-10.1000' for parameter 'value'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "saveCameraTiltOffset",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "saveCameraTiltOffset",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "saveCameraTiltOffset",    "error": {        "code": 301,        "message": "No camera connected"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraZoomDegree",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraZoomDegree",    "data": {        "value": 50.0,        "minValue": 0.0,        "maxValue": 100.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCameraZoomDegree",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraZoomDegree",    "params": {        "value": 50.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setCameraZoomDegree",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setCameraZoomDegree",    "error": {        "code": 300,        "message": "Invalid value '100.10' for parameter 'value'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getTrackingEnabled",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getTrackingEnabled",    "data": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getTrackingEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setTrackingEnabled",    "params": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setTrackingEnabled",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setTrackingEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourEnabled",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourEnabled",    "data": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setGuardTourEnabled",    "params": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setGuardTourEnabled",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setGuardTourEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourTime",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourTime",    "data": {        "value": 4.0,        "minValue": 1.0,        "maxValue": 60.0    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getGuardTourTime",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setGuardTourTime",    "params": {        "value": 1.5    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setGuardTourTime",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setGuardTourTime",    "error": {        "code": 300,        "message": "Invalid value '0.5000' for parameter 'value'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeEnabled",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeEnabled",    "data": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setReturnToHomeEnabled",    "params": {        "value": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setReturnToHomeEnabled",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setReturnToHomeEnabled",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeTimeout",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeTimeout",    "data": {        "value": 5,        "minValue": 1,        "maxValue": 300    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getReturnToHomeTimeout",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setReturnToHomeTimeout",    "params": {        "value": 5    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setReturnToHomeTimeout",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setReturnToHomeTimeout",    "error": {        "code": 300,        "message": "Invalid value '1000' for parameter 'timeout'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getObjectTypesToTrack",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getObjectTypesToTrack",    "data": {        "small": false,        "human": true,        "vehicle": true,        "unknown": false    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getObjectTypesToTrack",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setObjectTypesToTrack",    "params": {        "small": false,        "human": true,        "vehicle": true,        "unknown": false    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setObjectTypesToTrack",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "setObjectTypesToTrack",    "error": {        "code": 300,        "message": "Invalid value '100' for parameter 'small'"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCapabilities",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCapabilities",    "data": {        "returnToHomeEnabled": {},        "returnToHomeTimeout": {            "minValue": 1,            "maxValue": 300        },        "objectTypesToTrack": {            "types": ["small", "human", "vehicle", "unknown"]        }    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getCapabilities",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersions": "1.0",    "context": "context",    "method": "getSupportedVersions",    "error": {        "code": 200,        "message": "JSON input error"    }}
```

```
rtsp://<servername>/axis-media/media.amp?event=on&eventtopic=axis:RadarAutotracking/CameraConnection
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraConnection",  "data": {    "ip": ip address to the PTZ camera,    "user": user name to login to the PTZ camera,    "state": state of the connection, possible values: disconnected, connecting, autotune, connected or connect_failed  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraConnection",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCameraConnection",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setCameraConnection",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided be the client in the corresponding request",  "method":"getCameraMountingHeight",  "data": {    "value": mounting height in meters,    "minValue": minimum height in meters,    "maxValue": maximum height in meters  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setMountingHeight",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setMountingHeight";  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraPanOffset",  "data": {    "value": camera pan offset in degrees,    "minValue": minimum camera pan offset in degrees,    "maxValue": maximum camera pan offset in degrees  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axi-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCameraPanOffset",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setCameraPanOffset",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "saveCameraPanOffset",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "saveCameraPanOffset",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraTiltOffset",  "data": {    "value": camera tilt offset in degrees,    "minValue": minimum camera tilt offset in degrees,    "maxValue": maximum camera tilt offset in degrees  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraTiltOffset",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCameraTiltOffset",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setCameraTiltOffset",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "saveCameraTiltOffset",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCameraZoomDegree",  "data": {    "value": zoom degree in percent,    "minValue": zoom degree in percent,    "maxValue": zoom degree in percent  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCameraZoomDegree",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getTrackingEnabled",  "data": {    "value": boolean value of tracking enabled  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setTrackingEnabled",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setTrackingEnabled",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getGuardTourEnabled",  "data": {    "value": boolean value of tracking enabled  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setGuardTourEnabled",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getGuardTourTime",  "data": {    "value": guard tour time in seconds,    "minValue": minimum guard tour time in seconds,    "maxValue": maximum guard tour time in seconds  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getGuardTourTime",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setGuardTourTime",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setGuardTourTime",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getReturnToHomeEnabled",    "data": {    "value": boolean value of return to home enabled  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getReturnToHomeEnabled",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setReturnToHomeEnabled",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setReturnToHomeEnabled",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getReturnToHomeTimeout",  "data": {    "value": timeout in seconds,    "minTimeout": minimum timeout in seconds,    "maxTimeout": maximum timeout in seconds  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setReturnToHomeTimeout",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setReturnToHomeTimeout",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getObjectTypesToTrack",  "data": {    "small": enabled tracking status for small objects,    "human": enabled tracking status for humans,    "vehicle": enabled tracking status for vehicles,    "unknown": enabled tracking status for unidentified objects  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getObjectTypesToTrack",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setObjectTypesToTrack",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setObjectTypesToTrack",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCapabilities",  "data": {    "returnToHomeEnabled": {},    "returnToHomeTimeOut": {      "minValue": ...,      "maxValue": ...    },    "objectTypesToTrack": {      "types": [...]    }  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCapabilities",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/radar-autotracking.cgi
```

```
{    "apiVersion": "1.1",    "context": "context-id",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

- Property: Properties.API.HTTP.Version=3
- Property: Properties.Radar.Radar=yes
- AXIS OS: 7.10 and later
- Product category: Axis product equipped with a security radar
- API discovery: id=radar-autotracking

- View the current IP address, credentials and camera connection state.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- View the current configured mounting height.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- View the current camera pan offset.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- Save the current camera pan value as a camera pan offset.

- Parse the JSON response.

- View the current camera tilt offset.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- Save the current camera tilt value as a camera tilt offset.

- Parse the JSON response.

- View the current camera zoom degree.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- Enable the current tracking.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- Enable guard tour.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- View the current guard tour time.

- Parse the JSON response.

- Set a new value.

- Parse the JSON response.

- View the current return to home values.

- Parse the JSON response.

- Set new rules.

- Parse the JSON response.

- View the current return to home values.

- Parse the JSON response.

- Set new values.

- Parse the JSON response.

- View the current object types to track the values.

- Parse the JSON response.

- Set new rules.

- Parse the JSON response.

- View the current object types to track the values.

- Parse the JSON response.

- View a list of supported API versions.

- Parse the JSON response.

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
- Mehtod: POST

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| setCameraConnection | Sets the camera’s connection. |
| getCameraConnection | Receives the current camera’s connection and connection state. |
| setCameraMountingHeight | Sets the camera’s mounting height. |
| getCameraMountingHeight | Receives the current camera’s mounting height and its allowed values. |
| setCameraPanOffset | Sets the camera’s pan offset. |
| getCameraPanOffset | Receives the current camera’s pan offset and its allowed values. |
| saveCameraPanOffset | Reads the pan position from a connected camera, which can be saved as a camera pan offset. |
| setCameraTiltOffset | Sets the camera’s tilt offset. |
| getCameraTiltOffset | Receives the current camera’s tilt offset and its allowed values. |
| saveCameraTiltOffset | Reads the tilt position from a connected camera, which can be saved as a camera tilt offset. |
| setCameraZoomDegree | Sets the camera’s zoom degree. |
| getCameraZoomDegree | Receives the current camera’s zoom degree and its allowed values. |
| setTrackingEnabled | Sets the tracking to enabled. |
| getTrackingEnabled | Receives the enabled tracking. |
| setGuardTourEnabled | Sets the guard tour to enabled. |
| getGuardTourEnabled | Receives the enabled guard tour. |
| setGuardTourTime | Sets the guard tour time. |
| getGuardTourTime | Receives the guard tour and its allowed values. |
| setReturnToHomeEnabled | Sets return to home to enabled. |
| getReturnToHomeEnabled | Receives the enabled return to home. |
| setReturnToHomeTimeout | Sets the return to home timeout. |
| getReturnToHomeTimeout | Receives the return to home timeout, including its min and max values. |
| setObjectTypesToTrack | Sets the object types to track. |
| getObjectTypesToTrack | Receives the tracks for the object types. |
| getCapabilities | Receives supported capabilities. |
| getSupportedVersions | Receives a list of supported API versions. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| ip | String | The camera’s IP address. |
| user | String | The username to log in to the camera. |
| pass | String | The password to log in to the camera. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | The vertical mounting height of the camera, measured in meters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | The camera pan offset, measured in degrees. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Code | Definition | Description |
| --- | --- | --- |
| 301 | INVALID_CONNECTION_ERROR | Invalid connection to the camera |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | The camera tilt offset, measured in the degrees. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this values and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Code | Definition | Description |
| --- | --- | --- |
| 301 | INVALID_CONNECTION_ERROR | Invalid connection to the camera |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The clients sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | The camera zoom degree, measured in percent. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed method. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Boolean | Must be set to either true or false to enable/disable tracking. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Boolean | Must be set to either true or false to enable/disable guard tour. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | The guard tour time, measured in seconds. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this values and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Boolean | Must be set to either true or false to enable/disable the return to home function. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed method. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| value | Number | Sets the timeout in seconds. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented I the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Contains the method specific parameters listed below. |
| small | Boolean | Must be set to either true or false to enable/disable tracking small objects. |
| human | Boolean | Must be set to either true or false to enable/disable tracking humans. |
| vehicle | Boolean | Must be set to either true or false to enable/disable tracking vehicles. |
| unknown | Boolean | Must be set to either true or false to enable/disable tracking unidentified objects. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this value and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The client sets this values and the application echoes it back in the response (optional). |
| method | String | The performed operation. |

| Code | Definition | Description |
| --- | --- | --- |
| 100 | UNSUPPORTED_API_VERSION | The requested API version is not supported by this implementation. |
| 102 | JSON_KEY_NOT_FOUND_ERROR | A mandatory input parameter was not found in the input. |
| 103 | JSON_INVALID_TYPE | The type of a provided JSON parameter was incorrect. |
| 200 | JSON_INVALID_ERROR | The provided JSON input was invalid. |
| 300 | PARAM_INVALID_VALUE_ERROR | Invalid parameter value. |

