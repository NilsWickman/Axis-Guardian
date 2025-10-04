# System settings

**Source:** https://developer.axis.com/vapix/network-video/system-settings/
**Last Updated:** Aug 28, 2025

---

# System settings

## Description​

## Prerequisites​

### Identification​

## Add, modify and delete user accounts​

## Factory default​

## Hard factory default​

## AXIS OS upgrade​

## Restart server​

## Server report​

### Description​

### HTTP API​

### Common examples​

## Logs​

### Parameters​

### HTTP API​

#### System log​

#### Access log​

## System date and time​

### Parameters​

The HTTP-based video interface provides the functionality for configuring system settings. This document describes the general syntaxes, requests and values that are used for general configurations of your Axis product.

The following CGIs are described in this document:

The pwdgrp.cgi is used to add a new user account with password and group membership, modify the information and remove a user account.

Identification

With the following arguments and values:

It is not advisable to create user access data in the URL, as that might compromise security. Instead, pass the arguments to pwdgrp.cgi in the request body.

Example 1:

Create the initial admin account on the device. This must be done to log in to the device for the first time. The initial admin account has the following restrictions on devices running AXIS OS versions older than 11.5:

The only restriction on devices running AXIS OS 11.5 and later is that the role must be Administrator with PTZ control.

Since logging in to the device is impossible at this stage, no authentication is required to create it. This changes as soon as this user has been created however, and authentication and admin privileges will be required for all future user handling operations.

Response

Example 2:

Create a new user account with administrator and PTZ control privileges.

Response

Example3:

Change the password of an existing account.

Response

Example 4:

Remove an account.

Response

Example 5:

List groups and users. In this example Joe is the administrator, Ellen is the operator with PTZ rights and Frank is the viewer without PTZ rights.

The digusers parameter is used to list all created users , however, admin, operator, viewer and ptz are all access group rights. This means that Joe, who is the administrator, will be listed in all groups, while Ellen is only visible in operator, viewer and ptz, as her account only has the access rights to these.

Response:

Example 6:

Create an account with enforced VAPIX® password standards.

Response

Error Responses:

Example 7:

Example 8:

If the action is omitted or is not one of add, update, remove or get.

Example 9:

No user name was supplied, or the user name contains characters other than A-Z, a-z or 0-9.

Example 10:

The user name is not appropriate for the action.

Example 11:

No admin user has been created and the user that attempted to be added is not a valid initial admin user.

Example 12:

No admin user has been created. Start by creating one and use it to login and perform the requested operation.

See factoryDefault in the Firmware management API for updated information.

The factorydefault.cgi is used to reset to factory default. All settings are set to their factory default values except.

Since these parameters are not reset the Axis product can be accessed on the same address. This is especially important when using NAT router. After the Axis product has been reset to factory default it is restarted as part of this function.

Syntax:

Response:

See factoryDefault in the Firmware management API for updated information.

The hardfactorydefault.cgi is used to reset to factory default. All settings, including the IP addresses, are set to their factory default values. After the Axis product has been reset to factory default it is restarted as part of this function.

Syntax:

Response:

See Upgrade in the Firmware management API for updated information.

The firmwareupgrade.cgi is used to upgrade the AXIS OS version. After the upgrade, the device will be restarted automatically.

Syntax:

With the following arguments and values:

The file content is provided in the HTTP body according to the format given in RFC 1867. The body is created automatically by the browser if using HTML form with input type "file".

Body:

For more AXIS OS upgrade options, see Firmware management API

See Reboot in the Firmware management API for updated information.

The restart.cgi is used to restart the Axis product.

Syntax:

Response:

The serverreport.cgi is used to generate and return a server report. This report is useful as an input when requesting support. The report includes product information, parameter settings and system logs.

Example 1: Get the server report as text

Response

Example 2: Get the server report as a .zip-file

Response

Example 3: Get the server report and a snapshot image with the current image settings as a .zip-archive

Response

Log.Access

These parameters control inclusion of information in the client access log.

Parameter Log.Access is not available in AXIS OS 5.60 and later.

Log.Access

Log.System

These parameters control inclusion of information in the system log.

Parameter Log.System is not available in AXIS OS 5.60 and later.

Log.System

MailLogd

Parameters for log levels to send as e-mail.

MailLogd

The systemlog.cgi is used to retrieve system log information. The level of information included in the log is set in the Log.System parameter group.

Syntax:

Response:

Body:

The accesslog.cgi is used to retrieve client access log information. The level of information included in the log is set in the Log.Access parameter group.

Syntax:

Response

Body:

This API will no longer receive updates. For a newer version on how to configure date, time and time zones, see Time API.

Get or set the system date and time.

Time

The parameters in the time group control the common time information for the time zone, how date and time are synchronized and the offset related to the chosen time zone and Coordinated Universal Time, UTC.

Time

Set the TimeZone.

This timezone, standard time named GMT and daylight saving time named BST, has daylight saving time. The standard local time is GMT. Daylight saving time, 1 hour ahead of GMT, starts the last Sunday in March at 01:00 and ends the last Sunday in October at 02:00.

Time.DST

The parameter in the Time.DST group controls the Daylight Saving Time (DST).

Time.DST

Time zone

POSIXTimeZone specifies the time zone with or without DST. The value is added according to the following syntax:

<name>``<offset>[<dst name>[dst offset>[,<start rule>,<stop rule>]]]

<name> and <dst name> = The name of the time zone without and with DST. A name is at least 3 characters long and at most 6 characters long. It can be unquoted or quoted. An unqouted name may only contain the characters A-Z and a-z. A quoted name starts with the < character and ends with a > character. It can have the characters A-Z, a-z, 0-9, - and +.

<offset> and <dst offset> = The offset for the time zone and the daylight saving time, respectively. An offset specifies the amount of time that when added to the local time is equal to UTC. For example the offset for Paris, France, without daylight saving time, is -1 and the offset for Chicago, Ill., without daylight saving time, is +6. Offsets are specified as HH:MM:SS (hours, 0-24; minutes 0-59 and seconds 0-59) preceded by '-' indicating a negative offset or an optional '+', indicating a positive offset. Minutes and seconds are optional, thus the valid formats are "HH" "HH:MM" "HH:MM:SS". The dst offset may be omitted and will then default to one hour ahead of the zone's standard time.

<start rule> and <stop rule> = The daylight saving time start and stop rules are specified in the form date or date/time. The date is specified in the form Month.Week.Day, Jday, or day. The Month.Week.Dayform sets the month (1-12), week (1-5, with 5 meaning the last week in Month that Day occurs) and day (0-6, 0 is Sunday). The Jn form sets the n:th day (1-365, leap days are not counted). The n form sets the day (0-365, leap days are counted; day 365 thus only exists in leap years).

The time is specified as HH, HH:MM or HH:MM:SS, as the offsets above. It is the local time for the DST transition. The time is always positive and must not be preceded by a sign. If the time is omitted the daylight saving time transition occurs at 02:00:00.

Example: If a zone has a 1 hour DST to standard time offset and the transition time to DST is 02:00 then 01:59:59 will be followed by 03:00:00. If the transition time from DST to standard time in the same zone is 02:00 then 01:59:59 (daylight saving time) will be followed by 01:00:00 (standard time).

Time.NTP

The parameters in the Time.NTP set time and date with the NTP protocol.

Time.NTP

```
http://<servername>/axis-cgi/pwdgrp.cgi<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=add&user=root&pwd=foo&grp=root&sgrp=admin:operator:viewer:ptz
```

```
Created account root.
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=add&user=joe&pwd=foo&grp=users&sgrp=admin:operator:viewer:ptz&comment=Joe
```

```
Created account joe.
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=update&user=joe&pwd=bar
```

```
Modified account joe.
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=remove&user=joe
```

```
Removed account joe.
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=get
```

```
admin="root,joe"operator="root,joe,ellen"viewer="root,joe,ellen,frank"ptz="root,joe,ellen"digusers="root,joe,ellen,frank"
```

```
http://<servername>/axis-cgi/pwdgrp.cgi?action=add&user=joe&pwd=foo&grp=users&sgrp=admin:operator:viewer:ptz&comment=Joe&strict_pwd=1
```

```
Modified the account joe.
```

```
Error: consult the system log file.
```

```
Error: action operation type.
```

```
Error: account user name.
```

```
Error: malformed action operation, <action>.
```

```
Error: not a valid initial admin user.
```

```
Error: initial admin user must be created first.
```

```
http://<servername>/axis-cgi/factorydefault.cgi
```

```
<html response>
```

```
http://<servername>/axis-cgi/hardfactorydefault.cgi
```

```
<html response>
```

```
http://<servername>/axis-cgi/firmwareupgrade.cgi[?<argument>=<value>]
```

```
POST /axis-cgi/firmwareupgrade.cgi?type=normal HTTP/1.0Content-Type: multipart/form-data; boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name=<name>;filename="<file name>"Content-Type: application/octet-stream<AXIS OS file content>--<boundary>
```

```
http://<servername>/axis-cgi/restart.cgi
```

```
<html response>
```

```
http://<servername>/axis-cgi/serverreport.cgi[?<argument>=<value>]
```

```
http://<servername>/axis-cgi/serverreport.cgi?mode=text
```

```
<server report>
```

```
http://<servername>/axis-cgi/serverreport.cgi?mode=zip
```

```
<.zip-file>
```

```
http://<servername>/axis-cgi/serverreport.cgi?mode=zip_with_image
```

```
<message>
```

```
http://<servername>/axis-cgi/systemlog.cgi[?<argument>=<value>]
```

```
<system log information>
```

```
http://<servername>/axis-cgi/accesslog.cgi
```

```
<access log information>
```

```
http://myserver/axis-cgi/param.cgi?action=update&Time.POSIXTimeZone=GMT0BST,M3.5.0/1,M10.5.0
```

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later.

- API Discovery: id=user-management
- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later
- Access control: admin (Admin privileges are required if an admin user exists)
- Method: GET/POST

- The user name must be root and the role must be Administrator with PTZ control.
- The comment parameter must be either empty or omitted.
- This user can not be deleted, and can only be created once.

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP Code: 200 OK
- Content-Type: text/html

- HTTP code: 401 Unauthorized
- Content-Type: text/html

- HTTP code: 401 Unauthorized
- Content-Type: text/html

- The boot protocol (Network.BootProto).
- The static IP address (Network.IPAddress).
- The default router (Network.DefaultRouter).
- The subnet mask (Network.SubnetMask).
- The broadcast IP address (Network.Broadcast).
- The system time.
- The IEEE 802.1X settings.

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/html

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/html

- Access control: admin
- Method: POST

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/html

- Access control: Admin
- Method: GET/POST

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: application/zip

- HTTP Code: 200 OK
- Content-Type: application/zip

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

| Name | Description |
| --- | --- |
| pwdgrp.cgi | Add, delete and manage user accounts. |
| factorydefault.cgi | Reload factory default. Some parameters are not set to their factory default value. |
| hardfactorydefault.cgi | Reload factory default. All parameters are set to their factory default value. |
| firmwareupgrade.cgi | Upgrade the AXIS OS version. |
| restart.cgi | Restart the Axis product. |
| serverreport.cgi | Get a server report from the Axis product. |
| systemlog.cgi | Get system log information. |
| accesslog.cgi | Get client log information. |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | add update remove get | add = Create a new user account. update = Change user account information of specified parameters if the user account exists. remove = Remove an existing user account. get = Get a list of the user accounts which belong to each group defined. |
| user=<string> Required if action=add. Adding a value to comment is optional. | String | The user account name (1-14 characters), a non-existing user account name. Valid characters are a-z, A-Z and 0-9. |
| pwd=<string> Required if action=add. Adding a value to comment is optional. | String | The password for the account. It must contain one or more characters. |
| grp=<string> Required if action=add. Adding a value to comment is optional. | String | An existing primary group account name. The recommended value for this argument is users. VAPIX® also supports the value root, but it should only be used when creating the initial user account. |
| sgrp=<string>[:<string>``...] Required if action=add. Adding a value to comment is optional. | <string>[:``<string>``...] | Colon separated existing secondary group account names. This argument sets the user access rights for the user account: The supported values for this group are: viewer = Viewer role. viewer:ptz = Viewer role, with PTZ control. operator:viewer = Operator role. operator:viewer:ptz = Operator role, with PTZ control. admin:operator:viewer = Admin role. admin:operator:viewer:ptz = Admin role, with PTZ control.Please note that the group names can be in any order. Please note: On Axis network door controllers, users assigned the viewer, operator, or admin roles can access PINs and card numbers in plain text through event metadata streaming. |
| comment=<string> Required if action=add. Adding a value to comment is optional. Optional in device software and service releases since autumn 2019. | String | Description of the user account. This value can be empty. |
| strict_pwd=<integer> | Integer | Set to 1 to enforce VAPIX® password standard. Valid characters for passwords are ASCII characters with byte codes in the range of 0x20 - 0x7E. The password must be within 64 characters. |

| Argument | Valid values | Description |
| --- | --- | --- |
| type=<string> | normal factorydefault | Specifies the type of AXIS OS upgrade. normal = Upgrade and restore old settings. factorydefault = All parameters are set to their default value. Default: normal. |

| Parameter | Valid value | Description |
| --- | --- | --- |
| mode=<string> | tar_all text zip zip_with_image Only available on products with application support. | The server report presentation mode. tar_all will return all log files (including system log, access log, audit log, etc) as a .tar file. text will return the server report as text. zip will return the server report as a .zip-file. zip_with_image will return report together with a snapshot image taken using the Image Appearance settings as a single .zip-file. Optional. If mode is not specified, the value defaults to text. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| MaxSize | 40000 | 1000 ... 100000 | admin: read, write | The maximum size of the access log. |
| Critical | detailed | off on detailed | admin: read, write | Set the level of critical messages that should be shown in the access log. |
| Warning | detailed | off on detailed | admin: read, write | Set the level of warning messages that should be shown in the access log. off = No warning messages will be shown. on = All suspected intrusions are shown. detailed = All suspected intrusions and access denied events are shown. |
| Informational | off | off on detailed | admin: read, write | Set the level of informational messages that should be shown in the access log. off = No informational messages will be shown. on = Most access information will be shown, but some similar and trivial messages are filtered out. detailed = All information will be shown. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| MaxSize | 40000 | 1000 ... 100000 | admin: read, write | The maximum size of the system log. |
| Critical | detailed | off on detailed | admin: read, write | Set the level of critical messages that should be shown in the system log. off = No critical messages will be shown. on = All critical messages will be shown. detailed = All critical messages will be shown. Note: Today there is no difference setting the level to on or detailed. |
| Warning | detailed | off on detailed | admin: read, write | Set the level of warning messages that should be shown in the system log. off = No warning messages will be shown. on = All warning messages will be shown. detailed = All warning messages will be shown. Note: Today there is no difference setting the level to on or detailed. |
| Informational | off | off on detailed | admin: read, write | Set the level of informational messages that should be shown in the system log. off = No informational messages will be shown. on = All informational messages will be shown. detailed = All informational messages will be shown. Note: Today there is no difference setting the level to on or detailed. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| LogSendLevel | 0 | 0 ... 3 | admin: read, write | Message that are sent in e-mail: 0 = None. 1 = Critical. 2 = Critical and Warning. 3 = Critical, Warning and Information. |
| ToEmail |  | <string> | admin: read, write | The e-mail address to where log messages are sent. |

| Parameter | Valid value | Description |
| --- | --- | --- |
| text=<string> | Any string that contains only letters and digits. | The log entries are filtered on this text. Log entries that contain this text will be shown in the web interface. Available on AXIS OS 11.11.45 and later. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| ObtainFromDHCP | yes | yes no | admin: read, write | DHCP servers may provide names/IP addresses for local/remote NTP servers. Enable this feature by setting this parameter to yes. |
| SyncSource | Product/release dependent. | PC NTP None Product/release dependent. Check the product’s release notes. | admin: read, write | The source to synchronize the time with. PC = Synchronize the time with the connected PC. NTP = Synchronize the time with a NTP server. None = Set the time manually. |
| POSIXTimeZone | GMT0BST,M3.5.0/1,M10.5.0 | <name>``<offset>[<dst name>[dst offset>[,<start rule>,<stop rule>]]] POSIX TZ rule strings as defined for the TZ variable in Chapter 8.3, The Open Group Base Specifications Issue 6 IEEE Std 1003.1, 2004. The ':' prefixed format is not allowed. | admin: read, write operator: read | This parameter specifies the time zone with and/or without DST. See section Time zone below for more information. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| Enabled | no | yes no | admin: read, write operator: read | Enable/disable DST. yes = Enable DST. no = Disable DST. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| Server | 0.0.0.0 | An IP address or a host name. | admin: read, write | The NTP server to connect to when synchronizing the time in the Axis product. |
| VolatileServer |  | An IP address or a host name. | admin: read | The name/IP address of the NTP server, received from the DHCP server. Only one NTP server is currently supported. The NTP server name/IP address will be valid only until the next DHCP renewal or reboot. |

