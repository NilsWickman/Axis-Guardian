# Video streaming indicator

**Source:** https://developer.axis.com/vapix/network-video/video-streaming-indicator/
**Last Updated:** Aug 18, 2025

---

# Video streaming indicator

## Description​

### Model​

### Identification​

## Common examples​

### Configure the indicator​

#### Get configuration​

#### Set configuration​

### Enable and disable the indicator​

#### Enable the indicator​

#### Disable the indicator​

## API specification​

### get​

### set​

### on​

### off​

### show​

### getSupportedVersions​

### Error codes​

## Footnotes​

The Video streaming indicator API makes it possible to superimpose an animation over the video stream to see if the stream is live even when the scene doesn’t contain any motion.

The API consists of the CGI videostreamingindicator.cgi and the following methods:

Use the following examples to configure the look of the indicator.

a) Successful response example that gives the current configuration.

b) Error response example.

API references

get

a) Successful response example that gives the current configuration.

b) Error response example.

API references

set

Use the following examples to activate/deactivate the indicator.

a) Successful response example. The response will be empty.

b) Error response example.

API references:

on

a) Successful response example. The response will be empty.

b) Error response example.

API references:

off

get is used to receive the current configuration of the indicator.

Request

Return value - Success

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

set is used to update the configuration of the indicator.

Request

Any optional parameters omitted in the request will maintain their current value.

Return value - Success

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

on is used to enable the indicator.

Request

Return value - Success

Successful calls also contains an empty data object in the response.

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

off is used to disable the indicator.

Request

Return value - Success

Successful calls also contains an empty data object in the response.

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

show is used to show the indicator for 5 seconds (non-adjustable).

Request

Return value - Success

Successful calls also contains an empty data object in the response.

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

getSupportedVersions is used to retrieve a list of supported API versions.

Request

Return value - Success

Return value - Failure

Error codes

See Error codes for a full list of potential error codes.

"H1", "H2" and "H3" corresponds to "small", "medium" and "large". "H4" and "H5" are additional, larger sizes. ↩

```
{    "apiVersion": "1.0",    "method": "get"}
```

```
{    "apiVersion": "1.0",    "method": "get",    "data": {        "indicatorSize": "H2",        "position": "topLeft",        "color": "red",        "bgColor": "transparent",        "size": [64, 64],        "isActive": false    }}
```

```
{    "apiVersion": "1.0",    "method": "get",    "error": {        "code": 1003,        "message": "Invalid parameter"    }}
```

```
{    "apiVersion": "1.0",    "method": "set",    "params": {        "indicatorSize": "H3",        "position": [0.0, 0.0],        "color": "semiTransparent",        "bgColor": "transparent"    }}
```

```
{    "apiVersion": "1.0",    "method": "set",    "data": {        "indicatorSize": "H3",        "position": [0.0, 0.0],        "color": "semiTransparent",        "bgColor": "transparent",        "size": [128, 128],        "isActive": false    }}
```

```
{    "apiVersion": "1.0",    "method": "set",    "error": {        "code": 1003,        "message": "Invalid parameter"    }}
```

```
{    "apiVersion": "1.0",    "method": "on"}
```

```
{    "apiVersion": "1.0",    "method": "on",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "on",    "error": {        "code": 1003,        "message": "Invalid parameter"    }}
```

```
{    "apiVersion": "1.0",    "method": "off"}
```

```
{    "apiVersion": "1.0",    "method": "off",    "data": {}}
```

```
{    "apiVersion": "1.0",    "method": "off",    "error": {        "code": 1003,        "message": "Invalid parameter"    }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "apiVersion": <string>,  "method": "get",  "context": <string>}
```

```
{  "apiVersion": <string>,  "method": "get",  "context": <string>,  "data": {    "indicatorSize": <"small" | "medium" | "large" | "H1" | "H2" | "H3" | "H4" | "H5">,    "position": <"topLeft" | "topRight" | "bottomLeft" | "bottomRight"> | [<decimal>, <decimal>],    "color": <"black" | "white" | "red" | "semiTransparent">,    "bgColor": <"black" | "white" | "transparent">,    "size": [<integer>,<integer>],    "isActive": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "apiVersion": <string>,  "method": "set",  "context": <string>,  "params": {    "indicatorSize": <"small" | "medium" | "large" | "H1" | "H2" | "H3" | "H4" | "H5">,    "position": <"topLeft" | "topRight" | "bottomLeft" | "bottomRight"> | [<decimal>, <decimal>],    "color": <"black" | "white" | "red" | "semiTransparent">,    "bgColor": <"black" | "white" | "transparent">  }}
```

```
{  "apiVersion": <string>,  "method": "set",  "context": <string>,  "data": {    "indicatorSize": <"small" | "medium" | "large" | "H1" | "H2" | "H3" | "H4" | "H5">,    "position": <"topLeft" | "topRight" | "bottomLeft" | "bottomRight"> | [<decimal>, <decimal>],    "color": <"black" | "white" | "red" | "semiTransparent">,    "bgColor": <"black" | "white" | "semiTransparent" | "transparent">,    "size": [<integer>, <integer>],    "isActive": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "apiVersion": <string>,  "method": "on",  "context": <string>}
```

```
{  "apiVersion": <string>,  "method": "on",  "context": <string>,  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "apiVersion": <string>,  "method": "off",  "context": <string>}
```

```
{  "apiVersion": <string>,  "method": "off",  "context": <string>,  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "apiVersion": <string>,  "method": "show",  "context": <string>}
```

```
{  "apiVersion": <string>,  "method": "show",  "context": <string>,  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/videostreamingindicator.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersion": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=video-streaming-indicator
- Property: Properties.VideoStreamingIndicator.VideoStreamingIndicator=yes

- Get the current configuration.

- Parse the JSON response.

- Update the configuration.

- Parse the JSON response.

- Enable the indicator.

- Parse the JSON response.

- Disable the indicator.

- Parse the JSON response.

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- "H1", "H2" and "H3" corresponds to "small", "medium" and "large". "H4" and "H5" are additional, larger sizes. ↩

| Method | Description |
| --- | --- |
| get | Get the current settings for the indicator. |
| set | Update the settings for the indicator. |
| on | Enable the indicator. |
| off | Disable the indicator. |
| show | Show the indicator for 5 seconds (non-adjustable). |
| getSupportedVersions | Get versions of the API supported by the product. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used in the response. |
| context=<string> | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="get" | Specifies that the get operation is performed. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| apiVersion |  | The current version of the API. |
| context=<string> |  | The string echoed back if it is provided by the client in the corresponding request. |
| method="get" |  | The method described in this section. |
| data.indicatorSize | small medium large H1 H2 H3 H4 H5 (1) | The new size of the indicator. |
| data.position | topLeft topRight bottomLeft bottomRight | The position of the indicator, that can either be a predefined value or an array with x and y coordinates. Coordinates are normalized in the range [-1.0, 1.0]. |
| data.color | black white red semiTransparent | The color of the indicator. |
| data.bgColor | black white transparent | The background color of the indicator. |
| data.size |  | The size of the indicator’s bounding box. |
| data.isActive |  | Flag showing if the indicator is currently active or not. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Parameter | Valid value | Description |
| --- | --- | --- |
| apiVersion |  | The current version of the API. |
| context=<string> |  | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="set" |  | Specifies that the set operation is performed. |
| indicatorSize=<"small" | "medium" | "large"> | small medium large H1 H2 H3 H4 H5 | Optional. Specifies the size of the indicator. |
| position=<"topLeft" | "topRight" | "bottomLeft" | "bottomRight"> | [<decimal>,<decimal>] | topLeft topRight bottomLeft bottomRight | Optional. Specifies the position of the indicator. The position can either be a predefined value or an array with x and y coordinates. Coordinates are normalized in the range [-1.0, 1.0]. |
| color=<"black" | "white" | "red" | "semiTransparent"> | black white red semiTransparent | Optional. Specifies the color of the indicator. |
| bgColor=<"black" | "white" | "transparent"> | black white transparent | Optional. Specifies the background color of the indicator. |

| Parameter | Valid value | Description |
| --- | --- | --- |
| apiVersion |  | The current version of the API. |
| context=<string> |  | The string echoed back if it is provided by the client in the corresponding request. |
| method="set" |  | The method described in this section. |
| data.indicatorSize | small medium large H1 H2 H3 H4 H5 | The new size of the indicator. |
| data.position | topLeft topRight bottomLeft bottomRight | The position of the indicator, which can either be a predefined value or an array with x and y coordinates. Coordinates are normalized in the range [-1.0, 1.0]. |
| data.color | black white red semiTransparent | The color of the indicator. |
| data.bgColor | black white transparent | The background color of the indicator. |
| data.size |  | The size of the bounding box of the indicator. |
| data.isActive |  | Flag showing if the indicator is currently active or not. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="on" | Specifies that the on operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method="on" | The method described in this section. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="off" | Specifies that the off operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method="off" | The method described in this section. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="show" | Specifies that the show operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The current version of the API. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method="show" | The method described in this section. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Parameter | Description |
| --- | --- |
| context=<string> | Optional. The string echoed back in the response. If set, it will be present in the response regardless of whether the response is successful or an error. |
| method="getSupportedVersions" | Specifies that the getSupportedVersions operation is performed. |

| Parameter | Description |
| --- | --- |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method="getSupportedVersions" | The method described in this section. |
| data.apiVersion[]=<list of versions> | The list of supported versions, with each major versions listed together with their highest supported minor version. |
| <list of versions> | List of <Major>.<Minor> versions, e.g. ["1.4", "2.5"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used. |
| context=<string> | The string echoed back if it is provided by the client in the corresponding request. |
| method=<string> | The method described in this section. |
| error.code | Contains an error code. This method can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

| Error code | Description |
| --- | --- |
| 1000 | Internal error. |
| 1001 | The requested API version is not supported. |
| 1002 | Invalid method. |
| 1003 | Invalid parameter. |
| 1004 | The provided input was invalid. |

