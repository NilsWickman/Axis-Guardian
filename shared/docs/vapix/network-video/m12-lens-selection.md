# M12 Lens Selection API

**Source:** https://developer.axis.com/vapix/network-video/m12-lens-selection/
**Last Updated:** Sep 10, 2025

---

# M12 Lens Selection API

## Overview​

### Identification​

## Use cases​

### Get supported versions​

### Get supported lenses​

### Set current lens​

### Get current lens​

## API Specifications​

### getSupportedVersions​

### getSupportedLenses​

### getCurrentLenses​

### setCurrentLens​

### General error codes​

The VAPIX® M12 Lens Selection API provides the ability to select M12 lenses with different field of views and distortions for individual camera sensors.

This API was deprecated prior to release and will not receive any updates.

The API uses m12-lensselection.cgi as its communication interface and supports the following methods:

This example will show you how to create a list of all API versions currently supported by your device.

http://<servername>/axis-cgi/m12-lensselection.cgi

JSON input parameters

Successful response example

Error response example

See getSupportedVersions for further details.

This example will show you how to check what lenses to use for a camera sensor that will maintain full PTZ functionality.

http://<servername>/axis-cgi/m12-lensselection.cgi

JSON input parameters

Successful response example

Error response example

See getSupportedLenses for further details.

This example will show you how to exchange lenses on a camera sensor while maintaining full PTZ functionality.

http://<servername>/axis-cgi/m12-lensselection.cgi

JSON input parameters

Successful response example

Error response example

See setCurrentLens for further details.

This example will show you how to check which lens that is currently used by the camera sensor.

http://<servername>/axis-cgi/m12-lensselection.cgi

JSON input parameters

Successful response example

This response example returns the lens ID and name for the specified sensor ID.

This response example returns the lens ID and name of the current lens for all camera sensors.

Error response example

See getCurrentLenses for further details.

Retrieve a list of supported API versions.

Request

http://<servername>/axis-cgi/m12-lensselection.cgi

Responses

Successful response

Error response

Error codes

See General error codes for a complete list of potential errors.

Retrieve a list of supported lenses.

Request

http://<servername>/axis-cgi/m12-lensselection.cgi

Responses

Successful response

Error response

Error codes

See General error codes for a complete list of potential errors.

Retrieve the current lens for each camera sensor.

Request

http://<servername>/axis-cgi/m12-lensselection.cgi

Responses

Successful response

Error response

Error codes

See General error codes for a complete list of potential errors.

Set the current lens for a sensor.

Request

http://<servername>/axis-cgi/m12-lensselection.cgi

Responses

Successful response

Error response

Error codes

See General error codes for a complete list of potential errors.

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedLenses",    "params": {        "listSensorIds": true    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedLenses",    "data": [        {            "lensId": 1,            "lensName": "M12 6 mm",            "sensorIds": [1, 3]        },        {            "lensId": 2,            "lensName": "M12 1.37 mm",            "sensorIds": [2, 4]        },        {            "lensId": 3,            "lensName": "M12 16 mm",            "sensorIds": []        }    ]}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedLenses",    "error": {        "code": 8000,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "setCurrentLens",    "params": {        "sensorId": 1,        "lensId": 2    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "setCurrentLens",    "data": {}}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "setCurrentLens",    "error": {        "code": 1002,        "message": "Unsupported lens"    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getCurrentLenses",    "params": {        "sensorId": 3    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getCurrentLenses",    "data": [        {            "sensorId": 3,            "lensId": 2,            "lensName": "M12 1.37 mm"        }    ]}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getCurrentLenses",    "data": [        {            "sensorId": 1,            "lensId": 2,            "lensName": "M12 1.37 mm"        },        {            "sensorId": 2,            "lensId": 1,            "lensName": "M12 6 mm"        },        {            "sensorId": 3,            "lensId": 2,            "lensName": "M12 1.37 mm"        },        {            "sensorId": 4,            "lensId": 1,            "lensName": "M12 6 mm"        }    ]}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getCurrentLenses",    "error": {        "code": 1001,        "message": "Invalid sensor"    }}
```

```
{    "context": <string>,    "method": "getSupportedVersions"}
```

```
{    "context": <string>,    "method": "getSupportedVersions",    "data": {        "apiVersions": [ "<Major1>.<Minor1>", "<Major2>.<Minor2>" ]    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getSupportedVersions",    "error": {        "code": <integer error code>,        "message": <string>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getSupportedLenses",    "params": {        "listSensorIds": <boolean>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getSupportedLenses",    "data": [        {            "lensId": <integer>,            "lensName": <string>,            "sensorIds": [<integer>, ...]        },        ...    ]}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getSupportedLenses",    "error": {        "code": <integer error code>,        "message": <string>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getCurrentLenses",    "params": {        "sensorId": <integer>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getCurrentLenses",    "data": [        {            "sensorId": <integer>,            "lensId": <integer>,            "lensName": <string>        },        ...    ]}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "getCurrentLenses",    "error": {        "code": <integer error code>,        "message": <string>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "setCurrentLens",    "params": {        "sensorId": <integer>,        "lensId": <integer>    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "setCurrentLens",    "data": {    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": <string>,    "method": "setCurrentLens",    "error": {        "code": <integer error code>,        "message": <string>    }}
```

- The API will extract information from a file with both lens data and lens distortion data, and update the field of view data to correspond to the selected lens.
- This API is required in products that controls a remote PTZ camera and have exchangeable lenses.

- Property: Properties.API.HTTP.Version=3
- Property: Properties.M12LensSelection.M12LensSelection=yes
- Property: Properties.M12LensSelection.Version=1.00
- Firmware: 6.50

- Retrieve a list of supported API versions.

- Parse the JSON response.

- Retrieve a list of supported lenses.

- Parse the JSON response.

- Set the current lens.

- Parse the JSON response.

- Get the current lens information.

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

| Method | Description |
| --- | --- |
| getSupportedLenses | Return a list of supported lenses. |
| setCurrentLens | Set the current lens for one of the sensors. |
| getCurrentLenses | Return the current lenses used by the camera sensors. |
| getSupportedVersions | Return a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| context=<string>  Optional | The user sets this value in the request and the application will echo it back in the response. |
| method="getSupportedVersions" | The API method called in the request. |

| Parameter | Description |
| --- | --- |
| context=<string>  Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested API method. |
| data.apiVersions[]=<list of versions> | List of supported versions. Includes all major versions along with their highest minor version. |
| <list of versions> | List of “<Major>.<Minor>" versions, for example ["1.4", "2.5"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested API method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that should be used. |
| context=<string>  Optional | The user sets this value in the request and the application will echo it back in the response. |
| method="getSupportedLenses" | The API method called in the request. |
| params=<listSensorIds>  Optional | The user sets this value and the server will add an array of sensor IDs for the currently used lens. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="getSupportedLenses" | The requested API method. |
| data=<array> | Container for response specific parameters listed below. |
| lensId=<integer> | The lens ID. |
| lensName=<string> | The lens name. |
| sensorIds=<array of integers> | An array of sensor IDs where the lens is used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="getSupportedLenses" | The requested API method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that should be used. |
| context=<string>  Optional | The user sets this value in the request and the application will echo it back in the response. |
| method="getCurrentLenses" | The API method called in the request. |
| params=<sensorId>  Optional | The user sets this value and the server will get the current lens for the specified sensor ID. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="getCurrentLenses" | The requested API method. |
| data=<array> | Container for response specific parameters listed below. |
| sensorId=<integer> | The sensor ID. |
| lensId=<integer> | The lens ID. |
| lensName=<string> | The lens name. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="getCurrentLenses" | The requested API method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that should be used. |
| context=<string>  Optional | The user sets this value in the request and the application will echo it back in the response. |
| method="setCurrentLens" | The API method called in the request. |
| params=<sensorId> | The sensor ID that should be set. |
| params=<lensId> | The lens ID that should be set. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="setCurrentLens" | The requested API method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version used in the request. |
| context=<string>  Optional | The context set by the user in the request. |
| method="setCurrentLens" | The requested API method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 1000 | Invalid parameter value. |
| 1001 | Invalid sensor. |
| 1002 | Unsupported lens. |
| 2000 | Out of memory. |
| 2001 | Access forbidden (similar to HTTP 403). |
| 2002 | HTTP request type not supported. Only POST supported. |
| 2003 | The requested API version is not supported. |
| 2004 | Method not supported. |
| 4000 | The provided JSON input was invalid. |
| 4001 | A mandatory input parameter was not found in the input. |
| 4002 | The type of a provided JSON parameter was incorrect. |
| 8000 | Internal error, could not complete request. |

