# Pencil privacy filter

**Source:** https://developer.axis.com/vapix/network-video/pencil-privacy-filter/
**Last Updated:** Aug 18, 2025

---

# Pencil privacy filter

## Overview​

### Identification​

## API specifications​

### List supported API versions​

### Apply filter settings​

### Check filter settings​

### Select filter​

### Request filter information​

### Request all filter capabilities​

## General error responses​

### 400 Bad request​

### 401 Authentication failed​

### 403 Authorization failed​

### 413 Transport Level Error​

### 500 Internal error​

The VAPIX® Pencil privacy filter API provides the information that makes it possible to add a black and white "pencil image" effect to the video stream. By using this API, you will also be able to:

The API implements pencil.cgi as its communications interface and supports the following methods:

This method should be used when you want to list all API versions supported by your device.

Request

JSON input parameters

Successful response

Response body example

Error responses

This method should be used when you want to set the parameter values for the filters.

Request

JSON input parameters

Successful response

Response body example

Error responses

This method should be used when you want to request information regarding the settings for a given filter type.

Request

JSON input parameters

Successful response

Response body example

Error responses

This method should be used when you want to select which filter that should be active.

Request

JSON input parameters

Successful response

Response body example

Error responses

This method should be used when you want to check the current filter information.

Request

JSON input parameters

Successful response

Response body example

Error responses

This method should be used when you want to request filter information from all available filters, along with their supported parameters and flags.

Request

JSON input parameters

Successful response

Response body example

Error responses

Response body example

Response body example

Response body example

Response body example

Response body example

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setFilterSettings",    "params": [        {            "type": "pencil",            "flags": {                "inverted": true,                "threshold": 45            }        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setFilterSettings"}
```

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getFilterSettings",    "params": [        {            "type": "pencil"        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getFilterSettings",    "data": [        {            "type": "pencil",            "flags": {                "inverted": true,                "threshold": 23            }        }    ]}
```

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setSelectedFilter",    "params": [        {            "type": "none"        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setSelectedFilter"}
```

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSelectedFilter"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSelectedFilter",    "data": {        "type": "pencil"    }}
```

```
http://<servername>/axis-cgi/pencil.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getFilterCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getFilterCapabilities",    "data": {        "filters": [            {                "type": "pencil",                "description": "string",                "flags": [                    {                        "<flag_name>": {                            "type": "bool",                            "description": "string"                        }                    },                    {                        "<flag_name>": {                            "type": "integer",                            "min": 0,                            "max": 255,                            "description": "string"                        }                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2106,        "message": "Authentication failed."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2105,        "message": "Authorization failed."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2107,        "message": "Transport Level Error."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

- Activate/Deactivate the image effect
- Choose filter types and settings, referred to as flags in this API
- Check information regarding the currently active filter type
- Request a list of capabilities for all available filter types and flags.

- API Discovery: id=pencil-privacy-filter

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error
- 500 Internal error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error
- 500 Internal error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error
- 500 Internal error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error
- 500 Internal error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 400 Bad request
- 401 Authentication failed
- 403 Authorization failed
- 413 Transport Level Error
- 500 Internal error

- HTTP Code: 400 Bad request
- Content-Type: application/json

- HTTP Code: 401 Authentication failed
- Content-Type: application/json

- HTTP Code: 403 Authorization failed
- Content-Type: application/json

- HTTP Code: 413 Transport Level Error
- Content-Type: application/json

- HTTP Code: 500 Internal error
- Content-Type: application/json

| Method | Description |
| --- | --- |
| List supported API versions | List supported API versions. |
| Request all filter capabilities | Check all available filters and flags. |
| Apply filter settings | Change the values for a valid filter type and one or more flags. |
| Check filter settings | Check the values and settings for a valid filter type and its current flag values. |
| Select filter | Request a filter change. The filter can either be activated or deactivated. |
| Request filter information | Request status information about a currently active filter. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| apiVersions[]=<list of versions> | A list containing all supported API versions along with their highest supported minor version. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setFilterSettings" | The method that should be used. |
| type=<string> | The filter type that will receive new or updated flags. |
| flags=<object> Optional | The flags, which will differ depending on the filter type. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setFilterSettings" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFilterSettings" | The method that should be used. |
| type=<string> | The filter that will be checked. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFilterSettings" | The requested method. |
| type=<string> | The requested filter type. |
| flags=<object> Optional | The flags, which will differ depending on the filter type. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setSelectedFilter" | The method that should be used. |
| type=<string> | The filter type that should be active. none will deactivate the filter. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setSelectedFilter" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSelectedFilter" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSelectedFilter" | The requested method. |
| type=<string> | The current filter type. Will be none if no filter is active. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFilterCapabilities" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFilterCapabilities" | The requested method. |
| filters=<array> | List of available filters. |
| type=<string> | The filter type. |
| description=<string> | Describes the type parameters. |
| flags=<array> | Flags available for a particular filter. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="method" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="method" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="method" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="method" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="method" | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The message corresponding to the error code. |

