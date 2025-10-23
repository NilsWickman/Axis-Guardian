# RAID Management

**Source:** https://developer.axis.com/vapix/network-video/raid-management/
**Last Updated:** Aug 28, 2025

---

# RAID Management

## Overview​

### Identification​

## Common examples​

### Check RAID status​

### Retrieve capabilities​

### Change RAID level​

### Get supported versions​

## API specifications​

### getStatus​

### getCapabilities​

### recreateRaidOnAllComponents​

### getSupportedVersions​

### General error codes​

## Event declarations​

### RAID status event​

### Event action example​

The VAPIX® RAID Management API provides the information that makes it possible to set up and monitor the status of a RAID (Redundant Array of Independent Disks), which is a combination of multiple devices exposed as a single logical device on a system. This allows you to distribute a load of data over multiple components while addressing them as if they were one storage device.

Different characteristics and features can be achieved depending on selected RAID levels, such as device failure redundancy and performance improvements. This means that either one or both benefits can be attained to various extents depending on RAID level and the number of available component devices.

Examples of RAID levels

RAID levels 1, 5, 6 and 10 provide device failure redundancy. This means that one or more components can be lost during a configuration while the data remains intact. RAID levels that can give some disks I/O performance are 0, 5 and 10.

The currently supported RAID levels are raid0, radi1, raid5, raid6 and raid10.

Terminology

The API implements disks/raid.cgi as its communications interface and supports the following methods:

getStatus: Check the RAID state and its component devices to see which components are connected or missing. Additional information such as serial numbers are also available with this method.

Please note that component devices are not the same as the disks referenced in the Disk management API. This means the components won’t be listed using disks/list.cgi. The RAID itself is a disk, and can be used as such once it is formatted using format.cgi. Since the RAID can only provide failure redundancy for components once it has synced, a component can be lost while the RAID disk still has the status OK in disks/list.cgi. To get the connection status of the components this method must be used instead of list.cgi.

getCapabilities: Check for supported RAID levels. Possible RAID levels are raid0, radi1, raid5, raid6 and raid10.

recreateRaidOnAllComponents: Set up a RAID on all available components.

Please make sure that all important data in the active RAID is backed up before using this method as using this method while RAID is active will stop, destroy and replace the active RAID and create a new one.

The reasons you would want to recreate the RAID with this method is to either change the RAID level from the default value, or to setup a new RAID on fewer or on an entirely new set of component devices. The latter option is viable when multiple hard disk drives breaks down before you are able to sync a replacement drive, however please note that this scenario unfortunately will result in data loss.

Provided that an expected number of components are available a RAID is automatically configured at the first time setup. This method can be used to create a RAID on fewer components than the usual amount as long as the selected RAID level is supported for that number of components.

Attempting to configure a RAID level that is not supported will reply with the error code 1201 "RAID level not supported". The getCapabilities method should be used to check supported RAID levels.

Successful implementation creates a logical device in a syncing state which can be used immediately. The device still needs to be formatted with a file system and then mounted to be used in the system.

getSupportedVersions: Discover all API versions supported by your device.

Use this example to check if all connected hard drives are in a state expected by the system.

JSON input parameters

Successful response example

Error response example

See getStatus for additional information.

Use this example to locate and retrieve available RAID levels.

JSON input parameters

Successful response example

Error response example

See getCapabilities for additional information.

Use this example to chose the RAID level that you want to use in the system.

Changing from one RAID level to another is an irreversible operation that will destroy all data in the active RAID, resulting in permanent loss of data.

A new RAID can be created using the recreateRaidOnAllComponents method if a RAID level other than the default "raid5" is preferred. Please note that the RAID must first be unmounted using disks/mount.cgi from Edge storage API before you replace an existing and actively used RAID.

Making a request to disks/raid.cgi with the getCapabilities method selected must be made in order to present and select available RAID levels. This will return a list containing RAID levels available for selection.

The following example uses the method recreateRaidOnAllComponents and the level "raid10":

JSON input parameters

Successful response example

Error response example

Please note that a RAID is created without a file system. However, disks/format.cgi, further detailed in Edge storage API can be used to format a file system.

See recreateRaidOnAllComponents for additional information.

Use this example to retrieve a list containing the API versions supported by your device.

JSON input parameters

Successful response example

Error response example

See getSupportedVersions for additional information.

This method is used when you want to retrieve the current status of configured RAIDs.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to retrieve product supported RAID-levels. It will be presented as a subset of the list of possible RAID levels. Possible RAID levels are raid0, radi1, raid5, raid6 and raid10.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to setup a RAID.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to retrieve a list of API versions supported by your device.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

API specific error codes

Generic error codes

RAID events are broadcast to assist handles that can be subscribed to, and use the action engine. This makes it possible to create a custom system to supply a variety of action templates. See Action templates for additional information.

The RAID status event is a stateful event that serves as a snapshot of the current RAID status. The stateful event is updated and emitted the moment the component list of RAID state changes. The component list and RAID state could both change at once or individually make three scenarios possible.

Notice that possible values for the raidstate parameter is represented by the status parameter and that componentXstatus parameters are represented as a combination of the componentStatus and componentId parameters. These parameters are documented in the getStatus method. The "X" in componentXstatus is represented by the componentId in the component list in the getStatus method.

A RAID sync is finished when the raidstate has changed from syncing to active. Since no components where added or lost, each componentXstatus parameter will remain unchanged and report connected.

If component 0 breaks down while raidstate is active the component0status will change from connected to missing and the raidstate will change to degraded. Although two parameters changed the event will only be emitted once.

The last possibility is a change made to the component list without changing the raidstate. This can happen if the RAID is configured with RAID1, RAID6 or RAID10, which makes it possible for two components to break down before seeing a failure. This scenario happens once a component is already missing and the raidstate has become degraded. Having a second component break down in this configuration would send the RAID status event with two componentXstatus reported missing when the raidstate would remain unchanged and report degraded.

This example will demonstrate how the Axis Action Engine can be used to subscribe to the RAID status event and act on state changes to perform an action.

The action is configured to set off the buzzer to make the product sound at a fixed interval whenever the RAID state value changes to degraded. This means that a drive has broken down and needs to be replaced.

The following SOAP messages are sent with POST to the Axis device by the http://<device-addreee>/vapix/services url. For more information on how to use the action engine, see Event and action services.

Add an action configuration for the buzzer, in this example called buzzer_configuration_raid. This configuration uses the buzzer template token.

The action configuration ID is stored in the AddActionConfigurationResponse. It is required to set up the action rule that will tell the action engine when the configuration should happen. The following example sets the configuration ID to 123. The action rule will filter the Storage/RAID event within the Axis event namespace and trigger once the value represented by the raidstate key is set to the string degraded. See getStatus for other examples of possible values that raidstate can assume as well as connection statues for the disks.

The sound of the buzzer can be quite piercing, but it can be switched out by using an alternative action template. See Event and action services for additional action templates.

```
POST http://<device-adress>/axis-cgi/disks/raid.cgiContent-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getStatus"}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getStatus",    "data": {        "raids": [            {                "status": "degraded",                "syncProgress": 0,                "syncTimeRemaining": 0,                "raidLevel": "raid5",                "components": [                    {                        "componentStatus": "connected",                        "componentId": "0",                        "serialNumber": "ABC123",                        "capacity": 1234                    },                    {                        "componentStatus": "missing",                        "componentId": "1",                        "serialNumber": "unknown",                        "capacity": 0                    },                    {                        "componentStatus": "connected",                        "componentId": "2",                        "serialNumber": "CAB312",                        "capacity": 1234                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getStatus",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
POST http://<device-adress>/axis-cgi/disks/raid.cgiContent-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities",    "data": {        "raidLevels": ["raid0", "raid1", "raid5", "raid6", "raid10"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getCapabilities",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
POST http://<device-adress>/axis-cgi/disks/raid.cgiContent-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "recreateRaidOnAllComponents",    "params": {        "raidLevel": "raid10"    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "recreateRaidOnAllComponents",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "recreateRaidOnAllComponents",    "error": {        "code": 1201,        "message": "RAID level not supported"    }}
```

```
POST http://<device-adress>/axis-cgi/disks/raid.cgiContent-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "context": "123",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "123",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<device-address>/axis-cgi/disks/raid.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getStatus"}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getStatus",  "data": {    "raids": [      {        "status": <string>,        "syncProgress": <integer>,        "syncTimeRemaining": <integer>,        "raidLevel": <string>,        "components": [          {            "componentStatus": <string>,            "componentId": <string>,            "serialNumber": <string>,            "capacity": <integer>          },          {            "componentStatus": <string>,            "componentId": <string>,            "serialNumber": <string>,            "capacity": <integer>          }        ]      },      {        "status": <string>,        "syncProgress": <integer>,        "syncTimeRemaining": <integer>,        "raidLevel": <string>,        "components": [          {            "componentStatus": <string>,            "componentId": <string>,            "serialNumber": <string>,            "capacity": <integer>          },          {            "componentStatus": <string>,            "componentId": <string>,            "serialNumber": <string>,            "capacity": <integer>          }        ]      }    ]  }}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getStatus",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/disks/raid.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getCapabilities"}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getCapabilities",  "data": {    "raidLevels": [      <string>,      <string>    ]  }}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getCapabilities",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/disks/raid.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "recreateRaidOnAllComponents"  "params": {    "raidLevel": <string>  }}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "recreateRaidOnAllComponents",  "data": {}}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "recreateRaidOnAllComponents",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/disks/raid.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [      "<major1>.<minor1>", "<major2>.<minor2>"    ]  }}
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
<tnsaxis:Storage aev:NiceName="Storage">    <RAID wstop:topic="true">        <aev:MessageInstance aev:isProperty="true">            <aev:DataInstance>                <aev:SimpleItemInstance                    isPropertyState="true"                    aev:NiceName="RAID state"                    Type="xsd:string"                    Name="raidstate" />                <aev:SimpleItemInstance                    aev:NiceName="Connection status of RAID component 3"                    Type="xsd:string"                    Name="component3status" />                <aev:SimpleItemInstance                    aev:NiceName="Connection status of RAID component 1"                    Type="xsd:string"                    Name="component1status" />                <aev:SimpleItemInstance                    aev:NiceName="Connection status of RAID component 2"                    Type="xsd:string"                    Name="component2status" />                <aev:SimpleItemInstance                    aev:NiceName="Connection status of RAID component 0"                    Type="xsd:string"                    Name="component0status" />                <aev:SimpleItemInstance aev:NiceName="RAID level" Type="xsd:string" Name="raidlevel" />            </aev:DataInstance>        </aev:MessageInstance>    </RAID></tnsaxis:Storage>
```

```
<?xml version="1.0" encoding="UTF-8" ?><SOAP-ENV:Envelope    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope"    xmlns:aa="http://www.axis.com/vapix/ws/action1">    <SOAP-ENV:Header />    <SOAP-ENV:Body>        <aa:AddActionConfiguration>            <aa:NewActionConfiguration>                <aa:Name>buzzer_configuration_raid</aa:Name>                <aa:TemplateToken>com.axis.action.unlimited.buzzer</aa:TemplateToken>            </aa:NewActionConfiguration>        </aa:AddActionConfiguration>    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
<?xml version="1.0" encoding="UTF-8" ?><SOAP-ENV:Envelope    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope"    xmlns:aa="http://www.axis.com/vapix/ws/action1"    xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"    xmlns:tns1="http://www.onvif.org/ver10/topics"    xmlns:tnsaxis="http://www.axis.com/2009/event/topics">    <SOAP-ENV:Header />    <SOAP-ENV:Body>        <aa:AddActionRule>            <aa:NewActionRule>                <aa:Name>buzzer_rule_raid</aa:Name>                <aa:Enabled>true</aa:Enabled>                <aa:Conditions>                    <aa:Condition>                        <wsnt:TopicExpression Dialect="http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet">                            tnsaxis:Storage/RAID                        </wsnt:TopicExpression>                        <wsnt:MessageContent Dialect="http://www.onvif.org/ver10/tev/messageContentFilter/ItemFilter">                            boolean(//SimpleItem[@Name="raidstate" and @Value="degraded"])                        </wsnt:MessageContent>                    </aa:Condition>                </aa:Conditions>                <aa:PrimaryAction>123</aa:PrimaryAction>            </aa:NewActionRule>        </aa:AddActionRule>    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

- getStatus: Check the RAID state and its component devices to see which components are connected or missing. Additional information such as serial numbers are also available with this method.
Please note that component devices are not the same as the disks referenced in the Disk management API. This means the components won’t be listed using disks/list.cgi. The RAID itself is a disk, and can be used as such once it is formatted using format.cgi. Since the RAID can only provide failure redundancy for components once it has synced, a component can be lost while the RAID disk still has the status OK in disks/list.cgi. To get the connection status of the components this method must be used instead of list.cgi.
- getCapabilities: Check for supported RAID levels. Possible RAID levels are raid0, radi1, raid5, raid6 and raid10.
- recreateRaidOnAllComponents: Set up a RAID on all available components.
Please make sure that all important data in the active RAID is backed up before using this method as using this method while RAID is active will stop, destroy and replace the active RAID and create a new one.
The reasons you would want to recreate the RAID with this method is to either change the RAID level from the default value, or to setup a new RAID on fewer or on an entirely new set of component devices. The latter option is viable when multiple hard disk drives breaks down before you are able to sync a replacement drive, however please note that this scenario unfortunately will result in data loss.
Provided that an expected number of components are available a RAID is automatically configured at the first time setup. This method can be used to create a RAID on fewer components than the usual amount as long as the selected RAID level is supported for that number of components.
Attempting to configure a RAID level that is not supported will reply with the error code 1201 "RAID level not supported". The getCapabilities method should be used to check supported RAID levels.
Successful implementation creates a logical device in a syncing state which can be used immediately. The device still needs to be formatted with a file system and then mounted to be used in the system.
- getSupportedVersions: Discover all API versions supported by your device.

- API Discovery: id=raid

- Retrieve the current status of your hard drives and sync progress with the following request:

- Parse the JSON response.

- Retrieve available RAID levels with the following request:

- Parse the JSON response.

- A new RAID can be created using the recreateRaidOnAllComponents method if a RAID level other than the default "raid5" is preferred. Please note that the RAID must first be unmounted using disks/mount.cgi from Edge storage API before you replace an existing and actively used RAID.
- Making a request to disks/raid.cgi with the getCapabilities method selected must be made in order to present and select available RAID levels. This will return a list containing RAID levels available for selection.
- The following example uses the method recreateRaidOnAllComponents and the level "raid10":

- Parse the JSON response.

- The method getStatus can be used to verify that a new RAID is created with level "raid10" and is properly syncing.

- A file system can be mounted once it has been properly created with mount.cgi and the action mount , detailed in Edge storage API.

- Retrieve supported API versions with the following request:

- Parse the JSON response.

- Security level: Operator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Term | Description |
| --- | --- |
| RAID | Redundant Array of Independent Disks |
| RAIDs | Plural of RAID. Redundant Array of Independent Disks |
| RAID-level | A selected behavior of a RAID. |
| storage device | Stores bits of data. |
| hard disk drive | An example of a type of storage device. |
| partition | The logical arrangement of physical storage space accessible by the operating system. |
| component device | A storage device/partition that participates in a RAID. |
| component | Short name for component device. |
| sync | The process of calculating information used to provide component device failure redundancy. |
| degraded | Whenever a RAID is in a degraded state it is still active, but has lost its data redundancy. |
| connected | A component available for use or in active use in a RAID. |
| missing | A component that was used in RAID that isn’t connected. |
| spare | A connected component that is in standby for immediate replacement when needed. |
| API | Application Programming Interface. |
| HTTP | Hyper Text Transfer Protocol, a commonly used protocol for communicating over the internet. |
| JSON | Java Style Object Notification, a standardized way of serializing data. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="getStatus" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getStatus" | The method that was requested. |
| data.raids=[<object>] | A list of RAIDs. |
| data.raids.<object>.status=<string> | The momentary RAID status. The following table contain the values of the status parameter: Value Description
active The RAID is operating with optimal performance.
degraded The RAID is missing data redundancy.
syncing The RAID is synchronizing data between components.
failure The RAID has failed. |
| data.raids.<object>.syncProgress=<integer> | The percentage of completion during an active sync process. Set to 100 when active and not syncing and 0 when in a degraded or failed state. |
| data.raids.<object>.syncTimeRemaining=<integer> | The estimated time, in seconds, until an active sync finishes. Set to 0 when not syncing. |
| data.raids.<object>.raidLevel=<string> | Returns the configured RAID level. Use the method getCapabilities to list supported RAID levels. |
| data.raids.<object>.components=[<object>] | Lists the component device information. |
| data.raids.<object>.components.<object>.componentId=<string> | The component device ID. Maps to a hard drive slot on your product. |
| data.raids.<object>.components.<object>.componentStatus=<string> | Status of the component device. The following table contain the values of the componentStatus parameter: Value Description
connected The component device is available in the active RAID.
missing The component device is not detected.
spare The component device is marked as a hot-spare. |
| data.raids.<object>.components.<object>.serialNumber=<string> | The serial number of the component device. |
| data.raids.<object>.components.<object>.capacity=<integer> | The capacity, in gigabytes, of the component device. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getStatus" | The method that was requested. |
| error=<object> | The error object. |
| error.code=<integer> | An error code describing the kind of error. |
| error.message=<string> | An error message describing the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="getCapabilities" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getCapabilities" | The method that was requested. |
| data.raidLevels=[<string>] | The list of available RAID levels. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getCapabilities" | The method that was requested. |
| error=<object> | The error object. |
| error.code=<integer> | An error code describing the kind of error. |
| error.message=<string> | An error message describing the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="recreateRaidOnAllComponents" | The requested method. |
| params.raidLevel=<string> | The RAID-level. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="recreateRaidOnAllComponents" | The method that was requested. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="recreateRaidOnAllComponents" | The method that was requested. |
| error=<object> | The error object. |
| error.code=<integer> | An error code describing the kind of error. |
| error.message=<string> | An error message describing the error code. |

| Code | Message |
| --- | --- |
| 1200 | Generic RAID error. |
| 1201 | RAID level not supported. |
| 1202 | Component device error. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="getSupportedVersions" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The method that was requested. |
| data.apiVersions=[<object>] | A list containing the major API versions along with their supported minor version, e.g. ["1.3", "2.1"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The method that was requested. |
| error=<object> | The error object. |
| error.code=<integer> | An error code describing the kind of error. |
| error.message=<string> | An error message describing the error code. |

| Code | Message |
| --- | --- |
| 1200 | Generic RAID error. |
| 1201 | RAID level not supported. |
| 1202 | Component device error. |

| Code | Message |
| --- | --- |
| 1100 | Internal error. |
| 2101 | Invalid JSON |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |
| 2106 | Authentication failed. |
| 2107 | Transport level error. |

