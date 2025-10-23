# Decoder 2

**Source:** https://developer.axis.com/vapix/network-video/decoder2-api/
**Last Updated:** Aug 18, 2025

---

# Decoder 2

## Overview​

### Identification​

### Obsoletes​

### Limitations​

## Use cases​

### Configure live video media source(s)​

### Get available media source configurations​

### Delete media source(s) configuration​

### Display a single view with a single media source​

### Display a single view with multiple media sources​

### Display multiple views with multiple media sources​

### Get sequence configuration​

### List available sequences​

### Delete sequence configuration​

### Stop one sequence and start another one​

### Get the current position in an active sequence​

### Fetch the capabilities of a camera on the network​

### Check if the capabilities can be fetched over an unencrypted connection​

### Enable or disable unsecure connections when fetching capabilities​

### Pause and resume sequence​

### Play a media source and resume a sequence​

### Play the next view in the current sequence​

### Play the previous view in the current sequence​

### Play any view in the current sequence​

### Play any view in any sequence​

### Temporarily play a sequence and then resume the current sequence​

### Stop a media source that is playing as an alarm​

## API Specification - Layout​

### setSequence​

### getSequence​

### listSequence​

### deleteSequence​

## API Specification - Media source​

### setMediaSources​

### getMediaSources​

### deleteMediaSources​

## API Specification - Player​

### playSequence​

### stopSequence​

### pauseSequence​

### resumeSequence​

### playMediaSource​

### stopMediaSource​

### playNextView​

### playPreviousView​

### playView​

### getCurrentPosition​

## API Specification - Capabilities​

### getCameraCapabilities​

### getDecoderCapabilities​

### getUnsecureConnectionAllowed​

### SetUnsecureConnectionAllowed​

## API Specification - Line-out Control​

### setEnabled​

### getEnabled​

## Parameter descriptions​

The VAPIX ® Decoder2 API consist of multiple CGIs' that can be used to query status and configurations on the Axis decoders.

The sequence configuration that can be uploaded will define the view(s) of the decoder. One view will fill the entire screen, but it is possible to split the view into several layouts such as:

These layouts are only examples, and other layouts can be created by through this API.

View configuration
The view is divided into one or more segments. Each segment consists of a pane, a media source (live video, local playback or picture) and the end of the playback action.

Put multiple views together to create a sequence with a run-time measured in seconds. If several views are defined in the sequence, the decoder will switch to the next view when the view time expires and return to the first view when the last view is finished. The decoder will also switch to the next view at the end of a playback if that action is selected.



This API makes the Decoder API obsolete.

This API supports Axis Decoder products released 2023 and later, with AXIS OS version 12.2 or later.

The externalIPDeviceInfoId is required to communicate with the device in a secure way, since the ID makes it possible for the decoder to get the user/password for the device. See External IP Device Information API for additional details.

The externalIPDeviceStreamParameters method makes it possible to configure Axis media sources, such as the resolution, which in this example is set to 1280x720.

http://myserver/axis-cgi/decoder/mediasource.cgi

http://myserver/axis-cgi/decoder/mediasource.cgi

http://myserver/axis-cgi/decoder/layout.cgi

Parse the JSON response to retrieve the sequence ID.

Use playSequence to start the playback.

http://myserver/axis-cgi/decoder/player.cgi

Since it is only a single view it will be played until a stop command is sent.

http://myserver/axis-cgi/decoder/layout.cgi

Parse the JSON response to retrieve the sequence ID.

Start the playback of the sequence with a call to playSequence.

http://myserver/axis-cgi/decoder/player.cgi

Since it is only a single view it will be played until a stop command is sent.

http://myserver/axis-cgi/decoder/layout.cgi

Parse the JSON response to retrieve the sequence ID.

Start the playback of the sequence with a call to playSequence.

http://myserver/axis-cgi/decoder/player.cgi

Since it has multiple views, a view change will be triggered when the duration of each view is reached, until the sequence receives a stop command.

http://myserver/axis-cgi/decoder/layout.cgi

http://myserver/axis-cgi/decoder/layout.cgi

http://myserver/axis-cgi/decoder/layout.cgi

http://myserver/axis-cgi/decoder/layout.cgi

Parse the JSON response to retrieve the sequence ID.

Repeat steps 1-2.

Use playSequence to start the playback of the sequence.

http://myserver/axis-cgi/decoder/player.cgi

Since it is multiple views, a view change will be triggered when the duration is reached until a stop command is sent.

Parse the JSON response to see if the operation was successful.

Use stopSequence to stop the playback.

http://myserver/axis-cgi/decoder/player.cgi

Parse the JSON response to see if the operation was successful.

Use playSequence to start the playback of the next sequence.

http://myserver/axis-cgi/decoder/player.cgi

Since it is multiple views, a view change will be triggered when the duration is reached until a stop command is sent.

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/decodercapabilities.cgi

http://myserver/axis-cgi/decoder/decodercapabilities.cgi

http://myserver/axis-cgi/decoder/decodercapabilities.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

http://myserver/axis-cgi/decoder/player.cgi

This method shall be used to create the sequence configuration. It is possible to configure single/multiple views and multiple media sources in different layouts, depending on the capabilities of the decoder.

Some examples of supported layouts are:

Please note that these layouts are only examples. Other layouts can be created with this API.

The view is divided into one or more segments, each consisting of a pane, media source (live video, local playback or picture) and an end of playback action.
The coordinate system for the view has its origin in the upper left corner (0.0, 0.0). A view is one unit wide and one unit high, which will give the bottom right corner the coordinates 1.0, 1.0 and the center of the view 0.5, 0.5.

The pane describes where the media source should be drawn in a corresponding view and is defined by its left, right, top and bottom in the views coordinate system.
The end of the playback action will determine the behavior of the pane whenever its media source ends, such as reaching the end of a video file.
There are four possible settings for the end of the playback action:

Putting multiple views together will create a sequence with a run time (duration) measured in seconds. If several views are defined in the sequence, the decoder will switch to the next view when a view time expires, or return to the first view when the last one is finished.
The decoder will switch to the next view at the end of a playback if the action triggerNextView is selected.
If view duration is shorter than file duration, the decoder will switch view before finishing the playback by ignoring the end of the playback action. Similarly, if the file duration is shorter than the view duration, the decoder will switch view at the end of a playback by ignoring the view duration.

Request

Create a new or update an existing sequence.

If id is provided and a sequence with that id already exists then the old configuration will be updated. If id is provided and no sequence with that id exists then the configuration will be created with the supplied id.

Create a sequence with a single view and media source

Create a sequence with a single view and multiple media sources

Create a sequence with multiple views and multiple media sources

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Fetch the configuration for a specific sequence.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Fetch the identifiers for all sequence configurations.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Delete a specific sequence configuration.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Create a media sources configuration from one of the following categories:

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Get configuration information for all configured media sources.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Delete one or several media source configuration(s).

Please note that the system will not check if a media source is used when executing this method.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Trigger a sequence playback.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Stop the sequence playback.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Pause the sequence. The current view will continue to play, but will not change to the next view.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Resume the playback for a sequence.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Play a media source during a time specified by this request. This will interrupt the currently playing sequence, which will resume from its previous position when the playback request is finished. It is possible to add several request after each other into a combined view.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Stop a media source that is playing as an alarm. If it is the only media source playing, the original sequence will be resumed.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Play the next view in the currently playing sequence.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Play the previous view in the currently playing sequence.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Play any view in the currently playing sequence.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Get the sequence ID , active view index and played time of the active view.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Fetches the capabilities of the selected Axis camera.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Get the decoder capabilities.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Check if the camera capabilities can be fetched over an unencrypted connection.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Enable or disable unsecure connections when fetching camera capabilities.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Enable or disable audio playback through the line-out port.

Request

Responses

*Successful response

Error response

See Parameter descriptions for a detailed parameter list.

Check if line-out port is enabled or disabled.

Request

Responses

Successful response

Error response

See Parameter descriptions for a detailed parameter list.

setSequence parameters

Request

Response

getSequence parameters

Request

Response

listSequences parameters

Request

Response

deleteSequence parameters

Request

Response

setMediaSources parameters

Request

Response

getMediaSources parameters

Request

Response

deleteMediaSources parameters

Request

Response

playSequence parameters

Request

Response

stopSequence parameters

Request

Response

pauseSequence parameters

Request

Response

resumeSequence parameters

Request

Response

playMediaSource parameters

Request

Response

stopMediaSource parameters

Request

Response

playNextView parameters

Request

Response

playPreviousView parameters

Request

Response

playView parameters

Request

Response

getCurrentPosition parameters

Request

Response

getCameraCapabilities parameters

Request

Response

getDecoderCapabilities parameters

Request

Response

getUnsecureConnectionAllowed parameters

Request

Response

setUnsecureConnectionAllowed parameters

Request

Response

setEnabled parameters

Request

Response

getEnabled parameters

Request

Response

Error response parameters

General error codes

```
{    "apiVersion": "2.0",    "method": "setSequence",    "params": {        "name": "A Sequence Name",        "views": [            {                "duration": 30,                "segments": [                    {                        "mediaSourceId": 0,                        "actionOnPlaybackEnd": "triggerRestartPlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 1,                            "bottom": 1                        }                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "setSequence",    "params": {        "name": "A Sequence Name",        "views": [            {                "duration": 30,                "segments": [                    {                        "mediaSourceId": 0,                        "actionOnPlaybackEnd": "triggerRestartPlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 1,                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 2,                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 5,                        "actionOnPlaybackEnd": "triggerNextView",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "setSequence",    "params": {        "name": "A Sequence Name",        "views": [            {                "duration": 30,                "segments": [                    {                        "mediaSourceId": 0,                        "actionOnPlaybackEnd": "triggerRestartPlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 1,                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 2,                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 5,                        "actionOnPlaybackEnd": "triggerNextView",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            },            {                "duration": 60,                "segments": [                    {                        "mediaSourceId": 4,                        "actionOnPlaybackEnd": "triggerFreezePlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 6,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 7,                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 8,                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            },            {                "duration": 120,                "segments": [                    {                        "mediaSourceId": 9,                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 10,                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 3,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 4,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "setSequence",    "data": {        "id": 0    }}
```

```
{    "apiVersion": "2.0",    "method": "setSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getSequence",    "params": {        "id": 1    }}
```

```
{    "apiVersion": "2.0",    "method": "getSequence",    "data": {        "name": "A Sequence Name",        "views": [            {                "duration": 30,                "segments": [                    {                        "mediaSourceId": 0,                        "actionOnPlaybackEnd": "triggerRestartPlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 1,                        "actionOnPlaybackEnd": "triggerFreeze",                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 2,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 5,                        "actionOnPlaybackEnd": "triggerNextView",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            },            {                "duration": 60,                "segments": [                    {                        "mediaSourceId": 4,                        "actionOnPlaybackEnd": "triggerFreezePlayback",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 6,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 7,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 8,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            },            {                "duration": 120,                "segments": [                    {                        "mediaSourceId": 9,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0,                            "top": 0,                            "right": 0.5,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 10,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0,                            "right": 1,                            "bottom": 0.5                        }                    },                    {                        "mediaSourceId": 3,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0,                            "top": 0.5,                            "right": 0.5,                            "bottom": 1                        }                    },                    {                        "mediaSourceId": 4,                        "actionOnPlaybackEnd": "triggerError",                        "pane": {                            "left": 0.5,                            "top": 0.5,                            "right": 1,                            "bottom": 1                        }                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "getSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "listSequences"}
```

```
{    "apiVersion": "2.0",    "method": "listSequences",    "data": {        "sequences": [            {                "name": "A Sequence Name",                "id": 1,                "duration": 360            },            {                "name": "A Sequence Name 2",                "id": 2,                "duration": 240            },            {                "name": "A Sequence Name 3",                "id": 3,                "duration": 120            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "listSequences",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "deleteSequence",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "2.0",    "method": "deleteSequence",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "deleteSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "setMediaSources",    "params": {        "mediaSources": [            {                "mediaSourceId": 10,                "name": "baker street",                "description": "Camera at baker street",                "hasAudio": false,                "mediaSourceType": "stream",                "stream": {                    "externalIPDeviceInfoId": "1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f8",                    "manufacturer": "com.axis.camera",                    "externalIPDeviceStreamParameters": "camera=1&resolution=1920x1080&fps=25&videocodec=h264"                }            },            {                "mediaSourceId": 12,                "name": "baker street",                "description": "Camera at baker street",                "hasAudio": false,                "mediaSourceType": "stream",                "stream": {                    "externalIPDeviceInfoId": "1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f9",                    "manufacturer": "other",                    "videoUri": "rtsp://192.168.0.90/axis-media/media.amp?camera=1&resolution=1280x720&fps=30&videocodec=h264"                }            },            {                "mediaSourceId": 11,                "name": "media sources 1",                "description": "Description 1",                "hasAudio": false,                "mediaSourceType": "file",                "file": {                    "fileId": "USB/imagename.jpg"                }            }        ]    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "setMediaSources",    "data": {        "ids": [10, 11, 12]    }}
```

```
{    "apiVersion": "2.0",    "method": "setMediaSources",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getMediaSources"}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getMediaSources",    "data": {        "mediaSources": [            {                "mediaSourceId": 10,                "name": "baker street",                "description": "Camera at baker street",                "hasAudio": false,                "mediaSourceType": "stream",                "stream": {                    "externalIPDeviceInfoId": "1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f8",                    "manufacturer": "com.axis.camera",                    "externalIPDeviceStreamParameters": "camera=1&resolution=1920x1080&fps=25&videocodec=h264"                }            },            {                "mediaSourceId": 12,                "name": "baker street",                "description": "Camera at baker street",                "hasAudio": false,                "mediaSourceType": "stream",                "stream": {                    "externalIPDeviceInfoId": "1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f9",                    "manufacturer": "other",                    "videoUri": "rtsp://192.168.0.90/axis-media/media.amp?camera=1&resolution=1280x720&fps=30&videocodec=h264"                }            },            {                "mediaSourceId": 11,                "name": "media sources 1",                "description": "Description 1",                "hasAudio": false,                "mediaSourceType": "file",                "file": {                    "fileId": "USB/imagename.jpg"                }            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "getMediaSources",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "deleteMediaSources",    "params": {        "ids": [0, 10, 11]    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "deleteMediaSources"}
```

```
{    "apiVersion": "2.0",    "method": "deleteMediaSources",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "playSequence",    "params": {        "id": 0,        "viewIndex": 1,        "resumeTimeout": 3600    }}
```

```
{    "apiVersion": "2.0",    "method": "playSequence",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "playSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "stopSequence"}
```

```
{    "apiVersion": "2.0",    "method": "stopSequence",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "stopSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "pauseSequence",    "params": {        "resumeTimeout": 60    }}
```

```
{    "apiVersion": "2.0",    "method": "pauseSequence",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "pauseSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "resumeSequence"}
```

```
{    "apiVersion": "2.0",    "method": "resumeSequence",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "resumeSequence",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playMediaSource",    "params": {        "highResolutionId": 0,        "mediumResolutionId": 1,        "lowResolutionId": 2,        "resumeTimeout": 20,        "priority": "medium",        "combineMediaSources": true    }}
```

```
{    "apiVersion": "2.0",    "method": "playMediaSource",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "playMediaSource",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "stopMediaSource",    "params": {        "highResolutionId": 0    }}
```

```
{    "apiVersion": "2.0",    "method": "stopMediaSource",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "stopMediaSource",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playNextView"}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playNextView"}
```

```
{    "apiVersion": "2.0",    "method": "playNextView",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playPreviousView"}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playPreviousView"}
```

```
{    "apiVersion": "2.0",    "method": "playPreviousView",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playView",    "params": {        "viewIndex": 0    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "playView"}
```

```
{    "apiVersion": "2.0",    "method": "playView",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "method": "getCurrentPosition"}
```

```
{    "apiVersion": "2.0",    "method": "getCurrentPosition",    "data": {        "sequenceId": 1,        "sequenceIndex": 4,        "currentViewTime": 20    }}
```

```
{    "apiVersion": "2.0",    "method": "getCurrentPosition",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getCameraCapabilitiesRequest",    "params": {        "externalIPDeviceInfoId": "1674718420952-92736ff4-6a25-84ba-035f-4285c5744c9c"    }}
```

```
{    "apiVersion": "2.0",    "method": "getCameraCapabilities",    "data": {        "codec": ["h264", "h265"],        "audioSources": [            {                "audioSourceIndex": "0",                "enabled": "yes",                "codec": "aac",                "inputType": "mic",                "name": "Audio"            }        ],        "videoSources": [            {                "imageGroupIndex": "0",                "name": "Camera 1",                "source": "0",                "enabled": "yes",                "maxFPS": "25",                "resolution": ["3840x2160", "1920x1080", "800x600"]            }        ]    }}
```

```
{    "apiVersion": "2.0",    "method": "getCameraCapabilities",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getDecoderCapabilitiesRequest"}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getDecoderCapabilities",    "data": {        "resolutions": [            "3840x2160@30",            "3840x2160@25",            "1920x1080@60",            "1920x1080@50",            "1920x1080@30",            "1920x1080@25",            "1280x720@60",            "1280x720@50"        ],        "maxVPUInstances": 8,        "maxStreams": 9,        "streamingProtocols": ["rtspt", "rtsph", "rtspsh"],        "audioCodingFormats": ["G.711", "G.726", "OPUS", "MP3", "AAC-LC", "WAV", "ADPCM", "LPCM"],        "videoCodingFormats": ["H.264", "H.265"],        "imageCodingFormats": ["jpeg", "png"],        "mediaTypes": ["video/webm", "video/x-matroska", "video/quicktime", "video/mp4", "image/jpeg", "image/png"]    }}
```

```
{    "apiVersion": "2.0",    "method": "getDecoderCapabilities",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getUnsecureConnectionAllowedRequest"}
```

```
{    "apiVersion": "2.0",    "method": "getUnsecureConnectionAllowed",    "data": {        "UnsecureConnectionAllowed": true    }}
```

```
{    "apiVersion": "2.0",    "method": "getUnsecureConnectionAllowed",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "SetUnsecureConnectionAllowedRequest",    "params": {        "UnsecureConnectionAllowed": true    }}
```

```
{    "apiVersion": "2.0",    "method": "setUnsecureConnectionAllowed",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "setUnsecureConnectionAllowed",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "setEnabled",    "params": {        "enabled": true    }}
```

```
{    "apiVersion": "2.0",    "method": "setEnabled",    "data": {}}
```

```
{    "apiVersion": "2.0",    "method": "setEnabled",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "2.0",    "context": "my context",    "method": "getEnabled"}
```

```
{    "apiVersion": "2.0",    "method": "getEnabled",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "2.0",    "method": "getEnabled",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

- 1x1
- 2x2
- 3x3

- The coordinate system for the view has its origin in the upper left corner (0.0, 0.0).
- The view is one unit wide one unit high, which gives the coordinates for the bottom right corner 1.0, 1.0 and the center of the view 0.5, 0.5.
- The end playback action will determine the behavior of the pane whenever its media source ends (such as when the end of a video file is reached).
- The pane describes where the media source should be drawn in the corresponding view and is defined by its left, right, top and bottom in the views coordinate system.

- API Discovery: id=decoder, version=3.0

- Configure a device with a call to create in the External IP Device Information API.
This call will return an externalIPDeviceInfoId that should be used to set new media sources.

- Configure a media source with a call to setMediaSources.
http://myserver/axis-cgi/decoder/mediasource.cgi

- Parse the JSON response to retrieve the media source ID(s).
The media source can now be used in the sequence configuration with the reference to the mediaSourceId.

- Use getMediaSources to get the media source configuration.

- Parse the JSON response the retrieve the media source(s) configuration.

- Use deleteMediaSource to delete a media source configuration.

- Parse the JSON response to see if the operation was successful.

- Use setSequence to create a sequence configuration.

- Parse the JSON response to retrieve the sequence ID.
- Use playSequence to start the playback.

- Parse the JSON response to see if the operation was successful.

- Use setSequence to create a sequence configuration.

- Parse the JSON response to retrieve the sequence ID.
- Start the playback of the sequence with a call to playSequence.

- Parse the JSON response to see if the operation was successful.

- Use setSequence to create a sequence configuration.

- Parse the JSON response to retrieve the sequence ID.
- Start the playback of the sequence with a call to playSequence.

- Parse the JSON response to see if the operation was successful.

- Use getSequence to retrieve a sequence configuration.

- Parse the JSON response to retrieve the sequence configuration.

- Use listSequence to create a list of all sequences.

- Parse the JSON response to retrieve the list of sequence IDs.

- Use deleteSequence to delete a sequence configuration.

- Parse the JSON response to see if the operation was successful.

- Use setSequence to create a sequence configuration.

- Parse the JSON response to retrieve the sequence ID.
- Repeat steps 1-2.
- Use playSequence to start the playback of the sequence.

- Parse the JSON response to see if the operation was successful.
- Use stopSequence to stop the playback.

- Parse the JSON response to see if the operation was successful.
- Use playSequence to start the playback of the next sequence.

- Parse the JSON response to see if the operation was successful.

- Use getCurrentPosition to retrieve the current position.

- Parse the JSON response to retrieve the currently active view.

- Use getCameraCapabilities to fetch the capabilities of a specific Axis camera.

- Parse the JSON response to retrieve the capabilities of the camera.

- Use getUnsecureConnectionAllowed to check if HTTP connections are allowed when communicating with other devices.

- Parse the JSON response to retrieve whether it is possible to use HTTP to communicate with other devices.

- Use setUnsecureConnectionAllowed to enabled or disable HTTP connections.

- Parse the JSON response to verify if the operation did not return an error.

- Use pauseSequence to pause view changes in the current sequence.

- Use resumeSequence to resume view changes in the current sequence.

- Use playMediaSource to play a media source.

- Use resumeSequence to resume the current sequence.

- Use playNextView to play the next view.

- Use playPreviousView to play the previous view.

- Use playView to play a view.

- Use playView to play from a specified view in a sequence.

- Use playView start playing a specific view in a sequence and then return to the current sequence.

- Use stopMediaSource to stop a media source and go back to the previous sequence.

- 1x1
- 2x2
- 3x3

- triggerError: Shows a default error image on the segment instead of the previous media.
- triggerFreezePlayback: Stops media playback and shows the last frame.
- triggerNextView: Switches to the next view or return to the first view if currently on the last view.
- triggerRestartPlayback: Restarts a given media playback from the beginning. Useful when you want to loop media files.

- stream: The substructure stream should be added and configured. This category can also consist of the following alternatives:

axisStream: Used when the device ID refers to an Axis camera. com.axis.camera must be added to manufacturer and be configured with externalIPDeviceStreamParameters.
3rdPartyStream: Used when the device ID refers to a 3rd party camera. other must be added to manufacturer and be configured with videoUri.
- axisStream: Used when the device ID refers to an Axis camera. com.axis.camera must be added to manufacturer and be configured with externalIPDeviceStreamParameters.
- 3rdPartyStream: Used when the device ID refers to a 3rd party camera. other must be added to manufacturer and be configured with videoUri.
- file: The substructure file should be added and configured.

- axisStream: Used when the device ID refers to an Axis camera. com.axis.camera must be added to manufacturer and be configured with externalIPDeviceStreamParameters.
- 3rdPartyStream: Used when the device ID refers to a 3rd party camera. other must be added to manufacturer and be configured with videoUri.

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setSequence" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| id=<integer> |  | The sequence ID. Existing configurations with this ID will be updated.  Minimum: 0  Maximum: 24 |
| name=string |  | The sequence name.  Max length: 64 |
| views |  | Container for the views parameters. |
| duration=<integer> | 10 | The view's duration, measured in seconds (1s to 24h).  Valid values:  Minimum: 1s  Maximum: 86400 (24h).  On single view sequences, duration is ignored. |
| segments |  | Container for the segments parameters. |
| mediaSourceId=<number> | 10 | The media source ID.  Minimum: 0  Maximum: 999 |
| actionOnPlaybackEnd=<string> | triggerFreezePlayback | The behavior of the pane at the playback end. Will default to triggerFreezePlayback if not provided.  Valid values: triggerError  triggerFreezePlayback  triggerNextView  triggerRestartPlayback |
| pane |  | Container for the pane parameters. |
| left=<number> | 0.5 | The coordinates for a pane. Left edge is 0, middle 0.5 and the right one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| right=<number> | 0.5 | The coordinates for a pane. Left edge is 0, middle 0.5 and the right one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| bottom=<number> | 0.5 | The coordinates for a pane. Top edge is 0, middle 0.5 and the bottom one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| top=<number> | 0.5 | The coordinates for a pane. Top edge is 0, middle 0.5 and the bottom one is 1.  Valid values:  Minimum: 0  Maximum: 1 |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setSequence" |  | The requested API method. |
| data |  | Container for the data parameters. |
| id=<integer> |  | The ID of the sequence created or edited in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getSequence" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| id=<integer> |  | The sequence ID. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getSequence" |  | The requested API method. |
| data |  | Container for the data parameters. |
| id=<integer> | 10 | The sequence ID. Existing configurations with this ID are updated.  Valid values:  Minimum: 0  Maximum: 24 |
| name=<string> | Sequence 1 | The sequence name.  Max length: 64 |
| views |  | Container for the views parameters. |
| duration=<integer> | 10 | The view's duration, measured in seconds (1s to 24h).  Valid values:  Minimum: 1s  Maximum: 86400 (24h).  On single view sequences, duration is ignored. |
| segments |  | Container for the segments parameters. |
| mediaSourceId=<number> | 10 | The media source ID.  Minimum: 0  Maximum: 999 |
| actionOnPlaybackEnd=<string> | triggerFreezePlayback | The behavior of the pane at the playback end.  Valid values: triggerError  triggerFreezePlayback  triggerNextView  triggerRestartPlayback |
| pane |  | Container for the pane parameters. |
| left=<number> | 0.5 | The coordinates for a pane. Left edge is 0, middle 0.5 and the right one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| right=<number> | 0.5 | The coordinates for a pane. Left edge is 0, middle 0.5 and the right one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| bottom=<number> | 0.5 | The coordinates for a pane. Top edge is 0, middle 0.5 and the bottom one is 1.  Valid values:  Minimum: 0  Maximum: 1 |
| top=<number> | 0.5 | The coordinates for a pane. Top edge is 0, middle 0.5 and the bottom one is 1.  Valid values:  Minimum: 0  Maximum: 1 |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="listSequences" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="listSequences" |  | The requested API method. |
| data |  | Container for the data parameters. |
| sequences |  | Container for the data parameters. |
| id=<integer> | 10 | The sequence ID. Existing configurations with this ID are updated.  Valid values:  Minimum: 0  Maximum: 24 |
| name=<string> | Sequence 1 | The sequence name.  Max length: 64 |
| duration=<integer> | 10 | The view's duration, measured in seconds (1s to 24h).  Valid values:  Minimum: 1s  Maximum: 86400 (24h).  On single view sequences, duration is ignored. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="deleteSequence" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| id=<integer> |  | The sequence ID. |
| forceSWDecoder=<boolean>  Optional | false | Use software decoding instead of the VPU for this mediasource. When creating a view with more than the maximum VPU instances, extra sources must use software decoding. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="deleteSequence" |  | The requested API method. |
| data |  | Container for the data parameters. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setMediaSources" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| mediaSources |  | Container for the mediaSources parameters. |
| mediaSourceId=<integer> | 10 | The media source ID.  Valid values:  Minimum: 0  Maximum: 999 |
| name=<string> | media sources 1 | The media source name.  Max length: 64. |
| description=<string> | Description 1 | The media source description.  Max length: 250. |
| hasAudio=<boolean> | false | Set to true if audio should be enabled for the media source.  Valid values:  true  false |
| mediaSourceType=<string> | stream | If the media source is a stream, use stream. If the media source is a file, use file. |
| stream |  | Container for the stream parameters. |
| externalIPDeviceInfoId=<string> | 1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f8 | The ID of the external IP device info. |
| manufacturer=<string> | com.axis.camera | Modifies decoder behavior. Non-axis devices must use the value other.  Valid values:  com.axis.camera  other |
| externalIPDeviceStreamParameters=<string> | camera=1&resolution=1920x1080&fps=25&videocodec=h264 | Parameters for the stream. Should only be used when writing com.axis.camera in the decoder. |
| videoUri=<string> | rtsp://192.168.0.90/axis-media/media.amp?camera=1&resolution=1280x720&fps=30&videocodec=h264 | The video URI.  Max length: 255. Only for third party cameras that uses the setting other. |
| file |  | Container for the file parameters. |
| fileId=<string> | USB/imagename.jpg | The media source ID. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setMediaSources" |  | The requested API method. |
| data |  | Container for the data parameters. |
| ids=<integer> |  | The IDs of the media sources that were created. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getMediaSources" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getMediaSources" |  | The requested API method. |
| data |  | Container for the data parameters. |
| mediaSources |  | Container for the mediaSources parameters. |
| mediaSourceId=<integer> | 10 | The media source ID.  Valid values:  Minimum: 0  Maximum: 999 |
| name=<string> | media sources 1 | The media source name.  Max length: 64. |
| description=<string> | Description 1 | The media source description.  Max length: 250. |
| hasAudio=<boolean> | false | Set to true if audio should be enabled for the media source.  Valid values:  true  false |
| mediaSourceType=<string> | stream | If the media source is a stream, use stream. If the media source is a file, use file. |
| stream |  | Container for the stream parameters. |
| externalIPDeviceInfoId=<string> | 1701335688966-dac8ff0a-09de-abfb-83cf-753ad2f760f8 | The ID of the external IP device info. |
| manufacturer=<string> | com.axis.camera | Customizes the code. Non-axis devices must use the value other.  Valid values:  com.axis.camera  com.axis.acs |
| externalIPDeviceStreamParameters=<string> | camera=1&resolution=1920x1080&fps=25&videocodec=h264 | Parameters for the stream. Should only be used when writing com.axis.camera in the decoder. |
| videoUri=<string> | rtsp://192.168.0.90/axis-media/media.amp?camera=1&resolution=1280x720&fps=30&videocodec=h264 | The video URI.  Max length: 255 |
| file |  | Container for the file parameters. |
| fileId=<string> | USB/imagename.jpg | The media source ID. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="deleteMediaSources" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| ids=<integer> | 0 | The ID of the media sources that should be deleted. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="deleteMediaSources" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="playSequence" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| id=<integer> |  | The sequence ID. |
| viewIndex=<integer>  Optional |  | The view index to start playing from. |
| resumeTimeout=<integer>  Optional |  | The number of seconds the new sequence should play before resuming the currently playing sequence. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="playSequence" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="stopSequence" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="stopSequence" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="pauseSequence" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| resumeTimeout=<integer>  Optional |  | Timeout in seconds before resuming the previous sequence. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="pauseSequence" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="resumeSequence" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="resumeSequence" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="playMediaSource" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| highResolutionId=<integer> | 0 | A media source ID that is suited for a single stream. |
| mediumResolutionId=<integer> | 1 | A media source ID that is suited to play alongside half the maximum simultaneous streams. |
| lowResolutionId=<integer> | 2 | A media source ID that is suited to play alongside the maximum simultaneous streams. |
| resumeTimeout=<integer>  Optional | 20 | Resume the timeout in seconds, after which the interrupted sequence will resume. |
| priority=<string> | medium | If more than one media source is requested, priority will tell which one will be played.  Valid values:  high  medium  low |
| combineMediaSources=<boolean> | true | If more than one media source is requested, they can be shown side by side on the view if all requests have combineMediaSource set totrue. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="playMediaSource" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="stopMediaSource" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| highResolutionId=<integer> | 0 | The ID of the media source that should be stopped. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="stopMediaSource" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="playNextView" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="playNextView" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="playPreviousView" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="playPreviousView" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="playView" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| viewIndex=<integer>  Optional | 0 | What index in the currently playing sequence that should be played. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="playView" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getCurrentPosition" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getCurrentPosition" |  | The requested API method. |
| data |  | Container for the data parameters. |
| sequenceId=<integer> | 1 | The sequence ID.  Valid values:  Minimum: 0  Maximum: 24 |
| sequenceIndex=<integer> | 4 | The index for the active view.  Valid values:  Minimum: 0  Maximum: 999 |
| currentViewTime=<integer> | 15 | The amount of time, in seconds, that the active view has been playing. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getCameraCapabilities" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| externalIPDeviceInfoId=<string> | 1674718420952-92736ff4-6a25-84ba-035f-4285c5744c9c | The external IP device info ID. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getCameraCapabilities" |  | The requested API method. |
| data |  | Container for the data parameters. |
| codec=<string> | List [ "h264", "h265" ] | Specifies the compression format used for video encoding.  Valid values:  H.264  H.265 |
| audioSources |  | Container for the audioSources parameters. |
| audioSourceIndex=string | 0 |  |
| enabled=<string> | yes |  |
| codec=<string> | aac |  |
| inputType=<string> | mic |  |
| name=<string> | Audio |  |
| videoSources |  | Container for the videoSources parameters. |
| imageGroupIndex=<string> | 0 |  |
| name=<string> | name0 |  |
| source=<string> | 0 |  |
| enabled=<string> | yes |  |
| maxFPS=<string> | 60 |  |
| resolution=<string> | List [ "720x480", "720x576", "1280x720", "1920x1080" ] |  |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getDecoderCapabilities" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getDecoderCapabilities" |  | The requested API method. |
| data |  | Container for the data parameters. |
| resolutions=<string> | List [ "3840x2160@30", "3840x2160@25", "1920x1080@60", "1920x1080@50", "1920x1080@30", "1920x1080@25", "1280x720@60", "1280x720@50" ] | The list of resolutions supported by the HDMI port. |
| maxstreams=<integer> | 8 |  |
| streamingProtocols=<string> | List [ "rtspt", "rtsph", "rtspsh" ] |  |
| audioCodingFormats=<string> | List [ "G.711", "G.726", "OPUS", "MP3", "AAC-LC", "WAV", "ADPCM", "LPCM" ] |  |
| videoCodingFormats=<string> | List [ "H.264", "H.265" ] |  |
| imageCodingFormats=<string> | List [ "jpeg", "png" ] |  |
| mediaTypes=<string> | List [ "video/webm", "video/x-matroska", "video/quicktime", "video/mp4", "image/jpeg", "image/png" ] |  |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getUnsecureConnectionAllowed" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getUnsecureConnectionAllowed" |  | The requested API method. |
| data |  | Container for the data parameters. |
| UnsecureConnectionAllowed=<boolean> | true | Checks if unsecure connections are allowed.  Valid values:  true  false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setUnsecureConnectionAllowed" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| UnsecureConnectionAllowed=<boolean> |  | Checks if unsecured connections are allowed. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setUnsecureConnectionAllowed" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="setEnabled" |  | The API method that is called in the request. |
| params |  | Container for the params parameters. |
| enabled=<boolean> |  | Sets the line-out port to enabled or disabled. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="setEnabled" |  | The requested API method. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getEnabled" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getEnabled" |  | The requested API method. |
| data |  | Container for the data parameters. |
| enabled=<boolean> | true | Whether the line-out port is enabled or disabled.  Valid values:  true  false |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 2.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method=<string> |  | The requested API method. |
| error.code=<integer> | 1100 | The error code. |
| error.message=<string> | Internal error. | The error message for the corresponding error code. |

| Error code | Description |
| --- | --- |
| 2100 | API version not supported. |
| 2101 | Invalid JSON. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |

