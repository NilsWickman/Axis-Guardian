# Basic device information

**Source:** https://developer.axis.com/vapix/network-video/basic-device-information/
**Last Updated:** Aug 18, 2025

---

# Basic device information

## Description​

### Identification​

## Common examples​

### Get basic device information​

### Get basic device information as an anonymous user​

## API specification​

### getAllProperties​

### getProperties​

### getAllUnrestrictedProperties​

### getSupportedVersions​

### Error handling​

The AXIS Basic device information API can be used to retrieve simple information about the product. This information is used to identify basic properties of the product, and is based around the following methods:

The API consists of an authenticated CGI which should be called using the HTTP POST method and JSON formatted data as an input. Using the API makes it possible to:

Use this example to receive information on how to identify and communicate with a device before it is configured/initialized in its internal state, or to identify the way how to communicate with the device.

Basic device information (BDI) service will provide some information about the device that will make it easier to identify. For example, on some low-end products where Parameter management isn’t available, this service will be an entry point to identify the device.

All requests to the BDI service is done by following this HTTP request with a proper JSON body. Responses to the API calls will also be delivered as JSON data.

Get all properties

1) Request all properties with the following JSON request:

2) Parse the JSON response to include all properties:

Get some properties

1) Request a subset of the properties with the following JSON request.

2) Parse the JSON response which includes selected properties.

Handle errors

If an error occur while processing the clients request a JSON response will be returned containing an error code and a detailed message.

1) Request properties that does not exist with the following JSON request.

2) Parse the JSON response which includes an error message and a message.

Use this example to show some device information during the initial access before a root user has been defined, or when no user is logged in.

Get all unrestricted properties

Request all unrestricted properties using the following JSON request:

Parse the JSON response.

Handle errors

If an error occur while processing the clients request a JSON response will be returned containing an error code and a detailed message.

See Get basic device information for an example and Error handling for general error guidelines.

getAllProperties is used to retrieve all properties provided by the BDI service. This API can also be used to identify what type of properties BDI service is providing.

Request

Return value - Success

Response body syntax

Return value - Failure

No specific failure exists for this method. General errors are listed in Error handling.

getProperties is used to retrieve a subset of the properties provided by the BDI service.

Request

Return value - Success

Response body syntax

Return value - Failure

No specific failure exists for this method. General errors are listed in Error handling.

getAllUnrestrictedProperties is used to retrieve all unspecified properties by the BDI service.

Request

Return value - Success

Return value - Success

Response body syntax

Return value - Failure

No specific failure exists for this method. General errors are listed in Error handling.

getSupportedVersions is used to retrieve supported API versions.

Request

Return value - Success

Response body syntax

Return value - Failure

No specific failure exists for this method. General errors are listed in Error handling.

The following table lists general errors that may occur for any JSON request. Errors that are specific for a method are listed under the API description for that method. Descriptions are only used to describe the type of the error code. Detailed information on the fault will be provided in a message field inside the error structure.

All failures are returned with the following JSON response:

Error response body syntax

```
http://myserver/axis-cgi/basicdeviceinfo.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getAllProperties"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "data": {        "propertyList": {            "Architecture": "mips",            "Brand": "AXIS",            "BuildDate": "Feb 14 2018 13:08",            "HardwareID": "714.4",            "ProdFullName": "AXIS Q3505 Mk II Fixed Dome Network Camera",            "ProdNbr": "Q3505 Mk II",            "ProdShortName": "AXIS Q3505 Mk II",            "ProdType": "Network Camera",            "ProdVariant": "",            "SerialNumber": "ACCC8E78B977",            "Soc": "Axis Artpec-5",            "SocSerialNumber": "00000000-00000000-44123C08-C840037D",            "Version": "8.20.1",            "WebURL": "http://www.axis.com"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getProperties",    "params": {        "propertyList": ["Brand", "ProdNbr", "Version"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "data": {        "propertyList": {            "Brand": "AXIS",            "ProdNbr": "Q3505 Mk II",            "Version": "8.20.1"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getProperties",    "params": {        "propertyList": ["Brand", "ProdNbr", "Version", "invalid_property_name"]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "error": {        "code": 1000,        "message": "Property not supported: invalid_property_name"    }}
```

```
http://myserver/axis-cgi/basicdeviceinfo.cgi
```

```
{    "apiVersion": "1.2",    "context": "Client defined request ID",    "method": "getAllUnrestrictedProperties"}
```

```
{    "apiVersion": "1.2",    "context": "Client defined request ID",    "data": {        "propertyList": {            "Brand": "AXIS",            "BuildDate": "Aug 04 2020 11:15",            "HardwareID": "75E.1",            "ProdFullName": "AXIS Q1785-LE Network Camera",            "ProdNbr": "Q1785-LE",            "ProdShortName": "AXIS Q1785-LE",            "ProdType": "Network Camera",            "ProdVariant": "",            "SerialNumber": "ACCC8EAF8C30",            "Version": "8.20.1",            "WebURL": "http://www.axis.com"        }    }}
```

```
http://<servername>/axis-cgi/basicdeviceinfo.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "getAllProperties"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "data": {        "propertyList": {            "Architecture": "<string>",            "Brand": "<string>",            "BuildDate": "<string>",            "HardwareID": "<string>",            "ProdFullName": "<string>",            "ProdNbr": "<string>",            "ProdShortName": "<string>",            "ProdType": "<string>",            "ProdVariant": "<string>",            "SerialNumber": "<string>",            "Soc": "<string>",            "SocSerialNumber": "<string>",            "Version": "<string>",            "WebURL": "<string>"        }    }}
```

```
http://<servername>/axis-cgi/basicdeviceinfo.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "method": "getProperties",  "params": {    "propertyList": [      "<property1>",      "<property2>",      "<property3>",      ...    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<string>",  "data": {    "propertyList": {      "<property1>": "<string>",      "<property2>": "<string>",      "<property3>": "<string>",      ...    }  }}
```

```
http://<servername>/axis-cgi/basicdeviceinfo.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "method": "getAllUnrestrictedProperties"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<string>",    "data": {        "propertyList": {            "Brand": "<string>",            "BuildDate": "<string>",            "HardwareID": "<string>",            "ProdFullName": "<string>",            "ProdNbr": "<string>",            "ProdShortName": "<string>",            "ProdType": "<string>",            "ProdVariant": "<string>",            "SerialNumber": "<string>",            "Version": "<string>",            "WebURL": "<string>"        }    }}
```

```
http://<servername>/axis-cgi/basicdeviceinfo.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersions": "<Major>.<Minor>",  "context": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- Get all supported properties in one shot.
- Get a selected subset of properties.
- Get all unrestricted properties.
- Get a list of supported API versions.

- AXIS OS: 8.40 and later
- API Discovery: id=basic-device-info
- Property: BasicDeviceInfo.BasicDeviceInfo="yes"

- Request all unrestricted properties using the following JSON request:
{    "apiVersion": "1.2",    "context": "Client defined request ID",    "method": "getAllUnrestrictedProperties"}
- Parse the JSON response.
{    "apiVersion": "1.2",    "context": "Client defined request ID",    "data": {        "propertyList": {            "Brand": "AXIS",            "BuildDate": "Aug 04 2020 11:15",            "HardwareID": "75E.1",            "ProdFullName": "AXIS Q1785-LE Network Camera",            "ProdNbr": "Q1785-LE",            "ProdShortName": "AXIS Q1785-LE",            "ProdType": "Network Camera",            "ProdVariant": "",            "SerialNumber": "ACCC8EAF8C30",            "Version": "8.20.1",            "WebURL": "http://www.axis.com"        }    }}

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

- Security level: Anonymous
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Anonymous
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Usage |
| --- | --- |
| getProperties | Get a list of requested parameter values. |
| getAllProperties | Get a list of all supported parameters. |
| getAllUnrestrictedProperties | Get a list of all unrestricted parameters. |
| getSupportedVersions | Get a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | Optional. Client sets this value and the server echoes the data back in the response. If set, it will be present in the response regardless of whether the response is successful or not. |
| method="getAllProperties" | Required. Specifies that the getAllProperties operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | Text string echoed back if it has been provided by the client in the corresponding request. |
| data.propertyList | Contains all property pairs for the device the service is running on. All available properties are included in the response. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | Optional. Client sets this value and the server echoes the data back in the response. If set, it will be present in the response regardless of whether the response is successful or not. |
| method="getProperties" | Required. Specifies that the getProperties operation is performed. |
| params.propertyList=<array of property names> | Required. Specifies which properties should be returned with the response. If this field is empty an empty list will be returned. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context=<string> | Text string echoed back if it is provided by the client in the corresponding request. |
| data.propertyList | Contains selected property pairs for the device on which the service is running on. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | Optional. Client sets this value and the server echoes the data back in the response. If set, it will be present in the response regardless of whether the response is successful or not. |
| method="getAllUnrestrictedProperties" | Required. Specifies that the getAllUnrestrictedProperties operation is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | Text string echoed back if it has been provided by the client in the corresponding request. |
| data.propertyList | Contains all property pairs for the device the service is running on. All available properties are included in the response. |

| Parameter | Description |
| --- | --- |
| context=<string> | Optional. The client sets this value and the server echoes the data back in the response. If set, it will be present in the response regardless of whether the response is successful or not. |
| method="getSupportedVersions" | Required. Specifies that the getSupportedVersions operation can be performed. |

| Parameter | Description |
| --- | --- |
| context=<string> | Text string echoed back if it is provided by the client in the corresponding request. |
| method="getSupportedVersions" | Required. Specifies that the getParameters operation is performed. |
| data.apiVersions | Contains an array of supported versions. |

| Code | Description |
| --- | --- |
| 1000 | Invalid parameter with the value specified. |
| 2001 | Access forbidden. |
| 2002 | HTTP request types are not supported. Only POST is supported. |
| 2003 | The requested API version is not supported. |
| 2004 | The method is not supported. |
| 4000 | Invalid JSON format. |
| 4002 | Required parameter is either missing or invalid. |
| 8000 | Internal error. Refer to the message field or logs. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context=<string> | Text string echoed back if it is provided by the client in the corresponding request. |
| error.code | Contains an error code. This value can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

