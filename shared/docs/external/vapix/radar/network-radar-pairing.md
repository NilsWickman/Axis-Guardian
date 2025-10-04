# Network Radar Pairing

**Source:** https://developer.axis.com/vapix/radar/network-radar-pairing/
**Last Updated:** Aug 18, 2025

---

# Network Radar Pairing

## Identification​

## Limitations​

## Use cases​

### Configure and activate a network radar pairing​

## API Specifications​

### getRadarConnection​

### setRadarConnection​

### clearConfiguration​

### getActive​

### setActive​

### getSupportedVersions​

### Parameter descriptions​

The VAPIX® Network Radar Pairing API makes it possible to add a radar sensor input to cameras with no built-in hardware support. The camera can then be used to configure radar sensor settings.

The radar will appear just like a built-in hardware radar sensor and can be interacted with through the common platform events/action interface available on the camera.

This API is not supported by all devices.

The radar view video stream doesn't have a separate image source for the radar view stream when active on a camera. Instead, the radar view is drawn as an overlay above the image video stream and will not mask the image.

The following examples will show you how to configure the address and settings required for the camera to use an Axis radar as a radar sensor. Additional examples can be found in the API Specifications chapter below.

Retrieve the network radar pairing configuration and all of its setting information.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Set the network radar pairing configuration and its information.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Clear all stored configurations from the network radar pairing. The request will fail if the function is active.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Retrieve the activation state of the network radar pairing. The method will fail is no configuration can be located.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Activate an already configured network radar pairing. The method will fail is no configuration can be located. If the active state of the network radar pairing already matches the state in the request, it will succeed.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Retrieve a list containing all major and minor API versions supported by the device.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

getRadarConnection parameters

Request

Response

setRadarConnection parameters

Request

Response

clearConfiguration parameters

Request

Response

getActive parameters

Request

Response

setActive parameters

Request

Response

getSupportedVersions parameters

Request

Response

Error response parameters

Error codes

```
POST /networkradarpairing.cgi#getRadarConnection
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarConnection"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarConnection",    "data": {        "address": "192.168.0.90",        "user": "john",        "state": "ok",        "tls": false,        "tls-verify": false    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarConnection",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
POST /networkradarpairing.cgi#setRadarConnection
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setRadarConnection",    "params": {        "address": "192.168.0.90",        "user": "john",        "state": "ok",        "tls": false,        "tls-verify": false    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setRadarConnection",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setRadarConnection",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
POST /networkradarpairing.cgi#clearConfiguration
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "clearConfiguration"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "clearConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "clearConfiguration",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
POST /networkradarpairing.cgi#getActive
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getActive"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getActive",    "data": {        "active": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getActive",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
POST /networkradarpairing.cgi#setActive
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setActive",    "params": {        "active": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setActive",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setActive",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
/networkradarpairing.cgi#getSupportedVersions
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

- API Discovery: id=network-radar-pairing

- Send a setRadarConnection request with credentials for the radar connection.
- Send a setActive request to activate the connection.
- Send a getRadarConnection request to check the state.

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getRadarConnection" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getRadarConnection" |  | The requested API method. |
| address=<string> | 192.168.0.90 | The IP address. |
| user=<string> | "john" | The user name. |
| state=<string> | failed | The current state of the network radar pairing.  Valid values:  failed: Catch all failure statuses.  address-failed: Address resolution failed.  connect-failed: Connecting to the radar device failed.  authentication-failed: Authentication to the radar device failed.  transfer-failed: Data transfer failed.  not-configured: There is no configured Network Radar Pairing.  not-active: The Network Radar Pairing is not active.  ok: Configured, active and no error. |
| tls=<boolean> | false | Valid values:  true, false |
| tls-verify=<boolean> | false | Valid values:  true, false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setRadarConnection" |  | The API method that is called in the request. |
| address=<string> | 192.168.0.90 | The IP address. |
| user=<string> | "john" | The user name. |
| password=<string> | "doe" | The remote radar account password.  Minimum: 1  Maximum: 64 |
| tls=<boolean> | false | Valid values:  true, false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setRadarConnection" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="clearConfiguration" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="clearConfiguration" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getActive" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getActive" |  | The requested API method. |
| active=<boolean> | true | Valid values:  true, false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setActive" |  | The API method that is called in the request. |
| active=<boolean> | true | Valid values:  true, false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setActive" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getSupportedVersions" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getSupportedVersions" |  | The requested API method. |
| apiVersions=<string> | 1.0 | A list containing all supported major versions along with their highest minor version, such as 1.0 and 1.2. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method=<string> |  | The requested API method. |
| error.code=<integer> | 1100 | The error code. |
| error.message=<string> | Internal error. | The error message for the corresponding error code. |

| JSON code | Error code | Error message |
| --- | --- | --- |
|  | 2100 | API version not supported. |
| 400 Bad request | 2101 | Invalid JSON. |
|  | 2102 | Method not supported. |
|  | 2103 | Required parameter missing. |
|  | 2104 | Invalid parameter value specified. |
| 401 Authentication failed | 2106 | Authentication failed. |
| 403 Authorization failed | 2105 | Authorization failed. |
| 405 Method not allowed | 2107 | Transport level error. |
| 411 Length required | 2107 | Transport level error. |
| 413 Payload too large | 2107 | Transport level error. |
|  | 2200 | Configuration cannot be changed or removed while enabled. |
|  | 2201 | Missing configuration. |
|  | 2202 | Usability test of the configuration failed. |
| 500 Internal error | 1100 | Internal error. |

