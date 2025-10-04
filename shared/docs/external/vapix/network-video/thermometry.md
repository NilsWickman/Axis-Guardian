# Thermometry

**Source:** https://developer.axis.com/vapix/network-video/thermometry/
**Last Updated:** Aug 18, 2025

---

# Thermometry

## Overview​

### Identification​

## Common examples​

### List supported API versions​

### List thermometry configuration capabilities​

### Set temperature scale​

### List isotherm levels​

### Set isotherm levels​

### Add a temperature detection area​

### Modify a temperature detection area​

### Remove temperature detection areas​

### List temperature detection areas​

### Check area status​

### Add a spot temperature​

### Check spot temperature​

### Remove a spot temperature​

### Get TGT configuration​

### Set TGT configuration​

### Add a group​

### Modify a group​

### Remove a group​

### List all groups​

### Retrieve the group status​

## API specifications​

### getSupportedVersions​

### getConfigurationCapabilities​

### setTemperatureScale​

### getIsothermLevels​

### setIsothermLevels​

### addArea​

### updateArea​

### removeAreas​

### listAreas​

### getAreaStatus​

### addSpotTemperature​

### getSpotTemperature​

### removeSpotTemperature​

### getTgtConfiguration​

### setTgtConfiguration​

### addGroup​

### updateGroup​

### removeGroup​

### listGroups​

### getGroupStatus​

### Temperature area event​

### Temperature Any Area Event​

### Temperature Any Area On Preset Event​

### Temperature information event​

### Temperature deviation detection event​

### General error codes​

## Footnotes​

The VAPIX® Thermometry API provides the information that makes it possible to configure the temperature monitoring functions on a temperature calibrated thermal camera:

The API implements thermometry.cgi as its communications interface and supports the following methods:

This example will show you how to list the API versions that are supported by your device.

JSON input parameters

Successful response example

Error response example

See getSupportedVersions for additional details.

This example will show you how to list the thermometric capabilities featured on your camera. It is useful when you want to set up the user interface without hard coded information or legacy parameters. The parameter maxNumberOfAreas is used per each individual preset on PTZ cameras.

JSON input parameters

Successful response example

Error response example

See getConfigurationCapabilities for additional details.

This example will show you how to set the temperature scale to be either Celsius or Fahrenheit.

JSON input parameters

Successful response example

Error response example

See setTemperatureScale for additional details.

This example will show you how to list the current isotherm levels.

JSON input parameters

Successful response example

Error response example

See getIsothermLevels for additional details.

This example will show you how to colorize the image with an isothermal palette. The palette consists of the three temperature levels that were obtained in the previous example. The palette is chosen with the parameter Image.IO.Appearance.Palette.

JSON input parameters

Successful response example

Error response example

See setIsothermLevels for additional details.

This example will show you how to monitor the temperature of a selected area or object and set a temperature threshold. An alarm will be raised if the temperature goes outside of the limits defined by the threshold.

JSON input parameters

Successful response example

Error response example

See addArea for additional details.

This example will show you how to modify the settings of a detection area.

JSON input parameters

Successful response example

Error response example

See updateArea for additional details.

This example will show you how to remove one or more temperature areas.

JSON input parameters

Successful response example

Error response example

See removeAreas for additional details.

This example will show you how to list existing temperature areas and their individual settings.

JSON input parameters

Successful response example

Error response example

See listAreas for additional details.

This example will show you how to investigate the current status of the alarm areas.

JSON input parameters

Successful response example

Error response example

See getAreaStatus for additional information.

This example will show you how to activate the spot temperature for the given coordinates and render it as an overlay in the image.

JSON input parameters

Successful response example

Error response example

See addSpotTemperature for additional information.

This example will show you how to check the temperature in the spot chosen with the addSpotTemperature method.

JSON input parameters

Successful response example

Error response example

See getSpotTemperature for additional details.

This example will show you how to remove the spot temperature and disable the overlay.

JSON input parameters

Successful response example

Error response example

See removeSpotTemperature for additional details.

This example will show you how to check the current thermometric guard tour settings.

JSON input parameters

Successful response example

Error response example

See getTgtConfiguration for additional details.

This example will show you how to change the thermometric guard tour settings.

JSON input parameters

Successful response example

Error response example

See setTgtConfiguration for additional details.

This example will show you how to create a group of temperature areas and monitor them in search for deviations. If the difference between the highest and lowest area temperatures exceed the defined threshold and time limit, the alarm will be raised.

JSON input parameters

Successful response example, in which the addGroup method returns an ID for the group

Error response example

See addGroup for additional details.

This example will show you how to modify the settings of an existing group.

JSON input parameters

Successful response example

Error response example

See updateGroup for additional details.

This example will show you how to remove one or all groups.

JSON input parameters

Successful response example

Error response example

See removeGroup for additional details.

This example will show you how to review existing groups and their settings.

JSON input parameters

Successful response example

Error response example

See listGroups for additional details.

This example will show you how to check the status of the group alarms in the current preset.

JSON input parameters

Successful response example

Error response example

See getGroupStatus for additional details.

This method should be used when you want to list all API versions supported by your device. The list will consist of all supported major versions along with their highest supported minor version.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to list the thermometric limits and values for the configuration values on your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the temperature scale on your device to measure in either Celsius (default) or Fahrenheit. Please note that the current temperature scale is called by the method getConfigurationCapabilities.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should only be used together with isothermal palettes, which always have names that begins with "Iso-". Available palettes and their current value are given by the parameter Image.IO.Appearance.Palette, and fetched with the param.cgi. More information is available in Parameter management.

This method returns the three temperature levels that have been set as fixed on the color scale as well as if the palette overlay is active or not.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should only be used when you want to set the isothermal levels for the three isothermal palettes. The request action=update&root.Image.IO.Appearance.Palette=<name> should be used by param.cgi to set the palette that should be used. All isothermal palettes have names that start with "Iso-". More information is available in Parameter management.

The three temperature levels tied to three colors on the temperature color scale must be set before the isotherm functions can be used. These levels must be unique and set in rising order from lowest to highest. getConfigurationCapabilities is used to check the current temperature scale. The palette can be included in the video stream as an overlay.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to add a new temperature detection area. The area is a polygon given as a set of coordinates in consecutive order where no edges may cross each other. Additionally, a number of conditions must be provided for when an alarm should be triggered. The maximum number of areas per preset is given by the method getConfigurationCapabilities.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to update an existing area.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove specified areas.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to list all temperature detection areas for a provided preset number. All areas will be returned for all presets if the preset number is set to 0.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to return the current temperature and trigger status of the active areas.

PTZ cameras will return either the status for the active areas on the current preset, or an empty status if not on preset positions

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to activate the spot meter for the coordinates in the given coordinate system. Only one spotTemperature will be replaced will be replaced when a new one is called for.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the temperature in the spot set by the method addSpotTemperature.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove the rendering of the spot meter.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current configuration of the thermometric guard tour.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the thermometric guard tour configuration.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to add a new area group. A group is used to monitor and compare temperature conditions across multiple areas. The maximum number of groups per preset is given by the method getConfigurationCapabilities.

Request

JSON input parameters

Return value - Success

If a group is successfully created, the method will return a unique ID for the group, starting with 1 (0 is never used as an ID) and if the group is enabled.

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to update an existing group without changing its ID. The parameter presetNbr can not be changed once the group has been created by addGroup.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove one or all groups.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list of groups for a provided preset number. If the preset number is 0, all areas will be returned for all presets.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to returns the current trigger status of active groups. PTZ cameras will return the status of active groups on the current preset, or an empty status if not standing on a preset.

Request

JSON input parameters

Return value - Success

Response body syntax

details=<{}> parameters

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This event will be true if all conditions for an area is fulfilled.

The Temperature Any Area Event is true if the conditions for any area is fulfilled.

The Temperature Any Area On Preset Event is assigned to a unique preset position. The event is true if the conditions for any area on the selected preset is fulfilled.

This event is uniquely assigned to an area. An update event is sent to each existing area every 30 seconds.

This event is used for enabled area groups that will emit an event when its configured criteria is met.

The following table consist of errors that may occur for any method. Errors specific to a method are listed under their separate API description. The error codes exist in the following ranges.

1100–1199

Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.

1200–1999

API-specific server errors that may collide between different APIs.

2100–2199

Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.

2200–2999

API-specific client errors that may collide between different APIs.

The 4–digit error codes are returned in the JSON body when the service is executed, which means that the client must be prepared to handle transport-level errors codes with non-JSON responses. Specifically, HTTP error 401/403 will be emitted if either authentication or authorization fails.

Out-of-memory errors will also be reported as 1100 Internal error. ↩

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getConfigurationCapabilities",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getConfigurationCapabilities",    "data": {        "currentTemperatureScale": "celsius",        "minTemperature": -40,        "maxTemperature": 350,        "maxNumberOfAreas": 10,        "maxNumberOfVertices": 10,        "maxDelayTime": 300,        "defaultDelayTime": 5,        "maxNameLength": 60    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getConfigurationCapabilities",    "error": {        "code": 3000,        "message": "The requested API version is not supported."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setTemperatureScale",    "params": {        "unit": "fahrenheit"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setTemperatureScale",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setTemperatureScale",    "error": {        "code": 2104,        "message": "Invalid parameter value."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIsothermLevels",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIsothermLevels",    "data": {        "high": 100,        "middle": 50,        "low": 10,        "renderOverlay": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIsothermLevels",    "error": {        "code": 2102,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIsothermLevels",    "params": {        "high": 100,        "middle": 50,        "low": 10,        "renderOverlay": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIsothermLevels",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIsothermLevels",    "error": {        "code": 2104,        "message": "Invalid parameter: Levels not in correct order."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addArea",    "params": {        "imagesource": 0,        "enabled": true,        "name": "Area 1",        "detectionType": "above",        "measurement": "average",        "threshold": 100,        "delay": 5,        "vertices": [            [-0.5, -0.5],            [0.5, -0.5],            [0.5, 0.5],            [-0.5, 0.5]        ],        "areaOverlay": "always",        "temperatureOverlay": true,        "presetNbr": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addArea",    "data": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addArea",    "error": {        "code": 2103,        "message": "Required parameter missing."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "updateArea",    "params": {        "id": 0,        "imagesource": 0,        "enabled": true,        "name": "Area 1",        "detectionType": "below",        "measurement": "minimum",        "threshold": 100,        "delay": 5,        "vertices": [            [-0.5, -0.5],            [0.5, -0.5],            [0.5, 0.5],            [-0.5, 0.5]        ],        "areaOverlay": "if_triggered",        "temperatureOverlay": true,        "presetNbr": 2    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "updateArea",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "updateArea",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeAreas",    "params": {        "areas": [0, 1, 3]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeAreas",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeAreas",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listAreas",    "params": {        "presetNbr": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listAreas",    "data": {        "areaList": [            {                "id": 0,                "imageSource": 0,                "enabled": true,                "name": "Area 1",                "detectionType": "below",                "measurement": "minimum",                "threshold": 100,                "delay": 5,                "position": [                    [-0.5, -0.5],                    [0.5, -0.5],                    [0.5, 0.5],                    [-0.5, 0.5]                ],                "areaOverlay": "if triggered",                "temperatureOverlay": true,                "presetNbr": 1            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listAreas",    "error": {        "code": 2110,        "message": "User is not authorized to this request, permission denied."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getAreaStatus",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getAreaStatus",    "data": {        "areaList": [            {                "id": 0,                "avg": 5,                "min": 0,                "max": 10,                "maxPos": [0.91, 0.12],                "minPos": [-0.63, -0.31],                "triggered": true            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getAreaStatus",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addSpotTemperature",    "params": {        "spotCoordinates": [0.37, -0.95],        "coordinateSystem": "coord_neg1_1"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addSpotTemperature",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addSpotTemperature",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSpotTemperature",    "params": {        "coordinateSystem": "coord_neg1_1"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSpotTemperature",    "data": {        "spotTemperature": 7,        "spotCoordinates": [-0.53, 0.45],        "renderOverlay": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSpotTemperature",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeSpotTemperature",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeSpotTemperature",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeSpotTemperature",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "getTgtConfiguration",    "params": {}}
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "getTgtConfiguration",    "data": {        "pauseOnAlarm": true,        "autoResume": true    }}
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "getTgtConfiguration",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "setTgtConfiguration",    "params": {        "pauseOnAlarm": true,        "autoResume": true    }}
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "setTgtConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "setTgtConfiguration",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

```
http://myserver/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "addGroup",    "params": {        "enabled": true,        "name": "Group 1",        "measurement": "average",        "threshold": 5,        "delay": 5,        "areaIds": [0, 1, 2],        "groupOverlay": true,        "presetNbr": 1    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "addGroup",    "data": {        "id": 1,        "enabled": true    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "addGroup",    "error": {        "code": 2103,        "message": "Missing parameter: 'param'"    }}
```

```
http://myserver/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "updateGroup",    "params": {        "id": 2,        "enabled": true,        "name": "Group 1",        "measurement": "minimum",        "threshold": 10,        "delay": 5,        "areaIds": [3, 4],        "groupOverlay": true    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "updateGroup",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "updateGroup",    "error": {        "code": 2104,        "message": "Invalid parameter for: 'param'"    }}
```

```
http://myserver/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "removeGroup",    "params": {        "id": 1    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "removeGroup",    "data": {}}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "removeGroup",    "error": {        "code": 1200,        "message": "Cannot remove group: Group does not exist"    }}
```

```
http://myserver/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "listGroups",    "params": {        "presetNbr": 0    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "listGroups",    "data": {        "grouplist": [            {                "id": 2,                "enabled": true,                "name": "Group 2",                "measurement": "minimum",                "threshold": 10,                "delay": 5,                "areaIds": [2, 3],                "groupOverlay": true,                "presetNbr": 0            }        ]    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "listGroups",    "error": {        "code": 2110,        "message": "User is not authorized to this request, permission denied"    }}
```

```
http://myserver/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getGroupStatus",    "params": {}}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getGroupStatus",    "data": {        "grouplist": [            {                "id": 2,                "triggered": true,                "details": {                    "name": "Group1",                    "currentDeviation": 10.0,                    "memberAreas": [                        { "areaId": 1, "areaName": "Area1" },                        { "areaId": 2, "areaName": "Area2" },                        { "areaId": 3, "areaName": "Area3" }                    ],                    "maxDeviationAreas": [                        { "maxAreaId": 1, "maxAreaTemp": 25.3 },                        { "minAreaId": 3, "minAreaTemp": 15.3 }                    ]                }            }        ]    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getGroupStatus",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [ "<Major1>.<Minor1>", "<Major2>.<Minor2>", ... ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getConfigurationCapabilities"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getConfigurationCapabilities",  "data": {    "currentTemperatureScale": <string>,    "minTemperature": <int>,    "maxTemperature": <int>,    "maxNumberOfAreas": <int>,    "maxNumberOfVertices": <int>,    "maxDelayTime": <int>,    "defaultDelayTime": <int>,    "maxNameLength": <int>,    "maxGroups": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getConfigurationCapabilities",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTemperatureScale"  "params": {    "unit": "celsius" | "fahrenheit"  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTemperatureScale",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTemperatureScale",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIsothermLevels"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIsothermLevels",  "data": {    "high": <int>,    "middle": <int>,    "low": <int>,    "min": <int>    "renderOverlay": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIsothermLevels",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIsothermLevels"  "params": {    "high": <int>,    "middle": <int>,    "low": <int>,    "min": <int>,    "renderOverlay": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIsothermLevels",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIsothermLevels",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addArea"  "params": {    "imagesource": <int>,    "enabled": <boolean>,    "name": <string>,    "detectionType": <string>,    "measurement": <string>,    "threshold": <int>,    "delay": <int>,    "vertices": [[<float>, <float>],...],    "areaOverlay": <string>,    "temperatureOverlay": <boolean>,    "presetNbr": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addArea",  "data": {    "id": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addArea",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "updateArea"  "params": {    "id": <int>,    "imagesource": <int>,    "enabled": <boolean>,    "name": <string>,    "detectionType": <string>,    "measurement": <string>,    "threshold": <int>,    "delay": <int>,    "vertices": [[<float>, <float>],...],    "areaOverlay": <string>,    "temperatureOverlay": <boolean>,    "presetNbr": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "updateArea",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "updateArea",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeAreas"  "params": {    "areas": [<int>, <int>, ...]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeAreas",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeAreas",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listAreas"  "params": {    "presetNbr": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listAreas",  "data": {    "areaList": [      {        "id": <int>,        "imagesource": <int>,        "enabled": <boolean>,        "name": <string>,        "detectionType": <string>,        "measurement": <string>,        "threshold": <int>,        "delay": <int>,        "position": [[<float>, <float>],...],        "areaOverlay": <string>,        "temperatureOverlay": <boolean>,        "presetNbr": <int>      }, ...    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listAreas",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAreaStatus"  "params": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAreaStatus",  "data": {    "areaList": [      {        "id": <int>,        "avg": <int>,        "min": <int>,        "max": <int>,        "minCoordinates": [<float, float>],        "maxCoordinates": [<float, float>],        "triggered": <boolean>,      }, ...    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAreaStatus",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addSpotTemperature",  "params": {    "spotCoordinates": [<float, float>],    "coordinateSystem": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addSpotTemperature",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addSpotTemperature",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSpotTemperature",  "params": {    "coordinateSystem": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSpotTemperature",  "data": {    "spotTemperature": <float>,    "spotCoordinates": [<float>, <float>],    "renderOverlay": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method":  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeSpotTemperature"  "params": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeSpotTemperature",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeSpotTemperature",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getTgtConfiguration"  "params": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getTgtConfiguration",  "data": {    "pauseOnAlarm": <boolean>,    "autoResume": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getTgtConfiguration",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTgtConfiguration"  "params": {    "pauseOnAlarm": <boolean>,    "autoResume": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTgtConfiguration",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTgtConfiguration",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "<major>.<minor>",    "context": <string>,    "method": "addGroup",    "params": {        "enabled": <boolean>,        "name": <string>,        "measurement": <string>,        "threshold": <int>,        "delay": <int>,        "areaIds": [<int>, <int>, ...],        "groupOverlay": <boolean>,        "presetNbr": <int>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "addGroup",    "data": {        "id": <int>,        "enabled": <boolean>    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addGroup",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "<major>.<minor>",    "context": <string>,    "method": "updateGroup",    "params": {        "id": <int>,        "enabled": <boolean>,        "name": <string>,        "measurement": <string>,        "threshold": <int>,        "delay": <int>,        "areaIds": [<int>, <int>, ...],        "groupOverlay": <boolean>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "updateGroup",    "data": {        "enabled": <boolean>    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "updateGroup",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "<major>.<minor>",    "context": <string>,    "method": "removeGroup",    "params": {        "id": <int>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "removeGroup",    "data": {    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeGroup",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "<major>.<minor>",    "context": <string>,    "method": "listGroups",    "params": {        "presetNbr": <int>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "listGroups",    "data": {        "grouplist": [            {                "id":<int>,                "enabled": <boolean>,                "name": <string>,                "measurement": <string>,                "threshold": <int>,                "delay": <int>,                "areaIds": [<int>, int, ...],                "groupOverlay": <boolean>,                "presetNbr": <int>            }, ...        ]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listGroups",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/thermometry.cgi
```

```
{    "apiVersion": "<major>.<minor>",    "context": <string>,    "method": "getGroupStatus",    "params": {    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getGroupStatus",    "data": {        "grouplist": [            {                "id":<int>,                "triggered": <boolean>,                "details": {                    "name": <string>,                    "currentDeviation": <float>,                    "memberAreas": [                        {"areaId": <int>, "areaName": <string>},                        {"areaId": <int>, "areaName": <string>},                        ...                    ],                    "maxDeviationAreas": [                        {"maxAreaId": <int>, "maxAreaTemp": <float>},                        {"minAreaId": <int>, "minAreaTemp": <float>}                    ]                }            }        ]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getGroupStatus",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- Isothermal palettes: Pixels colored differently depending on their temperature for an overview of the temperatures across the scene. You can choose between a number of palettes that can be either isothermal or non-isothermal. The chosen palette is stored in the parameter Image.I0.Appearance.Palette, which is used by the majority of thermal cameras, including those without thermometric capabilities. However, only thermometric cameras have isothermal palettes as an option, further detailed in getIsothermLevels and setIsothermLevels. Three temperature levels must be provided if an isothermal palette is chosen. These temperatures will be tied to three distinct colors in the palette. Temperatures between and outside of these levels will be linearly mapped to the colors of the palette. An image of the palette and the three levels can also be included in the video stream as an overlay.
- Temperature detection areas: Defined numbers of polygon-shaped areas in which the temperature can be monitored. You are able to set a number of conditions that must be met before the alarm will trigger. For example, you are able to set a temperature limit that will trigger the alarm whenever the temperature goes above or below it. An alternative to the fixed threshold is setting a limit on how fast the temperature is allowed to increase or decrease. This means that you need to set a delay time (in seconds) before the alarm will trigger and if it will trigger on the highest, lowest or at an average temperature in the area. It is possible to include the areas as overlays in the video. The areas can also be tied to a preset on a mounted pan/tilt-device.
- Spot temperature measurement: A single spot in the image chosen to measure the temperature. There can only be one spot temperature, which will then be included in the video stream as an overlay.

- API Discovery: id=thermometry

- List supported API versions.

- Parse the JSON response.

- List thermometric capabilities.

- Parse the JSON response.

- Set the temperature scale.

- Parse the JSON response.

- Retrieve the current isotherm levels.

- Parse the JSON response.

- Set the active palette.

- Parse the JSON response.

- Add a new temperature area.

- Parse the JSON response.

- Update an existing temperature area.

- Parse the JSON response.

- Delete 3 temperature areas.

- Parse the JSON response.

- Create a list.

- Parse the JSON response.

- Retrieve current status of the active areas.

- Parse the JSON response.

- Add a spot temperature.

- Parse the JSON response.

- Take the temperature for a spot-sized area.

- Parse the JSON response.

- Remove the spot temperature.

- Parse the JSON response.

- Get TGT configuration:

- Parse the JSON response.

- Set TGT configuration:

- Parse the JSON response.

- Add a new group

- Parse the JSON response

- Modify a group:

- Parse the JSON response

- Delete group:

- Parse the JSON response

- List all temperature areas and their settings:

- Parse the JSON response

- Check the current status of the active groups:

- Parse the JSON response

- Security level: Operator
- Method: POST
- Content-Type: application/json

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 400 Bad Request
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 400 Bad request
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx/5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: ``
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 400 Bad request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application/json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application-json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application-json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application-json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application-json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP code: 200 OK
- Content-Type: application-json

- HTTP code: 4xx / 5xx
- Content-Type: application/json

- Topic: tns1:VideoSource/tns1:RadiometryAlarm/tnsaxis:TemperatureDetection
- Type: Stateful
- Nice name: Temperature Area Alarm

- Topic: tns1:VideoSource/tns1:RadiometryAlarm/tnsaxis:TemperatureDetectionAnyArea
- Type: Stateful
- Nice name: Temperature Any Area Alarm

- Topic: tns1:VideoSource/tns1:RadiometryAlarm/tnsaxis:TemperatureDetectionAnyAreaOnPreset
- Type: Stateful
- Nice name: Temperature Any Area On Preset Alarm

- Topic: tns1:VideoSource/tns1:Thermometry/tnsaxis:TemperatureDetection
- Type: Stateless
- Nice name: Temperature Detection

- Topic: tns1:VideoSource/tns1:RadiometryAlarm/tnsaxis:DeviationDetection
- Type: Stateful
- Nice name: Temperature Deviation Alarm

- 1100–1199
Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.
- 1200–1999
API-specific server errors that may collide between different APIs.
- 2100–2199
Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.
- 2200–2999
API-specific client errors that may collide between different APIs.

- Out-of-memory errors will also be reported as 1100 Internal error. ↩

| Method | Description | Supported from API version |
| --- | --- | --- |
| getSupportedVersions | List supported API versions. | 1.0 |
| getConfigurationCapabilities | Retrieve values to configure the functionality. | 1.0 |
| setTemperatureScale | Set temperature scale. | 1.0 |
| getIsothermLevels | Retrieve current isotherm levels. | 1.0 |
| setIsothermLevels | Set isotherm levels. | 1.0 |
| addArea | Add a new alarm area. | 1.0 |
| updateArea | Update alarm area. | 1.0 |
| removeAreas | Delete one or several areas. | 1.0 |
| listAreas | List temperature areas. | 1.0 |
| getAreaStatus | Retrieve the current status of active areas. | 1.0 |
| addSpotTemperature | Adds the spot meter to new coordinates. | 1.0 |
| getSpotTemperature | Retrieve a spot temperature. | 1.0 |
| removeSpotTemperature | Remove the spot meter. | 1.0 |
| getTgtConfiguration | Retrieve the thermometric guard tour configuration. | 1.1 |
| setTgtConfiguration | Set the thermometric guard tour configuration. | 1.1 |
| addGroup | Add a new group. | 1.2 |
| updateGroup | Update a group. | 1.2 |
| removeGroup | Delete one or all groups. | 1.2 |
| listGroups | List groups. | 1.2 |
| getGroupStatus | Retrieve the current status of active groups. | 1.2 |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| apiVersions[]=<list of versions> | A list containing all supported API versions along with their highest supported minor version. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getConfigurationCapabilities" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getConfigurationCapabilities" | The requested method. |
| currentTemperatureScale="celsius" | "fahrenheit" | The current temperature scale. Can be either Celsius or Fahrenheit. |
| minTemperature=<int> | The minimum temperature possible to measure with the current temperature scale. |
| maxTemperature=<int> | The maximum temperature possible to measure with the current temperature scale. |
| maxNumberOfAreas=<int> | The maximum number of areas that can be defined. |
| maxNumberOfVertices=<int> | The maximum number of vertices that an alarm area can have. |
| maxDelayTime=<int> | The maximum delay time, measured in seconds. |
| defaultDelayTime=<int> | The default delay time, measured in seconds. |
| maxNameLength=<int> | The maximum number of characters you can use for an area name. |
| maxGroups=<int> | The maximum number of area groups that can be defined in a preset. Added in API version 1.2. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getConfigurationCapabilities" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setTemperatureScale" | The method that should be used. |
| unit="celsius" | "fahrenheit" | The temperature scale that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setTemperatureScale" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setTemperatureScale" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getIsothermLevels" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getIsothermLevels" | The requested method. |
| high=<int> | The highest temperature level on the temperature color scale. |
| middle=<int> | The middle temperature level on the temperature color scale. |
| low=<int> | The low temperature level on the temperature color scale and the lowest temperature colored by the chosen palette. Temperatures between low and minimum appear in grayscale. |
| min=<int> | Available in API version 1.2 and onwards. The minimum temperature on the temperature color scale. It is the lowest temperature that can be shown in the image. |
| renderOverlay=<boolean> | true if the chosen color palette is included in the video stream. The three isotherm levels will be marked on the palette. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getIsothermLevels" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setIsothermLevels" | The method that should be used. |
| high=<int> | The highest temperature level on the temperature color scale. The temperature scale itself is given by getConfigurationCapabilities. Range [getConfigurationCapabilities:minTemperature +3, getConfigurationCapabilities:maxTemperature]. |
| middle=<int> | The middle temperature level on the temperature color scale. The temperature scale itself is given by getConfigurationCapabilities. Range [getConfigurationCapabilities:minTemperature +2, getConfigurationCapabilities:maxTemperature -1]. |
| low=<int> | The lowest temperature level on the temperature color scale. The temperature scale itself is given by getConfigurationCapabilities. Range [getConfigurationCapabilities:minTemperature +1, getConfigurationCapabilities:maxTemperature -2]. |
| min=<int> | Optional in API version 1.2 onwards. The minimum temperature level on the temperature color scale. The temperature scale itself is given by getConfigurationCapabilities. If the parameter is omitted it will automatically be set to the lowest possible temperature given by getConfigurationCapabilities. Range [getConfigurationCapabilities:minTemperature, getConfigurationCapabilities:maxTemperature -3]. |
| renderOverlay=<boolean> | The color palette chosen to be included in the video stream. The three isotherm levels are marked on the palette. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setIsothermLevels" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setIsothermLevels" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="addArea" | The method that should be used. |
| imagesource=<int> | The image source for the area. |
| enabled=<boolean> | Enables the area monitoring if true. |
| name=<string> | The area name. The maximum length is given by getConfigurationCapabilities. |
| detectionType="above" | "below" | "increase" | "decrease" | The detection type- above and below: The alarm will trigger if the value goes above or below the threshold value.- increase and decrease: Monitors the change rate of the temperature. The alarm will trigger if the temperature increases or decreases faster than the threshold value divided by the delay time. |
| measurement="maximum" | "minimum" | "average" | The area value. The alarm will trigger depending on the maximum, minimum or average temperature in the area. |
| threshold=<int> | The temperature value that activates the trigger. This is the temperature change during the delay time and must be positive for the increase and decrease detection types. The allowed range is given by the method getConfigurationCapabilities. |
| delay=<int> | The number of seconds the trigger condition must be true before an alarm is triggered. If the delay time is zero the alarm will activate immediately when the trigger conditions are met. This is the time during which the temperature must have changed with the threshold value to trigger the alarm for the increase and decrease detection types. Both the maximum and default delay time is given in the method getConfigurationCapabilities. |
| vertices=Array of coordinates | The vertices of the polygon, given as an array of its x and y coordinates [x, y]. All vertices must be unique and the edges of the polygon can not cross each other. The coordinates are normalized to the size of the image and spans from -1 to 1 in both the horizontal and vertical direction. This means that the upper right corner has the coordinates [1, 1], while the lower left corner has the coordinates [-1, -1]. The coordinates must always be given for an image that is neither rotated or mirrored. The minimum number of vertices in a polygon is 3, the maximum is given by the method getConfigurationCapabilities. |
| areaOverlay="none" | "always" | "if_triggered" | Tells if and when the area should be included in the video stream and visible on recordings. The overlay color will change from green to red if the alarm is triggered. |
| temperatureOverlay=<boolean> | Indicates if the temperature of the area should be shown, but only when the area overlay is visible. The chosen measurement value is shown. |
| presetNbr=<int> | The preset number for the area. Will be ignored on non PTZ cameras and must be an existing preset number for PTZ cameras. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="addArea" | The requested method. |
| id=<int> | The area id. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="addArea" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Maximum amount of areas in preset reached |
| 1200 | Preset does not exist |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="updateArea" | The method that should be used. |
| id=<int> | The area ID. |
| imagesource=<int> | The image source for the area. |
| enabled=<boolean> | Enables the area monitoring if true. |
| name=<string> | The area name. The maximum length is given by getConfigurationCapabilities. |
| detectionType="above" | "below" | "increase" | "decrease" | The detection type- above and below: The alarm will trigger if the value goes above or below the threshold value.- increase and decrease: Monitors the change rate of the temperature. The alarm will trigger if the temperature increases or decreases faster than the threshold value divided by the delay time. |
| measurement="maximum" | "minimum" | "average" | The area value. The alarm will trigger depending on the maximum, minimum or average temperature in the area. |
| threshold=<int> | The temperature value that activates the trigger. This is the temperature change during the delay time and must be positive for the increase and decrease detection types. The allowed range is given by the method getConfigurationCapabilities. |
| delay=<int> | The number of seconds the trigger condition must be true before an alarm is triggered. If the delay time is zero the alarm will activate immediately when the trigger conditions are met. This is the time during which the temperature must have changed with the threshold value to trigger the alarm for the increase and decrease detection types. Both the maximum and default delay time is given in the method getConfigurationCapabilities. |
| vertices=Array of coordinates | The vertices of the polygon, given as an array of it x and y coordinates [x, y]. All vertices must be unique and the edges of the polygon can not cross each other. The coordinates are normalized to the size of the image and spans from -1 to 1 in both the horizontal and vertical direction. This means that the upper right corner has the coordinates [1, 1], while the lower left corner has the coordinates [-1, -1]. The coordinates must always be given for an image that is neither rotated or mirrored. The minimum number of vertices in a polygon is 3, the maximum is given by the method getConfigurationCapabilities. |
| areaOverlay="none" | "always" | "if_triggered" | Tells if and when the area should be included in the video stream and visible on recordings. The overlay color will change from green to red if the alarm is triggered. |
| temperatureOverlay=<boolean> | Indicates if the temperature of the area should be shown, but only when the area overlay is visible. The chosen measurement value is shown. |
| presetNbr=<int> | The preset number for the area. Will be ignored on non PTZ cameras and must be an existing preset number for PTZ cameras. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="updateArea" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="updateArea" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Maximum amount of areas in preset reached |
| 1200 | Preset does not exist |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="removeAreas" | The method that should be used. |
| params.areas=[<int>, <int>, ...] | ID:s of the areas that should be removed. The maximum number of areas per request is given by getConfigurationCapabilities. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="removeAreas" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="removeAreas" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Area [x] could not be found |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="listAreas" | The method that should be used. |
| params.presetNbr=<integer> | The preset number for which the temperature areas will be returned. All areas for all presets are returned if the number is 0. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listAreas" | The requested method. |
| id=<int> | The area ID. |
| imagesource=<int> | The image source for the area. |
| enabled=<boolean> | Enables the area monitoring if true. |
| name=<string> | The area name. The maximum length is given by getConfigurationCapabilities. |
| detectionType="above" | "below" | "increase" | "decrease" | The detection type- above and below: The alarm will trigger if the value goes above or below the threshold value.- increase and decrease: Monitors the change rate of the temperature. The alarm will trigger if the temperature increases or decreases faster than the threshold value divided by the delay time. |
| measurement="maximum" | "minimum" | "average" | The area value. The alarm will trigger depending on the maximum, minimum or average temperature in the area. |
| threshold=<int> | The temperature value that activates the trigger. This is the temperature change during the delay time and must be positive for the increase and decrease detection types. The allowed range is given by the method getConfigurationCapabilities. |
| delay=<int> | The number of seconds the trigger condition must be true before an alarm is triggered. If the delay time is zero the alarm will activate immediately when the trigger conditions are met. This is the time during which the temperature must have changed with the threshold value to trigger the alarm for the increase and decrease detection types. The maximum delay time is given in the method getConfigurationCapabilities. |
| vertices=Array of vertices | The vertices of the polygon, given as an array of it x and y coordinates [x, y]. All vertices must be unique and the edges of the polygon can not cross each other. The coordinates are normalized to the size of the image and spans from -1 to 1 in both the horizontal and vertical direction. This means that the upper right corner has the coordinates [1, 1], while the lower left corner has the coordinates [-1, -1]. The coordinates must always be given for an image that is neither rotated or mirrored. The minimum number of vertices in a polygon is 3, the maximum is given by the method getConfigurationCapabilities. |
| areaOverlay="none" | "always" | "if_triggered" | Tells if and when the area should be included in the video stream and visible on recordings. The overlay color will change from green to red if the alarm is triggered. |
| temperatureOverlay=<boolean> | Indicates if the temperature of the area should be shown, but only when the area overlay is visible. The chosen measurement value is shown. |
| presetNbr=<int> | The preset number for the area. Will be ignored on non PTZ cameras and must be an existing preset number for PTZ cameras. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listAreas" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getAreaStatus" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getAreaStatus" | The requested method. |
| id=<int> | The area ID. |
| avg=<int> | The average temperature of the area. |
| min=<int> | The minimum temperature of the area. |
| max=<int> | The maximum temperature of the area. |
| minCoordinates=[<float, float>] | The coordinates for the minimum temperature. Only the first found pixel with this temperature is returned. |
| maxCoordinates=[<float, float>] | The coordinates for the maximum temperature. Only the first found pixel with this temperature is returned. |
| triggered=<boolean> | Tells if the area alarm has been triggered. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getAreaStatus" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Could not get status for areas |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="addSpotTemperature" | The method that should be used. |
| params.spotCoordinates=Array of coordinates | The coordinates of the pixel of interest. |
| params.coordinateSystem=<"coord_neg1_1"  | "coord_0_1"> | The coordinate system for the given coordinates. Possible values are:- coord_neg1_1: The point of origin is placed in the middle of the image, with coordinates going from -1 to 1 and increases from left to right or bottom to top of the image.:- coord_0_1: The point of origin is located in the upper left corner of the image, with coordinates going from 0 to 1. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="addSpotTemperature" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="addSpotTemperature" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSpotTemperature" | The method that should be used. |
| params.coordinateSystem=<"coord_neg1_1"  | "coord_0_1"> | The coordinate system for the spot meter. Possible values are:- coord_neg1_1: The point of origin is placed in the middle of the image, with coordinates going from -1 to 1 and increases from left to right or bottom to top of the image.:- coord_0_1: The point of origin is located in the upper left corner of the image, with coordinates going from 0 to 1. The chosen coordinate system does not need to be the same as the one used in addSpotTemperature. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSpotTemperature" | The requested method. |
| data.spotTemperature=<float> | The current temperature in the given coordinates. |
| data.spotCoordinates=Array of coordinates | The x and y coordinates of the spot temperature. |
| data.renderOverlay=<boolean> | If the spot meter overlay has been activated or not. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSpotTemperature" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="removeSpotTemperature" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="removeSpotTemperature" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="removeSpotTemperature" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getTgtConfiguration" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getTgtConfiguration" | The requested method. |
| pauseOnAlarm=<boolean> | The guard tour is paused on the preset when an event is active. |
| autoResume=<boolean> | Only valid if pauseOnAlarm is true. The guard tour will resume automatically after the event becomes inactive. It must be restarted manually otherwise. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getTgtConfiguration" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1202 | Method not supported: No guard tour settings available since camera is fixed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setTgtConfiguration" | The method that should be used. |
| pauseOnAlarm=<boolean> | The guard tour is paused on the preset when an event is active. |
| autoResume=<boolean> | Only valid if pauseOnAlarm is true. The guard tour will resume automatically after the event becomes inactive. It must be restarted manually otherwise. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setTgtConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setTgtConfiguration" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1202 | Method not supported: No guard tour settings available since camera is fixed. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string>  Optional |  | The user sets this value and the application echoes it back in the response . |
| method=addGroup |  | The method that should be used. |
| enabled=boolean |  | Enables the group monitoring if true. The real value is returned in the response. |
| name=<string> |  | The group name. The maximum length is given by getConfigurationCapabilities. Supplying a name that is to long will result in an error (2104), or a name that is not unique (1200). |
| measurement=<string> | maximum, minimum, average, inherit | The value for each area in the group used for analysis. The alarm detection will use either maximum, minimum or average temperature for the respective areas in the group, while the inherit option will let the area´s own setting decide the value. |
| threshold=<int> |  | The allowed temperature difference from the resulting group analysis of the group area before an alarm is triggered. It is a positive value equal to or larger than 1. The allowed range is indirectly given by getConfigurationCapabilities. |
| delay=<int> |  | The number of seconds the trigger condition must be true before an alarm is triggered. If the delay time is zero the alarm will activate immediately when the trigger conditions are met. The maximum delay time is given by the getConfigurationCapabilities. |
| areaIds=Array of <int> |  | The area ID numbers of the areas in the group. In order to start analysis the number of areas must be at least 2. It is possible to set this parameter to fewer (or 0) areas, but doing so will lock enabled to false until there are enough areas. Changing areas are done with the methodupdateGroup. The upper area limit in the group is given bygetConfigurationCapabilities. |
| groupOverlay=<boolean> |  | Whether or not to display an area overlay when a group is triggered. |
| presetNbr=<int> |  | The preset number associated with this group. It will be ignored for non PTZ cameras, where it must be an existing preset number. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="addGroup | The requested method. |
| id=<int> | The new group ID. |
| enabled=<boolean> | The status of the new group. If the group's configuration is complete this will have the same value as in the request. Otherwise, it will be false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="addGroup" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Group name is not unique. |
| 1200 | Maximum number of groups for this preset already reached. |
| 1200 | Preset does not exist. |
| 1200 | Group area configuration is invalid (area(s) disabled, not existing, not in valid preset, or area limit reached). |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string>  Optional |  | The user sets this value and the application echoes it back in the response . |
| method=updateGroup |  | The method that should be used. |
| id=<int> |  | The ID of the group that should be updated. |
| enabled=boolean |  | The requested enabled state. The actual value will be returned in the response since, depending on the rest of the group configuration, a group may not be enabled if this value is set to true. |
| name=<string> |  | The updated name of the group. |
| measurement=<string> | maximum, minimum, average, inherit | Changes the measurement type. See addGroup for details. |
| threshold=<int> |  | The updated threshold value. See See addGroup for details. |
| delay=<int> |  | The updated delay value. See addGroup for details. |
| areaIds=Array of <int> |  | Fully replace the current area IDs in the group with new ones. The array can be empty. The same rules for enabling the group as for addGroup applies. |
| groupOverlay=<boolean> |  | Change if the trigger overlay should be displayed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="addGroup | The requested method. |
| enabled=<boolean> | The status of the updated group. Depending on what was updated, the group may shift from enabled to disabled without a specific user request. See addGroup for details. Updating a group to be enabled does not guarantee it is actually enabled (depending on the rest of the group configuration), which means that this value is needed for confirmation. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="updateGroup" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Group ID is invalid. |
| 1200 | Group name is not unique. |
| 1200 | Group area configuration is invalid (area(s) disabled, not existing, not in valid preset, or area limit reached). |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string>  Optional |  | The user sets this value and the application echoes it back in the response . |
| method=removeGroup |  | The method that should be used. |
| id=<int> |  | The ID of the group that should be removed. Must be a positive number. Using the special ID 0 will remove all existing groups for all presets. Specifying a group that does not exist will result in an error. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="removeGroup | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="removeGroup" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Group ID is invalid. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string>  Optional |  | The user sets this value and the application echoes it back in the response . |
| method=listGroups |  | The method that should be used. |
| presetNbr=<int>  Optional |  | The preset number for which the groups will be returned. If it is set to 0 or omitted, all groups for all presets will be returned. Specifying a preset that doesn't exist will result in an error. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version returned from the request. |
| context=<string>  Optional |  | The context set by the user in the request. |
| method="listGroups |  | The requested method. |
| id=<int> |  | The ID of the group. |
| enabled=boolean |  | See addGroup for an explanation of this parameter. |
| name=<string> |  | See addGroup for an explanation of this parameter. |
| measurement=<string> | maximum, minimum, average, inherit | The measurement type. See addGroup for details. |
| threshold=<int> |  | See addGroup for an explanation of this parameter. |
| delay=<int> |  | See addGroup for an explanation of this parameter. |
| areaIds=Array of <int> |  | See addGroup for an explanation of this parameter. |
| groupOverlay=<boolean> |  | See addGroup for an explanation of this parameter. |
| presetNbr=<int> |  | See addGroup for an explanation of this parameter. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listGroups" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1200 | Preset does not exist. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string>  Optional |  | The user sets this value and the application echoes it back in the response . |
| method=getGroupStatus |  | The method that should be used. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The API version returned from the request. |
| context=<string>  Optional |  | The context set by the user in the request. |
| method="getGroupStatus |  | The requested method. |
| id=<int> |  | The ID of the group. |
| triggered=<boolean> |  | Tells if the alarm has been triggered for a group. |
| details=<{}> |  | Contains specific data about the group's current status. To accomodate future extension, the contents of this parameter is dynamic to change, including being empty. The currently supported format include the following parameters: |

| Parameter | Sub-parameters | Description |
| --- | --- | --- |
| name=<string> |  | The name of the group. |
| currentDeviation=<float> |  | The current maximum deviation within the group. |
| memberAreas=<[{}]> | areaId, areaName | The group's areas. |
| areaId=<int> |  | The ID of an area in a group. |
| areaName=<string> |  | The name of an area in a group. |
| maxDeviationAreas=<[{}]> | maxAreaId, maxAreaTemp, minAreaId, minAreaTemp | The currently most and least deviating area in the group. |
| maxAreaId=<int> |  | The area ID of the most deviating area. |
| maxAreaTemp=<float> |  | The temperature of the most deviating area. |
| minAreaId=<int> |  | The area ID of the least deviating area. |
| minAreaTemp=<float> |  | The temperature of the least deviating area. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getGroupStatus" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Field name | Type | Nice name | Description | Values |
| --- | --- | --- | --- | --- |
| AreaID | Integer | Area ID | The temperature alarm area. | 0..maxAreas-1 |
| AlarmActive (STATE) | Boolean | Alarm Activated | True when active. | true/false |
| AreaName | String | Area Name | Name of the area. | Max 60 characters |
| PresetNbr | Integer | Preset Token | The preset number that the area belongs to. Only present for PTZ-enabled cameras. | 1..maxPresetNbr |
| AverageTemp | Float | Average Temperature | The average area temperature. | -40..700 |
| MaximumTemp | Float | Maximum Temperature | The maximum area temperature. | -40..700 |
| MinimumTemp | Float | Minimum Temperature | The minimum area temperature. | -40..700 |
| TemperatureUnit | String | Temperature Unit | The used temperature unit. | Celsius or Fahrenheit |
| MaxTempPositionX | Float | Maximum Temperature X Position | The X coordinate for maximum temperature. | -1..1 |
| MaxTempPositionY | Float | Maximum Temperature Y Position | The Y coordinate for maximum temperature. | -1..1 |
| MinTempPositionX | Float | Minimum Temperature X Position | The X coordinate for minimum temperature. | -1..1 |
| MinTempPositionY | Float | Minimum Temperature Y Position | The Y coordinate for minimum temperature. | -1..1 |

| Field name | Type | Nice name | Description | Values |
| --- | --- | --- | --- | --- |
| AreaName | String | Area Name | AnyArea | Max 60 characters |
| AlarmActive (STATE) | Boolean | AlarmActivated | True when active, otherwise false | true/false |

| Field name | Type | Nice name | Description | Values |
| --- | --- | --- | --- | --- |
| PresetNbr | Integer | Preset Token | The preset number that the area belongs to. Only present on PTZ-enabled cameras. | 1..maxPresetNbr |
| AlarmActive (STATE) | Boolean | Alarm Activated | True when active, otherwise false. | true/false |
| AreaName | String | Area Name | AnyAreaOnPreset | Max 60 characters |

| Field name | Type | Nice name | Description | Values |
| --- | --- | --- | --- | --- |
| AreaID | Integer | Area ID | The temperature alarm area. | 0..maxAreas-1 |
| AreaName | String | Area Name | Name of the area. | Max 60 characters |
| PresetNbr | Integer | Preset Token | The preset number that the area belongs to. Only present for PTZ-enabled cameras. | 1..maxPresetNbr |
| AverageTemp | Float | Average Temperature | The average area temperature. | -40..700 |
| MaximumTemp | Float | Maximum Temperature | The maximum area temperature. | -40..700 |
| MinimumTemp | Float | Minimum Temperature | The minimum area temperature. | -40..700 |
| TemperatureUnit | String | Temperature Unit | The used temperature unit. | Celsius or Fahrenheit |
| MaxTempPositionX | Float | Maximum Temperature X Position | The X coordinate for maximum temperature. | -1..1 |
| MaxTempPositionY | Float | Maximum Temperature Y Position | The Y coordinate for maximum temperature. | -1..1 |
| MinTempPositionX | Float | Minimum Temperature X Position | The X coordinate for minimum temperature. | -1..1 |
| MinTempPositionY | Float | Minimum Temperature Y Position | The Y coordinate for minimum temperature. | -1..1 |

| Field name | Type | Nice name | Description | Values |
| --- | --- | --- | --- | --- |
| GroupID | Integer | GroupID | The ID of the triggered groups. | 1 .. maxGroups |
| AlarmActive (STATE) | Boolean | Alarm Activated | true if active, otherwise false | true / false |
| GroupName | String | Group Name | The name of the triggered group. | Max 60 characters |
| DeltaTemp | Float | Delta Temp for Deviation Alarm | The maximum delta between area temperatures in the group. | 0 .. 700 |
| ThresholdTemp | Float | Threshold Temp for Deviation Alarm | The temperature threshold that should be exceeded for the event to trigger. | 1 .. 700 |
| PresetNbr | Integer | Preset Token | The preset number that the group belongs to. Only present on PTZ-enabled cameras. | 1 .. maxPresetNbr |
| PresetName | String | Preset Name | The name of the preset that the group belongs to. Only present on PTZ-enabled cameras. | Max 60 characters |

| JSON code | HTTP code | Description |
| --- | --- | --- |
| 1100 | 500 | Internal error.(1) |
| 2100 | 400 | API version not supported. |
| 2101 | 400 | Invalid JSON format. |
| 2102 | 400 | Method not supported. |
| 2103 | 400 | Required parameter missing. |
| 2104 | 400 | Invalid parameter value specified. |
| 2105 | 400 | Invalid arguments |
| 2106 | 400 | Invalid request method |
| 2107 | 400 | Invalid content length |
| 2108 | 400 | Invalid content type |
| 2109 | 403 | Authorization failed |
| 2110 | 401 | Authentication failed |

