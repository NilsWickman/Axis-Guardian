# Log API

**Source:** https://developer.axis.com/vapix/device-configuration/log-api/
**Last Updated:** Sep 10, 2025

---

# Log API

## Overview​

## Use cases​

### Save logs to the persistent storage​

#### Turn on/off the saving of logs to the persistent storage​

#### Check status of saving logs to the persistent storage​

#### Clear the log file from the persistent storage​

### Write message into the system log​

## API definition​

### Structure​

### Entities​

### Data types​

The VAPIX® Log API makes it possible to manage personalized log configurations on your Axis device. With it, you will be able to:

These calls allow the users to save logs during a set time frame without having to care about log rotation or camera rebooting and to write messages into existing logs.

The log file can be retrieved through serverreport.cgi with option tar_all. Request to CGI with this option can get all log files from the camera.

Saving logs to the persistent storage shouldn't always be turned on, since the persistent storage will become full. Free up device space by clearing the persistent log.

Avoid writing many large messages during a short period of time, since this can overflow the storage space.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

This API is in ALPHA stage. The API is provided for testing purposes and is subject to backward-incompatible changes, including modifications to functionality, behavior, and availability. Please don't use in production environment.

Capture logs between boot sessions. This is achieved by:

Turn on saving logs to the persistent storage.

Reboot device (through firmwaremanagement.cgi with method Reboot).

Turn off saving logs to the persistent storage.

Retrieve the log file on the persistent storage (through serverreport.cgi with option tar_all).

Clear log file on the persistent storage to free up device space.

Logs of all severity levels are saved to the persistent storage.

enabled is set to true/false to turn on/off the saving of logs to the persistent storage. The following example will show you how to turn on the saving of logs to the persistent storage.

Example

Get the value of enabled to check whether the logging to the persistent storage is turned on.

Example

Trigger the action to clear the log file.

Example

Write a message into the system log with a user selected severity level.

Example

log.v1

Properties

This entry has no properties

Actions

writeMessage

log.v1.persistent

Properties

enabled

Actions

clearLog

```
PATCH /config/rest/log/v1alpha/persistent/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": true}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
GET /config/rest/log/v1alpha/persistent/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": true}
```

```
POST /config/rest/log/v1alpha/persistent/clearLog HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {}}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
POST /config/rest/log/v1alpha/writeMessage HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "msg": "message",    "severity": 7  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
log.v1 (Root Entity)  writeMessage (Action)  persistent (Entity)    enabled (Property)    clearLog (Action)
```

- Turn on/off saving logs to the persistent storage and check the current status.
- Clear log content from the persistent storage.
- Write messages into the system log.

- Turn on saving logs to the persistent storage.
- Reboot device (through firmwaremanagement.cgi with method Reboot).
- Turn off saving logs to the persistent storage.
- Retrieve the log file on the persistent storage (through serverreport.cgi with option tar_all).
- Clear log file on the persistent storage to free up device space.

- Description: Log root object
- Type: Singleton
- Operations: GET
- Attributes: Dynamic Support: No

- Description: Write log message to the system log
- Request Datatype: WriteMessageRequest
- Response Datatype: Empty Object
- Trigger Permissions: admin

- Description: Status of saving logs to the persistent storage
- Type: Singleton
- Operations: GET
- Attributes: Dynamic Support: No

- Description: Whether it is enabled to save logs to the persistent storage
- Datatype: boolean
- Operations:

GET - Permissions: admin, operator, viewer
SET - Permissions: admin
- GET - Permissions: admin, operator, viewer
- SET - Permissions: admin
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Rang: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- GET - Permissions: admin, operator, viewer
- SET - Permissions: admin

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Description: Clear log file storing all logs
- Request Datatype: Empty Object
- Trigger Permissions: admin

| LogMsg |  |
| --- | --- |
| Description: | The message part of the log encoded in UTF-8 |
| Type: | string |
| Minimum Length: | 0 |
| Maximum Length: | 4096 |
| Pattern: | ^.*$ |

| LogSeverity |  |
| --- | --- |
| Description: | Severity as defined by RFC5424 |
| Type: | integer |
| Minimum Value: | 0 |
| Maximum Value: | 7 |

| WriteMessageRequest |  |  |
| --- | --- | --- |
| Description: | The message to be logged, it contains the severity level of the message and the message itself. |  |
| Type: | complex |  |
| Fields: | msg | Description: Text that provides information of the event Type: LogMsg Nullable: No Gettable: No |
|  | severity | Description: Severity level of this message, default value is 6 meaning "Informational" level Type: LogSeverity Nullable: Yes Gettable: No |

