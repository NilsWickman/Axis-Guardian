# Regional settings

**Source:** https://developer.axis.com/vapix/network-video/regional-settings/
**Last Updated:** Aug 18, 2025

---

# Regional settings

## Description​

### Model​

### Identification​

## Common examples​

### Get supported versions​

### Get regional settings​

### Set regional settings​

## API specification​

### getSupportedVersions​

### getRegionalSettings​

### setRegionalSettings​

### General error codes​

The Regional settings API makes it possible to store regional settings in the camera, such as different units for length. This information can then be used to determine how these units should be presented. This API does not have any methods that lets you convert the units directly.

The API consists of the CGI regionalsettings.cgi and the following methods:

An alternative way to identify the API is to check for the existence of the regionalsettings.cgi.

Use this example to view a list of API versions supported by the device.

JSON input parameters

a) Successful response example listing supported API versions.

b) Failed response example.

For further instructions, see getSupportedVersions .

Use this example to request information on how to present length in either meters or US customary feet.

JSON input parameters

a) Successful response example indicating that metric units have been selected.

b) Failed response example indicating when an unsupported method has been called.

For further instructions, see getRegionalSettings.

Use this example to apply a regional setting.

JSON input parameters

a) Successful response example.

b) Failed response example that appears when the request doesn’t contain any parameters, or an invalid value.

For further instructions, see setRegionalSettings.

This CGI method can be used to retrieve a list of supported API versions.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This CGI method that can be used to retrieve the current regional settings, which is useful when you wish to determine the length unit in the GUI.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

This CGI method can be used to set the regional settings used in the GUI.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a list of potential errors.

The table lists the general errors that can occur for any CGI method. Specific errors are listed in the API specifications.

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "1.1"]    }}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{    "apiVersion": "1.0",    "method": "getRegionalSettings",    "context": "abc"}
```

```
{    "apiVersion": "1.0",    "method": "getRegionalSettings",    "context": "abc",    "data": {        "units": {            "length": "metric"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "unknownMethod",    "error": {        "code": 1002,        "message": "Unknown method"    }}
```

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{    "apiVersion": "1.0",    "method": "setRegionalSettings",    "context": "abc",    "params": {        "units": {            "length": "us_customary"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setRegionalSettings"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setRegionalSettings",    "error": {        "code": 1003,        "message": "Invalid argument"    }}
```

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>,  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{  "apiVersions": "<Major>.<Minor>",  "context": <string>,  "method": "getRegionalSettings"}
```

```
{  "apiVersion":"<Major>.<Minor>",  "method": "getRegionalSettings",  "context": <string>,  "data": {    "units": {      "length": [metric | us_customary]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "method": "getRegionalSettings",  "context": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://myserver/axis-cgi/regionalsettings.cgi
```

```
{  "apiVersions": "<Major>.<Minor>",  "context": <string>,  "method": "setRegionalSettings",  "params": {    "units": {      "length": [metric | us_customary]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setRegionalSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "method": "setRegionalSettings",  "context": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- Property: root.Properties.RegionalSettings.RegionalSettings="yes"
- AXIS OS: 9.20 and later
- API Discovery: id=regional-settings

- Request a list of supported API versions:

- Parse the JSON response.

- Request the current regional settings.

- Parse the JSON response.

- Update the regional length settings. In this example we will use the US customary units.

- Parse the JSON response.

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| setRegionalSettings | Set the regional settings. |
| getRegionalSettings | Receive the current regional settings. |
| getSupportedVersions | Receive a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| context=<string> | The client sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | Specifies that the getSupportedVersions method is performed. |

| Parameter | Description |
| --- | --- |
| context=<string> | A text string that is echoed back if it was provided by the client in the corresponding request. |
| method="getSupportedVersions" | The performed method. |
| data.apiVersions[]=<list of versions> | Lists all supported major versions along with their highest supported minor version. |
| <list of versions> | List of "<Major>.<Minor>" versions, e.g. ["1.4", "2.5"] |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The client sets this value and the server echoes the data back in the response (optional). |
| method="getRegionalSettings" | Specifies that the getRegionalSettings method is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | A text string that is echoed back if it was provided by the client in the corresponding request. |
| method="getRegionalSettings" | Specifies that the getRegionalSettings method is performed. |
| data.units.length=<metric | us_customary> | Specifies what unit that should be used for length values. Default unit is metric. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The client sets this value and the application echoes it back in the response (optional). |
| method="setRegionalSettings" | Specifies that the setRegionalSettings method is performed. |
| params.units.length=<metric | us_customary> | Specifies what unit to use for length values. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | A text string that is echoed back if it was provided by the client in the corresponding request. |
| method="setRegionalSettings" | Specifies that the setRegionalSettings method is performed. |

| Code | Description |
| --- | --- |
| 1000 | Internal error. |
| 1001 | The requested API version is not supported. |
| 1002 | Unknown method. |
| 1003 | Invalid argument. |
| 1004 | Invalid request. |

