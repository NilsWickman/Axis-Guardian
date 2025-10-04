# Systemready API

**Source:** https://developer.axis.com/vapix/network-video/systemready-api/
**Last Updated:** Aug 18, 2025

---

# Systemready API

## Overview​

### Identification​

### Obsoletes​

## Common examples​

### How to use Systemready​

## API specification​

### systemready​

### getSupportedVersions​

### General error codes​

The VAPIX® Systemready API makes it possible to find out, without authentication, if the Axis device is ready to handle external communication, configurations and video streaming on either the first or a consecutive boot up.

The API uses the systemready.cgi as its communication interface and supports the following methods:

This CGI replaces polling of APIs such as getBrandInfo, which were used determine when the system was ready.

This example will show you how to test if your device is ready to receive and handle requests.

JSON input parameters

Please note that it will take up to 20 seconds before the system responds.

Successful response

Successful response with active preview mode

This method should be used to check if the system is ready for operation.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

This method should be used when you want to retrieve a list containing all API versions supported by your device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

The following table lists the general errors that can occur to any CGI method.

```
http://<servername>/axis-cgi/systemready.cgi
```

```
{    "apiVersion": "1.1",    "context": "my context",    "method": "systemready",    "params": {        "timeout": 20    }}
```

```
{    "apiVersion": "1.4",    "context": "my context",    "method": "systemready",    "data": {        "systemready": "yes",        "needsetup": "no",        "uptime": "7800",        "bootid": "ebe1fa05-2ff7-4062-874c-68a466a9eaed"    }}
```

```
{    "apiVersion": "1.4",    "context": "my context",    "method": "systemready",    "data": {        "systemready": "yes",        "needsetup": "no",        "uptime": "120",        "bootid": "ebe1fa05-2ff7-4062-874c-68a466a9eaed",        "previewmode": "7200"    }}
```

```
http://<servername>/axis-cgi/systemready.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "systemready",  "params": {    "timeout": <timeout seconds>  }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "systemready",    "data": {        "systemready": "yes/no",        "needsetup": "yes/no",        "uptime": "<seconds from when the device was started in seconds>",        "bootid": "<unique boot id string>",        "previewmode": "<previewmode duration in seconds>"    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>  "method": "systemready",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

```
http://<servername>/axis-cgi/systemready.cgi
```

```
{    "context": "<string>",    "method": "getSupportedVersions"}
```

```
{    "context": "<string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "<Major>.<Minor>"]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "getSupportedVersions",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

- API Discovery: id=systemready
- AXIS OS: 9.50 and later

- Check if the system is ready with the following request:

- The response will appear if the system is or becomes ready during the timeout. If needsetup is yes the system is lacking an initial admin user, which must first be created using pwdgrp.cgi. It is not possible to call an API that requires authentication otherwise. Additional fields include:

- uptime shows how many seconds the device has been active since it was last booted.
- bootid is a string used for the current boot up of the device.
- previewmode will be included in the response if the device is in preview mode.

- Security level: Anonymous
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Anonymous
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Methods | Description |
| --- | --- |
| systemready | Query to check if the system is ready. |
| getSupportedVersions | Retrieve a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context | The user sets this value and the application echoes it back in the response (optional). |
| method | The method that should be used. |
| params | Method specific parameters. Optional for some methods. |
| timeout | The maximum time systemready.cgi will take before returning a response. Valid responses are either yes or no. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context set by the user in the request (optional). |
| method | The requested method. |
| data | Response specific data. |
| systemready | The system ready status. Accepted values are yes and no. |
| needsetup | Setup related parameter. If the returning value is yes an initial admin user must first be created using pwdgrp.cgi. |
| uptime | The device boot uptime, presented in seconds. |
| bootid | The device boot id string. |
| previewmode | Included when preview mode is enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context set by the user in the request (optional). |
| method | The requested method. |
| error | Error specific data. |
| code | The error code. |
| message | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| context | The user sets this value and the application echoes it back in the response (optional). |
| method | The method that should be used. |

| Parameter | Description |
| --- | --- |
| context | The context set by the user in the request (optional). |
| method | The requested method. |
| data | Response specific data. |
| apiVersions | A list containing all supported major versions along with their highest minor version, e.g. ["1.0", "1.2"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context set by the user in the request (optional). |
| method | The requested method. |
| error | The error specific data. |
| code | The error code. |
| message | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 1000 | Internal error. Refer to message field or logs. |
| 9000 | Internal error. |

