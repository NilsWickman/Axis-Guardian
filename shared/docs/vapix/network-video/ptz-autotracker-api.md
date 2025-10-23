# PTZ Autotracker API

**Source:** https://developer.axis.com/vapix/network-video/ptz-autotracker-api/
**Last Updated:** Aug 28, 2025

---

# PTZ Autotracker API

## Description​

### Model​

### Identification​

## Common examples​

### Get supported versions​

### Set and get the current settings​

#### Get settings​

#### Update current settings​

#### Set current viewport​

## API specifications​

### getSupportedVersions​

### setAutotrackingSettings​

### getAutotrackingSettings​

### setAutotrackingTarget​

### getAutotrackingTarget​

### setApplicationSettings​

### getApplicationSettings​

### setViewportConfig​

### getViewportConfig​

### Object stream description​

### setAutotrackingState​

### getAutotrackingState​

### addProfile​

### getProfile​

### updateProfile​

### deleteProfile​

### General error codes​

The PTZ Autotracker API will show you the steps required to track moving objects with your Axis PTZ camera. The Autotracker itself comes pre-installed on supported cameras and the API consists of a number of CGIs used for querying status and information, and controlling the Autotracker functions, divided into the following sub-groups:

The API implements the following CGIs and methods:

The PTZ Autotracker POST CGIs

The PTZ Autotracker API functions

Use this example to check which version of the PTZ Autotracker that exists for your device.

JSON input parameters

Successful response

Error response

API references

See getSupportedVersions for further instructions.

Use this example to retrieve a list of the general settings for the PTZ Autotracker.

JSON input parameters

Successful response

Error response

API references

See getAutotrackingSettings for further instructions.

JSON input parameters

Successful example

API references

See setAutotrackingSettings for further instructions.

JSON input parameters

Successful response

API references

See setViewportConfig and getViewportConfig for further instructions.

This API method retrieves a list of supported major API versions along with their highest supported minor version.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method changes the general PTZ Autotracker settings. You will not be able change profile settings with this method and only JSON objects included in the request can be updated. So for example, if you want to remove a color combination, you need to send a JSON object with that id included.

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method lists available autotracker settings.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method starts the object tracking.

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method allows the application to operate in either manual or automatic mode. For example, if the getAutotrackingState returns enabled = true, it means that the application is in automatic mode.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

Use this method to start or stop PTZ Autotracker service.

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

Use this method check if the Autotracker service is running.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method sets the viewport rotation. Supported rotation values are between 0 and 180 degrees.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method returns the value set by the setViewportConfig, or a negative value if nothing has been set.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

Once a viewport has been configured, the application will start sending metadata on the camera’s event channel such as this:

This example shows the metadata with three moving objects and one zone (with four corners) visible in the video stream. Zone coordinates may be outside the [0,1] range, as they can be outside the visible screen. All x- and y-coordinates range between 0 and 1, where [0,0] is the top left corner and [1,1] is bottom right.

This API method sets the application to either manual or automatic mode. If the autotracking state is enabled, it will be set to automatic mode and the first object that enters a zone will automatically trigger the tracking. When the autotracking is set to manual there is no automatic triggering active, which means that zones and profiles are turned off.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method retrieves the application in either manual or automatic mode. If getAutotrackingState returns enabled = true, it means that the application is in automatic mode.

Request

JSON input parmeters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method adds a profile to the PTZ Autotracker settings.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method fetches all settings associated with a profile.

Request

JSON input parameters

Response value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method updates the PTZ Autotracker profile settings. As with other interfaces, the JSON objects sent are the ones that will be updated, for example, if only id and name are included in the request, only those will be updated, while polygon and other settings will remain unchanged.

The polygon array is a list of x and y coordinates that corresponds to the corners of the polygon (between 3 and 10 corners) currently shown by the video stream on the camera.

Request

JSON input parameters

Response value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method deletes a PTZ Autotracker profile.

Request

JSON input parameters

Response value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This table lists the general error codes that can occur for any API method. Method specific errors are listed under the respective descriptions.

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": "1.0"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "data": {        "minObjectSize": {            "width": 7,            "height": 7,            "enabled": true        },        "minObjectLifespan": {            "time": 3,            "enabled": true        },        "profiles": [            {                "id": 1,                "name": "Profile 1",                "preset": -1,                "enabled": false            },            {                "id": 2,                "name": "Profile 2",                "preset": -1,                "enabled": false            },            {                "id": 3,                "name": "Profile 3",                "preset": 5,                "enabled": false            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingSettings",    "params": {        "minObjectSize": {            "width": 3,            "height": 3,            "enabled": false        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingSettings",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setViewportConfig",    "params": {        "rotation": 180    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setViewPortConfig",    "data": {}}
```

```
{    "context": "abc",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "<Major2.Minor2>",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "abc",  "method": "getSupportedVersions",  "error": {    "code": <integer error code>  }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingSettings",    "params": {        "minObjectSize": {            "width": 7,            "height": 7,            "enabled": true        },        "minObjectLifespan": {            "time": 3,            "enabled": true        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingSettings",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingSettings",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "data": {        "minObjectSize": {            "width": 7,            "height": 7,            "enabled": true        },        "minObjectLifespan": {            "time": 3,            "enabled": true        },        "profiles": [            {                "id": 1,                "name": "Profile 1",                "preset": -1,                "enabled": false            },            {                "id": 2,                "name": "Profile 2",                "preset": -1,                "enabled": false            },            {                "id": 3,                "name": "Profile 3",                "preset": 5,                "enabled": false            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingSettings",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingTarget",    "params": {        "targetId": 101    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingTarget",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingTarget",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingTarget",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingTarget",    "data": {        "targetId": 101    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingState",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setApplicationSettings",    "params": {        "service": {            "active": true        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setApplicationSettings",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setApplicationSettings",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getApplicationSettings",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getApplicationSettings",    "data": {        "service": {            "active": true        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getApplicationSettings",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setViewportConfig",    "params": {        "rotation": 180    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setViewportConfig",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setViewportConfig",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getViewportConfig",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getViewportConfig",    "data": {        "rotation": 180    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getViewportConfig",    "error": {        "code": 1003    }}
```

```
<MESSAGE > ---- Event ------------------------<MESSAGE > Global Declaration Id: 165<MESSAGE > Local Declaration Id: 1<MESSAGE > Producer Id: 38<MESSAGE > Timestamp: 1549289932.405513<MESSAGE > [jsonframe = '{"objects":[{"id":11215,"x":0.4176,"y":0.3057,"width":0.01257,"height":0.04077},{"id":11210,"x":0.3989,"y":0.239,"width":0.008301,"height":0.04822},{"id":11205,"x":0.7885,"y":0.03162,"width":0.0459,"height":0.04077}],"zones":[{"profileId":1,"zoneType":0,"polygon":[0.2888,0.3782,0.3907,0.3679,0.4277,0.4849,0.3054,0.5005]}]}'] {onvif-data}<MESSAGE > [tnsaxis:topic0 = 'CameraApplicationPlatform']<MESSAGE > [tnsaxis:topic2 (streamObjects) = 'streamObjects' (streamObjects)] {isApplicationData}<MESSAGE > [tnsaxis:topic1 (PtzAutotracking) = 'PtzAutotracking' (PtzAutotracking)]
```

```
{    "object": [        {            "id": 11215,            "x": 0.4176,            "y": 0.3057,            "width": 0.01257,            "height": 0.04077        },        {            "id": 11210,            "x": 0.3989,            "y": 0.239,            "width": 0.008301,            "height": 0.04822        },        {            "id": 11205,            "x": 0.7885,            "y": 0.3162,            "width": 0.0459,            "height": 0.04077        }    ],    "zones": [        {            "profileId": 1,            "zoneType": 0,            "polygon": [0.2888, 0.3782, 0.3907, 0.3679, 0.4277, 0.4849, 0.3054, 0.5005]        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingState",    "params": {        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingState",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setAutotrackingState",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingState",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingState",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getAutotrackingState",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addProfile",    "params": {        "name": "Profile 1",        "preset": -1,        "enabled": false,        "polygon": [0.426, 0.574, 0.326, 0.774, 0.526, 0.774]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addProfile",    "data": {        "id": 1,        "name": "Profile 1",        "preset": -1,        "enabled": false    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addProfile",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getProfile",    "params": {        "id": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getProfile",    "data": {        "id": 1,        "name": "Profile 1",        "preset": -1,        "enabled": false,        "polygon": [0.426, 0.574, 0.326, 0.774, 0.526, 0.774]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getProfile",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "updateProfile",    "params": {        "id": 1,        "name": "Profile 1",        "preset": -1,        "enabled": false,        "polygon": [0.426, 0.574, 0.326, 0.774, 0.526, 0.774]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "updateProfile",    "data": {        "id": 1,        "name": "Profile 1",        "preset": -1,        "enabled": false    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "updateProfile",    "error": {        "code": 1003    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "deleteProfile",    "params": {        "id": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "deleteProfile",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "deleteProfile",    "error": {        "code": 1003    }}
```

- The general settings, including filters, GUI view settings, etc.
- A switch with which you can turn on and off the profile tracking.
- Functions for the metadata stream, which are also used to set the image rotation.
- The on/off switch for the automatic profile (zone) triggers.
- The profile (zone) configurations.

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 9.10 and later
- API Discovery: id=autotracking-2

- Request version support for the PTZ Autotracker protocol.

- User level: Admin, Operator, Viewer

- Parse the JSON response.

- Request the current general settings for the autotracker.

- User level: Admin, Operator, Viewer

- Parse the JSON response.

- Update the autotracker settings.

- User level: Admin, Operator

- Parse the JSON response.

- Request the autotracker to send a list of potential moving objects and visible zones (profiles) in the JSON format.

- User level: Admin, Operator, Viewer

- User level: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator, Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- User level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| CGI | URL | User | Description |
| --- | --- | --- | --- |
| admin.cgi | http://<servername>/axis-cgi/ptz-autotracking/admin.cgi | Admin | Checks and changes the tracker settings. |
| operator.cgi | http://<servername>/axis-cgi/ptz-autotracking/operator.cgi | Operator | Checks and changes the tracker settings. |
| viewer.cgi | http://<servername>/axis-cgi/ptz-autotracking/viewer.cgi | Viewer | Checks the tracker settings. |

| Method | Description |
| --- | --- |
| setViewportConfig | Configures the Autotracker to include the camera’s rotation setting. |
| getViewportConfig | Returns the camera’s current rotation setting. |
| setAutotrackingSettings | Changes the general PTZ Autotracker settings. |
| getAutotrackingSettings | Lists the general PTZ Autotracker settings. |
| setAutotrackingTarget | Starts following an object visible in the video stream. |
| getAutotrackingTarget | Returns the currently tracked object. |
| setApplicationSettings | Sets general application settings. |
| getApplicationSettings | Returns general application settings. |
| setAutotrackingState | Enable/disables the automatic tracking in the zones. |
| getAutotrackingState | Returns the state of the automatic tracking in the zones. |
| addProfile | Creates a new profile. |
| updateProfile | Changes the settings for an existing profile. |
| getProfile | Returns the profile settings. |
| deleteProfile | Removes the profile. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| apiVersions | Array | The supported API versions presented in the format "Major.Minor". |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| minObjectSize | Object | The minimum object size that can cause a trigger in a zone. |
| minObjectLifespan | Object | The minimum lifespan (in seconds) for an object to cause a trigger in a zone. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains the method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid profile ID |
| 1102 | Max number of profiles reached |
| 1103 | Invalid number of coordinates in zone (not equal x/y for example) |
| 1104 | Too many coordinates in zone |
| 1105 | Too few coordinates in zone |
| 1106 | Profile name empty |
| 1107 | Invalid preset |
| 1108 | Could not update zone |
| 1109 | No zone included |
| 1110 | Tracker not active |
| 1201 | Invalid color id |
| 1202 | No colours configured |
| 1301 | Invalid min object size width |
| 1302 | Invalid min object size height |
| 1401 | Invalid lifespan time |
| 1801 | Invalid value for timeout to home |
| 1802 | Invalid value for zoom limit |
| 1803 | Invalid value for max profile number |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format Major.Minor. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains the method specific parameters listed below. |
| minObjectSize | Object | The minimum size settings for an object that can be triggered in the zones. |
| minObjectLifespan | Object | The minimum lifespan (in seconds) for an object that can be triggered in the zones. |
| profiles | Array | A list of available profiles (zones) along with their settings. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| targetId | Integer | The video-scene ID for the object that should be followed. -1 is used to stop the tracking. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid object ID |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| targetId | Integer | The video-scene ID for the object that is followed. -1 is used for not tracking. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid object ID |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| service | Object | Container for active state. |
| active | Boolean | true: Start the service.false: Stop the service. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| service | Object | Container for active state. |
| active | Boolean | true: The service is running.false: The service is stopped. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| rotation | Integer | Rotation value of the camera. Only values between 0 and 180 are supported. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid object ID |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| rotation | Integer | The camera rotation. -1 will be used if rotation hasn’t been initialized, otherwise a value of either 0 or 180 will be used.. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid object ID |

| Parameter | Type | Description |
| --- | --- | --- |
| objects | Array | A list of moving objects visible on screen. |
| id | Integer | The object ID that will be used when starting manual tracking. |
| x | Double | The X coordinate of the top left corner of the object. |
| y | Double | The Y coordinate of the top left corner of the object. |
| width | Double | The object width. |
| height | Double | The object height. |
| zones | Array | A list of zones visible on screen. |
| profileId | Integer | The zone ID. |
| zoneType | Integer | The zone type. |
| polygon | Array | A list of [x,y] coordinates. Represents the corner of the profile/zone. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| enabled | Boolean | The tracking option status. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains the method specific parameters. |
| enabled | Boolean | Determines whether tracking is set to automatic or manual. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| name | String | The profile name (optional). |
| preset | Integer | The number of connected presets. -1 if no preset is connected. |
| enabled | Boolean | True if a profile/zone is enabled. |
| polygon | Array | An array containing the floats, such as a three point polygon ([x[0], y[0], x[1], y[1], x[2], y[2]]). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains method specific parameters. |
| id | Integer | The profile ID. |
| name | String | The profile name. |
| preset | Integer | The number of connected presets. -1 if no preset is connected. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1102 | Max number of profiles reached |
| 1103 | Invalid number of coordinates in zone (not equal x/y for example) |
| 1104 | Too many coordinates in zone |
| 1105 | Too few coordinates in zone |
| 1109 | No zone included |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| id | Integer | The ID for the requested profile. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains method specific parameters. |
| id | Integer | The profile ID. |
| name | String | The profile name. |
| preset | Integer | The number of connected presets. -1 if no preset is connected. |
| enabled | Boolean | Set to true if this profile/zone has been enabled. |
| polygon | Array | An array containing floats, such as a three point polygon ([x[0], y[0], x[1], y[1], x[2], y[2]]). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| id | Integer | The ID of the requested profile. |
| name | String | The profile name. |
| preset | Integer | The number of connected presets. -1 if no preset is connected. |
| enabled | Boolean | True if a profile/zone is enabled. |
| polygon | Array | An array containing the floats, such as a three point polygon ([x[0], y[0], x[1], y[1], x[2], y[2]]). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format "Major.Minor". |
| context | String | A text string that will be echoed back as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains method specific parameters. |
| id | Integer | The profile ID. |
| name | String | The profile name. |
| preset | Integer | The number of connected presets. -1 if no preset is connected. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1103 | Invalid number of coordinates in zone (not equal x/y for example) |
| 1104 | Too many coordinates in zone |
| 1105 | Too few coordinates in zone |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Contains method specific parameters. |
| id | Integer | The ID of the requested profile. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |

| Code | Description |
| --- | --- |
| 1101 | Invalid profile ID |

| Code | Description |
| --- | --- |
| 1001 | The provided JSON input was invalid. |
| 1002 | No Method name tag found in request. |
| 1003 | Method not supported. |
| 1004 | Parameter tag ("params") required, but missing. |
| 1005 | Required parameter missing. |
| 1006 | Invalid value of parameter. |
| 1007 | Internal error. |

