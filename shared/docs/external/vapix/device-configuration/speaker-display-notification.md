# Speaker Display Notification

**Source:** https://developer.axis.com/vapix/device-configuration/speaker-display-notification/
**Last Updated:** Sep 10, 2025

---

# Speaker Display Notification

## Use cases​

### Send a simple notification with horizontally scrolling large size text​

### Send a simple notification with vertically scrolling medium size text​

### Send a simple notification with non-scrolling medium size text with indefinite duration​

### Stop the ongoing notification​

## API definition​

### Structure​

### Entities​

#### speaker-display-notification.v1​

#### Properties​

#### Actions​

##### simple​

##### stop​

### Data types​

#### ColorFormat​

#### DurationInt​

#### NotificationResponse​

#### ScrollDirectionEnum​

#### ScrollSpeedInt​

#### SimpleDurationObject​

#### SimpleDurationType​

#### SimpleMessageStr​

#### SimpleNotificationRequest​

#### StopNotificationRequest​

#### StopNotificationResponse​

#### TextSizeEnum​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

The VAPIX® Speaker Display Notification API provides an interface to trigger new notifications on the display, or stop an ongoing notification.
It also provides the possibility to stop an ongoing notification.

Note that this API doesn't support coexistence. When used for critical installations, make sure that only one application controls the display.

This example will show you have to send a simple notification with large horizontally scrolling text.
The response will contain the estimated duration of the notification in milliseconds.

This example will show you have to send a simple notification with vertically scrolling medium size text.
The response will contain the estimated duration of the notification in milliseconds.

This example will show you how to send a simple notification with non-scrolling medium size text that will last on the display until interrupted by another request.
The response will contain a duration of 0 to indicate that the notification will last indefinitely.

This example will show you how to stop an ongoing notification.

This entity has no properties.

For simple notification, the following duration types are accepted:

The message field is mandatory, however an empty string will be accepted.
In case of a horizontally scrolling notification, newline characters will be ignored.
In case of a static notification (scroll speed 0) an attempt will be made to fit the text within display dimensions, but the text might still be trimmed.

Description: Response received from stop notification request.
Type: complex
Fields

```
POST /config/rest/speaker-display-notification/v1/simple HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "message": "A horizontally scrolling notification",        "textColor": "#FFFFFF",        "textSize": "large",        "scrollDirection": "fromRightToLeft",        "scrollSpeed": 5,        "duration": {            "type": "repetitions",            "value": 3        }    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "duration": 15000    }}
```

```
POST /config/rest/speaker-display-notification/v1/simple HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "message": "A vertically scrolling notification",        "textColor": "#FFFFFF",        "backgroundColor": "#000000",        "textSize": "medium",        "scrollDirection": "fromBottomToTop",        "scrollSpeed": 8,        "duration": {            "type": "time",            "value": 10000        }    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "duration": 10000    }}
```

```
POST /config/rest/speaker-display-notification/v1/simple HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "message": "A static text notification",        "textColor": "#FFFFFF",        "backgroundColor": "#000000",        "textSize": "medium",        "scrollSpeed": 0    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "duration": 0    }}
```

```
POST /config/rest/speaker-display-notification/v1/stop HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {}}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {}}
```

```
speaker-display-notification.v1 (Root Entity)    ├── simple (Action)    ├── stop (Action)
```

- Description: Speaker Display Notification Root Entity.
- Type: Singleton
- Operations

Get
- Get
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

- Dynamic Support: No

- Description: A simple notification which can either be static or scrolling.
- Request Datatype: SimpleNotificationRequest
- Response Datatype: NotificationResponse
- Trigger Permissions: admin

- Description: Stop the ongoing notification.
- Request Datatype: StopNotificationRequest
- Response Datatype: StopNotificationResponse
- Trigger Permissions: admin

- Description: Colors are represented using RGB hexadecimal values.
- Type: string
- Pattern: ^#[0-9a-fA-F]{6}$

- Description: The value of the duration. Limited to a signed 32-bit integer.
- Type: integer
- Minimum Value: 1
- Maximum Value: 2147483647

- Description: Response received from a simple notification request.
- Type: complex
- Fields

duration

Description: Duration of the notification in milliseconds.
Type: integer
Nullable: No / Gettable: No
- duration

Description: Duration of the notification in milliseconds.
Type: integer
Nullable: No / Gettable: No
- Description: Duration of the notification in milliseconds.
- Type: integer
- Nullable: No / Gettable: No

- duration

Description: Duration of the notification in milliseconds.
Type: integer
Nullable: No / Gettable: No
- Description: Duration of the notification in milliseconds.
- Type: integer
- Nullable: No / Gettable: No

- Description: Duration of the notification in milliseconds.
- Type: integer
- Nullable: No / Gettable: No

- Description: Direction of the scrolling.
- Type: string
- Enum Values: "fromRightToLeft", "fromBottomToTop"

- Description: Scroll speed range.
- Type: integer
- Minimum Value: 0
- Maximum Value: 10

- Description: Duration object for simple notification.
- Type: complex
- Fields

type

Description: Duration type can be repetitions, time or timeCompleteMessage.
Type: SimpleDurationType
Nullable: No / Gettable: No


value

Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
Type: DurationInt
Nullable: No / Gettable: No
- type

Description: Duration type can be repetitions, time or timeCompleteMessage.
Type: SimpleDurationType
Nullable: No / Gettable: No
- Description: Duration type can be repetitions, time or timeCompleteMessage.
- Type: SimpleDurationType
- Nullable: No / Gettable: No
- value

Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
Type: DurationInt
Nullable: No / Gettable: No
- Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
- Type: DurationInt
- Nullable: No / Gettable: No

- type

Description: Duration type can be repetitions, time or timeCompleteMessage.
Type: SimpleDurationType
Nullable: No / Gettable: No
- Description: Duration type can be repetitions, time or timeCompleteMessage.
- Type: SimpleDurationType
- Nullable: No / Gettable: No
- value

Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
Type: DurationInt
Nullable: No / Gettable: No
- Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
- Type: DurationInt
- Nullable: No / Gettable: No

- Description: Duration type can be repetitions, time or timeCompleteMessage.
- Type: SimpleDurationType
- Nullable: No / Gettable: No

- Description: If type is repetitions, the message will be displayed for a number of repetitions; otherwise, it will be displayed for a duration in milliseconds.
- Type: DurationInt
- Nullable: No / Gettable: No

- repetitions: number of times the message will be displayed on the screen.
- time: the message will be displayed on the screen for a duration given in milliseconds.
- timeCompleteMessage: the message will be displayed on the screen for at least a duration given in milliseconds but rounded up to the nearest complete repetition, ensuring that the message will be entirely displayed before it stops.

- Description: String enums for supported duration types for simple notification.
- Type: string
- Enum Values: "repetitions", "time", "timeCompleteMessage"

- Description: String for simple notification message.
- Type: string
- Maximum Length: 1000

- Description: Available fields to send a simple notification request.
- Type: complex
- Fields

backgroundColor

Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No


duration

Description: Duration. Default is infinite repetitions.
Type: SimpleDurationObject
Nullable: No / Gettable: No


message

Description: The display message. Max length is 1000 characters.
Type: SimpleMessageStr
Nullable: No / Gettable: No


scrollDirection

Description: The scrolling direction. Can be either from right to left or bottom to top.
Type: ScrollDirectionEnum
Nullable: No / Gettable: No


scrollSpeed

Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
Type: ScrollSpeedInt
Nullable: No / Gettable: No


textColor

Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No


textSize

Description: The text size. Can be either small, medium or large.
Type: TextSizeEnum
Nullable: No / Gettable: No
- backgroundColor

Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No
- Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No
- duration

Description: Duration. Default is infinite repetitions.
Type: SimpleDurationObject
Nullable: No / Gettable: No
- Description: Duration. Default is infinite repetitions.
- Type: SimpleDurationObject
- Nullable: No / Gettable: No
- message

Description: The display message. Max length is 1000 characters.
Type: SimpleMessageStr
Nullable: No / Gettable: No
- Description: The display message. Max length is 1000 characters.
- Type: SimpleMessageStr
- Nullable: No / Gettable: No
- scrollDirection

Description: The scrolling direction. Can be either from right to left or bottom to top.
Type: ScrollDirectionEnum
Nullable: No / Gettable: No
- Description: The scrolling direction. Can be either from right to left or bottom to top.
- Type: ScrollDirectionEnum
- Nullable: No / Gettable: No
- scrollSpeed

Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
Type: ScrollSpeedInt
Nullable: No / Gettable: No
- Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
- Type: ScrollSpeedInt
- Nullable: No / Gettable: No
- textColor

Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No
- Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No
- textSize

Description: The text size. Can be either small, medium or large.
Type: TextSizeEnum
Nullable: No / Gettable: No
- Description: The text size. Can be either small, medium or large.
- Type: TextSizeEnum
- Nullable: No / Gettable: No

- backgroundColor

Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No
- Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No
- duration

Description: Duration. Default is infinite repetitions.
Type: SimpleDurationObject
Nullable: No / Gettable: No
- Description: Duration. Default is infinite repetitions.
- Type: SimpleDurationObject
- Nullable: No / Gettable: No
- message

Description: The display message. Max length is 1000 characters.
Type: SimpleMessageStr
Nullable: No / Gettable: No
- Description: The display message. Max length is 1000 characters.
- Type: SimpleMessageStr
- Nullable: No / Gettable: No
- scrollDirection

Description: The scrolling direction. Can be either from right to left or bottom to top.
Type: ScrollDirectionEnum
Nullable: No / Gettable: No
- Description: The scrolling direction. Can be either from right to left or bottom to top.
- Type: ScrollDirectionEnum
- Nullable: No / Gettable: No
- scrollSpeed

Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
Type: ScrollSpeedInt
Nullable: No / Gettable: No
- Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
- Type: ScrollSpeedInt
- Nullable: No / Gettable: No
- textColor

Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
Type: ColorFormat
Nullable: No / Gettable: No
- Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No
- textSize

Description: The text size. Can be either small, medium or large.
Type: TextSizeEnum
Nullable: No / Gettable: No
- Description: The text size. Can be either small, medium or large.
- Type: TextSizeEnum
- Nullable: No / Gettable: No

- Description: Background color. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No

- Description: Duration. Default is infinite repetitions.
- Type: SimpleDurationObject
- Nullable: No / Gettable: No

- Description: The display message. Max length is 1000 characters.
- Type: SimpleMessageStr
- Nullable: No / Gettable: No

- Description: The scrolling direction. Can be either from right to left or bottom to top.
- Type: ScrollDirectionEnum
- Nullable: No / Gettable: No

- Description: Message scroll speed. 1 is slow and 10 is fast. 0 means no scrolling.
- Type: ScrollSpeedInt
- Nullable: No / Gettable: No

- Description: The color of the message letters. Format is RGB in hex 6 digits '#RRGGBB'.
- Type: ColorFormat
- Nullable: No / Gettable: No

- Description: The text size. Can be either small, medium or large.
- Type: TextSizeEnum
- Nullable: No / Gettable: No

- Description: Request to stop a simple notification.
- Type: complex
- Fields

- Description: Size of the text.
- Type: string
- Enum Values: "small", "medium", "large"

