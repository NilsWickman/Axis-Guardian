# Siren and light

**Source:** https://developer.axis.com/vapix/network-video/siren-and-light/
**Last Updated:** Aug 27, 2025

---

# Siren and light

## Description​

### Model​

### Identification​

## Common examples​

### Activate Siren and light​

#### Deter unwanted people​

#### Show a notification​

### Simple control through profiles​

#### Customize a profile​

#### Activate Siren and light using a profile​

### Advanced control through priorities​

#### Multiple requests with different priorities​

### Verifying operational conditions with a health check​

#### Initiate a health check​

### Set the device to maintenance mode​

#### Toggle the maintenance mode​

### Upload new profiles​

#### Copying profiles from one unit to another​

## API specification​

### getSupportedVersions​

### getCapabilities​

### getStatus​

### getProfiles​

### start​

### stop​

### addProfile​

### removeProfile​

### runHealthCheck​

### getLastHealthCheck​

### setMaintenanceMode​

### uploadProfiles​

### Error codes​

The Siren and light API makes it possible to access the light and siren capabilities on an Axis device and use them for either notifications or as deterrents.

Both the siren and the light can be activated with pre-configured patterns and intensity levels, but by using this API, you will be able to configure the presets and create a combination of siren and light patterns yourself. In order to support multiple cases of signaling, the API is also capable of setting priority levels for each request.

The API implements siren_and_light.cgi as its communications interface and supports the following methods:

Use this example to control a device to alert an intruder that they have been discovered by using a combination of sirens and flashing lights.

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

Successful response for an idle device

Successful response for a running device

Failed response

JSON input parameters

Successful response.

Failed response

JSON input parameters

Successful response

Failed response

API references

JSON input parameters

Successful response

Failed response

API references

Use this example to define your pattern combinations by using a custom name. Once a profile has been named, the corresponding operation will be marked in the getStatus response with that name.

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful request

Failed response

JSON input parameters

Successful response

Failed response

API references

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response example

Failed response

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

API references

Use this example to signal multiple events with different input sources. Priorities are used to guarantee that the device return the appropriate state.

If an active service receive a request to activate a function it will evaluate the service based on its priority number, where a higher number equals a higher priority. The service will respond in one of three ways:

Operations with a specified runtime will count down even when they are not the highest priority.

In this example a device has been configured to show the availability of a conference room and signal when a phone is ringing. If the room is available the service will be displayed in green and red when it is occupied. When the phone is ringing, the service will pause, show the state of the room and sound the siren as well as flashing with a white light. When the phone is answered or stops ringing the service will continue to show the availability of the conference room.

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response if a given process ID isn't running:

JSON input parameters

Successful response

Failed response

API references

Use this example to make sure that the unit is fully operational by initiating a health check. The health check will run through the service capabilities and create a report.

JSON input parameters

Successful response

Failed response

Successful response

Failed response

API references

Use this example to move the unit to a different location without disabling the systems that may trigger an alarm, which is useful for when you want to access a specific device and put it in maintenance mode and approach it without the risk of the siren going off.

JSON input parameters

Successful response

Failed response

API references

Use this example to upload a configured profile to more than one device, thus replacing the pre-existing profiles on that device.

JSON input parameters

Successful response

Failed response

a) Part 1:

JSON input parameters

b) Part 2:

File content

Successful response

Failed response

API references

This API method can be used to retrieve a list of supported major API versions along with their highest supported minor version.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a list of potential errors.

This API method can be used to list all supported capabilities.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a list of potential errors.

This API method can be used to list the current status for a given ID. Please note that priorities with a value of 11 and above are reserved for service functions.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a list of potential errors.

This API method can be used to list the profiles for a given ID.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a list of potential errors.

This API method can be used to send a request that will initiate the service. Depending on the state and priority of the requested operation, it will either be active or stored to be activated later. The service will run the operation with the highest priority while the runtime of the inactive operation will decrease when it is not shown or heard. Only one operation per priority level is stored, which means that you will need to issue a start with an identical priority level to replace a stored or active operation.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to cancel the whole or parts of the API using one out of three parameter options:

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to add a new profile to the API.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to remove an existing profile from your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to start a health check for a later retrieval. A health check will take some time to run, meaning that the result will take some time to appear.

Request

JSON input parameter

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to retrieve the results from the latest completed health check.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to enable or disable maintenance mode. A device in maintenance mode is safe approach without an alarm going off as the state will be stored and kept though a reboot.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

This API method can be used to upload a set of profiles to the device.

One part of the multipart/form-data request shall supply the body and have the field name=request in its header. Another part shall supply the actual file to upload using the field name=file and refer to the file using the field filename=profiles in its header. The file should be a text file with the profiles listed in a JSON array, with the items specified in the same manner as in the addProfile method.

The new profiles may be uploaded in one of three modes, specified by the parameter uploadMode.

Request

Part 1

Content-disposition

form-data; name="request"

Content-Type: application/json

JSON input parameters

Part 2

Content-disposition

form-data; name="file"; filename="<profile-file>"

File content

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The table below lists the error codes that can be returned for this method. See Error codes for a list of general errors.

The following tables lists the errors that can occur for any API method. Method specific errors are listed under in their separate API specifications.

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "data": {        "capabilities": {            "siren": {                "supportedPatterns": [                    {                        "name": "Siren Alternate",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Alarm Horror",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Alarm Classic Clock",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    }                ]            },            "light": {                "supportedPatterns": [                    {                        "name": "Alternate",                        "speed": {                            "possible": [1, 2],                            "default": 1                        },                        "colors": {                            "minNbrColors": 2,                            "maxNbrColors": 4,                            "possible": ["red", "green", "blue", "amber", "white"],                            "default": ["red", "blue"]                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Steady",                        "speed": {                            "possible": [1],                            "default": 1                        },                        "colors": {                            "minNbrColors": 1,                            "maxNbrColors": 1,                            "possible": ["red", "green", "blue", "amber", "white"],                            "default": ["red"]                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Rotate white + steady color",                        "speed": {                            "possible": [1, 2, 3, 4],                            "default": 2                        },                        "colors": {                            "minNbrColors": 0,                            "maxNbrColors": 1,                            "possible": ["red", "green", "blue", "amber"],                            "default": []                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    }                ]            },            "healthCheckSupport": true,            "maintenanceModeSupport": true,            "poeClass": "4"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "error": {        "code": 2100,        "message": "The API version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "siren": [            {                "sirenId": 1,                "pattern": "Alarm Classic Clock",                "intensity": 5,                "durationLeft": 17,                "priority": 3,                "profile": "Trespassing"            }        ],        "light": [            {                "lightId": 2,                "pattern": "Alternate",                "speed": 1,                "colors": ["blue", "red"],                "intensity": 1,                "priority": 5            },            {                "lightId": 1,                "pattern": "Steady",                "speed": 1,                "colors": ["green"],                "intensity": 1,                "durationLeft": 12,                "priority": 1,                "preset": "Trespassing"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "error": {        "code": 2101,        "message": "Invalid JSON format"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "siren": {            "pattern": "Alarm: Horror",            "intensity": 5,            "duration": {                "unit": "seconds",                "value": 30            }        },        "light": {            "pattern": "Alternate",            "speed": 1,            "colors": ["blue", "red"],            "intensity": 1        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {        "sirenId": 1,        "lightId": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 2208,        "message": "Requested siren duration is invalid"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "all": ["siren", "light"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 1203,        "message": "Requested process id does not exist"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "siren": {            "pattern": "Siren: Alternate",            "intensity": 1,            "duration": {                "unit": "repetitions",                "value": 2            }        },        "light": {            "pattern": "Rotate white +steady color",            "speed": 1,            "intensity": 1,            "duration": {                "unit": "repetitions",                "value": 1            }        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {        "sirenId": 1,        "lightId": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 2208,        "message": "Requested siren duration is invalid"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "data": {        "profiles": [            {                "name": "Profile 1",                "description": "This is a description of Profile 1",                "siren": {                    "pattern": "Alarm: Car alarm",                    "intensity": 5,                    "priority": 3                },                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "duration": {                        "unit": "seconds",                        "value": 30                    },                    "priority": 1                }            },            {                "name": "Profile 2",                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "priority": 1                }            },            {                "name": "Profile 3",                "siren": {                    "pattern": "Alarm: Horror",                    "intensity": 1,                    "priority": 3                }            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "error": {        "code": 2100,        "message": "The API version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeProfile",    "params": {        "name": "Profile 1"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeProfile",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "removeProfile",    "error": {        "code": 1202,        "message": "Requested profile is invalid"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addProfile",    "params": {        "name": "Profile 1",        "description": "This is a description of Profile 1",        "siren": {            "pattern": "Alarm: Car alarm",            "intensity": 4        },        "light": {            "pattern": "Pulse",            "speed": 2,            "colors": ["blue", "red"],            "intensity": 1,            "duration": {                "unit": "seconds",                "value": 30            },            "priority": 2        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addProfile",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "addProfile",    "error": {        "code": 1202,        "message": "Requested profile is invalid"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "data": {        "profiles": [            {                "name": "Profile 1",                "description": "This is a description of Profile 1",                "siren": {                    "pattern": "Alarm: Car alarm",                    "intensity": 5,                    "priority": 3                },                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "duration": {                        "unit": "seconds",                        "value": 30                    },                    "priority": 1                }            },            {                "name": "Profile 2",                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "priority": 1                }            },            {                "name": "Profile 3",                "siren": {                    "pattern": "Alarm: Horror",                    "intensity": 1,                    "priority": 3                }            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "error": {        "code": 2100,        "message": "The API version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "profile": "Profile 1"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {        "sirenId": 1,        "lightId": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1202,        "message": "Requested profile is invalid"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "siren": [            {                "sirenId": 1,                "pattern": "Alarm: Classic clock",                "intensity": 5,                "priority": 3,                "profile": "Profile 1"            }        ],        "light": [            {                "lightId": 1,                "pattern": "Alternate",                "speed": 1,                "colors": ["blue", "red"],                "intensity": 1,                "durationLeft": 28,                "priority": 1,                "profile": "Profile 1"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "error": {        "code": 2101,        "message": "Invalid JSON format"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "profile": "Profile 1"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 1203,        "message": "Requested process id does not exist"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "data": {        "capabilities": {            "siren": {                "supportedPatterns": [                    {                        "name": "Siren: Alternate",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Alarm: Horror",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Alarm: Classic Clock",                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2, 3],                                    "default": 1                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 1                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    }                ]            },            "light": {                "supportedPatterns": [                    {                        "name": "Alternate",                        "speed": {                            "possible": [1, 2],                            "default": 1                        },                        "colors": {                            "minNbrColors": 2,                            "maxNbrColors": 4,                            "possible": ["red", "green", "blue", "amber", "white"],                            "default": ["red", "blue"]                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Steady",                        "speed": {                            "possible": [1],                            "default": 1                        },                        "colors": {                            "minNbrColors": 1,                            "maxNbrColors": 1,                            "possible": ["red", "green", "blue", "amber", "white"],                            "default": ["red"]                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    },                    {                        "name": "Rotate white + steady color",                        "speed": {                            "possible": [1, 2, 3, 4],                            "default": 2                        },                        "colors": {                            "minNbrColors": 0,                            "maxNbrColors": 1,                            "possible": ["red", "green", "blue", "amber"],                            "default": []                        },                        "intensity": {                            "poeClass": {                                "3": {                                    "possible": [1, 2],                                    "default": 2                                },                                "4": {                                    "possible": [1, 2, 3, 4, 5],                                    "default": 2                                }                            }                        },                        "priority": {                            "possible": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],                            "default": 3                        }                    }                ]            },            "healthCheckSupport": true,            "maintenanceModeSupport": true,            "poeClass": "4"        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "error": {        "code": 2100,        "message": "The API version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "light": {            "pattern": "Steady",            "speed": 1,            "colors": ["green"],            "intensity": 1,            "priority": 1        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {        "lightId": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1205,        "message": "Requested light priority is invalid"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "params": {        "siren": {            "pattern": "Alarm: Classic Clock",            "intensity": 3        },        "light": {            "pattern": "Alternate",            "intensity": 5,            "priority": 10        }    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "data": {        "sirenId": 1,        "lightId": 2    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "start",    "error": {        "code": 1205,        "message": "Requested light priority is invalid"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "params": {        "sirenId": 1,        "lightId": 2    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "stop",    "error": {        "code": 1203,        "message": "Requested process id does not exist"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "data": {        "light": [            {                "lightId": 1,                "pattern": "Steady",                "speed": 1,                "colors": ["green"],                "intensity": 1,                "priority": 1            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getStatus",    "error": {        "code": 2101,        "message": "Invalid JSON format"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "runHealthCheck"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "runHealthCheck",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "runHealthCheck",    "error": {        "code": 1204,        "message": "Service does not support health check"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLastHealthCheck"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLastHealthCheck",    "data": {        "timestamp": "2020-01-13T09:03:26+00:00",        "errors": [            {                "code": 101,                "message": "Light is not working optimal"            },            {                "code": 102,                "message": "Siren is not working optimal"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLastHealthCheck",    "error": {        "code": 1204,        "message": "Service does not support health check"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setMaintenanceMode",    "params": {        "maintenanceMode": true,        "duration": 3600    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setMaintenanceMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setMaintenanceMode",    "error": {        "code": 1205,        "message": "Service does not support maintenance mode"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "data": {        "profiles": [            {                "name": "Profile 1",                "description": "This is a description of Profile 1",                "siren": {                    "pattern": "Alarm: Car alarm",                    "intensity": 5,                    "priority": 3                },                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "duration": {                        "unit": "seconds",                        "value": 30                    },                    "priority": 1                }            },            {                "name": "Profile 2",                "light": {                    "pattern": "Alternate",                    "speed": 1,                    "colors": ["blue", "red"],                    "intensity": 1,                    "priority": 1                }            },            {                "name": "Profile 3",                "siren": {                    "pattern": "Alarm: Horror",                    "intensity": 1,                    "priority": 3                }            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getProfiles",    "error": {        "code": 2100,        "message": "The API version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "uploadProfiles",    "params": {        "uploadMode": "erase_and_add"    }}
```

```
[    {        "name": "Profile 1",        "description": "This is a description of Profile 1",        "siren": {            "pattern": "Alarm: Classic Clock",            "intensity": 5,            "priority": 3        },        "light": {            "pattern": "Alternate",            "speed": 1,            "colors": ["blue", "red"],            "intensity": 1,            "duration": {                "unit": "seconds",                "value": 30            },            "priority": 1        }    },    {        "name": "Profile 2",        "light": {            "pattern": "Alternate",            "speed": 1,            "colors": ["blue", "red"],            "intensity": 1,            "priority": 1        }    },    {        "name": "Profile 3",        "siren": {            "pattern": "Alarm: Horror",            "intensity": 1,            "priority": 3        }    }]
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "uploadProfiles",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "uploadProfiles",    "error": {        "code": 1202,        "message": "Requested profile is invalid"    }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": "<Major2.Minor2>",  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getCapabilities",}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getCapabilities",  "data": {    "capabilities": {      "siren": {        "supportedPatterns": [          {            "name": <string>,            "intensity": {              "poeClass": {                "3": {                  "possible": <array>,                  "default": <integer>                },                "4": {                  "possible": <array>,                  "default": <integer>                }              }            },            "priority": {              "possible": <array>,              "default": <integer>            }          },          {            "name": <string>,            "intensity": {              "poeClass": {                "3": {                  "possible": <array>,                  "default": <integer>                },                "4": {                  "possible": <array>,                  "default": <integer>                }              }            },            "priority": {              "possible": <array>,              "default": <integer>            }          }        ]      },      "light": {        "supportedPatterns": [          {            "name": <string>,            "speed": {              "possible": <array>,              "default": <integer>            }            "colors": {              "minNbrColors": <integer>,              "maxNbrColors": <integer>              "possible": <array>,              "default": <integer>            },            "intensity": {              "poeClass": {                "3": {                  "possible": <array>,                  "default": <integer>                },                "4": {                  "possible": <array>,                  "default": <integer>                }              }            },            "priority": {              "possible": <array>,              "default": <integer>            }          },          {            "name": <string>,            "colors": {              "minNbrColors": <integer>,              "maxNbrColors": <integer>,              "possible": <array>,              "default": <integer>            },            "intensity": {              "poeClass": {                "3": {                  "possible": <array>,                  "default": <integer>                },                "4": {                  "possible": <array>,                  "default": <integer>                }              }            },            "priority": {              "possible": <array>,              "default": <integer>            }          }        ]      },      "healthCheckSupport": <boolean>,      "maintenanceModeSupport": <boolean>,      "poeClass": <string>    }  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getCapabilities",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getStatus"}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getStatus",  "data": {    "siren": [      {        "sirenId": <string>,        "pattern": <string>,        "intensity": <string>,        "durationLeft": <integer>,        "priority": <string>,        "profile": <string>      },      {        "sirenId": <string>,        "pattern": <string>,        "intensity": <string>,        "durationLeft": <integer>,        "priority": <string>,        "profile": <string>      }    ],    "light": [      {        "lightId": <string>,        "pattern": <string>,        "speed": <integer>,        "colors": <array>,        "intensity": <string>,        "durationLeft": <integer>,        "priority": <string>,        "profile": <string>      },      {        "lightId": <string>,        "pattern": <string>,        "speed": <integer>,        "colors": <array>,        "intensity": <string>,        "durationLeft": <integer>,        "priority": <string>,        "profile": <string>      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getStatus",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getProfiles"}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getProfiles",  "data": {    "profiles": [      {        "name": <string>,        "description": <string>,        "siren": {          "pattern": <string>,          "intensity": <string>,          "duration": {            "unit": <string>,            "value": <integer>          },          "priority": <integer>        },        "light": {          "pattern": <string>,          "speed": <integer>,          "colors": <array>,          "intensity": <string>,          "duration": {            "unit": <string>,            "value": <integer>          },          "priority": <integer>        }      },      {        "name": <string>,        "siren": {          "pattern": <string>,          "intensity": <string>,          "duration": {            "unit": <string>,            "value": <integer>          }          "priority": <integer>        },        "light": {          "pattern": <string>,          "speed": <integer>,          "colors": <array>,          "intensity": <string>,          "duration": {            "unit": <string>,            "value": <integer>          }          "priority": <integer>        }      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getProfiles",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": start,  "params": {    "siren": {      "pattern": <string>,      "intensity": <integer>,      "duration": {        "unit": <string>,        "value": <integer>      }      "priority": <integer>    },    "light": {      "pattern": <string>,      "speed": <integer>,      "colors": <array>,      "intensity": <string>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <integer>    },    "profile": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "start",  "data": {    "sirenId": <integer>,    "lightId": <integer>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "start",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "stop",  "params": {    "sirenId": <integer>,    "lightId": <integer>,    "all": <array>,    "profile": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "stop",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "stop",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "addProfile",  "params": {    "name": <string>,    "description": <string>,    "siren": {      "pattern": <string>,      "intensity": <string>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <string>    },    "light": {      "pattern": <string>,      "speed": <integer>,      "colors": <array>,      "intensity": <string>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <string>    }  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "addProfile",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "addProfile",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "removeProfile",  "params": {    "name": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "removeProfile",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "removeProfile",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "runHealthCheck"}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "runHealthCheck",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "runHealthCheck",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": getLastHealthCheck"}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getLastHealthCheck",  "data": {    "timestamp": "iso 8601 timestamp",    "errors": [      {        "code": <integer>,        "message": "First error message"      },      {        "code": <integer>,        "message": "Second error message"      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "getLastHealthCheck",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "setMaintenanceMode",  "params": {    "maintenanceMode": <boolean>,    "duration": <integer>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "setMaintenanceMode",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "setMaintenanceMode",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/siren_and_light.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "uploadProfiles",  "params": {    "uploadMode": <string>  }}
```

```
[  {    "name": "Name of first profile",    "description": "Description of the profile",    "siren": {      "pattern": "Name of siren pattern",      "intensity": <integer>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <integer>    },    "light": {      "pattern": "Name of the light pattern",      "speed": <integer>,      "colors": <array>,      "intensity": <string>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <integer>    }  },  {    "name": "Name of seconds profile"    "description": "Description of the profile",    "siren": {      "pattern": <string>,      "intensity": <integer>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <integer>    },    "light": {      "pattern": "Name of light pattern",      "speed": <integer>,      "colors": <array>,      "intensity": <integer>,      "duration": {        "unit": <string>,        "value": <integer>      },      "priority": <integer>    }  }]
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "uploadProfiles",  "data": {  }}
```

```
{  "apiVersion": "Major.Minor",  "context": <string>,  "method": "uploadProfiles",  "error": {    "code": <integer>,    "message": <string>  }}
```

- API discovery: id=siren-and-light

- Request a list of supported API versions.

- Parse the JSON response.

- Use the supported version and request a list of available capabilities:

- Parse the JSON response.

- Check the device’s status to determine if an alarm is running and for how long.

- Parse the JSON response.

- Initiate the API to start both the siren and light patterns. The siren won’t be on for more than 30 seconds.

- Parse the JSON response.

- Cancel all operations that are currently running on a service. This example shows you the stop method that lets you end all requested operations, including those with a different priority or were started by a different user.

- getSupportedVersions
- getCapabilities
- getStatus
- start
- stop

- Start the service with both the siren and light to run a specified number of repetitions that creates a notification instead of an alarm.

- Parse the JSON response.

- start

- Request a list of supported Siren and light protocol versions.

- Parse the JSON response.

- Use the supported version and request a list of profiles:

- Parse the JSON response.

- Check the responses for the profile name that you wish to replace and request its removal.

- Parse the JSON response.

- Add a new profile.

- Parse the JSON response.

- getSupportedVersions
- getCapabilities
- removeProfile
- addProfile

- Request a list of supported API versions.

- Parse the JSON response.

- Use the supported version to request a list of available profiles.

- Parse the JSON response.

- Check the responses for the profile that you wish to activate.

- Parse the JSON response.

- If necessary, request the present status with getStatus.

- Parse the JSON response.

- Once a profile has fulfilled its purpose, you can use stop to halt it. This can be done even if the operation ID is unknown.

- Parse the JSON response.

- getSupportedVersions
- getCapabilities
- start
- stop

- The requested operation won’t become active if it has a lower priority than the running operation.
- The requested operation will replace the running operation if they have the same priority.
- The running operation will be on standby until a requested operation with a higher priority is either stopped or paused
- Both Health check and the maintenance mode are able to halt a service, even when it has a higher priority. See getStatus for additional information.

- Use a supported version and request a list of service capabilities.

- Parse the JSON response.

- Use the lowest priority on the list to show the availability of a conference room.

- Parse the JSON response.

- Use the highest priority on the list to check for a ringing phone.

- Parse the JSON response.

- Cancel the running light operation when the phone is answered by using the stop method and the ID of the intended operation. Operations with a higher or lower priority will be kept.

- Parse the JSON response.

- Verify that the requested behavior has been successfully acquired.

- Parse the JSON response.

- getCapabilities
- start
- stop

- Run a health check on a given device.

- Parse the JSON response.

- The health check will take a couple of seconds to run, after which you will receive the result.

- Parse the JSON response.

- runHealthCheck
- getLastHealthCheck

- Engage maintenance mode for a service that will automatically disengage after one hour.

- Parse the JSON response.

- setMaintenanceMode

- Get the list of the profiles configuration.

- Parse the JSON response.

- Create a multipart/form-data request consisting of two parts where the first part shall supply the JSON body and shall have the field name=request in its header. The second part should include a file with the list of profiles to upload and shall have the field name=file in its header.

- Parse the JSON response.

- uploadProfiles

- Security level: admin, operator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
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

- A start can be used to specify the variable preset, meaning either the siren, the light or both.
- A start will return an ID for each initiated operation, which in turn can be used to stop that operation.

- Security level: Admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- all: stops all operations.
- sirenId or lightId: stops either the siren or the light. This also initiate operations with lower priorities.
- profile: stops operations started by a profile.

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

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST
- Content-Type: multipart/form-data

- Content-disposition
form-data; name="request"
- Content-Type: application/json

- Content-disposition
form-data; name="file"; filename="<profile-file>"

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getSupportedVersions | Lists the supported API versions. |
| getCapabilities | Lists all services and their capabilities. |
| getStatus | Lists the current status for a service. |
| getProfiles | Lists the current registered profiles. |
| start | Starts a function for a service. |
| stop | Stops a function for a service. |
| addProfile | Adds a profile to a device. |
| removeProfile | Removes a profile from a device. |
| runHealthCheck | Starts a health check for a later retrieval. |
| getLastHealthCheck | Lists the result from the latest completed health check. |
| setMaintenanceMode | Engages or disengages the maintenance mode for the service. |
| uploadProfiles | Uploads a list of profiles to the device. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |
| apiVersions | Array | The supported API versions presented in the format "Major.Minor". |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format Major.Minor. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for the method specific parameters listed below. |
| capabilities | Array | Supported services. Parameters listed below. |
| Siren-specific parameters |  |  |
| siren | JSON object | Object containing the supported siren properties. This parameter must be supplied if siren is supported. |
| supportedPatterns | Array | Object containing the properties for the siren patterns. |
| name | String | Name of the siren pattern. This parameter must be supplied if siren is supported. |
| intensity | JSON object | Object containing the supported intensity. |
| poeClass | JSON object | Object containing the poe class dependent properties that must contain the poe variable supported by the device. |
| 3 | JSON object | Object containing the supported intensity properties for POE class 3. |
| possible | Array | Contains the siren intensity levels when powered by POE class 3. |
| default | Integer | The intensity level used when the pattern is started without a set intensity level. |
| 4 | JSON object | Object containing the supported intensity properties for POE class 4. |
| possible | Array | Contains the siren intensity levels when powered by POE class 4. |
| default | Integer | The intensity level used when the pattern is started without a set intensity level. |
| priority | JSON object | Object containing the supported priority properties. |
| possible | Array | Contains the priority levels. |
| default | Integer | Priority level used when the pattern is started without a set priority level. |
| Light-specific parameters |  |  |
| light | JSON object | Object containing the supported light properties. This parameter must be supplied if light is supported. |
| supportedPatterns | Array | Contains the properties of the light patterns. |
| name | String | The name of the pattern that must be supplied if light is supported. |
| speed | JSON object | Contains the supported speeds for the light pattern. |
| colors | JSON object | Object containing the supported color properties. |
| minNbrColors | Integer | The minimum number of different colors that are required for the light pattern. |
| maxNbrColors | Integer | The maximum number of different colors that are required for the light pattern. The maximum length of the color array should be set at the start of this pattern. |
| possible | Array | Contains the names of supported colors in which specified light pattern can flash. |
| default | Array | Contains the names of supported colors used when the pattern is started without a pre-set color. |
| intensity | JSON object | Object containing the supported intensity properties. |
| poeClass | JSON object | Object containing the poe class dependent properties that must contain the poe variable supported by the device. |
| 3 | JSON object | Object containing the supported intensity properties for POE class 3. |
| possible | Array | Contains the siren intensity levels when powered by POE class 3. |
| default | Integer | The intensity level used when the pattern is started without a set intensity level. |
| 4 | JSON object | Object containing the supported intensity properties for POE class 4. |
| possible | Array | Contains the siren intensity levels when powered by POE class 4. |
| default | Integer | The intensity level used when the pattern is started without a set intensity level. |
| priority | JSON object | Object containing the supported priority properties. |
| possible | Array | Contains the priority levels. |
| default | Integer | Priority level used when the pattern is started without a set priority level. |
| healthCheckSupport | Boolean | True if the service supports health check. |
| maintenanceModeSupport | Boolean | True if the service supports maintenance mode. |
| poeClass | String | The current POE class. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Function | Priority |
| --- | --- |
| Maintenance mode | 11 |
| Find my device | 12 |
| Health check | 13 |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format Major.Minor. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for the method specific parameters listed below. |
| Siren-specific parameters |  |  |
| siren | JSON object | An object containing the supported siren properties. |
| sirenId | String | The siren ID. |
| pattern | String | The name of the siren pattern currently running. |
| intensity | Integer | The intensity level of the siren pattern currently running. |
| durationLeft | Integer | The time left until the siren stops (in seconds). This value decreases even when there are other active patterns with higher priority. |
| profile | String | The name of the profile currently running. |
| priority | Integer | The priority level used to start the pattern. |
| Light-specific parameters |  |  |
| light | JSON object | An object containing the supported light properties. |
| lightId | String | The light ID. |
| pattern | String | The name of the light pattern currently running. |
| speed | Integer | The speed for the running light pattern. |
| colors | Array | Contains the names of the colors which is used with the corresponding light pattern. |
| intensity | Integer | The intensity level of the light pattern currently running. |
| durationLeft | Integer | The time left until the light stops (in seconds). This value decreases even when there are other active patterns with higher priority. |
| profile | String | The name of the profile currently running. |
| priority | Integer | The priority level used to start the pattern. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format Major.Minor. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for the method specific parameters listed below. |
| profiles | Array | An array of JSON objects that describes the registered profiles (conditional). |
| name | String | The name of the profile. Used as a unique identifier. |
| description | String | String supplied by the user that can be no longer than 250 characters (optional). |
| Siren-specific parameters |  |  |
| siren | JSON object | Contains supported siren properties. |
| pattern | String | The name of the siren pattern. |
| intensity | Integer | The intensity level of the siren pattern. |
| duration | JSON object | Contains the duration information. |
| unit | String | The unit used for the duration. Can be set in either seconds or repetitions. |
| value | Integer | The value used for the duration. |
| priority | Integer | The priority level used for when to start the pattern. |
| Light-specific parameters |  |  |
| light | JSON object | Contains the supported light properties. |
| pattern | String | The name of the light pattern. |
| speed | Integer | The speed of the light pattern. |
| colors | Array | Contains the name of the colors which are used by the light pattern. |
| intensity | Integer | The intensity level of the light pattern. |
| duration | JSON object | Contains the duration information. |
| unit | String | The unit used for the duration. Can be set in either seconds or repetitions. |
| value | Integer | The value used for the duration. |
| priority | Integer | The priority level used for when to start the pattern. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| Siren-specific parameters |  |  |
| siren | JSON object | Contains the siren properties. Can not be used together with profile (optional). |
| pattern | String | The name of the siren pattern. |
| intensity | String | The name of the siren intensity level. |
| duration | Integer | Contains the duration information. |
| unit | String | The unit used for the duration. Can be set in either seconds or repetitions. |
| value | Integer | The value used for the duration. |
| priority | String | The name of the priority level (optional). |
| Light-specific parameters |  |  |
| light | JSON object | Contains light properties. Can not be used together with profile (optional). |
| pattern | String | The name of the light pattern. Must be supplied if a light is used. |
| speed | Integer | The speed that the light pattern should use (optional). |
| colors | Array | Contains the names of colors in which the light pattern are able to flash (optional). |
| intensity | String | The name of the light intensity level. |
| duration | Integer | The duration time in seconds when the light should self terminate. |
| unit | String | The unit used for the duration. Can be set in either seconds or repetitions. |
| value | Integer | The value used for the duration. |
| priority | String | The name of the priority level (optional). |
| profile | String | The name of the preset, used as unique identifiers. It can not be used together with siren or light (optional). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |
| sirenId | Integer | The ID of the siren operation, used as a handle to stop this operation. |
| lightId | Integer | The ID of the light operation, used as a handle to stop this operation. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1202 | Requested profile is invalid |
| 2200 | Requested siren pattern is invalid |
| 2201 | Requested light pattern is invalid |
| 2202 | Requested siren intensity is invalid |
| 2203 | Requested light intensity is invalid |
| 2204 | Requested siren priority is invalid |
| 2205 | Requested light priority is invalid |
| 2206 | Requested siren duration unit is invalid |
| 2207 | Requested light duration unit is invalid |
| 2208 | Requested siren duration is invalid |
| 2209 | Requested light duration is invalid |
| 2210 | Requested function type is invalid |
| 2211 | Requested number of colors is invalid |
| 2212 | Requested color is invalid |
| 2215 | Requested speed is invalid. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| sirenId | Integer | The ID handle for the stop siren operation (optional). |
| lightId | Integer | The ID handle for the stop light operation (optional). |
| all | Array | States the operation that should be stopped. This might stop multiple requests with different priorities. Supported types are siren and light (optional). |
| profile | String | The name of the stop profile. The name is used as an unique identifier for profiles (optional). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used, presented in the format Major.Minor. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for the method specific parameters listed below. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1202 | Requested profile is invalid |
| 1203 | Requested process id does not exist |
| 2210 | Requested function type is invalid |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| name | String | The profile name, which must be unique as it also functions as an identifier. Can’t be longer than 50 character. |
| description | String | Supplied by the user. Can’t be longer than 250 characters (optional). |
| Siren-specific parameters |  |  |
| siren | JSON object | Contains the siren configuration (optional). |
| pattern | String | The name of the siren pattern. |
| intensity | Integer | The siren intensity level. |
| duration | JSON object | Contains the duration information. |
| unit | String | The duration unit. Can be either seconds or repetitions. |
| value | Integer | The duration value. Valid ranges are 0–259200 for seconds and 0–20 for repetitions. |
| priority | Integer | The priority level (optional). |
| Light-specific parameters |  |  |
| light | JSON object | Contains the light configuration (optional). |
| pattern | String | The name of the light pattern. |
| speed | Integer | The speed that the light pattern should use (optional). |
| colors | Array | Contains the names of the colors the light pattern should flash in (optional). |
| intensity | Integer | The light intensity level. |
| duration | JSON object | Contains the duration information (optional). |
| unit | String | The duration unit. Can be either seconds or repetitions. |
| value | Integer | The duration value. Valid ranges are 0–259200 for seconds and 0–20 for repetitions. |
| priority | Integer | The priority level (optional). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1201 | Maximum number of profiles reached |
| 1202 | Requested profile is invalid |
| 2200 | Requested siren pattern is invalid |
| 2201 | Requested light pattern is invalid |
| 2202 | Requested siren intensity is invalid |
| 2203 | Requested light intensity is invalid |
| 2204 | Requested siren priority is invalid |
| 2205 | Requested light priority is invalid |
| 2206 | Requested siren duration unit is invalid |
| 2207 | Requested light duration unit is invalid |
| 2208 | Requested siren duration is invalid |
| 2209 | Requested light duration is invalid |
| 2210 | Requested function type is invalid |
| 2211 | Requested number of colors is invalid |
| 2212 | Requested color is invalid |
| 2213 | Profile name is too long |
| 2214 | Description is too long |
| 2215 | Requested speed is invalid. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| name | String | The name of the preset that should be removed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1202 | Requested profile is invalid |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1204 | Service does not support health check |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |
| timestamp | String | The timestamp for the latest ran health check. |
| errors | Array | Contains the error json-objects. |
| code | Integer | The error code from the health check. |
| message | String | A message describing the error. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1204 | Service does not support health check |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| maintenanceMode | Boolean | The state for maintenance mode. True= engages False= disengages |
| duration | Integer | The number of seconds the maintenance mode will be active if True has been chosen (optional). |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code | Integer | The error code. |
| message | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1205 | Service does not support maintenance mode |

| Mode | Description |
| --- | --- |
| add | Add a profile. If a profile with an identical name exists, an error will be returned. |
| overwrite | Add a profile. If a profile with an identical name exists, the old profile will be removed and replaced. |
| erase_and_add | Remove all pre-existing profiles before uploading a new one. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format "Major.Minor". |
| context | String | The user sets this value and the application echoes it back in thee response (optional). |
| method | String | The method that should be used. |
| params | JSON object | Container for method specific parameters. |
| uploadMode | String | Specifies how the new profiles should be uploaded. Valid values are add, overwrite and erase_and_add |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The method that was performed. |
| data | JSON object | Container for response specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used. |
| context | String | A text string that will be echoed back as long as it was provided by the user in the corresponding request (optional). |
| method | String | The performed method. |
| code=<integer error code> | Integer | The error code. |
| message=<string> | String | The error message corresponding to the error code. |

| Code | Description |
| --- | --- |
| 1201 | Maximum number of profiles reached |
| 1202 | Requested profile is invalid |
| 2200 | Requested siren pattern is invalid |
| 2201 | Requested light pattern is invalid |
| 2202 | Requested siren intensity is invalid |
| 2203 | Requested light intensity is invalid |
| 2204 | Requested siren priority is invalid |
| 2205 | Requested light priority is invalid |
| 2206 | Requested siren duration unit is invalid |
| 2207 | Requested light duration unit is invalid |
| 2208 | Requested siren duration is invalid |
| 2209 | Requested light duration is invalid |
| 2210 | Requested function type is invalid |
| 2211 | Requested number of colors is invalid |
| 2212 | Requested color is invalid |
| 2213 | Profile name is too long |
| 2214 | Description is too long |
| 2215 | Requested speed is invalid. |

| Code | Description |
| --- | --- |
| 1100 | Internal error |
| 1200 | Service is not initialized |
| 2100 | The API version is not supported |
| 2101 | Invalid JSON |
| 2102 | Method not supported |
| 2103 | Required parameter missing |
| 2104 | Invalid parameter value specified |

