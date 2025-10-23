# QuadView configuration

**Source:** https://developer.axis.com/vapix/network-video/quadview-configuration/
**Last Updated:** Aug 18, 2025

---

# QuadView configuration

## Description​

### Model​

### Identification​

## Common examples​

### Get the current order of the sub views​

### Reorder the sub views​

### Enable and disable the QuadEye​

### Get the status of the QuadEye​

### Get supported versions​

## API specification​

### getOrder​

### setOrder​

### getQuadEyeValue​

### setQuadEyeValue​

### getSupportedVersions​

### General error codes​

The QuadView configuration API makes it possible to make adjustments to the quad view in an Axis device, either by changing the order of the sub views, or by adding a fifth so called overview to the centre of your quad view.

The API implements quadviewsetup.cgi as its communications interface and supports the following methods:

The quad view itself is made up of dewarped images from the Overview channel divided into four sub views.

Overview

The Overview channel has the shape of a circle.



The QuadView consist of 4 dewarped views (subviews), of the Overview



QuadView

The QuadView, where each sub view ID matches the Overview channel. The order are camera and mounting position dependant, meaning that while the initial order can be 1, 2, 3 and 4 or 2, 1, 3 and 4 for a different position. Please note that the order of views can be forcefully rearranged if you use the mounting position parameter root.ImageSource.IO.CameraTiltOrientation.



Identification for the quad view order

Identification for the quad view and the overview

Use this example to retrieve the current order of the sub views in the quad view.

Successful response

Error response

API references

Use this example to rearrange the order of the sub views in your quad view.

Successful response

Error response

API references

Use this example to enable QuadOverView. This lets you adjust the quad view to a desired position during the installation. Enabling both quad view and overview lets you add overview as an overlay to the center of the quad view.

Set the value for the QuadEye

Successful response

Error response

API references

Use this example during the installation to enable QuadOverView and realign the quad view to a desired position. Enabling both quad view and overview will add an overview as an overlay to the center of the quad view.

Retrieve the value of the QuadEye

Successful response

Error response

API references

Use this example to retrieve a list of API versions supported by your device.

Successful response

Error response

API references

This API method can be used to retrieve the order of sub views configured in the quad view.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method can be used to configure the order of sub views in a quad view.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method can be used to return the status of both the quad view and overview whether it is active or not.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method can be used to activate or deactivate the quad view and Overview.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This API method can be used to retrieve a list of API versions that is available on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getOrder"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getOrder",    "data": {        "id": [1, 2, 3, 4]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getOrder",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setOrder",    "params": {        "id": [1, 4, 2, 3]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setOrder",    "data": {        "id": [1, 4, 2, 3]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setOrder",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setQuadEyeValue",    "params": {        "quadeye": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setQuadEyeValue",    "data": {        "quadeye": "true"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setQuadEyeValue",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getQuadEyeValue"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getQuadEyeValue",    "data": {        "quadeye": "false"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getQuadEyeValue",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "context": "123",    "method": "getSupportedVersions"}
```

```
{    "context": "123",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": {        "code": 2102,        "message": "Method not supported"    }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getOrder"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getOrder",  "data": {    "id": [      <int>,      <int>,      <int>,      <int>    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getOrder",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setOrder",  "params": {    "id": [      <int>,      <int>,      <int>,      <int>    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setOrder",  "data": {    "id": [      <int>,      <int>,      <int>,      <int>    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setOrder",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getQuadEyeValue"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getQuadEyeValue",  "data": {    "quadeye": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getQuadEyeValue",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/quadviewsetup.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setQuadEyeValue",  "params": {    "quadeye": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setQuadEyeValue",  "data": {    "quadeye": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setQuadEyeValue",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>","<Major2>.<Major2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- Property: Properties.QuadOverview.QuadViewOrder=yes
- API Discovery: id=reposition-quadview

- Property: Properties.QuadOverview.QuadOverview=yes

- Retrieve the order of sub views.

- Parse the JSON response. A successful response will return the sub views in the order that they were configured in the quad view.

- getOrder

- Rearrange the order of the sub views by switching the top-right and bottom-left ID:s. The order of views in this example are 1, 2, 4, 3 (top left, top right, bottom left and bottom right).

- Parse the JSON response. A successful response will return the rearranged order of the sub views.

- setOrder

- Enable the QuadEye

- Parse the JSON response. A successful response will return a new value for the QuadEyeValue: true if it has been enabled and false if it was disabled.

- setQuadEyeValue

- Check the status of the QuadEye.

- Parse the JSON response. A successful response will return a new value for the QuadEyeValue: true will enable the value while false disables it.

- getQuadEyeValue

- Retrieve a list of supported API versions:

- Parse the JSON response.

- getSupportedVersions

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator
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
| getOrder | Retrieve the order of sub views in a quad view. |
| setOrder | Set the order of sub views in a quad view. |
| getQuadEyeValue | Read if quad view and overview is enabled or disabled. |
| setQuadEyeValue | Enable or disable quad view plus overview. |
| getSupportedVersions | Retrieve a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getOrder" | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="getOrder" | The method that was performed. |
| id=<array> | Contains the order of sub views in the QuadView. The array has a length of 4 integers<int>, <int>, <int>, <int>numbered between 1 to 4 that represents the order of how they are configured in the quad view (top left, top right, bottom left and bottom right). The ID’s represent the part of the overview that is being dewarped into a view. In fisheye cameras the overview is a single source image in the shape of a circle divided into 4 parts with boundaries at 0, 90, 180 and 270 degree angles. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="getOrder" | The method that was performed. |
| error.code | The error code. |
| error.message | The error message. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method= "setOrder" | The performed method. |
| id=<array> | Contains the new order for the sub views that will be set in the QuadView. The format is an array <int>, <int>, <int>, <int> where the integers ranges in value from 1 to 4. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="addText" | The method that was performed. |
| data.id=<array> | The ID echoed back in the format <int>, <int>, <int>, <int>. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="setOrder" | The method that was performed. |
| error.code | The error code. |
| error.message | The error message. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getQuadEyeValue" | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="addText" | The method that was performed. |
| data.quadeye=<string> | The string can be either true or false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="getQuadEyeValue" | The method that was performed. |
| error.code | The error code. |
| error.message | The error message. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setQuadEyeValue" | The performed method. |
| quadeye=<boolean> | Defines whether quadeye should be enabled or disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="setQuadEyeValue" | The method that was performed. |
| data.quadeye=<string> | The string can be either true or false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="setQuadEyeValue" | The method that was performed. |
| error.code | The error code. |
| error.message | The error message. |

| Parameter | Description |
| --- | --- |
| method="getSupportedVersions" | The performed method. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |

| Parameter | Description |
| --- | --- |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="getSupportedVersions" | The method that was performed. |
| data.apiVersions[]=<list of versions> | Lists all supported major versions along with their highest supported minor version. |
| <list of versions> | List of "<Major>.<Minor>" versions, e.g. ["1.4", "2.5"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context=<string> | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method="getSupportedVersions" | The method that was performed. |
| error.code | The error code. |
| error.message | The error message. |

| Code | Description |
| --- | --- |
| 1100 | Internal error |
| 2100 | API version not supported |
| 2101 | Invalid JSON |
| 2102 | Method not supported |
| 2103 | Required parameter missing |
| 2104 | Invalid parameter value specified |

