# NTP API

**Source:** https://developer.axis.com/vapix/network-video/ntp-api/
**Last Updated:** Aug 27, 2025

---

# NTP API

## Overview​

### Identification​

### Obsoletes​

## Common examples​

### Configure the NTP client​

### Retrieve the supported API versions​

## API specifications​

### getNTPInfo​

### getSupportedVersions​

### setNTPClientConfiguration​

### General error codes​

The VAPIX® NTP API (Network Time Protocol) provides the information that makes it possible to synchronize the clocks on your Axis devices.

Terminology

The API implements ntp.cgi, which can be called by using HTTP POST with JSON formatted input data. The following methods are supported:

This CGI replaces param.cgi by offering an updated way to configure and retrieve data for NTP related parameters.

Use this example to configure your Axis device to synchronize its internal clock and date by using NTP.

Retrieve the NTP configuration from your device.

JSON input parameters

Parse the JSON response.

Successful response example

Error response

Implement the necessary changes using the configuration below.

JSON input parameters

Parse the JSON response.

Successful response

Error response 1

This error response will appear when the request was sent without all required parameters.

Error response 2

This error response will provide additional information about the missing parameter in the form of a subCode. Potential subCodes are listed in the table below.

NTP invalid parameter error sub codes

API references

getNTPInfo

setNTPClientConfiguration

Use this example when you wish to investigate which API version that you can use with your device.

Retrieve a list of supported API versions.

JSON input parameters

Parse the JSON response.

Successful response

Error response

API references

getSupportedVersions

This API method is used to return to an NTP configuration and related information.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method will show you a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method is used to set the NTP client configuration on your Axis device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

The HTTP response code is set to 500 for internal CGI errors (1000), while all other errors use 200 as their response code.

Authentication of the user and authorization to use the CGI is done on a HTTP level and will return the error code 401 if the call is unsuccessful. This is followed by the authorization process for the CGI services, which is always performed after the HTTP level has been cleared and can therefore only return a 200 code regardless of it being successful or not. If the authorization fails, it will thus return the 200 code along with the error code 4002, which means that the CGI wasn’t authorized to use some of the resources it needed to accomplish its task.

The following error codes are used by all API methods:

```
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of the JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNTPInfo"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNTPInfo",    "data": {        "client": {            "enabled": true,            "NTSEnabled": false,            "serversSource": "DHCP",            "maxSupportedStaticServers": 5,            "staticServers": ["192.168.0.80"],            "advertisedServers": ["ntp.someserver.com", "12.7.232.11"],            "staticNTSKEServers": ["ntske.someserver.com", "13.8.343.12"],            "synced": true,            "timeToNextSync": 1234,            "timeOffset": -12.34,            "minpoll": 2,            "maxpoll": 2        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of the JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setNTPClientConfiguration",    "params": {        "enabled": true,        "NTSEnabled": false,        "serversSource": "static",        "staticServers": ["192.168.0.91", "192.168.0.92"],        "staticNTSKEServers": ["ntske.someserver.com", "13.8.343.12"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setNTPClientConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4003,        "message": "Missing parameter(s)"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 3        }    }}
```

```
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of JSON input parameters below>
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
http://<servername>/axis-cgi/ntp.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNTPInfo",  "params": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNTPInfo",  "data": {    "client": {      "enabled": <boolean>,      "NTSEnabled": <boolean>,      "NTSKEServerCACerts": [        <string>      ],      "serversSource": <string>,      "maxSupportedStaticServers": <integer>,      "staticServers": [        <string>      ],      "advertisedServers": [        <string>      ],      "staticNTSKEServers": [        <string>      ],      "synced": <boolean>,      "timeToNextSync": <integer>,      "timeOffset": <double>,      "minpoll": <integer>,      "maxpoll": <integer>    }  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNTPInfo",  "error": {    "code": <error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/ntp.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "params": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [<string>]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/ntp.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "setNTPClientConfiguration",  "params": {    "enabled": <boolean>,    "NTSEnabled": <boolean>,    "NTSKEServerCACerts": [      <string>    ],    "serversSource": <string>,    "staticServers": [      <string>    ],    "staticNTSKEServers": [      <string>    ],  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setNTPClientConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setNTPClientConfiguration",  "error": {    "code": <error code>,    "message": <string>    "details": {      "subCode": <error sub code>    }  }}
```

- API Discovery: id=ntp
- Property: Properties.API.HTTP.Version=3
- AXIS OS: 9.10 and later

- Retrieve the NTP configuration from your device.
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of the JSON input parameters below>
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNTPInfo"}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNTPInfo",    "data": {        "client": {            "enabled": true,            "NTSEnabled": false,            "serversSource": "DHCP",            "maxSupportedStaticServers": 5,            "staticServers": ["192.168.0.80"],            "advertisedServers": ["ntp.someserver.com", "12.7.232.11"],            "staticNTSKEServers": ["ntske.someserver.com", "13.8.343.12"],            "synced": true,            "timeToNextSync": 1234,            "timeOffset": -12.34,            "minpoll": 2,            "maxpoll": 2        }    }}
Error response
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 1000,        "message": "Internal error"    }}
- Implement the necessary changes using the configuration below.
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of the JSON input parameters below>
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "setNTPClientConfiguration",    "params": {        "enabled": true,        "NTSEnabled": false,        "serversSource": "static",        "staticServers": ["192.168.0.91", "192.168.0.92"],        "staticNTSKEServers": ["ntske.someserver.com", "13.8.343.12"]    }}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "abc",    "method": "setNTPClientConfiguration",    "data": {}}
Error response 1
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4003,        "message": "Missing parameter(s)"    }}
This error response will appear when the request was sent without all required parameters.
Error response 2
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 3        }    }}
This error response will provide additional information about the missing parameter in the form of a subCode. Potential subCodes are listed in the table below.
NTP invalid parameter error sub codes









































subCodeDescription1The invalid parameter is enabled.2The invalid parameter is serversSource.3The invalid parameter is staticServers or one of its list values.5The invalid parameter is NTSEnabled.6The invalid parameter is staticNTSKEServers or one of its list values.7The invalid parameter is minpoll valid values range from (0) to (24).8The invalid parameter is maxpoll valid values range from (0) to (24).9The invalid parameter is NTSKEServerCACerts.

- Retrieve a list of supported API versions.
POST http://<servername>/axis-cgi/ntp.cgi HTTP/1.1Content-type: application/jsonContent-length: <Size of JSON input parameters below>
JSON input parameters
{    "context": "abc",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response
{    "apiVersion": "3.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.4", "3.1"]    }}
Error response
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "Internal error"    }}

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

| Term | Description |
| --- | --- |
| API | Application Programming Interface. |
| Axis device | An Axis network device, such as a network camera, doorbell or network speaker. |
| DHCP | Dynamic Host Configuration Protocol. A network configuration protocol used by a DHCP server to configure IP enabled devices connected to a network. This allows them to communicate with other IP enabled devices and networks. |
| HTTP | Hyper Text Transfer Protocol. A commonly used protocol for communicating over the internet. |
| IP | Internet Protocol. |
| JSON | Java Style Object Notification. A way to serialize data. |
| Network interface device | A device representing a network interface, such as a wired network interface controller, a WLAN network interface controller or a Bluetooth network interface controller. |
| NTP | Network Time Protocol. |
| NTS | Network Time Security. |
| NTS KE | Network Time Security Key Establishment. |

| Method | Description |
| --- | --- |
| getNTPInfo | Retrieve the NTP configuration of your device. The response will consist of both an optional client and server section. You will know if your device has support for NTP capabilities if the client and server sections are present in the response.If the client section is present, it will consist of the following parts:- The enabled state of the NTP client.- An indicator if NTS is used.- The server source, which will inform you if the client prefers a DHCP advertised list of servers or user-assigned static servers.- The maximum number of supported static servers.- Your list of static NTP servers- A list of DHCP advertised NTP servers received over the network.- A list containing your static NTS KE servers.- Synchronization information, which includes whether the time has been synced through NTP, the size of the time offset against the synced server and the remaining time until the next sync.The static servers will include a list of IP addresses or the user assigned domain names of the NTP servers. These are used when the NTP client is configured to use static servers to synchronize the clocks and the usage of NTS is disabled. The static servers will also be used when none of the existing devices receive an address configuration from a DHCP server from the network. Please note that a device can be configured to not receive IP address configurations through the network by setting at least one static server to replace all existing static servers in the NTP client configuration.The DHCP advertised servers will consist of a list of IP addresses or domain names, which the device will have received through the network of DHCP servers via one or several network interface devices. The static NTS Key Establishment servers consists of a list of user defined IP addresses or domain names of NTS KE servers, which are used when the NTP client is configured to use NTS to synchronize the time. The NTS-KE CA certificate ID specifies which CA certificates to trust. For possible values, see getNTPInfo.A flag will indicate whether the time has been synced by the NTP since the device was restarted and the offset time will indicate how much differential (in milliseconds) between the NTP client and server. There is also a timer for when the next synchronization is due (in seconds).The min/max poll specify the interval between synchronization attempts sent to the server, where the value is represented as a power of 2 in seconds. For example, a min poll of 6 would mean that the poll interval should not drop below 64 seconds. The same goes for max poll, the only difference being that the indicated number sets the limit for the maximum poll interval. |
| getSupportedVersions | Retrieve a list of supported API versions. |
| setNTPClientConfiguration | Set the NTP client configuration. This may include the enabled state of the NTP client, if the NTS should be used, and a list of static NTP servers and with which to synchronize the time. This method also includes the option to list user-assigned NTP servers and static NTS KE servers.The static servers consists of a list of IP addresses or domain names of the NTP servers set by the user. These can be used when the NTP client has been configured to use static servers by setting the server source to static instead of DHCP, which will synchronize the time. The static servers can also be used when none of the existing devices have received an NTP server assignment from a DHCP server. This also includes a list of DHCP advertised servers that could be used for time synchronization, but only when NTS is disabled. What this means is that NTP client support can be used even when NTS is disabled, in which cases serversSource and staticServers will be used, while staticNTSKEServers will be used when NTS is enabled. Also, enabled=true must be used in order to use NTP, both with or without NTS.Please note that a device can be configured to not receive IP address configurations from the network, i.e. not using a DHCP NTP configuration. Specifying a new static server list will overwrite the existing static servers in the NTP client configuration and the list can thus be cleared by either setting an empty list or a list consisting of an empty string. For more information about DHCP, particularly DHCP addresses, see Network settings API.The static NTS Key Establishment servers consists of a list of user defined IP addresses or domain names of NTS KE servers, which are used when the NTP client is configured to use NTS to synchronize the time.The min/max poll are set if the user want to change the default poll interval. Default values are 6 for minimum poll and 10 for maximum. The minimum value should not be lower than the maximum values and allowed values range from 0 to 24.For possible values, see getNTPInfo. |

| subCode | Description |
| --- | --- |
| 1 | The invalid parameter is enabled. |
| 2 | The invalid parameter is serversSource. |
| 3 | The invalid parameter is staticServers or one of its list values. |
| 5 | The invalid parameter is NTSEnabled. |
| 6 | The invalid parameter is staticNTSKEServers or one of its list values. |
| 7 | The invalid parameter is minpoll valid values range from (0) to (24). |
| 8 | The invalid parameter is maxpoll valid values range from (0) to (24). |
| 9 | The invalid parameter is NTSKEServerCACerts. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getNtpInfo | The performed method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getNTPInfo" | The method that was performed. |
| data.client.enabled=<boolean> | Specifies the desired enabled state of the NTP client.* true: The client is enabled and running.- false: The client is disabled and not running. |
| data.client.NTSEnabled=<boolean> | Specifies if NTS should be used.* true: The NTP client uses NTS instead of regular NTP- false: NTS is disabled. |
| data.client.NTSKEServerCACerts=[<string>] | Specifies a list of CA certificates to trust for certification validation. (optional) |
| data.client.serversSource=<string> | The source of the server list. Synchronizes time with the NTP client.* DHCP: Uses NTP servers listed in a DHCP lease. Falls back to static if none were obtained. - static: Uses a static list of NTP servers set by the user. |
| data.client.maxSupportedStaticServers=<number> | The maximum number of static servers that the client can use for time synchronization. |
| data.client.staticServers=[<string>] | A list of static NTP servers. Should be used if serversSource is set to static and NTS is disabled. |
| data.client.advertisedServers=[<string>] | A list of NTP servers received in a DHCP lease. Should be used if serversSource is set to DHCP and if NTS is disabled. |
| data.client.staticNTSKEServers=[<string>] | A static list of NTS Key Establishment servers used by the NTS and validated by system trusted CA certificates if not specified by NTSKEServerCACerts. |
| data.client.synced=<boolean> | Indicates that time has been synced with NTP after a reboot. |
| data.client.timeToNextSync=<number> | The remaining time (in seconds) until the next synchronization attempt. If no NTP servers are used, the value will be 0. |
| data.client.timeOffset=<number> | The time offset between local and server time (in milliseconds). Only used if synced is set to true. |
| data.client.minpoll=<number> | The minimum interval between synchronization attempts sent to the server. |
| data.client.maxpoll=<number> | The maximum interval between synchronization attempts sent to the server. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getNTPInfo" | The method that was performed. |
| error.code=<error code> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
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
| method="getSupportedVersions | The method that was performed. |
| error.code=<integer> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setNTPClientConfiguration" | The performed method. |
| params.enabled=<boolean> | Specifies the desired of the NTP client.* true: The client is enabled and running.- false: The client is disabled and not running. |
| params.NTSEnabled=<boolean> | Specifies if NTS is used.* true: The NTP client should use NTS instead of regular NTP- false: NTS should be disabled. |
| params.client.NTSKEServerCACerts=[<string>] | Specifies a list of CA certificates to trust for certification validation. (optional) |
| params.serversSource=<string> | The source of the server list that should be used when you synchronize the NTP client.* DHCP: Uses NTP servers listed in a DHCP lease.- static: Uses a static list of NTP servers set by the user. |
| params.staticServers=[<string>] | A list of static NTP servers. Should be used if serversSource is set to static and NTS is disabled. There is a limit to the number of NTP servers the client can be configured to synchronize its time with. The limit is specified by the maxSupportedStaticServers parameter in getNTPInfo. |
| params.staticNTSKEServers=[<string>] | A static list of NTS Key Establishment servers used to synchronize the time over NTS. Please note that there is a limit on the number of static NTS KE servers the NTP client can be configured to synchronize its time with and is specified by the maxSupportedStaticServers parameter. The servers themselves are validated by system trusted CA certificates if not specified by NTSKEServerCACerts. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="setNTPClientConfiguration" | The method that was performed. |
| data | This field is empty, since this particular request, when successfully executed, doesn’t return any data. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | A text string echoed back if it was provided in the corresponding request (optional). |
| method="getNTPInfo" | The method that was performed. |
| error.code=<error code> | The error code describing the kind of error that occurred. |
| error.message=<string> | The error message describing the error to the user. |
| error.details.subCode=<error sub code> | The sub code give details about errors that makes them easier to understand which part that was erroneous. For example, if the error was for "Invalid parameter(s)", the code will specify which parameter that was invalid. |

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

