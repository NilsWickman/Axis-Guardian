# Analytics Metadata Producer Configuration

**Source:** https://developer.axis.com/vapix/network-video/analytics-metadata-producer-configuration/
**Last Updated:** Aug 18, 2025

---

# Analytics Metadata Producer Configuration

## Description​

### Model​

### Identification​

## Common examples​

### Configure metadata producers​

### Retrieve supported metadata​

### Retrieve supported API versions​

## API specifications​

### listProducers​

### setEnabledProducers​

### getSupportedMetadata​

### getSupportedVersions​

### General error codes​

The Analytics Metadata Producer Configuration API is an interface for applications and users to look up information about and configure RTSP metadata producers. This includes listing available RTSP metadata producers, enabling/disabling producers on separate video channels or requesting samples of metadata to check the functionality of each individual producer. A producer in this context is a product dependent application running on your device.

This API is currently only designed to be used with single- and dual channel devices. A version with support for devices with more channels might be released in the future.

The API implements analyticsmetadataconfig.cgi as its communications interface and supports the following methods:

These examples will showcase the steps you need to take to list all available metadata producers and configure whether they should be enabled or disabled in the RTSP metadata stream.

Send a request with an empty params to find available RTSP analytics producers.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

Send a request containing an array of producers and which video channels they should enable/disable.

JSON input parameters

Parse the JSON response. The data parameter will be empty if the request is successful.

Successful response example

Error response example

API references

This example will showcase the steps you need to take to retrieve information regarding the RTSP metadata analytics producers and what kind of metadata they can produce. One of reasons you would want to do this is to get an idea about what kind of metadata that can be included in the RTSP stream and request a response from a select number of specific producers.

Send a request.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

This example will showcase the steps you need to take to retrieve all API versions supported by your device.

Send a request.

JSON input parameters

Parse the JSON response

Successful response example

Error response example

API references

This method is used when you wish to list a select number of metadata producers along with their supported video channel and status. Using this method can lead to either one of the following responses:

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

The following error codes are specific for this method. See General error codes for a complete list of potential errors.

This method is used when you wish to enable/disable specific metadata producers and their supported video channels. Please note that not using this method correctly can lead to one of the following responses:

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

The following error codes are specific for this method. See General error codes for a complete list of potential errors.

This method is used when you wish to retrieve a sample frame for a select number of metadata producers. The frame will be compatible with the ONVIF XML metadata format and have one of the following characteristics:

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

The following error codes are specific for this method. See General error codes for a complete list of potential errors.

This method is used when you wish to retrieve a list containing the API versions supported by your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

The following error codes are specific for this method. See General error codes for a complete list of potential errors.

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "data": {        "producers": [            {                "name": "producer",                "niceName": "Producer Name",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "params": {        "producers": [            {                "name": "producer",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "params": {        "producers": ["producer"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "data": {        "producers": [            {                "name": "producer",                "sampleFrameXML": "<tt:Frame></tt:Frame>"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "1.1"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "params": {        "producers": ["producer"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "data": {        "producers": [            {                "name": "producer",                "niceName": "Producer Name",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "listProducers",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "params": {        "producers": [            {                "name": "producer",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "data": {}}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "setEnabledProducers",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "params": {        "producers": ["producer"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "data": {        "producers": [            {                "name": "producer",                "sampleFrameXML": "<tt:Frame></tt:Frame>"            }        ]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getSupportedMetadata",  "error": {    "code": <integer>    "message": <string>  }}
```

```
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "1.0",  "context": "my context",  "method": "getSupportedVersions",  "error": {    "code": <integer>    "message": <string>  }}
```

- API Discovery: id=analytics-metadata-config

- Send a request with an empty params to find available RTSP analytics producers.
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "params": {}}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "data": {        "producers": [            {                "name": "producer",                "niceName": "Producer Name",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
Error response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "listProducers",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}
- Send a request containing an array of producers and which video channels they should enable/disable.
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "params": {        "producers": [            {                "name": "producer",                "videochannels": [                    {                        "channel": 1,                        "enabled": true                    },                    {                        "channel": 2,                        "enabled": false                    }                ]            }        ]    }}
- Parse the JSON response. The data parameter will be empty if the request is successful.
Successful response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "data": {}}
Error response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "setEnabledProducers",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}

- listProducers
- setEnabledProducers

- Send a request.
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "params": {        "producers": ["producer"]    }}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "data": {        "producers": [            {                "name": "producer",                "sampleFrameXML": "<tt:Frame></tt:Frame>"            }        ]    }}
Error response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedMetadata",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}

- getSupportedMetadata

- Send a request.
http://<servername>/axis-cgi/analyticsmetadataconfig.cgi
JSON input parameters
{    "context": "my context",    "method": "getSupportedVersions"}
- Parse the JSON response
Successful response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "1.1"]    }}
Error response example
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "The application failed to handle the request."    }}

- getSupportedVersions

- All available analytics producers will be listed in cases where the parameter producers are absent.
- The response will be successful when the parameter producers are set even if one or more of them doesn’t exist. These producers will not be listed.

- DigestAuth: Admin, Operator, Viewer
- BasicAuth: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- The response will be an error if a video channel that the producer does not support is specified.
- Likewise, an error will be returned if a fault occurred on any of the producer’s channels, meaning that no updates will be applied.

- DigestAuth: Admin, Operator
- BasicAuth: Admin, Operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- All analytics producers will be listed if the parameter producer is absent.
- The response will be successful even if not all parameter producers are set. The missing producers will be omitted from the response.

- DigestAuth: Admin, Operator, Viewer
- BasicAuth: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- DigestAuth: Admin, Operator, Viewer
- BasicAuth: Admin, Operator, Viewer
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| listProducers | Lists either all or a specific number of metadata producers. |
| setEnabledProducers | Enables/disables a specific metadata producer and their supported video channels. |
| getSupportedMetadata | Retrieves a sample frame for either all or a specific number of metadata producers. |
| getSupportedVersions | Retrieves the API versions supported by your device. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | Optional. A text string echoed back in the corresponding response. |
| method | String | Specifies the method. |
| params | Object | Parameters sent to and included in the API call by the method. |
| producers | Array | Container for the producers. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| data | Object | Contains the producer information and their assigned video channels. |
| producers | Array | Container for the producers. |
| name | String | The producer name. |
| niceName | String | Optional. The display friendly name. |
| videochannels | Array | Container for the video channels assigned to the producer. |
| channel | Integer | The name of the video channel. |
| enabled | Boolean | The status of the video channel. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| error | Object | The error object. |
| code | Integer | And error code describing the kind of error. |
| message | String | An error message detailing the error. |

| Code | Description |
| --- | --- |
| 1000 | The application failed to handle the request. |
| 2000 | The major version number isn’t supported. |
| 2001 | The request was not formatted correctly, i.e. does not follow json-schema. |
| 2004 | The request has parameter that has an invalid value. |
| 2005 | The method in the request is not supported. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | Optional. A text string echoed back in the corresponding response. |
| method | String | Specifies the method. |
| params | Object | Parameters sent to and included in the API call by the method. |
| producers | Array | Container for the producers. |
| name | String | The producer name. |
| videochannels | Array | Container for the video channels assigned to the producer. |
| channel | Integer | The name of the video channel. |
| enabled | Boolean | The status of the video channel. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| data | Object | Contains the producer information and their assigned video channels. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| error | Object | The error object. |
| code | Integer | And error code describing the kind of error. |
| message | String | An error message detailing the error. |

| Code | Description |
| --- | --- |
| 1000 | The application failed to handle the request. |
| 2000 | The major version number isn’t supported. |
| 2001 | The request was not formatted correctly, i.e. does not follow json-schema. |
| 2003 | The request has a missing mandatory parameter. |
| 2004 | The request has parameter that has an invalid value. |
| 2005 | The method in the request is not supported. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | Optional. A text string echoed back in the corresponding response. |
| method | String | Specifies the method. |
| params | Object | Parameters sent to and included in the API call by the method. |
| producers | Array | Container for the producers. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| data | Object | Contains the producer information and their assigned video channels. |
| producers | Array | Container for the producers. |
| name | String | The producer name. |
| sampleFrameXML | String | The sample frame associated with the producer. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| error | Object | The error object. |
| code | Integer | And error code describing the kind of error. |
| message | String | An error message detailing the error. |

| Code | Description |
| --- | --- |
| 1000 | The application failed to handle the request. |
| 2000 | The major version number isn’t supported. |
| 2001 | The request was not formatted correctly, i.e. does not follow json-schema. |
| 2004 | The request has parameter that has an invalid value. |
| 2005 | The method in the request is not supported. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | Optional. A text string echoed back in the corresponding response. |
| method | String | Specifies the method. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| data | Object | Contains the producer information and their assigned video channels. |
| apiVersions | Array | Contains the supported API versions in the format "Major.Minor", i.e. 1.4 or 2.1. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version returned from the request. |
| context | String | Optional. The context set by the user in the request. |
| method | String | The requested method. |
| error | Object | The error object. |
| code | Integer | And error code describing the kind of error. |
| message | String | An error message detailing the error. |

| Code | Description |
| --- | --- |
| 1000 | The application failed to handle the request. |
| 2001 | The request was not formatted correctly, i.e. does not follow json-schema. |
| 2005 | The method in the request is not supported. |

| Code | Description |
| --- | --- |
| 1000 | The application failed to handle the request. |
| 2000 | The major version number isn’t supported. |
| 2001 | The request was not formatted correctly, i.e. does not follow json-schema. |
| 2003 | The request has a missing mandatory parameter. |
| 2004 | The request has parameter that has an invalid value. |
| 2005 | The method in the request is not supported. |

