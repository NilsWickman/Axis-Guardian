# Capture mode

**Source:** https://developer.axis.com/vapix/network-video/capture-mode/
**Last Updated:** Aug 18, 2025

---

# Capture mode

## Description​

### Model​

### Identification​

## Common examples​

### Get Capture mode​

### Set Capture mode​

## API specification​

### getCaptureModes​

### setCaptureMode​

### Error codes​

The AXIS Capture mode API lets you use a collection of image sensor settings and also provides an interface for making changes and retrieving related information for the available capture modes.

The API consists of the CGI capturemode.cgi. All capture mode related operations can be performed by using this parameter and one of the following methods:

Use this example to query the API to return both the current and available capture modes for each channel.

Syntax

JSON request parameters

Successful response

Error response

Use this example to switch between the current and available capture modes. The new capture mode will not take effect until after a reboot.

Syntax

JSON request paramasters

Successful response

Error response

Method for getting current and available capture modes.

Request

Return value - Success

Syntax

Return value - Error

Syntax

Error codes

Error codes are listed in Error codes.

Method for setting a capture mode for one channel.

Request

Return value - Success

Syntax

Return value - Error

Syntax

Error codes

Error codes are listed in Error codes.

General error responses for Capture mode API.

```
http://myserver/axis-cgi/capturemode.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getCaptureModes"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getCaptureModes",    "data": [        {            "channel": 0,            "captureMode": [                {                    "captureModeId": 0,                    "enabled": true,                    "maxFPS": 120,                    "description": "1280x720 (16:9) @ 100/120 fps"                },                {                    "captureModeId": 1,                    "enabled": false,                    "description": "1920x1080 (16:9) @ 30/60 fps"                }            ]        },        {            "channel": 1,            "captureMode": [                {                    "captureModeId": 0,                    "enabled": false,                    "description": "1280x720 (16:9) @ 100/120 fps"                },                {                    "captureModeId": 1,                    "enabled": true,                    "maxFPS": 29.97,                    "description": "1920x1080 (16:9) @ 30/60 fps"                }            ]        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getCaptureModes--",    "error": {        "code": 4001,        "message": "Method field has invalid value (getCaptureModes--). Valid values: setCaptureMode, getCaptureModes"    }}
```

```
http://myserver/axis-cgi/capturemode.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setCaptureMode",    "channel": 1,    "captureModeId": 2}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setCaptureMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setCaptureMode",    "error": {        "code": 8000,        "message": "Internal error. Check the log for details."    }}
```

```
http://myserver/axis-cgi/capturemode.cgi
```

```
{  "apiVersion": "Version number",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCaptureModes",  "data":  [    {      "channel": channel_index,      "captureMode":      [        {          "captureModeId": The value/identifier to use when calling SetCaptureMode to set this capture mode,          "enabled": True if this is the current capture mode, otherwise false,          "maxFPS": Max frames per second. Optional, this item is guaranteed to exist only if "enabled" is true,          "description": "Friendly description of this capture mode"        }, ...      ]    }, ...  ]}
```

```
{  "apiVersion": "Version number",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCaptureModes",  "error":  {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/capturemode.cgi
```

```
{    "apiVersion": "Version number",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setCaptureMode",    "data": {}}
```

```
{  "apiVersion": "Version number",  "context": "Echoed if provided by the client in the corresponding request",  "method": "setCaptureMode",  "error":  {    "code": integer error code,    "message": "Error message"  }}
```

- AXIS OS: 8.50 and later

- Security level: Viewer
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
| getCaptureModes | Retrieves currently available capture modes. |
| setCaptureMode | Sets a capture mode for one of the channels. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The version of the API. |
| context | String | Optional. Context string. Client sets this value and the CGI sends it back in the response. |
| method | String | The operation to perform. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The version of the API. |
| context | String | Optional. Context string. Set this value and the CGI sends it back in the response. |
| method | String | The operation to perform. |
| channel | Integer | The index number of the channel. |
| captureModeId | Integer | The index number of the of the capture mode. |

| Code | Description |
| --- | --- |
| 2000 | Resource allocation failed. Check log for details. |
| 4000 | Invalid JSON format. Check message field for details. |
| 4001 | Parameter not found or invalid value/format. Check message field for details. |
| 8000 | Internal error. Check log for details. |

