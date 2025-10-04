# Supervised I/O

**Source:** https://developer.axis.com/vapix/network-video/supervised-io/
**Last Updated:** Aug 18, 2025

---

# Supervised I/O

## Description​

### Model​

### Identification​

## Common examples​

### Setup supervision of an I/O port​

### Read status from supervised ports​

### Get supported versions​

## API specification​

### getNumberOfPorts​

### isSupervisable​

### getSupervised​

### setSupervised​

### getSupervisedRanges​

### getSupportedStates​

### getSupportedVersions​

### General error codes​

The Supervised I/O API provides you with you information that makes it possible to set up the I/O so that tampering can be detected on your device and add additional I/O states. In order to configure the supervised I/O you must first define the upper and lower limits, also known as ranges, for each state. These ranges are hardware dependent, as different hardware has different values to detect errors, such as shorted or cut cables and is implemented with end-of-line resistors in alarm circuits.

The API has two supported versions, referred to as version 1.0 and 2.0. What this means is that 1.0 is still fully supported for anyone not in a position to update , but any new implementation must be done in 2.0. The 2 main differences between API versions are:

The API consists of the CGI supervisedio.cgi and the following methods:

At this point, you are required use the following method to set the proper ranges (upper and lower limits) for the different states:

The API also provides interfaces to receive current configurations, which is done with the following methods:

Use this example to set up supervision for a peripheral connected to the Axis device via I/O. This makes it possible for the device to detect tampering such as if someone tries to cut or shorten the cables. You can also:

1) Get the number of input- and output ports in the system:

JSON request example

2) Parse the JSON response. The response will present information on the number of input- and output ports.

3) Get information if a port can be supervised:

4) Parse the JSON response. The response presents information on which of the ports is a supervised input/output.

5) Get information on which states that can be supervised:

6) Parse the JSON response. The response presents information on which states that can be supervised.

7) Set the ranges for each supported state, and the ports as supervised.

Example 1

Example 2

Here is an example for AXIS A9210 Network I/O Relay Module (parallel first 22k/4.7k resistor connection).

Please note there are input-only IOs and AUX IOs (configurable input/output) in AXIS A9210 Network I/O Relay Module. The supervised limits for these two are different. For example: port 10 and port 8 below.

The following table shows the supervised limits for input-only IOs in AXIS A9210 Network I/O Relay Module with different resistors.

| Resistor net | Parallel First 22k/4.7k | Serial First 1k | Serial First 2k | Serial First 4.7k | Serial First 10k |
| Cut | 0–1302 | 0–1993 | 0–1738 | 0–1499 | 0–1319 |
| Open | 1303–1986 | 1994–3070 | 1739–2608 | 1500–2114 | 1320–1704 |
| Closed | 1987–3124 | 3071–3514 | 2609–3307 | 2115–3059 | 1705–2824 |
| Short | 3125–4095 | 3515–4095 | 3308–4095 | 3060–4095 | 2825–4095 |

8) Read the response to see if the operation was successful.

For a list of potential errors, see General error codes.

Use this example to check the analog level of a supervised port and the state that it corresponds to.

1) Read the current state and level of a supervised port:

JSON request example

2) Parse the JSON response. The response presents information about the current state of the ports.

For a list of potential errors, see General error codes.

Use this example to check if the device supports a feature before you use it.

1) Get a list of supported JSON API versions. Note that no apiVersion is supposed to be defined in the request.

JSON request example

2) Parse the JSON response to determine if the operation succeeded.

a) Successful response

b) Error response

For a list of potential errors, see General error codes.

See getSupportedVersions for further instructions.

This CGI method is used to return the number of input and output ports.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to check if an I/O port can be set to supervised.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to check if an I/O port is supervised and its current state.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to enable/disable supervision of an I/O port, or configure the ranges for a supervised port.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to get the ranges that is corresponding to the states of a port.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to retrieve a list of the states supported by the API.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This CGI method is used to retrieve a list of the supported response schema versions that are available.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

General error codes for API version 1.0

General error codes for API version 2.0

```
http://myserver/axis-cgi/supervisedio.cgi
```

```
{    "apiVersion": "2.0",    "method": "getNumberOfPorts"}
```

```
{    "apiVersion": "2.0",    "method": "getNumberOfPorts",    "data": {        "inputs": 2,        "outputs": 2    }}
```

```
{    "apiVersion": "2.0",    "method": "isSupervisable"}
```

```
{    "apiVersion": "2.0",    "method": "isSupervisable",    "data": {        "items": [            { "port": 0, "input": true, "output": false },            { "port": 1, "input": true, "output": false }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "getSupportedStates",    "params": [{ "port": 1 }]}
```

```
{    "apiVersion": "2.0",    "method": "getSupportedStates",    "data": {        "items": [            {                "port": 1,                "states": [{ "name": "short" }, { "name": "close" }, { "name": "open" }, { "name": "cut" }]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "setSupervised",    "params": [        {            "port": 0,            "supervised": true,            "ranges": [                {                    "state": "short",                    "lowerlimit": 0,                    "upperlimit": 9                },                {                    "state": "close",                    "lowerlimit": 10,                    "upperlimit": 90                },                {                    "state": "open",                    "lowerlimit": 91,                    "upperlimit": 200                },                {                    "state": "cut",                    "lowerlimit": 201,                    "upperlimit": 255                }            ]        },        {            "port": 1,            "supervised": true,            "ranges": [                {                    "state": "short",                    "lowerlimit": 0,                    "upperlimit": 9                },                {                    "state": "close",                    "lowerlimit": 10,                    "upperlimit": 90                },                {                    "state": "open",                    "lowerlimit": 91,                    "upperlimit": 200                },                {                    "state": "cut",                    "lowerlimit": 201,                    "upperlimit": 255                }            ]        }    ]}
```

```
{    "apiVersion": "2.0",    "method": "setSupervised",    "params": [        {            "port": 10,            "supervised": true,            "ranges": [                {                    "state": "cut",                    "lowerlimit": 0,                    "upperlimit": 1302                },                {                    "state": "open",                    "lowerlimit": 1303,                    "upperlimit": 1986                },                {                    "state": "closed",                    "lowerlimit": 1987,                    "upperlimit": 3124                },                {                    "state": "short",                    "lowerlimit": 3125,                    "upperlimit": 4095                }            ]        },        {            "port": 9,            "supervised": true,            "ranges": [                {                    "state": "cut",                    "lowerlimit": 0,                    "upperlimit": 1302                },                {                    "state": "open",                    "lowerlimit": 1303,                    "upperlimit": 1986                },                {                    "state": "closed",                    "lowerlimit": 1987,                    "upperlimit": 3124                },                {                    "state": "short",                    "lowerlimit": 3125,                    "upperlimit": 4095                }            ]        },        {            "port": 8,            "supervised": true,            "ranges": [                {                    "state": "short",                    "lowerlimit": 0,                    "upperlimit": 100                },                {                    "state": "closed",                    "lowerlimit": 101,                    "upperlimit": 350                },                {                    "state": "open",                    "lowerlimit": 351,                    "upperlimit": 620                },                {                    "state": "cut",                    "lowerlimit": 621,                    "upperlimit": 4095                }            ]        },        {            "port": 7,            "supervised": true,            "ranges": [                {                    "state": "short",                    "lowerlimit": 0,                    "upperlimit": 100                },                {                    "state": "closed",                    "lowerlimit": 101,                    "upperlimit": 350                },                {                    "state": "open",                    "lowerlimit": 351,                    "upperlimit": 620                },                {                    "state": "cut",                    "lowerlimit": 621,                    "upperlimit": 4095                }            ]        },        {            "port": 5,            "supervised": true,            "ranges": [                {                    "state": "cut",                    "lowerlimit": 0,                    "upperlimit": 1302                },                {                    "state": "open",                    "lowerlimit": 1303,                    "upperlimit": 1986                },                {                    "state": "closed",                    "lowerlimit": 1987,                    "upperlimit": 3124                },                {                    "state": "short",                    "lowerlimit": 3125,                    "upperlimit": 4095                }            ]        },        {            "port": 2,            "supervised": true,            "ranges": [                {                    "state": "cut",                    "lowerlimit": 0,                    "upperlimit": 1302                },                {                    "state": "open",                    "lowerlimit": 1303,                    "upperlimit": 1986                },                {                    "state": "closed",                    "lowerlimit": 1987,                    "upperlimit": 3124                },                {                    "state": "short",                    "lowerlimit": 3125,                    "upperlimit": 4095                }            ]        },        {            "port": 1,            "supervised": true,            "ranges": [                {                    "state": "cut",                    "lowerlimit": 0,                    "upperlimit": 1302                },                {                    "state": "open",                    "lowerlimit": 1303,                    "upperlimit": 1986                },                {                    "state": "closed",                    "lowerlimit": 1987,                    "upperlimit": 3124                },                {                    "state": "short",                    "lowerlimit": 3125,                    "upperlimit": 4095                }            ]        }    ]}
```

```
{    "apiVersion": "2.0",    "method": "setSupervised",    "data": {        "items": [            { "port": 0, "code": 1, "message": "" },            { "port": 1, "code": 1, "message": "" }        ]    }}
```

```
http://myserver/axis-cgi/supervisedio.cgi
```

```
{    "apiVersion": "2.0",    "method": "getSupervised",    "params": [{ "port": 1 }, { "port": 2 }]}
```

```
{    "apiVersion": "2.0",    "method": "getSupervised",    "data": {        "items": [            {                "port": 1,                "supervised": true,                "supervisable": true,                "state": "short",                "level": 0            },            {                "port": 2,                "supervised": true,                "supervisable": true,                "state": "open",                "level": 2300            }        ]    }}
```

```
http://myserver/axis-cgi/supervisedio.cgi
```

```
{    "method": "getSupportedVersions",    "context": "123"}
```

```
{    "apiVersion": "2.0",    "method": "getSupportedVersions",    "context": "123",    "data": {        "apiVersions": ["1.0", "2.0"]    }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "getNumberOfPorts",  "context": <string>}
```

```
{  "apiVersion": <string>,  "method": "getNumberOfPorts",  "context": <string>,  "data": {    "inputs": <integer>,    "outputs": <integer>  }}
```

```
{  "apiVersion": <string>,  "method": "getNumberOfPorts",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "isSupervisable",  "context": <string>,  "params": [    {"port": <integer>}  ]}
```

```
{  "apiVersion": <string>,  "method": "isSupervisable",  "context": <string>,  "data": {    "items": [      {"port": <integer>, "input": <boolean>, "output": <boolean>}    ]  }}
```

```
{  "apiVersion": <string>,  "method": "isSupervisable",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "getSupervised",  "context": <string>,  "params": [    {"port": <integer>}  ]}
```

```
{  "apiVersion": <string>,  "method": "getSupervised",  "context": <string>,  "data": {    "items": [      {        "port": <integer>,        "supervised": <boolean>,        "supervisable": <boolean>,        "state": <string>,        "level": <integer>      }    ]  }}
```

```
{  "apiVersion": <string>,  "method": "getSupervised",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "setSupervised",  "context": <string>,  "params": [    {      "port": <integer>,      "supervised": <boolean>,      "ranges": [        {          "state": <string>,          "lowerlimit": <integer>,          "upperlimit": <integer>        }      ]    }  ]}
```

```
{  "apiVersion": <string>,  "method": "setSupervised",  "context": <string>,  "data": {    "items": [      {"port": <integer>, "code": <integer>, "message": <string>}    ]  }}
```

```
{  "apiVersion": <string>,  "method": "setSupervised",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "getSupervisedRanges",  "context": <string>,  "params": [    {"port": <integer>}  ]}
```

```
{  "apiVersion": <string>,  "method": "getSupervisedRanges",  "context": <string>,  "data": {    "items": [      {        "port": <integer>,        "ranges": [          {            "state": <string>,            "lowerlimit": <integer>,            "upperlimit": <integer>          }        ]      }    ]  }}
```

```
{  "apiVersion": <string>,  "method": "getSupervisedRanges",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "apiVersion": <string>,  "method": "getSupportedStates",  "context": <string>,  "params": [    {"port": <integer>}  ]}
```

```
{  "apiVersion": <string>,  "method": "getSupportedStates",  "context": <string>,  "data": {    "items": [      {        "port": <integer>,        "states": [          {"name": <string>}        ]      }    ]  }}
```

```
{  "apiVersion": <string>,  "method": "getSupportedStates",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<myserver>/axis-cgi/supervisedio.cgi
```

```
{  "method": "getSupportedVersions",  "context": <string>}
```

```
{  "method": "getSupportedVersions",  "context": <string>,  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.Minor2"]  }}
```

```
{  "method": "getSupportedVersions",  "context": <string>,  "error": {    "code": <integer>,    "message": <string>}
```

- The error codes in 2.0 uses a 4 digit structure with codes divided into different ranges..
- Different OK response for the setSupervised method.

- Property: Properties.API.HTTP.Version=3
- Property: Properties.SupervisedIO.SupervisedIO=yes
- Property: Properties.SupervisedIO.Version=2.00
- AXIS OS: 7.10 and later
- API Discovery: id=supervised-io

- determine if an I/O port can be set up as supervised.
- configure different trigger levels for when a cable is cut or shorted (depending of the electrical configuration of the device).

- Security level: Operator
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

- Security level: Operator
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

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

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

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getNumberOfPorts | Ask for the number of available in- and output ports on the system. |
| isSupervisable | Check if a port can be supervised. |
| setSupervised | Pick a port using the previous methods and set it to supervised. |

| Method | Description |
| --- | --- |
| getSupportedStates | Receive information about supported states in the system. Available states are open, close, cut and shorted. |

| Method | Description |
| --- | --- |
| getSupervised | Check if a port is supervised. |
| getSupervisedRanges | Check the current ranges of each state. You can receive information about the current state and level of the supervised system by using the method getSupervised. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | Current version of the API. |
| method=getNumberOfPorts | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="getNumberOfPorts" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.inputs | Number of input ports. |
| data.outputs | Number of output ports. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current API version. |
| method="getNumberOfPorts" | The method described in this section. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current API version. |
| method=isSupervisable | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |
| params[].port=<integer> | This integer specify which I/O port to check. If left out, only supervisable ports are returned (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current API version. |
| method="isSupervisable" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.items[].port | The port number. |
| data.items[].input | True if supervised input exists, false if not. |
| data.items[].output | True if supervised output exists, false if not. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current API version. |
| method="isSupervisable" | The method described in this section. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=getSupervised | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |
| params[].port=<integer> | This integer specify which I/O port to check. If left out, information regarding all supervised ports are returned (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="getSupervised" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.items[].port | Port number. |
| data.items[].supervised | True if supervised, false if not. |
| data.items[]supervisable | True if supervisable, false if not. |
| data.items[].state | The state of the port. |
| data.items[].level | The current analog level. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="getSupervised" | The method described in this section. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=setSupervised | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |
| params[].port<integer> | The port to configure. If omitted, all ports are configured. |
| params[].supervised=<boolean> | True activates supervised I/O for the port. False deactivates supervised I/O for the port. |
| params[].ranges[] | Array with range of limits set for each state (optional). |
| params[].ranges[].state | The state to set the ranges for. |
| params[].ranges[].lowerlimit | The lower limit. |
| params[].ranges[].upperlimit | The upper limit. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="setSupervised" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.items[].port | Port number. |
| data.items[].code | 1 if the operation was successful. If the operation failed, one of the error codes listed in General error codes will be listed instead. |
| data.items[].message | A string describing the error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="setSupervised" | The method described in this section. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=getSupervisedRanges | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |
| params[].port=<integer> | This integer state which I/O port to check. If it is omitted, information about all ports are returned (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="getSupervisedRanges" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.items[].port | The port number. |
| data.items[].ranges[] | Array holding information about the ranges. If the ranges are not set, or the port is not supervisable, the array is empty. |
| data.items[].ranges[].state | The name of the state. |
| data.items[].ranges[].lowerlimit | Lower voltage range. |
| data.items[].ranges[].upperlimit | Upper voltage range. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method="getSupervisedRanges" | The method described in this section. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=getSupportedStates | The method described in this section. |
| context=<string> | Text string echoed back in the response (optional). |
| params[].port=<integer> | This integer specify which I/O port to check. If omitted, information regarding all ports is returned (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=getSupportedStates | The method the response corresponds to. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.items[].port | The port number. |
| data.items[].states[].name | Name of the state. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The current version of the API. |
| method=getSupportedStates | The method the response corresponds to. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Parameter | Description |
| --- | --- |
| method="getSupportedVersions" | Specifies that the getSupportedVersions operation is performed. |
| context=<string> | Text string echoed back in the response (optional). |

| Parameter | Description |
| --- | --- |
| method="getSupportedVersions" | The method described in this section. |
| context=<string> | A text string echoed back if it was provided by the client in the corresponding request. |
| data.apiVersions[]=<list of versions> | List of supported versions, all major versions with the highest supported minor version. |
| <list of versions> | List of "<Major>.<Minor>" versions, e.g. ["1.0", "2.0"]. |

| Parameter | Description |
| --- | --- |
| method=<string> | The method name. |
| context=<string> | The text string from the request echoed back in the response. |
| error.code | One of the error codes listed in General error codes. |
| error.message | One of the error messages listed in General error codes. |

| Error code | Description |
| --- | --- |
| 100 | Unsupported API version |
| 101 | Internal error |
| 102 | Mandatory parameter(s) missing |
| 103 | Unknown parameter supplied |
| 200 | JSON input error |
| 201 | Unexpected error |
| 202 | Generic error |
| 203 | Invalid method |
| 300 | Faulty parameter |
| 301 | Invalid range |
| 302 | Invalid port parameter |
| 303 | Port not supervisable |

| Error code | Description |
| --- | --- |
| 1100 | Internal error |
| 2100 | Unsupported API version |
| 2101 | JSON input error |
| 2102 | Invalid method |
| 2103 | Mandatory parameter(s) missing |
| 2200 | Unknown parameter supplied |
| 2201 | Unexpected error |
| 2202 | Generic error |
| 2203 | Faulty parameter value |
| 2204 | Invalid range |
| 2205 | Invalid port parameter |
| 2206 | Port not supervisable |

