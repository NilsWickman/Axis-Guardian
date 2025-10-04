# API Discovery service

**Source:** https://developer.axis.com/vapix/network-video/api-discovery-service/
**Last Updated:** Aug 18, 2025

---

# API Discovery service

## Identification​

### Authentication​

### Obsoletes​

## Common examples​

### Get API information​

### Get all APIs​

### Get a subset of APIs​

### Handle errors​

## API specification​

### GLOB patterns​

### getApiList​

### getSupportedVersions​

### Error handling​

The VAPIX® API Discovery service makes it possible to retrieve information about APIs supported on their products. The API consists of the following methods:

The API consists of a CGI which can be called using HTTP POST and JSON formatted data as input. Included are a number of methods which makes it possible to receive a list of all VAPIX APIs.

The AXIS OS version can either be obtained through the Basic device information or by requesting the property Properties.Firmware.Version with param.cgi.

No authentication is required for this API, except on devices running Axis OS versions 9.80 and 10.12. Using the API without proper authentication with these OS versions will result in an error code.

The old method to find out which APIs were available on a device was to either query param.cgi for properties, that are associated with a specific API, or to make the API call and see if the call succeeds or not.

Although both of these methods of API identification are viable options, using the API Discovery is preferred since:

Use this example to retrieve information about which APIs are installed on a device, along with API version information references to the complete documentation.

Sending a request through the API discovery service is done through the following HTTP request using a JSON body. Responses are then delivered as JSON data.

Request

Command line example

Response

Use this example to request a list of all available APIs without providing any parameters, which has the same effect as providing the GLOB pattern * for both id and version.

1 a) Request all available APIs with the following request:

1 b) Alternatively, you can also use the following request:

2) Parse the JSON response which includes all properties.

1 a) Request an unspecified number of APIs by applying a GLOB pattern with the following JSON request. For a complete list of supported glob characters, see GLOB patterns

1 b) Alternatively, omit the version parameter.

2) Parse the JSON response which includes selected properties.

If an error occur while processing a request, a JSON response will be returned containing an error code and a detailed message, as seen in Error handling. Searching for an API that is not supported by the device is not considered an error.

1) Request an unsupported API id.

2) The JSON response will contain an empty apiList.

For some operations limited globing is supported. This means that * matches a string and ? matches a character. The GLOB characters will not be listed when a definition describes what characters are allowed as data.

getApiList is used to retrieve all public APIs that is supported by the device.

Request

Return value - Success

Return value - Error

See section Error handling.

getSupportedVersions is used to retrieve supported versions of the API Discovery service on the device. Always backward compatible, getSupportedVersions has the ability to bootstrap the API and version probing. Because of this, the apiVersion must not be provided in the JSON payload. The current version of the API is returned in the response in order to simplify parsing when a device supports a later version. This way, extra fields of the response can be extracted and new methods in the API Discovery service can be used.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

See Error handling.

The following table list the general errors that can occur for a JSON request. Errors that are specific for a method are listed under the API description for that method. Descriptions are only used to describe the type of the error code. Detailed information on the fault will be provided with a message field in the error structure.

Error response body syntax

All failures are returned with the following JSON response.

```
http://myserver/axis-cgi/apidiscovery.cgi
```

```
curl -i -X POST -H "Content-Type: application/json" --anyauth -uroot:pass http://172.25.72.208/axis-cgi/apidiscovery.cgi --data "{ \"method\": \"getSupportedVersions\" }"
```

```
...{ "method": "getSupportedVersions", "data": {"apiVersions": ["1.0"]}}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 1",    "method": "getApiList"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 1",    "method": "getApiList",    "params": {        "id": "*",        "version": "*"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 1",    "method": "getApiList",    "data": {        "apiList": [            {                "id": "api-discovery",                "version": "1.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation."            },            {                "id": "api-discovery",                "version": "2.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation."            },            {                "id": "basic-device-info",                "version": "1.2",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation."            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 2",    "method": "getApiList",    "params": {        "id": "api-discovery",        "version": "*"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 2",    "method": "getApiList",    "params": {        "id": "api-discovery"    }}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID 2",    "method": "getApiList",    "data": {        "apiList": [            {                "id": "api-discovery",                "version": "1.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation"            },            {                "id": "api-discovery",                "version": "2.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "method": "getApiList",    "params": {        "id": "api_unsupported_on_this_device"    }}
```

```
{    "apiVersion": "1.0",    "method": "getApiList",    "data": {        "apiList": []    }}
```

```
http://<servername>/axis-cgi/apidiscovery.cgi
```

```
{    "apiVersion": "<Version of API [A-Za-z0-9_.-]>",    "context": "<ID string>",    "method": "getApiList",    "params": {        "id": "<Id of API [A-Za-z0-9_-]>",        "version": "<Version of API [A-Za-z0-9_.-]>"    }}
```

```
{    "apiVersion": "<Version of API [A-Za-z0-9_.-]>",    "context": "<ID string>",    "method": "getApiList",    "data": {        "apiList": [            {                "id": "api-discovery",                "version": "1.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation"            },            {                "id": "api-discovery",                "version": "2.0",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation"            },            {                "id": "basic-device-info",                "version": "1.2",                "status": "released",                "docLink": "link to doc",                "name": "API name as described in the VAPIX documentation"            }        ]    }}
```

```
http://<servername>/axis-cgi/apidiscovery.cgi
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "<Version of API [A-Za-z0-9_.-]>",    "context": "<string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Versions of API [A-Za-z0-9_.-]>", "<Versions of API [A-Za-z0-9_.-]>"]    }}
```

```
{    "apiVersion": "<Version of the API [A-Za-z0-9_.-]>",    "context": "<ID string>",    "error": {        "code": "<integer error code>",        "message": "<string>"    }}
```

- AXIS OS: 8.50 and later
- Property: Properties.ApiDiscovery.ApiDiscovery="yes"

- it allows the existence of APIs to be filtered on either API id and API version which optimizes the amount of data transferred.
- version information is provided directly (when using param.cgi, special procedures have to be employed to identify presence of an API and its version).

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
| getApiList | Get a list of all public APIs available on the system. |
| getSupportedVersions | Get a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<[A-Za-z0-9_.-]> | Required. The API version that should be used. Does not support globing, since the API version has been specified. |
| context=<ID string> | Optional. The client sets this value and the server echoes the data back in the response. If set, context and the provided string value will be present in the response regardless of whether the response is successful or not in order for the client to match requests and responses. This is especially useful if the client connects to more than one device. |
| method=getApiList | Required. Specifies that the getApiList operation is performed. This retrieves all public APIs on the device. If params.id and/or params.version is provided and the results are filtered based on the values. |
| params.id=<[A-Za-z0-9_-]> | Optional. Provides the API id, that together with version forms a unique id. Supports globing as seen in GLOB patterns. If this parameter is omitted, the API id filter defaults to no filtering, which is the same as the GLOB pattern *. |
| params.version=<[A-Za-z0-9_.-]> | Optional. Provides the API version. Supports globing as seen in GLOB patterns. If this parameter is omitted, the API id filter defaults to no filtering, which is the same as the GLOB pattern *. |
| params | Partly optional. If both params.id and params.version are omitted, there is no need to provide this key. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. Included to simplify JSON response parsing, so the context doesn’t need to be matched to the request. |
| context | Optional. The text string is echoed back in the response if they are provided by the client in the corresponding request. This is useful if several devices are probed. |
| method | The method used to produce the response. Can be used together with apiVersion to simplify JSON response parsing. |
| data.apiList[] | Contains a list of all APIs available on this device. May be empty if a device lacks support for a specifically requested API. |
| data.apiList[].id | The API id, that together with the version forms an unique id. |
| data.apiList[].version | The current API version. |
| data.apiList[].status | The API status. Valid values are released, alpha, beta, deprecated. |
| data.apiList[].docLink | HTTP link to documentation. |
| data.apiList[].name | The name of the API. |

| Parameter | Description |
| --- | --- |
| context=<ID string> | Optional. Client sets this value and the server echoes the data back in the response so that the client can match the request and response. This is useful if the client is trying to connect to several devices. If set, it will be present in the response regardless of whether the response is successful or not. |
| method=getSupportedVersions | Required. Specifies that the getSupportedVersions operation shall be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. Can be used to recognize which fields are present, in order to simplify parsing in future versions where access to data might be required. |
| context | Optional. Text string echoed back if provided by the client in the corresponding request. |
| method | Contains the method in the request. Can be used together with the apiVersion to perform parsing of the request, without keeping track of the context. |
| data.apiVersions | Contains an array of supported versions of the API Discovery service. This method getSupportedVersions does not support version selection in its call. |

| Code | Description |
| --- | --- |
| 1000 | Invalid parameter value specified. |
| 2002 | HTTP request type not supported. Only POST is supported. |
| 2003 | The requested API version is not supported. |
| 2004 | This method is not supported. |
| 4000 | Invalid JSON format. |
| 4002 | Required parameter missing or invalid. |
| 8000 | Internal error. Refer to message field or logs. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that is used. |
| context="<ID string>" | Optional. Text string echoed back if provided by the client in the corresponding request. |
| error.code | Contains error code. This value can be a method specific or a general error code. |
| error.message | Contains a detailed message about the occurred failure. |

