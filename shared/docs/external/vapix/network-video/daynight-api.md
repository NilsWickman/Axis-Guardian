# DayNight API

**Source:** https://developer.axis.com/vapix/network-video/daynight-api/
**Last Updated:** Aug 27, 2025

---

# DayNight API

## Overview​

### Identification​

## Use cases​

### Request day night configurations​

### Shift level configurations​

### Shift dwell time configurations​

## API specifications​

### getCapabilities​

### getConfiguration​

### setConfiguration​

### getSupportedVersions​

### Error responses​

The VAPIX® DayNight API provides the information that makes it possible to manage day and night configurations on an Axis device where the IR-cut filter has been set to Auto. The filter activates a day-night algorithm that automatically switches between day and night mode depending on the brightness in the image.

The API provides the ability to change how the algorithm behaves.

List all capabilities and check the day and night configurations on a device.

Example

Use getCapabilities to check the current day night capabilities for a channel.

Use getConfiguration to check the current day night configuration for a channel.

Change the day to night and/or night to day shift level configuration.

Example

Use setConfiguration to set the DayNightShiftLevel for a channel.

Use setConfiguration to set the boolean value of the parameter Autotune for a channel. This is only possible if AutotuneSupport is true (see getCapabilities).

Use setConfiguration to set the NightDayShiftLevel for a channel. Please note that this is only possible if Autotune is false and NightDayShiftLevelSupport is true (see getCapabilities).

Change the day to night and/or night to day dwell time configuration. A dwell time will always occur when a camera and a corresponding channel switch from day to night or night to day. Dwell time are the number of seconds that should pass until the day night algorithm make the switch, which by default is between 3–5 seconds and can be changed depending on use case:

Example

Use setConfiguration to set the DayNightDwellTime for a channel.

Use setConfiguration to set the NightDayDwellTime for a channel.

This method should be used when you want to request a list of all day and night capabilities for a specific channel on your device.

Request

JSON input parameters

Return value – Success

Successful response example

Return value – Failure

See Error responses for a complete list of potential errors.

This method should be used when you want to request configuration information for a channel.

Request

JSON input parameters

Return value – Success

Successful response example

Return value – Failure

See Error responses for a complete list of potential errors.

This method should be used when you want to apply configurations to a channel.

Request

JSON input parameters

Return value – Success

Successful response example

Return value – Failure

See Error responses for a complete list of potential errors.

This method should be used when you want to check which major and minor API versions that are supported on your device.

Request

JSON input parameters

Return value – Success

Successful response example

Return value – Failure

See Error responses for a complete list of potential errors.

200 API version not supported

Error response example

400 Bad request

Error response example

200 Method not supported

Error response example

500 Missing parameter

Error response example

500 Invalid parameter

Error response example

403 Authorization failed

Error response example

401 Authentication failed

Error response example

405 Method not allowed

Error response example

500 Internal error, NightDayShiftLevel Autotune not supported

Error response example

500 Internal error, autotune set to true

Error response example

```
http://<servername>/axis-cgi/daynight.cgi#getCapabilities
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "params": {        "channel": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCapabilities",    "data": [        {            "channel": 0,            "AutotuneSupport": true,            "NightDayShiftLevelSupport": true        }    ]}
```

```
http://<servername>/axis-cgi/daynight.cgi#getConfiguration
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getConfiguration",    "params": {        "channel": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getConfiguration",    "data": [        {            "channel": 0,            "DayNightDwellTime": 3,            "DayNightShiftLevel": 50,            "NightDayDwellTime": 3,            "NightDayShiftLevel": 50,            "Autotune": true        }    ]}
```

```
http://<servername>/axis-cgi/daynight.cgi#setConfiguration
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setConfiguration",    "params": {        "channel": 0,        "DayNightDwellTime": 3,        "DayNightShiftLevel": 50,        "NightDayDwellTime": 3,        "NightDayShiftLevel": 50,        "Autotune": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setConfiguration",    "data": [        {            "channel": 0,            "DayNightDwellTime": 3,            "DayNightShiftLevel": 50,            "NightDayDwellTime": 3,            "NightDayShiftLevel": 50,            "Autotune": true        }    ]}
```

```
http://<servername>/axis-cgi/daynight.cgi#getSupportedVersions
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2100,        "message": "API version not supported."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2101,        "message": "Invalid JSON."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2102,        "message": "Method not supported."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2103,        "message": "Required parameter missing."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2104,        "message": "Invalid parameter value specified."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2105,        "message": "Authorization failed."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2106,        "message": "Authentication failed."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 2107,        "message": "Transport level error."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 1100,        "message": "Internal error, NightDayShiftLevel Autotune not supported."    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "method",    "error": {        "code": 1100,        "message": "Internal error, autotune set to true."    }}
```

- Day mode: The IR-cut filter is ON and the image is in color.
- Night mode: The IR-cut filter is OFF and the image is in black and white.

- API Discovery: id=daynight

- Use getCapabilities to check the current day night capabilities for a channel.
- Use getConfiguration to check the current day night configuration for a channel.

- Increasing the value of DayNightShiftLevel will make the channel switch from day to night when it is darker.
- If the night to day switch is unsatisfactory it is possible to set Autotune to true. This will let an algorithm take control of the NightDayShiftLevel parameter to obtain optimal night to day performance.
- If the Autotune algorithm is unsatisfactory it is possible to set it to false and modify the value of NightDayShiftLevel.
- Increasing the value of NightDayShiftLevel will make the channel switch from night to day when it is darker. Please note that increasing the value of NightDayShiftLevel too much might lead to day night oscillations and should be carefully handled.

- Use setConfiguration to set the DayNightShiftLevel for a channel.
- Use setConfiguration to set the boolean value of the parameter Autotune for a channel. This is only possible if AutotuneSupport is true (see getCapabilities).
- Use setConfiguration to set the NightDayShiftLevel for a channel. Please note that this is only possible if Autotune is false and NightDayShiftLevelSupport is true (see getCapabilities).

- If a channel is observing a highway where there is temporary light sources passing by in the night for a short period of time. This can make the day night algorithm believe that it is bright and switch from night to day just because the headlights shine into the channel longer time than the night to day dwell time. The channel will switch back to night-mode once the car has left the scene. This means that it would be wise to change the NightDayDwellTime to be more than 20 seconds in order to avoid switches every time a car pass.
- If, on the other hand, the camera and a corresponding channel is located next to a motion triggered light source with visible light it would be wise to switch to day-mode as fast as possible when that light source turns on. In this case NightDayDwellTime should be set to 1–3 seconds.

- Use setConfiguration to set the DayNightDwellTime for a channel.
- Use setConfiguration to set the NightDayDwellTime for a channel.

- Security level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin, Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200
- Content-Type: application/json

- HTTP Code: 400
- Content-Type: application/json

- HTTP Code: 200
- Content-Type: application/json

- HTTP Code: 500
- Content-Type: application/json

- HTTP Code: 500
- Content-Type: application/json

- HTTP Code: 403
- Content-Type: application/json

- HTTP Code: 401
- Content-Type: application/json

- HTTP Code: 405
- Content-Type: application/json

- HTTP Code: 500
- Content-Type: application/json

- HTTP Code: 500
- Content-Type: application/json

| Parameter | Description |
| --- | --- |
| DayNightShiftLevel | Controls the level for when the switch between day and night shall occur.- A higher value means that the switch will occur when the image is darker.- A lower value means that the switch will occur when the image is brighter.This parameter is equivalent to the param.cgi parameter root.ImageSource.IX.DayNight.ShiftLevel. |
| DayNightDwellTime | In day mode, when it gets dark enough for the day to night threshold of DayNightShiftLevel to be reached, this parameter defines the number of seconds that should pass until the channel switch into night mode. |
| NightDayDwellTime | In night mode, when it gets bright enough for the night to day threshold of DayNightShiftLevel to be reached, this parameter defines the number of seconds that should pass until the channel switch into day mode. |
| NightDayShiftLevel | Gives the user the ability to change the parameter NightDayShiftLevel as long as NightDayShiftLevelSupport is true. NightDayShiftLevel controls the night to day switch.- A higher value corresponds to a night to day switch when it’s darker.- A lower value corresponds to a night to day switch when it’s brighter.This parameter should be handled with care as a day night oscillations could occur when the value is too high. |
| Autotune | Give the user the ability to change the parameter Autotune as long as AutotuneSupport is true. An algorithm will take control of the NightDayShiftLevel parameter to obtain an optimal night to day performance if Autotune is true. The user will be prevented from changing the NighDayShiftLevel parameter at this stage. The user is able to change NighDayShiftLevel to a fixed value if Autotune is false. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method=<method> | The method that should be used. |
| channel=<integer> | The channel that should be used for the operation. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| channel=<integer> | The channel used in the operation. |
| AutotuneSupport=<boolean> | True if the channel supports autotune, otherwise false. |
| NightDayShiftLevelSupport=<boolean> | True if the channel supports night to day shift levels, otherwise false. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method=<method> | The method that should be used. |
| channel=<integer> | The channel that should be used for the operation. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| channel=<integer> | The channel used in the operation. |
| DayNightDwellTime=<float> | The dwell time before switching from day to night-mode. This event occur when it gets dark enough for the day to night threshold DayNightShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| DayNightShiftLevel=<integer> | Controls the day to night switch threshold with a range between 0–100. A higher value corresponds to a night to day switch when it is darker. Equivalent to the param.cgi parameter root.ImageSource.IX.DayNight.ShiftLevel. |
| NightDayDwellTime=<float> | The dwell time before switching from night to day-mode. This event occur when it gets bright enough for the night to day threshold NightDayShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| NightDayShiftLevel=<integer> | Only possible to use if NightDayShiftLevelSupport is true (see getCapabilities). Controls the night to day threshold.- A lower value corresponds to a night to day switch when it is brighter.- A higher value corresponds to a day to night switch when it is darker.By manually setting NightDayShiftLevel too high can lead to oscillations between day- and night-mode. It is recommended to optimize this parameter automatically by setting Autotune to true, in which case it is not possible to NighDayShiftLevel in setConfiguration. |
| Autotune=<boolean> | Only usable if AutotuneSupport is true (see getCapabilities).- true: An algorithm takes control over the parameter NightDayShiftLevel to obtain optimal night to day performance.- false: The operator can change NightDayShiftLevel to a fixed value. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method=<method> | The method that should be used. |
| channel=<integer> | The channel that should be used for the operation. |
| DayNightDwellTime=<float> | The dwell time before switching from day to night-mode. This event occur when it gets dark enough for the day to night threshold DayNightShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| DayNightShiftLevel=<integer> | Controls the day to night switch threshold with a range between 0–100. A higher value corresponds to a night to day switch when it is darker. Equivalent to the param.cgi parameter root.ImageSource.IX.DayNight.ShiftLevel. |
| NightDayDwellTime=<float> | The dwell time before switching from night to day-mode. This event occur when it gets bright enough for the night to day threshold NightDayShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| NightDayShiftLevel=<integer> | Only possible to use if NightDayShiftLevelSupport is true (see getCapabilities). Controls the night to day threshold.- A lower value corresponds to a night to day switch when it is brighter.- A higher value corresponds to a day to night switch when it is darker.By manually setting NightDayShiftLevel too high can lead to oscillations between day- and night-mode. It is recommended to optimize this parameter automatically by setting Autotune to true, in which case it is not possible to NighDayShiftLevel in setConfiguration. |
| Autotune=<boolean> | Only usable if AutotuneSupport is true (see getCapabilities).- true: An algorithm takes control over the parameter NightDayShiftLevel to obtain optimal night to day performance.- false: The operator can change NightDayShiftLevel to a fixed value. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| channel=<integer> | The channel used in the operation. |
| DayNightDwellTime=<float> | The dwell time before switching from day to night-mode. This event occur when it gets dark enough for the day to night threshold DayNightShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| DayNightShiftLevel=<integer> | Controls the day to night switch threshold with a range between 0–100. A higher value corresponds to a night to day switch when it is darker. Equivalent to the param.cgi parameter root.ImageSource.IX.DayNight.ShiftLevel. |
| NightDayDwellTime=<float> | The dwell time before switching from night to day-mode. This event occur when it gets bright enough for the night to day threshold NightDayShiftLevel to be reached. The dwell time is measured between 1 and 600 seconds. |
| NightDayShiftLevel=<integer> | Only possible to use if NightDayShiftLevelSupport is true (see getCapabilities). Controls the night to day threshold.- A lower value corresponds to a night to day switch when it is brighter.- A higher value corresponds to a day to night switch when it is darker.By manually setting NightDayShiftLevel too high can lead to oscillations between day- and night-mode. It is recommended to optimize this parameter automatically by setting Autotune to true, in which case it is not possible to NighDayShiftLevel in setConfiguration. |
| Autotune=<boolean> | Only usable if AutotuneSupport is true (see getCapabilities).- true: An algorithm takes control over the parameter NightDayShiftLevel to obtain optimal night to day performance.- false: The operator can change NightDayShiftLevel to a fixed value. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method=<method> | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| apiVersions | A list containing all supported major versions along with their highest minor version, e.g. ["1.0", "2.0"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> Optional | The context set by the user in the request. |
| method=<method> | The requested method. |
| code=<integer> | The error code. |
| message=<string> | The error message for the corresponding error code. |

