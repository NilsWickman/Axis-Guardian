# Door control service

**Source:** https://developer.axis.com/vapix/physical-access-control/door-control-service/
**Last Updated:** Aug 28, 2025

---

# Door control service

## Door control service guide​

### Set a door representation​

#### Door data structure​

#### Door configuration​

### Unlock the door​

#### Door states​

#### Events when door state is changed​

### Manage doors with priority levels​

#### Setting a priority configuration​

#### Using door priorities​

### Door open within specific time period​

#### Setting schedule configuration​

#### Door open during office hours​

### Door priorities and door schedules​

## Door control service API​

### AxisConfig service​

#### Configuration data structure​

#### ConfigurationInfo data structure​

### Service capabilities​

#### ServiceCapabilities data structure​

#### GetServiceCapabilities command​

### Door information​

#### DoorInfo data structure​

#### DoorCapabilities data structure​

#### GetDoorInfoList command​

#### GetDoorInfo command​

### Door status​

#### DoorState data structure​

#### DoorPhysicalState data structure​

#### LockPhysicalState data structure​

#### DoorAlarmState data structure​

#### DoorWarningState data structure​

#### DoorTamper data structure​

#### DoorTamperState data structure​

#### DoorFault data structure​

#### DoorFaultState data structure​

#### DoorMode data structure​

#### GetDoorState command​

### Door control commands​

#### AccessDoor command​

#### LockDoor command​

#### UnlockDoor command​

#### BlockDoor command​

#### LockDownDoor command​

#### LockDownReleaseDoor command​

#### LockOpenDoor command​

#### LockOpenReleaseDoor command​

#### DoubleLockDoor command​

#### ReleaseDoor command​

### Door configuration​

#### Door data structure​

#### SetDoor command​

#### GetDoorList command​

#### GetDoor command​

#### RemoveDoor command​

### Door priority​

#### DoorActionType data structure​

#### PriorityConfiguration data structure​

#### GetDoorPriorityState command​

#### SetPriorityConfiguration command​

#### GetPriorityConfigurationList command​

#### GetPriorityConfiguration command​

#### RemovePriorityConfiguration command​

### DoorConfiguration​

#### DoorConfiguration data structure​

#### GetDoorConfigurationList command​

#### GetDoorConfiguration command​

#### SetDoorConfiguration command​

#### RemoveDoorConfiguration command​

#### GetDoorConfigurationInfo command​

#### ScheduledState data structure​

#### DoorSchedule data structure​

#### DoorScheduleConfiguration data structure​

#### SetDoorScheduleConfiguration command​

#### GetDoorScheduleConfigurationList command​

#### GetDoorScheduleConfiguration command​

#### RemoveDoorScheduleConfiguration command​

#### AccessDoorWithoutUnlock command​

The door control service is used to manage and control the status of doors and devices connected to doors.

The diagram shows the data types that will be covered in following subsections.



Setting a representation of a door is the most basic use case for the door control service. This is done in two steps; setting the door basic configuration, and setting the door hardware configuration. The order of these steps is irrelevant, the set requests will set up a working door representation in any request order.

The Door data structure is the main representation of a physical door connected to the door controller. It is used to control the state of the door and its locks, i.e. whether the door is closed or open and locked or unlocked.

The Door contains all non-hardware related information about the door, such as timeouts for different situations. The following example shows a Door, which is set by calling axtdc:SetDoor in the Door Control Service:

The timeout values are described by elements of type xs:duration. The example above illustrates how this type is used to specify time in periods of seconds.

The timeout values specifies time limits for different activities. If a timeout is triggered it will result in state changes and dispatching of events. The possible timeouts are:

AccessTime

The time, specified in seconds in the example above, that the door shall remain unlocked after access has been granted.

OpenTooLongTime

The time, specified in seconds in the example above, that the door is allowed to stay open. DoorAlarm event is sent if the door is still open when the OpenTooLongTime has been reached.

PreAlarmTime

This specifies how long before the OpenTooLongTime expires that a DoorWarning event should be sent.

The diagram shows the different timeouts when a door is accessed and kept open.



The priority parameters will be discussed in section Manage doors with priority levels.

The door hardware configuration is used to set up the actual door and lock hardware. Doors may have one or two locks. In the following, two locks (consisting of a primary lock and a secondary lock) will be referred to as a double-lock.

The lock is configured by the type of lock and how the lock is controlled. If using double-locks, the secondary lock has similar configuration to the primary lock. The door monitor is configured by how to determine if the door is open or closed.

The following example shows a minor DoorConfiguration. Note that the token, marked in bold, is the link between Door and DoorConfiguration entities, thus it is the same as for the Door in the example in section Door data structure:

Setting a DoorConfiguration is done by calling axtdc:SetDoorConfiguration. The DeviceUUID specifies the door controller on which the door exists. When setting a DoorConfiguration directly on the intended door controller, the DeviceUUID may be omitted and the UUID of the local device will be set automatically.

The previous example illustrates only a few Configuration options. It is not mandatory to set all configuration options, and the unspecified options will be set to their default values. To view all hardware configuration options for a door, the following API requests can be used:

The response from any of the above get requests will include default values as well, including those which were not set during setup. The table summarizes the possible configuration options.

Available parameters in the Configuration data structure.

There are several states for the door and its locks, and the Door Control API provides requests to change the state of the door locks. The function tdc:GetDoorState retrieves the current state of a door, including its locks and monitors. Events are dispatched upon state changes. Unlocking the door comes in three different flavors, the API requests tdc:UnlockDoor, tdc:AccessDoor and axtdc:AccessDoorWithoutUnlock:

axtdc:AccessDoorWithoutUnlock is used to temporarily grant access to a door without unlocking it. This is used for doors that can be unlocked manually without the need for the controller to unlock the door. The reason for this state is to ensure that no DoorForcedOpenAlarm is sent if the door is opened manually during the time a user is granted access.

tdc:UnlockDoor will unlock the door until Door Control Service is told otherwise, for example when locked again by calling tdc:LockDoor.

tdc:AccessDoor means temporarily unlocking the door and it will be automatically locked again when closed or when AccessTime expires if not opened, as specified in Door data structure. AccessDoor is typically used when someone has been granted access to a door, and the door is unlocked for a specified time to let the person pass.

axtdc:AccessDoorWithoutUnlock is used to temporarily grant access to a door without unlocking it. This is used for doors that can be unlocked manually without the need for the controller to unlock the door. The reason for this state is to ensure that no DoorForcedOpenAlarm is sent if the door is opened manually during the time a user is granted access.

The following examples illustrate simple calls to tdc:AccessDoor, tdc:UnlockDoor, and axtdc:AccessDoorWithoutUnlock using the door from the examples in Set a door representation:

Request

Request

Request

Request

Request

Request

In the first example, if the door is locked, then it will become accessible. The API function provides optional values for overriding settings in the door configuration, such as AccessTime and OpenTooLongTime. The second example will unlock the door instead, see Door states. AccessDoorWithoutUnlock can be used with the same optional values as AccessDoor.

No return values are given by the API functions, but the API function may raise errors, e.g. if specified token is not found.

The states and possible transitions are summarized in this section’s diagram and table.



Door states and corresponding API function

The API function tdc:GetDoorInfoList lists supported door capabilities for each door and makes it possible to find out which door states to expect.

The door control service dispatches an event each time a door changes state. One stateful event is used for all state changes, and will provide information about which door has entered what state.

The following example illustrates the event for an accessed door, where the DoorMode state is marked in bold:

DoorMode gives the new state of the door. At start-up of the door controller the initial state will be dispatched. Analogously, there will also be stateful events dispatched for the door and lock monitors, giving the entered monitor state. For example, the door monitor event gives the new door monitor state, which might beOpen, Closed, or, possibly Fault. For example:

Door actions can be prioritized using a PriorityConfiguration. By setting different priority levels for different actions, it is possible to override door actions, for example to unlock doors in emergency situations.

As an example, consider a door that has Locked as its default state but that should be unlocked in emergency situations. This can be achieved by using two priority levels. The default action, locked, is set to have a low priority while a higher priority is used for actions sent in emergency situations. If, in an emergency situation, an unlock action is sent and the unlock action has a higher priority than lock, then unlock overrides lock and the door is unlocked.

When the emergency situation has been solved, the unlock action can be released using the API function axtdc:ReleaseDoor. Releasing an action with a given priority level removes the action from the PriorityConfiguration array and the next action, in order of priority, will automatically take control of the door. If all actions are released, the door will automatically fall back to the Locked state.

The default priority configuration in the door control service is called Standard and has only one priority level. Use Standard if priority levels are not needed.

The priority configuration PriorityConfiguration array specifies priorities for different door actions. To set a priority configuration, use the API function axtdc:SetPriorityConfiguration. The following example shows a setup with five levels, from Highest to Lowest:

The DoorPriorityAction array is a list of priorities for the door. The items in the array must be specified in order of priority so that the first item in the array has the highest priority and the last item has the lowest priority. The PriorityLevel is only a name and does not affect the priority order. In addition to the PriorityLevel, each item has an initial DoorAction which is the state that will be applied until a door action request has been sent. State Release means that the priority does not have a set action.

The DefaultPriority item specifies the priority level to use if no priority is specified in the door action request. The following example uses the Door from section Set a door representation, updated with the necessary token (marked in bold) to apply the PriorityConfiguration above:

The current states of a door, including priority levels, can be retrieved using the API function axtdc:GetDoorPriorityState. The following example shows the states for a door with the priority configuration from section Setting a priority configuration:

Request

Request

Response

Response

In this case, the door is locked. State Release means that the priority does not have a set action. Sending a door action request with a specified priority level will replace the door action for the priority with that level. If the priority level is omitted, the default priority DefaultPriority will be used so that the submitted action replaces the action for the default priority level.

The following example shows a tdc:UnlockDoor request with priority level medium. The example also shows the response to axtdc:GetDoorPriorityState with relevant changes marked in bold.

Request

Request

Response

Response

The door is now unlocked.

To remove an action from the DoorPriorityAction array, use the API function axtdc:ReleaseDoor with desired priority level to release the action for the priority with that level. In the following example, the Unlock action is released.

Request

Request

Response

Response

It is possible to set up doors that should be in a specific state at a specific time. For example, the front door of an office building should automatically be unlocked during office hours. This is achieved by using door schedule configurations.

As described in the Schedule Service section Schedule service, the format is iCalendar compliant which allows for schedules occurring once, at recurring times, and with optional start and/or stop dates. It is possible to specify both when schedule shall be active and when there should be an exception.

The schedule for a door is set using the door schedule configuration, DoorScheduleConfiguration. It is possible, and sometimes necessary, to have more than one schedule referenced from each configuration.

A door schedule configuration entry will have an associated enter action, which is performed when the schedule becomes active. Note that once a schedule becomes inactive, there is no corresponding exit or leave behavior: this must be handled by using priorities or having several overlapping schedules. For example, if the door should open at certain time one schedule could have Unlock as the enter action, while another, overlapping, schedule has Lock as its enter action.

A door schedule configuration is set by calling axtdc:SetDoorScheduleConfiguration. The following is a simple example of a configuration using the standard_always schedule:

The ScheduledState array contains the schedule, referenced by the ScheduleToken, and the enter action. The ScheduleState list will be verified in order - the first active schedule’s EnterAction will be used.

The DoorSchedule list contains the ScheduledState list and the assigned priority level. Each entry in the DoorSchedule list will be validated, and if the schedule is active, the DoorPriorityAction will be updated with the EnterAction at the specified priority level. PriorityLevel can be left empty if unused, but, if so, the DoorSchedule array is required to contain only one element.

A DoorScheduleConfiguration which uses a schedule that is already active, like the standard_always, means that there will not be any enter action. However, when setting the DoorScheduleConfiguration, the enter action is generated, and similarly when restarting the door controller.

To start using this schedule for a door, the DoorConfiguration needs to be updated with the token of the DoorScheduleConfiguration (Default DoorConfiguration assumed as parts are omitted here):

Returning to the use case where a door should be open during office hours, there are a few ways to configure this. The following examples illustrate different ways of setting it up. The examples assume that there exists a schedule called office_hours in the Schedule Service, in addition to the defaultstandard_always.

Using several schedules listed in priority order:

This DoorScheduleConfiguration unlocks the door whenever office_hours starts, as this ScheduledState overrides thestandard_always. When office_hours becomes inactive, the next ScheduledState is evaluated and active again and the door will be locked by the EnterAction.

Using priority levels

The door has the following priority levels and initial states:

Using the DoorScheduleConfiguration works as follows, this time also taking into account a schedule where public holidays (called public_holidays) should have locked doors:

When the office_hours or public_holidays are inactive, the priority levels will be released. If office_hours becomes active the door will be unlocked, because that will have highest priority. This will hold until the public_holiday schedule becomes active, since it overrides all other scheduled states, and the door is/remains locked. See the following priority levels where all schedules are active:

The example in this section shows how priority levels and schedules can be used together. Consider a door that should be unlocked during office hours and locked outside office hours. In an emergency situation, it should be possible to temporarily override the default behavior and unlock or lock the door.

This can be achieved by using two priority levels and two schedules. The configuration contains:

In an emergency situation during nighttime the door can be temporarily unlocked by sending tdc:UnlockDoor with priority high. Once the emergency is resolved, the high priority state can be released using axtdc:ReleaseDoor. The normal priority will then take precedence and the door will be locked/unlocked according to the DoorScheduleConfiguration.

The following steps illustrate how to set up this configuration. Here, the tokens are manually created tokens with user-friendly names. If not specified in the request, the token is created automatically and returned in the response.

Step 1: Use axtdc:SetPriorityConfiguration to create the PriorityConfiguration. The priority levels are listed in priority order, so the first level, here called High, has highest priority. The second level Normal has lower priority. The DoorAction is the initial door action for the priority level. Release means that the level does not have any assigned action, that is, that the level is inactive.

Request

Request

Step 2: Use axtdc:SetDoor to create the Door. The myPriorityConfiguration token links the PriorityConfiguration to the Door.

Request

Request

Step 3: Use axtdc:SetDoorScheduleConfiguration to create the DoorScheduleConfiguration.

The schedules standard_office_hours and standard_always are listed in priority order and each has an associated door action. When the first schedule, standard_office_hours, is active, the door will be unlocked. When standard_office_hours is inactive, the second schedule standard_always takes precedence and the door will be locked. The priority level Normal links the door schedule to the Normal priority in the PriorityConfiguration.

Request

Request

Step 4: Use axtdc:SetDoorConfiguration to create a DoorConfiguration that connects the Door and the DoorScheduleConfiguration.

Request

Request

The configuration is now complete. To verify the configuration, set the time to inside office hours and use axtdc:GetDoorPriorityState to get the door’s current state.

Request

Response

Response

The response shows that priority level High is released. Priority level Normal is therefore active and the door is unlocked because the time is inside office hours. For priority level Normal, Reason is set to Schedule. This is because the DoorScheduleConfiguration was configured with priority level Normal.

To continue verifying the configuration, set the time to outside office hours and send a new axtdc:GetDoorPriorityState. The DoorAction for priority level Normal has changed to Lock and the door is now locked.

Response

Response

To unlock the door in an emergency situation, a tdc:UnlockDoor with priority level High overrides the DoorScheduleConfiguration setting.

Request

The response from axtdc:GetDoorPriorityState shows that priority level High now has action Unlock. As Unlock has higher priority than Lock, the door is unlocked.

Response

To release priority level High, that is, to return to the default behavior specified by DoorScheduleConfiguration, send a axtdc:ReleaseDoor with priority level High.

Request

The response from axtdc:GetDoorPriorityState shows that the door now is locked.

Response

The door control service provides mechanisms for controlling physical door instances and monitoring their status.

The door in this specification can refer to such physical objects as an automatic barrier or a door equipped with electric lock. Turnstiles which can restrict access in either direction can be represented with a pair of doors.

The door is a subclass of a more generic term entity defined in the ONVIF access control specification.

Please refer to the ONVIF access control specification for generic operation guidelines and design principles behind ONVIF PACS services family.

The service includes the following operations:

The service also defines a number of events for real-time monitoring:

Axis configuration API.

This provides the datatypes used by the Axis IdPoint and Axis DoorController services for hardware configuration which may vary between device software revisions and hardware models.

A configuration setting.

The following fields are available:

Name

Name of configuration setting.

Value

Value of configuration setting.

A configuration setting and description.

The following fields are available:

Name

Name of configuration setting.

Value

Value of configuration setting.

Enums

Suggested/allowed values.

To provide more information, the device may include the following optional fields:

Type

Type of configuration setting, e.g. xs:string, xs:boolean, xs:int.

DependOnName

Name of the Config this config depends on.

DependOnValue

Value of the Config this config depends on.

Description

Description of configuration setting.

tdc = http://www.onvif.org/ver10/doorcontrol/wsdl

An ONVIF compliant device shall provide service capabilities in two ways:

With the GetServices method of device service when IncludeCapability is true. Refer to the ONVIF core specification for more details.

With the GetServiceCapabilities method.

ServiceCapabilities structure reflects optional functionality of a service. The information is static and does not change during device operation. The following capabilities are available:

MaxLimit

The maximum number of entries returned by a single GetList or Get request. The device shall never return more than this number of entities in a single response.

GetDoorSupported

True if GetDoor and GetDoorList operations are supported.

SetDoorSupported

True if SetDoor and SetDoorList operations are supported.

PriorityConfigurationSupported

True if PriorityConfigurations can be modified.

This operation returns the capabilities of the service.

An ONVIF compliant device which provides the door control service shall implement this method.

GetServiceCapabilities command

tdc = http://www.onvif.org/ver10/doorcontrol/wsdl

The DoorInfo type represents the Door as a physical object. The structure contains information and capabilities of a specific door instance. An ONVIF compliant device shall provide the following fields for each Door instance:

token

A service-unique identifier of the Door.

Name

A user readable name. It shall be up to 64 characters.

Capabilities

The capabilities of the Door.

To provide more information, the device may include the following optional field:

Description

A user readable description. It shall be up to 1024 characters.

DoorCapabilities reflect optional functionality of a particular physical entity. Different door instances may have different set of capabilities. This information may change during device operation, e.g. if hardware settings are changed. The following capabilities are available:

Access

Indicates whether or not this Door instance supports AccessDoor command to perform momentary access.

AccessTimingOverride

Indicates that this Door instance supports overriding configured timing in the AccessDoor command.

Lock

Indicates that this Door instance supports LockDoor command to lock the door.

Unlock

Indicates that this Door instance supports UnlockDoor command to unlock the door.

Block

Indicates that this Door instance supports BlockDoor command to block the door.

DoubleLock

Indicates that this Door instance supports DoubleLockDoor command to lock multiple locks on the door.

LockDown

Indicates that this Door instance supports LockDown (and LockDownRelease) commands to lock the door and put it in LockedDown mode.

LockOpen

Indicates that this Door instance supports LockOpen (and LockOpenRelease) commands to unlock the door and put it in LockedOpen mode.

DoorMonitor

Indicates that this Door instance has a DoorMonitor and supports the DoorPhysicalState event.

LockMonitor

Indicates that this Door instance has a LockMonitor and supports the LockPhysicalState event.

DoubleLockMonitor

Indicates that this Door instance has a DoubleLockMonitor and supports the DoubleLockPhysicalState event.

Alarm

Indicates that this Door instance supports door alarm and the DoorAlarm event.

Tamper

Indicates that this Door instance has a tamper detector and supports the DoorTamper event.

Fault

Indicates that this Door instance supports door fault and the DoorFault event.

Warning

Indicates that this Door instance supports door warning and the DoorWarning event.

Configurable

Indicates if the Door settings can be modified.

PriorityLevels

Number of priority levels supported for the door, 0 or 1 means priorities not supported.

This operation requests a list of all DoorInfo items provided by the device. An ONVIF compliant device that provides Door Control service shall implement this method.

A call to this method shall return a StartReference when not all data is returned and more data is available. The reference shall be valid for retrieving the next set of data. The number of items returned shall not be greater than Limit parameter.

GetDoorInfoList command

This operation requests a list of DoorInfo items matching the given tokens. An ONVIF-compliant device that provides a door control service shall implement this method.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens. If the number of requested items is greater than MaxLimit, a TooManyItems fault shall be returned.

GetDoorInfo command

tdc = http://www.onvif.org/ver10/doorcontrol/wsdl

The state of the door may be affected by a number of operations that can be performed on it depending on its capabilities: LockDoor, UnlockDoor, AccessDoor, BlockDoor, DoubleLockDoor, LockDownDoor, LockDownReleaseDoor, LockOpenDoorand LockOpenReleaseDoor.

The DoorState structure contains current aggregate runtime status of Door.

The following fields are available:

DoorMode

The logical operating mode of the door; it is of type DoorMode. An ONVIF compatible device shall report current operating mode in this field.

To provide more information, the device may include the following optional fields:

DoorPhysicalState

Physical state of Door; it is of type DoorPhysicalState. A device that signals support for DoorMonitor capability for a particular door instance shall provide this field.

LockPhysicalState

Physical state of the Lock; it is of type LockPhysicalState. A device that signals support for LockMonitor capability for a particular door instance shall provide this field.

DoubleLockPhysicalState

Physical state of the DoubleLock; it is of type LockPhysicalState. A device that signals support for DoubleLockMonitor capability for a particular door instance shall provide this field.

Alarm

Alarm state of the door; it is of type DoorAlarmState. A device that signals support for Alarm capability for a particular door instance shall provide this field.

Tamper

Tampering state of the door; it is of type DoorTamper. A device that signals support for Tamper capability for a particular door instance shall provide this field.

Fault

Fault information for door; it is of type DoorFault. A device that signals support for Fault capability for a particular door instance shall provide this field.

The following data types define states of DoorState elements.

The physical state of a Door.

The following values are available:

Unknown

Value is currently unknown (possibly due to initialization or monitors not giving a conclusive result).

Open

Door is open.

Closed

Door is closed.

Fault

Door monitor fault is detected.

The physical state of a Lock (including double lock).

The following values are available:

Unknown

Value is currently not known.

Locked

Lock is activated.

Unlocked

Lock is not activated.

Fault

Lock fault is detected.

Describes the state of a Door with regard to alarms.

The following values are available:

Normal

No alarm.

DoorForcedOpen

Door is forced open.

DoorOpenTooLong

Door is held open too long.

Describes the state of a Door with regard to warnings.

The following values are available:

Normal

No warning.

DoorOpenTooLongWarn

Door is soon held open too long.

Tampering information for a Door.

The following fields are available:

State

State of the tamper detector; it is of type DoorTamperState.

To provide more information, the device may include the following optional field:

Reason

Optional field; Details describing tampering state change (e.g., reason, place and time). NOTE: All fields (including this one) which are designed to give end-user prompts can be localized to the customers's native language.

Describes the state of a tamper detector.

The following values are available:

Unknown

Value is currently not known.

NotInTamper

No tampering is detected.

TamperDetected

Tampering is detected.

Fault information for a Door. This can be extended with optional attributes in the future.

The following fields are available:

State

Overall fault state for the door; it is of type DoorFaultState. If there are any faults, the value shall be: FaultDetected. Details of the detected fault shall be found in the Reason field, and/or the various DoorState fields and/or in extensions to this structure.

To provide more information, the device may include the following optional fields:

Reason

Optional reason for fault.

DoorMonitorFault

True if there is fault in the DoorMonitor.

LockFault

True if there is fault in the lock.

DoubleLockFault

True if there is fault in the DoubleLockMonitor

LockMonitorFault

True if there is fault in the LockMonitor.

It can be extended with optional attributes in the future.

Describes the state of a door fault.

The following values are available:

Unknown

Fault state is unknown.

NotInFault

No fault is detected.

FaultDetected

Fault is detected.

DoorMode parameters describe current Door mode from a logical perspective.

The following values are available:

Unknown

The Door is in an Unknown state.

Locked

The Door is in a Locked state. In this mode the device shall provide momentary access using the AccessDoor method if supported by the Door instance.

Unlocked

The Door is in an Unlocked (Permanent Access) state. Alarms related to door timing operations such as open too long or forced are masked in this mode.

Accessed

The Door is in an Accessed state (momentary/temporary access). Alarms related to timing operations such as "door forced" are masked in this mode.

Blocked

The Door is in a Blocked state (Door is locked, and AccessDoor requests are ignored, i.e., it is not possible for door to go to Accessed state).

LockedDown

The Door is in a LockedDown state (Door is locked) until released using the LockDownReleaseDoor command. AccessDoor, LockDoor, UnlockDoor, BlockDoor and LockOpenDoor requests are ignored, i.e., it is not possible for door to go to Accessed, Locked, Unlocked, Blocked or LockedOpen state.

LockedOpen

The Door is in a LockedOpen state (Door is unlocked) until released using the LockOpenReleaseDoor command. AccessDoor, LockDoor, UnlockDoor, BlockDoor and LockDownDoor requests are ignored, i.e., it is not possible for door to go to Accessed, Locked, Unlocked, Blocked or LockedDown state.

DoubleLocked

The Door is in a DoubleLocked state - for doors with multiple locks. If the door does not have any DoubleLock, this shall be treated as a normal Locked mode. When changing to an Unlocked mode from the DoubleLocked mode, the door may first go to Locked state before unlocking.

This operation requests the state of a Door specified by the token.

A device implementing the Door Control service shall be capable of reporting the status of a door using a DoorState structure available from the GetDoorState command.

GetDoorState command

tdc = http://www.onvif.org/ver10/doorcontrol/wsdl

axtdc = http://www.axis.com/vapix/ws/DoorControl

Use door control commands to control Door instances and to modify the states of Door instances.

This operation allows momentarily accessing a Door. It invokes the functionality typically used when a card holder presents a card to a card reader at the door and is granted access.

The DoorMode shall change to Accessed. For more information about the Accessed state and door mode restrictions, see section DoorMode data structure.

The Door shall remain accessible for the defined time. When the time span elapses, the DoorMode shall change back to its previous state.

If the request cannot be fulfilled, a Failure fault shall be returned.

A device that signals support for Access capability for a particular Door instance shall implement this method. A device that signals support for AccessTimingOverride capability for a particular Door instance shall also provide optional timing parameters (AccessTime, OpenTooLongTime and PreAlarmTime) when performing AccessDoor command.

The device shall take the best effort approach for parameters not supported, it must fallback to preconfigured time or limit the time to the closest supported time if the specified time is out of range.

AccessDoor command

This operation allows locking a Door. The DoorMode shall change to Locked. For more information about the Locked state and door mode restrictions, see section DoorMode data structure.

A device that signals support for Lock capability for a particular Door instance shall implement this method.

If the request cannot be fulfilled, a Failure fault shall be returned.

LockDoor command

This operation allows unlocking a Door. The DoorMode shall change to Unlocked. For more information about the Unlocked state and door mode restrictions, see section DoorMode data structure.

A device that signals support for Unlock capability for a particular Door instance shall implement this method.

If the request cannot be fulfilled, a Failure fault shall be returned.

UnlockDoor command

This operation allows blocking a Door and preventing momentary access (AccessDoor command). The DoorMode shall change to Blocked. For more information about the Blocked state and door mode restrictions, see section DoorMode data structure.

A device that signals support for Block capability for a particular Door instance shall implement this method.

If the request cannot be fulfilled, a Failure fault shall be returned.

BlockDoor command

This operation allows locking and preventing other actions until a LockDownReleaseDoor command is invoked. The DoorMode shall change to LockedDown. For more information about the LockedDown state and door mode restrictions, see section DoorMode data structure.

The device shall ignore other door control commands until a LockDownReleaseDoor command is performed.

A device that signals support for LockDown capability for a particular Door instance shall implement this method.

If a device supports DoubleLock capability for a particular Door instance, that operation may be engaged as well.

If the request cannot be fulfilled, a Failure fault shall be returned.

LockDownDoor command

This operation allows releasing the LockedDown state of a Door. The DoorMode shall change back to its previous/next state. It is not defined what the previous/next state shall be, but typically - Locked.

This method shall only succeed if the current DoorMode is LockedDown.

LockDownReleaseDoor command

This operation allows unlocking a Door and preventing other actions until LockOpenReleaseDoor method is invoked. The DoorMode shall change to LockedOpen. For more information about the LockedOpen state and door mode restrictions, see section DoorMode data structure.

The device shall ignore other door control commands until a LockOpenReleaseDoor command is performed.

A device that signals support for LockOpen capability for a particular Door instance shall implement this method.

If the request cannot be fulfilled, a Failure fault shall be returned.

LockOpenDoor command

This operation allows releasing the LockedOpen state of a Door. The DoorMode shall change state from the LockedOpen state back to its previous/next state. It is not defined what the previous/next state shall be, but typically - Unlocked.

This method shall only succeed if the current DoorMode is LockedOpen.

LockOpenReleaseDoor command

This operation is used for securely locking a Door. The DoorMode shall change to DoubleLocked. For more information about the DoubleLocked state and door mode restrictions, see section DoorMode data structure.

A device that signals support for DoubleLock capability for a particular Door instance shall implement this method. Otherwise this method can be performed as a standard Lock operation (see section LockDoor command).

If the door has an extra lock that shall be locked as well.

If the request cannot be fulfilled, a Failure fault shall be returned.

DoubleLockDoor command

This operation allows releasing a door from the operation at the specified PriorityLevel.

A call to this method shall release door so that DoorMode contains no action for the specified PriorityLevel, the next state shall be determined by the next PriorityLevel specified by the PriorityConfiguration for the Door.

This method is optional and must be supported if the PriorityConfigurationSupported capability is true.

ReleaseDoor command

axtdc = http://www.axis.com/vapix/ws/DoorControl

The device and configuration entity for a Door.

The following fields are available:

token

A service-unique identifier of the Door.

Name

A user readable name. It shall be up to 64 characters.

AccessTime

The normal open time for a door. Starts when door goes to Accessed state.

OpenTooLongTime

Normal open too long time for a door. Starts when door is opened.

PreAlarmTime

Time before OpenTooLong time expires and a warning event is sent.

ExtendedAccessTime

The extended open time for a door.

ExtendedOpenTooLongTime

Extended open too long time for a door.

HeartbeatInterval

The time between heartbeat event updates. A time of 0 means no heartbeat events.

PriorityConfiguration

Token of PriorityConfiguration to use.

DefaultPriority

Default priority to use if no priority is specified in a door control command. If empty, the DefaultPriority specified in the PriorityConfiguration is used.

To provide more information, the device may include the following optional field:

Description

A user readable description. It shall be up to 1024 characters.

This operation to adds or updates a list of Door:s.

This method must be implemented if the SetDoorSupported service capability is true.

SetDoor command

This operation requests a list of all Door items provided by the device.

This method must be implemented if the GetDoorSupported service capability is true.

A call to this method shall return a StartReference when not all data is returned and more data is available. The reference shall be valid for retrieving the next set of data. The number of items returned shall not be greater than Limit parameter.

GetDoorList command

This operation request a list of Door items matching the given tokens.

This method must be implemented if the GetDoorSupported service capability is true.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens. If the number of requested items is greater than MaxLimit, a TooManyItems fault shall be returned.

GetDoor command

This operation removes Door items with specified tokens.

RemoveDoor command

axtdc = http://www.axis.com/vapix/ws/DoorControl

Door priority configuration is an optional feature that makes it possible to assign door actions to different priority levels, and thus allow advanced control of the door in system where there are multiple clients controlling the same door.

This feature depends on if the PriorityConfigurationSupported service capability is true and the PriorityLevels instance capability.

The door may also support multiple levels of priority where the supported operations mentioned above can be performed on each PriorityLevel together with the ReleaseDoor operation that removes an action on the given PriorityLevel which will result in a DoorAction on each of the PriorityLevel items configured for the door by the referenced PriorityConfiguration.

Each PriorityLevel has its own setting of NoAction, Access, Lock, Unlock and DoubleLock etc. The list is processed by the service with highest priorities first, and when the first action differs from Release that action is taken.

The following is an example of the levels in a PriorityConfiguration and their default value.

The possible actions on a door in a certain PriorityLevel.

The following values are available:

NoAction

No action for the door.

Release

Release the action on the current priority.

LockDownRelease

Release state LockDown.

LockOpenRelease

Release state LockOpen.

Lock

Lock door.

Unlock

Unlock door.

Access

Unlock for the specified time and then return to previous state (typically Lock, DoubleLock or Release).

Block

Block the door (Access not allowed in this mode).

LockDown

Lock the door until LockDownRelease.

LockOpen

Unlock the door until LockOpenRelease.

DoubleLock

Double lock door.

Defines the ordered list of door priority levels and the initial DoorAction at each PriorityLevel. First in list has highest priority.

The following fields are available:

token

A service-unique identifier of the PriorityConfiguration.

Name

Name of PriorityConfiguration.

DefaultPriority

Suggested default priority.

DoorPriorityAction

List of PriorityLevel items and their initial DoorAction, with highest priorities first.

If supported, a call to this method shall return the Priority state for a door specified by the token.

This method must be implemented if the PriorityConfigurationSupported service capability is true.

GetDoorPriorityState command

Set a list of PriorityConfiguration items. If supported, a call to this operation shall set the specified PriorityConfiguration items.

This method must be implemented if the PriorityConfigurationSupported service capability is true.

SetPriorityConfiguration command

This operation requests a list of all PriorityConfiguration items provided by the device.

This method must be implemented if the PriorityConfigurationSupported service capability is true.

A call to this method shall return a StartReference when not all data is returned and more data is available. The reference shall be valid for retrieving the next set of data. The number of items returned shall not be greater than Limit parameter.

GetPriorityConfigurationList command

This operation request a list of PriorityConfiguration items matching the given tokens.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens. If the number of requested items is greater than MaxLimit, a TooManyItems fault shall be returned.

This method must be implemented if the PriorityConfigurationSupported service capability is true.

GetPriorityConfiguration command

If supported, a call to this method shall remove the PriorityConfiguration items specified by the given tokens.

This method must be implemented if the PriorityConfigurationSupported service capability is true.

RemovePriorityConfiguration command

axtdc = http://www.axis.com/vapix/ws/DoorControl

The device and hardware configuration for a Door.

The device and hardware configuration for a Door.

The following fields are available:

token

DoorController Id to use for set, remove and usage.

DeviceUUID

What device the DoorController is on.

Configuration

Configuration for the Door.

To provide more information, the device may include the following optional field:

DoorScheduleConfiguration

Token of a DoorScheduleConfiguration.

This operation requests a list of all of DoorConfiguration items provided by the device.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference;s at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call. The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

GetDoorConfigurationList command

This operation request a list of DoorConfiguration items matching the given tokens.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned

GetDoorConfiguration command

SetDoorConfiguration, the token in the DoorConfiguration should refer to an existing DoorController.

SetDoorConfiguration command

Remove the DoorConfiguration items specified by the given token. This is normally not needed, since when removing a DoorController, the configuration is removed as well - although it's possible to create configurations without a corresponding controller.

RemoveDoorConfiguration command

Get the ConfigurationInfo for a single Door specified by a token.

GetDoorConfigurationInfo command

Schedules and action for a state.

The following fields are available:

ScheduleToken

Schedules defining when state is active.

EnterAction

The action to run when entering the state.

Scheduled states for a specific priority level.

The following fields are available:

ScheduledState

Scheduled states for the door on PriorityLevel.

To provide more information, the device may include the following optional field:

PriorityLevel

The priority level

Schedule configuration for a Door.

The following fields are available:

token

A service-unique identifier of the DoorScheduleConfiguration.

DoorSchedule

List of DoorSchedule items.

To provide more information, the device may include the following optional fields:

Name

Name of the Door.

Description

Description of the Door.

Set DoorScheduleConfiguration, the token in the DoorScheduleConfiguration should refer to an existing DoorController.

SetDoorScheduleConfiguration command

This operation requests a list of all of DoorScheduleConfiguration items provided by the device.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference:s at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

GetDoorScheduleConfigurationList command

This operation request a list of DoorScheduleConfiguration items matching the given tokens.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned

GetDoorScheduleConfiguration command

Remove the specified DoorScheduleConfiguration items.

RemoveDoorScheduleConfiguration command

This operation allows momentarily accessing a Door, without unlocking the door. It is used to signal the system that for a defined period of time the door can be opened without any alarms being generated. The DoorMode shall change to Accessed. For more information about the Accessed state and door mode restrictions, see section DoorMode data structure.

The Door shall remain accessible for the defined time. When the time span elapses, the DoorMode shall change back to its previous state.

If the request cannot be fulfilled, a Failure fault shall be returned.

A device that signals support for Access capability for a particular Door instance shall implement this method. A device that signals support for AccessTimingOverride capability for a particular Door instance shall also provide optional timing parameters (AccessTime, OpenTooLongTime and PreAlarmTime) when performing AccessDoorWithoutUnlock command.

The device shall take the best effort approach for parameters not supported, it must fallback to preconfigured time or limit the time to the closest supported time if the specified time is out of range.

AccessDoorWithoutUnlock command

```
{    "Door": [        {            "token": "Axis-00408c184bdb:1352121495.979065000",            "Name": "Front Door",            "Description": "Front door description",            "AccessTime": "PT10S",            "DefaultPriority": "",            "OpenTooLongTime": "PT10S",            "PreAlarmTime": "PT5S",            "ExtendedAccessTime": "PT30S",            "ExtendedOpenTooLongTime": "PT30S",            "PriorityConfiguration": "Standard"        }    ]}
```

```
<axtdc:Door token="Axis-00408c184bdb:1352121495.979065000">    <axtdc:Name>Front Door</axtdc:Name>    <axtdc:Description>Front door description</axtdc:Description>    <axtdc:AccessTime>PT10S</axtdc:AccessTime>    <axtdc:OpenTooLongTime>PT10S</axtdc:OpenTooLongTime>    <axtdc:PreAlarmTime>PT5S</axtdc:PreAlarmTime>    <axtdc:ExtendedAccessTime>PT30S</axtdc:ExtendedAccessTime>    <axtdc:ExtendedOpenTooLongTime>PT30S</axtdc:ExtendedOpenTooLongTime>    <axtdc:HeartbeatInterval>PT600S</axtdc:HeartbeatInterval>    <axtdc:PriorityConfiguration>Standard</axtdc:PriorityConfiguration>    <axtdc:DefaultPriority /></axtdc:Door>
```

```
{    "DoorConfiguration": [        {            "token": "Axis-00408c184bdb:1352121495.979065000",            "DeviceUUID": "",            "DoorScheduleConfiguration": "",            "Configuration": [                { "Name": "Lock.Type", "Value": "Standard" },                { "Name": "DoorMonitor.ValueWhenOpen", "Value": "Input Open" },                { "Name": "DoorMonitor.ValueWhenClosed", "Value": "Input Ground" }            ]        }    ]}
```

```
<axtdc:DoorConfiguration token="Axis-00408c184bdb:1352121495.979065000">    <axtdc:DeviceUUID />    <axtdc:Configuration>        <ns0:Name>Lock.Type</ns0:Name>        <ns0:Value>Standard</ns0:Value>    </axtdc:Configuration>    <axtdc:Configuration>        <ns0:Name>DoorMonitor.ValueWhenOpen</ns0:Name>        <ns0:Value>Input Open</ns0:Value>    </axtdc:Configuration>    <axtdc:Configuration>        <ns0:Name>DoorMonitor.ValueWhenClosed</ns0:Name>        <ns0:Value>Input Ground</ns0:Value>    </axtdc:Configuration>    <axtdc:DoorScheduleConfiguration /></axtdc:DoorConfiguration>
```

```
{    "tdc:AccessDoor": {        "Token": "Axis-00408c184bdb:1352121495.979065000"    }}
```

```
<tdc:AccessDoor>    <tdc:Token>Axis-00408c184bdb:1352121495.979065000</tdc:Token></tdc:AccessDoor>
```

```
{    "tdc:UnlockDoor": {        "Token": "Axis-00408c184bdb:1352121495.979065000"    }}
```

```
<tdc:UnlockDoor>    <Token>Axis-00408c184bdb:1352121495.979065000</Token></tdc:UnlockDoor>
```

```
{    "axtdc:AccessDoorWithoutUnlock": {        "Token": "Axis-00408c184bdb:1352121495.979065000"    }}
```

```
<axtdc:AccessDoorWithoutUnlock>    <axtdc:Token>Axis-00408c184bdb:1352121495.979065000</axtdc:Token></axtdc:AccessDoorWithoutUnlock>
```

```
{    "rowid": 133,    "token": "Axis-00408c184bdb:1383216924.148152000",    "UUID": "5581ad80-95b0-11e0-b883-00408c184bdb",    "UtcTime": "2013-10-31T10:55:24.067163Z",    "KeyValues": [        {            "Key": "State",            "Value": "Accessed",            "Tags": ["property-state", "wstype:tdc:DoorMode", "onvif-data"]        },        {            "Key": "DoorToken",            "Value": "Axis-00408c184bdb:1352121495.979065000",            "Tags": ["wstype:pt:ReferenceToken", "onvif-source"]        },        { "Key": "topic2", "Value": "DoorMode", "Tags": [] },        { "Key": "topic1", "Value": "State" },        { "Key": "topic0", "Value": "Door", "Tags": [] }    ],    "Tags": []}
```

```
<axlog:Event>    <axlog:rowid>133</axlog:rowid>    <axlog:UUID>5581ad80-95b0-11e0-b883-00408c184bdb</axlog:UUID>    <axlog:UtcTime>2013-10-31T10:55:24Z</axlog:UtcTime>    <axlog:KeyValues>        <axlog:Key>State</axlog:Key>        <axlog:Value>Accessed</axlog:Value>        <axlog:Tags>property-state</axlog:Tags>        <axlog:Tags>wstype:tdc:DoorMode</axlog:Tags>        <axlog:Tags>onvif-data</axlog:Tags>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>DoorToken</axlog:Key>        <axlog:Value>Axis-00408c184bdb:1352121495.979065000</axlog:Value>        <axlog:Tags>wstype:pt:ReferenceToken</axlog:Tags>        <axlog:Tags>onvif-source</axlog:Tags>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic2</axlog:Key>        <axlog:Value>DoorMode</axlog:Value>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic1</axlog:Key>        <axlog:Value>State</axlog:Value>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic0</axlog:Key>        <axlog:Value>Door</axlog:Value>    </axlog:KeyValues></axlog:Event>
```

```
{    "rowid": 372,    "token": "Axis-00408c184c74:1383299532.611446000",    "UUID": "5581ad80-95b0-11e0-b883-00408c184c74",    "UtcTime": "2013-11-01T09:52:12.412969Z",    "KeyValues": [        {            "Key": "State",            "Value": "Open",            "Tags": ["property-state", "wstype:tdc:DoorPhysicalState", "onvif-data"]        },        {            "Key": "DoorToken",            "Value": "Axis-00408c184bdb:1352121495.979065000",            "Tags": ["wstype:pt:ReferenceToken", "onvif-source"]        },        { "Key": "topic2", "Value": "DoorPhysicalState", "Tags": [] },        { "Key": "topic1", "Value": "State", "Tags": [] },        { "Key": "topic0", "Value": "Door", "Tags": [] }    ],    "Tags": []}
```

```
<axlog:Event>    <axlog:rowid>372</axlog:rowid>    <axlog:UUID>5581ad80-95b0-11e0-b883-00408c184c74</axlog:UUID>    <axlog:UtcTime>2013-11-01T09:52:12Z</axlog:UtcTime>    <axlog:KeyValues>        <axlog:Key>State</axlog:Key>        <axlog:Value>Open</axlog:Value>        <axlog:Tags>property-state</axlog:Tags>        <axlog:Tags>wstype:tdc:DoorPhysicalState</axlog:Tags>        <axlog:Tags>onvif-data</axlog:Tags>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>DoorToken</axlog:Key>        <axlog:Value>Axis-00408c184bdb:1352121495.979065000</axlog:Value>        <axlog:Tags>wstype:pt:ReferenceToken</axlog:Tags>        <axlog:Tags>onvif-source</axlog:Tags>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic2</axlog:Key>        <axlog:Value>DoorPhysicalState</axlog:Value>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic1</axlog:Key>        <axlog:Value>State</axlog:Value>    </axlog:KeyValues>    <axlog:KeyValues>        <axlog:Key>topic0</axlog:Key>        <axlog:Value>Door</axlog:Value>    </axlog:KeyValues></axlog:Event>
```

```
{    "PriorityConfiguration": [        {            "DefaultPriority": "Medium",            "DoorPriorityAction": [                { "DoorAction": "Release", "PriorityLevel": "Highest" },                { "DoorAction": "Release", "PriorityLevel": "High" },                { "DoorAction": "Release", "PriorityLevel": "Medium" },                { "DoorAction": "Release", "PriorityLevel": "Low" },                { "DoorAction": "Lock", "PriorityLevel": "Lowest" }            ],            "Name": "Prio Configuration Name",            "token": "Axis-00408c184bdb:1352207054.721964001"        }    ]}
```

```
<axtdc:PriorityConfiguration token="Axis-00408c184bdb:1352207054.721964001">    <axtdc:Name>Prio Configuration Name</axtdc:Name>    <axtdc:DefaultPriority>Medium</axtdc:DefaultPriority>    <axtdc:DoorPriorityAction>        <axtdc:DoorAction>Release</axtdc:DoorAction>        <axtdc:PriorityLevel>Highest</axtdc:PriorityLevel>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:DoorAction>Release</axtdc:DoorAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:DoorAction>Release</axtdc:DoorAction>        <axtdc:PriorityLevel>Medium</axtdc:PriorityLevel>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:DoorAction>Release</axtdc:DoorAction>        <axtdc:PriorityLevel>Low</axtdc:PriorityLevel>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:DoorAction>Lock</axtdc:DoorAction>        <axtdc:PriorityLevel>Lowest</axtdc:PriorityLevel>    </axtdc:DoorPriorityAction></axtdc:PriorityConfiguration>
```

```
{    "Door": [        {            "token": "Axis-00408c184bdb:1352121495.979065000",            "Name": "Front Door",            "Description": "Front door description",            "AccessTime": "PT10S",            "DefaultPriority": "",            "HeartbeatInterval": "PT0S",            "OpenTooLongTime": "PT10S",            "PreAlarmTime": "PT5S",            "ExtendedAccessTime": "PT30S",            "ExtendedOpenTooLongTime": "PT30S",            "PriorityConfiguration": "Axis-00408c184bdb:1352207054.721964001"        }    ]}
```

```
<axtdc:Door token="Axis-00408c184bdb:1352121495.979065000">    <axtdc:Name>Front Door</axtdc:Name>    <axtdc:Description>Front door description</axtdc:Description>    <axtdc:AccessTime>PT10S</axtdc:AccessTime>    <axtdc:OpenTooLongTime>PT10S</axtdc:OpenTooLongTime>    <axtdc:PreAlarmTime>PT5S</axtdc:PreAlarmTime>    <axtdc:ExtendedAccessTime>PT30S</axtdc:ExtendedAccessTime>    <axtdc:ExtendedOpenTooLongTime>PT30S</axtdc:ExtendedOpenTooLongTime>    <axtdc:HeartbeatInterval>PT0S</axtdc:HeartbeatInterval>    <axtdc:PriorityConfiguration>Axis-00408c184bdb:1352207054.721964001</axtdc:PriorityConfiguration>    <axtdc:DefaultPriority /></axtdc:Door>
```

```
{    "axtdc:GetDoorPriorityState": {        "Token": "Axis-00408c184bdb:1352121495.979065000"    }}
```

```
<axtdc:GetDoorPriorityState>    <axtdc:Token>Axis-00408c184bdb:1352121495.979065000</axtdc:Token></axtdc:GetDoorPriorityState>
```

```
{    "DoorPriorityAction": [        { "DoorAction": "Release", "PriorityLevel": "Highest" },        { "DoorAction": "Release", "PriorityLevel": "High" },        { "DoorAction": "Release", "PriorityLevel": "Medium" },        { "DoorAction": "Release", "PriorityLevel": "Low" },        { "DoorAction": "Lock", "PriorityLevel": "Lowest" }    ]}
```

```
<axtdc:GetDoorPriorityStateResponse>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Highest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Medium</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Low</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Lowest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Lock</axtdc:DoorAction>    </axtdc:DoorPriorityAction></axtdc:GetDoorPriorityStateResponse>
```

```
{    "tdc:UnlockDoor": {        "Token": "Axis-00408c184bdb:1352121495.979065000",        "PriorityLevel": "Medium"    }}
```

```
<tdc:UnlockDoor>    <PriorityLevel>Medium</PriorityLevel>    <Token>Axis-00408c184bdb:1352121495.979065000</Token></tdc:UnlockDoor>
```

```
{    "DoorPriorityAction": [        { "DoorAction": "Release", "PriorityLevel": "Highest" },        { "DoorAction": "Release", "PriorityLevel": "High" },        { "DoorAction": "Unlock", "PriorityLevel": "Medium" },        { "DoorAction": "Release", "PriorityLevel": "Low" },        { "DoorAction": "Lock", "PriorityLevel": "Lowest" }    ]}
```

```
<axtdc:GetDoorPriorityStateResponse>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Highest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Medium</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Unlock</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Low</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Lowest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Lock</axtdc:DoorAction>    </axtdc:DoorPriorityAction></axtdc:GetDoorPriorityStateResponse>
```

```
{    "axtdc:ReleaseDoor": {        "Token": "Axis-00408c184bdb:1352121495.979065000",        "PriorityLevel": "Medium"    }}
```

```
<axtdc:ReleaseDoor>    <axtdc:PriorityLevel>Medium</axtdc:PriorityLevel>    <axtdc:Token>Axis-00408c184bdb:1352121495.979065000</axtdc:Token></axtdc:ReleaseDoor>
```

```
{    "DoorPriorityAction": [        { "DoorAction": "Release", "PriorityLevel": "Highest" },        { "DoorAction": "Release", "PriorityLevel": "High" },        { "DoorAction": "Release", "PriorityLevel": "Medium" },        { "DoorAction": "Release", "PriorityLevel": "Low" },        { "DoorAction": "Lock", "PriorityLevel": "Lowest" }    ]}
```

```
<axtdc:GetDoorPriorityStateResponse>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Highest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Medium</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Low</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Lowest</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Lock</axtdc:DoorAction>    </axtdc:DoorPriorityAction></axtdc:GetDoorPriorityStateResponse>
```

```
{    "DoorScheduleConfiguration": [        {            "Name": "Door Schedule Name",            "Description": "This is a description for schedule configuration",            "DoorSchedule": [                {                    "PriorityLevel": "",                    "ScheduledState": [{ "EnterAction": "Lock", "ScheduleToken": ["standard_always"] }]                }            ],            "token": "Axis-00408c184bdb:1331557205.709394000"        }    ]}
```

```
<axtdc:DoorScheduleConfiguration token="Axis-00408c184bdb:1331557205.709394000">    <axtdc:Name>Door Schedule Name</axtdc:Name>    <axtdc:Description>        This is a description for schedule    configuration    </axtdc:Description>    <axtdc:DoorSchedule>        <axtdc:PriorityLevel />        <axtdc:ScheduledState>            <axtdc:ScheduleToken>standard_always</axtdc:ScheduleToken>            <axtdc:EnterAction>Lock</axtdc:EnterAction>        </axtdc:ScheduledState>    </axtdc:DoorSchedule></axtdc:DoorScheduleConfiguration>
```

```
{    "DoorConfiguration": [        {            "token": "Axis-00408c184bdb:1352121495.979065000",            "DeviceUUID": "5581ad80-95b0-11e0-b883-00408c184bdb",            "DoorScheduleConfiguration": "Axis-00408c184bdb:1331557205.709394000"        }    ]}
```

```
<axtdc:DoorConfiguration token="Axis-00408c184bdb:1352121495.979065000">    <axtdc:DeviceUUID />    <axtdc:DoorScheduleConfiguration>Axis-00408c184bdb:1331557205.709394000</axtdc:DoorScheduleConfiguration></axtdc:DoorConfiguration>
```

```
{    "DoorScheduleConfiguration": [        {            "Name": "Door Schedule Name",            "Description": "This is a description for schedule configuration",            "DoorSchedule": [                {                    "PriorityLevel": "",                    "ScheduledState": [                        { "EnterAction": "Unlock", "ScheduleToken": ["office_hours"] },                        { "EnterAction": "Lock", "ScheduleToken": ["standard_always"] }                    ]                }            ],            "token": "Axis-00408c184bdb:1331557205.709394000"        }    ]}
```

```
<axtdc:DoorScheduleConfiguration token="Axis-00408c184bdb:1331557205.709394000">    <axtdc:Name>Door Schedule Name</axtdc:Name>    <axtdc:Description>        This is a description for schedule    configuration    </axtdc:Description>    <axtdc:DoorSchedule>        <axtdc:PriorityLevel />        <axtdc:ScheduledState>            <axtdc:EnterAction>Unlock</axtdc:EnterAction>            <axtdc:ScheduleToken>office_hours</axtdc:ScheduleToken>        </axtdc:ScheduledState>        <axtdc:ScheduledState>            <axtdc:EnterAction>Lock</axtdc:EnterAction>            <axtdc:ScheduleToken>standard_always</axtdc:ScheduleToken>        </axtdc:ScheduledState>    </axtdc:DoorSchedule></axtdc:DoorScheduleConfiguration>
```

```
{    "DoorPriorityAction": [        { "DoorAction": "Release", "PriorityLevel": "High" },        { "DoorAction": "Release", "PriorityLevel": "Medium" },        { "DoorAction": "Lock", "PriorityLevel": "Low" }    ]}
```

```
<DoorPriorityAction>    <DoorAction>Release</DoorAction>    <PriorityLevel>High</PriorityLevel></DoorPriorityAction><DoorPriorityAction>    <DoorAction>Release</DoorAction>    <PriorityLevel>Medium</PriorityLevel></DoorPriorityAction><DoorPriorityAction>    <DoorAction>LockDoor<Action>    <PriorityLevel>Low<PriorityLevel></DoorPriorityAction>
```

```
{    "DoorScheduleConfiguration": [        {            "Name": "Door Schedule Name",            "Description": "This is a description for schedule configuration",            "DoorSchedule": [                {                    "PriorityLevel": "Medium",                    "ScheduledState": [                        { "EnterAction": "Unlock", "ScheduleToken": ["office_hours"] },                        { "EnterAction": "Release", "ScheduleToken": ["standard_always"] }                    ]                },                {                    "PriorityLevel": "High",                    "ScheduledState": [                        { "EnterAction": "Lock", "ScheduleToken": ["public_holidays"] },                        { "EnterAction": "Release", "ScheduleToken": ["standard_always"] }                    ]                }            ],            "token": "Axis-00408c184bdb:1331557205.709394000"        }    ]}
```

```
<axtdc:DoorScheduleConfiguration token="Axis-00408c184bdb:1331557205.709394000">    <axtdc:Name>Door Schedule Name</axtdc:Name>    <axtdc:Description>        This is a description for schedule    configuration    </axtdc:Description>    <axtdc:DoorSchedule>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:ScheduledState>            <axtdc:EnterAction>Lock</axtdc:EnterAction>            <axtdc:ScheduleToken>public_holidays</axtdc:ScheduleToken>        </axtdc:ScheduledState>        <axtdc:ScheduledState>            <axtdc:EnterAction>Release</axtdc:EnterAction>            <axtdc:ScheduleToken>standard_always</axtdc:ScheduleToken>        </axtdc:ScheduledState>    </axtdc:DoorSchedule></axtdc:DoorScheduleConfiguration>
```

```
{    "DoorPriorityAction": [        { "DoorAction": "Lock", "PriorityLevel": "High" },        { "DoorAction": "Unlock", "PriorityLevel": "Medium" },        { "DoorAction": "Lock", "PriorityLevel": "Low" }    ]}
```

```
<DoorPriorityAction>    <DoorAction>Lock</DoorAction>    <PriorityLevel>High</PriorityLevel></DoorPriorityAction><DoorPriorityAction>    <DoorAction>Unlock</DoorAction>    <PriorityLevel>Medium</PriorityLevel></DoorPriorityAction><DoorPriorityAction>    <DoorAction>Lock</DoorAction>    <PriorityLevel>Low</PriorityLevel></DoorPriorityAction>
```

```
{    "axtdc:SetPriorityConfiguration": {        "PriorityConfiguration": [            {                "DefaultPriority": "Normal",                "DoorPriorityAction": [                    {                        "PriorityLevel": "High",                        "DoorAction": "Release"                    },                    {                        "PriorityLevel": "Normal",                        "DoorAction": "Lock"                    }                ],                "Name": "My Priority Configuration",                "token": "myPriorityConfiguration"            }        ]    }}
```

```
<axtdc:SetPriorityConfiguration>    <axtdc:PriorityConfiguration token="myPriorityConfiguration">        <axtdc:DefaultPriority>Normal</axtdc:DefaultPriority>        <axtdc:DoorPriorityAction>            <axtdc:PriorityLevel>High</axtdc:PriorityLevel>            <axtdc:DoorAction>Release</axtdc:DoorAction>        </axtdc:DoorPriorityAction>        <axtdc:DoorPriorityAction>            <axtdc:PriorityLevel>Normal</axtdc:PriorityLevel>            <axtdc:DoorAction>Lock</axtdc:DoorAction>        </axtdc:DoorPriorityAction>        <axtdc:Name>My Priority Configuration</axtdc:Name>    </axtdc:PriorityConfiguration></axtdc:SetPriorityConfiguration>
```

```
{    "axtdc:SetDoor": {        "Door": [            {                "Name": "My Door",                "Description": "My door description",                "AccessTime": "PT7S",                "DefaultPriority": "Normal",                "OpenTooLongTime": "PT30S",                "PreAlarmTime": "PT10S",                "ExtendedAccessTime": "PT30S",                "ExtendedOpenTooLongTime": "PT60S",                "HeartbeatInterval": "PT600S",                "token": "myDoor",                "PriorityConfiguration": "myPriorityConfiguration"            }        ]    }}
```

```
<axtdc:SetDoor>    <axtdc:Door token="myDoor">        <axtdc:Name>My Door</axtdc:Name>        My Door        <axtdc:Description>My door description</axtdc:Description>        <axtdc:AccessTime>PT7S</axtdc:AccessTime>        <axtdc:DefaultPriority>Normal</axtdc:DefaultPriority>        <axtdc:OpenTooLongTime>PT30S</axtdc:OpenTooLongTime>        <axtdc:PreAlarmTime>PT10S</axtdc:PreAlarmTime>        <axtdc:ExtendedAccessTime>PT30S</axtdc:ExtendedAccessTime>        <axtdc:ExtendedOpenTooLongTime>PT60S</axtdc:ExtendedOpenTooLongTime>        <axtdc:HeartbeatInterval>PT600S</axtdc:HeartbeatInterval>        <axtdc:PriorityConfiguration>myPriorityConfiguration</axtdc:PriorityConfiguration>    </axtdc:Door></axtdc:SetDoor>
```

```
{    "axtdc:SetDoorScheduleConfiguration": {        "DoorScheduleConfiguration": [            {                "DoorSchedule": [                    {                        "PriorityLevel": "Normal",                        "ScheduledState": [                            {                                "ScheduleToken": ["standard_office_hours"],                                "EnterAction": "Unlock"                            },                            {                                "ScheduleToken": ["standard_always"],                                "EnterAction": "Lock"                            }                        ]                    }                ],                "token": "myDoorScheduleConfiguration",                "Name": "My Door Schedule Configuration",                "Description": "My door schedule configuration description"            }        ]    }}
```

```
<axtdc:SetDoorScheduleConfiguration>    <axtdc:DoorScheduleConfiguration token="myDoorScheduleConfiguration">        <axtdc:DoorSchedule>            <axtdc:PriorityLevel>Normal</axtdc:PriorityLevel>            <axtdc:ScheduledState>                <axtdc:ScheduleToken>standard_office_hours</axtdc:ScheduleToken>                <axtdc:EnterAction>Unlock</axtdc:EnterAction>            </axtdc:ScheduledState>            <axtdc:ScheduledState>                <axtdc:ScheduleToken>standard_always</axtdc:ScheduleToken>                <axtdc:EnterAction>Lock</axtdc:EnterAction>            </axtdc:ScheduledState>            <axtdc:Name>My Door Schedule Configuration</axtdc:Name>            <axtdc:Description>My door schedule configuration description</axtdc:Description>        </axtdc:DoorSchedule>    </axtdc:DoorScheduleConfiguration></axtdc:SetDoorScheduleConfiguration>
```

```
{    "axtdc:SetDoorConfiguration": [        {            "DoorConfiguration": [                {                    "token": "Axis-accc8ea52514:1550758557.437969000",                    "DeviceUUID": "",                    "Configuration": [                        {                            "Name": "DoorMonitor.ValueWhenClosed",                            "Value": "Input Ground"                        },                        {                            "Name": "Lock.LockWhenDoorOpens",                            "Value": "true"                        },                        {                            "Name": "DebounceTime",                            "Value": "0"                        },                        {                            "Name": "Lock.BoltOutTime",                            "Value": "0"                        },                        {                            "Name": "DoorMonitor.ValueWhenOpen",                            "Value": "Input Open"                        },                        {                            "Name": "Lock.RelayStateWhenLocked",                            "Value": "Open"                        },                        {                            "Name": "Lock.BoltInTime",                            "Value": "0"                        },                        {                            "Name": "Lock.Type",                            "Value": "Relay"                        },                        {                            "Name": "DoubleLock.Type",                            "Value": "None"                        },                        {                            "Name": "Lock.LockWhenDoorOpensDelay",                            "Value": "3000"                        },                        {                            "Name": "Lock.Protocol",                            "Value": "None"                        },                        {                            "Name": "Lock.Hardware.Address",                            "Value": "0"                        },                        {                            "Name": "Lock.Hardware.Id",                            "Value": "0"                        },                        {                            "Name": "Lock.ValueWhenLocked",                            "Value": "Gnd"                        },                        {                            "Name": "Lock.ValueWhenUnlocked",                            "Value": "12V"                        },                        {                            "Name": "Lock.LockMonitor.ValueWhenLocked",                            "Value": "None"                        },                        {                            "Name": "Lock.LockMonitor.ValueWhenUnlocked",                            "Value": "None"                        },                        {                            "Name": "DoubleLock.ValueWhenLocked",                            "Value": "Gnd"                        },                        {                            "Name": "DoubleLock.ValueWhenUnlocked",                            "Value": "12V"                        },                        {                            "Name": "DoubleLock.RelayStateWhenLocked",                            "Value": "Open"                        },                        {                            "Name": "DoubleLock.BoltOutTime",                            "Value": "700"                        },                        {                            "Name": "DoubleLock.BoltInTime",                            "Value": "700"                        },                        {                            "Name": "DoubleLock.LockMonitor.ValueWhenLocked",                            "Value": "None"                        },                        {                            "Name": "DoubleLock.LockMonitor.ValueWhenUnlocked",                            "Value": "None"                        },                        {                            "Name": "DoorMonitor.SupervisedHigh",                            "Value": "1855"                        },                        {                            "Name": "DoorMonitor.SupervisedLow",                            "Value": "740"                        },                        {                            "Name": "DoorMonitor.SupervisedShort",                            "Value": "0"                        },                        {                            "Name": "DoorMonitor.SupervisedCut",                            "Value": "2755"                        },                        {                            "Name": "DoorMonitor.Type",                            "Value": "None"                        },                        {                            "Name": "DoorMonitor.Protocol",                            "Value": "None"                        },                        {                            "Name": "DoorMonitor.Hardware.Address",                            "Value": "0"                        },                        {                            "Name": "UserData",                            "Value": "0"                        },                        {                            "Name": "Lock.TCPIP.Port",                            "Value": "0"                        },                        {                            "Name": "Lock.TCPIP.Address",                            "Value": ""                        },                        {                            "Name": "Lock.Hub.Hardware.Address",                            "Value": ""                        },                        {                            "Name": "Door.Type",                            "Value": "Regular"                        }                    ]                }            ],            "DoorScheduleConfiguration": "myDoorScheduleConfiguration"        }    ]}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration>        token="Axis-accc8ea52514:1550758557.437969000"        <axtdc:DeviceUUID />        <axtdc:Configuration>            <ns0:Name>DoorMonitor.ValueWhenClosed</ns0:Name>            <ns0:Value>Input Ground</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.LockWhenDoorOpens</ns0:Name>            <ns0:Value>true</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DebounceTime</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.BoltOutTime</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.ValueWhenOpen</ns0:Name>            <ns0:Value>Input Open</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.RelayStateWhenLocked</ns0:Name>            <ns0:Value>Open</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.BoltInTime</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Type</ns0:Name>            <ns0:Value>Relay</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.Type</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.LockWhenDoorOpensDelay</ns0:Name>            <ns0:Value>3000</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Protocol</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Hardware.Address</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Hardware.Id</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.ValueWhenLocked</ns0:Name>            <ns0:Value>Gnd</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.ValueWhenUnlocked</ns0:Name>            <ns0:Value>12V</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.LockMonitor.ValueWhenLocked</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.LockMonitor.ValueWhenUnlocked</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.ValueWhenLocked</ns0:Name>            <ns0:Value>Gnd</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.ValueWhenUnlocked</ns0:Name>            <ns0:Value>12V</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.RelayStateWhenLocked</ns0:Name>            <ns0:Value>Open</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.BoltOutTime</ns0:Name>            <ns0:Value>700</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.BoltInTime</ns0:Name>            <ns0:Value>700</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.LockMonitor.ValueWhenLocked</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoubleLock.LockMonitor.ValueWhenUnlocked</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.SupervisedHigh</ns0:Name>            <ns0:Value>1855</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.SupervisedLow</ns0:Name>            <ns0:Value>740</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.SupervisedShort</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.SupervisedCut</ns0:Name>            <ns0:Value>2755</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.Type</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.Protocol</ns0:Name>            <ns0:Value>None</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>DoorMonitor.Hardware.Address</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>UserData</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.TCPIP.Port</ns0:Name>            <ns0:Value>0</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.TCPIP.Address</ns0:Name>            <ns0:Value>""</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Lock.Hub.Hardware.Address</ns0:Name>            <ns0:Value>""</ns0:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <ns0:Name>Door.Type</ns0:Name>            <ns0:Value>Regular</ns0:Value>        </axtdc:Configuration>    </axtdc:DoorConfiguration>    <axtdc:DoorScheduleConfiguration /></axtdc:SetDoorConfiguration>
```

```
{    "axtdc:GetDoorPriorityState": {        "Token": "myDoor"    }}
```

```
<axtdc:GetDoorPriorityState>    <axtdc:Token>myDoor</axtdc:Token></axtdc:GetDoorPriorityState>
```

```
{    "DoorPriorityAction": [        {            "PriorityLevel": "High",            "Reason": "",            "DoorAction": "Release"        },        {            "PriorityLevel": "Normal",            "Reason": "Schedule",            "DoorAction": "Unlock"        }    ]}
```

```
<axtdc:GetDoorPriorityStateResponse>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Normal</axtdc:PriorityLevel>        <axtdc:Reason>Schedule</axtdc:Reason>        <axtdc:DoorAction>Unlock</axtdc:DoorAction>    </axtdc:DoorPriorityAction></axtdc:GetDoorPriorityStateResponse>
```

```
{    "DoorPriorityAction": [        {            "PriorityLevel": "High",            "Reason": "",            "DoorAction": "Release"        },        {            "PriorityLevel": "Normal",            "Reason": "Schedule",            "DoorAction": "Lock"        }    ]}
```

```
<axtdc:GetDoorPriorityStateResponse>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>High</axtdc:PriorityLevel>        <axtdc:Reason />        <axtdc:DoorAction>Release</axtdc:DoorAction>    </axtdc:DoorPriorityAction>    <axtdc:DoorPriorityAction>        <axtdc:PriorityLevel>Normal</axtdc:PriorityLevel>        <axtdc:Reason>Schedule</axtdc:Reason>        <axtdc:DoorAction>Lock</axtdc:DoorAction>    </axtdc:DoorPriorityAction></axtdc:GetDoorPriorityStateResponse>
```

```
{    "tdc:UnlockDoor": {        "Token": "myDoor",        "PriorityLevel": "High"    }}
```

```
<tdc:UnlockDoor>    <tdc:Token>myDoor</tdc:Token>    <tdc:PriorityLevel>High</tdc:PriorityLevel></tdc:UnlockDoor>
```

```
{    "DoorPriorityAction": [        {            "PriorityLevel": "High",            "Reason": "API",            "DoorAction": "Unlock"        },        {            "PriorityLevel": "Normal",            "Reason": "Schedule",            "DoorAction": "Lock"        }    ]}
```

```
{    "axtdc:ReleaseDoor": {        "Token": "myDoor",        "PriorityLevel": "High"    }}
```

```
<axtdc:ReleaseDoor>    <axtdc:Token>myDoor</axtdc:Token>    <axtdc:PriorityLevel>High</axtdc:PriorityLevel></axtdc:ReleaseDoor>
```

```
{    "DoorPriorityAction": [        {            "PriorityLevel": "High",            "Reason": "API",            "DoorAction": "Release"        },        {            "PriorityLevel": "Normal",            "Reason": "Schedule",            "DoorAction": "Lock"        }    ]}
```

```
axconf = http://www.axis.com/vapix/ws/Config
```

- AccessTime
The time, specified in seconds in the example above, that the door shall remain unlocked after access has been granted.
- OpenTooLongTime
The time, specified in seconds in the example above, that the door is allowed to stay open. DoorAlarm event is sent if the door is still open when the OpenTooLongTime has been reached.
- PreAlarmTime
This specifies how long before the OpenTooLongTime expires that a DoorWarning event should be sent.

- axtdc:GetDoorConfigurationList: Returns a list of DoorConfiguration.
- axtdc:GetDoorConfiguration: Returns DoorConfiguration for the specified token.
- axtdc:GetDoorConfigurationInfo: Returns only the Configuration of the DoorConfiguration for the specified token.

- tdc:UnlockDoor will unlock the door until Door Control Service is told otherwise, for example when locked again by calling tdc:LockDoor.
- tdc:AccessDoor means temporarily unlocking the door and it will be automatically locked again when closed or when AccessTime expires if not opened, as specified in Door data structure. AccessDoor is typically used when someone has been granted access to a door, and the door is unlocked for a specified time to let the person pass.
axtdc:AccessDoorWithoutUnlock is used to temporarily grant access to a door without unlocking it. This is used for doors that can be unlocked manually without the need for the controller to unlock the door. The reason for this state is to ensure that no DoorForcedOpenAlarm is sent if the door is opened manually during the time a user is granted access.

- A DoorScheduleConfiguration with two schedules and priority level Normal. The DoorScheduleConfiguration keeps the door unlocked during office hours and locked outside office hours.
- A PriorityConfiguration with priority levels high and normal. The high level makes it possible to override the DoorScheduleConfiguration.
- A Door and a DoorConfiguration.

- Getting list of doors including their capabilities (e.g., supported operations).
- Getting actual state (e.g., open or closed, locked or unlocked, health status).
- Locking and unlocking.
- Blocking door in locked state such that it can't be accessed.
- Holding door in either unlocked (locked open) or locked (locked down) state and releasing the hold.
- Momentary access.
- Double lock (also known as secure lock) for preventing night-time access.

- Door physical status change (e.g., open or closed).
- Lock physical state change (e.g., locked or unlocked).
- Operation mode change (e.g., blocked, locked down or locked open).
- Alarm (if door was forced open or was open for too long during momentary access).
- Tamper (an attempt to physically damage its components).
- Hardware malfunction.

- Name
Name of configuration setting.
- Value
Value of configuration setting.

- Name
Name of configuration setting.
- Value
Value of configuration setting.
- Enums
Suggested/allowed values.

- Type
Type of configuration setting, e.g. xs:string, xs:boolean, xs:int.
- DependOnName
Name of the Config this config depends on.
- DependOnValue
Value of the Config this config depends on.
- Description
Description of configuration setting.

- With the GetServices method of device service when IncludeCapability is true. Refer to the ONVIF core specification for more details.
- With the GetServiceCapabilities method.

- MaxLimit
The maximum number of entries returned by a single GetList or Get request. The device shall never return more than this number of entities in a single response.
- GetDoorSupported
True if GetDoor and GetDoorList operations are supported.
- SetDoorSupported
True if SetDoor and SetDoorList operations are supported.
- PriorityConfigurationSupported
True if PriorityConfigurations can be modified.

- Name: GetServiceCapabilities
- Access Class: PRE_AUTH

- token
A service-unique identifier of the Door.
- Name
A user readable name. It shall be up to 64 characters.
- Capabilities
The capabilities of the Door.

- Description
A user readable description. It shall be up to 1024 characters.

- Access
Indicates whether or not this Door instance supports AccessDoor command to perform momentary access.
- AccessTimingOverride
Indicates that this Door instance supports overriding configured timing in the AccessDoor command.
- Lock
Indicates that this Door instance supports LockDoor command to lock the door.
- Unlock
Indicates that this Door instance supports UnlockDoor command to unlock the door.
- Block
Indicates that this Door instance supports BlockDoor command to block the door.
- DoubleLock
Indicates that this Door instance supports DoubleLockDoor command to lock multiple locks on the door.
- LockDown
Indicates that this Door instance supports LockDown (and LockDownRelease) commands to lock the door and put it in LockedDown mode.
- LockOpen
Indicates that this Door instance supports LockOpen (and LockOpenRelease) commands to unlock the door and put it in LockedOpen mode.
- DoorMonitor
Indicates that this Door instance has a DoorMonitor and supports the DoorPhysicalState event.
- LockMonitor
Indicates that this Door instance has a LockMonitor and supports the LockPhysicalState event.
- DoubleLockMonitor
Indicates that this Door instance has a DoubleLockMonitor and supports the DoubleLockPhysicalState event.
- Alarm
Indicates that this Door instance supports door alarm and the DoorAlarm event.
- Tamper
Indicates that this Door instance has a tamper detector and supports the DoorTamper event.
- Fault
Indicates that this Door instance supports door fault and the DoorFault event.
- Warning
Indicates that this Door instance supports door warning and the DoorWarning event.
- Configurable
Indicates if the Door settings can be modified.
- PriorityLevels
Number of priority levels supported for the door, 0 or 1 means priorities not supported.

- Name: GetDoorInfoList
- Access Class: READ_SYSTEM

- Name: GetDoorInfo
- Access Class: READ_SYSTEM

- DoorMode
The logical operating mode of the door; it is of type DoorMode. An ONVIF compatible device shall report current operating mode in this field.

- DoorPhysicalState
Physical state of Door; it is of type DoorPhysicalState. A device that signals support for DoorMonitor capability for a particular door instance shall provide this field.
- LockPhysicalState
Physical state of the Lock; it is of type LockPhysicalState. A device that signals support for LockMonitor capability for a particular door instance shall provide this field.
- DoubleLockPhysicalState
Physical state of the DoubleLock; it is of type LockPhysicalState. A device that signals support for DoubleLockMonitor capability for a particular door instance shall provide this field.
- Alarm
Alarm state of the door; it is of type DoorAlarmState. A device that signals support for Alarm capability for a particular door instance shall provide this field.
- Tamper
Tampering state of the door; it is of type DoorTamper. A device that signals support for Tamper capability for a particular door instance shall provide this field.
- Fault
Fault information for door; it is of type DoorFault. A device that signals support for Fault capability for a particular door instance shall provide this field.

- Unknown
Value is currently unknown (possibly due to initialization or monitors not giving a conclusive result).
- Open
Door is open.
- Closed
Door is closed.
- Fault
Door monitor fault is detected.

- Unknown
Value is currently not known.
- Locked
Lock is activated.
- Unlocked
Lock is not activated.
- Fault
Lock fault is detected.

- Normal
No alarm.
- DoorForcedOpen
Door is forced open.
- DoorOpenTooLong
Door is held open too long.

- Normal
No warning.
- DoorOpenTooLongWarn
Door is soon held open too long.

- State
State of the tamper detector; it is of type DoorTamperState.

- Reason
Optional field; Details describing tampering state change (e.g., reason, place and time). NOTE: All fields (including this one) which are designed to give end-user prompts can be localized to the customers's native language.

- Unknown
Value is currently not known.
- NotInTamper
No tampering is detected.
- TamperDetected
Tampering is detected.

- State
Overall fault state for the door; it is of type DoorFaultState. If there are any faults, the value shall be: FaultDetected. Details of the detected fault shall be found in the Reason field, and/or the various DoorState fields and/or in extensions to this structure.

- Reason
Optional reason for fault.
- DoorMonitorFault
True if there is fault in the DoorMonitor.
- LockFault
True if there is fault in the lock.
- DoubleLockFault
True if there is fault in the DoubleLockMonitor
- LockMonitorFault
True if there is fault in the LockMonitor.

- Unknown
Fault state is unknown.
- NotInFault
No fault is detected.
- FaultDetected
Fault is detected.

- Unknown
The Door is in an Unknown state.
- Locked
The Door is in a Locked state. In this mode the device shall provide momentary access using the AccessDoor method if supported by the Door instance.
- Unlocked
The Door is in an Unlocked (Permanent Access) state. Alarms related to door timing operations such as open too long or forced are masked in this mode.
- Accessed
The Door is in an Accessed state (momentary/temporary access). Alarms related to timing operations such as "door forced" are masked in this mode.
- Blocked
The Door is in a Blocked state (Door is locked, and AccessDoor requests are ignored, i.e., it is not possible for door to go to Accessed state).
- LockedDown
The Door is in a LockedDown state (Door is locked) until released using the LockDownReleaseDoor command. AccessDoor, LockDoor, UnlockDoor, BlockDoor and LockOpenDoor requests are ignored, i.e., it is not possible for door to go to Accessed, Locked, Unlocked, Blocked or LockedOpen state.
- LockedOpen
The Door is in a LockedOpen state (Door is unlocked) until released using the LockOpenReleaseDoor command. AccessDoor, LockDoor, UnlockDoor, BlockDoor and LockDownDoor requests are ignored, i.e., it is not possible for door to go to Accessed, Locked, Unlocked, Blocked or LockedDown state.
- DoubleLocked
The Door is in a DoubleLocked state - for doors with multiple locks. If the door does not have any DoubleLock, this shall be treated as a normal Locked mode. When changing to an Unlocked mode from the DoubleLocked mode, the door may first go to Locked state before unlocking.

- Name: GetDoorState
- Access Class: READ_SYSTEM_SENSITIVE

- Name: tdc:AccessDoor
- Access Class: ACTUATE

- Name: tdc:LockDoor
- Access Class: ACTUATE

- Name: tdc:UnlockDoor
- Access Class: ACTUATE

- Name: tdc:BlockDoor
- Access Class: ACTUATE

- Name: tdc:LockDownDoor
- Access Class: ACTUATE

- Name: tdc:LockDownReleaseDoor
- Access Class: ACTUATE

- Name: tdc:LockOpenDoor
- Access Class: ACTUATE

- Name: tdc:LockOpenReleaseDoor
- Access Class: ACTUATE

- Name: tdc:DoubleLockDoor
- Access Class: ACTUATE

- Name: axtdc:ReleaseDoor
- Access Class: ACTUATE

- token
A service-unique identifier of the Door.
- Name
A user readable name. It shall be up to 64 characters.
- AccessTime
The normal open time for a door. Starts when door goes to Accessed state.
- OpenTooLongTime
Normal open too long time for a door. Starts when door is opened.
- PreAlarmTime
Time before OpenTooLong time expires and a warning event is sent.
- ExtendedAccessTime
The extended open time for a door.
- ExtendedOpenTooLongTime
Extended open too long time for a door.
- HeartbeatInterval
The time between heartbeat event updates. A time of 0 means no heartbeat events.
- PriorityConfiguration
Token of PriorityConfiguration to use.
- DefaultPriority
Default priority to use if no priority is specified in a door control command. If empty, the DefaultPriority specified in the PriorityConfiguration is used.

- Description
A user readable description. It shall be up to 1024 characters.

- Name: SetDoor
- Access Class: WRITE_SYSTEM

- Name: GetDoorList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetDoor
- Access Class: READ_SYSTEM_SENSITIVE

- Name: RemoveDoor
- Access Class: WRITE_SYSTEM

- Emergency=Release
- Override=Release
- Logic=Release
- Schedule=Release
- Normal=Release
- Default=Lock

- NoAction
No action for the door.
- Release
Release the action on the current priority.
- LockDownRelease
Release state LockDown.
- LockOpenRelease
Release state LockOpen.
- Lock
Lock door.
- Unlock
Unlock door.
- Access
Unlock for the specified time and then return to previous state (typically Lock, DoubleLock or Release).
- Block
Block the door (Access not allowed in this mode).
- LockDown
Lock the door until LockDownRelease.
- LockOpen
Unlock the door until LockOpenRelease.
- DoubleLock
Double lock door.

- token
A service-unique identifier of the PriorityConfiguration.
- Name
Name of PriorityConfiguration.
- DefaultPriority
Suggested default priority.
- DoorPriorityAction
List of PriorityLevel items and their initial DoorAction, with highest priorities first.

- Name: GetDoorPriorityState
- Access Class: READ_SYSTEM_SENSITIVE

- Name: SetPriorityConfiguration
- Access Class: WRITE_SYSTEM

- Name: GetPriorityConfigurationList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetPriorityConfiguration
- Access Class: READ_SYSTEM_SENSITIVE

- Name: RemovePriorityConfiguration
- Access Class: WRITE_SYSTEM

- token
DoorController Id to use for set, remove and usage.
- DeviceUUID
What device the DoorController is on.
- Configuration
Configuration for the Door.

- DoorScheduleConfiguration
Token of a DoorScheduleConfiguration.

- Name: GetDoorConfigurationList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetDoorConfiguration
- Access Class: READ_SYSTEM_SENSITIVE

- Name: SetDoorConfiguration
- Access Class: WRITE_SYSTEM

- Name: RemoveDoorConfiguration
- Access Class: WRITE_SYSTEM

- Name: GetDoorConfigurationInfo
- Access Class: READ_SYSTEM

- ScheduleToken
Schedules defining when state is active.
- EnterAction
The action to run when entering the state.

- ScheduledState
Scheduled states for the door on PriorityLevel.

- PriorityLevel
The priority level

- token
A service-unique identifier of the DoorScheduleConfiguration.
- DoorSchedule
List of DoorSchedule items.

- Name
Name of the Door.
- Description
Description of the Door.

- Name: SetDoorScheduleConfiguration
- Access Class: WRITE_SYSTEM

- Name: GetDoorScheduleConfigurationList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetDoorScheduleConfiguration
- Access Class: READ_SYSTEM_SENSITIVE

- Name: RemoveDoorScheduleConfiguration
- Access Class: WRITE_SYSTEM

- Name: AccessDoorWithoutUnlock
- Access Class: ACTUATE

| Name | Valid values | Default Value | Description |
| --- | --- | --- | --- |
| Lock.Type | NoneStandardRelayRS485HDRemoteIOTCPIP | None | The type of lock.Use RS485HD for Aperio locks, see section Aperio doors.Use RemoteIO for locks/doors connected to I/Os on a remote device added to the door controller, see section Elevator access control.Use TCPIP for Smart Intego locks, see section Smart Intego doors.Lock type None is a virtual lock that can be used for testing. None works as other locks but without physically locking and unlocking a door. |
| Lock.LockWhenDoorOpens | truefalse | false | If the lock should be locked when the door is opened (true) or if it should be unlocked (false). |
| Lock.ValueWhenLocked | GndFloat12V | Gnd | Applies to the Standard lock type. Output value to use when door is in the locked state. |
| Lock.ValueWhenUnlocked | GndFloat12V | 12V | Applies to the Standard lock type. Output value to use when door is in the unlocked state. |
| Lock.RelayStateWhenLocked | OpenClosed | Open | Applies to the Relay lock type. The state of the relay when the lock is locked. |
| Lock.BoltOutTime | ms | 700 | The maximum time allowed for lock to be opened. The actual time used may be shortened if using lock monitor. |
| Lock.BoltInTime | ms | 700 | The maximum time allowed for lock to be closed. The actual time used may be shortened if using lock monitor. |
| Lock.LockMonitor.ValueWhenLocked | NoneInput OpenInput 12VInput Ground | None | The value of the lock monitor, if existing, when the lock is locked. |
| Lock.LockMonitor.ValueWhenUnlocked | NoneInput OpenInput 12VInput Ground | None | The value of the lock monitor, if existing, when the lock is unlocked. |
| Lock.Hardware.Address | String |  | The lock’s hardware address. Aperio doors: A six-digit hexadecimal number. Smart Intego doors: A hexadecimal number, for example 0x200.RemoteIO: The remote I/Os id in the form remote/<token>/<id>.Use the id returned by axissd:GetServiceProviderList. |
| Lock.Hardware.Id | string |  | Applies to Smart Intego locks. The "phi" string of a Smart Intego lock device. See section Smart Intego doors. |
| Lock.Hub.Hardware.Address | Hexadecimal number |  | Applies to Smart Intego locks. The gateway’s device address, for example: 0x100. See section Smart Intego doors. |
| Lock.Protocol | AADP SmartIntego |  | The protocol to use to communicate with locks.Use AADP for Aperio locks.Use SmartIntego for Smart Intego locks. |
| Lock.TCPIP.Address | Dotted-decimal number |  | Address for TCPIP lock/gatway in dotted-decimal format, for example 192.168.123.132. |
| Lock.TCPIP.Port | Decimal number |  | Port number of TCPIP reader/gateway in decimal format. Use 2010 for Smart Intego lock. |
| DoubleLock.Type | NoneStandardRelay | None | Applicable when using double locks. The type of the secondary lock. |
| DoubleLock.ValueWhenLocked | GndFloat12V | Gnd | Applies to a Standard secondary lock. Output value to use when the door is in the locked state. |
| DoubleLock.ValueWhenUnlocked | GndFloat12V | 12V | Applies to a Standard secondary lock. Output value to use when the door is in the unlocked state. |
| DoubleLock.RelayStateWhenLocked | OpenClosed | Open | Applies to a Relay secondary lock. The state of the relay when the lock is locked. |
| DoubleLock.BoltOutTime | ms | 700 | The maximum time allowed for the secondary lock to be opened. The actual time used may be shortened if using lock monitor. |
| DoubleLock.BoltInTime | ms | 700 | The maximum time allowed for the secondary lock to be closed. The actual time used may be shortened if using lock monitor. |
| DoubleLock.LockMonitor.ValueWhenLocked | NoneInput OpenInput 12VInput Ground | None | The value of the lock monitor, if existing, when the door is locked. |
| DoubleLock.LockMonitor.ValueWhenUnlocked | NoneInput OpenInput 12VInput Ground | None | The value of the lock monitor, if existing, when the door is unlocked. |
| Door.Type | ElevatorFloorRegular | Regular | The type of door. Use ElevatorFloor for doors connected to I/Os on a remote device added to the door controller. See section Elevator access control. |
| DoorMonitor.Hardware.Address | Hexadecimal number |  | Applies to Aperio doors. The door monitor’s hardware address. A six-digit hexadecimal number. |
| DoorMonitor.Protocol | NoneAADPSmartIntego | None | Protocol to use for locks. Use AADP for Aperio door monitors. Use SmartIntego for Smart Intego locks. |
| DoorMonitor.Type | NoneStandardRS485HDTCPIP | None | The type of door monitor. Use RS485HD for Aperio doors, see section Aperio doors. Use TCPIP for Smart Intego locks, see section Smart Intego locks. |
| DoorMonitor.ValueWhenOpen | NoneInput OpenInput GroundSupervised OpenSupervised Ground | None | The value of the door monitor, if existing, when the door is open.If using supervised inputs, select Supervised Open or Supervised Ground. |
| DoorMonitor.ValueWhenClosed | NoneInput OpenInput GroundSupervised OpenSupervised Ground | None | The value of the door monitor, if existing, when the door is closed.If using supervised inputs, select Supervised Open or Supervised Ground. |
| DoorMonitor.SupervisedCut | mV |  | Applicable if IoMode in IoAssignment is set to supervised, see section Assign I/O:s to services. Target voltage (in millivolts) for the door monitor cut (open circuit) state when using supervised inputs. End of line resistors must be used. |
| DoorMonitor.SupervisedShort | mV |  | Applicable if IoMode in IoAssignment is set to supervised, see section Assign I/O:s to services. Target voltage (in millivolts) for the door monitor short circuit state when using supervised inputs. End of line resistors must be used. |
| DoorMonitor.SupervisedHigh | mV |  | Applicable if IoMode in IoAssignment is set to supervised, see section Assign I/O:s to services. Target voltage (in millivolts) for the door monitor high state when using supervised inputs. End of line resistors must be used. |
| DoorMonitor.SupervisedLow | mV |  | Applicable if IoMode in IoAssignment is set to supervised, see section Assign I/O:s to services. Target voltage (in millivolts) for the door monitor low state when using supervised inputs. End of line resistors must be used. |

| State | API function | Description |
| --- | --- | --- |
| Locked | tdc:LockDoor | Door is locked, and will stay in this state until told otherwise. |
| Unlocked | tdc:UnlockDoor | Door is unlocked, and will stay in this state until told otherwise. |
| Accessed | tdc:AccessDoor | Door unlocked for a period of time, specified by AccessTime in the door configuration or in the function call. The door will return to locked after the time has elapsed or door is closed. Call to tdc:UnlockDoor is possible to keep the door unlocked. |
| Blocked | tdc:BlockDoor | Door is locked and access via tdc:AccessDoor is prevented. |
| LockedDown | tdc:LockDownDoor | In the lock down state, the door is inaccessible until tdc:LockDownReleaseDoor is called. All other attempts to change the door state will generate an error to the caller |
| LockedOpen | tdc:LockOpenDoor | In the lock open state, the door is opened until tdc:LockOpenReleaseDoor is called. All other attempts to change the door state will generate an error to the caller. |
| DoubleLocked | tdc:DoubleLockDoor | The secondary lock is locked as well. Requesting tdc:UnlockDoor will move the door state to Locked. |

| Message name | Description |
| --- | --- |
| GetServiceCapabilitiesRequest | This message shall be empty. |
| GetServiceCapabilitiesResponse | This message contains:- Capabilities: The capability response message contains the requested Door Control service capabilities using a hierarchical XML capability structure.tdc:ServiceCapabilities Capabilities [1][1] (extendable) |

| Message name | Description |
| --- | --- |
| GetDoorInfoListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference: Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetDoorInfoListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- DoorInfo: List of DoorInfo items.xs:string NextStartReference [0][1]tdc:DoorInfo DoorInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetDoorInfoRequest | This message contains:- Token: Tokens of DoorInfo items to get.pt:ReferenceToken Token [1][unbounded] |
| GetDoorInfoResponse | This message contains:- DoorInfo: List of DoorInfo items.tdc:DoorInfo DoorInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| GetDoorStateRequest | This message contains:- Token: Token of the Door instance to get the state for.pt:ReferenceToken Token [1][1] (extendable) |
| GetDoorStateResponse | This message contains:- DoorState: The state of the door.tdc:DoorState DoorState [1][1] (extendable) |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |

| Command | Description |
| --- | --- |
| tdc:AccessDoor | Access the door. Use when a credential holder is granted access, for example by swiping a card in a card reader. |
| tdc:LockDoor | Lock the door. |
| tdc:UnlockDoor | Unlock the door. |
| tdc:BlockDoor | Block the door. |
| tdc:LockDownDoor | Lock the door and prevent all other commands until a LockDownReleaseDoor command is sent. |
| tdc:LockDownReleaseDoor | Release the door from the LockedDown state. |
| tdc:LockOpenDoor | Unlock the door and prevent all other commands until a LockOpenReleaseDoor command is sent. |
| tdc:LockOpenReleaseDoor | Release the door from the LockedOpen state. |
| tdc:DoubleLockDoor | Lock the door with a double lock. |
| axtdc:ReleaseDoor | Release the door from a priority level. |

| Message name | Description |
| --- | --- |
| AccessDoorRequest | This message contains:- Token: Token of the Door instance to control.- UseExtendedTime: Optional. Indicates that the configured extended time should be used.- AccessTime: Optional. Overrides AccessTime if specified.- OpenTooLongTime: Optional. Overrides OpenTooLongTime if specified (DOTL).- PreAlarmTime: Optional. Overrides PreAlarmTime if specified.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:boolean UseExtendedTime [0][1]xs:duration AccessTime [0][1]xs:duration OpenTooLongTime [0][1]xs:duration PreAlarmTime [0][1]tdc:AccessDoorExtension Extension [0][1] |
| AccessDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Accessed state and unlock the door. |

| Message name | Description |
| --- | --- |
| LockDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the lock command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:LockDoorExtension Extension [0][1] |
| LockDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Locked state. |

| Message name | Description |
| --- | --- |
| UnlockDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the unlock command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:UnlockDoorExtension Extension [0][1] |
| UnlockDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Unlocked state. |

| Message name | Description |
| --- | --- |
| BlockDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the block door command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:BlockDoorExtension Extension [0][1] |
| BlockDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Blocked state. |

| Message name | Description |
| --- | --- |
| LockDownDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:LockDoorExtension Extension [0][1] |
| LockDownDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to LockedDown state. |

| Message name | Description |
| --- | --- |
| LockDownReleaseDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc: LockDownReleaseDoorExtension Extension [0][1] |
| LockDownReleaseDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Locked state. |

| Message name | Description |
| --- | --- |
| LockOpenDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:LockOpenDoorExtension Extension [0][1] |
| LockOpenDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to LockOpenDoor state. |

| Message name | Description |
| --- | --- |
| LockOpenReleaseDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc:LockOpenReleaseDoorExtension Extension [0][1] |
| LockOpenReleaseDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to LockedOpen state. |

| Message name | Description |
| --- | --- |
| DoubleLockDoorRequest | This message contains:- Token: Token of the Door instance to control.- PriorityLevel: Priority level for the double lock command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]tdc: DoubleLockDoorExtension Extension [0][1] |
| DoubleLockDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to DoubleLocked state. |

| Message name | Description |
| --- | --- |
| ReleaseDoorRequest | This message contains:- Token: Token of the Door to control.- PriorityLevel: Priority level for the Release command, if empty use default priority.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:string PriorityLevel [0][1]axtdc:ReleaseDoorExtension Extension [0][1] |
| ReleaseDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |

| Message name | Description |
| --- | --- |
| SetDoorRequest | This message contains:- Door: The new version of the Door(s)axtdc:Door Door [1][unbounded] |
| SetDoorResponse | This message contains:- Token: Tokens of the added/updated Doorspt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs |  |
| env:Receiver ter:ActionNotSupported ter:NotSupported |  |

| Message name | Description |
| --- | --- |
| GetDoorListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference: Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetDoorListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- Door: List of Door items.xs:string NextStartReference [0][1]tdc:Door Door [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetDoorRequest | This message contains:- Token: Tokens of Door items to get.pt:ReferenceToken Token [1][unbounded] |
| GetDoorResponse | This message contains:- Door: List of Door items.tdc:Door Door [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| RemoveDoorRequest | This message contains:- Token: Token of the Door items to remove.pt:ReferenceToken Token [1][unbounded] |
| RemoveDoorResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Receiver ter:ActionNotSupported ter:NotSupported | Not allowed to remove the Door. |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |

| Message name | Description |
| --- | --- |
| GetDoorPriorityStateRequest | This message contains:- Token: Token of the Door to get the state for.pt:ReferenceToken Token [1][1](extendable) |
| GetDoorPriorityStateResponse | This message contains:- DoorPriorityAction: The Priority state of the door, with highest priorities first.axtdc:DoorPriorityAction DoorPriorityAction [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |

| Message name | Description |
| --- | --- |
| SetPriorityConfigurationRequest | This message contains:- PriorityConfiguration: List of PriorityConfiguration:s to set.axtdc:PriorityConfiguration PriorityConfiguration [1][unbounded] |
| SetPriorityConfigurationResponse | This message contains:- Token: Tokens of the added/updated PriorityConfiguration items.pt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Receiver ter:ActionNotSupported ter:NotSupported | Not allowed to modify the PriorityConfiguration. |
| env:Sender ter:InvalidArgs | The specified token is not found. |

| Message name | Description |
| --- | --- |
| GetPriorityConfigurationListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference: Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetPriorityConfigurationListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- PriorityConfiguration: List of PriorityConfiguration items.xs:string NextStartReference [0][1]axtdc:PriorityConfiguration PriorityConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetPriorityConfigurationRequest | This message contains:- Token: Tokens of PriorityConfiguration items to get.pt:ReferenceToken Token [1][unbounded] |
| GetPriorityConfigurationResponse | This message contains:- PriorityConfiguration: List of PriorityConfiguration items.axtdc:PriorityConfiguration PriorityConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| RemovePriorityConfigurationRequest | This message contains:- Token: Token of the PriorityConfiguration items to remove.pt:ReferenceToken Token [1][unbounded] |
| RemovePriorityConfigurationResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Receiver ter:ActionNotSupported ter:NotSupported | Not allowed to remove the PriorityConfiguration. |
| env:Sender ter:InvalidArgVal ter:NotFound | The specified token is not found. |

| Message name | Description |
| --- | --- |
| GetDoorConfigurationListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference: Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetDoorConfigurationListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- DoorConfiguration: List of DoorConfiguration items.xs:string NextStartReference [0][1]axtdc:DoorConfiguration DoorConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetDoorConfigurationRequest | This message contains:- Token: Tokens of DoorConfiguration items to get.pt:ReferenceToken Token [1][unbounded] |
| GetDoorConfigurationResponse | This message contains:- DoorConfiguration: List of DoorConfiguration items.axtdc:DoorConfiguration DoorConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| SetDoorConfigurationRequest | This message contains:- DoorConfiguration: The new version of the DoorConfiguration.axtdc:DoorConfiguration DoorConfiguration [1][unbounded] |
| SetDoorConfigurationResponse | This message contains:- Token: Tokens of the Door:s.pt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidDoorConfigurationFault |  |

| Message name | Description |
| --- | --- |
| RemoveDoorConfigurationRequest | This message contains:- Token: Token of the DoorConfiguration items to remove.pt:ReferenceToken Token [1][unbounded] |
| RemoveDoorConfigurationResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | DoorConfiguration not found. |

| Message name | Description |
| --- | --- |
| GetDoorConfigurationInfoRequest | This message contains:- Token: Token of the Door to get the ConfigurationInfo for.pt:ReferenceToken Token [1][1] |
| GetDoorConfigurationInfoResponse | This message contains:- ConfigurationInfo: Configuration information for the specified token.axconf:ConfigurationInfo ConfigurationInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | Specified Door not found. |

| Message name | Description |
| --- | --- |
| SetDoorScheduleConfigurationRequest | This message contains:- DoorScheduleConfiguration: The new version of the DoorScheduleConfiguration.axtdc:DoorScheduleConfiguration DoorScheduleConfiguration [1][unbounded] |
| SetDoorScheduleConfigurationResponse | This message contains:- Token: Tokens of the DoorScheduleConfiguration items.pt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidDoorScheduleFault |  |

| Message name | Description |
| --- | --- |
| GetDoorScheduleConfigurationListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference: Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetDoorScheduleConfigurationListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- DoorScheduleConfiguration: List of DoorScheduleConfiguration items.xs:string NextStartReference [0][1]axtdc:DoorScheduleConfiguration DoorScheduleConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetDoorScheduleConfigurationRequest | This message contains:- Token: Tokens of DoorConfiguration items to get.pt:ReferenceToken Token [1][unbounded] |
| GetDoorScheduleConfigurationResponse | This message contains:- DoorScheduleConfiguration: List of DoorScheduleConfiguration items.axtdc:DoorScheduleConfiguration DoorScheduleConfiguration [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| RemoveDoorScheduleConfigurationRequest | This message contains:- Token: Tokens of the added/updated DoorScheduleConfiguration items.pt:ReferenceToken Token [1][unbounded] |
| RemoveDoorScheduleConfigurationResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | DoorScheduleConfiguration not found. |

| Message name | Description |
| --- | --- |
| AccessDoorWithoutUnlockRequest | This message contains:- Token: Token of the Door instance to control.- UseExtendedTime: Optional. Indicates that the configured extended time should be used.- AccessTime: Optional. Overrides AccessTime if specified.- OpenTooLongTime: Optional. Overrides OpenTooLongTime if specified (DOTL).- PreAlarmTime: Optional. Overrides PreAlarmTime if specified.- Extension: Future extension.pt:ReferenceToken Token [1][1]xs:boolean UseExtendedTime [0][1]xs:duration AccessTime [0][1]xs:duration OpenTooLongTime [0][1]xs:duration PreAlarmTime [0][1]axtdc:AccessDoorWithoutUnlockExtension Extension [0][1] |
| AccessDoorWithoutUnlockResponse | This message is empty. |

| Fault codes | Description |
| --- | --- |
| env:Receiver ter:InvalidArgVal ter:NotFound | The specified token is not found. |
| env:Receiver ter:Action ter:Failure | Failed to go to Accessed state. |

