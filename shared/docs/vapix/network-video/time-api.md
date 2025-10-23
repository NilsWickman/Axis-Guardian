# Time API

**Source:** https://developer.axis.com/vapix/network-video/time-api/
**Last Updated:** Aug 18, 2025

---

# Time API

## Overview​

### Identification​

### Obsoletes​

## Common examples​

### Retrieve information​

#### Retrieve Date and Time information​

#### Retrieve Date and Time Information and List of Available Time Zones​

### Set properties​

#### Set Date and Time​

#### Set Time Zone​

#### Set POSIX Time Zone​

#### Reset time zone​

## API specification​

### getDateTimeInfo​

### getAll​

### setDateTime​

### setTimeZone​

### setPosixTimeZone​

### resetTimeZone​

### getSupportedVersions​

### Error handling​

This API will be deprecated as of AXIS OS version 12.4 and will no longer receive updates. It is replaced by the Device Configuration Time API.

The Time API makes it possible to get and set time, date and time zone information. There currently exist two different time zone formats:

The API uses the time.cgi and consists of the following methods:

The API consists of an authenticated CGI which should be called using the HTTP POST method, and with JSON formatted data as input. The API includes a number of methods, which makes it possible to:

The available time zones are the ones provided by IANA, and are usually referred to as tz or zoneinfo. They are periodically updated to reflect changes made by political bodies, UTC offsets and daylight-saving rules.

DHCP time zone

The DHCP time zone will be used by default when available and if no manual configuration of the time zone has been done. DHCP time zone will not be used even if it’s available on the network once a time zone has been manually configured. The time zone needs to be reset to re-enable the DHCP time zone. The following priority order is considered for the time zone:

Once DHCP time zone is utilized, it will be kept until either a new DHCP time zone is received through the network or a manual time zone is configured. If the DHCP lease is expired and no time zone information is received anymore, the previously obtained DHCP time zone will be kept.

For information about the API Discovery, see API Discovery service.

This API deprecates the following methods:

All requests made to Time API is done through a HTTP request with a proper JSON body, while all the responses to the API calls will be returned as JSON data.

Use this example to receive the current time, date and time zone information on the device, the latter whom also includes a list of supported time zones in different formats, which is dependent on whether:

The dstEnabled will be available in the response if a POSIX format string is returned.

1) Request current date and time information with the following JSON request.

2) There are six possible JSON responses, where the time zone information may differ. Please note that not all of the different JSON responses will be shown below. Possible names for the data responses are listed in the table below.

a) Parse the JSON response, which only includes time zone information in an IANA format.

b) Parse the JSON response, which will include only time zone information in the POSIX format.

c) Parse the JSON response, which will include time zone information in both the IANA and POSIX format.

d) Parse the JSON response, which will include the time zone information in both IANA and POSIX, as well as the time zone retrieved via DHCP and an indicator if the DHCP time is utilized.

1) Request current date and time information and list of available time zones with the following JSON request.

2) There are six possible JSON responses, where the time zone information may differ. Please note that not all of the different JSON responses will be shown below. The names that can be included in the response data are listed in the table below.

a) Parse the JSON response which includes only time zone information in the IANA format.

b) Parse the JSON response which includes only time zone information in the POSIX format.

c) Parse the JSON response which includes time zone information in both IANA and POSIX format.

d) Parse the JSON response, which will include the time zone information in both IANA and POSIX, as well as the time zone retrieved via DHCP and an indicator if the DHCP time is utilized.

Use this example to set the time, date and time zone on the device.

1) Request set date and time with the following JSON request.

2) Parse the JSON response which echoes the value of params object in the data object if successful.

Please note that the dateTime parameter is in the UTC format, which should be formatted as [YYYY]-[MM]-[DD]T[hh]:[mm]:[ss]Z.

setTimeZone is the preferred way of setting the time zone on the device.

See setTimeZone for additional information. The setTimeZone will turn off use of DHCP time zone.

1) Request set time zone with the following JSON request.

2) Parse the JSON response which echoes the value of params object in the data object if successful.

Please note that this request will set a new IANA time zone and clear any previous POSIX time zone. The POSIX string in the Time Zone Database will not be affected.

Be aware that setPosixTimeZone is not the recommended way when setting the time zone. Instead, use the preferred method setTimeZone in the Set Time Zone section. The setPosizTimeZone parameter will turn off the use of DHCP time zones.

1) Request set POSIX time zone with the following JSON request.

2) Parse the JSON response, which echoes the value of params object in the data object if successful.

Please note that this request will set a new POSIX time zone and clear any previous IANA time zones.

Reset the time zone to device default. The device will use DHCP time zones if it is available.

1) Request set POSIX time zone with the following JSON request.

2) Parse the JSON response status in the data object if successful.

Please note that this request will clear any previous IANA and POSIX time zones.

getDateTimeInfo is used to retrieve all the date and time related properties provided by the Time API.

Request

Return value - Success

A successful response may contain time zone information in one of the following formats:

Additionally, DHCP time zone information may be included in the successful responses if the DHCP time zone is obtained from the network.

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

getAll is used to retrieve all date and time related properties provided by the Time API, including a list of supported time zones.

Request

Return value - Success

A successful response may contain time zone information in one of the following formats:

Additionally, DHCP time zone information may be included in the successful responses if the DHCP time zone is obtained from the network.

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

setDateTime is used to set the date and time.

Request

Return value - Success

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

setTimeZone is used to set the time zone. This will set a new IANA time zone, clearing any previous POSIX time zones, although its string in the Time Zone Database will not be affected.

setTimeZone is the preferred way of setting a time zone on the device, since it uses an uniform naming convention, such as Europe/Stockholm, which is easier to understand than the POSIX style. The Time Zone Database is commonly used in Linux distributions.

Request

Return value - Success

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

setPosixTimeZone is used to set the POSIX time zone. This will set a new POSIX time zone and clear the previous IANA time zones. This method is not the recommend way of setting the time zone, as the POSIX style format has a complex structure and the enabled DST requires manual configuration. Instead, setTimeZone is the preferred method.

Request

Return value-Success

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

resetTimeZone is used to reset time zones back to the device default value. The DHCP time zone will be used when available.

Request

Return value - Success

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

getSupportedVersions is used to retrieve supported API versions.

Request

Return value - Success

Response body syntax

Return value - Failure

There currently doesn’t exist any specific error response for this method.

Error codes

General errors are listed in Error handling.

The following table lists general errors that can occur for any JSON requests. As there currently doesn’t exist any specific error responses, a general JSON error response is listed below. Descriptions will only be used to describe the type of error code that appears and detailed information on the fault will be provided in the message field in the error structure.

All failures are returned with the following JSON response:

Error response body syntax

HTTP status codes

Some HTTP requests might fail before the JSON parser can be called. These errors are returned in the JSON body when the service is executed, which means that the client must be able to handle HTTP error codes. Specifically HTTP errors 401 and 403 will be returned if the authentication fails.

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getDateTimeInfo"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getDateTimeInfo",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getDateTimeInfo",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getDateTimeInfo",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm",        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true    }}
```

```
{    "apiVersion": "1.1",    "context": "Client defined request ID",    "method": "getDateTimeInfo",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm",        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true,        "dhcpTimeZone": "Europe/Berlin",        "dhcpTimeZoneUtilized": false    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getAll"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getAll",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm",        "timeZones": ["Africa/Abidjan", "Africa/Accra"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getAll",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true,        "timeZones": ["Africa/Abidjan", "Africa/Accra"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getAll",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm",        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true,        "timeZones": ["Africa/Abidjan", "Africa/Accra"]    }}
```

```
{    "apiVersion": "1.1",    "context": "Client defined request ID",    "method": "getAll",    "data": {        "dateTime": "2018-11-19T13:26:53Z",        "localDateTime": "2018-11-19T14:26:53+01:00",        "maxYearSupported": 2069,        "timeZone": "Europe/Stockholm",        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true,        "dhcpTimeZone": "Europe/Berlin",        "dhcpTimeZoneUtilized": false,        "timeZones": ["Africa/Abidjan", "Africa/Accra"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setDateTime",    "params": {        "dateTime": "2018-12-24T14:28:53Z"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setDateTime",    "data": {        "dateTime": "2018-12-24T14:28:53Z"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setTimeZone",    "params": {        "timeZone": "Europe/Stockholm"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setTimeZone",    "data": {        "timeZone": "Europe/Stockholm"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPosixTimeZone",    "params": {        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "enableDst": true    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "setPosixTimeZone",    "data": {        "posixTimeZone": "CET-1CEST,M3.5.0,M10.5.0/3",        "dstEnabled": true    }}
```

```
{    "apiVersion": "1.1",    "context": "Client defined request ID",    "method": "resetTimeZone"}
```

```
{    "apiVersion": "1.1",    "context": "Client defined request ID",    "method": "resetTimeZone",    "data": {        "status": "success"    }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "getDateTimeInfo"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "getDateTimeInfo",  "data": {    "dateTime": "<date and time>",    "maxYearSupported": <Max supported year integer>,    "localDateTime": "<local date and time>",    "timeZone": "<IANA time zone id>"    "posixTimeZone": <POSIX time zone string>,    "dstEnabled": <DST flag>,    "dhcpTimeZone": "<IANA time zone id or POSIX time zone string>",    "dhcpTimeZoneUtilized": <DHCP utilization flag>  }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "getAll"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "getAll",  "data": {    "dateTime": "<date and time>",    "maxYearSupported": <Max supported year integer>,    "localDateTime": "<local date and time>",    "timeZone": "<IANA time zone id>"    "posixTimeZone": <POSIX time zone string>,    "dstEnabled": <DST flag>,    "dhcpTimeZone": "<IANA time zone id or POSIX time zone string>",    "dhcpTimeZoneUtilized": <DHCP utilization flag>,    "timeZones": ["<IANA time zone id1>", "<IANA time zone id2>", ...]  }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "setDateTime",    "params": {        "dateTime": "<date and time>"    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "setDateTime",    "data": {        "dateTime": "<date and time>"    }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "setTimeZone",    "params": {        "timeZone": "<IANA time zone>"    }}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "setTimeZone",    "data": {        "timeZone": "<IANA time zone>"    }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "setPosixTimeZone",  "params": {    "posixTimeZone": "<POSIX time zone string>",    "enableDst": <DST flag>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "setPosixTimeZone",  "data": {    "posixTimeZone": "<POSIX time zone string>",    "dstEnabled": <DST flag>  }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "resetTimeZone"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "resetTimeZone",    "data": {        "status": "success"    }}
```

```
http://myserver/axis-cgi/time.cgi
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions"}
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Major1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "<method string>",  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

- The Time Zone Database is provided by IANA (Internet Assigned Numbers Authority) and offers an easy way to set the time zone. An example of such a time zone format is Europe/Stockholm and once the time zone is selected the daylight saving rules will be applied for that time zone, as the database is updated to reflect changes in the time zones. Thus, an updated version of the database will be included through the AXIS OS upgrades and be applied without the need to change the time zone setting.
- The POSIX format (Portable Operating System Interface). Example of such a time zone format is CET-1CEST,M3.5.0,M10.5.0/3.

- get and set the date and time.
- get the local date and time.
- get and set the time zone.
- reset time zone to default.
- list available time zones.

- Manually set time zone
- Manually set time zone
- DHCP time zone (if available)
- DHCP time zone (if available)
- Default time zone
- Default time zone

- Manually set time zone

- DHCP time zone (if available)

- Default time zone

- API Discovery: id=time-service
- AXIS OS: 9.30 and later

- date.cgi: This method was removed in AXIS OS version 11.0.
- Time.POSIXTimeZone and Time.DST.Enabled: Both of these methods are fully supported by the Time API, but can also be accessed through the legacy param.cgi. Note that these parameters will be removed in AXIS OS version 13.0 and no longer be usable after that.

- if the time zone has been set with the IANA format, the get operation will include the IANA format, but it can also include the POSIX format if it is available in the IANA Time Zone Database.
- if the time zone has been set with the POSIX format, the get operation will only include the POSIX format.

- Security level: Viewer
- Method: POST

- IANA: The get operation will include this format, however, it can also come with the POSIX format as long as it is available in the IANA Time Zone Database.
- POSIX: The get operation will include this format.

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Viewer
- Method: POST

- IANA: The get operation will include this format, however, it can also come with the POSIX format as long as it is available in the IANA Time Zone Database.
- POSIX: The get operation will include this format.

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

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Methods | Description |
| --- | --- |
| getDateTimeInfo | Get system date, time, time zone and local time. See Retrieve Date and Time information for additional information. |
| getAll | Get all properties returned from getDateTimeInfo plus a list of available time zones in the IANA format. |
| setDateTime | Set system date and time UTC. See Set Date and Time for additional information. |
| setTimeZone | Set system time zone in the IANA format. |
| setPosixTimeZone | Set system time zone in the POSIX format and the DST flag. |
| resetTimeZone | Manually reset the set time zones back to the device default value. DHCP time zone will be used by default when available. |
| getSupportedVersions | Get API versions supported by the product. |

| Parameter | Description |
| --- | --- |
| dateTime | System date and time presented in UTC. The format is in ISO 8601. |
| localDateTime | Local date and time. The format is ISO 8601. |
| maxYearSupported | The latest year that the date can be set to. |
| timeZone | System time zone in the IANA format. |
| posixTimeZone | System time zone in the POSIX format. |
| dstEnabled | true means that it will activate the DST settings of the POSIX time zone string. false means that it will ignore the DST settings of the POSIX time zone string. Always true if the IANA time zone format is present. Omitted if POSIX time zones aren’t available. |
| dhcpTimeZone | Time zone retrieved through DHCP, in either the IANA or POSIX format. This is omitted if DHCP time zone isn’t available. Introduced in API version 1.1. |
| dhcpTimeZoneUtilized | true means that the DHCP time zone is used by the system. false means that the DHCP is not used. Omitted if DHCP time zone isn’t available. Introduced in API version 1.1. |

| Parameter | Description |
| --- | --- |
| dateTime | System date and time presented in UTC. The format is in ISO 8601. |
| localDateTime | Local date and time. The format is ISO 8601. |
| maxYearSupported | The latest year that the date can be set to. |
| timeZone | System time zone in the IANA format. |
| posixTimeZone | System time zone in the POSIX format. |
| dstEnabled | true means that it will activate the DST settings of the POSIX time zone string. false means that it will ignore the DST settings of the POSIX time zone string. Always true if the IANA time zone format is present. Omitted if POSIX time zones aren’t available. |
| dhcpTimeZone | Time zone retrieved through DHCP, in either the IANA or POSIX format. This is omitted if DHCP time zone isn’t available. Introduced in API version 1.1. |
| dhcpTimeZoneUtilized | true means that the DHCP time zone is used by the system. false means that the DHCP is not used. Omitted if DHCP time zone isn’t available. Introduced in API version 1.1. |
| timeZones | List supported time zones in the IANA format. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that should be used. |
| context=<ID string> | Optional. The client sets this value, while the server echoes the date back in the response. If set, it will be present in the response regardless of whether the response was successful or not. |
| method=getDateTimeInfo | Required. Specifies that the getDateTimeInfo operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.dateTime | The system date and time in UTC, presented in the ISO 8601 format. |
| data.maxYearSupported | The latest year that the date can be set to. |
| data.localDateTime | The local date and time in the ISO 8601 format. |
| data.timeZone | The system time zone in IANA format, for example Europe/Stockholm. Omitted if the IANA time zone isn’t available. |
| data.posixTimeZone | The system time zone in the POSIX format, for example EST5EDT,M3.2.0,M11.1.0. Omitted if the POSIX time zone isn’t available. |
| data.dstEnabled | The DST flag for controlling the POSIX time zone string: Always true if the IANA time zone format is present. Omitted if the POSIX time zone isn’t available. true means it will activate the DST settings of the POSIX time zone string. false means it will ignore the DST settings of the POSIX time zone string. |
| data.dhcpTimeZone | The DHCP time zone that can be in either the IANA or POSIX format. Omitted if the DHCP time zone isn’t available. Introduced in API version 1.1. |
| data.dhcpTimeZoneUtilized | The DHCP time zone utilization flag. It will indicate if the DHCP time zone is used by the system. Omitted if DHCP time zone isn’t available. Introduced in API version 1.1. true means that DHCP time zone is used by the system. false means that DHCP time zone is not used by the system. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that is used. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method=getAll | Required. Specifies that the getAll operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.dateTime | The system date and time in UTC, presented in the ISO 8601 format. |
| data.maxYearSupported | The latest year that the date can be set to. |
| data.localDateTime | The local date and time in the ISO 8601 format. |
| data.timeZone | The system time zone in IANA format, for example Europe/Stockholm. Omitted if the IANA time zone isn’t available. |
| data.posixTimeZone | The system time zone in the POSIX format, for example EST5EDT,M3.2.0,M11.1.0. Omitted if the POSIX time zone isn’t available. |
| data.dstEnabled | The DST flag for controlling the POSIX time zone string: Always true if the IANA time zone format is present. Omitted if the POSIX time zone isn’t available. true means it will activate the DST settings of the POSIX time zone string. false means it will ignore the DST settings of the POSIX time zone string. |
| data.dhcpTimeZone | The DHCP time zone that can be in either the IANA or POSIX format. Omitted if the DHCP time zone isn’t available. Introduced in API version 1.1. |
| data.dhcpTimeZoneUtilized | The DHCP time zone utilization flag. It will indicate if the DHCP time zone is used by the system. Omitted if DHCP time zone isn’t available. Introduced in API version 1.1. true means that DHCP time zone is used by the system. false means that DHCP time zone is not used by the system. |
| data.timeZones[] | Contains an array of time zones in the IANA format. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that is used. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method=setDateTime | Required. Specifies that the setDateTime operation is performed. |
| params.dateTime=<date and time> | Required. Specifies that the date and time are set in UTC. The dateTime should be formatted as [YYYY]-[MM]-[DD]T[hh]:[mm]:[ss]Z and be between the epoch and the last second of the year declared by maxYearSupported. (Example: 2018-12-24T20:30:45Z). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.dateTime | Echoes the date and time value that has been set. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that is used. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method=setTimeZone | Required. Specifies that the setTimeZone operation is performed. |
| params.timeZone=<IANA time zone> | Required. Specifies which IANA time zone that should be set. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.timeZone | Echoes the time zone value that has been set. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that is used. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method=setPosixTimeZone | Required. Specifies that the setPosixTimeZone operation is performed. |
| params.posixTimeZone=<POSIX time zone> | Required. Specifies that the POSIXtime zone should be set, for example EST5EDT,M3.2.0,M11.1.0. |
| params.enableDst=<DST flag> | Required. Set to true to activate the DST settings of the POSIX time zone string. Set to false to ignore the DST setting of the POSIX time zone string. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.posixTimeZone | Echoes the set value of the time zone. |
| data.dstEnabled | Echoes the set values of the DST flag. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | Required. The API version that is used. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method=resetTimeZone | Required. Specifies that the resetTimeZone operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.status | Indicate operation success with success. |

| Parameter | Description |
| --- | --- |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If it is set, it will be present in the response, regardless of whether the response is successful or not. |
| method="getSupportedVersions" | Required. Specifies that the getSupportedVersions operation is performed. |

| Parameter | Description |
| --- | --- |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| data.apiVersions | Contains an array of supported versions. |
| data.apiVersions[]=<list of versions> | Contains a list of supported "<Major>.<Minor>" versions, e.g. ["1.4","2.5"]. |

| Code | Description |
| --- | --- |
| 1000 | Internal error. Refer to message field or logs. |
| 2000 | Invalid request. Only HTTP request type POST is supported. |
| 2001 | Request body too large. |
| 3000 | Invalid JSON data. |
| 4000 | Method does not exist. |
| 4001 | The specified version is not supported. |
| 4002 | Authorization failed. |
| 4003 | Missing parameter(s). |
| 4004 | Invalid parameter(s). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | The method that is used to produce the response. |
| error.code | Contains the error code. This value can be a method specific and/or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

