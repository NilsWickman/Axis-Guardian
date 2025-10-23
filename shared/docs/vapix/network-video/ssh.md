# SSH

**Source:** https://developer.axis.com/vapix/network-video/ssh/
**Last Updated:** Aug 18, 2025

---

# SSH

## Description​

### Model​

### Identification​

### Obsoletes​

## Common examples​

### Configure the SSH functionality on the Axis device​

### Retrieve the supported API versions​

## API specifications​

### getSshInfo​

### getSupportedVersions​

### setSshConfiguration​

### General error codes​

The SSH (Secure shell) API makes it possible to retrieve and configure the SSH functions on an Axis device.

The API implements ssh.cgi as its communications interface and supports the following methods:

This CGI renders the process of retrieving and setting SSH parameters through the param.cgi obsolete. Devices that support both param.cgi and the SSH API will yield the same result regardless of method.

Use this example to configure your Axis device to enable SSH functionality.

JSON input parameters

Successful response

Failed response

This error will occur if the CGI encounters an internal error that makes it abort the operation.

JSON input parameters

Successful response

Failed response

This error will occur if the VMS has sent an incomplete request that was missing one or more of the required parameters.

API references

See getSshInfo for further instructions.

See setSshConfiguration for further instructions.

Use this example to check which API version you should use when you want to communicate with the Axis device.

JSON input parameters

Successful response

Failed response

This error will occur if the CGI encounters an internal error that causes it to abort the operation.

See getSupportedVersions for further instructions.

This API method is used to retrieve information about the SSH configuration from an Axis device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error code

There are no specific error codes for this method. General errors are listed in General error codes.

This API method will show you a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

This API method is used to apply SSH functionality to an Axis device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

These error codes are used by all API methods.

Please note that for internal CGI errors (1000) the HTTP response code is set to 500, whereas for any other CGI error the HTTP response code will be 200.

User authentication and authorization to use the CGIs are performed on the HTTP level and, if unsuccessful, will return the HTTP error code 401. The authorization of the internal services used by the CGIs are performed after both the HTTP authentication and authorization has passed, meaning it will always return the HTTP code 200 regardless of the outcome. Should it fail during the latter stage, the response will consist of an HTTP code 200 as well as JSON data containing the error 4002 (Authorization failed), which means that the CGI couldn't be authorized and thus unable to complete its task. This does not mean that you weren’t able to access the CGI itself.

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSshInfo",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSshInfo",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setSshConfiguration",    "params": {        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setSshConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4003,        "message": "Missing parameter(s)"    }}
```

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSshInfo"}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSshInfo",  "data": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSshInfo",  "error": {    "code": <error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "params": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [<string>]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/ssh.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setSshConfiguration",  "params": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setSshConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setSshConfiguration",  "error": {    "code": <error code>,    "message": <string>  }}
```

- API Discovery: id=ssh

- Retrieve the SSH configuration for your Axis device using the url below with the POST method. The configuration will then be presented to you.

- Parse the JSON response.

- Check the retrieved information and apply the new configurations.

- The VMS will receive the a response and inform you of the result.

- Request a list containing the supported API versions.

- Parse the JSON response.

- Security level: Administrator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getSshInfo | Retrieve the SSH configuration currently on the Axis device in the form of a status section that will indicate whether the SSH functionality is either enabled or disabled. |
| getSupportedVersions | Retrieve a list of all API versions supported by the product. |
| setSshConfiguration | Set the state of the SSH functionality to enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSshInfo" | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getSshInfo" | The method that was performed. |
| data.enabled=<boolean> | A boolean returning one of the following responses: true: SSH functionality is enabled and running false: SSH functionality is disabled and not running |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getSshInfo" | The method that was performed. |
| error.code=<error code> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getSupportedVersions" | The method that was performed. |
| data.apiVersions=[<string>] | A list containing the supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getSupportedVersions" | The method that was performed. |
| error.code=<integer> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setSshConfiguration" | The performed method. |
| params.enabled=<boolean> | Specifies the desired enabled state of the SSH functionality. true: The functionality is enabled and running. false: The functionality is disabled and not running. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="setSshConfiguration" | The method that was performed. |
| data | This field is empty, since this particular request, when successfully executed, doesn’t return any data. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="setSshConfiguration" | The method that was performed. |
| error.code=<error code> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |

| Error code | Description |
| --- | --- |
| 1000 | Internal error |
| 2000 | Invalid request |
| 2001 | Request body too large |
| 3000 | Invalid JSON data |
| 4000 | Method does not exist |
| 4001 | The specified version is not supported |
| 4002 | Authorization failed |
| 4003 | Missing parameter(s) |
| 4004 | Invalid parameter(s) |

