# Find my device

**Source:** https://developer.axis.com/vapix/network-video/find-my-device/
**Last Updated:** Aug 26, 2025

---

# Find my device

## Description​

### Model​

### Identification​

## Common examples​

### Find my device​

#### Find​

#### Stop​

#### Get supported versions​

## API specification​

### find​

### stop​

### getSupportedVersions​

### General error codes​

## Footnotes​

The Find my device API makes it possible to locate an Axis device, for instance by playing a sound or flashing a status LED. As this is a generic API, the identification methods available on your device and the ones described herein may vary.

Implementing a method with this API while another API is using the same functions might lead to unexpected behavior. For example, triggering an audio clip at the same time as the device is playing something else, might interrupt the audio due to the higher priority of the Find my device API or become mixed.

The API implements findmydevice.cgi as its communications interface and supports the following methods:

Use this example to locate your device when you are setting up a system with either visible or audible aid. The example will also show you the required steps to stop the search sequence.

JSON input parameters

Successful response

Failed response

API references

JSON input parameters

Successful response

Failed response

API references

Use this example to retrieve a list of API versions supported on your device.

JSON input parameters

Successful response

Failed response

API references

This API method is used when you want to initiate the mechanism that locates the device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a full list of potential errors.

This API method is used when you want to halt the mechanism that locates the device during the middle of a duration-period set by the find parameter.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a full list of potential errors.

This API method is used when you want to retrieve a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

The following table lists the errors that can occur for any API method.

Out-of-memory errors will also return this error code. ↩

```
http://myserver/axis-cgi/findmydevice.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "find",    "params": {        "duration": 10    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "find",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "find",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://myserver/axis-cgi/findmydevice.cgi
```

```
{    "apiVersion": "1.1",    "context": "123",    "method": "stop"}
```

```
{    "apiVersion": "1.1",    "context": "123",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.1",    "context": "123",    "method": "stop",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://myserver/axis-cgi/findmydevice.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/findmydevice.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "find",  "params": {    "duration": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "find",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/findmydevice.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "stop"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "stop",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/findmydevice.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=findmydevice

- Request find with the following JSON syntax:

- Parse the JSON response.

- find

- Request stop with the following JSON syntax:

- Parse the JSON response.

- stop

- Get a list of supported API versions.

- Parse the JSON response.

- getSupportedVersions

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Out-of-memory errors will also return this error code. ↩

| Method | Description |
| --- | --- |
| find | Initiates the mechanism that locates the device. |
| stop | Halts the mechanism that locates the device. |
| getSupportedVersions | Lists supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used in the request. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="find" | The operation that should be performed. |
| params.duration=<integer> | The user sets this value to specify how long the search sequence shall last. This parameter is specified in seconds with the upper limit being 3600 seconds (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context that was used when the request was made (optional). |
| method="find" | The operation that was performed. |
| data | No data will return in a successful request. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used in the request. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="stop" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context that was used when the request was made (optional). |
| method="stop" | The operation that was performed. |
| data | No data will return in a successful request. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context that was used when the request was made. |
| method="getSupportedVersions" | The operation that was performed. |
| data.apiVersions[]=<list of versions> | Specifies the list of supported versions and includes all major versions together with their highest supported minor version. |
| <list of versions> | The list of "<Major>.<Minor>" versions, e.g. ["1.4", "2.5"]. |

| Code | Description |
| --- | --- |
| 1100 | Internal error(1) |
| 2100 | API version not supported. |
| 2101 | Invalid JSON format. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing or invalid |
| 2104 | Invalid parameter value specified |
| 2200 | Transport layer error (e.g. request not HTTP POST) |
| 2201 | Busy, already performing method |

