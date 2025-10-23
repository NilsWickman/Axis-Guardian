# Clear view

**Source:** https://developer.axis.com/vapix/network-video/clear-view/
**Last Updated:** Aug 18, 2025

---

# Clear view

## Description​

### Model​

### Identification​

## Common examples​

### Detect supported versions​

### Get service info​

### Start cleaning view​

### Stop cleaning view​

### Get status​

## API specification​

### getSupportedVersions​

### getServiceInfo​

### getStatus​

### start​

### stop​

### General error codes​

The Clear view API makes it possible to activate functions that keeps your Axis camera lens and/or dome clean. This is useful in environments where water from rain and ice or dust particles are common issues. The API features functions that lets you clear water droplets by using either the wiper or speed dry functionality in cameras where this option is present.

The API implements clearviewcontrol.cgi as its communications interface and supports the following methods:

Use this example to check if Clear view is supported on your camera and potential limitations that might be implemented.

Request Clear view protocol version support using POST.

JSON input parameters

Parse the JSON response.

Successful response

Error response

API references

getSupportedVersions

Use this example to retrieve a list containing supported information about the Clear view controller service.

Request a list of the Clear view service information using POST.

JSON input parameters

Parse the JSON response.

Successful response

Error response

API reference

getServiceInfo

Use this example to remove water droplets from your device.

Initiate Clear view

Start the Clear view operation with the default duration using POST.

JSON input parameters

Parse the JSON response.

Successful response

Error response

API references

start

Start Clear view with a specified duration

Initiate Clear view on a specified device with duration using POST.

JSON input parameters

Parse the JSON response.

Successful response

Error response

API references

start

Use this example to halt a currently running cleaning function.

Stop cleaning view

Halt any currently running Clear view operation on a service using POST.

JSON input parameters

Parse the JSON response

Successful response

Error response

API references

stop

Use this example to check if Clear view is currently active or when it can be activated again.

Request status and availability from the device using POST.

http://myserver/axis-cgi/clearviewcontrol.cgi

JSON input parameters

The following example response will appear for idle devices.

JSON output parameters

The following example response will appear for running devices where idleTimeMin is not defined (i.e. set to 0).

JSON output parameters

API references

getStatus

This method is used when you want to retrieve a list containing the API versions supported by your device. The returned list consists of all supported major versions along with their highest supported minor versions.

Request

JSON input parameters

Return value - Success

Return value - Failure

Error codes

No specific errors exists for this method. See General error codes for a complete list.

This method is used when you want to retrieve a list containing the Clear view service info.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

No specific errors exists for this method. See General error codes for a complete list.

This method is used when you want to retrieve the Clear view status.

Request

JSON Input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

No specific errors exists for this method. See General error codes for a complete list.

This method is used when you want to initiate a Clear view service.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

No specific errors exists for this method. See General error codes for a complete list.

This method is used when you want to halt a Clear view service.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

No specific errors exists for this method. See General error codes for a complete list.

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error, could not complete request."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "data": {        "serviceInfo": [            {                "id": 0,                "type": "wiper",                "durationVariable": true,                "durationMin": 5,                "durationMax": 120,                "durationDefault": 5,                "idleTimeMin": 0,                "stoppable": true            },            {                "id": 1,                "type": "speeddry",                "durationVariable": false,                "durationDefault": 10,                "idleTimeMin": 15,                "stoppable": false            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "error": {        "code": 3000,        "message": "The requested API version is not supported."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1002,        "message": "Device in incompatible state."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "id": 0,        "duration": 30    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1003,        "message": "Requested duration outside supported limits."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "id": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "state": "idle"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "state": "running",        "stopsIn": 23    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "<Major.Minor>",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "data": {        "serviceInfo": [            {                "id": 0,                "type": "wiper",                "durationVariable": true,                "durationMin": 5,                "durationMax": 120,                "durationDefault": 5,                "idleTimeMin": 0,                "stoppable": true            },            {                "id": 1,                "type": "speeddry",                "durationVariable": false,                "durationDefault": 10,                "idleTimeMin": 15,                "stoppable": false            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "error": {        "code": 3000,        "message": "The requested API version is not supported."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "status": {            "state": "running",            "stopsIn": 3,            "availableIn": 13        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "error": {        "code": 1001,        "message": "The requested Clear View device id is not supported."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "id": 0,        "duration": 10    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1001,        "message": "The requested Clear View device id is not supported."    }}
```

```
http://myserver/axis-cgi/clearviewcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 1001,        "message": "The requested Clear View device id is not supported."    }}
```

- Property: Properties.API.HTTP.Version=3
- Property: Properties.ClearView.ClearView=yes
- AXIS OS: 7.10 and later

- Request Clear view protocol version support using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "context": "my context",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1"]    }}
Error response
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error, could not complete request."    }}

- getSupportedVersions

- Request a list of the Clear view service information using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "params": {}}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "data": {        "serviceInfo": [            {                "id": 0,                "type": "wiper",                "durationVariable": true,                "durationMin": 5,                "durationMax": 120,                "durationDefault": 5,                "idleTimeMin": 0,                "stoppable": true            },            {                "id": 1,                "type": "speeddry",                "durationVariable": false,                "durationDefault": 10,                "idleTimeMin": 15,                "stoppable": false            }        ]    }}
Error response
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceInfo",    "error": {        "code": 3000,        "message": "The requested API version is not supported."    }}

- getServiceInfo

- Start the Clear view operation with the default duration using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "id": 0    }}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {}}
Error response
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1002,        "message": "Device in incompatible state."    }}

- start

- Initiate Clear view on a specified device with duration using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "id": 0,        "duration": 30    }}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {}}
Error response
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1003,        "message": "Requested duration outside supported limits."    }}

- start

- Halt any currently running Clear view operation on a service using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "id": 1    }}
- Parse the JSON response
Successful response
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
Error response
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 2004,        "message": "Method not supported."    }}

- stop

- Request status and availability from the device using POST.
http://myserver/axis-cgi/clearviewcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "params": {        "id": 0    }}
- The following example response will appear for idle devices.
JSON output parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "state": "idle"    }}
- The following example response will appear for running devices where idleTimeMin is not defined (i.e. set to 0).
JSON output parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "state": "running",        "stopsIn": 23    }}

- getStatus

- Security level: admin, operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getSupportedVersions | Retrieves a list of the API versions supported by the CGI. |
| getServiceInfo | Retrieves a list containing the Clear view service information (static values only). |
| getStatus | Retrieves the Clear view service status for one service (dynamic values). |
| start | Initiates the Clear view function for one service. |
| stop | Halts the Clear view function. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The context used when the request was made (optional). |
| method | String | The operation that was performed. |
| data | JSON object | A container for the response specific parameters. |
| apiVersions | Array | The supported API versions, presented in the format Major.Minor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the error message. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be performed. |
| params | JSON object | Container for the method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The context used when the request was made (optional). |
| method | String | The operation that was performed. |
| data | JSON object | A container for the response specific parameters. |
| serviceInfo | Array | The supported Clear view services. |
| id | Integer | The ID of the clear view device. |
| type | String | Defined types are wiper and speeddry. |
| durationVariable | Boolean | The duration control. |
| durationMin | Integer | Present if durationVariable = true. |
| durationMax | Integer | Present if durationVariable = true. |
| durationDefault | Integer | The default duration, measured in seconds. |
| stoppable | Boolean | The stop-command for the device. |
| idleTimeMin | Integer | Should be included if the device needs to rest between runs, measured in seconds. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the error message. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be performed. |
| params | JSON object | Container for the method specific parameters. |
| id | Integer | The device ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The context used when the request was made (optional). |
| method | String | The operation that was performed. |
| data | JSON object | A container for the response specific parameters |
| status | JSON object | The status of the clear view service. |
| id | Integer | The ID of the clear view device. |
| state | String | Defined states are idle, running and waiting. |
| stopsIn | Integer | Present if the state parameter is running. |
| availableIn | Integer | Present if idleTimeMin > 0 and the state parameter is either running or waiting. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the error message. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be performed. |
| params | JSON object | Container for the method specific parameters. |
| id | Integer | The device ID. |
| duration | Integer | The duration, measured in seconds (optional). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The context used when the request was made (optional). |
| method | String | The operation that was performed. |
| data | JSON object | A container for the response specific parameters. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the error message. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be performed. |
| params | JSON object | Container for the method specific parameters. |
| id | Integer | The device ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version, presented in the format Major.Minor. |
| context | String | The context used when the request was made (optional). |
| method | String | The operation that was performed. |
| data | JSON object | A container for the response specific parameters. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the error message. |

| Code | Description |
| --- | --- |
| 1000 | Invalid parameter value. |
| 1001 | The requested Clew View device ID is not supported. |
| 1002 | Device in incompatible state. |
| 1003 | Requested duration outside supported limits. |
| 1005 | Temperature out of range. |
| 2000 | Out of memory. |
| 2001 | Access forbidden (similar to HTTP 403). |
| 2002 | HTTP request type not supported. Only POST supported. |
| 2003 | The requested API version is not supported. |
| 2004 | Method not supported. |
| 4000 | The provided JSON input was invalid. |
| 4001 | A mandatory input parameter was not found in the input. |
| 4002 | The type of a provided JSON parameter was incorrect. |
| 8000 | Internal error. |

