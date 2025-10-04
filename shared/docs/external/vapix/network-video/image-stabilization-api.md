# Image stabilization API

**Source:** https://developer.axis.com/vapix/network-video/image-stabilization-api/
**Last Updated:** Aug 18, 2025

---

# Image stabilization API

## Description​

### Identification​

### Obsoletes​

## Use cases​

### Enable image stabilization​

### Set image stabilization type to OIS​

### Set manual focal length​

## API specification​

### getSupportedVersions​

### getCapabilities​

### getEnabled​

### setEnabled​

### getType​

### setType​

### getEISMargin​

### setEISMargin​

### getEISFocalLength​

### setEISFocalLength​

### getEISDemo​

### setEISDemo​

### General error codes​

The Image stabilization API lets you control different aspects of image stabilization. You can view values related to the current status of the image stabilization including if image stabilization is enabled, which type of image stabilization is configured as well as the configured values for EIS (Electrical Image Stabilization). You can also perform start or stop operations to enable or disable image stabilization.

The type of image stabilization can be changed between EIS and OIS (Optical Image Stabilization) on a supported device. Additional values can also be configured for EIS. The EIS specific values are margin, focal length and if demo mode should be enabled.

EIS related parameters Stabilizer, StabilizerMargin, and StabilizerFocalLength in param.cgi are obsoleted.

Use this method to get a list of supported major and minor API versions.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to list the image stabilization capabilities supported by your device.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to check if image stabilization is enabled or not.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to enable or disable image stabilization.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to get which type of image stabilization (EIS or OIS) is configured for your device.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to configure which type of image stabilization (EIS or OIS) for your device.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to get the configured margin for EIS. Return "Method not supported" if EIS is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to configure margin for EIS. Return "Method not supported" if EIS is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to get the manually configured focal length for EIS. Return "Method not supported" if EIS or manual focal length is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to manually configure focal length for EIS. Return "Method not supported" if EIS or manual focal length is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to check if demo is enabled for EIS. Return "Method not supported" if EIS is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

Use this method to enable or disable demo for EIS. Return "Method not supported" if EIS is not supported.

Request

Return value - Success

Return value - Failure

Error codes

See General error codes for a list of potential errors.

This table lists the general error codes that can occur for any API method. Method specific errors are listed under the respective descriptions.

```
{    "apiVersion": "1",    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "1.1"]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "data": {        "channels": [            {                "id": 0,                "EISSupport": true,                "OISSupport": false,                "manualFocalLength": true,                "minFocalLength": 7000,                "maxFocalLength": 70000            },            {                "id": 1,                "EISSupport": true,                "OISSupport": false,                "manualFocalLength": false            }        ]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getCapabilities",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getEnabled",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getEnabled",    "data": {        "enabled": true    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getEnabled",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "setEnabled",    "params": {        "id": 0,        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabled",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "setEnabled",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getType",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getType",    "data": {        "type": "EIS"    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "getType",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "setType",    "params": {        "id": 0,        "type": "EIS"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setType",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "setType",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getEISMargin",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getEISMargin",    "data": {        "margin": 4000    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "getEISMargin",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "setEISMargin",    "params": {        "id": 0,        "margin": 4000    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getEISMargin",    "data": {        "margin": 4000    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "setEISMargin",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getEISFocalLength",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getEISFocalLength",    "data": {        "focalLength": 10000    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "getEISFocalLength",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "setEISFocalLength",    "params": {        "id": 0,        "focalLength": 10000    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEISFocalLength",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "setEISFocalLength",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "getEISDemo",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getEISDemo",    "data": {        "demo": false    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "getEISDemo",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

```
{    "apiVersion": "1",    "context": "my context",    "method": "setEISDemo",    "params": {        "id": 0,        "demo": false    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEISDemo",    "data": {        "demo": false    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": "setEISDemo",  "error": {    "code": <integer error code>,    "message": "The error message"  }}
```

- API discovery: id=image-stabilization

- Send a getEnabled request with params.id=0.
- Read the getEnabled response to know if image stabilization is enabled.
- Send a setEnabled request with params.id=0 and enabled=true to enable image stabilization.
- Read the setEnabled response.

- Send a getType request with params.id=0.
- Read the getType response to know which type of image stabilization is currently configured.
- Send a getCapabilities request.
- Read the getCapabilities response to know if OIS is supported.
- Send a setType request with params.id=0 and type=OIS.
- Read the setType response.

- Send a getCapabilities request.
- Read the getCapabilities response to know if manual focal length is supported.
- Send a setEISFocalLength request with params.id=0 and specified focalLength.
- Read the setEISFocalLength response.

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

- Permission: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad request, 401 Authentication failed, 403 Authorization failed
- Content-Type: application/json

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameters | Type | Description |
| --- | --- | --- |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| apiVersions | Array | The supported API versions presented in the format "Major.Minor". |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.channels | Array | An array of image stabilization settings. |
| data.channels.id | Integer | The ID of the camera image channel. |
| data.channels.EISSupport | Boolean | Indicates if the camera supports EIS. |
| data.channels.OISSupport | Boolean | Indicates if the camera supports OIS. |
| data.channels.manualFocalLength | Boolean | Indicates if focal length is configured manually. |
| data.channels.minFocalLength | Integer | The minimum value for focal length with a range between 4000-120000. Only available when manualFocalLength= true. |
| data.channels.maxFocalLength | Integer | The maximum value for focal length with a range between 4000-120000. Only available when manualFocalLength= true. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.enabled | Boolean | Indicates if image stabilization is enabled. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |
| params.enabled | Boolean | true to enable image stabilization. false to disable image stabilization. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.type | String | The type of image stabilization configured. Enum values: EIS, OIS |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |
| params.type | Integer | Specify the type of image stabilization to configure. Enum values: EIS, OIS |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.margin | Integer | The configured margin for EIS with a range between 0–9999. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |
| data.margin | Integer | Specify the margin for EIS with a range between 0–9999. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.margin | Integer | The configured margin for EIS with a range between 0–9999. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.focalLength | Integer | The configured focal length for EIS with a range between minFocalLength and maxFocalLength. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |
| params.focalLength | Integer | Specify the focal length to configure with a range between minFocalLength and maxFocalLength. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.demo | Boolean | Indicates if demo is enabled. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version to use (optional). |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | Object | Container for the method specific parameters listed below. |
| params.id | Integer | The ID of the camera image channel. |
| params.demo | Boolean | true to enable demo. false to disable demo. |

| Parameters | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | Object | Contains response specific parameters. |
| data.demo | Boolean | Indicates if demo is enabled. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). Only available for 403 error. |
| method | String | The performed method. Only available for 403 error. |
| error | Object | The error object. |
| error.code | Integer | The error code. |
| error.message | String | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 1100 | Internal error. |
| 1200 | Invalid stabilization type. |
| 2101 | Invalid JSON. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |
| 2106 | Authentication failed. |
| 2100 | API version not supported. |

