# Audio Device Control

**Source:** https://developer.axis.com/vapix/audio-systems/audio-device-control/
**Last Updated:** Aug 18, 2025

---

# Audio Device Control

## Overview​

### Identification​

### Obsoletes​

## Common examples​

### Retrieve audio capabilities​

### Retrieve current device settings​

### Change device settings​

### Retrieve hazardous settings​

### Get supported versions​

## API specification​

### getDevicesCapabilities​

### getDevicesSettings​

### setDevicesSettings​

### getHazardousSettings​

### getSupportedVersions​

### General error codes​

The VAPIX® Audio Device Control API contains the information required to configure and control your audio devices in various ways, including:

The API is based around audio devices with inputs and outputs. For example, a speaker will always have at least one device with one output that is always available and cannot be disconnected.

The API uses audiodevicecontrol.cgi as its communications interface and supports the following methods:

This API makes the parameters in the group AudioSource.A# obsolete. Although they can still be kept in parallel, it will not receive any updates to match this new API. The parhand parameters replaced are:

Use this example to retrieve a list containing all available audio capabilities for your device. The list will include the number of accepted gain values as well as accepted power types that can be applied to the audio device.

Start with the following request:

JSON input parameters

Parse the JSON response. A successful response will return a list containing all available devices along with their capabilities.

Successful response example

Error response example

See getDevicesCapabilities for additional details.

Use this example to retrieve a list containing all available as well as currently applied settings on your audio device.

Start with the following request:

JSON input parameters

Parse the JSON response. A successful response will return a list containing all available devices along with their current settings.

Successful response example

Error response example

See getDevicesSettings for additional details.

Use this example to change the audio settings for one or multiple audio devices.

Start with the following request:

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See setDevicesSettings for additional details.

Use this example to retrieve a list containing all potentially harmful settings. This is useful for when you need additional information displayed due to the risk of one or several of them being harmful to the hardware if used incorrectly.

Start with the following request:

JSON input parameters

Parse the JSON response. A successful response will return a list containing all hazardous settings.

Successful response example

Error response example

See getHazardousSettings for additional details.

Use this example retrieve a list of API versions that is supported by your device.

Start with the following request:

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See getSupportedVersions for additional details.

This method lists all audio capabilities on your current device.

Request

Return value - Success

Return value - Error

Error codes

See General error codes for a complete list of API specific errors.

This method lists all audio settings currently installed on your device.

Request

Return value - Success

Response body syntax

Return value - Error

Error codes

See General error codes for a complete list of API specific errors.

This method changes the audio settings currently active on your device.

Request

Return value - Success

Response body syntax

Return value - Error

Error codes

See General error codes for a complete list of API specific errors.

This method retrieves a list of strings containing information about settings that may harm your device if used incorrectly. Please note that the settings are global, which means that they don’t depend on a selected device, nor input or output.

Request

Return value - Success

Response body syntax

Return value - Error

Error codes

See General error codes for a complete list of API specific errors.

This method retrieves a list of API versions supported by your device.

Request

Return value - Success

Response body syntax

Return value - Error

Error codes

See General error codes for a complete list of API specific errors.

```
+---------+        +--------------+        +----------+| Input 0 | ------ |    Device    | ------ | Output 0 |+---------+        |      0       |        +----------++---------+        |              || Input 1 | ------ |              |+---------+        +--------------++---------+        +--------------+        +----------+| Input 0 | ------ |    Device    | ------ | Output 0 |+---------+        |      1       |        +----------+                   +--------------+
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesCapabilities",    "data": {        "devices": [            {                "id": "Q1615-MkIII",                "inputs": [                    {                        "id": "0",                        "connectionTypes": [                            {                                "id": "internal",                                "signalTypes": [                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["P48", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["5V", "Off"]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["P48", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["5V", "Off"]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getDevicesCapabilities",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesSettings"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesSettings",    "data": {        "devices": [            {                "id": "Q1615-MkIII",                "name": "Q1655-MkIII Audio Device",                "inputs": [                    {                        "id": "0",                        "name": "Conference Room 42",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "internal",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 3,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "name": "Dining Room",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "5V",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "name": "Loudspeaker 2",                        "connectionTypeSelected": "external",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 0,                                                "gain": 4,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getDevicesSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "params": {        "devices": [            {                "id": "Q1615-MkIII",                "name": "Q1615-MkIII Audio Device",                "inputs": [                    {                        "id": "0",                        "name": "Conference Room 42",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "internal",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 3,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "name": "Dining Room",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "5V",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "name": "Loudspeaker 2",                        "connectionTypeSelected": "external",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 0,                                                "gain": 4,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "error": {        "code": 2101,        "message": "The provided JSON input was invalid."    }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings",    "data": {        "powerTypes": ["R12"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesCapabilities"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesCapabilities",  "data": {    "devices": [      {        "id": <string>,        "inputs": [          {            "id": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypes": [                  {                    "id": <string>,                    "gainValues": [<integer>],                    "powerTypes": [<string>]                  }                ]              }            ]          }        ],        "outputs": [          {            "id": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypes": [                  {                    "id": <string>,                    "gainValues": [<integer>]                  }                ]              }            ]          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesCapabilities",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesSettings",  "data": {    "devices": [      {        "id": <string>,        "name": <string>,        "inputs": [          {            "id": <string>,            "name": <string>,            "connectionTypeSelected": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypeSelected": <string>                "signalingTypes": [                  {                    "id": <string>,                    "powerType": <string>                    "channels": [                      {                        "id": <integer>,                        "gain": <integer>,                        "mute": <boolean>                      }                    ]                  }                ]              }            ]          }        ],        "outputs": [          {            "id": <string>,            "name": <string>,            "connectionTypeSelected": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypesSelected": <string>,                "signalingTypes": [                  {                    "id": <string>,                    "channels": [                      {                        "id": <integer>,                        "gain": <integer>,                        "mute": <boolean>                      }                    ]                  }                ]              }            ]          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDevicesSettings",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDevicesSettings",  "params": {    "devices": [      {        "id": <string>,        "name": <string>,        "inputs": [          {            "id": <string>,            "name": <string>,            "connectionTypeSelected": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypeSelected": <string>,                "signalingTypes": [                  {                    "id": <string>,                    "powerType": <string>,                    "channels": [                      {                        "id": <integer>,                        "gain": <integer>,                        "mute": <boolean>                      }                    ]                  }                ]              }            ]          }        ],        "outputs": [          {            "id": <string>,            "name": <string>,            "connectionTypeSelected": <string>,            "connectionTypes": [              {                "id": <string>,                "signalingTypeSelected": <string>,                "signalingTypes": [                  {                    "id": <string>,                    "channels": [                      {                        "id": <integer>,                        "gain": <integer>,                        "mute": <boolean>                      }                    ]                  }                ]              }            ]          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDevicesSettings",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDevicesSettings",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getHazardousSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getHazardousSettings",  "data": {    "powerTypes": [      <string>    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getHazardousSettings",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiodevicecontrol.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [      "<Major1>.<Minor1>",      "<Major2>.<Minor2>"    ]  }}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- Retrieving a list of available audio capabilities for the device as well as the external audio devices that can be plugged into it.
- Retrieving a list of of both configurable and current audio settings on your device, as well as any compatible external audio device.
- Setting the gain value for selected inputs and outputs.
- Setting the type value for selected input and outputs.
- Muting selected inputs and outputs.

- API Discovery: id=audio-device-control

- InputGain
- InputType
- MicrophoneBalance
- MicrophonePower
- MicrophonePowerType
- OutputGain

- Start with the following request:
http://<servername>/axis-cgi/audiodevicecontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesCapabilities"}
- Parse the JSON response. A successful response will return a list containing all available devices along with their capabilities.
Successful response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesCapabilities",    "data": {        "devices": [            {                "id": "Q1615-MkIII",                "inputs": [                    {                        "id": "0",                        "connectionTypes": [                            {                                "id": "internal",                                "signalTypes": [                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["P48", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["5V", "Off"]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["On", "Off"]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["P48", "Off"]                                    },                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4],                                        "powerTypes": ["5V", "Off"]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "gainValues": [1, 2, 4]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
Error response example
{    "apiVersion": "2.1",    "context": "abc",    "method": "getDevicesCapabilities",    "error": {        "code": 1100,        "message": "Internal error"    }}

- Start with the following request:
http://<servername>/axis-cgi/audiodevicecontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesSettings"}
- Parse the JSON response. A successful response will return a list containing all available devices along with their current settings.
Successful response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "getDevicesSettings",    "data": {        "devices": [            {                "id": "Q1615-MkIII",                "name": "Q1655-MkIII Audio Device",                "inputs": [                    {                        "id": "0",                        "name": "Conference Room 42",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "internal",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 3,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "name": "Dining Room",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "5V",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "name": "Loudspeaker 2",                        "connectionTypeSelected": "external",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 0,                                                "gain": 4,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
Error response example
{    "apiVersion": "2.1",    "context": "abc",    "method": "getDevicesSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}

- Start with the following request:
http://<servername>/axis-cgi/audiodevicecontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "params": {        "devices": [            {                "id": "Q1615-MkIII",                "name": "Q1615-MkIII Audio Device",                "inputs": [                    {                        "id": "0",                        "name": "Conference Room 42",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "internal",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 3,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            },                            {                                "id": "line",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "Off",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    },                    {                        "id": "1",                        "name": "Dining Room",                        "connectionTypeSelected": "internal",                        "connectionTypes": [                            {                                "id": "mic",                                "signalingTypeSelected": "balanced",                                "signalingTypes": [                                    {                                        "id": "balanced",                                        "powerType": "P48",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    },                                    {                                        "id": "unbalanced",                                        "powerType": "5V",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "name": "Loudspeaker 2",                        "connectionTypeSelected": "external",                        "connectionTypes": [                            {                                "id": "external",                                "signalingTypeSelected": "unbalanced",                                "signalingTypes": [                                    {                                        "id": "unbalanced",                                        "channels": [                                            {                                                "id": 1,                                                "gain": 0,                                                "mute": false                                            },                                            {                                                "id": 0,                                                "gain": 4,                                                "mute": false                                            }                                        ]                                    }                                ]                            }                        ]                    }                ]            }        ]    }}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "data": {}}
Error response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "setDevicesSettings",    "error": {        "code": 2101,        "message": "The provided JSON input was invalid."    }}

- Start with the following request:
http://<servername>/axis-cgi/audiodevicecontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings"}
- Parse the JSON response. A successful response will return a list containing all hazardous settings.
Successful response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings",    "data": {        "powerTypes": ["R12"]    }}
Error response example
{    "apiVersion": "1.0",    "context": "abc",    "method": "getHazardousSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}

- Start with the following request:
http://<servername>/axis-cgi/audiodevicecontrol.cgi
JSON input parameters
{    "context": "abc",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response example
{    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
Error response example
{    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Viewer
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

| Method | Description |
| --- | --- |
| getDevicesCapabilities | Retrieves a list of all audio capabilities on your device. |
| getDevicesSettings | Retrieves a list of the current audio parameters. |
| setDevicesSettings | Sets the audio parameters. |
| getHazardousSettings | Retrieves a list of hazardous settings. |
| getSupportedVersions | Retrieves a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getDevicesCapabilities" | Specifies the API method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getDevicesCapabilities" | The API method used in the request. |
| data.devices[]=<list of audio devices> | Lists available audio devices. |
| <audio device>.id | The audio device ID. |
| <audio device>.inputs[]=<list of inputs> | Lists the inputs on a device. |
| inputs.id | The input ID. |
| inputs.connectionTypes[]=<list of input connection types> | Lists the input types. |
| connectionTypes.id | The input type ID. |
| connectionTypes.signalingTypes[]=<list of signal configuration> | Lists the signal configuration settings. |
| signalingTypes.id | The signal ID. Please not that this can not be changed. |
| signalingTypes.gainValues[]=<list of supported gain values> | The gain capabilities for the signaling type. |
| signalingTypes.powerTypes[]=<list of supported power types> | The power types available for the signal. |
| <audio device>.outputs[]=<list of outputs> | Lists the outputs on a device. |
| outputs.id | The output ID. |
| outputs.connectionTypes[]=<list of output connection types> | Lists the output types. |
| connectionTypes.id | The output type ID. |
| connectionTypes.signalingTypes[]=<list of signal configurations> | Lists the signal configuration settings. |
| signalingTypes.id | The signal ID. Please not that this can not be changed. |
| signalingTypes.gainValues[]=<list of supported gain values> | The gain capabilities for the signaling types. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getDevicesCapabilities" | The API method used in the request. |
| error=<object> | The error object with an integer error code and a message string. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getDevicesSettings" | Specifies the API method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getDevicesSettings" | The API method used in the request. |
| data.devices[]=<list of audio devices> | Lists available audio devices. |
| <audio device>.id | The audio device ID. |
| <audio device>.name | The audio device name. |
| <audio device>.inputs[]=<list of inputs> | Lists the inputs on a device. |
| inputs.id | The input ID. |
| inputs.name | The input name. |
| inputs.connectionTypeSelected | The selected input type. |
| inputs.connectionTypes[]=<list of input connection types> | Lists the input types. |
| connectionTypes.id | The input type ID. |
| connectionTypes.signalingTypeSelected | The selected signal. |
| connectionTypes.signalingTypes[]=<list of signal configuration> | Lists the signal configuration settings. |
| signalingTypes.id | The signal ID. Please not that this is not changeable. |
| signalingTypes.powerType | The selected power type for a signal. |
| signalingTypes.channels[]=<list of channels> | Lists the channels for an input type. |
| channels.id | The channel ID. |
| channels.gain | The channel gain. |
| channels.mute | The channel mute. |
| <audio device>.outputs[]=<list of outputs> | Lists the outputs on a device. |
| outputs.id | The output ID. |
| outputs.name | The output name. |
| outputs.connectionTypeSelected | The selected output type. |
| outputs.connectionTypes[]=<list of output connection types> | Lists the output types. |
| connectionTypes.id | The output type ID. |
| connectionTypes.signalingTypeSelected | The selected signal. |
| connectionTypes.signalingTypes[]=<list of signal configurations> | Lists the signal configuration settings. |
| signalingTypes.id | The signal ID. Please not that this is not changeable. |
| signalingTypes.channels[]=<list of channels> | Lists the channels for an output type. |
| channels.id | The channel ID. |
| channels.gain | The channel gain. |
| channels.mute | The channel mute. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getDevicesSettings" | The API method used in the request. |
| error=<object> | The error object with an integer error code and a message string. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="setDevicesSettings" | The API method used in the request. |
| params=<object> | Container for method specific parameters listed below. |
| params.devices[]=<list of audio devices> | A list containing the available audio devices. |
| <audio device>.id | The audio device ID. |
| <audio device>.name | The audio device name. |
| <audio device>.inputs[]=<list of inputs> | A list containing the device inputs. |
| inputs.id | The input ID. |
| inputs.name | The input name. |
| inputs.connectionTypeSelected | The selected input type. |
| inputs.connectionTypes[]=<list of input connection types> | A list containing the input types. |
| connectionTypes.id | The input type ID. |
| connectionTypes.signalingTypeSelected | The selected signal. |
| connectionTypes.signalingTypes[]=<list of signal configurations> | A list containing the signal configuration settings. |
| signalingTypes.id | The signal ID. Please note that this is not changeable. |
| signalingTypes.powerType | The power type selected for the signal. |
| signalingTypes.channels[]=<list of channels> | A list of input type channels. |
| channels.id | The channel ID. |
| channels.gain | The channel gain. |
| channels.mute | The channel mute. |
| <audio device>.outputs[]=<list of outputs> | A list containing the device outputs. |
| outputs.id | The channel ID. |
| outputs.name | The channel gain. |
| outputs.connectionTypeSelected | The channel mute. |
| outputs.connectionTypes[]=<list of output connection types> | A list containing the output types. |
| connectionTypes.id | The output type ID. |
| connectionTypes.signalingTypeSelected | The selected signal. |
| connectionTypes.signalingTypes[]=<list of signal configuration> | A list containing the signal configuration settings. |
| signalingTypes.id | The signal ID. Please note that this can not be changed. |
| signalTypes.channels[]=<list of channels> | A list containing the output type channels. |
| channels.id | The channel ID. |
| channels.gain | The channel gain. |
| channels.mute | The channel mute. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getDevicesSettings" | The API method used in the request. |
| data=<object> | An empty data object |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="setDevicesSettings" | The API method used in the request. |
| error=<object> | The error object with an integer error code and a message string. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getHazardousSettings" | The API method used in the request. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getHazardousSettings" | The API method used in the request. |
| data.powerTypes[]=<list of hazardous powerTypes> | A list containing the hazardous powerTypes. |
| <list of hazardous powerTypes> | The hazardous powerTypes, e.g. ["R12"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version used in the request. |
| context=<string> | The context string provided by the request (optional). |
| method="getHazardousSettings" | The API method used in the request. |
| error=<object> | The error object with an integer error code and a message string. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context string provided by the request (optional). |
| method="getSupportedVersions" | The API method used in the request. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context string provided by the request (optional). |
| method="getSupportedVersions" | The API method used in the request. |
| data.apiVersions[]=<list of versions> | A list containing the supported major API versions along with their highest minor version. |
| <list of versions> | List of <Major>.<Minor> versions, e.g. ["1.2", "3.4"] |

| Parameter | Description |
| --- | --- |
| context=<string> | The context string provided by the request (optional). |
| method="getHazardousSettings" | The API method used in the request. |
| error=<object> | The error object with an integer error code and a message string. |

| Code | Definition | Description |
| --- | --- | --- |
| 1100 | INTERNAL_ERROR | Internal error. |
| 2100 | UNSUPPORTED_API_VERSION | The requested API version is not supported. |
| 2101 | JSON_INVALID_ERROR | The provided JSON input was invalid. |
| 2102 | METHOD_NOT_SUPPORTED | Method not supported. |
| 2103 | JSON_KEY_NOT_FOUND | A mandatory input parameter was not found in the input. |
| 2104 | PARAM_INVALID_VALUE_ERROR | Invalid parameter value specified. |
| 2105 | AUTHORIZATION_ERROR | Authorization failed. |
| 2106 | AUTHENTICATION_ERROR | Authentication failed. |
| 2107 | TRANSPORT_LEVEL_ERROR | Transport level error. |

