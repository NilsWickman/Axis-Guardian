# I/O assignment service

**Source:** https://developer.axis.com/vapix/physical-access-control/io-assignment-service/
**Last Updated:** Aug 28, 2025

---

# I/O assignment service

## I/O assignment service guide​

### Assign I/O:s​

#### Configure the services that use I/O​

#### Get information about the services’ I/O requirements​

#### Get information about available I/O​

#### Assign I/O to services​

### Unassign I/O:s​

## I/O assignment service API​

### I/O service​

#### PinInfo data structure​

#### IoInfo data structure​

#### IoUser data structure​

#### IoUserInfo data structure​

#### IoAssignment data structure​

#### IoAssignmentErrorCode data structure​

#### IoAssignmentError data structure​

#### GetIoAssignmentList command​

#### GetIoUserInfoList command​

#### GetIoInfoList command​

#### SetIoAssignment command​

The I/O assignment service is used to assign I/O:s to other services and to retrieve information about available I/O:s and the services’ I/O requirements.

An I/O is a representation of how a combination of the door controller’s physical pins can be used. That is, an I/O is not the same as a physical pin.

To support as many different devices and combinations as possible, the door controller is designed to allow locks, readers, monitors and other external devices to be connected in different ways. When connecting a device, there are several possible combinations of pins that can be used; there are no specific pins that must be used. This does not mean that any device can be connected to any physical pin. Different pins have different electrical properties and devices must be connected to pins with the required electrical properties.

The API function axisio:GetIoInfoList provides information about the door controller’s available I/O:s and lists the physical pins used by each I/O. In some cases, the same physical pins are used by several different I/O:s. If so, only one of those I/O:s can be used at a time.

The I/O Assignment Service does not generate any events.

Follow these steps to configure the door controller’s physical pins and assign I/O:s to services:

Configure the services that use I/O (section Configure the services that use I/O).

Get information about the services’ I/O requirements (section Get information about the services’ I/O requirements).

Get information about available I/O:s (section Get information about available I/O).

Assign I/O:s to the services (section Assign I/O to services).

Before assigning I/O:s, the services that use I/O must be configured:

When the services that use I/O have been configured, use axisio:GetIoUserInfoList to retrieve information about the services’ I/O requirements, that is, what the services need I/O for.

The axisio:GetIoUserInfoList call returns a list of IoUserInfo:s. Each IoUserInfo corresponds to an I/O entity required by a service and consists of three parts:

Name is a nice name of the entity, for example "Door" or "Reader In", which needs an I/O.

IoUser is the I/O specification required by a service.

Type is the name of the owner, for example the Door Control Service.

token belongs to the specific entity, for example Door or IdPoint, that will use the I/O.

Usage has information about what the entity needs the I/O for.

MultiIo specifies whether the IoUser can use multiple I/O:s.

IoMode gives information about which mode the I/O must support to be able to be assigned to the IoUser.

The following is an example output from axisio:GetIoUserInfoList:

Response

In the example above, the Door requires an I/O that can be used in the "inout:12V/gnd" mode to use for its standard lock. However, the first IdPoint can use any I/O that supports any of four different modes to control its LED. The second IdPoint requires an I/O which support Wiegand.

When the services’ I/O requirements are known, use axisio:GetIoInfoList to retrieve a list of the door controller’s available I/O:s. Each available I/O is represented by an IoInfo. The IoInfo consists of three parts.

All IoInfos can be retrieved with axisio:GetIoInfoList and the response is as follows:

Response

Response

This list is a shortened version of the actual output from a door controller.

The final step is to assign I/O:s to services. Using IoUsers and IoInfos, it is possible to assign I/O:s with IoAssignments. An IoAssignment consists of the following three parts:

The IoUserInfo must have the chosen IoMode in its list of IoModes to be able to assign it. When assigning multiple IoUsers to the same IoInfo, all of the IoUsers must be able to use the same mode, and that must also be the mode of the IoAssignment.

Note that the MultiIo field of the IoUser is used to determine if the same IoUser can be assigned to several different IoInfos. It is not used to determine if several IoUsers can be assigned to the same IoInfo.

Assign one IoUser to one I/O:

Request

Request

Assign several IoUser:s to one I/O:

Request

Request

This example is actually a common assignment using two different types of door monitors. One door monitor which checks if the door is open and one which checks if the door is closed. Sometimes, these are separate physical door monitors but sometimes only one physical door monitor is used for both purposes. If there is only one physical door monitor, the polarities of DoorOpenMonitor and DoorClosedMonitor should be configured to be the reverse of one another in the DoorControl service configuration, see Door control service. Both monitors should then be assigned to the same IoInfo. This ensures that one of them is always active and the other inactive. This configuration of two monitors using the same I/O behaves the same as if there was only one door monitor that switched between open and closed.

Assign one IoUser to several I/O:s:

Request

Request

Both "H1" and "H2" is assigned to the standard lock of the door with token "Axis 00408c184bcc:1353672968.091740000". They would therefore both be triggered when changing the state of the standard lock for that door.

I/O:s are unassigned in two different situations. When an I/O is assigned, all other I/O:s using any of the pins required by the assignee, is unassigned. This implies that when assigning an I/O, several others may be unassigned automatically because the pins they use are needed by the I/O being assigned.

The other way I/O:s can be unassigned is by assigning that I/O with an empty IoUser. The following is an explicit unassignment of "IO3":

Request

Request

axisio = http://www.axis.com/vapix/ws/AxisIo

The I/O service handles which I/O is connected where.

The product’s I/O:s can be assigned to IoUser items.

Information about a physical pin and which modes it can be used for.

The following fields are available:

Name

Physical pin. Naming convention connector type name:pinnbr, some examples: Door IN 1:1:GND, Door IN 1:2:IN, Reader Data 1:5, Reader Data 1:6 GND means a dedicated ground pin, IN means this is an input, I/O means this is either an input or an output, OUT means this is an output.

Description

Description of pin.

Information about which physical pin/pins an I/O uses and which modes it can be used for.

The following fields are available:

IoName

Name of I/O to use for set.

IoMode

Possible modes for I/O.

PinInfo

Information about the physical pins used by the I/O.

Entity to use for assigning I/O:s to a usage of a specific token.

The following fields are available:

Type

Which type of I/O user is it.

token

Token used to identify specific IoUser.

Usage

Short name of usage.

MultiIo

True if multiple I/O:s can be assigned to this IoUser.

Information about an IoUser. E.g. open/gnd and pu/gnd are possible modes for usage DoorLock of Door0 with token Door1234 of type Door.

The following fields are available:

Name

Informative name of the user.

IoMode

Possible modes for IoUser.

IoUser

The configuration entity to configure which mode an I/O should use and to assign it to one or more I/O users.

The following fields are available:

IoName

Name of the I/O to assign to IoUser.

IoUser

IoUser items to assign Io to.

IoMode

The mode to configure the I/O to use.

The possible errors when assigning I/Os.

The following values are available:

Other

For future extension.

Unknown

For unknown error code.

IoDoesNotExist

Io does not exist.

IoUserServiceDoesNotExist

IoUser service does not exist.

IoUserTokenDoesNotExist

IoUser token does not exist.

IoUserUsageDoesNotExist

IoUser Usage does not exist.

MultipleIoNotAllowed

Multiple I/Os not allowed for this IoUser.

ModeAlreadyAssignedInRequest

Different I/O modes assigned multiple times in same request.

ModeNotAllowedForIo

Mode not allowed for Io.

ModeNotAllowedForIoUser

Mode not allowed for IoUser.

DuplicateIoAssignment

The same Iois assigned multiple times in the same request.

The configuration entity to configure which mode an I/O should use and to assign it to one or more I/O users.

The following fields are available:

IoName

Name of the I/O to assign to IoUser.

IoMode

The mode to configure the I/O to use.

IoUser

IoUser to assign Io to.

Error

Error IoUser to assign Io to.

Use GetIoAssignmentList to retrieve all I/O assignments.

Use GetIoUserInfoList to retrieve all IoUserInfo items.

Use GetIoInfoList to retrieve all IoInfo items.

Use SetIoAssignment to assign I/Os.

```
{    "IoUserInfo": [        {            "Name": "Door3",            "IoUser": {                "Type": "doorcontrol",                "token": "Axis-00408c184bcc:1353593694.250410000",                "Usage": "Lock_Standard",                "MultiIo": false            },            "IoMode": ["inout:12V/gnd"]        },        {            "Name": "Reader In",            "IoUser": {                "Type": "idpoint",                "token": "Axis-00408c184bcc:1353593694.316373000",                "Usage": "LedSingle",                "MultiIo": false            },            "IoMode": ["out:float/gnd", "out:pu/gnd", "inout:float/gnd", "inout:pu/gnd"]        },        {            "Name": "Reader In",            "IoUser": {                "Type": "idpoint",                "token": "Axis-00408c184bcc:1353593694.316373000",                "Usage": "Wiegand",                "MultiIo": false            },            "IoMode": ["wiegand"]        }    ]}
```

```
<axisio:GetIoUserInfoListResponse>    <IoUserInfo>        <Name>Door 3</Name>        <IoMode>inout:12V/gnd</IoMode>        <IoUser>            <Type>doorcontrol</Type>            <token>Axis-00408c184bcc:1353593694.250410000</token>            <Usage>Lock_Standard</Usage>            <MultiIo>false</MultiIo>        </IoUser>    </IoUserInfo>    <IoUserInfo>        <Name>Reader In</Name>        <IoMode>out:float/gnd</IoMode>        <IoMode>out:pu/gnd</IoMode>        <IoMode>inout:float/gnd</IoMode>        <IoMode>inout:pu/gnd</IoMode>        <IoUser>            <Type>idpoint</Type>            <token>Axis-00408c184bcc:1353593694.316373000</token>            <Usage>LedSingle</Usage>            <MultiIo>false</MultiIo>        </IoUser>    </IoUserInfo>    <IoUserInfo>        <Name>Reader In</Name>        <IoMode>wiegand</IoMode>        <IoUser>            <Type>idpoint</Type>            i            <token>Axis-00408c184bcc:1353593694.316373000</token>            <Usage>Wiegand</Usage>            <MultiIo>false</MultiIo>        </IoUser>    </IoUserInfo></axisio:GetIoUserInfoListResponse>
```

```
{    "IoInfo": [        {            "IoName": "IO1",            "IoMode": ["inout:pu/gnd", "inout:float/gnd", "supervised"],            "PinInfo": [{ "Name": "Aux I/O:3", "Description": "I/O" }]        },        {            "IoName": "H-bridge1",            "IoMode": ["h_bridge"],            "PinInfo": [                { "Name": "Lock:2", "Description": "+" },                { "Name": "Lock:4", "Description": "-" }            ]        },        {            "IoName": "Ser0fd",            "IoMode": ["rs485fd"],            "PinInfo": [                { "Name": "Reader Data 1:1", "Description": "RX B-" },                { "Name": "Reader Data 1:2", "Description": "RX A+" },                { "Name": "Reader Data 1:3", "Description": "TX B-" },                { "Name": "Reader Data 1:4", "Description": "TX A+" }            ]        }    ]}
```

```
<axisio:GetIoInfoListResponse>    <IoInfo>        <IoName>IO1</IoName>        <IoMode>inout:pu/gnd</IoMode>        <IoMode>inout:float/gnd</IoMode>        <IoMode>supervised</IoMode>        <PinInfo>            <Name>Aux I/O:3</Name>            <Description>I/O</Description>        </PinInfo>    </IoInfo>    <IoInfo>        <IoName>H-bridge1</IoName>        <IoMode>h_bridge</IoMode>        <PinInfo>            <Name>Lock:2</Name>            <Description>+</Description>        </PinInfo>        <PinInfo>            <Name>Lock:4</Name>            <Description>-</Description>        </PinInfo>    </IoInfo>    <IoInfo>        <IoName>Ser0fd</IoName>        <IoMode>rs485fd</IoMode>        <PinInfo>            <Name>Reader Data 1:1</Name>            <Description>RX B-</Description>        </PinInfo>        <PinInfo>            <Name>Reader Data 1:2</Name>            <Description>RX A+</Description>        </PinInfo>        <PinInfo>            <Name>Reader Data 1:3</Name>            <Description>TX B-</Description>        </PinInfo>        <PinInfo>            <Name>Reader Data 1:4</Name>            <Description>TX A+</Description>        </PinInfo>    </IoInfo></axisio:GetIoInfoListResponse>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "H1",                "IoMode": "inout:12V/gnd",                "IoUser": [                    {                        "MultiIo": false,                        "Type": "doorcontrol",                        "Usage": "Lock_Standard",                        "token": "Axis-0408c184bcc:1353672968.091740000"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:12V/gnd</axisio:IoMode>        <axisio:IoName>H1</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>Lock_Standard</axisio:Usage>            <axisio:token>Axis-0408c184bcc:1353672968.091740000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "IN1",                "IoMode": "in:pu/gnd",                "IoUser": [                    {                        "MultiIo": true,                        "Type": "doorcontrol",                        "Usage": "DoorOpenMonitor",                        "token": "Axis-00408c184bcc:1353674725.635842000"                    },                    {                        "MultiIo": false,                        "Type": "doorcontrol",                        "Usage": "DoorClosedMonitor",                        "token": "Axis-00408c184bcc:1353674725.635842000"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>in:pu/gnd</axisio:IoMode>        <axisio:IoName>IN1</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>true</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>DoorOpenMonitor</axisio:Usage>            <axisio:token>Axis-00408c184bcc:1353674725.635842000</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>DoorClosedMonitor</axisio:Usage>            <axisio:token>>Axis-00408c184bcc:1353674725.635842000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "H1",                "IoMode": "inout:12V/gnd",                "IoUser": [                    {                        "MultiIo": true,                        "Type": "doorcontrol",                        "Usage": "Lock_Standard",                        "token": "Axis-0408c184bcc:1353672968.091740000"                    }                ]            },            {                "IoName": "H2",                "IoMode": "inout:12V/gnd",                "IoUser": [                    {                        "MultiIo": true,                        "Type": "doorcontrol",                        "Usage": "Lock_Standard",                        "token": "Axis-0408c184bcc:1353672968.091740000"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:12V/gnd</axisio:IoMode>        <axisio:IoName>H1</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>true</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>Lock_Standard</axisio:Usage>            <axisio:token>Axis-0408c184bcc:1353672968.091740000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:12V/gnd</axisio:IoMode>        <axisio:IoName>H2</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>true</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>Lock_Standard</axisio:Usage>            Lock_Standard            <axisio:token>Axis-0408c184bcc:1353672968.091740000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [{ "IoName": "IO3", "IoMode": "inout:pu/gnd", "IoUser": [] }]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:12V/gnd</axisio:IoMode>        <axisio:IoName>IO3</axisio:IoName>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

- Configure the services that use I/O (section Configure the services that use I/O).
- Get information about the services’ I/O requirements (section Get information about the services’ I/O requirements).
- Get information about available I/O:s (section Get information about available I/O).
- Assign I/O:s to the services (section Assign I/O to services).

- Door Control Service. See section Door control service guide.
- IdPoint Service. See section IdPoint service guide.

- Name is a nice name of the entity, for example "Door" or "Reader In", which needs an I/O.
- IoUser is the I/O specification required by a service.
- Type is the name of the owner, for example the Door Control Service.


token belongs to the specific entity, for example Door or IdPoint, that will use the I/O.


Usage has information about what the entity needs the I/O for.


MultiIo specifies whether the IoUser can use multiple I/O:s.
- Type is the name of the owner, for example the Door Control Service.
- token belongs to the specific entity, for example Door or IdPoint, that will use the I/O.
- Usage has information about what the entity needs the I/O for.
- MultiIo specifies whether the IoUser can use multiple I/O:s.
- IoMode gives information about which mode the I/O must support to be able to be assigned to the IoUser.

- Type is the name of the owner, for example the Door Control Service.
- token belongs to the specific entity, for example Door or IdPoint, that will use the I/O.
- Usage has information about what the entity needs the I/O for.
- MultiIo specifies whether the IoUser can use multiple I/O:s.

- IoName is the name of the I/O.
- IoMode holds a list of which modes the I/O can be used with.
- Pin holds a list of the physical pins on the door controller that this I/O will use if assigned to an IoUser.

- IoName is the name of the IoInfo to assign.
- IoMode is the mode of operation to set the I/O to. Available modes can be found in the IoInfo.
- IoUser holds a list of IoUsers that should be assigned to the I/O.

- Use GetIoInfoList() to get information about all I/O:s.
- Use GetIoUserInfoList() to get information about all IoUser items.
- Use GetIoAssignmentList() to get information about which I/O:s are assigned to which IoUser items.
- Use SetIoAssignment() to assign an I/O to one or more IoUser items.

- Name
Physical pin. Naming convention connector type name:pinnbr, some examples: Door IN 1:1:GND, Door IN 1:2:IN, Reader Data 1:5, Reader Data 1:6 GND means a dedicated ground pin, IN means this is an input, I/O means this is either an input or an output, OUT means this is an output.
- Description
Description of pin.

- IoName
Name of I/O to use for set.
- IoMode
Possible modes for I/O.
- PinInfo
Information about the physical pins used by the I/O.

- Type
Which type of I/O user is it.
- token
Token used to identify specific IoUser.
- Usage
Short name of usage.
- MultiIo
True if multiple I/O:s can be assigned to this IoUser.

- Name
Informative name of the user.
- IoMode
Possible modes for IoUser.
- IoUser

- IoName
Name of the I/O to assign to IoUser.
- IoUser
IoUser items to assign Io to.
- IoMode
The mode to configure the I/O to use.

- Other
For future extension.
- Unknown
For unknown error code.
- IoDoesNotExist
Io does not exist.
- IoUserServiceDoesNotExist
IoUser service does not exist.
- IoUserTokenDoesNotExist
IoUser token does not exist.
- IoUserUsageDoesNotExist
IoUser Usage does not exist.
- MultipleIoNotAllowed
Multiple I/Os not allowed for this IoUser.
- ModeAlreadyAssignedInRequest
Different I/O modes assigned multiple times in same request.
- ModeNotAllowedForIo
Mode not allowed for Io.
- ModeNotAllowedForIoUser
Mode not allowed for IoUser.
- DuplicateIoAssignment
The same Iois assigned multiple times in the same request.

- IoName
Name of the I/O to assign to IoUser.
- IoMode
The mode to configure the I/O to use.
- IoUser
IoUser to assign Io to.
- Error
Error IoUser to assign Io to.

- Name: GetIoAssignmentList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetIoUserInfoList
- Access Class: READ_SYSTEM

- Name: GetIoInfoList
- Access Class: READ_SYSTEM

- Name: SetIoAssignment
- Access Class: WRITE_SYSTEM

| Message name | Description |
| --- | --- |
| GetIoAssignmentListRequest | This message shall be empty. |
| GetIoAssignmentListResponse | This message contains:- IoAssignment:axisio:IoAssignment IoAssignment [0][unbounded] |

| Message name | Description |
| --- | --- |
| GetIoUserInfoListRequest | This message shall be empty. |
| GetIoUserInfoListResponse | This message contains:- IoUserInfo:axisio:IoUserInfo IoUserInfo [0][unbounded] |

| Message name | Description |
| --- | --- |
| GetIoInfoListRequest | This message shall be empty. |
| GetIoInfoListResponse | This message contains:- IoInfo:axisio:IoInfo IoInfo [0][unbounded] |

| Message name | Description |
| --- | --- |
| SetIoAssignmentRequest | This message contains:- IoAssignment:axisio:IoAssignment IoAssignment [0][unbounded] |
| SetIoAssignmentResponse | This message contains:- IoAssignmentError: List of failed assignments, empty if assignments ok.axisio:IoAssignmentError IoAssignmentError [0][unbounded] |

