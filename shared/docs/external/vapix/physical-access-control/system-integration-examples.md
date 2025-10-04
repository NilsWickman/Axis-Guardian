# System integration examples

**Source:** https://developer.axis.com/vapix/physical-access-control/system-integration-examples/
**Last Updated:** Aug 28, 2025

---

# System integration examples

## Entry manager​

### Entry manager workflow​

#### Configure device specific settings​

#### Hardware installation and configuration​

#### Network door controllers in system​

#### Access management​

## Entry manager examples​

### Devices, controllers and units​

#### API usage​

### Users and credentials​

#### API usage​

#### Examples​

### Groups​

#### API usage​

#### Examples​

### Doors​

#### API usage​

#### Examples​

### Locks and lock monitors​

#### API usage​

#### Configuring a 12V lock​

#### Configuring a relay lock​

#### Configuring no lock​

#### Examples​

### Id points – Readers and REX buttons​

#### API usage​

#### Configuring a Wiegand reader​

#### Configuring an OSDP reader​

#### Configuring a REX device​

#### Examples​

### I/O assignment​

#### API usage​

#### Examples​

### Schedules​

#### Combining schedules​

#### API usage​

#### Examples​

### Access management​

### API usage​

#### Access to a door using reader, card, and PIN code​

#### Access to a door using PIN only​

#### Access to a door using REX button​

### Priority configurations​

This part of the documentation describes how AXIS Entry Manager uses the access control APIs to set up and administrate an access control system.

The main intended audience of the AXIS Entry Manager sections are someone building an application that should be compatible with AXIS Entry Manager and that uses the access control APIs to administrate the door controller.

The access control APIs are flexible and there are often multiple ways to configure a given behavior. The AXIS Entry Manager has its strategy in how to use the API to configure specific behavior. By following the guidelines in this section, an application developer can build an application that will use AXIS Entry Manager compatible configuration.

This section details some of the common use cases for the entry manager, listed roughly in the order in which they can be expected to be performed.

This early setup step includes configuration of settings such as date and time, device IP address, and administrator password. Use appropriate API:s from the Network Video section in VAPIX®.

Hardware configuration is the configuration of any hardware connected to a particular unit, such as readers, monitors, and locks. It consists of two steps:

Remove any old configuration.

Create a new configuration.

Both steps are handled by AXIS Entry Manager Hardware Configuration (HW Config).

The HW Config will remove and recreate API data structures related to doors and door monitors (Doors), locks and lock monitors (Locks and lock monitors), readers and REX devices (Id points – Readers and REX buttons), and I/O assignment (I/O assignment). This will affect access management as newly created doors will not permit any access, but will not affect users and groups directly.

Network door controllers in system is the task of grouping devices together into a system of distributed units. Units are added using the aconn:AddPeers request and removed using the aconn:RemovePeers request, see Connection service for more details.

For a device in a distributed system, hardware installation and configuration can be done before or after the device is added to the system. Access management, which can be distributed, must be set up after the device is added to the system. This is due to the fact that the access management configuration of the system will override the exisiting configuration of the individual device when it is joined to the system.

Access management, e.g. who can pass through which door in a given way at a given time, is a complex subject. The APIs allow for considerable freedom on how to set up access rules. AXIS Entry Manager has one approach, an overview of which is provided in section Access management.

The following sections list a number of AXIS Entry Manager concepts and how AXIS Entry Manager uses data structures and requests.

Entry manager uses the terms ‘Device’, ‘Controller’, ‘Unit’, and ‘Network door controller’ to reference a physical door controller.

Devices can be joined together to form a distributed system.

The distributed system of units is managed using aconn:AddPeers and aconn:RemovePeers requests. A physical unit is modeled using the AccessController object, where:

This section deals with the first type of user only, that is, a user may or may not have access to doors and represents, in most cases, a single physical person.

A user has one or more ID fields, which are used to identify the user. Two types of ID fields are supported by the entry manager:

A user must have at least one ID field and only one ID field of each type is allowed. That is, a single user cannot have multiple cards for instance. If the administrator needs to support a physical person with multiple cards, that physical person must be modeled as two (or more) users.

Another exception to the "one user – one physical person" rule is the case where a door is opened with a PIN code known by several people. The administrator could then create a user for the PIN code and give that user access to the door, but the user will then represent not a single person but all persons using the PIN code. This situation is discussed in more detail in Access to a door using PIN only.

A user has a first name and a last name and may belong to zero or more groups.

A single user is modeled using axudb:User and pacsaxis:Credential, exactly one of each. The group memberships (if any) of a user, are modeled using CredentialAccessProfile in Credential.

Notes on User:

Notes on Credential:

Create a user The following requests create a user named Gordon Freeman with PIN 1234, and card number 12345678.

Request

Request

Response

Response

Request

Request

Response

Response

Join a group The following is an example of the same user joining a group.

Request

Request

In AXIS Entry Manager, a group is a set of users with access to certain doors at certain times.

For example, the group "Employees" has access to the door "Front door" at all times while the group "Consultants" only has access during "Office hours".

Note that a user being part of a group with access to a door does not necessarily mean that the user can access the door. For instance, the user must have the necessary type (or types) of IdData:s defined in its Credential and the door must be set up to allow access at the given time using those IdDatas. An overview of access management can be found in Access management.

A group is modeled in AXIS Entry Manager as an AccessProfile.

Note that this is currently the only use of AccessProfile in AXIS Entry Manager. AccessProfiles are flexible and can be used, for instance, to group doors together to simplify setting up a system where numerous doors share the same configuration. AXIS Entry Manager does not currently support this, and AccessProfile is used only for groups of users.

The access of a group is managed through a list of AccessPolicy structures where each structure refers to an AccessPoint object. Each AccessPoint represents an aspect of a door, e.g. a door which allows access in both directions will have one AccessPoint for going in, and one for going out. Doors shows how AccessPoint is used to model doors.

Notes on AccessProfile:

Create a Group The following creates a group which does not grant any access.

Request

Request

Joining a Group See Examples.

Grant group access to door The following requests will give a group access to a door. Note that this does not necessarily mean that a user belonging to the group can open the door, see Access management for an overview of all the steps involved in setting up access.

Request

Request

A door can have one or two locks, can be passed in two directions (in and out), can have zero or one reader and zero or one REX device in each of the two directions.

In AXIS Entry Manager, each direction of each door has an individual set of access rules specifying when the door can be accessed and what types of IdDatas are needed. For example, a door might require a card to pass into the building during office hours, and a card with a PIN code during all other hours. When leaving the building, only a card or a press of a REX device might be required.

A door can be scheduled to be locked, double locked (locked with two locks), or unlocked at certain times. For example, during night time it might be locked with two locks, but during day time only one lock is locked.

Note that AXIS Entry Manager does not allow doors to share common configuration, each door is configured individually.

Up to two doors per device are supported.

To model a door, AXIS Entry Manager uses the structures Door, DoorConfiguration, AccessPoint, AuthenticationProfile, DoorScheduleConfiguration and IoAssignment. IoAssignment:s are explained in I/O assignment, the others are explained below.

Each device supports up to two doors. Configuring a door includes creating the following objects:

Notes on DoorConfiguration:

Its token should match the token of the Door object it corresponds to.

The following items are set in the Configuration field:

DebounceTime is set to "0". AXIS Entry Manager will work with other values, but will always set this value.

DoorMonitor.ValueWhenOpen is set to "Input Open". AXIS Entry Manager will work with other values, but will always set this value.

DoorMonitor.ValueWhenClosed is set to "Input Ground". AXIS Entry Manager will work with other values, but will always set this value.

Other Configuration items are set according to what locks and door monitors are associated with the door, seeLocks and lock monitors for details.

DeviceUUID is set by the device and left untouched by AXIS Entry Manager.

Notes on Door:

Notes on AccessPoint:

Notes on AuthenticationProfile:

No more than one AuthenticationProfile is ever created for each type of IdData (PIN, card and PIN, card and REX) per AccessPoint.

Name and Description are not used by AXIS Entry Manager.

Schedule lists the schedules for when the rules of the AuthenticationProfile:s applies, see Combining schedules for details on how the schedules are combined.

IdFactor:s contains one or more items depending on what type of credentials are needed to access the door:

If access should be granted using a PIN code without a card, one IdFactor is created with IdDataName set to "PIN", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".

If access should be granted using a card without a PIN code, one IdFactor is created with IdDataName set to "CardNr", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".

If access should be granted using a card in combination with a PIN, two IDFactor items are created. One with IdDataName set to "PIN" and one with IdDataName set to "CardNr". For both IdFactor items, IdMatchOperatorName is set to "IdDataEqual" and OperatorValue is set to "".

If access should be granted using a REX device, one IdFactor is created with IdDataName set to "REX", IdMatchOperatorName set to "OperatorValueEqual", and OperatorValue set to "Active".

Notes on DoorScheduleConfiguration:

AXIS Entry Manager uses DoorScheduleConfiguration:s for one purpose: to configure that the door is unlocked, locked, or double locked (locked with two locks) at certain times.

For each door, there exists zero or one DoorScheduleConfiguration. DoorScheduleConfiguration objects are never shared between doors, the schedule for each door is configured individually.

The DoorScheduleConfiguration uses the same token as the Door and the DoorConfiguration. This is to keep track of which DoorScheduleConfiguration objects to remove if the unit is reconfigured. When running the HW Config in AXIS Entry Manager, it will remove any old hardware configuration from the unit, including door schedule configurations. If a DoorScheduleConfiguration has the same token as a Door which is removed, the DoorScheduleConfiguration will also be removed.

Name and Description are not used by AXIS Entry Manager.

DoorSchedule is set to a door schedule without specifying PriorityLevel, that is, the default priority level is used, see Priority configurations for a discussion on priority levels. The door schedule contains at least oneScheduledState:

ScheduledState objects have EnterAction set to "Unlock", "Lock", or "DoubleLock".

If multiple ScheduledState objects are present, they are sorted according to their enter action, first "Unlock", then "Lock", then "DoubleLock".

There is always at least one ScheduledState with the maximum lock level available for the door. If the door has two locks this will be "DoubleLock", if the door has one door it will be "Lock". As per the sort order above, this will always be the last ScheduledState in the list. This ScheduledState forms a baseline for the scheduling of the door and has always a single ScheduleToken associated with it, "standard_always".

Create a Door with a 12V lock and a reader going in The following requests will create a door with a 12V lock and a single reader for passing in through the door. Note the requests for setting up the reader and configure I/O assignments are not included, see I/O assignment and Schedules for details on how to do that.

Request

Request

Response

Response

Request

Request

Response

Response

Request

Request

Response

Response

Request

Request

Preparing Access to a Door using Card and PIN Configuring access to a door involves several steps, the requests below will configure a door so that it can be accessed at all times using card and PIN by a user belonging to a group with valid access to the specified door. See Access management for an overview of all the steps involved in setting up access. Create an AuthenticationProfile:

Request

Request

Response

Response

Update AccessPoint to use the new AuthenticationProfile:

Request

Request

Schedule a Door to be Unlocked During Office Hours The following request creates a schedule for office hours (09:00-17:00 Monday-Friday), see Schedules for more information about schedules.

Request

Request

Response

Response

Create the DoorScheduleConfiguration (using the same token as the door) and update the DoorConfiguration to reference the new DoorScheduleConfiguration:

Request

Request

Response

Response

Entry manager supports the following types of locks:

If a given device has a single door connected, the door can then have one or two locks. If the device has two doors connected, the doors can have one lock each. All combinations of locks are not supported, for instance, the hardware has only one relay so only a single relay lock can be connected to a device.

Locks are configured when the door is set up using the DoorConfiguration object, by setting corresponding properties in Configuration. See I/O assignment on how the physical hardware to the locks is configured using IoAssignment objects.

Important note: The following subsections detail how AXIS Entry Manager sets Configuration for various types of locks. AXIS Entry Manager does not support setting other values than the values below, but it will correctly display them (where applicable) and allow administration of the system. For AXIS Entry Manager to correctly work however, the following two configuration items must be set as listed below:

When configuring a 12V lock as the first lock on a door, the following configuration items are set:

When configuring a 12V lock as the second lock on a door, the following Configuration items are set:

When configuring a relay lock as the first lock on a door, the following configuration items are set:

When configuring a 12V lock as the second lock on a door, the following Configuration items are set:

If there is no second lock connected to the door, the following configuration items must be set:

Set up a door with a single 12V lock See Examples for an example on how to set up a 12V lock.

Setup Door with Single Relay Lock The following request configures a door with a single relay lock:

Setup Door with Two 12V Locks The following request configures a door with two 12V locks:

Id points represent something with which it is possible to gain access to a door. The entry manager supports two types of ID points:

An ID point is always associated with a single door and can be used to gain access to that door if additional conditions are met (such as the user owning the card having access rights to that door at that time). AXIS Entry Manager supports the following readers:

AXIS Entry Manager supports the following REX devices:

ID points are modeled using IdPoint and IdPointConfiguration and references IdDataConfiguration objects. SeeI/O assignment on how to configure the hardware to the readers using IoAssignment objects.

For each ID point, reader or REX, there is exactly one IdPoint and one IdPointConfiguration object. AXIS Entry Manager does not modify the IdDataConfiguration objects, relying on the default objects created when the unit is programmed.

Door and IdPoint objects are connected using AccessPoint objects, see API usage for details.

Notes on IdPoint:

Notes on IdPointConfiguration:

Important note: In the subsections below it is detailed how AXIS Entry Manager sets Configuration for various types of readers and REX devices. Other configurations are possible, for instance, a different reader might require a different LED or tampering monitor. AXIS Entry Manager does not support setting other values than the values below, but it will correctly display them (where applicable) and allow administration of the system. However, for AXIS Entry Manager to work correctly, the following two configuration items must be set as listed below:

Notes on IdDataConfiguration:

When configuring a Wiegand reader the following Configuration items are set in the IdPointConfiguration:

When configuring an OSDP reader that uses RS485 half duplex, the following Configuration items are set in the IdPointConfiguration:

When configuring a REX device the following Configuration items are set in the IdPointConfiguration:

If the REX device is active low, the following additional Configuration items are set:

If the REX device is active high, the following additional Configuration items are set:

Setup Wiegand reader The following requests are used to set up a Wiegand reader. The I/O assignment setup is not included in this example but must also be completed before the setup can be used. For I/O assignment details, see I/O assignment. The following request fetches the current set of IdDataConfiguration objects that the unit knows of (response shortened for brevity).

Request

Request

Response

Response

Create and configure ID point:

Request

Request

Response

Response

Request

Request

Setup Half Duplex OSDP Reader The following requests are used to set up a half-duplex OSDP reader. The IdDataConfiguration objects are obtained in the same way as in the Wiegand example above.

Request

Request

Response

Response

Request

Request

Setup Active Low REX Button The following requests are used to set up a REX button that is activated by a closed circuit (ActiveLow).

Request

Request

Response

Response

Request

Request

I/O assignments control how physical hardware are connected to the different services, that is, which service entities use which pins and for what. AXIS Entry Manager provides two basic functions regarding I/O assignment:

As a final step of the HW Config, I/O assignments are created for all the hardware that the user has indicated will be connected to the unit.

AXIS Entry Manager uses the I/O assignments to visualize to the user how hardware should be connected to the unit.

The access control APIs define a set of I/Os that each correspond to one or more physical pins on the device. The I/Os deal mainly with pins that carry information to and from the device. Most other pins, such as some ground pins and all power pins, are not part of any I/O. A given pin can belong to multiple I/Os if it has multiple uses. IoAssignment objects control which pins are to be used by which hardware devices. When creating I/O assignments as part of the hardware wizard, AXIS Entry Manager will assign pins according to the table. When visualizing I/O assignments read from the device, AXIS Entry Manager will use the information found in the IoAssignment objects. It will also try to deduce additional information about ground pins and present that as well. AXIS Entry Manager can visualize any legal I/O assignment configuration. Notes on IoAssignment:

I/O assignment setup in AXIS A1001's WebGUI.

I/O assignment setup in AXIS A1601's WebGUI

Create I/O Assignments for Wiegand Reader The following requests create I/O assignments for connecting a Wiegand reader as the first reader:

Request

Request

Schedules describe when in time a certain state of some kind applies. A schedule is a set of time intervals. An example of a schedule would be "every Tuesday between 14:00 and 16:00". However, "every Tuesday at 14:00" is not a schedule since it describes a set of points in time, not a set of time intervals.

AXIS Entry Manager sets up schedules with either normal schedules or exceptions. Exceptions are subtracted from normal schedules as described in on Combining schedules.

There are currently three types of supported time intervals, where each schedule can contain a mix of intervals of the three types:

One-off intervals defines a single interval in time, for instance, 12:00-14:00 on April 1 2012. The interval can be of any length.

Yearly intervals define an interval that occurs yearly, for instance, every year 12:00-14:00 on April 1. The interval can be no longer than 24 hours.

Weekly intervals define intervals that occurs every week on certain week days, for example, 12:00-14:00 every Tuesday and Thursday. The intervals can be no longer than 24 hours.

Recurring intervals (types 2, 3) can have an optional end date. Any time interval starting after the end date are ignored. When it comes to rules for leap years, leap seconds and so forth, schedules follow the same rules as iCalendar objects since they are internally represented using iCalendar.

In most situations where a schedule is specified, it is possible to specify a set of schedules. The schedules in the set are then combined in two steps:

All normal schedules are combined, creating the union of their time intervals.

All exception schedules are subtracted.

Note the order, first all normal schedules are combined, then all exception schedules are subtracted. All exception schedules always take precedence over normal schedules.

Schedules are modeled using Schedule objects.

AXIS Entry Manager assumes that there is a standard schedule on the device with the token standard_always that matches any point in time. This schedule exists by default but it can later be modified using the API. Doing so will break AXIS Entry Manager, so do not change standard_always if you want to use AXIS Entry Manager. Notes on Schedule:

Notes on iCalendar:

AXIS Entry Manager follows the iCalendar specification as described in RFC 5545. This includes setting of mandatory fields such as VERSION, PRODID, DTSTAMP, UID and so forth.

Time granularity is minutes. No time specifications use seconds or fractions of a second (exception: UNTIL uses seconds, see below). In all instances where it is possible to choose between date types, AXIS Entry Manager uses Date-Time.

Intervals are defined using VEVENTs, with RRULEs where applicable.

Each VEVENT uses the SUMMARY field to name the VEVENT.

One-off intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the interval.

Yearly recurring intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the first occurrence of the interval.

Note that the first occurrence can start on one day and end on another (for instance, 23:00-11:00), but its length must not exceed 24 hours. RRULE is set to yearly, like this: "RRULE:FREQ=YEARLY".

Weekly recurring intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the first occurrence of the interval.

Note that the first occurrence can start on one day and end on another (for instance, 23:00-11:00), but its length must not exceed 24 hours. RRULE is set to weekly, like this: "RRULE is set to weekly, like this: "RRULE:FREQ=WEEKLY;BYDAY=<list of days>", for example "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR".

For recurring intervals, the optional end date is specified by appending an UNTIL clause to the RRULE, specifying the last second of a day. Example: UNTIL=20121031T225959. This is the only instance where AXIS Entry Manager specifies Date-Times with second granularity.

Create an Empty Schedule The following request creates an empty Schedule:

Create a One-Off Schedule The following request creates a schedule that contains one time interval, December 24 2012 00:00-24:00.

Create a Yearly Recurring Schedule The following request creates a schedule that contains yearly recurring intervals 00:00-24:00 each December 24, starting 2000:

Create a Weekly Recurring Schedule The following request creates a schedule that contains intervals that occurs every week day between 11:00 and 12:00:

Create Schedule with End Date The following request creates a schedule that contains intervals every day between 12:00 and 14:00 between October 1 2012 and October 31 2012:

With a system set up and administrated using AXIS Entry Manager, there are three ways to gain access to a door:

By manually unlocking it pressing a device in the user interface. This will use the UnlockDoor or AccessDoor requests found in the DoorControl service.

By configuring the door to unlock at certain times, based on a schedule. For details, see Doors

By configuring access so that the user can unlock the door by presenting a credential (card and/or PIN) to a reader or pressing a REX device.

This section deals with alternative 3.

This section describes how the entry manager configures access to a door for a particular user (or groups of users). Note that the access control APIs are flexible and there are many ways of configuring access, AXIS Entry Manager only uses specific parts of the API.

For a user to be able to pass in through a door by presenting a card to a reader and entering a PIN code, the following API objects must be set up:

The door itself must be configured.

This includes creating a Door, a DoorConfiguration and I/O assignments for the hardware of the door. Door is explained in Doors, DoorConfiguration in Locks and lock monitors, and I/O assignments in section I/O assignment.

The reader must be configured.

This includes creating an IdPoint, an IdPointConfiguration and I/O assignments for the hardware of the reader. IdPoint and IdPointConfiguration are explained in Id points – Readers and REX buttons.

An AccessPoint for the direction "in".

This is explained in Doors. The AccessPoint must reference the door from step 1 and the reader from step 2.

An AuthenticationProfile, which grants access using "card and PIN, must be added to the AccessPoint from step 3. The AuthenticationProfile is associated with a Schedule for when access is granted. The schedule could be the standard schedule standard_always, or a custom schedule could be created, see Schedules. AuthenticationProfile is described in Doors.

A group must be created, for details see Groups. This includes creating an AccessProfile object.

The Schedule field of the AccessProfile must contain at least one Schedule indicating when the group is active. This can be the Schedule standard_always or a custom Schedule.

The AccessProfile’s AccessPolicy field must reference the AccessPoint created in step 3. The schedule associated with the AccessPoint must be standard_always and nothing else, as described in Groups.

A user must be created, for details see Users and credentials.

This includes creating one User and one Credential. The Credential must contain two IdData items, one for the user’s card number, one for the user’s PIN code. The CredentialAccessProfile of the Credential must reference the AccessProfile of the group created in step 5.

This will grant the user access to the door when two specific conditions are met:

Letting someone access a door using a PIN code (without a card) is similar to accessing it using a card and PIN, and involves the same steps as in section Access to a door using reader, card, and PIN code with the following exceptions:

Letting someone access a door using a REX device is similar to accessing it using a reader, and involves the same steps as in section Access to a door using reader, card, and PIN code with the following exceptions:

AXIS Entry Manager uses the default PriorityConfiguration, which contains a single priority level. All actions that can have a priority level associated with them uses the default (unspecified) priority level. Examples:

Since all actions use the same priority level they will override each other. For example, if a door is manually unlocked, it will only stay so until the DoorScheduleConfiguration specifies another action (if ever).

```
{    "axudb:SetUser": {        "User": [            {                "Name": "Freeman, Gordon",                "Description": "",                "Attribute": [                    {                        "type": "string",                        "Name": "FirstName",                        "Value": "Gordon"                    },                    {                        "type": "string",                        "Name": "LastName",                        "Value": "Freeman"                    }                ]            }        ]    }}
```

```
<axudb:SetUser>    <axudb:User token="">        <axudb:Attribute type="string" Name="FirstName" Value="Gordon" />        <axudb:Attribute type="string" Name="LastName" Value="Freeman" />        <axudb:Description />        <axudb:Name>Freeman, Gordon</axudb:Name>    </axudb:User></axudb:SetUser>
```

```
{    "Token": ["Axis-00408c184bd9:1350638010.566278000"]}
```

```
<Token>Axis-00408c184bd9:1350638010.566278000</Token>
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "Enabled": true,                "Status": "Enabled",                "IdData": [                    {                        "Name": "PIN",                        "Value": "1234"                    },                    {                        "Name": "CardNr",                        "Value": "12345678"                    }                ],                "CredentialAccessProfile": [],                "UserToken": "Axis-00408c184bd9:1350638010.566278000"            }        ]    }}
```

```
<pacsaxis:SetCredential>    <pacsaxis:Credential token="">        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:IdData Name="CardNr" Value="12345678" />        <pacsaxis:IdData Name="PIN" Value="1234" />        <pacsaxis:Status>Enabled</pacsaxis:Status>        <pacsaxis:UserToken>Axis-00408c184bd9:1350638010.566278000</pacsaxis:UserToken>    </pacsaxis:Credential></pacsaxis:SetCredential>
```

```
{    "Token": ["Axis-00408c184bd9:1350638011.004953000"]}
```

```
<Token>Axis-00408c184bd9:1350638011.004953000</Token>
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "Enabled": true,                "Status": "Enabled",                "IdData": [                    {                        "Name": "PIN",                        "Value": "1234"                    },                    {                        "Name": "CardNr",                        "Value": "12345678"                    }                ],                "CredentialAccessProfile": [                    {                        "AccessProfile": "Axis-00408c184bd9:1350637958.280031000"                    }                ],                "UserToken": "Axis-00408c184bd9:1350638010.566278000",                "token": "Axis-00408c184bd9:1350638011.004953000"            }        ]    }}
```

```
<pacsaxis:SetCredential>    <pacsaxis:Credential token="Axis-00408c184bd9:1350638011.004953000">        <pacsaxis:CredentialAccessProfile>            <pacsaxis:AccessProfile>Axis-00408c184bd9:1350637958.280031000</pacsaxis:AccessProfile>        </pacsaxis:CredentialAccessProfile>        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:IdData Name="CardNr" Value="12345678" />        <pacsaxis:IdData Name="PIN" Value="1234" />        <pacsaxis:Status>Enabled</pacsaxis:Status>        <pacsaxis:UserToken>Axis-00408c184bd9:1350638010.566278000</pacsaxis:UserToken>    </pacsaxis:Credential></pacsaxis:SetCredential>
```

```
{    "pacsaxis:SetAccessProfile": {        "AccessProfile": [            {                "Name": "Physicists",                "Description": "",                "Enabled": true,                "Schedule": [],                "AccessPolicy": [],                "Attribute": [],                "AuthenticationProfile": []            }        ]    }}
```

```
<pacsaxis:SetAccessProfile>    <pacsaxis:AccessProfile token="">        <pacsaxis:AuthenticationProfile />        <pacsaxis:Description />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Name>Physicists</pacsaxis:Name>        <pacsaxis:Schedule />    </pacsaxis:AccessProfile></pacsaxis:SetAccessProfile>
```

```
{    "pacsaxis:SetAccessProfile": {        "AccessProfile": [            {                "Name": "Physicists",                "Description": "",                "Enabled": true,                "Schedule": [],                "AccessPolicy": [                    {                        "Schedule": ["standard_always"],                        "AccessPoint": "Axis-00408c184bd9:1350630875.789015000"                    },                    {                        "Schedule": ["standard_always"],                        "AccessPoint": "Axis-00408c184bd9:1350630876.738613000"                    }                ],                "Attribute": [],                "AuthenticationProfile": [],                "token": "Axis-00408c184bd9:1350644754.557727000"            }        ]    }}
```

```
<pacsaxis:SetAccessProfile>    <pacsaxis:AccessProfile token="Axis-00408c184bd9:1350644754.557727000">        <pacsaxis:AccessPolicy>            <pacsaxis:AccessPoint>Axis-00408c184bd9:1350630875.789015000</pacsaxis:AccessPoint>            <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        </pacsaxis:AccessPolicy>        <pacsaxis:AccessPolicy>            <pacsaxis:AccessPoint>Axis-00408c184bd9:1350630876.738613000</pacsaxis:AccessPoint>            <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        </pacsaxis:AccessPolicy>        <pacsaxis:AuthenticationProfile />        <pacsaxis:Description />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Name>Physicists</pacsaxis:Name>        <pacsaxis:Schedule />    </pacsaxis:AccessProfile></pacsaxis:SetAccessProfile>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "Lock.{LockWhenDoorOpens",                        "Value": "false"                    },                    {                        "Name": "DoorMonitor.ValueWhenOpen",                        "Value": "Input Open"                    },                    {                        "Name": "DoorMonitor.ValueWhenClosed",                        "Value": "Input Ground"                    },                    {                        "Name": "DoubleLock.Type",                        "Value": "None"                    },                    {                        "Name": "Lock.Type",                        "Value": "Standard"                    },                    {                        "Name": "Lock.ValueWhenLocked",                        "Value": "Gnd"                    },                    {                        "Name": "Lock.ValueWhenUnlocked",                        "Value": "12V"                    },                    {                        "Name": "Lock.BoltOutTime",                        "Value": "0"                    },                    {                        "Name": "Lock.BoltInTime",                        "Value": "0"                    }                ]            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="">        <axtdc:Configuration>            <ns0:Name>Lock.LockWhenDoorOpens</ns0:Name>            <ns0:Value>false</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.ValueWhenOpen</ns0:Name>            <ns0:Value>Input Open</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.ValueWhenClosed</ns0:Name>            <ns0:Value>Input Ground</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.Type</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Type</ns0:Name>            <ns0:Value>Standard</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.ValueWhenLocked</ns0:Name>            <ns0:Value>Gnd</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.ValueWhenUnlocked</ns0:Name>            <ns0:Value>12V</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.BoltOutTime</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.BoltInTime</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "Token": "Axis-00408c184bd9:1350969415.227159000"}
```

```
<axtdc:Token>Axis-00408c184bd9:1350969415.227159000</axtdc:Token>
```

```
{    "axtdc:SetDoor": {        "Door": [            {                "Name": "Front door",                "AccessTime": "PT7S",                "OpenTooLongTime": "PT30S",                "PreAlarmTime": "PT10S",                "ExtendedAccessTime": "PT30S",                "ExtendedOpenTooLongTime": "PT60S",                "HeartbeatInterval": "PT600S",                "DefaultPriority": "",                "token": "Axis-00408c184bd9:1350969415.227159000"            }        ]    }}
```

```
<axtdc:SetDoor>    <axtdc:Door token="Axis-00408c184bd9:1350969415.227159000">        <axtdc:AccessTime>PT7S</axtdc:AccessTime>        <axtdc:DefaultPriority />        <axtdc:ExtendedAccessTime>PT30S</axtdc:ExtendedAccessTime>        <axtdc:ExtendedOpenTooLongTime>PT60S</axtdc:ExtendedOpenTooLongTime>        <axtdc:HeartbeatInterval>PT600S</axtdc:HeartbeatInterval>        <axtdc:Name>Front door</axtdc:Name>        <axtdc:OpenTooLongTime>PT30S</axtdc:OpenTooLongTime>        <axtdc:PreAlarmTime>PT10S</axtdc:PreAlarmTime>        <axtdc:PriorityConfiguration />    </axtdc:Door></axtdc:SetDoor>
```

```
{    "Token": "Axis-00408c184bd9:1350969415.227159000"}
```

```
<axtdc:Token>Axis-00408c184bd9:1350969415.227159000</axtdc:Token>
```

```
{    "pacsaxis:SetAccessPoint": {        "AccessPoint": [            {                "Type": "axtdc:Door",                "Name": "Front door",                "Enabled": true,                "Action": "AccessDoor",                "Entity": "Axis-00408c184bd9:1350969415.227159000",                "Attribute": [                    {                        "Name": "Direction",                        "Value": "in"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "Axis-00408c184bd9:1350969415.294313000"                    }                ],                "AuthenticationProfile": [],                "DoorDeviceUUID": "5581ad80-95b0-11e0-b883-00408c184bd9"            }        ]    }}
```

```
<pacsaxis:SetAccessPoint>    <pacsaxis:AccessPoint token="">        <pacsaxis:Action>AccessDoor</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="in" />        <pacsaxis:AuthenticationProfile />        <pacsaxis:DoorDeviceUUID>5581ad80-95b0-11e0-b883-00408c184bd9</pacsaxis:DoorDeviceUUID>        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>Axis-00408c184bd9:1350969415.227159000</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:IdPoint>Axis-00408c184bd9:1350969415.294313000</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>Front door</pacsaxis:Name>        <pacsaxis:Type>axtdc:Door</pacsaxis:Type>    </pacsaxis:AccessPoint></pacsaxis:SetAccessPoint>
```

```
{    "Token": ["Axis-00408c184bd9:1350969417.922694000"]}
```

```
<Token>Axis-00408c184bd9:1350969417.922694000</Token>
```

```
{    "pacsaxis:SetAccessController": {        "AccessController": [            {                "Name": "Axis-00408c184bd9 AccessController",                "Description": "",                "token": "Axis-00408c184bd9 AccessController",                "AccessPoint": ["Axis-00408c184bd9:1350969417.922694000"]            }        ]    }}
```

```
<pacsaxis:SetAccessController>    <pacsaxis:AccessController token="Axis-00408c184bd9 AccessController">        <pacsaxis:AccessPoint>Axis-00408c184bd9:1350969417.922694000</pacsaxis:AccessPoint>        <pacsaxis:Description />        <pacsaxis:Name>Axis-00408c184bd9 AccessController</pacsaxis:Name>    </pacsaxis:AccessController></pacsaxis:SetAccessController>
```

```
{    "pacsaxis:SetAuthenticationProfile": {        "AuthenticationProfile": [            {                "Name": "",                "Description": "",                "Schedule": ["standard_always"],                "IdFactor": [                    {                        "IdDataName": "CardNr",                        "IdMatchOperatorName": "IdDataEqual",                        "OperatorValue": ""                    },                    {                        "IdDataName": "PIN",                        "IdMatchOperatorName": "IdDataEqual",                        "OperatorValue": ""                    }                ]            }        ]    }}
```

```
<pacsaxis:SetAuthenticationProfile>    <pacsaxis:AuthenticationProfile token="">        <pacsaxis:Description />        <pacsaxis:IdFactor>            <pacsaxis:IdDataName>CardNr</pacsaxis:IdDataName>            <pacsaxis:IdMatchOperatorName>IdDataEqual</pacsaxis:IdMatchOperatorName>            <pacsaxis:OperatorValue />        </pacsaxis:IdFactor>        <pacsaxis:IdFactor>            <pacsaxis:IdDataName>PIN</pacsaxis:IdDataName>            <pacsaxis:IdMatchOperatorName>IdDataEqual</pacsaxis:IdMatchOperatorName>            <pacsaxis:OperatorValue />        </pacsaxis:IdFactor>        <pacsaxis:Name />        <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>    </pacsaxis:AuthenticationProfile></pacsaxis:SetAuthenticationProfile>
```

```
{    "Token": ["Axis-00408c184bd9:1350970418.654225000"]}
```

```
<Token>Axis-00408c184bd9:1350970418.654225000</Token>
```

```
{    "pacsaxis:SetAccessPoint": {        "AccessPoint": [            {                "EntityType": "axtdc:Door",                "Name": "Front door",                "Enabled": true,                "Action": "AccessDoor",                "AuthenticationProfile": ["Axis-00408c184bd9:1350970418.654225000"],                "Entity": "Axis-00408c184bd9:1350969415.227159000",                "Attribute": [                    {                        "type": "",                        "Name": "Direction",                        "Value": "in"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "Axis-00408c184bd9:1350969415.294313000",                        "DeviceUUID": ""                    }                ],                "token": "Axis-00408c184bd9:1350969417.922694000",                "Description": "",                "DoorDeviceUUID": "5581ad80-95b0-11e0-b883-00408c184bd9"            }        ]    }}
```

```
<pacsaxis:SetAccessPoint>    <pacsaxis:AccessPoint token="Axis-00408c184bd9:1350969417.922694000">        <pacsaxis:Action>AccessDoor</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="in" />        <pacsaxis:AuthenticationProfile>Axis-00408c184bd9:1350970418.654225000</pacsaxis:AuthenticationProfile>        <pacsaxis:Description />        <pacsaxis:DoorDeviceUUID>5581ad80-95b0-11e0-b883-00408c184bd9</pacsaxis:DoorDeviceUUID>        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>Axis-00408c184bd9:1350969415.227159000</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:DeviceUUID />            <pacsaxis:IdPoint>Axis-00408c184bd9:1350969415.294313000</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>Front door</pacsaxis:Name>        <pacsaxis:Type>axtdc:Door</pacsaxis:Type>    </pacsaxis:AccessPoint></pacsaxis:SetAccessPoint>
```

```
{    "axschSetSchedule": {        "Schedule": [            {                "Name": "Office hours",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:9 to 5\r\nDTSTART:20000103T090000\r\nDTEND:20000103T170000\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\nDTSTAMP:20121023T070313\r\nUID:b12275a419c40609\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axschSetSchedule>  <axschSchedule token="">    <axschDescription></axschDescription>    <axschExceptionScheduleDefinition></axschExceptionScheduleDefinition>    <axschName>Office hours</axschName>    <axschScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;SUMMARY:9 to 5&#xD;&#xA;DTSTART:20000103T090000&#xD;&#xA;DTEND:20000103T170000&#xD;&#xA;RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR&#xD;&#xA;DTSTAMP:20121023T070313&#xD;&#xA;UID:b12275a419c40609&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axschScheduleDefinition>    </axschSchedule></axschSetSchedule>
```

```
{    "Token": ["Axis-00408c184bd9:1350975752.527366000"]}
```

```

```

```
{    "axtdc:SetDoorScheduleConfiguration": {        "DoorScheduleConfiguration": [            {                "DoorSchedule": [                    {                        "ScheduledState": [                            {                                "ScheduleToken": ["Axis-00408c184bd9:1350975752.527366000"],                                "EnterAction": "Unlock"                            },                            {                                "ScheduleToken": ["standard_always"],                                "EnterAction": "Lock"                            }                        ]                    }                ],                "token": "Axis-00408c184bd9:1350976375.337548000"            }        ]    }}
```

```
<axtdc:SetDoorScheduleConfiguration>    <axtdc:DoorScheduleConfiguration token="Axis-00408c184bd9:1350976375.337548000">        <axtdc:DoorSchedule>            <axtdc:ScheduledState>                <axtdc:EnterAction>Unlock</axtdc:EnterAction>                <axtdc:ScheduleToken>Axis-00408c184bd9:1350975752.527366000</axtdc:ScheduleToken>            </axtdc:ScheduledState>            <axtdc:ScheduledState>                <axtdc:EnterAction>Lock</axtdc:EnterAction>                <axtdc:ScheduleToken>standard_always</axtdc:ScheduleToken>            </axtdc:ScheduledState>        </axtdc:DoorSchedule>    </axtdc:DoorScheduleConfiguration></axtdc:SetDoorScheduleConfiguration>
```

```
{    "Token": "Axis-00408c184bd9:1350969415.227159000"}
```

```
<axtdc:Token>Axis-00408c184bd9:1350969415.227159000</axtdc:Token>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "DeviceUUID": "5581ad80-95b0-11e0-b883-00408c184bd9",                "token": "Axis-00408c184bd9:1350969415.227159000",                "DoorScheduleConfiguration": "Axis-00408c184bd9:1350969415.227159000",                "Configuration": [                    {                        "Name": "Lock.LockWhenDoorOpens",                        "Value": "false"                    },                    {                        "Name": "DoorMonitor.ValueWhenOpen",                        "Value": "Input Open"                    },                    {                        "Name": "DoorMonitor.ValueWhenClosed",                        "Value": "Input Ground"                    },                    {                        "Name": "DoubleLock.Type",                        "Value": "None"                    },                    {                        "Name": "Lock.Type",                        "Value": "Standard"                    },                    {                        "Name": "Lock.ValueWhenLocked",                        "Value": "Gnd"                    },                    {                        "Name": "Lock.ValueWhenUnlocked",                        "Value": "12V"                    },                    {                        "Name": "Lock.BoltOutTime",                        "Value": "0"                    },                    {                        "Name": "Lock.BoltInTime",                        "Value": "0"                    }                ]            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="Axis-00408c184bd9:1350969415.227159000">        <axtdc:Configuration>            <axconf:Name>Lock.LockWhenDoorOpens</axconf:Name>            <axconf:Value>false</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenOpen</axconf:Name>            <axconf:Value>Input Open</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenClosed</axconf:Name>            <axconf:Value>Input Ground</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoubleLock.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Type</axconf:Name>            <axconf:Value>Standard</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.ValueWhenLocked</axconf:Name>            <axconf:Value>Gnd</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.ValueWhenUnlocked</axconf:Name>            <axconf:Value>12V</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.BoltOutTime</axconf:Name>            <axconf:Value>0</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.BoltInTime</axconf:Name>            <axconf:Value>0</axconf:Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />        <axtdc:DoorScheduleConfiguration>Axis-00408c184bd9:1350969415.227159000</axtdc:DoorScheduleConfiguration>    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "Lock.LockWhenDoorOpens",                        "Value": "false"                    },                    {                        "Name": "DoorMonitor.ValueWhenOpen",                        "Value": "Input Open"                    },                    {                        "Name": "DoorMonitor.ValueWhenClosed",                        "Value": "Input Ground"                    },                    {                        "Name": "DoubleLock.Type",                        "Value": "None"                    },                    {                        "Name": "Lock.Type",                        "Value": "Relay"                    },                    {                        "Name": "Lock.RelayStateWhenLocked",                        "Value": "Open"                    },                    {                        "Name": "Lock.BoltOutTime",                        "Value": "0"                    },                    {                        "Name": "Lock.BoltInTime",                        "Value": "0"                    }                ]            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="">        <axtdc:Configuration>            <axconf:Name>Lock.LockWhenDoorOpens</axconf:Name>            <axconf:Value>false</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenOpen</axconf:Name>            <axconf:Value>Input Open</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenClosed</axconf:Name>            <axconf:Value>Input Ground</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoubleLock.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Type</axconf:Name>            <axconf:Value>Relay</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.RelayStateWhenLocked</axconf:Name>            <axconf:Value>Open</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.BoltOutTime</axconf:Name>            <axconf:Value>0</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.BoltInTime</axconf:Name>            <axconf:Value>0</axconf:Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "Lock.LockWhenDoorOpens",                        "Value": "false"                    },                    {                        "Name": "DoorMonitor.ValueWhenOpen",                        "Value": "Input Open"                    },                    {                        "Name": "DoorMonitor.ValueWhenClosed",                        "Value": "Input Ground"                    },                    {                        "Name": "DoubleLock.Type",                        "Value": "Standard"                    },                    {                        "Name": "DoubleLock.ValueWhenLocked",                        "Value": "Gnd"                    },                    {                        "Name": "DoubleLock.ValueWhenUnlocked",                        "Value": "12V"                    }                ]            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="">        <axtdc:Configuration>            <axconf:Name>Lock.LockWhenDoorOpens</axconf:Name>            <axconf:Value>false</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenOpen</axconf:Name>            <axconf:Value>Input Open</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.ValueWhenClosed</axconf:Name>            <axconf:Value>Input Ground</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoubleLock.Type</axconf:Name>            <axconf:Value>Standard</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoubleLock.ValueWhenLocked</axconf:Name>            <axconf:Value>Gnd</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoubleLock.ValueWhenUnlocked</axconf:Name>            <axconf:Value>12V</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Type</axconf:Name>            <axconf:Value>Standard</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.ValueWhenLocked</axconf:Name>            <axconf:Value>Gnd</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.ValueWhenUnlocked</axconf:Name>            <axconf:Value>12V</axconf:Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "axtid:GetIdDataConfigurationList": {}}
```

```
<axtid:GetIdDataConfigurationList />
```

```
{  "IdDataConfiguration": [    {      "token": "iddataconf_wiegand_26bit_h10301",      ...    }, {      "token": "iddataconf_wiegand_34bit",      ...    }, {      "token": "iddataconf_wiegand_37bit_h10302",      ...    }, {      "token": "iddataconf_wiegand_37bit_h10304",      ...    }, {      "token": "iddataconf_wiegand_35bit_corporate1000",      ...    }  ]}
```

```
<axtid:IdDataConfiguration token="iddataconf_wiegand_26bit_h10301">  ...</axtid:IdDataConfiguration><axtid:IdDataConfiguration token="iddataconf_wiegand_34bit">  ...</axtid:IdDataConfiguration><axtid:IdDataConfiguration token="iddataconf_wiegand_37bit_h10302">  ...</axtid:IdDataConfiguration><axtid:IdDataConfiguration token="iddataconf_wiegand_37bit_h10304">  ...</axtid:IdDataConfiguration><axtid:IdDataConfiguration token="iddataconf_wiegand_35bit_corporate1000"></axtid:IdDataConfiguration>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "Wiegand"                    },                    {                        "Name": "IdPoint.LED.Type",                        "Value": "SingleLED"                    },                    {                        "Name": "IdPoint.LED.ActiveLevel",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.Beeper.Type",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.Tampering.Type",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.REX.Type",                        "Value": "None"                    },                    {                        "Name": "IdPoint.Keypress.Type",                        "Value": "Auto"                    }                ],                "IdDataConfiguration": [                    "iddataconf_wiegand_26bit_h10301",                    "iddataconf_wiegand_34bit",                    "iddataconf_wiegand_37bit_h10302",                    "iddataconf_wiegand_37bit_h10304",                    "iddataconf_wiegand_35bit_corporate1000"                ]            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>Wiegand</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.LED.Type</axconf:Name>            <axconf:Value>SingleLED</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.LED.ActiveLevel</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Beeper.Type</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Tampering.Type</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.REX.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Keypress.Type</axconf:Name>            <axconf:Value>Auto</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration>iddataconf_wiegand_26bit_h10301</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_34bit</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_37bit_h10302</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_37bit_h10304</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_35bit_corporate1000</axtid:IdDataConfiguration>    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "Axis-00408c184bd9:1350984343.970492000"}
```

```
<axtid:Token>Axis-00408c184bd9:1350984343.970492000</axtid:Token>
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Name": "Reader In",                "Action": "Access",                "Area": "",                "MinPINSize": 4,                "MaxPINSize": 4,                "EndOfPIN": "#",                "Timeout": "PT10S",                "token": "Axis-00408c184bd9:1350984343.970492000"            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="Axis-00408c184bd9:1350984343.970492000">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN>#</axtid:EndOfPIN>        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>Reader In</axtid:Name>        <axtid:Timeout>PT10S</axtid:Timeout>        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "RS-485HD"                    },                    {                        "Name": "IdPoint.LED.Type",                        "Value": "SingleLED"                    },                    {                        "Name": "IdPoint.LED.ActiveLevel",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.Beeper.Type",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.Tampering.Type",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.REX.Type",                        "Value": "None"                    },                    {                        "Name": "IdPoint.Keypress.Type",                        "Value": "Auto"                    },                    {                        "Name": "IdPoint.RS-485HD.Protocol",                        "Value": "OSDP"                    }                ],                "IdDataConfiguration": [                    "iddataconf_wiegand_26bit_h10301",                    "iddataconf_wiegand_34bit",                    "iddataconf_wiegand_37bit_h10302",                    "iddataconf_wiegand_37bit_h10304",                    "iddataconf_wiegand_35bit_corporate1000"                ]            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>RS-485HD</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.LED.Type</axconf:Name>            <axconf:Value>SingleLED</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.LED.ActiveLevel</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Beeper.Type</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Tampering.Type</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.REX.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Keypress.Type</axconf:Name>            <axconf:Value>Auto</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.RS-485HD.Protocol</axconf:Name>            <axconf:Value>OSDP</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration>iddataconf_wiegand_26bit_h10301</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_34bit</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_37bit_h10302</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_37bit_h10304</axtid:IdDataConfiguration>        <axtid:IdDataConfiguration>iddataconf_wiegand_35bit_corporate1000</axtid:IdDataConfiguration>    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "Axis-00408c184bd9:1350990773.612849000"}
```

```
<axtid:Token>Axis-00408c184bd9:1350990773.612849000</axtid:Token>
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Name": "Reader In",                "Action": "Access",                "Area": "",                "MinPINSize": 4,                "MaxPINSize": 4,                "EndOfPIN": "#",                "Timeout": "PT10S",                "token": "Axis-00408c184bd9:1350990773.612849000"            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="Axis-00408c184bd9:1350990773.612849000">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN>#</axtid:EndOfPIN>        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>Reader In</axtid:Name>        <axtid:Timeout>PT10S</axtid:Timeout>        PT10S        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "DeviceUUID": "",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "None"                    },                    {                        "Name": "IdPoint.REX.Type",                        "Value": "ActiveLow"                    },                    {                        "Name": "IdPoint.Keypress.Type",                        "Value": "Auto"                    }                ],                "IdDataConfiguration": []            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.REX.Type</axconf:Name>            <axconf:Value>ActiveLow</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Keypress.Type</axconf:Name>            <axconf:Value>Auto</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "Axis-00408c184bd9:1350990775.948030000"}
```

```
<axtid:Token>Axis-00408c184bd9:1350990775.948030000</axtid:Token>
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Name": "REX In",                "Action": "Access",                "Area": "",                "MinPINSize": 4,                "MaxPINSize": 4,                "EndOfPIN": "#",                "Timeout": "PT10S",                "token": "Axis-00408c184bd9:1350990775.948030000"            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="Axis-00408c184bd9:1350990775.948030000">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN>#</axtid:EndOfPIN>        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>REX In</axtid:Name>        <axtid:Timeout>PT10S</axtid:Timeout>        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "IO3",                "IoMode": "inout:pu/gnd",                "IoUser": [                    {                        "Type": "idpoint",                        "Usage": "Tampering",                        "MultiIo": false,                        "token": "Axis-00408c184bd9:1351067611.049683000"                    }                ]            },            {                "IoName": "IO5",                "IoMode": "inout:pu/gnd",                "IoUser": [                    {                        "Type": "idpoint",                        "Usage": "LedSingle",                        "MultiIo": false,                        "token": "Axis-00408c184bd9:1351067611.049683000"                    }                ]            },            {                "IoName": "IO6",                "IoMode": "inout:pu/gnd",                "IoUser": [                    {                        "Type": "idpoint",                        "Usage": "Beeper",                        "MultiIo": false,                        "token": "Axis-00408c184bd9:1351067611.049683000"                    }                ]            },            {                "IoName": "Wiegand1",                "IoMode": "wiegand",                "IoUser": [                    {                        "Type": "idpoint",                        "Usage": "Wiegand",                        "MultiIo": false,                        "token": "Axis-00408c184bd9:1351067611.049683000"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:pu/gnd</axisio:IoMode>        <axisio:IoName>IO3</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>Tampering</axisio:Usage>            <axisio:token>Axis-00408c184bd9:1351067611.049683000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:pu/gnd</axisio:IoMode>        <axisio:IoName>IO5</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>LedSingle</axisio:Usage>            <axisio:token>Axis-00408c184bd9:1351067611.049683000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>inout:pu/gnd</axisio:IoMode>        <axisio:IoName>IO6</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>Beeper</axisio:Usage>            <axisio:token>Axis-00408c184bd9:1351067611.049683000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>wiegand</axisio:IoMode>        <axisio:IoName>Wiegand1</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>Wiegand</axisio:Usage>            <axisio:token>Axis-00408c184bd9:1351067611.049683000</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "Name": "Never",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axsch:SetSchedule><axsch:Schedule token=""><axsch:Description></axsch:Description><axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition><axsch:Name>Never</axsch:Name><axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>    </axsch:Schedule></axsch:SetSchedule>
```

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "Name": "Christmas 2012",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:December 24 2012\r\nDTSTART:20121224T000000\r\nDTEND:20121225T000000\r\nDTSTAMP:20121019T122502\r\nUID:c674cc86cf597f1c\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axsch:SetSchedule>  <axsch:Schedule token="">    <axsch:Description></axsch:Description>    <axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition>    <axsch:Name>Christmas 2012</axsch:Name>    <axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;SUMMARY:December 24 2012&#xD;&#xA;DTSTART:20121224T000000&#xD;&#xA;DTEND:20121225T000000&#xD;&#xA;DTSTAMP:20121019T122502&#xD;&#xA;UID:c674cc86cf597f1c&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>&#xD;&#xA;    </axsch:Schedule></axsch:SetSchedule>
```

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "Name": "Christmas",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:December 24\r\nDTSTART:20001224T000000\r\nDTEND:20001225T000000\r\nRRULE:FREQ=YEARLY\r\nDTSTAMP:20121019T122814\r\nUID:7628d2029b87d980\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axsch:SetSchedule>  <axsch:Schedule token="">    <axsch:Description></axsch:Description>    <axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition>    <axsch:Name>Christmas</axsch:Name>    <axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;SUMMARY:December 24&#xD;&#xA;DTSTART:20001224T000000&#xD;&#xA;DTEND:20001225T000000&#xD;&#xA;RRULE:FREQ=YEARLY&#xD;&#xA;DTSTAMP:20121019T122814&#xD;&#xA;UID:7628d2029b87d980&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>    </axsch:Schedule></axsch:SetSchedule>
```

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "Name": "Lunch",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Lunch\r\nDTSTART:20000103T110000\r\nDTEND:20000103T120000\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\nDTSTAMP:20121019T123359\r\nUID:c5d62887d9a269ab\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axsch:SetSchedule>  <axsch:Schedule token="">    <axsch:Description></axsch:Description>    <axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition>    <axsch:Name>Lunch</axsch:Name>    <axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;SUMMARY:Lunch&#xD;&#xA;DTSTART:20000103T110000&#xD;&#xA;DTEND:20000103T120000&#xD;&#xA;RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR&#xD;&#xA;DTSTAMP:20121019T123359&#xD;&#xA;UID:c5d62887d9a269&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>    </axsch:Schedule></axsch:SetSchedule>
```

```
{    "axsch:SetSchedule": {        "Schedule": [            {                "Name": "October 2012",                "Description": "",                "ScheduleDefinition": "BEGIN:VCALENDAR\r\nPRODID:\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:October 2012\r\nDTSTART:20121001T120000\r\nDTEND:20121001T140000\r\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;UNTIL=20121031T225959\r\nDTSTAMP:20121019T131655\r\nUID:1a102424e6d45bb4\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",                "ExceptionScheduleDefinition": "",                "Attribute": []            }        ]    }}
```

```
<axsch:SetSchedule>  <axsch:Schedule token="">    <axsch:Description></axsch:Description>    <axsch:ExceptionScheduleDefinition></axsch:ExceptionScheduleDefinition>    <axsch:Name>October 2012</axsch:Name>    <axsch:ScheduleDefinition>BEGIN:VCALENDAR&#xD;&#xA;PRODID:&#xD;&#xA;VERSION:2.0&#xD;&#xA;BEGIN:VEVENT&#xD;&#xA;SUMMARY:October 2012&#xD;&#xA;DTSTART:20121001T120000&#xD;&#xA;DTEND:20121001T140000&#xD;&#xA;RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;UNTIL=20121031T225959&#xD;&#xA;DTSTAMP:20121019T131655&#xD;&#xA;UID:1a102424e6d45bb4&#xD;&#xA;END:VEVENT&#xD;&#xA;END:VCALENDAR&#xD;&#xA;        </axsch:ScheduleDefinition>    </axsch:Schedule></axsch:SetSchedule>
```

- Remove any old configuration.
- Create a new configuration.

- Name is used to identify units in the system.
- Description is not used by AXIS Entry Manager.
- AccessPoint objects relate to the doors connected to the unit, for details see Doors.

- A four-digit PIN code.
- A card, identified by card number and/or card raw.

- The first name of the user is stored in an Attribute called FirstName.
- The last name of the user is stored in an Attribute called LastName.
- Name is a concatenation of the user’s names as "LastName, FirstName".
- Description is not used for anything.

- There is exactly one Credential per User. UserToken is set to the token of the User.
- Description is not used for anything.
- Enabled is set to true.
- Status is set to "Enabled".
- Each credential has at least one IdData, but not more than one of each type.
- The PIN code, if present, is stored as an IdData with Name set to "PIN".
- The card number, if present, is stored as an IdData with Name set to "CardNr".
- CredentialAccessProfile is used to list the groups the user belongs to. The user’s group membership are modeled using CredentialAccessProfile objects and groups using AccessProfile objects, see Groups. In CredentialAccessProfile objects, ValidFrom and ValidTo are never set and not used to limit access.
- AuthenticationProfile is not set.

- Name holds the name of the group.
- Schedule holds a list of Schedule references for when the group is active (i.e. provides access), to see how the schedules are combined seeCombining schedules.
- The optional fields ValidFrom and ValidTo are sometimes used to further limit the time the group is active.
- The doors the group has access to are stored in AccessPolicy. This field lists a number of AccessPoint objects the group has access to. For a given door the group has access to, all the AccessPoint objects for that door are always included in the list. This means that for a door which allows passage both in and out, the AccessPoint for direction in and the AccessPoint for direction out must either both be present in the list, or none of them. For each AccessPoint, there is also a list of Schedule references indicating when the group has access to the AccessPoint. There is always exactly one schedule, "standard_always", denoting that the group always has access to the AccessPoint.
- Enabled is always set to true.
- Description is not used.
- AuthenticationProfile is always an empty list.

- One Door object.
- One DoorConfiguration object.
- One AccessPoint object for each direction (in and out) which there are readers/REX devices that allow access in that direction. For example, a door with a reader allowing access going in and a REX device allowing access going out will require two AccessPoints associated with it.
- Each AccessPoint is associated with zero or more AuthenticationProfile:s indicating when it is possible to gain access to the door. For each type of IdData in credential (PIN, card, card and PIN, or REX) there is at most one AuthenticationProfile object per AccessPoint.
- For each door, if the door is scheduled to be locked or unlocked according to a set of schedules, there exists one DoorScheduleConfiguration object.
- I/O assignments for locks, monitors, etc., see I/O assignment.

- Its token should match the token of the Door object it corresponds to.
- The following items are set in the Configuration field:
- DebounceTime is set to "0". AXIS Entry Manager will work with other values, but will always set this value.


DoorMonitor.ValueWhenOpen is set to "Input Open". AXIS Entry Manager will work with other values, but will always set this value.


DoorMonitor.ValueWhenClosed is set to "Input Ground". AXIS Entry Manager will work with other values, but will always set this value.


Other Configuration items are set according to what locks and door monitors are associated with the door, seeLocks and lock monitors for details.
- DebounceTime is set to "0". AXIS Entry Manager will work with other values, but will always set this value.
- DoorMonitor.ValueWhenOpen is set to "Input Open". AXIS Entry Manager will work with other values, but will always set this value.
- DoorMonitor.ValueWhenClosed is set to "Input Ground". AXIS Entry Manager will work with other values, but will always set this value.
- Other Configuration items are set according to what locks and door monitors are associated with the door, seeLocks and lock monitors for details.
- DeviceUUID is set by the device and left untouched by AXIS Entry Manager.

- DebounceTime is set to "0". AXIS Entry Manager will work with other values, but will always set this value.
- DoorMonitor.ValueWhenOpen is set to "Input Open". AXIS Entry Manager will work with other values, but will always set this value.
- DoorMonitor.ValueWhenClosed is set to "Input Ground". AXIS Entry Manager will work with other values, but will always set this value.
- Other Configuration items are set according to what locks and door monitors are associated with the door, seeLocks and lock monitors for details.

- Its token should match the token of the DoorConfiguration object it corresponds to.
- Name is set to the name of the door.
- Description is not used for anything.
- AccessTime is set to "PT7S". AXIS Entry Manager will work with other values, but will always set this value.
- OpenTooLongTime is set to "PT30S". AXIS Entry Manager will work with other values, but will always set this value.
- PreAlarmTime is set to "PT10S". AXIS Entry Manager will work with other values, but will always set this value.
- ExtendedAccessTime is set to "PT30S". AXIS Entry Manager will work with other values, but will always set this value.
- ExtendedOpenTooLongTime is set to "PT60S". AXIS Entry Manager will work with other values, but will always set this value.
- HeartbeatInterval is set to "PT600S". AXIS Entry Manager will work with other values, but will always set this value.
- PriorityConfiguration is not set. See Priority configurations for a discussion on PriorityConfiguration objects.
- DefaultPriority is set to "" which corresponds to the default priority. See Priority configurations for a discussion on priority levels.

- When creating an AccessPoint, the AccessController object representing the host device of the door must be updated with a reference to the AccessPoint.
- Type is set to "tdc:Door". Doors are the only type of access points handled by AXIS Entry Manager.
- Entity is set to the token of the Door object.
- Name is set to the name of the door.
- Description is not used by AXIS Entry Manager.
- Enabled is set to true.
- Action is set to "AccessDoor".
- ActionArgument is not set.
- As mentioned, for each door, up to two AccessPoint objects are created. One for each direction (in/out) with a reader or a REX device. The direction is indicated on each AccessPoint by setting an item Direction in AttributeList to either "in" or "out".
- IdPointDevice is used to list the readers/REX devices used to access the door in the given direction.
- DoorDeviceUUID is the UUID of the door controller the door is connected to. This matches the value the device sets DeviceUUID in DoorConfiguration to.
- AreaFrom and AreaTo are not used by AXIS Entry Manager.

- No more than one AuthenticationProfile is ever created for each type of IdData (PIN, card and PIN, card and REX) per AccessPoint.
- Name and Description are not used by AXIS Entry Manager.
- Schedule lists the schedules for when the rules of the AuthenticationProfile:s applies, see Combining schedules for details on how the schedules are combined.
- IdFactor:s contains one or more items depending on what type of credentials are needed to access the door:
- If access should be granted using a PIN code without a card, one IdFactor is created with IdDataName set to "PIN", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".


If access should be granted using a card without a PIN code, one IdFactor is created with IdDataName set to "CardNr", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".


If access should be granted using a card in combination with a PIN, two IDFactor items are created. One with IdDataName set to "PIN" and one with IdDataName set to "CardNr". For both IdFactor items, IdMatchOperatorName is set to "IdDataEqual" and OperatorValue is set to "".


If access should be granted using a REX device, one IdFactor is created with IdDataName set to "REX", IdMatchOperatorName set to "OperatorValueEqual", and OperatorValue set to "Active".
- If access should be granted using a PIN code without a card, one IdFactor is created with IdDataName set to "PIN", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".
- If access should be granted using a card without a PIN code, one IdFactor is created with IdDataName set to "CardNr", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".
- If access should be granted using a card in combination with a PIN, two IDFactor items are created. One with IdDataName set to "PIN" and one with IdDataName set to "CardNr". For both IdFactor items, IdMatchOperatorName is set to "IdDataEqual" and OperatorValue is set to "".
- If access should be granted using a REX device, one IdFactor is created with IdDataName set to "REX", IdMatchOperatorName set to "OperatorValueEqual", and OperatorValue set to "Active".

- If access should be granted using a PIN code without a card, one IdFactor is created with IdDataName set to "PIN", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".
- If access should be granted using a card without a PIN code, one IdFactor is created with IdDataName set to "CardNr", IdMatchOperatorName set to "IdDataEqual", and OperatorValue set to "".
- If access should be granted using a card in combination with a PIN, two IDFactor items are created. One with IdDataName set to "PIN" and one with IdDataName set to "CardNr". For both IdFactor items, IdMatchOperatorName is set to "IdDataEqual" and OperatorValue is set to "".
- If access should be granted using a REX device, one IdFactor is created with IdDataName set to "REX", IdMatchOperatorName set to "OperatorValueEqual", and OperatorValue set to "Active".

- AXIS Entry Manager uses DoorScheduleConfiguration:s for one purpose: to configure that the door is unlocked, locked, or double locked (locked with two locks) at certain times.
- For each door, there exists zero or one DoorScheduleConfiguration. DoorScheduleConfiguration objects are never shared between doors, the schedule for each door is configured individually.
- The DoorScheduleConfiguration uses the same token as the Door and the DoorConfiguration. This is to keep track of which DoorScheduleConfiguration objects to remove if the unit is reconfigured. When running the HW Config in AXIS Entry Manager, it will remove any old hardware configuration from the unit, including door schedule configurations. If a DoorScheduleConfiguration has the same token as a Door which is removed, the DoorScheduleConfiguration will also be removed.
- Name and Description are not used by AXIS Entry Manager.
- DoorSchedule is set to a door schedule without specifying PriorityLevel, that is, the default priority level is used, see Priority configurations for a discussion on priority levels. The door schedule contains at least oneScheduledState:
- ScheduledState objects have EnterAction set to "Unlock", "Lock", or "DoubleLock".


If multiple ScheduledState objects are present, they are sorted according to their enter action, first "Unlock", then "Lock", then "DoubleLock".


There is always at least one ScheduledState with the maximum lock level available for the door. If the door has two locks this will be "DoubleLock", if the door has one door it will be "Lock". As per the sort order above, this will always be the last ScheduledState in the list. This ScheduledState forms a baseline for the scheduling of the door and has always a single ScheduleToken associated with it, "standard_always".
- ScheduledState objects have EnterAction set to "Unlock", "Lock", or "DoubleLock".
- If multiple ScheduledState objects are present, they are sorted according to their enter action, first "Unlock", then "Lock", then "DoubleLock".
- There is always at least one ScheduledState with the maximum lock level available for the door. If the door has two locks this will be "DoubleLock", if the door has one door it will be "Lock". As per the sort order above, this will always be the last ScheduledState in the list. This ScheduledState forms a baseline for the scheduling of the door and has always a single ScheduleToken associated with it, "standard_always".

- ScheduledState objects have EnterAction set to "Unlock", "Lock", or "DoubleLock".
- If multiple ScheduledState objects are present, they are sorted according to their enter action, first "Unlock", then "Lock", then "DoubleLock".
- There is always at least one ScheduledState with the maximum lock level available for the door. If the door has two locks this will be "DoubleLock", if the door has one door it will be "Lock". As per the sort order above, this will always be the last ScheduledState in the list. This ScheduledState forms a baseline for the scheduling of the door and has always a single ScheduleToken associated with it, "standard_always".

- 12V locks (also known as "standard locks").
- Relay locks.
- AperioTM locks. See, Aperio doors

- Lock.Type.
- DoubleLock.Type.

- Lock.Type is set to "Standard".
- Lock.LockWhenDoorOpens is set to "false".
- Lock.ValueWhenLocked is set to either "12V" or "Gnd".
- Lock.ValueWhenUnlocked is set to either "12V" or "Gnd" (the opposite of Lock.ValueWhenLocked).
- Lock.BoltOutTime is set to "0" (it is not applicable for 12V locks).
- Lock.BoltInTime is set to "0" (it is not applicable for 12V locks).

- The same as for the first lock, except that each item is prefixed with "DoubleLock" instead of "Lock", with one exception: Lock.LockWhenDoorOpens is not set.

- Lock.Type is set to "Relay".
- Lock.LockWhenDoorOpens is set to "false".
- Lock.RelayStateWhenLocked is set to either "Open" or "Closed".
- Lock.BoltOutTime is set to "0" (it is not applicable for relay locks).
- Lock.BoltInTime is set to "0" (it is not applicable for relay locks).

- The same as for the first lock, except that each item is prefixed with "DoubleLock" instead of "Lock", with one exception: Lock.LockWhenDoorOpens is not set.

- DoubleLock.Type must be set to "None".

- A card reader, which is a device that can read the number of a card and allows the user to enter a PIN code.
- A REX device, which is a device that provides access to the door when pressed.

- Wiegand readers
- OSDP readers using RS485 half duplex
- AperioTM readers, see Aperio doors.

- REX devices that are active low
- REX devices that are active high

- It must use the same token as the corresponding IdPointConfiguration.
- Name contains the name of the reader/REX.
- Action is set to "Access". AXIS Entry Manager only supports ID points that lets a user access a door.
- Area is set to "". This setting is not used by AXIS Entry Manager.
- MinPINSize is set to 4.
- MaxPINSize is set to 4.
- EndOfPIN is set to "#". AXIS Entry Manager will work with other values, but will always set this value.
- Timeout is set to "PT10S". AXIS Entry Manager will work with other values, but will always set this value.

- It must use the same token as the corresponding IdPoint.
- For readers, not REX devices, IdDataConfiguration is set to all IdDataConfiguration that are configured on the unit, as obtained using GetIdDataConfigurationList. AXIS Entry Manager supports any set of IdDataConfiguration objects, but it will not create anything.
- Configuration is set depending on the type of reader/REX, see below.

- IdPoint.Reader.Type
- IdPoint.REX.Type

- AXIS Entry Manager does not modify the list of IdDataConfiguration objects on the unit.

- IdPoint.Reader.Type is set to "Wiegand".
- IdPoint.LED.Type is set to "SingleLED".
- IdPoint.LED.ActiveLevel is set to "ActiveLow".
- IdPoint.Beeper.Type is set to "ActiveLow".
- IdPoint.Tampering.Type is set to "ActiveLow".
- IdPoint.REX.Type is set to "None".
- IdPoint.Keypress.Type is set to "Auto".

- IdPoint.LED.Type is set to "SingleLED".
- IdPoint.LED.ActiveLevel is set to "ActiveLow".
- IdPoint.Beeper.Type is set to "ActiveLow".
- IdPoint.Tampering.Type is set to "ActiveLow".
- IdPoint.REX.Type is set to "None".
- IdPoint.Keypress.Type is set to "Auto".
- IdPoint.Reader.Type is set to "RS-485HD".
- IdPoint.RS-485FD.Protocol is set to "OSDP".

- IdPoint.Reader.Type is set to "None".
- IdPoint.Keypress.Type is set to "Auto".

- IdPoint.REX.Type is set to "ActiveLow".

- IdPoint.REX.Type is set to "ActiveHigh".

- As a final step of the HW Config, I/O assignments are created for all the hardware that the user has indicated will be connected to the unit.
- AXIS Entry Manager uses the I/O assignments to visualize to the user how hardware should be connected to the unit.

- IoName, IoMode, and IoUser Type and Usage are set as listed in the table.
- IoUser field MultiIo is set to false.

- One-off intervals defines a single interval in time, for instance, 12:00-14:00 on April 1 2012. The interval can be of any length.
- Yearly intervals define an interval that occurs yearly, for instance, every year 12:00-14:00 on April 1. The interval can be no longer than 24 hours.
- Weekly intervals define intervals that occurs every week on certain week days, for example, 12:00-14:00 every Tuesday and Thursday. The intervals can be no longer than 24 hours.

- All normal schedules are combined, creating the union of their time intervals.
- All exception schedules are subtracted.

- Name contains the name of the schedule.
- Description is not used.
- Attribute is not used.

- AXIS Entry Manager follows the iCalendar specification as described in RFC 5545. This includes setting of mandatory fields such as VERSION, PRODID, DTSTAMP, UID and so forth.
- Time granularity is minutes. No time specifications use seconds or fractions of a second (exception: UNTIL uses seconds, see below). In all instances where it is possible to choose between date types, AXIS Entry Manager uses Date-Time.
- Intervals are defined using VEVENTs, with RRULEs where applicable.
- Each VEVENT uses the SUMMARY field to name the VEVENT.
- One-off intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the interval.
- Yearly recurring intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the first occurrence of the interval.
Note that the first occurrence can start on one day and end on another (for instance, 23:00-11:00), but its length must not exceed 24 hours. RRULE is set to yearly, like this: "RRULE:FREQ=YEARLY".
- Weekly recurring intervals are represented using a VEVENT where DTSTART and DTEND holds the start and end of the first occurrence of the interval.
Note that the first occurrence can start on one day and end on another (for instance, 23:00-11:00), but its length must not exceed 24 hours. RRULE is set to weekly, like this: "RRULE is set to weekly, like this: "RRULE:FREQ=WEEKLY;BYDAY=<list of days>", for example "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR".
- For recurring intervals, the optional end date is specified by appending an UNTIL clause to the RRULE, specifying the last second of a day. Example: UNTIL=20121031T225959. This is the only instance where AXIS Entry Manager specifies Date-Times with second granularity.

- By manually unlocking it pressing a device in the user interface. This will use the UnlockDoor or AccessDoor requests found in the DoorControl service.
- By configuring the door to unlock at certain times, based on a schedule. For details, see Doors
- By configuring access so that the user can unlock the door by presenting a credential (card and/or PIN) to a reader or pressing a REX device.

- The door itself must be configured.
This includes creating a Door, a DoorConfiguration and I/O assignments for the hardware of the door. Door is explained in Doors, DoorConfiguration in Locks and lock monitors, and I/O assignments in section I/O assignment.
- The reader must be configured.
This includes creating an IdPoint, an IdPointConfiguration and I/O assignments for the hardware of the reader. IdPoint and IdPointConfiguration are explained in Id points – Readers and REX buttons.
- An AccessPoint for the direction "in".
This is explained in Doors. The AccessPoint must reference the door from step 1 and the reader from step 2.
- An AuthenticationProfile, which grants access using "card and PIN, must be added to the AccessPoint from step 3. The AuthenticationProfile is associated with a Schedule for when access is granted. The schedule could be the standard schedule standard_always, or a custom schedule could be created, see Schedules. AuthenticationProfile is described in Doors.
- A group must be created, for details see Groups. This includes creating an AccessProfile object.
- The Schedule field of the AccessProfile must contain at least one Schedule indicating when the group is active. This can be the Schedule standard_always or a custom Schedule.


The AccessProfile’s AccessPolicy field must reference the AccessPoint created in step 3. The schedule associated with the AccessPoint must be standard_always and nothing else, as described in Groups.
- The Schedule field of the AccessProfile must contain at least one Schedule indicating when the group is active. This can be the Schedule standard_always or a custom Schedule.
- The AccessProfile’s AccessPolicy field must reference the AccessPoint created in step 3. The schedule associated with the AccessPoint must be standard_always and nothing else, as described in Groups.
- A user must be created, for details see Users and credentials.
This includes creating one User and one Credential. The Credential must contain two IdData items, one for the user’s card number, one for the user’s PIN code. The CredentialAccessProfile of the Credential must reference the AccessProfile of the group created in step 5.

- The Schedule field of the AccessProfile must contain at least one Schedule indicating when the group is active. This can be the Schedule standard_always or a custom Schedule.
- The AccessProfile’s AccessPolicy field must reference the AccessPoint created in step 3. The schedule associated with the AccessPoint must be standard_always and nothing else, as described in Groups.

- The Schedule of the AuthenticationProfile created in step 4 must be active.
- The Schedule of the AccessProfile created in step 5 must be active.

- The AuthenticationProfilecreated in step 4 must grant access to PIN, not card and PIN.
- The user created in step 6 does not represent an actual person but is a collective user used by all people entering the PIN. The user is used mainly to store the PIN code. The Credential of the user should have only one IdData with the PIN code.

- A REX device is configured instead of a reader in step 2. This is done analogously, for details see Id points – Readers and REX buttons.
- REX devices are most often used to let a person pass out through a door, not in. Both are allowed, but the AccessPoint created in step 3 should be updated with the corresponding direction.
- The AuthenticationProfile created in step 4 must grant access to REX, not card and PIN.
- Since REX devices are anonymous, a user is not needed and step 6 can be ignored.

- When manually locking/unlocking/accessing a given door, it uses the default priority level.
- When scheduling a door state using DoorScheduleConfiguration, see Doors, it uses the default priority level.
- When accessing a door using a REX, PIN and/or card, the access action uses the default priority level.

| Hardware device | I/O name | I/O mode | I/O user type | I/O user usage |
| --- | --- | --- | --- | --- |
| 12V first lock on first door | H1 | inout:12V/gnd | doorcontrol | Lock_Standard |
| 12V second lock on first door | H2 | inout:12V/gnd | doorcontrol | DoubleLock_Standard |
| 12V first lock on second door | H2 | inout:12V/gnd | doorcontrol | Lock_Standard |
| Relay first lock | relay1 | open/closed | doorcontrol | Lock_Relay |
| Relay second lock | relay1 | open/closed | doorcontrol | DoubleLock_Relay |
| Door monitor on first door | IN1 | in:pu/gnd | doorcontrol | DoorOpenMonitor |
|  | IN1 | in:pu/gnd | doorcontrol | DoorClosedMonitor |
| Door monitor on second door | IN3 | in:pu/gnd | doorcontrol | DoorOpenMonitor |
|  | IN3 | in:pu/gnd | doorcontrol | DoorClosedMonitor |
| Wiegand reader as 1st reader | IO3 | inout:pu/gnd | idpoint | Tampering |
|  | IO5 | inout:pu/gnd | idpoint | LedSingle |
|  | IO6 | inout:pu/gnd | idpoint | Beeper |
|  | Wiegand1 | wiegand | idpoint | Wiegand |
| Wiegand reader as 2nd reader | IO7 | inout:pu/gnd | idpoint | Tampering |
|  | IO9 | inout:pu/gnd | idpoint | LedSingle |
|  | IO10 | inout:pu/gnd | idpoint | Beeper |
|  | Wiegand2 | wiegand | idpoint | Wiegand |
| OSDP reader as first reader (RS485 half duplex) | Ser0hd | rs485hd | idpoint | RS-485HD |
| OSDP reader as second reader (RS485 half duplex) | Ser2hd | rs485hd | idpoint | RS-485HD |
| Aperio hub (RS485 half duplex) | Ser3hd | rs485hd | doorcontrolidpoint | RS-485HD |
| REX device 1 | IN2 | inout:pu/gnd | idpoint | REX |
| REX device 2 | IN4 | inout:pu/gnd | idpoint | REX |

| Hardware device | I/O name | I/O mode | I/O user type | I/O user usage |
| --- | --- | --- | --- | --- |
| First lock of Door 1 | relay1 | open/closed | doorcontrol | Lock_Relay |
| Second lock of Door 1 | relay2 | open/closed | doorcontrol | DoubleLock_Relay |
| First lock on Door 2 | relay2 | open/closed | doorcontrol | Lock_Relay |
| Door monitor of Door 1 | IO5 | inout:pu/gnd | doorcontrol | DoorOpenMonitor |
|  | IO5 | inout:pu/gnd | doorcontrol | DoorClosedMonitor |
| Door monitor of Door 2 | IO11 | inout:pu/gnd | doorcontrol | DoorOpenMonitor |
|  | IO11 | inout:pu/gnd | doorcontrol | DoorClosedMonitor |
| REX of Door 1 | IO6 | inout:pu/gnd | idpoint | REX |
| REX of Door 2 | IO12 | inout:pu/gnd | idpoint | REX |
| Wiegand reader as Reader 1 | IO7 | inout:pu/gnd | idpoint | Tampering |
|  | O1 | out:pu/gnd | idpoint | LedSingle |
|  | IO8 | inout:pu/gnd | idpoint | Beeper |
|  | Wiegand1 | wiegand | idpoint | Wiegand |
| Wiegand reader as Reader 2 | IO9 | inout:pu/gnd | idpoint | Tampering |
|  | O3 | out:pu/gnd | idpoint | LedSingle |
|  | IO10 | inout:pu/gnd | idpoint | Beeper |
|  | Wiegand2 | wiegand | idpoint | Wiegand |
| OSDP reader as Reader 1 | Ser0hd | rs485hd | idpoint | RS-485HD |
| OSDP reader as Reader 2 | Ser1hd | rs485hd | idpoint | RS-485HD |

