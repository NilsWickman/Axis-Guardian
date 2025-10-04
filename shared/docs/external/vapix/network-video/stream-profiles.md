# Stream profiles

**Source:** https://developer.axis.com/vapix/network-video/stream-profiles/
**Last Updated:** Aug 18, 2025

---

# Stream profiles

## Description​

### Model​

### Identification​

## Common examples​

### Backup and restore stream profiles​

### Configure an existing stream profile​

## API specification​

### list​

### create​

### update​

### remove​

### getSupportedVersions​

### Parameter description​

The Stream profile API makes it possible to create and manage stream profiles suitable for different applications and devices when recording a video or requesting a live video. A stream profile contains a collection of parameters such as video codecs, resolutions, frame rates and compressions, and should be used to retrieve a video stream from your Axis product. Lastly, all parameters that can be used in a video stream request (both HTTP or RTSP) can be saved in a stream profile.

The API implements streamprofile.cgi as its communications interface and supports the following methods:

Use this example to backup all stream profiles currently saved on your device and restore them without having to set each parameters individually later on.

For backup purposes, you will not need to parse or understand the configuration that is returned. What you do remember though is that a backed up configuration can be re-applied to the camera and that this will restore the stream profiles for the configuration as well.

JSON input parameters

Successful response

Use this example to retrieve a stream profile, change some of its values and re-upload it as an updated configuration to the camera. In this example, the FPS of the profile "My full HD profile" is set to 30.

JSON input parameters

Successful response

JSON input parameters

This API method can be used to list the content of a stream profile. It is possible to list either one or multiple profiles and if the parameter streamProfileName is the empty list [] all available stream profiles will be listed.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This API method can be used to add a new stream profile. The name of each stream profile needs to be unique, otherwise, an error will be returned.

Request

Return value - Success

Response body syntax

Please note that successful calls contains an empty data object.

Return value - Error

Response body syntax

This API method can be used to update an already existing stream profile. You can not rename a profile unless you first delete it and create a new one with the required name.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

This API method can be used to remove one or several stream profiles, the latter being possible as long as you provide a list of profile names.

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

The structure of a configuration object is the same in both the data object in the response for list and the params object in the request for create.

The streamProfile object contains information about the stream profile.

The streamProfileName object contains the list of profile names, whose profile needs to be listed.

The maxProfiles parameter defines the maximum number of stream profiles that can be created/supported.

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "list",    "params": {        "streamProfileName": []    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "list",    "data": {        "streamProfile": [            {                "name": "My full HD profile",                "description": "HD profile:1920x1080",                "parameters": "resolution=1920x1080"            },            {                "name": "My inverted image profile",                "description": "The image is inverted",                "parameters": "resolution=640x360&fps=25&rotation=180"            },            {                "name": "My high compression profile",                "description": "Compression is max: low quality",                "parameters": "resolution=1920x1080&compression=100"            }        ],        "maxProfiles": 26    }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "create",    "params": {        "streamProfile": [            {                "name": "My full HD profile",                "description": "HD profile:1920x1080",                "parameters": "resolution=1920x1080"            },            {                "name": "My inverted image profile",                "description": "The image is inverted",                "parameters": "resolution=640x360&fps=25&rotation=180"            },            {                "name": "My high compression profile",                "description": "Compression is max: low quality",                "parameters": "resolution=1920x1080&compression=100"            }        ]    }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "list",    "params": {        "streamProfileName": [            {                "name": "My full HD profile"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "list",    "data": {        "streamProfile": [            {                "name": "My full HD profile",                "description": "HD profile:1920x1080",                "parameters": "resolution=1920x1080"            }        ],        "maxProfiles": 26    }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "update",    "params": {        "streamProfile": [            {                "name": "My full HD profile",                "description": "HD profile:1920x1080 with FPS:30",                "parameters": "resolution=1920x1080&fps=30"            }        ]    }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "list"  "params": {    "streamProfileName": [      {        "name": "My full HD profile"      },      {        "name": "My low resolution"      },      {        ...      }    ]  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "list",  "data": {    "streamProfile": [      {        "name": "My full HD profile",        "description": "HD profile:1920x1080",        "parameters": "resolution=1920x1080"      },      {        ...      },      {        ...      },      {        ...      }    ],    "maxProfiles": 26  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "list",  "error": {    "code": <integer>    "message": <string>  }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "create",  "params": {    "streamProfile": [      {        "name": "My low resolution profile",        "description": "Low resolution:640x360 and FPS:25"        "parameters": "resolution=640x360&FPS=25"      }    ]  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "create",  "data": {}}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "create",  "error": {    "code": <integer>    "message": <string>  }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "update",  "params": {    "streamProfile": [      {        "name": "My low resolution profile",        "description": "Low resolution:640x360 and FPS:30",        "parameters": "resolution=640x360&FPS=30"      }    ]  }}
```

```
{  "apiVersion": "1.0",  "method": "update",  "context": <string>,  "data": {}}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "update",  "error": {    "code": <integer>    "message": <string>  }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "remove",  "params": {    "streamProfileName": [      {        "name": "My full HD profile"      },      {        "name": "XXX"      },      {        ...      }    ]  }}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "remove",  "data": {}}
```

```
{  "apiVersion": "1.0",  "context": <string>,  "method": "remove",  "error": {    "code": <integer>    "message": <string>  }}
```

```
http://<servername>/axis-cgi/streamprofile.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": "1.1",  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "1.1",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

- API Discovery: id=stream-profiles

- Request the current stream profiles.

- Parse the JSON response.

- Restore settings by posting streamProfile[] as params by using the JSON structure from the data received in the previous call.

- Request a stream profile named "My full HD profile".

- Parse the JSON response.

- Upload new settings.

- Security level: Admin, operator, viewer
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

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, operator, viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| list | Lists all available stream profiles. |
| create | Creates a new stream profile. |
| update | Updates an existing stream profile. |
| remove | Removes a stream profile. |
| getSupportedVersions | Retrieves a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="list" | The method that should be used. |
| params | Container for method specific parameters. See Parameter description for a complete list. |

| Error | Code | Description |
| --- | --- | --- |
| Application Error | 1000 | The application failed to return a configuration. |
| Unsupported Version | 2000 | The major version number isn’t supported. |
| Invalid Format | 2001 | The request was not formatted correctly, i.e. does not follow JSON schema. |
| Unsupported Method | 2005 | The method in the request is not supported. |
| Profile does not exist | 2006 | The requested profile does not exist. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="create" | The method that should be used. |
| params | Container for method specific parameters. See Parameter description for a complete list. |

| Error | Code | Description |
| --- | --- | --- |
| Application Error | 1000 | The application failed to set the configuration. |
| Unsupported Version | 2000 | The major version number isn’t supported. |
| Invalid Format | 2001 | The configuration was not formatted correctly, i.e. does not follow JSON-schema. |
| Incoherent Configuration | 2002 | Parts of the configuration contradict each other, e.g. several profiles have the same name. |
| Missing Parameter | 2003 | The request has a missing mandatory parameter. |
| Invalid Parameter | 2004 | The request has parameter that has an invalid value. |
| Unsupported Method | 2005 | The method in the request is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="update" | The method that should be used. |
| params | Container for method specific parameters. See Parameter description for a complete list. |

| Error | Code | Description |
| --- | --- | --- |
| Application Error | 1000 | The application failed to set the configuration. |
| Unsupported Version | 2000 | The major version number isn’t supported. |
| Invalid Format | 2001 | The configuration was not formatted correctly, i.e. does not follow JSON-schema. |
| Missing Parameter | 2003 | The request has a missing mandatory parameter. |
| Invalid Parameter | 2004 | The request has parameter that has an invalid value. |
| Unsupported Method | 2005 | The method in the request is not supported. |
| Profile does not exist | 2006 | The requested profile does not exist. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="remove" | The method that should be used. |
| params | Container for method specific parameters. See Parameter description for a complete list. |

| Error | Code | Description |
| --- | --- | --- |
| Application Error | 1000 | The application failed to set the configuration. |
| Unsupported Version | 2000 | The major version number isn’t supported. |
| Invalid Format | 2001 | The configuration was not formatted correctly, i.e. does not follow JSON-schema. |
| Missing Parameter | 2003 | The request has a missing mandatory parameter. |
| Invalid Parameter | 2004 | The request has parameter that has an invalid value. |
| Unsupported Method | 2005 | The method in the request is not supported. |
| Profile does not exist | 2006 | The requested profile does not exist. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The requested API version in the format "Major.Minor". |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |
| apiVersions=<list of versions> | Lists all supported major versions along with their highest supported minor version. |
| <list of versions> | List of "<Major>.<Minor>" versions, e.g. ["1.4", "2.5"]. |

| Error | Code | Description |
| --- | --- | --- |
| Application Error | 1000 | The application failed to return the supported versions. |
| Unsupported Version | 2000 | The major version number isn’t supported. |
| Invalid Format | 2001 | The request was not formatted correctly, i.e. does not follow JSON-schema. |
| Unsupported Method | 2005 | The method in the request is not supported. |

| Property | Type | Description |
| --- | --- | --- |
| streamProfile.name | String | ASCII string that represents the name of the profile. |
| streamProfile.description | String | ASCII string that describes the stream profile. |
| streamProfile.parameters | String | List of parameters, separated by a &, which defines the stream profile. |

| Argument | Type | Description |
| --- | --- | --- |
| name | String | ASCII string that represents the name of the profile. |

| Property | Type | Description |
| --- | --- | --- |
| maxProfiles | Integer | Maximum number of supported stream profiles. |

