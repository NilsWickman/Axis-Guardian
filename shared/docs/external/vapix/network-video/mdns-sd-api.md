# mDNS-SD API

**Source:** https://developer.axis.com/vapix/network-video/mdns-sd-api/
**Last Updated:** Aug 18, 2025

---

# mDNS-SD API

## Description​

### Terminology​

### Model​

#### getMdnssdInfo​

#### getSupportedVersions​

#### setMdnssdConfiguration​

#### discover​

### Identification​

### Obsoletes​

## Common examples​

### Configure the mDNS-SD service on the Axis device​

### Retrieve the supported API versions​

### Discover devices and their services on the network​

## API specification​

### getMdnssdInfo​

### getSupportedVersions​

### setMdnssdConfiguration​

### discover​

### General error codes​

The mDNS-SD API makes it possible to configure the mDNS-SD (Multicast DNS Service Discovery) functionality on an Axis device. The API is able to exist in multiple versions, which can be supported simultaneously by the device.

The methods of this API are accessible through mdnssd.cgi, which should be called using HTTP POST with JSON formatted data as its input. The API consists of the following methods, each representing a single functionality:

An API call includes the API version, a context (optional), a method and its input parameters. The only exception to this rule is the method getSupportedVersions, where the API version is optional.

This method retrieves the mDNS-SD configuration of the Axis device. The response consists of the enabled state of the mDNS-SD service and the friendly name that is used when responding to the discover queries.

This method is used to discover all supported API versions. The method is not coupled with any specific API version and does not require the API version arguments when invoked.

This method sets the enabled state of the mDNS-SD service as well as the friendly name.

This method discovers devices on the network exposing the specified mDNS-SD services. Axis products generally exposes _axis_video.txp for cameras and _axis_nvr.tcp for recorders, meaning that when you are trying to discover Axis devices, these are the types of services that should be used.

For information about the API Discovery, see API Discovery service

This API renders the process of setting and retrieving mDNS-SD related parameters through param.cgi obsolete, however, the following parameters are still in use and fully supported by the mdnssd.cgi:

Using either cgi on devices that have both the mdnssd.cgi and param.cgi will yield the same result.

Use this example to configure the Axis device to be discoverable on a local network by using mDNS-SD.

1) Navigate to the mDNS-SD configuration page in the Video Management System (VMS). This triggers the VMS to retrieve the mDNS-SD configuration from the device and then present it.

JSON input parameters

2) The VMS parses the response and if the request is successful it will be presented on the mDNS-SD page.

a) Successful response.

b) Error response. This error occurs if the CGI encounters an internal error that causes it to abort the operation.

3) Read the returned information and make the necessary changes, then instruct the VMS to apply the new configurations with the request described below.

JSON input parameters

4) The VMS will receive a response and, depending on its success, returns a result of the operation.

a) Successful response.

b) Error response 1: When the VMS has sent an incomplete request and misses at least one required parameter.

c) Error response 2: When the error Invalid parameter(s) (4004), which also contains a subCode, that describes which parameter that was deemed invalid. For a list of possible sub codes, see the mDNS-SD invalid parameter error sub codes table below.

For further instructions, see getMdnssdInfo.

mDNS-SD invalid parameter error sub codes

For further instructions, see setMdnssdConfiguration.

Use this example to receive information on which API versions the VMS can use when it is communicating with an Axis device.

Get a list of supported API versions

1) Navigate to the device management page to add an Axis device. The VMS will receive the device address and make an API call to get a list of supported API versions, it decides if it can operate the device and presents you with further options.

JSON input parameters

2) The VMS will parse the response and if the request is successful, it will present the appropriate choices on the management page.

a) Successful response.

b) Error response. This error will occur if the CGI encounters an internal error that causes it to abort the operation.

See getSupportedVersions for further instructions.

Use this example to discover other devices and their respective service offerings on the network.

Discover devices exposing the video services

Navigate to the device management page to add an Axis device. The VMS will receive the device address and make an API call to get a list of supported API versions, it decides if it can operate the device and presents you with further options.

JSON input parameters

The VMS will parse the response and if the request is successful, it will present the appropriate choices on the management page.

Successful response

Error response

API reference

See discover for additional information.

Returns the mDNS-SD service configuration on an Axis device.

Request

Request body syntax

Return value - Success

Returns the mDNS-SD service configuration on the Axis device.

Response body syntax

Return value - Error

Returns an error code and a description.

Response body syntax

Error codes

See General error codes.

Retrieves a list on supported API versions.

Request

Request body syntax

Return value - Success

Returns a list of supported API versions.

Response body syntax

Return value - Error

Returns an error code and a description.

Response body syntax

Error codes

See General error codes.

Sets the mDNS-SD service configuration on an Axis device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Returns an error code and a description.

Response body syntax

Error codes

See General error codes.

Returns on-demand discoveries of specified mDNS-SD services on the network after a specified timer has run out.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Returns an error code and a description.

Response body syntax

Error codes

See General error codes.

These error codes are common for all API methods.

In the event of an internal CGI error (1000) the HTTP response code will be 500, while the other CGI errors are set to 200.

Note that the user authentication and authorization of the CGI is performed on a HTTP level and will return the HTTP error code 401 if the authentication is unsuccessful. The authorization of the CGI is performed after the HTTP authentication and authorization has passed, and will always return a HTTP code 200 regardless of the result. If it fails at a latter stage, the response will consist of a 200 HTTP code and JSON data containing the error 4002, meaning that the authorization failed and that the CGI was not authorized to use some of the resources it needed to accomplish its task.

```
POST http://<device-address>/axis-cgi/mdnssd.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getMdnssdInfo"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getMdnssdInfo",    "data": {        "enabled": true,        "friendlyName": "AXIS P1234 - 00408C1A2B3C"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<device-address>/axis-cgi/mdnssd.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setMdnssdConfiguration",    "params": {        "enabled": true,        "friendlyName": "Kitchen camera"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setMdnssdConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4003,        "message": "Missing parameter(s)"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 2        }    }}
```

```
POST http://<device-address>/axis-cgi/mdnssd.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "3.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.4", "3.1"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<device-address>/axis-cgi/mdnssd.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": discover",    "params": {        "services": ["_axis-video._tcp"],        "timeout": 5    }}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "discover",    "data": {        "devices": [            {                "friendlyName": "device-1",                "hostname": "axis-abc",                "interface": "eth0",                "ipv4Addresses": ["192.168.0.91", "160.254.0.1"],                "ipv6Addresses": [],                "services": [                    {                        "name": "_axis-video._tcp",                        "port": 80,                        "txt": "macaddress:abcdefghijk"                    }                ]            },            {                "friendlyName": "device-2",                "hostname": "axis-abd",                "interface": "eth0",                "ipv4Addresses": ["192.168.0.92", "160.254.0.2"],                "ipv6Addresses": [],                "services": [                    {                        "name": "_axis-video._tcp",                        "port": 80,                        "txt": "macaddress:abcdefghijl"                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "discover",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
http://<device-address>/axis-cgi/mdnssd.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getMdnssdInfo",  "params": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getMdnssdInfo",  "data": {    "enabled": <boolean>,    "friendlyName": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getMdnssdInfo",  "error": {    "code": <error code>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/mdnssd.cgi
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
http://<device-address>/axis-cgi/mdnssd.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "setMdnssdConfiguration",  "params": {    "enabled": <boolean>,    "friendlyName": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setMdnssdConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setMdnssdConfiguration",  "error": {    "code": <error code>,    "message": <string>    "details": {      "subCode": <error sub code>    }  }}
```

```
http://<device-address>/axis-cgi/mdnssd.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "discover",  "params": {    "services": [<string>],    "timeout": <integer>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "discover",  "data": {    "devices": [      {        "friendlyName": <string>,        "hostname": <string>,        "interface": <string>,        "ipv4Addresses": [<string>],        "ipv6Addresses": [<string>,]        "services": [          {            "name": <string>,            "port": <integer>,            "txt": <string>          }        ]      }    ]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "discover",  "error": {    "code": <error code>,    "message": <string>    "details": {      "subCode": <error sub code>    }  }}
```

- getMdnssdInfo
- getSupportedVersions
- setMdnssdConfiguration
- discover

- API Discovery: id=mdnssd

- Network.Bonjour.Enabled
- Network.Bonjour.FriendlyName

- Navigate to the device management page to add an Axis device. The VMS will receive the device address and make an API call to get a list of supported API versions, it decides if it can operate the device and presents you with further options.
POST http://<device-address>/axis-cgi/mdnssd.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
JSON input parameters
{    "apiVersion": "1.1",    "context": "abc",    "method": discover",    "params": {        "services": ["_axis-video._tcp"],        "timeout": 5    }}
- The VMS will parse the response and if the request is successful, it will present the appropriate choices on the management page.
Successful response
{    "apiVersion": "1.1",    "context": "abc",    "method": "discover",    "data": {        "devices": [            {                "friendlyName": "device-1",                "hostname": "axis-abc",                "interface": "eth0",                "ipv4Addresses": ["192.168.0.91", "160.254.0.1"],                "ipv6Addresses": [],                "services": [                    {                        "name": "_axis-video._tcp",                        "port": 80,                        "txt": "macaddress:abcdefghijk"                    }                ]            },            {                "friendlyName": "device-2",                "hostname": "axis-abd",                "interface": "eth0",                "ipv4Addresses": ["192.168.0.92", "160.254.0.2"],                "ipv6Addresses": [],                "services": [                    {                        "name": "_axis-video._tcp",                        "port": 80,                        "txt": "macaddress:abcdefghijl"                    }                ]            }        ]    }}
Error response
{    "apiVersion": "1.1",    "context": "abc",    "method": "discover",    "error": {        "code": 1000,        "message": "Internal error"    }}

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

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Term | Description |
| --- | --- |
| API | Application Programming Interface. |
| Axis device | An Axis network device (e.g. a network camera, doorbell or a network speaker). |
| HTTP | Hyper Text Transfer Protocol, a commonly used protocol for communicating over the internet. |
| JSON | Java Style Object Notation, a standardized way of serializing data. |
| mDNS-SD | Multicast DNS Service Discovery. |
| VMS | A Video Management System for managing network video cameras. |

| Number | Description |
| --- | --- |
| 1 | The invalid parameter is enabled. |
| 2 | The invalid parameter is friendlyName. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. |
| method="getMdnssdInfo" | The method that the client is requesting, in this case getMdnssdInfo. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="getMdnssdInfo" | The method that the client requested, in this case getMdnssdInfo. |
| data.enabled=<boolean> | Specifies the desired enabled state of the mDNS-SD service. true means that the service is enabled and running, false that it is disabled and not running. |
| data.friendlyName=<string> | The friendly name that the mDNS-SD service should use when responding to a discover query. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="getMdnssdInfo" | The method that was created, in this case getMdnssdInfo. |
| error.code=<error code> | An error code describing what kind of error has occurred. |
| error.message=<string> | An error message describing the error code in readable text. |

| Parameter | Description |
| --- | --- |
| context=<string> | Optional. The context of the request. |
| method="getSupportedVersions" | The method that the client is requesting, in this case getSupportedVersions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The value will always be the latest supported API versions. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="getSupportedVersions" | The method that the client requested, in this case getSupportedVersions. |
| data.apiVersions=[<string>] | Contains a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The value will always be the latest supported API version. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="getSupportedVersions" | Optional. The method that the client requested, in this case getSupportedVersions. This property will not be present for all errors.. |
| error.code=<integer> | Describes what kind of error that occurred. |
| error.message=<string> | Describes the error code in readable text. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. |
| method="setMdnssdConfiguration" | The method that the client is requesting, in this case setMdnssdConfiguration. |
| params.enabled=<boolean> | Optional. Specifies the desired enabled state of the mDNS-SD service. true means that the service is enabled and running, false that it is disabled and not running. |
| params.friendlyName=<string> | Optional. The friendly name the mDNS-SD service should use when responding to a discovery query. This string is limited to a maximum size of 48 bytes. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="setMdnssdConfiguration" | The method that the client requested, in this case setMdnssdConfiguration. |
| data | This field will be empty, as no data is returned on a successful request. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="setMdnssdConfiguration" | The method that the client requested, in this case setMdnssdConfiguration. |
| error.code=<error code> | An error code describing what kind of error has occurred. |
| error.message=<string> | An error message describing the error code in readable text. |
| error.details.subCode=<error sub code> | In certain cases the sub code present details about the error to make it easier to understand which part that failed. An example is the error Invalid parameter(s), where the sub code specifies which parameter that was invalid. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. |
| method="discover" | The method that the client is requesting, in this case discover. |
| params.services=[<string>] | The list of services, wherein at least one must be in the DNS SRV record format. |
| params.timeout=<integer> | The timeout for the discover services procedure that must be between 1–15 seconds. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="discover" | The method that the client requested, in this case discover. |
| data.devices=[<object>] | A list containing discovered devices. |
| data.devices.friendlyName=<string> | The friendly name of the discovered device. |
| data.devices.hostname=<string> | The hostname of the discovered device. |
| data.devices.interface=<string> | The network interface on which the device was discovered. |
| data.devices.ipv4Addresses=[<string>] | A list containing the IPv4 addresses on the discovered device. |
| data.devices.ipv6Addresses=[<string>] | A list containing the IPv6 addresses on the discovered device. |
| data.devices.services=[<object>] | A list containing the services exposed by the discovered device. |
| data.devices.services.name=<string> | The name of the service. |
| data.devices.services.port=<integer> | The port on which the service may be found. |
| data.devices.services.txt=<string> | The text record of the service. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that is used in the response. It must always have the same major version as the request, but will default to the highest minor version as long as the method exists and is supported. |
| context=<string> | Optional. The context of the request. The response will always have the same context as the request. |
| method="discover" | The method that the client requested, in this case discover. |
| error.code=<error code> | An error code describing what kind of error has occurred. |
| error.message=<string> | An error message describing the error code in readable text. |
| error.details.subCode=<error sub code> | In certain cases the sub code present details about the error to make it easier to understand which part that failed. An example is the error Invalid parameter(s), where the sub code specifies which parameter that was invalid. |

| Code | Message |
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

