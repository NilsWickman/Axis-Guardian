# Feature Flag Service

**Source:** https://developer.axis.com/vapix/network-video/feature-flag-service/
**Last Updated:** Aug 18, 2025

---

# Feature Flag Service

## Description​

### Model​

### Identification​

## Common examples​

### Set flags​

### Get flags​

### List all flags​

### Get supported versions​

## API Specifications​

### set​

### get​

### listAll​

### getSupportedVersions​

### General error codes​

The Feature Flag Service API provides the information that makes it possible to use feature flags with your Axis device. Feature flags can be used to, among other things, toggle experimental features on/off and do gradual roll-outs of software updates.

The API implements featureflag.cgi as its communications interface and supports the following methods:

Obsoletes

This API is set to replace streamingfeature.cgi, that will be subsequently deprecated and no longer receive any updates.

This example will showcase the steps you need to take to toggle a feature wrapped around a flag that was disabled by default. Reasons for doing this includes trying out an experimental feature or preparing a feature that is ready to go live.

JSON input parameters

Successful response example

Error response example

API reference

This example will showcase the steps you need to take to check for toggled features and verify if the flags are in their expected state.

JSON input parameters

Successful response example

Error response example

API reference

This example will showcase the steps you need to take to gather statistics about the flags on your device in order to debug a potential issue. By following these steps you will retrieve a list containing all available information about the flags, including metadata containing both the current and default value and description of the flags.

JSON input parameters

Successful response example

Error response example

API reference

This example will showcase the steps you need to take to retrieve information about the API versions that are supported by your device.

JSON input parameters

Successful response example

Error response example

API reference

This method is used when you wish to set a specified number of flags.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you wish to retrieve the value for a specified number of flags.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you wish to retrieve a list containing all flags as well as their metadata.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you wish to retrieve a list containing all API versions supported by your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

The following table lists the errors that can occur for all CGI methods.

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "set",    "params": {        "flagValues": {            "flag.name.1": true,            "flag.name.2": true        }    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "set",    "data": {        "result": "Success"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "set",    "error": {        "code": 2104,        "message": "Invalid parameter value specified"    }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "get",    "params": {        "names": ["flag.name.1", "flag.name.2"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "get",    "data": {        "flagValues": {            "flag.name.1": true,            "flag.name.2": false        }    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "get",    "error": {        "code": 2200,        "message": "Flag(s) does not exist: com.axis.remotesyslog.fax"    }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "listAll"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "listAll",    "data": {        "flags": [            {                "name": "flag.name.1",                "value": true,                "description": "Use both hands for parameter handling.",                "defaultValue": false            },            {                "name": "flag.name.2",                "value": false,                "description": "Run action engine on ethanol.",                "defaultValue": false            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "listAll",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "context": "Client defined request ID",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "set"  "params": {    "flagValues": {      "<string>": bool,      "<string>": bool    }  }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "set",    "data": {        "result": "Success"    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "set",  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "get",    "params": {        "names": ["flag.name.1", "flag.name.2"]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "get",  "data": {    "flagValues": {      "name": bool    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "get",  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "listAll"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "listAll"  "data": {    "flags": [      {        "name": "<string>",        "value": <bool>,        "description": "<string>",        "defaultValue": <bool>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "listAll"  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

```
http://<servername>/axis-cgi/featureflag.cgi
```

```
{    "context": "<string>",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major>.<Minor>"]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "getSupportedVersions"  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

- API Discovery: id=feature-flag

- Set a flag to true/false.

- Parse the JSON response.

- set

- Retrieve the value of a specified number of flags.

- Parse the JSON response.

- get

- Retrieve a list of all flags.

- Parse the JSON response.

- listAll

- Retrieve a list of supported API versions.

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

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| set | Set the value of one or multiple flags. |
| get | Retrieve the value of one or multiple flags. |
| listAll | Retrieve the value and metadata of all flags. |
| getSupportedVersions | Retrieve the API versions supported by your device. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="set" | Specifies the method. |
| params=<object> | Parameter group made to set the flags. |
| params.flagValues=<object> | Contains the flag name and value pairs. The flags will be updated according to this list. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="set" | The requested method. |
| result=<string> | If the call was successful the string "Success" is returned. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="set" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="get" | Specifies the method. |
| params=<object> | Parameters sent to and included in the API call by the method. |
| params.flagValues=<object> | List containing the flag names that should be retrieved. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="get" | The requested method. |
| data.flagValues=<string:bool><list> | List containing the flag name and values, corresponding to the list of names given in the request. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="get" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="listAll" | Specifies the method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listAll" | The requested method. |
| data.flags=<list> | List containing all flags along with their metadata on the device. |
| data.flags.name=<string> | The name of the flag. |
| data.flags.value=<bool> | The current flag value. |
| data.flags.description=<string> | A short description of the flag. |
| data.flags.defaultValue=<bool> | The initial flag value. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listAll" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getSupportedVersions" | Specifies the method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| data.apiVersions[]=<list of versions> | A list containing the supported major API versions along with their highest supported minor version. |
| <list of versions> | A list containing "<Major>.<Minor>" versions, e.g. ["1.4", "2.5"] |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 1100 | Internal error. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |
| 2106 | Authentication failed. |
| 2107 | Request too large. |
| 2200 | Flags does not exist. |

