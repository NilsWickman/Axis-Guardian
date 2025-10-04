# Schedule service

**Source:** https://developer.axis.com/vapix/physical-access-control/schedule-service/
**Last Updated:** Aug 28, 2025

---

# Schedule service

## Schedule service guide​

### Setting a schedule​

#### Pulse and interval schedules​

#### Exception schedules​

### Checking schedule status​

### The RFC5545 syntax flavor​

### Example schedules​

## Schedule service API specification​

### InitializationDone data structure​

### ScheduleInfo data structure​

### Schedule data structure​

### ScheduleStatus data structure​

### ServiceCapabilities data structure​

### GetServiceCapabilities command​

### GetScheduleInfoList command​

### GetScheduleInfo command​

### GetScheduleList command​

### GetSchedule command​

### SetSchedule command​

### RemoveSchedule command​

### ScheduleActive command​

### ScheduleStatusReport command​

The Schedule service manages schedules for use by other services. Schedules can be used to allow or deny access to a resource, or used as triggers for actions.

Schedules are created using the axsch:SetSchedule API call. A basic example:

See section The RFC5545 syntax flavor for information about the schedule syntax.

There are default schedules in the system, which can be removed if desired. Use axsch:GetScheduleList to retrieve the list of available schedules.

A schedule can be an interval schedule or a pulse schedule. Interval and pulse schedules are set using the same API call but they generate different events.

Interval and pulse schedules are both created using axsch:Schedule. An interval schedule is created if the DTEND field exists in the VEVENT. If DTEND does not exist, a pulse schedule is created. For information about the schedule syntax, see The RFC5545 syntax flavor.

Exception schedules use the same syntax as ordinary schedules, but are specified in the ExceptionScheduleDefinition instead of the ScheduleDefinition. Exceptions are subtracted from the ScheduleDefinition, that is, exception schedules override schedules, as can be seen in the table below.

Active Schedule Overview

When multiple schedules and exception schedules are attached to a resource, this same table will apply. If any of the schedules are active, the outcome will be active, but if any of the schedules are in exception state, the total outcome will be inactive. This is useful to create a single schedule with only exceptions, such as a holiday schedule. This can then be reused on all resources where the same holidays should apply.

Note: It is always enough to look at the Active field to determine whether a schedule is currently active. If both the ScheduleDefinition and the ExceptionScheduleDefinition are active, the entire Schedule will be inactive. A Schedule will thus never be active if it is in an exception state.

There are two API calls that can be used to check the status of schedules: axsch:ScheduleActive and axsch:ScheduleStatusReport. The check if one or more specific schedules are active, use axsch:ScheduleActive. When checking multiple schedules, they are aggregated according to the following rule:

IF (Any schedule is active) AND NOT (Any exception schedule is active)

Examples:

Request

Request

Response

Response

To get a simultaneous report for all schedules in the system, use axsch:ScheduleStatusReport:

Request

Request

Response

Response

The schedule syntax is based on RFC5545 (iCalendar), the syntax used by calendaring applications such as Google CalendarTM and Microsoft OutlookR. The RFC5545 specification is quite extensive and only the subset that is relevant for access control applications is supported by the access control API:

Only local time is used.

No support for UTC time

No support for VTIMEZONE

No support for VALARM

DTSTART;VALUE=DATE is converted to a 24h interval event

Overlapping RDATE /RRULE instances within a single VEVENT are undefined

The following RRULE parameters are supported:

HOURLY, MINUTELY, SECONDLY

DAILY

WEEKLY, WEEKLY;BYDAY

MONTHLY, MONTHLY;BYMONTHDAY

YEARLY, YEARLY;BYMONTH

Office hours:

Weekends (starting with Friday evening):

Oneshot Interval:

Oneshot Pulse:

RDATE;VALUE=DATE:

Mixed RDATE/RRULE Interval:

COUNT and INTERVAL:

UNTIL and INTERVAL:

axsch = http://www.axis.com/vapix/ws/schedule

The Schedule service provides an API to configure and check schedules.

It is used by the PACS AccessControl / A2E service.

Schedule definitions is in iCalendar syntax according to RFC 5545, but only a subset of RFC 5545 is required to be supported.

The following iCalendar components, properties and parameters MUST be supported:

VCALENDAR: starts and ends the definition.

UID and VERSION: since the RFC says they are required.

VEVENT: Provide a grouping of component properties that describe an event.

DTSTAMP, DTSTART, DTEND SUMMARY, DESCRIPTION

may be used by user interface, not interpreted.

TZID - if VTIMEZONE: supported.

RRULE and RDATE: to specify recurrances:

RDATE: allows you to specify a list of date, periods or date-times.

RDATE: with DATE-TIME, DATE and PERIOD VALUE types, e.g.

RRULE: allows you to specify recurring events on a minutely, hourly, daily, weekly, montly and yearly basis etc.

The following is optional:

VTIMEZONE: if not supported, all times not in UTC time is assumed to be in the device local timezone as specified in the Device service.

VALARM, VTODO, VJOURNAL, VFREEBUSY

typically not applicable.

Used to specify that a schedule service has finished initializing.

The following fields are available:

token

The Device UUID (used as unique token)

Information about a Schedule item

The following fields are available:

token

A service-unique identifier of the Schedule item.

Name

Short name of schedule.

Description

Detailed description of schedule.

The Schedule structure contains schedule information. ScheduleDefinition is in iCalender syntax according to RFC 5545, although only a subset of RFC 5545 is required to be supported.

The following fields are available:

token

A service-unique identifier of the Schedule.

Name

Short name of schedule.

Description

Detailed description of schedule.

ScheduleDefinition

Definition in iCalendar syntax.

Attribute

List of attributes.

ExceptionScheduleDefinition

Definition in iCalendar syntax.

Status of a single schedule

The following fields are available:

Token

Schedule token.

Active

Current active status of schedule.

Exception

Current exception status of schedule.

The capabilities of the schedule service, this information is returned by GetServiceCapabilities function and by the GetServices function in the device service. Only a subset of the iCalendar specification according to RFC 5545 is required to be supported, but services supporting more then that can specify it here.

The following fields are available:

Component

List of ICalendar components supported (VEVENT must be supported).

SetSchedule

If set schedule operation is supported.

GetSchedule

If get schedule operation is supported.

RemoveSchedule

If remove schedule operation is supported.

ScheduleActive

If schedule active operation is supported.

EventSupport

If the service support sending of events.

Get the service capabilities. Returns what optional features and capabilities the service supports

This operation requests a list of all of ScheduleInfo items provided by the device. An ONVIF compliant device which provides the Schedule service shall implement this method.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference items at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

This operation request a list of ScheduleInfo items matching the given tokens. An ONVIF-compliant device that provides Schedule service shall implement this method.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned

This operation requests a list of all of the Scheduleitems provided by the device. An ONVIF compliant device which provides the Schedule service shall implement this method.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference items at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

This operation request a list of Schedule items matching the given tokens. An ONVIF-compliant device that provides Schedule service shall implement this method.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned

Adds or sets a Schedule specified in the list.

Remove Schedule specified by the list of tokens. When an active interval schedule is removed, the corresponding Schedule/Interval event with Active=false and Exception=false should be sent to indicate that the schedule no longer exists.

Check if a a list of schedules is active at the specified or current time.

If any of the schedules in the list has a matching exception schedule, the function returns Active=false and Exception=true.

Both LocalTime and UtcTime are optional, and if none of them are specified, the times are determined by the device current local time and UTC time and depend on the device time zone settings. If only one of LocalTime and UtcTime is specified, the device uses its time zone setting to deduce the other.

In iCalendar schedules can be specified in either UtcTime or LocalTime so both must be known to be able to determine if a schedule is active or not. Being able to specify UtcTime and LocalTime separately allows a client to query the service independently of the device time and time zone settings.

This operation returns that status for the specified schedules.

The Interval property event contains information of the schedule state. The Active flag indicates if the schedule is active or not. The Exception flag indicates if an exception rule applies. If Exception is true, Active should be false regardless if the schedule would be active if there was no exception rule.

Issued whenever a pulse schedule event occurs.

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "ExceptionScheduleDefinition": null,                "Attribute": [],                "ScheduleDefinition": "BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART:20120312T080000\nDTEND:20120312T170000\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\nEND:VEVENT\nEND:VCALENDAR\n",                "token": "",                "Description": "Desc1",                "Name": "Name1"            }        ]    }}
```

```
<axsch:SetSchedule>    <axsch:Schedule token="">        <axsch:Attribute type="" Name="" Value=""></axsch:Attribute>        <axsch:Description>Desc1</axsch:Description>        <axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition>        <axsch:Name>Name1</axsch:Name>        <axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;DTSTART:20120312T080000&#xD;&#xA;DTEND:20120312T170000&#xA;RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>    </axsch:Schedule></axsch:SetSchedule>
```

```
{    "axsch:ScheduleActive": {        "Token": ["standard_office_hours", "standard_weekends"],        "UtcTime": null,        "LocalTime": null    }}
```

```
<axsch:ScheduleActive>    <axsch:LocalTime>2013-11-01T10:17:17Z</axsch:LocalTime>    <axsch:Token>standard_office_hours</axsch:Token>    <axsch:Token>standard_weekends</axsch:Token>    <axsch:UtcTime>2013-11-01T10:17:17Z</axsch:UtcTime></axsch:ScheduleActive>
```

```
{    "Active": true,    "Exception": false}
```

```
<axsch:Active>true</axsch:Active><axsch:Exception>false</axsch:Exception>
```

```
{    "axsch:ScheduleStatusReport": {}}
```

```
<axsch:ScheduleStatusReport />
```

```
{    "Status": [        {            "Token": "standard_weekends",            "Active": false,            "Exception": false        },        {            "Token": "standard_office_hours",            "Active": true,            "Exception": false        },        {            "Token": "standard_always",            "Active": true,            "Exception": false        }    ]}
```

```
<axsch:Status>  <axsch:Token>standard_weekends</axsch:Token>  <axsch:Active>false</axsch:Active>  <axsch:Exception>false</axsch:Exception></axsch:Status><axsch:Status>  <axsch:Token>standard_office_hours</axsch:Token>  <axsch:Active>true</axsch:Active>  <axsch:Exception>false</axsch:Exception></axsch:Status><axsch:Status>  <axsch:Token>standard_always</axsch:Token>  <axsch:Active>true</axsch:Active>  <axsch:Exception>false</axsch:Exception></axsch:Status>
```

```
BEGIN:VCALENDARBEGIN:VEVENTSUMMARY:Office HoursDTSTART:19700101T090000DTEND:19700101T170000RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FREND:VEVENTEND:VCALENDAR
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:19700104T000000DTEND:19700105T000000RRULE:FREQ=WEEKLY;BYDAY=SA,SUEND:VEVENTBEGIN:VEVENTDTSTART:19700102T170000DTEND:19700103T000000RRULE:FREQ=WEEKLY;BYDAY=FREND:VEVENTEND:VCALENDAR
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:20120213T100000DTEND:20120213T130000END:VEVENTEND:VCALENDAR
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:20120213T110000END:VEVENTEND:VCALENDAR;
```

```
BEGIN:VCALENDARBEGIN:VEVENTSUMMARY:Some birthdays during 2012DTEND:20120508T160000RDATE;VALUE=DATE:20120508,20120604,20120608,20120810,20121130DTSTART:20120508T140000END:VEVENTEND:VCALENDAR;
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:20120201T000000RRULE:FREQ=WEEKLY;BYDAY=WE,TH,FRRDATE;VALUE=DATE-TIME: 20120131T153000,20120201T000000,20120203T153000END:VEVENTEND:VCALENDAR;
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:20120101T131313RRULE:FREQ=DAILY;INTERVAL=4;COUNT=3END:VEVENTEND:VCALENDAR;
```

```
BEGIN:VCALENDARBEGIN:VEVENTDTSTART:20000101T120000RRULE:FREQ=SECONDLY;INTERVAL=15;UNTIL=20000101T120045END:VEVENTEND:VCALENDAR;
```

```
<tt:MessageDescription IsProperty="true">    <tt:Source>        <tt:SimpleItemDescription Name="ScheduleToken" Type="pt:ReferenceToken" />    </tt:Source>    <tt:Data>        <tt:SimpleItemDescription Name="Active" Type="xs:boolean" />        <tt:SimpleItemDescription Name="Exception" Type="xs:boolean" />    </tt:Data></tt:MessageDescription>
```

```
<tt:MessageDescription IsProperty="false">    <tt:Source>        <tt:SimpleItemDescription Name="ScheduleToken" Type="pt:ReferenceToken" />    </tt:Source></tt:MessageDescription>
```

- Interval schedules have a start time and an end time, that is, the schedule will be active during a defined time interval. Interval schedules are used to define rules for when resources can be accessed, for example "work hours", "weekends" or "holidays". Events are generated when the schedule state changes between active and inactive.
- Pulse schedules only have a start time. Pulse schedules are used to trigger actions that should run at a specific time, or that should run repeatedly according to a recurrence rule, for example everyWednesday at 11 pm. Events are generated when the schedule becomes active.

- Only local time is used.
- No support for UTC time
- No support for VTIMEZONE
- No support for VALARM
- DTSTART;VALUE=DATE is converted to a 24h interval event
- Overlapping RDATE /RRULE instances within a single VEVENT are undefined
- The following RRULE parameters are supported:
- HOURLY, MINUTELY, SECONDLY


DAILY


WEEKLY, WEEKLY;BYDAY


MONTHLY, MONTHLY;BYMONTHDAY


YEARLY, YEARLY;BYMONTH
- HOURLY, MINUTELY, SECONDLY
- DAILY
- WEEKLY, WEEKLY;BYDAY
- MONTHLY, MONTHLY;BYMONTHDAY
- YEARLY, YEARLY;BYMONTH

- HOURLY, MINUTELY, SECONDLY
- DAILY
- WEEKLY, WEEKLY;BYDAY
- MONTHLY, MONTHLY;BYMONTHDAY
- YEARLY, YEARLY;BYMONTH

- VCALENDAR: starts and ends the definition.
- UID and VERSION: since the RFC says they are required.
- VEVENT: Provide a grouping of component properties that describe an event.
- DTSTAMP, DTSTART, DTEND SUMMARY, DESCRIPTION
may be used by user interface, not interpreted.
- TZID - if VTIMEZONE: supported.
- RRULE and RDATE: to specify recurrances:
- RDATE: allows you to specify a list of date, periods or date-times.
- RDATE: with DATE-TIME, DATE and PERIOD VALUE types, e.g.
- RRULE: allows you to specify recurring events on a minutely, hourly, daily, weekly, montly and yearly basis etc.

- VTIMEZONE: if not supported, all times not in UTC time is assumed to be in the device local timezone as specified in the Device service.
- VALARM, VTODO, VJOURNAL, VFREEBUSY
typically not applicable.

- token
The Device UUID (used as unique token)

- token
A service-unique identifier of the Schedule item.
- Name
Short name of schedule.
- Description
Detailed description of schedule.

- token
A service-unique identifier of the Schedule.
- Name
Short name of schedule.
- Description
Detailed description of schedule.
- ScheduleDefinition
Definition in iCalendar syntax.
- Attribute
List of attributes.
- ExceptionScheduleDefinition
Definition in iCalendar syntax.

- Token
Schedule token.
- Active
Current active status of schedule.
- Exception
Current exception status of schedule.

- Component
List of ICalendar components supported (VEVENT must be supported).
- SetSchedule
If set schedule operation is supported.
- GetSchedule
If get schedule operation is supported.
- RemoveSchedule
If remove schedule operation is supported.
- ScheduleActive
If schedule active operation is supported.
- EventSupport
If the service support sending of events.

- Name: GetServiceCapabilities
- Access Class: PRE_AUTH

- Name: GetScheduleInfoList
- Access Class: READ_SYSTEM

- Name: GetScheduleInfo
- Access Class: READ_SYSTEM

- Name: GetScheduleList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetSchedule
- Access Class: READ_SYSTEM_SENSITIVE

- Name: SetSchedule
- Access Class: WRITE_SYSTEM

- Name: RemoveSchedule
- Access Class: WRITE_SYSTEM

- Name: ScheduleActive
- Access Class: ACTUATE

- Name: ScheduleStatusReport
- Access Class: ACTUATE

| ScheduleDefinition active | ExceptionScheduleDefinition active | Active |
| --- | --- | --- |
| No | No | No |
| Yes | No | Yes |
| No | Yes | No |
| Yes | Yes | No |

| Message name | Description |
| --- | --- |
| GetServiceCapabilitiesRequest | This message shall be empty. |
| GetServiceCapabilitiesResponse | This message contains:- Capabilities: The capabilities of the serviceaxsch:ServiceCapabilities Capabilities [1][1] |

| Message name | Description |
| --- | --- |
| GetScheduleInfoListRequest | This message contains- Limit Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetScheduleInfoListResponse | This message contains- NextStartReference StartReference to use in next call to get the following items. If absent, no more items to get.- ScheduleInfo List of ScheduleInfo items.xs:string NextStartReference [0][1]axsch:ScheduleInfo ScheduleInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client need to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetScheduleInfoRequest | This message contains- Token Tokens of ScheduleInfo items to get.pt:ReferenceToken Token [1][unbounded] |
| GetScheduleInfoResponse | This message contains:- ScheduleInfo: List of ScheduleInfo items.axsch:ScheduleInfo ScheduleInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| GetScheduleListRequest | This message contains- Limit Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetScheduleListResponse | This message contains- NextStartReference StartReference to use in next call to get the following items. If absent, no more items to get.- Schedule List of Schedule items.xs:string NextStartReference [0][1]axsch:Schedule Schedule [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client need to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetScheduleRequest | This message contains- Token Tokens of Schedule items to get.pt:ReferenceToken Token [1][unbounded] |
| GetScheduleResponse | This message contains:- Schedule: List of Schedule items.axsch:Schedule Schedule [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| SetScheduleRequest | This message contains:- Schedule: The new or updated schedules if token field is empty, the service will generate a new token.axsch:Schedule Schedule [1][unbounded] |
| SetScheduleResponse | This message contains- Token List of tokens for the schedules setpt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidScheduleFault |  |

| Message name | Description |
| --- | --- |
| RemoveScheduleRequest | This message contains- Token Tokens of the schedules to remove.pt:ReferenceToken Token [1][unbounded] |
| RemoveScheduleResponse | This message shall be empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | Schedule not found. |

| Message name | Description |
| --- | --- |
| ScheduleActiveRequest | This message contains- Token List of Tokens of the schedules to check- LocalTime Local time to check schedules against, if not present - deduce LocalTimefrom device time zone and the specified UtcTime if specified, otherwise the device current local time.- UtcTime UTC time to check schedules against, if not present - deduce UtcTime from device time zone and the specified LocalTime if specified, otherwise the device current UTC time.pt:ReferenceToken Token [1][unbounded]xs:dateTime LocalTime [0][1]xs:dateTime UtcTime [0][1] |
| ScheduleActiveResponse | This message contains:- Active: True if any of the schedules is active at the specified time, and there is no exception.- Exception True if any of the schedule has an exception at the specified time.xs:boolean Active [1][1]xs:boolean Exception [1][1] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | Schedule not found. |

| Message name | Description |
| --- | --- |
| ScheduleStatusReportRequest | This message contains- Token List of Tokens of the schedules to check.pt:ReferenceToken Token [1][unbounded] |
| ScheduleStatusReportResponse | This message contains:- Status:axsch:ScheduleStatus Status [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

