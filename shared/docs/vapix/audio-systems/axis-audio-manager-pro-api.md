# AXIS Audio Manager Pro API

**Source:** https://developer.axis.com/vapix/audio-systems/axis-audio-manager-pro-api/
**Last Updated:** Aug 26, 2025

---

# AXIS Audio Manager Pro API

## Overview​

## Audio sessions​

### List audio sessions​

### Create an audio session​

### Play one shot audio files​

### Delete a specific audio session​

### Retrieve a specific audio session​

### Play audio files​

### Check audio session status​

### Stop audio files​

### Upload audio data​

## Targets​

### List targets​

### Retrieve a specific target​

### Modify a specific target​

## Audio files​

### List audio files​

### Retrieve a specific audio file​

## Volume controllers​

### Get all volume controllers​

### Get a specific volume controller​

### Modify a specific volume controller​

### Modify offset volume of a volume controller​

### Modify the mute state of a volume controller​

## General error responses​

### 400 Invalid parameters​

### 401 Unauthorized​

### 404 Not found​

### 422 Change not allowed​

### 500 Internal server error​

## Websockets​

The VAPIX® AXIS Audio Manager Pro API can be used together with the AXIS Audio Manager Pro software to manage larger and more advanced audio installations. Supported features includes central control, zone management, scheduling, system health monitoring and real time configuration. Using this API makes it possible to make programmatic interactions with an existing Audio Manager Pro installation, including:

Access to the API is enabled in the System settings in the Audio Manager Pro interface. Clients are then able to authenticate using the Digest Authentication method and the username and password specified in the System settings.

Further information on how to use the API is available in the document How To AXIS Audio Manager Pro API, available from AXIS Audio Manager Pro.

The API is divided into the following sections containing their own operations and methods:

This method should be used when you want to retrieve a list of available audio sessions.

Request

AudioSessionHTTP

Successful response

Response body example

AudioSessionRTP

Successful response

Response body example

AudioSessionSIP

Successful response

Response body example

Error responses

This method should be used when you want to create a new audio session. Available types are HTTP, RTP and SIP.

AudioSessionHTTP

Request

Request body example

Successful response

Response body example

AudioSessionRTP

Request

Request body example

Successful response

Response body example

AudioSessionSIP

Request

Request body example

Successful response

Response body example

Error responses

This method should be used when you want to create a temporary audio session and trigger playback for an array of audio files. The audio session is deleted after playback, but can be also be stopped by deleting the audio session returned by the request.

Request

Request body example

Successful response

Response body example

Error responses

This method should be used when you want to delete an existing audio session. Deleting the audio session will also cancel any ongoing audio playback.

Request

Successful response

Error responses

This method should be used when you want to retrieve an existing audio session.

Request

AudioSessionHTTP

Successful response

Response body example

AudioSessionRTP

Successful response

Response body example

AudioSessionSIP

Successful response

Response body example

Error responses

This method should be used when you want to trigger a playback for an array of audio files from the content library. Files listed in the audio session will be played in succession. The current playback will be replaced if this method is used while an audio file is played in the audio session.

Request

Request body example

Successful response

Error responses

This method should be used when you want to check the status of an existing audio session, including playback and availability of devices in the sessions.

This method was introduced in API version 1.1 and can not be used by devices with API version 1.0.

Request

Successful response

Response body example

Error responses

This method should be used when you want to stop playing audio files in the session.

Request

Successful response

Error responses

This method should be used when you want to upload audio data to a specific audio session.

This method was introduced in API version 1.1 and can not be used by devices with API version 1.0.

Request

Error responses

This method should be used when you want to list all available targets, including physical zones and destinations. Targets can be enabled/disabled or be used to define where the audio session should be played.

Request

Successful response

Response body example

Error responses

This method should be used when you want to retrieve a specific target.

Request

Successful response

Response body example

Error responses

This method should be used when you want to modify the settings or properties of a specific target.

Request

Request body example

Successful response

Error responses

This method should be used when you want to list all audio files available on the site. These files are found in the announcement and music library.

Request

Successful response

Response body example

Error responses

This method should be used when you want to retrieve a specific audio file available on the site.

Request

Successful response

Response body example

Error responses

This method should be used when you want to retrieve all available volume controllers. A volume controller can then be used to mute or adjust the audio volume.

Request

Successful response

Response body example

Error responses

This method should be used when you want to retrieve a specific volume controller.

Request

Successful response

Response body example

Error responses

This method should be used when you want to modify a volume controller.

Request

Request body example

Successful response

Error responses

This method should be used when you want to make a volume change relative to the current volume.

Request

Request body example

Successful response

Error responses

This method should be used when you want to switch between mute/unmute states of a target.

Request

Successful response

Error responses

The following error responses can occur for any request independent of their type.

Response body example

Response body example

Response body example

Response body example

Response body example

Websockets will ensure that clients are promptly informed about server-side changes in AXIS Audio Manager Pro. For example, a client will be notified if the volume is changed or when a device starts to play. For detailed integration guidance, refer to STOMP protocol specifications (v 1.0, 1.1 or 1.2 are supported).

Endpoints

Topics

```
https://<servername>/api/v1.1/audioSessions
```

```
{    "holdup": 200,    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "HTTP"}
```

```
{    "codecs": [        {            "audioProfile": "g711aMono8kHz",            "payloadType": 127        }    ],    "encryption": {        "cryptosuite": "AES_CM_128_HMAC_SHA1_80",        "encrypted": false,        "srtpKey": "d0RmdmcmVCspeEc3QGZiNWpVLFJhQX1cfHAwJSoj"    },    "id": "156",    "multicastGroup": "string",    "port": 0,    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "RTP"}
```

```
{    "duplexDevice": {        "id": "dev_15",        "sourceId": "dsc_15"    },    "extention": "3256",    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "SIP"}
```

```
https://<servername>/api/v1.1/audioSessions
```

```
{    "holdup": 200,    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "HTTP"}
```

```
{    "holdup": 200,    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "HTTP"}
```

```
https://<servername>/api/v1.1/audioSessions
```

```
{    "codecs": [        {            "audioProfile": "g711aMono8kHz",            "payloadType": 127        }    ],    "encryption": {        "cryptosuite": "AES_CM_128_HMAC_SHA1_80",        "encrypted": false,        "srtpKey": "d0RmdmcmVCspeEc3QGZiNWpVLFJhQX1cfHAwJSoj"    },    "id": "156",    "multicastGroup": "string",    "port": 0,    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "RTP"}
```

```
{    "codecs": [        {            "audioProfile": "g711aMono8kHz",            "payloadType": 127        }    ],    "encryption": {        "cryptosuite": "AES_CM_128_HMAC_SHA1_80",        "encrypted": false,        "srtpKey": "d0RmdmcmVCspeEc3QGZiNWpVLFJhQX1cfHAwJSoj"    },    "id": "156",    "multicastGroup": "string",    "port": 0,    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "RTP"}
```

```
https://<servername>/api/v1.1/audioSessions
```

```
{    "duplexDevice": {        "id": "dev_15",        "sourceId": "dsc_15"    },    "extention": "3256",    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "SIP"}
```

```
{    "duplexDevice": {        "id": "dev_15",        "sourceId": "dsc_15"    },    "extention": "3256",    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "SIP"}
```

```
https://<servername>/api/v1.1/audioSessions/oneshotPlayAudioFiles
```

```
{    "fileIds": ["15", "19"],    "prio": "HIGH",    "repeat": 1,    "targets": ["zon_1", "dev_15"]}
```

```
[    {        "holdup": 200,        "id": "156",        "prio": "HIGH",        "targets": ["zon_1", "dev_15"],        "type": "HTTP"    }]
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}
```

```
{    "holdup": 200,    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "HTTP"}
```

```
{    "codecs": [        {            "audioProfile": "g711aMono8kHz",            "payloadType": 127        }    ],    "encryption": {        "cryptosuite": "AES_CM_128_HMAC_SHA1_80",        "encrypted": false,        "srtpKey": "d0RmdmcmVCspeEc3QGZiNWpVLFJhQX1cfHAwJSoj"    },    "id": "156",    "multicastGroup": "string",    "port": 0,    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "RTP"}
```

```
{    "duplexDevice": {        "id": "dev_15",        "sourceId": "dsc_15"    },    "extention": "3256",    "id": "156",    "prio": "HIGH",    "targets": ["zon_1", "dev_15"],    "type": "SIP"}
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}/playAudioFiles
```

```
{    "fileIds": ["15", "19"],    "repeat": 1}
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}/status
```

```
{    "availableDevices": ["dev_1", "dev_15"],    "id": "156",    "playbackStarted": "2023-01-12 12:53:32+0100",    "status": "notPlaying",    "unavailableDevices": ["dev_2", "dev_13"]}
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}/stopAudioFiles
```

```
https://<servername>/api/v1.1/audioSessions/{audioSessionId}/upload
```

```
https://<servername>/api/v1.1/targets
```

```
[    {        "children": ["zon_1256", "zon_1257"],        "enabled": true,        "id": "zon_1258",        "niceName": "Zone for first floor",        "sources": [            {                "id": "dev_src_15",                "name": "Line-In"            }        ],        "status": "unmanaged",        "type": "physicalZone"    }]
```

```
https://<servername>/api/v1.1/targets/{targetId}
```

```
[    {        "children": ["zon_1256", "zon_1257"],        "enabled": true,        "id": "zon_1258",        "niceName": "Zone for first floor",        "sources": [            {                "id": "dev_src_15",                "name": "Line-In"            }        ],        "status": "unmanaged",        "type": "physicalZone"    }]
```

```
https://<servername>/api/v1.1/targets/{targetId}
```

```
{    "enabled": true}
```

```
https://<servername>/api/v1.1/audioFiles
```

```
[    {        "id": 156,        "length": 35.613,        "library": "Announcement",        "name": "Closing announcement.mp3",        "path": "/Closing/"    }]
```

```
https://<servername>/api/v1.1/audioFiles/{audioFileId}
```

```
[    {        "id": 156,        "length": 35.613,        "library": "Announcement",        "name": "Closing announcement.mp3",        "path": "/Closing/"    }]
```

```
https://<servername>/api/v1.1/volumeControllers
```

```
[    {        "allowMute": true,        "contentClasses": [            {                "id": "156",                "niceName": "Music"            }        ],        "id": "157",        "maxNegativeVolumeOffset": -80,        "maxPositiveVolumeOffset": 80,        "muted": true,        "niceName": "Music in kitchen",        "targets": ["zon_1", "dev_15"],        "volumeOffset": -5.33    }]
```

```
https://<servername>/api/v1.1/volumeControllers/{volumeControllerId}
```

```
[    {        "allowMute": true,        "contentClasses": [            {                "id": "156",                "niceName": "Music"            }        ],        "id": "157",        "maxNegativeVolumeOffset": -80,        "maxPositiveVolumeOffset": 80,        "muted": true,        "niceName": "Music in kitchen",        "targets": ["zon_1", "dev_15"],        "volumeOffset": -5.33    }]
```

```
https://<servername>/api/v1.1/volumeControllers/{volumeControllerId}
```

```
{    "muted": false,    "volumeOffset": -5.33}
```

```
https://<servername>/api/v1.1/volumeControllers/{volumeControllerId}/offsetVolume
```

```
{    "volumeOffset": 10}
```

```
https://<servername>/api/v1.1/volumeControllers/{volumeControllerId}/toggleMute
```

```
{    "error": {        "code": 400,        "errors": [            {                "location": "string",                "locationType": "DATA_FIELD",                "message": "string",                "reason": "string"            }        ],        "id": "f1a02d76-9b83-437e-8cb4-21016465ea43",        "message": "Unknown priority 'HIGHER'",        "messageKey": "string",        "messageParams": ["string"]    }}
```

```
{    "error": {        "code": 401,        "errors": [            {                "location": "string",                "locationType": "DATA_FIELD",                "message": "string",                "reason": "string"            }        ],        "id": "f1a02d76-9b83-437e-8cb4-21016465ea43",        "message": "Unknown priority 'HIGHER'",        "messageKey": "string",        "messageParams": ["string"]    }}
```

```
{    "error": {        "code": 404,        "errors": [            {                "location": "string",                "locationType": "DATA_FIELD",                "message": "string",                "reason": "string"            }        ],        "id": "f1a02d76-9b83-437e-8cb4-21016465ea43",        "message": "Unknown priority 'HIGHER'",        "messageKey": "string",        "messageParams": ["string"]    }}
```

```
{    "error": {        "code": 422,        "errors": [            {                "location": "string",                "locationType": "DATA_FIELD",                "message": "string",                "reason": "string"            }        ],        "id": "f1a02d76-9b83-437e-8cb4-21016465ea43",        "message": "Unknown priority 'HIGHER'",        "messageKey": "string",        "messageParams": ["string"]    }}
```

```
{    "error": {        "code": 500,        "errors": [            {                "location": "string",                "locationType": "DATA_FIELD",                "message": "string",                "reason": "string"            }        ],        "id": "f1a02d76-9b83-437e-8cb4-21016465ea43",        "message": "Unknown priority 'HIGHER'",        "messageKey": "string",        "messageParams": ["string"]    }}
```

```
wss://<servername>/api/v1.1/notifications
```

```
/topic/audiofiles/topic/audioSessions/topic/targets/topic/volumeControllers
```

- Start/Stop the playback of an audio file.
- Silence either the whole or parts of a site.

- Audio sessions — Plays a live or pre-recorded announcement to either the entire or parts of a site. The session contains a list of designated targets and a priority setting. An audio session can be used one time or saved for future use.
- Targets — Endpoints used to interact with available targets such as physical zones and destinations. Targets can be enabled/disabled or be used to define where audio sessions should be played.
- Audio files — Announcements or music available on the AXIS Audio Manager Pro server. These endpoints can be used to retrieve and list information about them.
- Volume controllers — Offsets the volume of content classes in whole or parts of the audio site. The volume controllers are typically created during installation and setup, where the endpoints are used to interact with already created volume controllers.

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 400 Invalid parameters
- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 400 Invalid parameters
- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: DELETE
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 400 Invalid parameters
- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: POST
- Content-Type: audio/mpeg; codecs="opus"

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: PATCH
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 500 Internal server error

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 500 Internal server error

- Method: PATCH
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 422 Change not allowed
- 500 Internal server error

- Method: POST
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- 401 Unauthorized
- 404 Not found
- 422 Change not allowed
- 500 Internal server error

- HTTP Code: 400 Invalid parameters
- Content-Type: application/json

- HTTP Code: 401 Unauthorized
- Content-Type: application/json

- HTTP Code: 404 Not found
- Content-Type: application/json

- HTTP Code: 422 Change not allowed
- Content-Type: application/json

- HTTP Code: 500 Internal server error
- Content-Type: application/json

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| holdup=<integer> Optional | 200 (default value) |  | The holdup time, measured in ms (milliseconds) of the pre-buffered audio. Defines the latency of the audio session. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | HTTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| codecs |  |  | The codecs for the RTP session. |
| AudioSessionRTPCodec parameters |  |  |  |
| audioProfile=<string> |  | [g711aMono8kHz, g711uMono8kHz, g722Mono16kHz, l16Stereo48kHz, l16Mono48kHz, l16Stereo44kHz, l16Mono44kHz, l16Stereo32kHz, l16Mono32kHz, l16Stereo16kHz, l16Mono16kHz, mp2Stereo48kHz, opusStereo48kHz, opusMono48kHz] | The audio profile. |
| payloadType=<integer> |  | Maximum: 127 Minimum: 0 | The payload type. This is only for codecs supporting the dynamic payload type. |
| encryption |  |  | The encryption for the RTP session. |
| AudioSessionRTPEncryption parameters |  |  |  |
| cryptosuite=<string> |  | [AES_CM_128_HMAC_SHA1_80, AES_CM_128_HMAC_SHA1_32, AES_192_CM_HMAC_SHA1_80, AES_192_CM_HMAC_SHA1_32, AES_256_CM_HMAC_SHA1_80, AES_256_CM_HMAC_SHA1_32, F8_128_HMAC_SHA1_80, SEED_CTR_128_HMAC_SHA1_80, SEED_128_CCM_80, SEED_128_GCM_96, AEAD_AES_128_GCM, AEAD_AES_256_GCM] | The crypto suit algorithm. Required when encrypted is true. |
| encrypted=<boolean> |  | true false (default value) | Set to true if the stream is encrypted with SRTP. Please note that SRTP only works for new streams and not when it has to connect to an existing SRTP stream. |
| srtpKey=<string> | d0RmdmcmVCspeEc3QGZ iNWpVLFJhQX1cfHAwJSoj |  | The SRTP encryption key encoded by Base64. Required when encrypted is true. |
| id=<string> | 156 |  | A unique audio session ID. |
| multicastgroup=<string> |  |  | The IPv4 or IPv6 address of a multicast group. Used in cases where the sender is streaming via multicast. |
| port=<integer> |  |  |  |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | RTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| duplexdevice |  |  | The device with the audio input that will send the audio back. Devices with multiple inputs need a specified sourceId. This parameters can be skipped on devices with only one input. The device must also be in the targets list, which means that it is included in a zone, otherwise no audio will be returned. |
| DeviceWithSource |  |  |  |
| id | dev_15 |  | A unique device ID. |
| sourceId | dsc_15 |  | A unique device source id. |
| extension=<string> | 3256 |  | An extension for dialing. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | SIP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| holdup=<integer> Optional | 200 (default value) |  | The holdup time, measured in ms (milliseconds) of the pre-buffered audio. Defines the latency of the audio session. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | HTTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| holdup=<integer> Optional | 200 (default value) |  | The holdup time, measured in ms (milliseconds) of the pre-buffered audio. Defines the latency of the audio session. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | HTTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| codecs |  |  | The codecs for the RTP session. |
| AudioSessionRTPCodec parameters |  |  |  |
| audioProfile=<string> |  | [g711aMono8kHz, g711uMono8kHz, g722Mono16kHz, l16Stereo48kHz, l16Mono48kHz, l16Stereo44kHz, l16Mono44kHz, l16Stereo32kHz, l16Mono32kHz, l16Stereo16kHz, l16Mono16kHz, mp2Stereo48kHz, opusStereo48kHz, opusMono48kHz] | The audio profile. |
| payloadType=<integer> |  | Maximum: 127 Minimum: 0 | The payload type. This is only for codecs supporting the dynamic payload type. |
| encryption |  |  | The encryption for the RTP session. |
| AudioSessionRTPEncryption parameters |  |  |  |
| cryptosuite=<string> |  | [AES_CM_128_HMAC_SHA1_80, AES_CM_128_HMAC_SHA1_32, AES_192_CM_HMAC_SHA1_80, AES_192_CM_HMAC_SHA1_32, AES_256_CM_HMAC_SHA1_80, AES_256_CM_HMAC_SHA1_32, F8_128_HMAC_SHA1_80, SEED_CTR_128_HMAC_SHA1_80, SEED_128_CCM_80, SEED_128_GCM_96, AEAD_AES_128_GCM, AEAD_AES_256_GCM] | The crypto suit algorithm. Required when encrypted is true. |
| encrypted=<boolean> |  | true false (default value) | Set to true if the stream is encrypted with SRTP. Please note that SRTP only works for new streams and not when it has to connect to an existing SRTP stream. |
| srtpKey=<string> | d0RmdmcmVCspeEc3QGZ iNWpVLFJhQX1cfHAwJSoj |  | The SRTP encryption key encoded by Base64. Required when encrypted is true. |
| id=<string> | 156 |  | A unique audio session ID. |
| multicastgroup=<string> |  |  | The IPv4 or IPv6 address of a multicast group. Used in cases where the sender is streaming via multicast. |
| port=<integer> |  |  |  |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | RTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| codecs |  |  | The codecs for the RTP session. |
| AudioSessionRTPCodec parameters |  |  |  |
| audioProfile=<string> |  | [g711aMono8kHz, g711uMono8kHz, g722Mono16kHz, l16Stereo48kHz, l16Mono48kHz, l16Stereo44kHz, l16Mono44kHz, l16Stereo32kHz, l16Mono32kHz, l16Stereo16kHz, l16Mono16kHz, mp2Stereo48kHz, opusStereo48kHz, opusMono48kHz] | The audio profile. |
| payloadType=<integer> |  | Maximum: 127 Minimum: 0 | The payload type. This is only for codecs supporting the dynamic payload type. |
| encryption |  |  | The encryption for the RTP session. |
| AudioSessionRTPEncryption parameters |  |  |  |
| cryptosuite=<string> |  | [AES_CM_128_HMAC_SHA1_80, AES_CM_128_HMAC_SHA1_32, AES_192_CM_HMAC_SHA1_80, AES_192_CM_HMAC_SHA1_32, AES_256_CM_HMAC_SHA1_80, AES_256_CM_HMAC_SHA1_32, F8_128_HMAC_SHA1_80, SEED_CTR_128_HMAC_SHA1_80, SEED_128_CCM_80, SEED_128_GCM_96, AEAD_AES_128_GCM, AEAD_AES_256_GCM] | The crypto suit algorithm. Required when encrypted is true. |
| encrypted=<boolean> |  | true false (default value) | Set to true if the stream is encrypted with SRTP. Please note that SRTP only works for new streams and not when it has to connect to an existing SRTP stream. |
| srtpKey=<string> | d0RmdmcmVCspeEc3QGZ iNWpVLFJhQX1cfHAwJSoj |  | The SRTP encryption key encoded by Base64. Required when encrypted is true. |
| id=<string> | 156 |  | A unique audio session ID. |
| multicastgroup=<string> |  |  | The IPv4 or IPv6 address of a multicast group. Used in cases where the sender is streaming via multicast. |
| port=<integer> |  |  |  |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | RTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| duplexdevice |  |  | The device with the audio input that will send the audio back. Devices with multiple inputs need a specified sourceId. This parameters can be skipped on devices with only one input. The device must also be in the targets list, which means that it is included in a zone, otherwise no audio will be returned. |
| DeviceWithSource |  |  |  |
| id | dev_15 |  | A unique device ID. |
| sourceId | dsc_15 |  | A unique device source id. |
| extension=<string> | 3256 |  | An extension for dialing. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | SIP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| duplexdevice |  |  | The device with the audio input that will send the audio back. Devices with multiple inputs need a specified sourceId. This parameters can be skipped on devices with only one input. The device must also be in the targets list, which means that it is included in a zone, otherwise no audio will be returned. |
| DeviceWithSource |  |  |  |
| id | dev_15 |  | A unique device ID. |
| sourceId | dsc_15 |  | A unique device source id. |
| extension=<string> | 3256 |  | An extension for dialing. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | SIP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| fileIds=<array> | [ "15", "19" ] |  | The IDs of the audio files that will be played. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| repeat=<integer> |  | 1 (default value) | Indicates the number of times the audio files will be played. |
| targets=<string> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| holdup=<integer> Optional | 200 (default value) |  | The holdup time, measured in ms (milliseconds) of the pre-buffered audio. Defines the latency of the audio session. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | HTTP | The type of the audio session. |

| Parameter | Description |
| --- | --- |
| audioSessionId | The ID of the audio session. |

| Parameter | Description |
| --- | --- |
| audioSessionId | The ID of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| holdup=<integer> Optional | 200 (default value) |  | The holdup time, measured in ms (milliseconds) of the pre-buffered audio. Defines the latency of the audio session. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | HTTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| codecs |  |  | The codecs for the RTP session. |
| AudioSessionRTPCodec parameters |  |  |  |
| audioProfile=<string> |  | [g711aMono8kHz, g711uMono8kHz, g722Mono16kHz, l16Stereo48kHz, l16Mono48kHz, l16Stereo44kHz, l16Mono44kHz, l16Stereo32kHz, l16Mono32kHz, l16Stereo16kHz, l16Mono16kHz, mp2Stereo48kHz, opusStereo48kHz, opusMono48kHz] | The audio profile. |
| payloadType=<integer> |  | Maximum: 127 Minimum: 0 | The payload type. This is only for codecs supporting the dynamic payload type. |
| encryption |  |  | The encryption for the RTP session. |
| AudioSessionRTPEncryption parameters |  |  |  |
| cryptosuite=<string> |  | [AES_CM_128_HMAC_SHA1_80, AES_CM_128_HMAC_SHA1_32, AES_192_CM_HMAC_SHA1_80, AES_192_CM_HMAC_SHA1_32, AES_256_CM_HMAC_SHA1_80, AES_256_CM_HMAC_SHA1_32, F8_128_HMAC_SHA1_80, SEED_CTR_128_HMAC_SHA1_80, SEED_128_CCM_80, SEED_128_GCM_96, AEAD_AES_128_GCM, AEAD_AES_256_GCM] | The crypto suit algorithm. Required when encrypted is true. |
| encrypted=<boolean> |  | true false (default value) | Set to true if the stream is encrypted with SRTP. Please note that SRTP only works for new streams and not when it has to connect to an existing SRTP stream. |
| srtpKey=<string> | d0RmdmcmVCspeEc3QGZ iNWpVLFJhQX1cfHAwJSoj |  | The SRTP encryption key encoded by Base64. Required when encrypted is true. |
| id=<string> | 156 |  | A unique audio session ID. |
| multicastgroup=<string> |  |  | The IPv4 or IPv6 address of a multicast group. Used in cases where the sender is streaming via multicast. |
| port=<integer> |  |  |  |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | RTP | The type of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| duplexdevice |  |  | The device with the audio input that will send the audio back. Devices with multiple inputs need a specified sourceId. This parameters can be skipped on devices with only one input. The device must also be in the targets list, which means that it is included in a zone, otherwise no audio will be returned. |
| DeviceWithSource |  |  |  |
| id | dev_15 |  | A unique device ID. |
| sourceId | dsc_15 |  | A unique device source id. |
| extension=<string> | 3256 |  | An extension for dialing. |
| id=<string> | 156 |  | A unique audio session ID. |
| prio=<string> Optional | "HIGH" | "HIGH" "MEDIUM" "LOW" (default value) | The priority parameter indicates the relative priority of an audio session compared to other playing audio. Sessions with a higher priority will automatically silence audio sessions with a lower priority in the same targets. The first audio session will have higher priority if multiple API audio sessions with the same priority and to the same targets are simultaneously active. The audio session priority levels (high, medium, low) correspond to the paging priority groups in the web interface in Scheduling & Destinations > Content Priorities > Paging. New audio sessions will be placed at the lowest priority in the priority group. |
| targets=<array> | [ "zon_1", "dev_15" ] |  | The targets of the audio session. Accepted types are "physicalZone" and "device". |
| type=<string> |  | SIP | The type of the audio session. |

| Parameter | Description |
| --- | --- |
| audioSessionId=<string> | The ID of the HTTP audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| fileIds=<array> | [ "15", "19" ] |  | The IDs of the audio files that will be played. |
| repeat=<integer> |  | 1 (default value) | Indicates the number of times the audio files will be played. |

| Parameter | Description |
| --- | --- |
| audioSessionId | The ID of the audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| availableDevices=<string> | [ "dev_1", "dev_15" ] |  | A list of devices that successfully received and played the entire announcement. |
| id=<string> | 156 |  | A unique audio session ID. |
| playbackStarted=<string> | 2023-01-12 12:53:32+0100 |  | The time when the audioSession started. |
| status=<string> |  | notPlaying playing | The status of the audioSession. |
| unavailableDevices=<string> | [ "dev_2", "dev_13" ] |  | A list of devices where the announcement is partially or fully out prioritized by a higher priority announcement. |

| Parameter | Description |
| --- | --- |
| audioSessionId=<string> | The ID of the HTTP audio session. |

| Parameter | Description |
| --- | --- |
| audioSessionId=<string> | The ID of the HTTP audio session. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| children=<string> | ["zon_1256","zon_1257" |  | The immediate children of the target. Physical zones: A zone one level deeper in the hierarchy of physical zones. Destinations: A physical zone set as the target for the destination. |
| enabled=<boolean> |  | true false | Indicates if a target should play audio. All mapped sources will be stopped for a destination, but other audio can still play in the destination’s targets. |
| id=<string> | zon_1258 |  | A unique target id. For device targets it is the ID of the sink. |
| niceName=<string> | Zone for the first floor |  | The target nice name. |
| sources=<string> |  |  | The device list for sources available on a device such as Line-in. This part is only applicable for targets of the device type. |
| TargetSource |  |  |  |
| id=<string> | dev_src_15 |  | A unique device source ID. |
| name=<string> | Line-in |  | The name of the source ID. |
| status=<string> | unmanaged | unmanaged online offline playing error: NO_LICENCE error: FACTORY_DEFAULTS error: UNAUTHORIZED error: UNSUPPORTED_HOST_FW error: UNSUPPORTED_TRANSPORT | The status attribute is available only for end devices. Child objects on devices will be empty. |
| type=<string> | physicalZone | physicalZone site device destination | The target type. |

| Parameter | Description |
| --- | --- |
| targetId=<string> | A unique target ID. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| children=<string> | ["zon_1256", "zon_1257" |  | The immediate children of the target. Physical zones: A zone one level deeper in the hierarchy of physical zones. Destinations: A physical zone set as the target for the destination. |
| enabled=<boolean> |  | true false | Indicates if a target should play audio. All mapped sources will be stopped for a destination, but other audio can still play in the destination’s targets. |
| id=<string> | zon_1258 |  | A unique target id. For device targets it is the ID of the sink. |
| niceName=<string> | Zone for the first floor |  | The target nice name. |
| sources=<string> |  |  | The device list for sources available on a device such as Line-in. This part is only applicable for targets of the device type. |
| TargetSource |  |  |  |
| id=<string> | dev_src_15 |  | A unique device source ID. |
| name=<string> | Line-in |  | The name of the source ID. |
| status=<string> | unmanaged | unmanaged online offline playing error: NO_LICENCE error: FACTORY_DEFAULTS error: UNAUTHORIZED error: UNSUPPORTED_HOST_FW error: UNSUPPORTED_TRANSPORT | The status attribute is available only for end devices. Child objects on devices will be empty. |
| type=<string> | physicalZone | physicalZone site device destination | The target type. |

| Parameter | Description |
| --- | --- |
| targetId=<string> | A unique target ID. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| enabled=<boolean> | true | true false | Indicates if the target should play audio. All mapped sources will be stopped for a destination, but other audio clips can still be played in the destination’s target. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| id=<string> | 156 |  | A unique audio file ID. |
| length=<number> | 35.613 |  | The length of the audio file (in seconds). |
| library=<string> | Announcement |  | The library containing the audio file. |
| name=<string> | Closing announcement.mp3 |  | A file name or nicename of the audio file. |
| path=<string> Optional | /Closing/ |  | Folder information of the audio file. |

| Parameter | Description |
| --- | --- |
| audioFileId=<string> | The ID of the audio file that will be retrieved. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| id=<string> | 156 |  | A unique audio file ID. |
| length=<number> | 35.613 |  | The length of the audio file (in seconds). |
| library=<string> | Announcement |  | The library containing the audio file. |
| name=<string> | Closing announcement.mp3 |  | A file name or nicename of the audio file. |
| path=<string> Optional | /Closing/ |  | Folder information of the audio file. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| allowMute=<boolean> |  |  | Controls whether the volume controller can be muted. |
| contentClasses=<array> |  |  | Contains the target content classes. |
| VolumeControllerContentClass |  |  |  |
| id=<string> | 156 |  | A unique content class ID. |
| niceName=<string> | Music |  | Name of the content class. |
| id=<string> | 157 |  | A unique volume controller ID. |
| maxNegativeVolumeOffset=<integer> | -80 | maximum: 100 minimum: -100 | The minimum allowed value of the volume controller. |
| maxPositiveVolumeOffset=<integer> | 80 | maximum: 100 minimum: -100 | The maximum allowed value of the volume controller. |
| muted=<boolean> |  |  | Controls if the volume controller is muted. |
| niceName=<string> | Music in kitchen |  | The name of the volume controller. |
| targets=<string> | ["zon_1", "dev_15" |  | The targets of the volume controller. |
| volumeOffset=<number> | -5.33 | maximum: 100 minimum: -100 | The current volume offset, with ranges between [-100, +100]. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| allowMute=<boolean> |  |  | Controls whether the volume controller can be muted. |
| contentClasses=<array> |  |  | Contains the target content classes. |
| VolumeControllerContentClass |  |  |  |
| id=<string> | 156 |  | A unique content class ID. |
| niceName=<string> | Music |  | Name of the content class. |
| id=<string> | 157 |  | A unique volume controller ID. |
| maxNegativeVolumeOffset=<integer> | -80 | maximum: 100 minimum: -100 | The minimum allowed value of the volume controller. |
| maxPositiveVolumeOffset=<integer> | 80 | maximum: 100 minimum: -100 | The maximum allowed value of the volume controller. |
| muted=<boolean> |  |  | Controls if the volume controller is muted. |
| niceName=<string> | Music in kitchen |  | The name of the volume controller. |
| targets=<string> | ["zon_1", "dev_15" |  | The targets of the volume controller. |
| volumeOffset=<number> | -5.33 | maximum: 100 minimum: -100 | The current volume offset, with ranges between [-100, +100]. |

| Parameter | Description |
| --- | --- |
| volumeControllerId=<string> | A unique target ID. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| muted=<boolean> | true | true false (default) | Mutes all audio of the content types and targets that the volume controller controls. |
| volumeOffset=<number> | -5.33 | maximum: 100 minimum: -100 | The current volume offset, with ranges between [-100, +100]. |

| Parameter | Description |
| --- | --- |
| volumeControllerId=<string> | A unique target ID. |

| Parameter | Example value | Valid values | Description |
| --- | --- | --- | --- |
| volumeOffset=<number> | -5.33 | maximum: 100 minimum: -100 | The requested volume change in relation to the previous value. A negative value will lower the volume. The resulting value will be in the range [-100, +100] or the configured max/min offset of the volume controller. |

| Parameter | Description |
| --- | --- |
| volumeControllerId=<string> | A unique target ID. |

| Parameter | Valid Values | Description |
| --- | --- | --- |
| error |  | Container for the error data. |
| Error data |  |  |
| code=<integer> |  | The error code. |
| errors=<object> |  | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| DetailedErrorData |  |  |
| location=<string> |  | The location of the error (interpretation of its value depends on locationType). |
| locationType=<string> | "DATA_FIELD" "HEADER" "PARAMETER" | Indicates how the location property should be interpreted. |
| message=<string> |  | A human readable text providing more details about the error. |
| reason=<string> |  | Unique identifier for this error. |
| id=<string> |  | A unique identifier for the request. |
| message=<string> |  | A human readable text providing more details about the error. |
| messageKey |  | The key of the error message. Defined by a properties list. |
| messageParams |  | Error related parameters sent in request. |

| Parameter | Valid Values | Description |
| --- | --- | --- |
| error |  | Container for the error data. |
| Error data |  |  |
| code=<integer> |  | The error code. |
| errors=<object> |  | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| DetailedErrorData |  |  |
| location=<string> |  | The location of the error (interpretation of its value depends on locationType). |
| locationType=<string> | "DATA_FIELD" "HEADER" "PARAMETER" | Indicates how the location property should be interpreted. |
| message=<string> |  | A human readable text providing more details about the error. |
| reason=<string> |  | Unique identifier for this error. |
| id=<string> |  | A unique identifier for the request. |
| message=<string> |  | A human readable text providing more details about the error. |
| messageKey |  | The key of the error message. Defined by a properties list. |
| messageParams |  | Error related parameters sent in request. |

| Parameter | Valid Values | Description |
| --- | --- | --- |
| error |  | Container for the error data. |
| Error data |  |  |
| code=<integer> |  | The error code. |
| errors=<object> |  | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| DetailedErrorData |  |  |
| location=<string> |  | The location of the error (interpretation of its value depends on locationType). |
| locationType=<string> | "DATA_FIELD" "HEADER" "PARAMETER" | Indicates how the location property should be interpreted. |
| message=<string> |  | A human readable text providing more details about the error. |
| reason=<string> |  | Unique identifier for this error. |
| id=<string> |  | A unique identifier for the request. |
| message=<string> |  | A human readable text providing more details about the error. |
| messageKey |  | The key of the error message. Defined by a properties list. |
| messageParams |  | Error related parameters sent in request. |

| Parameter | Valid Values | Description |
| --- | --- | --- |
| error |  | Container for the error data. |
| Error data |  |  |
| code=<integer> |  | The error code. |
| errors=<object> |  | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| DetailedErrorData |  |  |
| location=<string> |  | The location of the error (interpretation of its value depends on locationType). |
| locationType=<string> | "DATA_FIELD" "HEADER" "PARAMETER" | Indicates how the location property should be interpreted. |
| message=<string> |  | A human readable text providing more details about the error. |
| reason=<string> |  | Unique identifier for this error. |
| id=<string> |  | A unique identifier for the request. |
| message=<string> |  | A human readable text providing more details about the error. |
| messageKey |  | The key of the error message. Defined by a properties list. |
| messageParams |  | Error related parameters sent in request. |

| Parameter | Valid Values | Description |
| --- | --- | --- |
| error |  | Container for the error data. |
| Error data |  |  |
| code=<integer> |  | The error code. |
| errors=<object> |  | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| DetailedErrorData |  |  |
| location=<string> |  | The location of the error (interpretation of its value depends on locationType). |
| locationType=<string> | "DATA_FIELD" "HEADER" "PARAMETER" | Indicates how the location property should be interpreted. |
| message=<string> |  | A human readable text providing more details about the error. |
| reason=<string> |  | Unique identifier for this error. |
| id=<string> |  | A unique identifier for the request. |
| message=<string> |  | A human readable text providing more details about the error. |
| messageKey |  | The key of the error message. Defined by a properties list. |
| messageParams |  | Error related parameters sent in request. |

