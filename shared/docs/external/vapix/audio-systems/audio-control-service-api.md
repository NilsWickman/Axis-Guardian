# Audio control service API

**Source:** https://developer.axis.com/vapix/audio-systems/audio-control-service-api/
**Last Updated:** Aug 27, 2025

---

# Audio control service API

## Description​

### Identification​

## Common examples​

### Simple cURL examples​

### Adjust volume​

### Adjust InputConfiguration​

## Service capabilities​

## Audio control volume configuration​

The Audio Control service provides mechanisms for adjusting the foreground and background volume for a device.

Foreground volume will set the volume for high priority audio, such as audio clips and VoIP (Voice over Internet Protocol).

Background volume is audio at a lower priority, for example ACAP Audio Players playing background music or a line in when available. Foreground audio is always prioritized over background audio.

Please note that this API has been deprecated as of AXIS OS version 10.12 and will no longer receive any updates.

The Audio Control Service is supported if

JSON and simplified key-value requests

In some VAPIX API:s requests can be constructed using JSON or a simplified key-value format.

The simplified key-value format is a flattened structure with key=value strings. Levels in the structure are indicated by underscores (_).

This example shows how to get the volume via cURL

cURL JSON Request for GetVolume

cURL simple Request for GetVolume

Use axac:SetVolume to adjust the volume of the device. Optional parameters can be left unused if default values are valid. The following example adjusts the foreground volume and sets the background to mute.

Request to set volume JSON format

Response

Request to set volume using simple format

Response

Use axac:SetInputConfiguration to specify which audio inputs that should be used. Information regarding the valid values available for the InputId and ChannelId can be requested using the axac:GetControlCapabilities call. Please note that not all devices support line input capabilities and as such, it will not always be possible to adjust the feature.

Request to set an input configuration in JSON format

Response

The GetControlCapabilities call can be used to retrieve the capabilities of the service, to handle future extensions.

Range

Describes a range of valid values and the unit.

Control Capabilities

The structure of ServiceCapabilities reflects the optional functionality of a service. The information is static and does not change during device operation.

GetControlCapabilities Command

This operation returns the capabilities of the service.

Request

The request is empty.

Response

Volume

The configuration of foreground and background volumes for a device. Valid parameter values may be defined by the service capabilities. The following fields are available, some of which are optional:

SetVolume Command

Requests that a Volume should be set. All members of the Volume are optional, so a Volume with all members empty will be accepted, but won’t change anything.

Request

GetVolume command

Returns the Volume of the Audio Relay network.

Request

The request is empty.

Response

```
$ curl -anyauth -s "http://root:pass@192.168.0.90/vapix/audiocontrol" -d '{"axac:GetVolume":{}}'> {>   "Volume": {>     "ForegroundVolume": -20,>     "ForegroundVolumeUnit": "dB",>     "ForegroundVolumeMute": false,>     "BackgroundVolume": -20,>     "BackgroundVolumeUnit": "dB",>     "BackgroundVolumeMute": false>   }> }
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/audiocontrol? ...  format=simple&action=axac:GetVolume"Volume_ForegroundVolume=-20Volume_ForegroundVolumeUnit="dB"Volume_ForegroundVolumeMute=falseVolume_BackgroundVolume=-20Volume_BackgroundVolumeUnit="dB"Volume_BackgroundVolumeMute=false
```

```
{    "axac:SetVolume": {        "Volume": {            "ForegroundVolume": -21,            "BackgroundVolumeMute": true        }    }}
```

```
{}
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/audiocontrol? ...format=simple&action=axac:SetVolume&Volume_ForegroundVolume=-21&Volume_BackgroundVolumeMute=true
```

```

```

```
{    "axac:SetInputConfiguration": {        "InputConfiguration": {            "InputId": "analog_1",            "ChannelId": "Background",            "Enabled": true        }    }}
```

```
{}
```

```
{}
```

```
{  "Capabilities": {    <ControlCapabilities>  }}
```

```
{  "Volume": {    <Volume>  }}
```

```
{}
```

```
{  "Volume": {    <Volume>  }}
```

- Property: Properties.API.AudioControl.Version="1.0"

- Boolean values are encoded as true and false.
- The NULL value is encoded as null.
- Strings are URL-encoded and may start and end with quotation marks. Example: "a+string%0A".
- Array keys are encoded as _index_ where index is an integer starting from 0.

| Field | Type | Description |
| --- | --- | --- |
| Unit | String | The unit of the value, (e.g. dB). |
| MaxValue | int | The maximum value of the range. |
| MinValue | int | The minimum value of the range. |

| Field | Type | Description |
| --- | --- | --- |
| VolumeRanges | Range | Master volume ranges as supported by this service. |

| Parameter | Description |
| --- | --- |
| Capabilities | The capability response message contains the capabilities that are present in the device. |

| Field | Type | Description |
| --- | --- | --- |
| ForegroundVolume | int | The foreground volume. |
| ForegroundVolumeUnit | String | The unit of the foreground volume. Optional parameter to use if default unit type is not used. |
| ForegroundVolumeMute | Boolean | Mutes the foreground volume. |
| BackgroundVolume | int | The background volume. |
| BackgroundVolumeUnit | String | The unit of the background volume. Optional parameter to use if default unit type is not used. |
| BackgroundVolumeMute | Boolean | Mutes the background volume of the Audio Relay Network. |

| Parameter | Description |
| --- | --- |
| Volume | The volume to set. |

| Parameter | Description |
| --- | --- |
| Volume | The returned volume. |

