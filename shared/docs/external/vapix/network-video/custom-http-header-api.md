# Custom HTTP header API

**Source:** https://developer.axis.com/vapix/network-video/custom-http-header-api/
**Last Updated:** Aug 18, 2025

---

# Custom HTTP header API

## Overview​

### Identification​

### Default custom HTTP headers​

## Common examples​

### Add a custom header​

#### Set CORS header​

#### Set a Cookie header​

### List custom headers​

### Remove a custom header​

### Get supported versions​

## API specification​

### list​

### set​

### remove​

### getSupportedVersions​

### Error codes​

The VAPIX® Custom HTTP header API makes it possible to add and remove a custom HTTP header to the HTTP responses on your Axis products.

The API implements customhttpheader.cgi as its communications interface to handle custom HTTP headers to the HTTP responses and supports the following methods:

Please note that Axis OS version 10.11 is required before you can add multiple headers at once.

Some devices come with pre-installed custom HTTP headers. Use the list method to see all headers. The pre-installed headers can be removed with the remove method.

Use this example to add a custom HTTP header to your device in order to extend functionality, such as adding a header with an unique ID for the device. Standard headers that can be added includes Cross-origin Resource Sharing, X-Frame-Options and Set-Cookie.

Set the Cross-Origin Resource Sharing (CORS) header. This will tell your browser/application that domains specified in the header have permission to make a cross-origin request to the server, i.e. the header allowing the browser to break the same-origin policy.

JSON input parameters

The CORS header will now be included in all responses from the web server once it has been restarted.

Successful response

Set a Cookie header. This is used when you want to send cookies from the server to your browser/application.

JSON input parameters

The Set-Cookie header will now be included in all responses from the web server once it has been restarted.

Successful response

Use this example to retrieve a list of all the custom headers that have been added to the device.

Request a list of custom headers.

JSON input parameters

The JSON response in this example will showcase what it will look like if you had three custom headers installed on your device.

Successful response

Use this example to remove a custom header from your device. The header is identified by its header name, meaning that any header value is optional and can be omitted.

Remove the Set-Cookie header.

JSON input parameters

The Set-Cookie header will not be included in the by the web server once it has restarted.

Successful response

Use this example to retrieve a list of API versions that are supported by your device.

Request a list containing the supported API versions.

JSON input parameters

Parse the JSON response.

Successful response

Error response

This API method is used when you want to retrieve a list of all custom headers that has been added to the product.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to set a custom header on your product.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to remove a custom header on your product.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve the supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

The following error codes are used by all API methods:

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "params": {        "Access-Control-Allow-Origin": "http://axis.trusted.example.server.com"    }}
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "data": {        "Access-Control-Allow-Origin": "http://axis.trusted.example.server.com"    }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "1.0",    "context": "OpticalContext",    "method": "set",    "params": {        "Set-Cookie": "device=123; Max-Age=200"    }}
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "list"}
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "list",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200",        "CustomName": "CustomValue",        "Another-Example": "Another-value"    }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "remove",    "params": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}
```

```
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "remove",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "<ID string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "<Major>.<Minor>"]    }}
```

```
{    "apiVersion": "1.0",    "context": "<ID string>",    "method": "getSupportedVersions",    "error": {        "code": <error code>,        "message": "<error message>"    }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "list"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "list",  "data": {    "<CustomHeaderName>": "<CustomHeaderValue>"    ...  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "list",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "set",    "params": {        "<CustomHeaderName>": "<CustomHeaderValue>"    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "set",    "data": {        "<CustomHeaderName>": "<CustomHeaderValue>"    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "set",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "remove",    "params": {        "<CustomHeaderName>": "<CustomHeaderValue>"    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "remove",    "data": {        "<CustomHeaderName>": "<CustomHeaderValue>"    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "remove",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

```
http://<servername>/axis-cgi/customhttpheader.cgi
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "<ID string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "<Major>.<Minor>"]    }}
```

```
{  "apiVersion": "1.0",  "context": "<ID string>",  "method": "getSupportedVersions",  "error": {    "code": <error code>,    "message": "<error message>"  }}
```

- API Discovery: id=customhttpheader
- AXIS OS: 9.80 and later

- Set the Cross-Origin Resource Sharing (CORS) header. This will tell your browser/application that domains specified in the header have permission to make a cross-origin request to the server, i.e. the header allowing the browser to break the same-origin policy.
http://<servername>/axis-cgi/customhttpheader.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "params": {        "Access-Control-Allow-Origin": "http://axis.trusted.example.server.com"    }}
- The CORS header will now be included in all responses from the web server once it has been restarted.
Successful response
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "data": {        "Access-Control-Allow-Origin": "http://axis.trusted.example.server.com"    }}

- Set a Cookie header. This is used when you want to send cookies from the server to your browser/application.
http://<servername>/axis-cgi/customhttpheader.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "OpticalContext",    "method": "set",    "params": {        "Set-Cookie": "device=123; Max-Age=200"    }}
- The Set-Cookie header will now be included in all responses from the web server once it has been restarted.
Successful response
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "set",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}

- Request a list of custom headers.
http://<servername>/axis-cgi/customhttpheader.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "list"}
- The JSON response in this example will showcase what it will look like if you had three custom headers installed on your device.
Successful response
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "list",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200",        "CustomName": "CustomValue",        "Another-Example": "Another-value"    }}

- Remove the Set-Cookie header.
http://<servername>/axis-cgi/customhttpheader.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "remove",    "params": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}
- The Set-Cookie header will not be included in the by the web server once it has restarted.
Successful response
{    "apiVersion": "1.0",    "context": "OptionalContext",    "method": "remove",    "data": {        "Set-Cookie": "deviceId=123; Max-Age=200"    }}

- Request a list containing the supported API versions.
http://<servername>/axis-cgi/customhttpheader.cgi
JSON input parameters
{    "context": "<ID string>",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "<ID string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "<Major>.<Minor>"]    }}
Error response
{    "apiVersion": "1.0",    "context": "<ID string>",    "method": "getSupportedVersions",    "error": {        "code": <error code>,        "message": "<error message>"    }}

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

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| list | Lists the custom headers available on your device. |
| set | Sets a custom header to your device. |
| remove | Removes a custom header from your device. |
| getSupportedVersions | Retrieve a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that should be used in the request. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="list" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="list" | The operation that was performed. |
| data.CustomHeaderName | The name of the header |
| data.CustomHeaderValue | The content of the header. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="list" | The operation that was performed. |
| error.code | The code representing the error that occurred in the request. |
| error.message | Explains the error that occurred. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that should be used in the request. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="set" | The operation that should be performed. |
| params.CustomHeaderName | The name of the header. |
| params.CustomHeaderValue | The content of the header. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="set" | The operation that was performed. |
| data.CustomHeaderName | The name of the header |
| data.CustomHeaderValue | The content of the header. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="set" | The operation that was performed. |
| error.code | The code representing the error that occurred in the request. |
| error.message | Explains the error that occurred. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that should be used in the request. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="remove" | The operation that should be performed. |
| params.CustomHeaderName | The name of the header. |
| params.CustomHeaderValue | The content of the header. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="remove" | The operation that was performed. |
| data.CustomHeaderName | The name of the header |
| data.CustomHeaderValue | The content of the header. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="remove" | The operation that was performed. |
| error.code | The code representing the error that occurred in the request. |
| error.message | Explains the error that occurred. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="remove" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="remove" | The operation that was performed. |
| data.apiVersions | Response specific data. |

| Parameter | Description |
| --- | --- |
| apiVersion:"<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> | The context that was used the request was made (optional). |
| method="remove" | The operation that was performed. |
| error.code | The code representing the error that occurred in the request. |
| error.message | Explains the error that occurred. |

| Code | Description |
| --- | --- |
| 1100 | Internal error. Refer to message field or logs. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON format. |
| 2102 | Method does not exist. |

