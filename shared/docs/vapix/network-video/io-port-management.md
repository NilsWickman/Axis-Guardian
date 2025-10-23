# I/O port management

**Source:** https://developer.axis.com/vapix/network-video/io-port-management/
**Last Updated:** Aug 18, 2025

---

# I/O port management

## Description​

### Model​

### Identification​

## Common examples​

### Retrieve information​

#### Retrieve port information for all ports​

### Configure port​

#### Configure I/O ports with all values​

#### Set the direction of the I/O port​

#### Set a sequence of state changes on the output port​

### Get supported versions​

## API specifications​

### getPorts​

### setPorts​

### setStateSequence​

### getSupportedVersions​

### General error codes​

The I/O port management API makes it possible to retrieve information about the ports and apply product dependent configurations. The API should not be confused with Supervised I/O, which is used to set up to detect tampering and breaks of the cables.

The API is built around the portmanagement.cgi, which shall be called using the HTTP POST method with JSON formatted data as its input. API includes the following methods:

The following events are related to the API:

Use this example to check which I/O ports that are currently available, their states and the capabilities on your device. Example of capabilities are if the port is configurable and what direction it has, which is important to know as not all capabilities can be applied to both directions.

JSON input parameters

Successful response

Error response

Use this example to configure the ports of the device. Possible configurations includes:

Retrieve the I/O port IDs using Retrieve port information for all ports.

Request to apply changes to the I/O ports with the following JSON request. Please note that port 0, which has readonly=0, can not be modified.

JSON input parameters

Successful response

a) If the failure is generic, for example if the required parameter port is missing, the whole request will fail.

Error response

b) If the failure is in an optional parameters in the params object (and only one error), only the reported error has failed while the other parameters are successfully set.

Error response

c) If the failure is in an optional parameter in the params object (with multiple errors), only the reported error has failed while the other parameters are successfully set.

Error response

Retrieve the I/O port IDs using Retrieve port information for all ports.

Send a request to apply changes to the I/O ports with the following JSON request.

JSON input parameters

Successful response

Retrieve the I/O port IDs using Retrieve port information for all ports.

Request a sequence of state changes on the output port, that includes a delay in milliseconds between state changes, using the following JSON request

JSON input parameters

Successful response

Error response

Please note that the state sequence is executed only once. The last state will be the permanent until a new sequence is launched.

The setStateSequence request will return immediately, but issuing a new sequence while another sequence is running will result in an error. Changing direction or normalState will cancel an ongoing sequence. It is possible to change state during a running sequence, but that state will be overridden when the next part of the sequence is executed.

Use this example to retrieve a list of API versions that the device is supporting.

JSON input parameters

Successful response

Error response

This CGI method can be used to retrieve information about all ports on the device and their capabilities.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This CGI method can be used to configure the I/O port. Possible property names are listed in the table below.

A request can apply anything from one to all properties above for one or many ports. It can generate one of the following responses:

Changing the normalState of the port changes the logical state according to the table below. If the normalState is specified, this state transition will take priority before the current state is changed to the value specified in the state.

Old value

New value

Unlike output ports, an input port is not affected by normalState changes, but changes made to an input port may trigger a port active event.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This CGI method can be used to create a sequence of state changes on your output ports. Between states there should also be a delay measured in milliseconds and the sequence will only be executed once, with the last state becoming the permanent one until a new sequence is launched.

Issuing a new sequence while another sequence is running will result in an error, while changing either direction or normalstate will cancel any ongoing sequence. It is possible to change state during a running sequence, although that state will be overridden by the next part of the sequence.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This CGI method can be used to retrieve a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

The table below will list the general error codes that can occur for any CGI method. The codes are split into the following ranges:

```
tns1:Device/tnsaxis:IO/tnsaxis:Porttns1:Device/Trigger/DigitalInputtns1:Device/Trigger/Relay
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getPorts"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getPorts",    "data": {        "numberOfPorts": 3,        "items": [            {                "port": "0",                "state": "closed",                "configurable": true,                "readonly": true,                "usage": "Button",                "direction": "input",                "name": "Call button",                "normalState": "open"            },            {                "port": "1",                "state": "closed",                "configurable": true,                "usage": "Door",                "direction": "output",                "name": "Output 1",                "normalState": "closed"            },            {                "port": "2",                "state": "closed",                "configurable": true,                "usage": "",                "direction": "input",                "name": "Input 2",                "normalState": "closed"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getPorts",    "error": {        "code": 4004,        "message": "Invalid parameter(s)"    }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "params": {        "ports": [            {                "port": "0",                "usage": "Button",                "direction": "input",                "name": "Call button",                "normalState": "open"            },            {                "port": "1",                "usage": "Door",                "direction": "output",                "name": "Output 1",                "normalState": "open",                "state": "open"            },            {                "port": "2",                "usage": "",                "direction": "input",                "name": "Input 2",                "normalState": "closed"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "data": {        "ports": ["0", "1", "2"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "error": {        "code": 2103,        "message": "Required parameter missing"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "error": {        "code": 2104,        "message": "Invalid parameter value specified",        "details": {            "port": "0",            "propertyName": "direction"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "error": {        "code": 2104,        "message": "Invalid parameter value specified",        "details": {            "port": "0",            "propertyName": "direction"        },        "errors": [            {                "code": 1100,                "message": "Internal error",                "details": {                    "port": "1"                }            },            {                "code": 2104,                "message": "Invalid parameter value specified",                "details": {                    "port": "2",                    "propertyName": "direction"                }            },            {                "code": 2104,                "message": "Invalid parameter value specified",                "details": {                    "port": "2",                    "propertyName": "normalState"                }            }        ]    }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "params": {        "ports": [            {                "port": "1",                "direction": "input"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPorts",    "data": {        "ports": ["1"]    }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setStateSequence",    "params": {        "port": "1",        "sequence": [            {                "state": "open",                "time": 1000            },            {                "state": "closed",                "time": 2000            },            {                "state": "open",                "time": 1000            },            {                "state": "closed",                "time": 4000            },            {                "state": "open",                "time": 0            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setStateSequence",    "data": {        "port": "1"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setStateSequence",    "error": {        "code": 2104,        "message": "Invalid parameter value specified"    }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 2102,        "message": "Method not supported"    }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPorts"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPorts",  "data": {    "numberOfPorts": <0-255>,    "items": [      {        "port": <string>,        "state": "<open | closed>",        "configurable": <boolean>,        "readonly": <boolean>,        "usage": <string>,        "direction": "<input | output>",        "name": <string>,        "normalState": "<open | closed>"      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPorts",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPorts",  "params": {    "ports": [      {        "port": <string>,        "usage": <string>,        "direction": "<input | output>",        "name": <string>,        "normalState": "<open | closed>",        "state": "<open | closed>"      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPorts",  "data": {    "ports": ["<Port1>", "<Port2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPorts",  "error": {    "code": <integer error code>,    "message": <string>,    "details": {      "port": <string>,      "propertyName": <string>,    },    "errors": [      {        "code": <integer error code>,        "message": <string>,        "details": {          "port": <string>,          "propertyName": <string>        }      }    ]  }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setStateSequence",  "params": {    "port": <string>,    "sequence": [      {        "state": "<open | closed>",        "time": <integer>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setStateSequence",  "data": {    "port": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setStateSequence",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/io/portmanagement.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API discovery: id=io-port-management
- AXIS OS: 9.70 and later

- Request port information for all ports with the following JSON request.

- Parse the JSON response. The data object in the response will return the numberOfPorts and depending on how many ports being returned the number of objects will be identical in items. The property names that can be included in the items array are listed in the table below.

- Putting a description on the port to indicate what the port is controlling (usage).
- Setup the port to be either an input or an output (direction).
- Configure a user friendly name for the port (name).
- Configure what state that should be considered the normal state (normalState).
- Change the state of an output port (state).

- Retrieve the I/O port IDs using Retrieve port information for all ports.
- Request to apply changes to the I/O ports with the following JSON request. Please note that port 0, which has readonly=0, can not be modified.

- Parse the JSON response. This will echo the ports of the params object in the data object if the request is successful.

- Parse the JSON failed response if the request is a failure.

- Retrieve the I/O port IDs using Retrieve port information for all ports.
- Send a request to apply changes to the I/O ports with the following JSON request.

- Parse the JSON response. This will echo the ports of the params object in the data object if the request is successful.

- Parse the JSON response and the error responses from the previous example if the request failed.

- Retrieve the I/O port IDs using Retrieve port information for all ports.
- Request a sequence of state changes on the output port, that includes a delay in milliseconds between state changes, using the following JSON request

- Parse the JSON response. This will echo the ports of the params object in the data object if the request is successful.

- Parse the JSON error response.

- Retrieve a list of supported API versions using the following JSON request:

- Parse the JSON response to find out if the operation succeeded.

- Security level: Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- If everything was properly set, a successful response will be generated.
- If a generic error occurred, an error response will be generated. In this case, the entire request is considered a failure.
- If some property value(s) wasn’t able to be set, an error response will be generated. The property for a port that was not successfully set will be pointed out in the error with a port and propertyName.

- Security level: Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- 1100–1199: Generic error codes that are common for many API: s, such as server errors, and can usually be solved by restarting the device.
- 1200–1999: API-specific server errors occurring when different API: s collide.
- 2100–2199: Generic error codes that are common for many API: s, such as client errors, and can usually be solved by changing the input data to the API.
- 2200–2999: API-specific user errors occurring when different API: s collide.

| Methods | Description |
| --- | --- |
| getPorts | Retrieves all ports and their capabilities. |
| setPorts | Configures anything from one to several ports. Some of the available options are:- Setting a nice name that can be used in the user interface.- Configuring the states and what constitutes a normal and triggered state respectively. This will make triggers activate in either open or closed circuits.The reason the change is treated as a nice name is because it doesn’t affect the underlying behavior of the port. Devices with configurable ports can change the direction to either input or output. |
| setStateSequence | Applies a sequence of state changes with a delay in milliseconds between states. This method can only be used on output ports. |
| getSupportedVersions | Retrieves information on which API versions the product is supporting. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getPorts" | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method | The method that was performed. |
| data.numberOfPorts | The number of ports available on the device. |
| data.items[] | Omitted if numberOfPorts is zero. |
| data.items[].port=<string> | The port ID. |
| data.items[].state="<open | closed>" | The current state of the port. |
| data.items[].configurable=<boolean> | Indicates if the port direction can be configured. |
| data.items[].readonly=<boolean> | Tells if the port is read-only and is only present if the value is true. |
| data.items[].usage=<string> | Tells the intended usage of a port. In this case usage is treated as a nice name. Any underlying behavior will not be affected by its value. |
| data.items[].direction="<input | output>" | The direction of the port. |
| data.items[].name=<string> | Specifies the nice name of the port. |
| data.items[].normalState="<open | closed>" | Specifies the normal state of the port. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method | The method that was performed. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message corresponding to the error code. |

| Property name | Description |
| --- | --- |
| port | The port ID. |
| usage | Tells the intended usage of a port, which is useful when you want an application to handle a port in a specific way. In this case usage is treated as a nice name. Example of values are: Button, Door, REX and Tampering. |
| direction | Tells if the port is configured as an input or output. This parameters is read-only for non-configurable ports. |
| name | The nice name of the port. |
| normalState | Defines the normal state for the port. |
| state | Applies the current state for the port (output port only). |

| normalState | state |
| --- | --- |
| open | open |
| open | closed |
| closed | open |
| closed | closed |

| normalState | state |
| --- | --- |
| closed | closed |
| closed | open |
| open | closed |
| open | open |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setPorts" | The performed method. The maximum number of ports that can be configured in one request is limited to 256. |
| params.ports[].port=<string> | Specifies the port ID affected by the current request. The port is retrieved by using the method getPorts. If all optional parameters are omitted, the request will not change anything and the response will not include the current port in the port list. |
| params.ports[].usage=<string> | Specifies the intended usage of the port (optional). |
| params.ports[].direction="<input | output>" | Specifies the direction that should be applied to the port (optional). input: Configure the port to be an input port. output: Configure the port to be an output port. |
| params.ports[].name=<string> | Specifies the nice name that should be used on the specified port (optional). |
| params.ports[].normalState="<open | closed>" | Specifies the normal state of the port (optional). open: Configure the open circuit state to be the normal state of the port. closed: Configure the closed circuit state to be the normal state of the port. |
| params.ports[].state="<open | closed>" | Specifies the current state of the output port (optional). This can only be used by output ports. open: Sets the current state of the output port to open circuit. closed: Sets the current state of the output port to closed circuit. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the client in the corresponding request (optional). |
| method | The method that was performed. |
| data.ports[]=<list of ports> | List of the affected port IDs: <list of ports>: List of "<Port>", e.g. ["1", "2"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the user in the corresponding request (optional). |
| method | The method that was performed. |
| error.code=<integer error code> | The error code of the first encountered error. |
| error.message=<string> | The error message corresponding to the error.code. |
| error.details.port=<string> | The port related to error.code (optional). |
| error.details.propertyName=<string> | The property name related to error.code (optional). |
| error.errors[] | Available only if there is more than one error (optional). |
| error.errors[].code=<integer error code> | The error code. |
| error.errors[].message=<string> | The error message corresponding to the error.errors[].code. |
| error.errors[].details.port=<string> | The port related to the error.errors[].code (optional). |
| error.errors[].details.propertyName=<string> | The property name related to the error.errors[].code (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setStateSequence" | The method that should be used. |
| params.port=<integer> | Specifies the affected port ID. Retrieved by using the method getPorts. |
| params.sequence[].state="<open | closed>" | Specifies the state that should be set. |
| params.sequence[].time=<integer> | Specifies the delay in milliseconds between state changes. The maximum time that can be specified is 65535 milliseconds. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the user in the corresponding request (optional). |
| method | The method that was performed. |
| data.port | The affected port ID. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the user in the corresponding request (optional). |
| method | The method that was performed. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message that corresponds to the error.code |

| Code | Description |
| --- | --- |
| 2200 | State sequence already ongoing. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| context | A text string that will be echoed back if it was provided by the user in the corresponding request (optional). |
| method | The method that was performed. |
| data.apiVersions[]=<list of versions> | A list of supported versions containing all major versions with the highest supported minor version for each. |
| <list of versions> | List of <Major>.<Minor> versions, e.g. ["1.4", "2.5"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | A text string that will be echoed back if it was provided by the user in the corresponding request (optional). |
| method | The method that was performed. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message that corresponds to the error.code |

| Code | Description |
| --- | --- |
| 1100 | Internal error. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |

