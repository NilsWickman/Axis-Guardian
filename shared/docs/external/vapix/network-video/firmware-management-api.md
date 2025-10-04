# Firmware management API

**Source:** https://developer.axis.com/vapix/network-video/firmware-management-api/
**Last Updated:** Sep 2, 2025

---

# Firmware management API

## Description​

### Firmware rollback​

## Overview​

### Model​

### Identification​

### Obsoletes​

## Common examples​

### Upgrade firmware​

### Rollback to previous firmware​

### Purge previous firmware​

### Get supported versions​

## API documentation​

### Status​

### Upgrade​

### Commit​

### Rollback​

### Purge​

### factoryDefault​

### stopAuto​

### Reboot​

### getSupportedVersions​

### General error codes​

The VAPIX® Firmware management API describes how to manage the firmware of the Axis products in order to:

The firmware rollback feature provides the option to undo a firmware upgrade. When using the feature, the firmware and its configurations will return to the state they were in before the upgrade.

There are several scenarios when a firmware rollback may be triggered:

The API consists of a single CGI, firmwaremanagement.cgi

The following CGIs are made obsolete by the firmwaremanagement.cgi:

Use this example to upgrade the Axis firmware. As part of the procedure, the product will also reboot.

In order to prevent an automatic firmware rollback when upgrading and the timeout argument is set, the user has to commit the upgrade by calling on the commit method. Should no timeout be available, the firmware will automatically be committed when the Axis product has completed its startup.

Upgrade without timeout:

Request body

Response on success

Response on failure

The Axis product reboots.

Verify the firmware version.

JSON request parameters

Response on success

Response on failure

API references:

Upgrade

Status

Upgrade with timeout:

JSON request parameters

Response on success

Response on failure

The Axis product reboots.

Optionally verify the firmware version.

JSON request parameters

Response on success

Response on failure

JSON request parameters

Response on success

Response on failure

API references:

Upgrade

Status

Commit

Use this example to revert a firmware upgrade to an earlier version in the event that an upgrade introduces some sort of unwanted behavior in the Axis product.

JSON request parameters

Response on success

Response on failure

JSON request parameters

Response on success

Response on failure

The Axis product reboots.

Verify the firmware version.

JSON request parameters

Response on success

Response on failure

API references

Status

Rollback

Use this example to prevent rollback to a previously installed firmware version by purging the inactive firmware. Note that rollback will no longer be possible after a successfully executed purge.

JSON request parameters

Response on success

Response on failure

Api references

Purge

Use this example to list the API versions supported by the Axis product to implement version skeptic client code.

JSON request parameters

Response on success

Response on failure

Api references

getSupportedVersions

Retrieve the current firmware status of the Axis product.

Request

The following table lists the JSON parameters for this CGI method.

Return value - Success

Response body syntax

Response data

activeFirmwareVersion=<string> Current firmware version.

activeFirmwarePart=<string> Current firmware part number.

inactiveFirmwareVersion=<string> Inactive firmware version. This is only present if an inactive firmware exists, which will be reported as "UNKNOWN" if the inactive firmware doesn’t support the automatic firmware rollback parameters.

isCommited=<boolean> True if current firmware is committed. False if the current firmware is uncommitted and will rollback on reboot. This is only present if an inactive firmware exists.

pendingCommit=<string> Pending auto commit.

"started" The current firmware will be automatically committed once the device has finished booting, see Upgrade. This is only present if the active firmware is uncommitted and an automatic commit is pending.

timeToRollback=<integer> Number of seconds left to automatic rollback. This is only present if active firmware is uncommitted and an automatic rollback is pending.

lastUpgradeAt=<string> The date and time when the Axis product was upgraded. This is only present if an inactive firmware exists.

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes.

Firmware upgrade is only allowed if the current firmware is committed. Any inactive firmware will be purged when an upgrade starts (even if the upgrade itself should fail) making a rollback to that firmware impossible. If you are downgrading to an older firmware version, you must set the factoryDefaultMode parameter to "hard".

Upgrade the firmware. After the Axis product has been upgraded with a new firmware it is rebooted as part of this method.

Request

The request shall be a multipart message, with the JSON message in the first part and the firmware file content in the second part.

The following table lists the JSON parameter for this CGI method.

Return value - Success

Response body syntax

Response data:

firmwareVersion=<string> New firmware version.

Return value - Failure

Response body syntax

Error codes

The following table lists error codes that can be returned from this method. General errors are listed under General error codes.

Commit the current firmware and stops automatic firmware rollback if it was pending.

This method does nothing if the firmware is already committed.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Response data

firmwareVersion=<string> Current firmware version.

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes.

Only the most recent upgrade can be rolled back. Any inactive firmware is purged when an upgrade starts, making it impossible to rollback more than one step. Applications and their data are not rolled back.

Rollback the firmware along with the configuration settings to the state it was in before the most recent upgrade.

This method can be used regardless if the active firmware is committed or not. Rollback will not be available after a purge or a factory default.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The following table lists the error codes that can be returned from this method. General errors are listed under General error codes.

Purge previous firmware to prevent rollback.

This can only be done when the current firmware is committed and no upgrade is in progress.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

The following table lists error codes that can be returned from this method. General errors are listed in General error codes.

Reset the parameters of the Axis product to factory defaults.

The Axis product is rebooted as part of performing this method.

All applications and ACAPs will then be removed or restored to pre-installed versions.

If the current firmware is committed, any inactive or pending firmware will be purged.

If the current firmware isn’t committed and there is no pending automatic rollback, current firmware will be committed and the inactive firmware will be purged.

Request

The following table lists the JSON parameters for this CGI method.

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes.

Stop pending auto rollback timer. This method will not commit the firmware.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes

Reboot the Axis product using the active firmware. The firmware will not rollback even it if has not been committed. If an automatic rollback is pending, it will remain so even after the reboot.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes.

A CGI method for retrieving the supported API versions. The returned list consists of the supported major versions, with highest supported minor versions. The version is for the API as a whole, i.e. for all methods in the CGI.

Request

The following table lists the JSON parameters for this CGI method:

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes returned by this method are listed in General error codes.

The following table lists general errors that can occur for any firmwaremanagement.cgi method. Errors that are specified for a method are listed under the API description for that method.

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
POST /axis-cgi/firmwaremanagement.cgi HTTP/1.1Content-Type: multipart/form-data; boundary=<boundary>Content-Length: <content length>--<boundary>Content-Type: application/json{  "apiVersion": "1.0",  "context": "abc",  "method": "upgrade"}--<boundary>Content-Type: application/octet-stream<firmware file content>--<boundary>--
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "upgrade",    "data": {        "firmwareVersion": "7.50.3"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "upgrade",    "error": {        "code": 421,        "message": "Upgrade failed due to image not matching device."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "data": {        "activeFirmwareVersion": "7.50.3",        "activeFirmwarePart": "1234568",        "inactiveFirmwareVersion": "7.40.1.2",        "isCommited": true,        "lastUpgradeAt": "2018-08-12T11:55:12+01:00"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "error": {        "code": 500,        "message": "Unexpected internal error."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "upgrade",    "params": {        "autoRollback": "50"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "upgrade",    "data": {        "firmwareVersion": "7.50.3"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "upgrade",    "error": {        "code": 421,        "message": "Upgrade failed due to image not matching device."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "data": {        "activeFirmwareVersion": "7.50.3",        "activeFirmwarePart": "1234568",        "inactiveFirmwareVersion": "7.40.1.2",        "isCommited": false,        "timeToRollback": 48,        "lastUpgradeAt": "2018-08-12T11:55:12+01:00"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "error": {        "code": 500,        "message": "Unexpected internal error."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "commit"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "commit",    "data": {        "firmwareVersion": "7.50.3"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "commit",    "error": {        "code": 500,        "message": "Unexpected internal error."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "data": {        "activeFirmwareVersion": "7.50.3",        "activeFirmwarePart": "1234568",        "inactiveFirmwareVersion": "7.40.1.2",        "isCommited": true,        "lastUpgradeAt": "2018-08-12T11:55:12+01:00"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "error": {        "code": 500,        "message": "Unexpected internal error."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "rollback"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "rollback",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "rollback",    "error": {        "code": 404,        "message": "No old firmware exists."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "data": {        "activeFirmwareVersion": "7.40.1.2",        "activeFirmwarePart": "1234567"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "status",    "error": {        "code": 500,        "message": "Unexpected internal error."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "purge"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "purge",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "purge",    "error": {        "code": 412,        "message": "Current firmware is not active."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 417,        "message": "Unsupported API version."    }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "status",  "data": {    "activeFirmwareVersion": <string>,    "activeFirmwarePart": <string>,    "inactiveFirmwareVersion": <string>,    "isCommited": <boolean>,    "pendingCommit": <string>,    "timeToRollback": <integer>,    "lastUpgradeAt": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "upgrade",  "data": {    "firmwareVersion": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "commit",  "data": {    "firmwareVersion": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "rollback",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "purge",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "factoryDefault",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "stopAuto",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "reboot",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://<servername>/axis-cgi/firmwaremanagement.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

- Retrieve the status for the current firmware.
- Upgrade the firmware.
- Rollback firmware to the previously installed version.
- Restore configurations back to the factory defaults.
- Reboot the Axis product.

- The Axis products detects a problem when starting the newly upgraded firmware.
- It may be externally requested through the rollback method.
- A rollback timer expires. The time-out value can be provided in the upgrade method.
- The Axis product is manually rebooted (e.g. power cycled).

- Property: Properties.FirmwareManagement.Version=1.3
- API Discovery: id=fwmgr
- Firmware: 7.40 and later

- firmwareupgrade.cgi: Upgrade
- factorydefault.cgi: factoryDefault
- hardfactorydefault.cgi: factoryDefault
- restart.cgi: Reboot

- Upgrade the firmware

- The Axis product reboots.
- Verify the firmware version.

- Upgrade firmware.

- The Axis product reboots.
- Optionally verify the firmware version.

- Commit the firmware upgrade before the timeout triggers a rollback.

- Check the current firmware status.

- Rollback to previous firmware.

- The Axis product reboots.
- Verify the firmware version.

- Purge previous firmware.

- Get a list of supported API versions.

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the cgi echoes it back in the response. |
| method | String | status |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the cgi echoes it back in the response. |
| method | String | upgrade |
| params | JSON object | Container for the method specific parameters listed below. |
| factoryDefaultMode | String | Optional. Reset parameters to their factory default values. none (default): Upgrade and preserve the current settings. soft: All parameters are set to their factory default values except those listed in factoryDefault. hard: All parameters are set to their factory default values. Note: All applications and ACAP:s are removed or restored to pre-installed versions on the "hard" and "soft" options. |
| autoCommit | String | Optional. Controls when the new firmware will be automatically committed by the device. never: The firmware is never committed automatically and must be committed via the commit method. boot: The firmware is committed when it starts booting. started: The firmware is committed when the device has finished booting. default: The same as never if autoRollback is not set to default, otherwise it is the same as boot as long as factoryDefaultMode is not none, or otherwise started if neither. Note: This parameter is ignored if the new firmware doesn't support automatic rollback. |
| autoRollback | String | Optional. Controls when the new firmware will automatically consider the upgrade failed and revert to the previous firmware. never: The firmware is never rollbacked automatically. However a rollback will still occur if the system encounters a major fault or if the power is interrupted before the firmware has been committed. A numeric value specifies the number of minutes after boot until the system automatically performs a rollback unless a commit (automatic or externally requested) has been performed. default: The same as never if autoCommit is not also set to default. Otherwise, the default is to automatically rollback after 10 minutes. Note: This parameter is ignored if the new firmware doesn’t support automatic rollback |

| Code | Description |
| --- | --- |
| 409 | Upgrade without factory default not allowed to an older firmware version. |
| 410 | Upgrade failed due to firmware version revoked. |
| 412 | Upgrade not allowed due to active firmware is uncommitted. |
| 415 | Upgrade failed due to invalid image. |
| 421 | Upgrade failed due to image not matching device. |
| 422 | Upgrade failed due to image missing a mandatory digital signature. |
| 424 | Upgrade failed due to image referencing an unknown custom firmware certificate. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. The user sets this value and the cgi echoes it back in the response. |
| method | String | commit |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the cgi echoes it back in the response. |
| method | String | rollback |

| Code | Description |
| --- | --- |
| 404 | No old firmware exists to rollback to. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the cgi echoes it back in the response. |
| method | String | purge |

| Code | Description |
| --- | --- |
| 412 | Active firmware is not committed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the applications echoes it back in the response. |
| method | String | factoryDefault |
| params | JSON object | Container for the method specific parameters listed below. |
| factoryDefaultMode | String | Optional mode. soft (default): All settings are set to their factory default values except:- The boot protocol (Network.BootProto)- The static IP address (Network.IPAddress)- The default router (Network.DefaultRouter)- The subnet mask (Network.SubnetMask)- The broadcast IP address (Network.Broadcast)- The system time- The IEEE 802.1X settings.Since these parameters are not reset the Axis product can be accessed on the same address. This is especially important when using a NAT router. hard: All settings, including the IP addresses, are set to their factory default values. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the application echoes it back in the response. |
| method | String | stopAuto |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the application echoes it back in the response. |
| method | String | reboot |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | Optional context string. Client sets this value and the application echoes it back in the response. |
| method | String | getSupportedVersions |

| Code | Description |
| --- | --- |
| 400 | Message could not be parsed or contains unknown parameters or values. |
| 405 | Unknown method in request. |
| 417 | API version not compatible. |
| 423 | System is busy with another firmware management request. |
| 500 | Unexpected internal error. |

