# Speaker Display Settings

**Source:** https://developer.axis.com/vapix/device-configuration/speaker-display-settings/
**Last Updated:** Sep 10, 2025

---

# Speaker Display Settings

## Use cases​

### Get all settings​

### Set appearance settings​

### Set brightness settings​

### Set power saving settings​

## API definition​

### Structure​

### Entities​

#### speaker-display-settings.v1​

#### speaker-display-settings.v1.appearance​

##### backgroundColor​

##### fontColor​

##### language​

##### showDate​

##### showSeconds​

##### use24HourClock​

#### speaker-display-settings.v1.brightness​

##### adaptiveBrightness​

##### manualLevel​

##### maxAdaptiveLevel​

##### minAdaptiveLevel​

#### speaker-display-settings.v1.powerSave​

##### mode​

##### presenceDetection​

##### schedule​

#### Data types​

##### BrightnessRange​

##### ColorFormat​

##### DateLanguage​

##### PowerSaveModes​

##### PowerSaveTimerMinutes​

##### PresenceDetection​

##### Schedule​

##### ScheduleIdStr​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

This API is in BETA stage and provided for testing purposes. It is subject to backward-incompatible changes, including modifications to its functionality, behavior and availability. The API should not be used in production environments.

The VAPIX® Speaker Display Settings API enables configurations for the appearance and availability of the display clock, display brightness and localization.

This example will show you how to retrieve the full collection of settings.

This example will show you how to apply the appearance settings.

This example will show you how to apply the brightness settings.

This example will show you how to apply the power saving settings.

Properties

This entity has no properties.

Actions

This entity has no actions.

Properties

Actions

This entity has no actions.

Properties

Actions

This entity has no actions.

Properties

Actions

This entity has no actions.

```
GET /config/rest/speaker-display-settings/v1beta HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "appearance": {            "backgroundColor": "#000000",            "fontColor": "#670f0f",            "language": "en",            "showDate": true,            "showSeconds": false,            "use24HourClock": true        },        "brightness": {            "adaptiveBrightness": true,            "manualLevel": 6,            "maxAdaptiveLevel": 6,            "minAdaptiveLevel": 1        },        "powerSave": {            "mode": "presenceDetection",            "presenceDetection": {                "powerSaveTimerMinutes": 20            },            "schedule": {                "invert": false,                "scheduleId": "com.axis.schedules.office_hours"            }        }    }}
```

```
PATCH /config/rest/speaker-display-settings/v1beta/appearance HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "backgroundColor": "#000000",        "fontColor": "#670f0f",        "language": "en",        "showDate": true,        "showSeconds": false,        "use24HourClock": true    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/speaker-display-settings/v1beta/brightness HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "adaptiveBrightness": true,        "manualLevel": 6,        "maxAdaptiveLevel": 5,        "minAdaptiveLevel": 4    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/speaker-display-settings/v1beta/powerSave HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "mode": "alwaysOff",        "presenceDetection": {            "powerSaveTimerMinutes": 40        },        "schedule": {            "invert": true,            "scheduleId": "com.axis.schedules.office_hours"        }    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
speaker-display-settings.v1 (Root Entity)    ├── appearance (Entity)        ├── backgroundColor (Property)        ├── fontColor (Property)        ├── language (Property)        ├── showDate (Property)        ├── showSeconds (Property)        ├── use24HourClock (Property)    ├── brightness (Entity)        ├── adaptiveBrightness (Property)        ├── manualLevel (Property)        ├── maxAdaptiveLevel (Property)        ├── minAdaptiveLevel (Property)    ├── powerSave (Entity)        ├── mode (Property)        ├── presenceDetection (Property)        ├── schedule (Property)
```

- Description: Speaker Display Settings Root Entity.
- Type: Singleton
- Operations

Get
Set

Properties: appearance, brightness, powerSave
- Get
- Set

Properties: appearance, brightness, powerSave
- Properties: appearance, brightness, powerSave
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

Properties: appearance, brightness, powerSave
- Properties: appearance, brightness, powerSave

- Properties: appearance, brightness, powerSave

- Dynamic Support: No

- Description: Speaker Display Clock Entity.
- Type: Singleton
- Operations

Get
Set
- Get
- Set
- Properties: backgroundColor, fontColor, language, showDate, showSeconds, use24HourClock
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

- Dynamic Support: No

- Description: Color of the background.
- Datatype: ColorFormat
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Color of the text displayed.
- Datatype: ColorFormat
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Language of the date displayed.
- Datatype: DateLanguage
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: If set to true, the date will be displayed.
- Datatype: boolean
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: If set to true, seconds will be displayed.
- Datatype: boolean
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: If set to true, the clock will display the 24-hour format; otherwise, it will display the 12-hour format with AM/PM.
- Datatype: boolean
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Speaker Display Brightness Entity.
- Type: Singleton
- Operations

Get
Set

Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel
- Get
- Set

Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel
- Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel
- Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel

- Properties: adaptiveBrightness, manualLevel, maxAdaptiveLevel, minAdaptiveLevel

- Dynamic Support: No

- Description: Adaptive brightness ON/OFF. If ON, brightness will be automatically adjusted.
- Datatype: boolean
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Manual level of brightness set by user, in case adaptiveBrightness is set to false.
- Datatype: BrightnessRange
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Maximal screen brightness value.
- Datatype: BrightnessRange
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Minimal screen brightness value.
- Datatype: BrightnessRange
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Speaker Display Power Save Entity.
- Type: Singleton
- Operations

Get
Set

Properties: mode, presenceDetection, schedule
- Get
- Set

Properties: mode, presenceDetection, schedule
- Properties: mode, presenceDetection, schedule
- Attributes
- Dynamic Support: No

- Get
- Set

Properties: mode, presenceDetection, schedule
- Properties: mode, presenceDetection, schedule

- Properties: mode, presenceDetection, schedule

- Description: Power saving mode can be alwaysOn, alwaysOff, schedule, presenceDetection.
- Datatype: PowerSaveModes
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Parameters belonging to the mode "presenceDetection".
- Datatype: PresenceDetection
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Parameters belonging to the mode "schedule".
- Datatype: Schedule
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Brightness range.
- Type: integer
- Minimum Value: 1
- Maximum Value: 7

- Description: Colors are represented using RGB hexadecimal values.
- Type: string
- Pattern: ^#[0-9a-fA-F]{6}$

- Description: String enums for supported languages.
- Type: string
- Enum Values: "de", "en", "es", "fr", "it"

- Description: String enum for power saving modes.
- Type: string
- Enum Values: "alwaysOn", "alwaysOff", "presenceDetection", "schedule"

- Description: Sets the display timeout in minutes, resetting if presence is detected.
- Type: integer
- Minimum Value: 1
- Maximum Value: 60

- Description: Parameters belonging to the mode "presenceDetection".
- Type: complex
- Fields

powerSaveTimerMinutes

Description: Time without presence before the display turns off.
Type: PowerSaveTimerMinutes
Nullable: No / Gettable: No
- powerSaveTimerMinutes

Description: Time without presence before the display turns off.
Type: PowerSaveTimerMinutes
Nullable: No / Gettable: No
- Description: Time without presence before the display turns off.
- Type: PowerSaveTimerMinutes
- Nullable: No / Gettable: No

- powerSaveTimerMinutes

Description: Time without presence before the display turns off.
Type: PowerSaveTimerMinutes
Nullable: No / Gettable: No
- Description: Time without presence before the display turns off.
- Type: PowerSaveTimerMinutes
- Nullable: No / Gettable: No

- Description: Time without presence before the display turns off.
- Type: PowerSaveTimerMinutes
- Nullable: No / Gettable: No

- Description: Parameters belonging to the mode "schedule".
- Type: complex
- Fields

invert

Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
Type: boolean
Nullable: No / Gettable: No


scheduleId

Description: ID of action engine schedule to follow.
Type: ScheduleIdStr
Nullable: Yes / Gettable: No
- invert

Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
Type: boolean
Nullable: No / Gettable: No
- Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
- Type: boolean
- Nullable: No / Gettable: No
- scheduleId

Description: ID of action engine schedule to follow.
Type: ScheduleIdStr
Nullable: Yes / Gettable: No
- Description: ID of action engine schedule to follow.
- Type: ScheduleIdStr
- Nullable: Yes / Gettable: No

- invert

Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
Type: boolean
Nullable: No / Gettable: No
- Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
- Type: boolean
- Nullable: No / Gettable: No
- scheduleId

Description: ID of action engine schedule to follow.
Type: ScheduleIdStr
Nullable: Yes / Gettable: No
- Description: ID of action engine schedule to follow.
- Type: ScheduleIdStr
- Nullable: Yes / Gettable: No

- Description: If set to true, the schedule will be inverted. Therefore, during the time-slot when the clock would normally be ON, it will be OFF instead.
- Type: boolean
- Nullable: No / Gettable: No

- Description: ID of action engine schedule to follow.
- Type: ScheduleIdStr
- Nullable: Yes / Gettable: No

- Description: Schedule ID string.
- Type: string
- Maximum Length: 100

