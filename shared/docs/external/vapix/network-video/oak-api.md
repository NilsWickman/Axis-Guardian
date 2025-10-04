# OAK API

**Source:** https://developer.axis.com/vapix/network-video/oak-api/
**Last Updated:** Aug 18, 2025

---

# OAK API

## Description​

### Model​

### Identification​

## Common examples​

### Retrieve OAK​

## API specifications​

### getOAK​

### getSupportedVersions​

### Error handling​

The OAK (Owner Authentication Key) API makes it possible to retrieve the OAK from an Axis device and authenticate its owner towards the AXIS O3C Dispatcher service.

Please note that this operation requires unhindered internet access from the device, i.e. involving a proxy server will cause the OAK retrieval to fail.

The API implements oak.cgi as its communications interface and supports the following methods:

Use this example to retrieve the owner authentication key to register your device. This operation requires unhindered internet access from your device, i.e. involving a proxy server will cause the OAK retrieval to fail.

JSON input parameters

Successful response

API references

This API method is used to retrieve the owner authentication key. Please note that this operation requires unhindered internet access from your device, i.e. involving a proxy server will cause the OAK retrieval to fail and the error response 1100 - Internal error will be returned.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

No specific failure exist for this method. See Error handling for a full list of potential error codes and general errors.

This API method is used to retrieve a list of supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

No specific failure exist for this method. See Error handling for a full list of potential error codes and general errors.

The following table lists the general errors that can occur for any of the JSON requests.

Error response body syntax

All potential failures will return with the following JSON response.

```
http://<servername>/axis-cgi/oak.cgi
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getOAK"}
```

```
{    "apiVersion": "1.0",    "context": "Client defined request ID",    "method": "getOAK",    "data": {        "oak": "OAK"    }}
```

```
http://<servername>/axis-cgi/oak.cgi
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "getOAK"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "getOAK",    "data": {        "oak": "<oak string>"    }}
```

```
http://<servername>/axis-cgi/oak.cgi
```

```
{    "context": "<ID string>",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "<Major>.<Minor>",    "context": "<ID string>",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": "<ID string>",  "method": "<method string>",  "error": {    "code": <integer error code>,    "message": "<string>"  }}
```

- API Discovery: id=oak

- Request the OAK with the following JSON request:

- Parse the JSON response.

- getOAK

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

| Method | Description |
| --- | --- |
| getOAK | Retrieves the product specific OAK. |
| getSupportedVersions | Retrieves the API version supported by your device. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used in the request. |
| context=<ID string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getOAK" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<ID string> | The context that was used when the request was made (optional). |
| method="getOAK" | The operation that was performed. |
| data.oak | The owner authentication key. |

| Parameter | Description |
| --- | --- |
| context=<ID string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The operation that should be performed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used. |
| context | The context that was used when the request was made (optional). |
| method="getSupportedVersions" | The operation that was performed. |
| data.apiVersions | An array containing the supported versions. |
| data.apiVersions[]=<list of versions> | Lists all supported major versions along with their highest supported minor version. |
| <list of versions> | The list of "<Major>.<Minor>" versions, e.g. ["1.0"]. |

| Code | Description |
| --- | --- |
| 1100 | Internal error. |
| 2000 | Invalid request. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON data. |
| 2102 | Method does not exist. |
| 2103 | Missing parameter method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context | The context that was used when the request was made (optional). |
| method | The operation that was performed. |
| error.code | Container for the error code. |
| error.message | Container for the message about the occurred failure. |

