# Group View

**Source:** https://developer.axis.com/vapix/network-video/group-view/
**Last Updated:** Aug 18, 2025

---

# Group View

## Overview​

### Identification​

## Common examples​

### Request channel layout​

### Request potential channel layouts​

### Request all available channel layouts​

### Set channel layouts for the group view​

### List supported API versions​

## API specifications​

### getLayout​

### getAvailableLayout​

### setLayout​

### getSupportedVersions​

### General error codes​

## Footnotes​

The VAPIX® Group View API provides the information that makes it possible to configure the channel layout in a Group View configuration. A group view consists of multiple channels, most commonly in a quad (four channels) or dual (two channels) setup. The API is used when you want to configure or rearrange the layout of or the channels found in the group view.

The API implements groupview.cgi as its communications interface and supports the following methods:

This diagram exemplifies how the group view layout can be changed. In this case, the API has been used to mirror the layout, so that the first channel starts in the top right corner instead of the top left.



This example will show you how to check the current channel layout in the group view.

JSON input parameters

Successful response example

Error response example

See getLayout for additional details.

This example will show you how to request the different ways to configure the channel layout for the group view. Different devices will have different available options for the group view.

JSON input parameters

Successful response example

Error response example

See getAvailableLayout for additional details.

This example will show you how to check every possible channel layout from the group view.

JSON input parameters

Successful response example

Error response example

See getAvailableLayout for additional details.

This example will show you how to rearrange the channel layout for the group view.

JSON input parameters

Successful response example

Error response example

See setLayout for additional details.

This example will show you how to check the API versions supported by your device.

Request body syntax

Successfully response example

Error response example

See getSupportedVersions for additional details.

This should be used when you want to check the channel layout of a group view.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

See General error codes for a complete list of potential errors.

This method should be used when you want to check a list of possible layouts that are available for the group view.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

See General error codes for a complete list of potential errors.

This method should be used when you want to configure the channel layout in a group view.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

See General error codes for a complete list of potential errors.

This method should be used when you want to request a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

See General error codes for a complete list of potential errors.

The following table consist of errors that may occur for any method. Errors specific to a method are listed under their separate API description. The error codes exist in the following ranges.

1100–1199

Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.

1200–1999

API-specific server errors that may collide between different APIs.

2100–2199

Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.

2200–2999

API-specific client errors that may collide between different APIs.

The 4–digit error codes are returned in the JSON body when the service is executed, which means that the client must be prepared to handle transport-level errors codes with non-JSON responses. Specifically, HTTP error 401/403 will be emitted if either authentication or authorization fails.

Out-of-memory errors will also be reported as 1100 Internal error. ↩

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getLayout",    "params": {        "id": 5    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getLayout",    "data": {        "id": 5,        "layout": [            [{ "id": 1 }, { "id": 2 }],            [{ "id": 3 }, { "id": 4 }]        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getLayout",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "params": {        "id": 5    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "data": [        {            "id": 5,            "layout": [                [                    [{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }],                    [{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]                ],                [[{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]],                [[{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]]            ]        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "data": [        {            "id": 5,            "layout": [                [                    [{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }],                    [{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]                ],                [[{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]],                [[{ "id": [1, 2, 3, 4] }, { "id": [1, 2, 3, 4] }]]            ]        },        {            "id": 6,            "layout": [[[{ "id": [1, 2] }, { "id": [3, 4] }]]]        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getAvailableLayout",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setLayout",    "params": {        "id": 5,        "layout": [            [{ "id": 1 }, { "id": 3 }],            [{ "id": 4 }, { "id": 2 }]        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setLayout",    "data": {        "id": 5,        "layout": [            [{ "id": 1 }, { "id": 3 }],            [{ "id": 4 }, { "id": 2 }]        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setLayout",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{    "context": "123",    "method": "getSupportedVersions"}
```

```
{    "context": "123",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.4", "2.5"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": {        "code": 2100,        "message": "API version not supported"    }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getLayout",  "params": {    "id": <int>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getLayout",  "data": {    "id": <int>,    "layout": [      [{"id": <int>}, {"id": <int>}],      [{"id": <int>}, {"id": <int>}]    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getLayout",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAvailableLayout",  "params": {    "id": <int>  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "getAvailableLayout",  "data": [    {      "id": <int>,      "layout": [        [          [{"id": [<int>, <int>, <int>, <int>]}, {"id": [<int>, <int>, <int>, <int>]}],          [{"id": [<int>, <int>, <int>, <int>]}, {"id": [<int>, <int>, <int>, <int>]}]        ],        [          [{"id": [<int>, <int>, <int>, <int>]}, {"id": [<int>, <int>, <int>, <int>]}]        ]      ]    },    {      "id": <int>,      "layout": [        [          [{"id": [<int>, <int>]}, {"id": [<int>, <int>]}]        ]      ]    }  ]}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAvailableLayout",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "setLayout",  "params": {    "id": <int>,    "layout": [      [{"id": <int>}, {"id": <int>}],      [{"id": <int>}, {"id": <int>}]    ]  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "setLayout",  "data": {    "id": <int>,    "layout": [      [{"id": <int>}, {"id": <int>}],      [{"id": <int>}, {"id": <int>}]    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setLayout",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/groupview.cgi
```

```
{  "context": <string>,  "method": "setLayout",}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=groupview

- Check the channel layout of a specific group view. The id-number parameter is used to identify the channel.

- Parse the JSON response. The API will return a quad view that reads from top left to bottom right.

- Check the channel layouts for a specific group view with an id-number.

- Parse the JSON response. The API will return possible layouts for the channels in the group view.

- Request all available channel layouts from the group view.

- Parse the JSON response. The API will return the possible layouts for all group view channels.

- Rearrange the channel layout for the group view.

- Parse the JSON response. The API will return the new group view layout.

- Request a list of supported API versions.

- Parse the JSON response.

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- 1100–1199
Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.
- 1200–1999
API-specific server errors that may collide between different APIs.
- 2100–2199
Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.
- 2200–2999
API-specific client errors that may collide between different APIs.

- Out-of-memory errors will also be reported as 1100 Internal error. ↩

| Method | Description |
| --- | --- |
| getLayout | Request the layout for the channels in the group view. |
| getAvailableLayout | Request possible layouts available to the group view. |
| setLayout | Set the layout for the channels in the group view. |
| getSupportedVersions | List supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getLayout" | The method that should be used. |
| id=<integer> | The ID of the group view that the user wants to check. |

| Parameter | Sub-parameter | Description |
| --- | --- | --- |
| apiVersion |  | The API version returned from the request. |
| context=<string> Optional |  | The context set by the user in the request. |
| method="getLayout |  | The requested method. |
| id=<integer> |  | The ID of the group view returned by the request. |
| layout=<list of rows> |  | The current channel layout of the group view. Contains listings of layouts and columns. The first list is for the first row, the second list is for the second row and so on. |
|  | <list of channels> | List the rows in the group view. The first element contains information about the first channel, starting from the left, the second element contains the second channel and so on. Each channel element contains the information on how a specific channel in a specific location in the group view has been configured. |
|  | id=<integer> | Specifies the channel and its location in the group view. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getAvailableLayout" | The method that should be used. |
| id=<integer> Optional | The ID for the group view that the user wants to check. Omitting this parameter will make the response contain possible layouts for every ID supporting group view. |

| Parameter | Sub-parameter | Description |
| --- | --- | --- |
| apiVersion |  | The API version returned from the request. |
| context=<string> Optional |  | The context set by the user in the request. |
| method="getAvailableLayout |  | The requested method. |
| data=<list of data> |  | Object list with ID and attributes. The list will contain one element if the ID was set in the request, as long as it supports group view. The request will fail if the ID does not support group view |
|  | id=<integer> | The ID of the group view layout returned by the request. |
|  | layout=<list of layouts> | List the layouts that can be set in the group view. Each layout contains different rows of channels that represents layouts and columns in the group view. The first list is for the initial row, the second for the next row and so on. The first element contains information about the first channel, starting from the left, the second element contains the next channel and so on. Each channel element also contains the information how a channel in a specific location in the group view can be configured. The channel element also has information about the channel ranges that can be set in a specific position. |
|  | id=<list> | Provides a list of channel IDs that are possible to set in a specific position. |

| Parameter | Sub-parameters | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string> Optional |  | The user sets this value and the application echoes it back in the response. |
| method="setLayout" |  | The method that should be used. |
| id=<integer> |  | The group view ID that the user wants to set the layout for. |
| layout=<list of rows> |  | Specifies the new channel layout that will be set in the group view. Contains both the layouts and columns in the group view. The first list is for the initial row, the seconds is for the next row and so on. |
|  | <list of channels> | Contains a list for a specific row in the group view. The first element contains information about the first channel, starting from the left, the second element contains the next channel and so on. Each channel element contains the information how a channel in a specific location in the group view can be configured. |
|  | id=<integer> | Specifies a channel location in the group view. |

| Parameter | Sub-parameters | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context=<string> Optional |  | The context set by the user in the request. |
| method="setLayout" |  | The requested method. |
| id=<integer> |  | The group view ID of the layout set by the request. |
| layout=<list of rows> |  | The new channel layout set in the group view. Contains both the layouts and columns in the group view. The first list is for the initial row, the seconds is for the next row and so forth. |
|  | <list of channels> | Contains a list for a specific row in the group view. The first element contains information about the first channel, starting from the left, the second element contains the next channel and so forth. Each channel element contains the information how a channel in a specific location in the group view can be configured. |
|  | id=<integer> | Specifies a channel location in the group view. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Sub-parameters | Description |
| --- | --- | --- |
| context=<string> Optional |  | The context set by the user in the request. |
| method="getSupportedVersions" |  | The requested method. |
| data.apiVersions[]=<list of versions> |  | List of all supported major API versions along with their highest supported minor version. |
|  | <list of versions> | List of "<Major>.<Minor>" versions e.g. ["1.4", "2.5"] |

| JSON code | HTTP code | Description |
| --- | --- | --- |
| 1200 | 500 | List does not match an allowed layout. |
| 2200 | 400 | Invalid value for ID in parameter layout. |

| JSON code | HTTP code | Description |
| --- | --- | --- |
| 1100 | 500 | Internal error.(1) |
| 2100 | 400 | API version not supported. |
| 2101 | 400 | Invalid JSON. |
| 2102 | 400 | Method not supported. |
| 2103 | 400 | Required parameter missing. |
| 2104 | 400 | Invalid parameter value specified. |
| 2105 | 403 | Authorization failed. |
| 2106 | 401 | Authentication failed. |
| 2107 | 4XX, 5XX | Transport-level error. |

