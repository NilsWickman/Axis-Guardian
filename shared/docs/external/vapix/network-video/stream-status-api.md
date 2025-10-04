# Stream status API

**Source:** https://developer.axis.com/vapix/network-video/stream-status-api/
**Last Updated:** Aug 18, 2025

---

# Stream status API

## Description​

### Model​

### Identification​

### Limitations​

## Use cases​

### List all running streams on a device​

## API specification​

### getAllStreams​

### getSupportedVersions​

The Stream status API makes it possible to list streams on a device.

The API implements streamstatus.cgi as its communications interface and supports the following methods:

Request all running streams.

Parse the JSON response that contains all running streams on the device.

See getAllStreams

Use this method to list all running streams on a device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

The API method can be used to retrieve a list of available supported API versions.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

```
http://<servername>/axis-cgi/streamstatus.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getAllStreams"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getAllStreams",    "data": {        "streams": [            {                "destination_address": "192.168.0.1",                "destination_port": 32986,                "direction": "outgoing",                "encrypted": false,                "id": 11,                "media": "video",                "mime": "video/x-h264",                "multicast": false,                "options": {                    "audio": "0",                    "video": "1"                },                "path": "/axis-media/media.amp",                "source_address": "192.168.0.141",                "source_port": 50000,                "state": "playing",                "stream_protocol": "RTP",                "transport_protocol": "UDP",                "user_agent": "GStreamer/1.22.0"            }        ]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getAllStreams",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/streamstatus.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

- API Discovery: id=streamstatus

- Currently, the API can only handle RTSP streams.
- If there is something wrong with the information of a stream, that stream will be excluded from the 200 OK response of the CGI. Additionally an error print will be printed to the syslog.

- Request all running streams.
- Parse the JSON response that contains all running streams on the device.

- Security level:

DigestAuth: Admin
BasicAuth: Admin
- DigestAuth: Admin
- BasicAuth: Admin
- Method: POST

- DigestAuth: Admin
- BasicAuth: Admin

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400, 401, 403, 405, 411, 413, 500
- Content-Type: application/json

- Security level:

DigestAuth: Admin
BasicAuth: Admin
- DigestAuth: Admin
- BasicAuth: Admin
- Method: POST

- DigestAuth: Admin
- BasicAuth: Admin

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400, 401, 403, 405, 411, 413, 500
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getAllStreams | Lists all running streams on a device. |
| getSupportedVersions | Retrieves a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getAllStreams" | The method that should be used. |

| Parameter | Data type | Description |
| --- | --- | --- |
| apiVersion | string | The requested API version in the format "Major.Minor". |
| context | string | The user sets this value and the application echoes it back in the response (optional). |
| method | string | The method that should be used. |
| data | object | Container for streams. |
| streams | array | Array of streams. |
| destination_address | string | The IPv4 or IPv6 address of the client. |
| destination_port | integer | The port of the client. |
| direction | string | Direction of the stream. Enum values: incoming, outgoing |
| encrypted | boolean | Indicates whether the stream is encrypted or not. |
| id | integer | The ID of the stream. It should be one or greater than one. |
| media | string | The media type. Enum values: audio, metadata, video |
| mime | string | The MIME type. Enum values: audio/mpeg, application/x-onvif-metadata+xml, video/x-h264, audio/x-opus, audio/x-adpcm, audio/x-mulaw, audio/x-raw, image/jpeg, video/x-h265 |
| multicast | boolean | Optional. Indicates whether the stream uses multicast or not. |
| options | object | Container for URL options in a stream request. See Public parameter description and Parameter specification RTSP URL. |
| path | string | The server path. |
| source_address | string | The IPv4 or IPv6 address of the server. |
| source_port | integer | The port of the server. |
| state | string | The current state of the streaming pipeline. Enum values: paused, playing |
| stream_protocol | string | The stream protocol that is used. |
| transport_protocol | string | The transport protocol that is used. Enum values: TCP, UDP |
| user_agent | string | Information about the client. |

| Error | Code | Description |
| --- | --- | --- |
| Invalid JSON | 2101 | The request is not in valid Json format. |
| Method not supported | 2102 | The method in the request is not supported. |
| Required parameter missing | 2103 | Some required parameters are missing in the request. |
| Invalid parameter value specified | 2104 | Some parameters have an invalid value. |
| Authentication failed | 2106 | Couldn't authenticate. |
| Transport level error | 2107 | There is an error on the transport level. |
| Internal error | 1100 | There is an internal error. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |
| apiVersions=<list of versions> | Lists all supported major versions along with their highest supported minor version. e.g. ["1.4", "2.5"]. |

| Error | Code | Description |
| --- | --- | --- |
| API version not supported | 2100 | The API version is not supported. |
| Invalid JSON | 2101 | The request is not in valid Json format. |
| Method not supported | 2102 | The method in the request is not supported. |
| Required parameter missing | 2103 | Some required parameters are missing in the request. |
| Invalid parameter value specified | 2104 | Some parameters have an invalid value. |
| Authorization failed | 2105 | Authorization failure. |
| Authentication failed | 2106 | Authentication failure. |
| Transport level error | 2107 | There is an error on the transport level. |
| Internal error | 1100 | There is an internal error. |

