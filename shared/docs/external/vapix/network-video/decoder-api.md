# Decoder API

**Source:** https://developer.axis.com/vapix/network-video/decoder-api/
**Last Updated:** Aug 21, 2025

---

# Decoder API

## Description​

### Model​

### Identification​

### Obsoletes​

### Limitations​

## Common examples​

### Display a single video stream​

### Display multiple video streams​

### Display multiple video streams in a sequence​

### Get decoder capabilities​

### Retrieve running configuration​

## API specification​

### getCapabilities​

### getSupportedVersions​

### getViewConfiguration​

### setViewConfiguration​

## General event codes​

The Network video decoder gives the user the ability to control the content displayed on the decoder. This API is focused on the view configuration, in which a view describes the layout of the screen that the decoder is connected to. The view is configured when it is about to be displayed, meaning that there isn’t any need to configure each video source prior to displaying them.

The VAPIX® Decoder API methods

The API consists of the single CGI decoder.cgi and can be called with a JSON body using HTTP POST. The JSON body contains information about which method that should be invoked and supplies the parameters for that method.

The different methods will allow a client application to:

The configuration that is uploaded with the CGI defines the view of the decoder. One view fills the entire screen. If several views are defined, then the decoder will loop through them in a sequence.

View configuration

The view is divided into one or more segments. Each segment consists of a pane and a video stream (panel-within-a-panel). The pane describes where the video stream should be drawn in the view. Putting multiple views together creates a sequence, with a run-time (duration), which is measured in seconds.

The coordinate system for the view has its origin in the upper left corner. The view is one unit wide and one unit high giving the coordinates for the bottom right corner 1, 1 and the center of the view 0.5, 0.5.



/axis-cgi/alarm.cgi

/axis-cgi/videocontrol.cgi

Use this example to define what video should be displayed on the decoder.

Set up the view configuration.

JSON input parameters

Parse the JSON response to retrieve the configuration ID.

a. Successful response example.

b. Failure response example.

For further instructions, see setViewConfiguration.

Use this example to monitor all the cameras in, for example, a store, from a screen.

Configure the view

JSON input parameters

Parse the JSON response to retrieve the configuration ID.

a. Successful response example.

b. Failure response example.

For further instructions, see setViewConfiguration.

Use this example to watch videos from several camera sources, some of which can be viewed at the same time.

Configure the view by calling:

The time must be set in seconds for the duration parameter to work.

JSON input parameters

Parse the JSON response to retrieve the configuration ID.

a. Success response example.

b. Failure response example.

For further instructions, see setViewConfiguration.

Use this example to check what is supported on the decoder.

Get the capabilities by calling:

JSON input parameters

Parse the JSON response to retrieve the capabilities.

a. Successful response example.

The resolution in this the response refers to the decoder resolution setting that is currently in use.

For further instructions, see getCapabilities.

Use this example to receive status information on a configuration after restarting the video stream and whether the configuration is still in use.

Get the running configuration by calling:

JSON input parameters

A successful request returns the ID of the active configuration.

a. Successful response example.

For further instructions, see getViewConfiguration.

List all the capabilities that the decoder supports.

Capabilities table

Request

The following table lists the JSON parameters for this CGI method.

getCapabilities parameters table

Return value - Success

Returns the decoder capabilities.

Response body syntax

Error information

The method can return the following errors:

Error codes

See General event codes for more information.

A CGI method for retrieving the supported API versions. The returned lists consists of the supported major versions, together with the highest supported minor versions. Note that the version is for the API as a whole, i.e. for all methods in the CGI.

Request

The following table lists the JSON parameters for this CGI method.

getSupportedVersions data parameters table

Return value - Success

Return value - Failure

Response body syntax

Error information

The method could return the following errors:

Error codes

See General event codes for more information.

Request

The following table lists the JSON parameters for this CGI method.

getViewConfiguration parameters table

Return value - Success

Returns the ID of the currently running configuration.

Error information

The method could return the following errors:

Error codes

See General event codes for more information.

This method sets the configuration of the current view. The decoder will only have one running configuration. The current configuration will be overwritten in the next successful call to setViewConfiguration. The running configuration is saved on the decoder so that it is able to recover after a restart.

Camera credentials are not encrypted. Consider using HTTPS for increased security.

Request

The following table lists the JSON parameters for this CGI method.

setViewConfiguration parameters table

Return value - Success

Returns the ID of the newly created configuration.

Response body syntax

Return value - Failure

Returns an array of errors. The errors are in the same format as the events in the event stream.

Response body syntax

The decoder could choose to use the provided configuration if the errors are not serious enough, and will then also return the new configuration ID. This could be if the configuration contains several video streams and the decoder can’t connect to one or more of them. The decoder will try to reconnect to all of the video sources, and if the information provided by the software is correct it will eventually be able to connect. In this case it is up to the software to choose if it should re-send a new configuration or continue with the current configuration.

Response body syntax

Error information

The method could return the following errors:

Event method codes

See General event codes for more information.

There are two types of events in the API: base- and stream-events and are currently only sent as errors. The base event gives general information about the request and decoder status. The stream event will give specific information regarding a certain video stream.

The events are specified as follows:

Event status code ranges

The following table lists general event codes that can occur for any CGI method. Events that are specific for a method are listed under the API description for that method. The message field will in some cases contain data instead of a message, these events are specified in the following table as well. Title may be used as a message in all the other cases.

General event codes

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1920x1080",                "videoCodec": "H264",                "audioCodec": "",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 0,                "segments": [                    {                        "stream": 0,                        "pane": 0                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 200,            "message": "Internal error"        }    ]}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 0.5,                "bottom": 0.5            },            {                "paneId": 1,                "left": 0.5,                "top": 0.0,                "right": 1.0,                "bottom": 0.5            },            {                "paneId": 2,                "left": 0.0,                "top": 0.5,                "right": 0.5,                "bottom": 1.0            },            {                "paneId": 3,                "left": 0.5,                "top": 0.5,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "audioCodec": "AAC",                "username": "viewer",                "password": "pass"            },            {                "streamId": 1,                "url": "rtsp://192.168.0.91/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 2,                "url": "rtsp://192.168.0.92/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 3,                "url": "rtsp://192.168.0.93/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 0,                "segments": [                    {                        "stream": 0,                        "pane": 0                    },                    {                        "stream": 1,                        "pane": 1                    },                    {                        "stream": 2,                        "pane": 2                    },                    {                        "stream": 3,                        "pane": 3                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 400,            "message": "Failed to connect",            "viewId": 0,            "streamId": 2        },        {            "code": 100,            "message": "15"        }    ]}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 0.5,                "bottom": 0.5            },            {                "paneId": 1,                "left": 0.5,                "top": 0.0,                "right": 1.0,                "bottom": 0.5            },            {                "paneId": 2,                "left": 0.0,                "top": 0.5,                "right": 0.5,                "bottom": 1.0            },            {                "paneId": 3,                "left": 0.5,                "top": 0.5,                "right": 1.0,                "bottom": 1.0            },            {                "paneId": 4,                "left": 0.0,                "top": 0.0,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 1,                "url": "rtsp://192.168.0.91/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 2,                "url": "rtsp://192.168.0.92/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 3,                "url": "rtsp://192.168.0.93/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 4,                "url": "rtsp://192.168.0.94/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 60,                "segments": [                    {                        "stream": 0,                        "pane": 0                    },                    {                        "stream": 1,                        "pane": 1                    },                    {                        "stream": 2,                        "pane": 2                    },                    {                        "stream": 3,                        "pane": 3                    }                ]            },            {                "viewId": 1,                "duration": 60,                "segments": [                    {                        "stream": 4,                        "pane": 4                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 200,            "message": "Internal error"        }    ]}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities",    "data": {        "resolution": "1920x1080",        "maxStreams": 16,        "videoCodecs": ["H.264", "MJPEG", "MPEG4"],        "audioCodecs": [],        "overlappingPanes": false    }}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getViewConfiguration"}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getViewConfiguration",    "data": {        "configurationId": "23"    }}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{  "apiVersion": "1.0",  "context": "123",  "method": "getCapabilities",  "data": {    "resolution": resolution,    "maxStreams": maxStreams,    "videoCodecs": [videoCodecs],    "audioCodecs": [audioCodecs],    "overlappingPanes": true/false  }}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": [        {            "code": 200,            "message": "Internal error"        }    ]}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getViewConfiguration",    "data": {        "configurationId": "23"    }}
```

```
http://myserver/axis-cgi/decoder.cgi
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 200,            "message": "Internal error"        }    ]}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 400,            "message": "Failed to connect",            "viewId": 0,            "streamId": 2        },        {            "code": 100,            "message": "15"        }    ]}
```

```
{    "code": {        "type": "integer",        "minimum": 0    },    "message": {        "type": "string"    }}
```

```
{    "code": {        "type": "integer",        "minimum": 0    },    "message": {        "type": "string"    },    "viewId": {        "type": "integer",        "minimum": 0    },    "streamId": {        "type": "integer",        "minimum": 0    }}
```

- query what capabilities the decoder has and what versions of the API that is supported.
- get and set the configuration.

- Property: Properties.API.Decoder.Decoder=yes
- Product category: Network Video Decoder

- This API does not support sequences if they are in a split view.
- This API supports Vapix 3 cameras only.
- This API does not support the P7701 decoder.

- Set up the view configuration.
http://myserver/axis-cgi/decoder.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1920x1080",                "videoCodec": "H264",                "audioCodec": "",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 0,                "segments": [                    {                        "stream": 0,                        "pane": 0                    }                ]            }        ]    }}
- Parse the JSON response to retrieve the configuration ID.
a. Successful response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 200,            "message": "Internal error"        }    ]}

- Configure the view
http://myserver/axis-cgi/decoder.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 0.5,                "bottom": 0.5            },            {                "paneId": 1,                "left": 0.5,                "top": 0.0,                "right": 1.0,                "bottom": 0.5            },            {                "paneId": 2,                "left": 0.0,                "top": 0.5,                "right": 0.5,                "bottom": 1.0            },            {                "paneId": 3,                "left": 0.5,                "top": 0.5,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "audioCodec": "AAC",                "username": "viewer",                "password": "pass"            },            {                "streamId": 1,                "url": "rtsp://192.168.0.91/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 2,                "url": "rtsp://192.168.0.92/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 3,                "url": "rtsp://192.168.0.93/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 0,                "segments": [                    {                        "stream": 0,                        "pane": 0                    },                    {                        "stream": 1,                        "pane": 1                    },                    {                        "stream": 2,                        "pane": 2                    },                    {                        "stream": 3,                        "pane": 3                    }                ]            }        ]    }}
- Parse the JSON response to retrieve the configuration ID.
a. Successful response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 400,            "message": "Failed to connect",            "viewId": 0,            "streamId": 2        },        {            "code": 100,            "message": "15"        }    ]}

- Configure the view by calling:
http://myserver/axis-cgi/decoder.cgi
infoThe time must be set in seconds for the duration parameter to work.
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "params": {        "panes": [            {                "paneId": 0,                "left": 0.0,                "top": 0.0,                "right": 0.5,                "bottom": 0.5            },            {                "paneId": 1,                "left": 0.5,                "top": 0.0,                "right": 1.0,                "bottom": 0.5            },            {                "paneId": 2,                "left": 0.0,                "top": 0.5,                "right": 0.5,                "bottom": 1.0            },            {                "paneId": 3,                "left": 0.5,                "top": 0.5,                "right": 1.0,                "bottom": 1.0            },            {                "paneId": 4,                "left": 0.0,                "top": 0.0,                "right": 1.0,                "bottom": 1.0            }        ],        "streams": [            {                "streamId": 0,                "url": "rtsp://192.168.0.90/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 1,                "url": "rtsp://192.168.0.91/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 2,                "url": "rtsp://192.168.0.92/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 3,                "url": "rtsp://192.168.0.93/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            },            {                "streamId": 4,                "url": "rtsp://192.168.0.94/axis-media/media.amp?resolution=1280x720...",                "videoCodec": "H264",                "username": "viewer",                "password": "pass"            }        ],        "views": [            {                "viewId": 0,                "duration": 60,                "segments": [                    {                        "stream": 0,                        "pane": 0                    },                    {                        "stream": 1,                        "pane": 1                    },                    {                        "stream": 2,                        "pane": 2                    },                    {                        "stream": 3,                        "pane": 3                    }                ]            },            {                "viewId": 1,                "duration": 60,                "segments": [                    {                        "stream": 4,                        "pane": 4                    }                ]            }        ]    }}
- Parse the JSON response to retrieve the configuration ID.
a. Success response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "data": {        "configurationId": "1042"    }}
b. Failure response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "setViewConfiguration",    "errors": [        {            "code": 200,            "message": "Internal error"        }    ]}

- Get the capabilities by calling:
http://myserver/axis-cgi/decoder.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities"}
- Parse the JSON response to retrieve the capabilities.
a. Successful response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities",    "data": {        "resolution": "1920x1080",        "maxStreams": 16,        "videoCodecs": ["H.264", "MJPEG", "MPEG4"],        "audioCodecs": [],        "overlappingPanes": false    }}
infoThe resolution in this the response refers to the decoder resolution setting that is currently in use.

- Get the running configuration by calling:
http://myserver/axis-cgi/decoder.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "123",    "method": "getViewConfiguration"}
- A successful request returns the ID of the active configuration.
a. Successful response example.
{    "apiVersion": "1.0",    "context": "123",    "method": "getViewConfiguration",    "data": {        "configurationId": "23"    }}

- Security level: Operator
- Method: POST

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

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Usage |
| --- | --- |
| getCapabilities | Show what the decoder is capable of. |
| getSupportedVersions | Get a list of supported API versions. |
| getViewConfiguration | Get the current configuration. |
| setViewConfiguration | Configure what the decoder shall display. |

| Field | Possible values | Description |
| --- | --- | --- |
| resolution | 1920x1080, 1280x720, 720x480, 640x480 | One of the supported resolutions for the decoder and the one currently in use. |
| maxStreams | 1, ... | The maximum supported amount of open video streams. |
| videoCodecs | H264, MPEG4, MJPEG | List of video codecs supported by the decoder. |
| audioCodecs | AAC, G711, G726 | List of video codecs supported by the decoder. |
| overlappingPanes | true, false | Whether the decoder supports overlapping panes in a picture in picture feature or not. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the cgi echoes it back in the response. |
| method | String | The operation to perform. |

| Code | Title |
| --- | --- |
| 200 | Internal error. |
| 201 | Unsupported API version. |
| 202 | Invalid JSON. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the CGI echoes it back in the response. |
| method | String | The operation to perform. |

| Code | Title |
| --- | --- |
| 200 | Internal error. |
| 201 | Unsupported API version. |
| 202 | Invalid JSON. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the CGI echoes it back in the response. |
| method | String | The operation to perform. |

| Code | Title |
| --- | --- |
| 200 | Internal error. |
| 201 | Unsupported API version. |
| 202 | Invalid JSON. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the CGI echoes it back in the response. |
| method | String | The operation to perform. |
| params | JSON Object | Container for the method specific parameters listed below. |
| panes | Array | A pane is a canvas on which a video stream is drawn upon. The pane object contains size and position for where the video stream should be drawn on the view. The video stream should always keep its own aspect ratio when drawn on a pane. The coordinate for the upper left corner of the view is 0,0 and the coordinate for the bottom right corner is 1,1. |
| streams | Array | The stream object contains the necessary information about the video stream. Each stream must have a url that specifies where the decoder can reach the video, and which video codec the decoder should use. Should the camera require a login, then the username and password credentials must be provided. If the decoder supports audio then one of the streams may have the audioCodec parameter set. The audioCodec parameter is empty by default. |
| views | Array | The view is the model of the entire screen area. The coordinate system of a view is one unit wide and one unit high. The origin is located in the upper left corner, the lower right corner has the coordinate 1,1. A configuration can contain several views, i.e. screen areas consisting of several view areas. In the case that the views are displayed in a sequence, each view is displayed for the amount of seconds stated in the duration parameter. If the duration is set to 0, then the view will be displayed continuously. The view is divided into segments that could either fit the whole view, or just a part of it. One pane object and one stream object will together form a view segment. |
| duration | Array | The duration object contains the run time of a sequence, measured in seconds. If the value is set to 0, only the current view will be shown. |

| Code | Title |
| --- | --- |
| 100 | Configuration changed. |
| 200 | Internal error. |
| 201 | Unsupported API version. |
| 202 | Invalid JSON. |
| 210 | Illegal view ID. |
| 211 | Illegal pane ID. |
| 212 | Pane out of bound. |
| 400 | Failed to connect. |
| 401 | Not authenticated. |
| 402 | Out of resources. |
| 403 | Unsupported protocol. |
| 410 | Illegal stream ID. |

| Code | Type |
| --- | --- |
| 1xx | Information. |
| 2xx | Error. |
| 3xx | Reserved for stream information. |
| 4xx | Stream error. |

| Code | Title | Message | Description |
| --- | --- | --- | --- |
| 100 | Configuration changed | Configuration ID | The configuration has been changed. The ID of the new configuration is provided in the message field. |
| 200 | Internal error |  | Generic error. |
| 201 | Unsupported API version |  | The decoder does not support the API version provided in the request. |
| 202 | Invalid JSON |  | The decoder could not parse the provided JSON object. |
| 210 | Illegal view ID |  | ID is either a duplicate or not a positive integer. |
| 211 | Illegal pane ID |  | ID is either a duplicate or not a positive integer. |
| 212 | Pane out of bound | Pane ID | Parts of the pane are outside of the view. |
| 213 | Overlapping pane | Pane ID | The pane is overlapping another pane and the decoder does not support picture-in-picture (overlappingPanes=false in getCapabilities). |
| 400 | Failed to connect |  | The decoder could not connect to the streaming device. |
| 401 | Not authenticated |  | The provided credentials were not accepted. |
| 402 | Out of resources |  | Generic error when the decoder does not have enough resources to render the provided configuration. |
| 403 | Unsupported protocol |  | The decoder is not able to play the video or audio provided in the configuration. |
| 410 | Illegal stream ID |  | ID is either a duplicate or not a positive integer. |

