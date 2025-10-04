# Peripherals

**Source:** https://developer.axis.com/vapix/physical-access-control/peripherals/
**Last Updated:** Aug 28, 2025

---

# Peripherals

## Elevator access control​

### Configure elevator access control​

#### Floors and floor states​

#### Event and schedule synchronization​

#### How to use the examples​

#### Find remote devices​

#### Add a remote device​

#### Find remote I/Os​

#### Create a floor​

#### Create an IdPoint​

#### Create an access point​

#### Create an access profile​

#### Add a credential​

#### Update the access controller​

#### Assign I/Os​

## Aperio doors​

### Considerations​

### Configure an Aperio system​

#### How to use the examples​

#### Create an entrance IdPoint​

#### Create an entrance IdPoint configuration​

#### Create an exit IdPoint​

#### Create an exit IdPoint configuration​

#### Create a door​

#### Create a door configuration​

#### Create access points​

#### Update access controller​

#### Create access profiles​

#### Add a credential​

#### Assign I/Os​

## SmartIntego doors​

### Considerations​

#### SmartIntego whitelist limitations​

### Configure a SmartIntego system​

#### How to use the examples​

#### Create an entrance IdPoint​

#### Create an entrance IdPoint configuration​

#### Create a door​

#### Create a door configuration​

#### Create access points​

#### Update access controller​

#### Assign I/Os​

#### Enable whitelist doors​

## Remote readers, keypads and REX​

### Considerations​

### Indicating remote activities​

#### Activity-type 'REX'​

#### Activity-type 'Card', 'Params' and 'LPN'​

#### Activity-type 'Card' with card and 'PIN' in params​

#### Activity-type 'PIN' with PIN in params​

Peripherals are auxiliary devices that extend the access control system and allow it to be used in various applications. This chapter covers:

AXIS A9188 network I/O relay module is a network device that makes it possible to integrate elevator access control in the access control system. AXIS A9188, here referred to as I/O module, has I/O and relay connectors that allow the device to be connected to call buttons in an elevator car. Call buttons are the buttons used to choose the floor to go to. In addition to an I/O module, elevator access control requires a door controller and a card reader, keypad or other device for user identification. The door controller manages the system and allows individuals access to different floors.

The use of AXIS A9188 Network I/O Relay Module is not limited to elevator control. The I/O module can be used in many different applications, for example to control doors at a remote location.

The examples in this section demonstrate how to configure a basic elevator access control system with one door controller, one I/O module and one reader/keypad. To further simplify the example, only one of the I/O module’s I/O ports is used. The I/O port is connected to one button in the elevator car. To access the floor connected to that button, the elevator user must enter the correct PIN on the keypad.

In the access control system, the I/O module is considered a remote device that must be added to the door controller. It is possible to add up to two I/O modules to the same door controller. Adding a remote device establishes a connection between the remote device and the door controller. When the connection is established, the two devices’ events and schedules are synchronized at regular intervals.

When the I/O module has been added, the door controller can access and use the I/O module’s I/Os. These I/Os are referred to as remote I/Os and are used in the same way as the door controller’s own I/Os. In this release, the door controller can use the remote I/Os in their output and relay modes. The digital input mode is not supported.

The elevator access control configuration consists of access points, access profiles, credentials, IdPoints and floors. A floor is similar to a door but is connected to a remote I/O and has a limited set of states and supported commands. Summary of configuration steps:

Find remote I/O modules on the network

Add the remote I/O module to the door controller

Find the remote I/Os

Create a floor

Create an IdPoint for the reader

Create an access point

Create an access profile

Add a credential

Update the access controller

Assign I/Os

When the configuration is complete, a user gets access to the floor (remote I/O) by entering the correct PIN at the Id Point (the reader).

A floor is a similar to a door but has limited capabilities. Floors use the Door and DoorConfiguration data structures with Door.Type set to ElevatorFloor and Lock.Type set to RemoteIO. Floors support selected door control commands, for example tdc:AccessDoor, tdc:UnlockDoor and tdc:LockDoor. Use tdc:GetDoorInfo to retrieve supported floor capabilities. Note that floors do not support door priorities.

Supported floor states and possible transitions are illustrated in the figure.



Event synchronization starts automatically when the remote device is added. Events emitted by the remote device are synchronized with the door controller and displayed in the door controller’s event log. Synchronization runs periodically, there is no real-time event monitoring.

Schedule synchronization also runs periodically and starts automatically. The door controller’s schedules are synchronized with all connected remote devices.

The examples in the following sections are formatted to be used with cURL.

JSON: Copy the sample code to a file named sample_code.json and call

Replace /vapix/<service> with the relevant service , for example vapix/idpoint.

SOAP: Copy the sample code to a well-formatted SOAP file named sample_code.soap and call

The service for all SOAP requests is /vapix/services.

Use axissd:GetServiceProviderList to search for remote devices. The command searches for remote service providers (remote devices) on the local network and for devices that have been added to the door controller. Added devices do not have to be on the local network. For added devices, the command returns the service provider’s services.

Axis Discovery Service (axissd) is a polled API that should be called multiple times to ensure that all remote devices are found. The first call starts the discovery process. Subsequent calls should be issued before the timeout (field Timeout) expires.

The Type field specifies the type of remote service provider to search for. To search for a remote I/O module such as AXIS A9188, set Type to RIO (’remote I/O’), Name to IO and Value to Eth0.

Request to service: /vapix/axissd

Request

The response is a list of remote service providers matching the search criteria. The list shows each service providers IP and MAC addresses, its status and an Id used to identify the remote device. Here, status is NotAdded and Id is empty because the devices are not yet added.

Response

Response

Use axrio:SetDevice to add the remote I/O module to the door controller. If the device is on the local network, use axissd:GetServiceProviderList to find the IP and MAC addresses. It is also possible to add devices that are not on the local network. Fields Username and Password specify a VAPIX® user on the remote I/O module. Field Name is an optional nicename. If, as in this example, no token is specified, a token is generated automatically.

Request to service: /vapix/axrio

Request

Response

Response

When the I/O module has been added, use axissd:GetServiceProviderList to find the remote I/Os. To limit the search to the added I/O module, enter the remote device’s address in the Address attribute field. Here, the address is the token returned by axrio:SetDevice. It is also possible to use the IP address or MAC address.

The command returns information about the added service provider (the remote device) including a list of its services (the remote I/Os). Because the device is added, the Id field is now the device’s token. Each remote I/O has its own Id.

Request to service: /vapix/axissd

Request

Response

Response

Use axtdc:SetDoor and axtdc:SetDoorConfiguration to create a floor and a configuration for the floor. The configuration contains hardware-related settings.

In this example, the floor is connected to the remote I/O "Output 1" with id "remote/Axisaccc8e0c0ca1: 1454410450.819540000/8". The token floor_token connects the configuration to the floor.

Request to service: /vapix/doorcontrol

Request

Response

Response

Request to service: /vapix/doorcontrol

Request

Response

Response

Use axtid:SetIdPoint and axtid:SetIdPointConfiguation to create an IdPoint and an IdPoint configuration for the reader. This example uses an OSDP reader. Wiegand readers are also supported.

Request to service: /vapix/idpoint

Request

Response

Response

Request to service: /vapix/idpoint

Request

Response

Response

Use pacsaxis:SetAccessPoint to create an access point. The access point connects the IdPoint and the floor.

Request to service: /vapix/pacs

Request

Use pacsaxis:SetAccessProfile to create an access profile. The access profile PIN Access Profile is connected to the IdPoint and uses the default PIN only authentication profile and the default schedule "Standard Always".

Request to service: /vapix/pacs

Request

Use pacsaxis:SetCredential to add a credential to the access profile pin_access_profile.

Request to service: /vapix/pacs

Request

Use pacsaxis:SetAccessController to add the access point to an existing access controller.

Request to service: /vapix/pacs

Request

As the final step, use axisio:SetIoAssignment to assign I/O:s to the Door Control and IdPoint Services.

The OSDP reader (the IdPoint) is connected to the door controller’s reader data connector and communicates using RS485 half duplex. Assign I/O Ser0hd to the reader IdPoint.

The remote I/O is connected to the door controller over the Ethernet network. Assign I/O Eth0 to the floor as a remote lock.

Request to service: /vapix/pin

Request

AperioTM is a wireless technology that enables wireless door locks, readers and door monitors to be connected to and to communicate with an electronic access control system. To use the Aperio technology, the following hardware is required:

The Aperio hub controls the wireless communication with the doors. The hub is connected to the door controller’s serial port and communicates with the door controller using the AADP protocol over RS485. Before using the access control APIs to configure an Aperio door, the door must be paired with the Aperio hub.

For instructions, refer to the documentation provided with the hub. An Aperio device is identified by its hardware ID. The hardware ID is a six-digit hexadecimal number, for example FFBA01. The hardware ID is printed on the product label and is also available from the Aperio configuration software PAP. The ID must be entered manually when adding the device to the door controller. Autodiscovery is not supported.

For detailed information about required hardware, see AXIS A1001 & AXIS Entry Manager User Manual.

To save battery power, Aperio locks and readers are asleep when not in active use. The lock/reader wakes up on physical interaction, for example when someone uses an access card or PIN, but it also wakes up at regular intervals. The scheduled wake-up time is different for different Aperio models and can vary between a few seconds and an hour.

When sending a door action command such as "Unlock door" (tdc:Unlock) to an Aperio lock, the command is sent to the Aperio hub and is forwarded to the lock when the lock wakes up. That is, if the lock is asleep, the command is not executed until the lock wakes up.

This behavior should be taken into consideration when using Aperio locks with long sleeping times as it might pose a security risk. Suppose that the unlock command is sent but the lock is asleep and no one accesses the door. The door remains locked until someone tries to access or until the lock wakes up at its scheduled wake-up time, whichever happens first. Before the scheduled wake-up time, unauthorized individuals are able to unlock the door by just trying to access, for example, by pressing a button on the reader.

When deploying a new wireless lock device, or replacing an existing one, it is mandatory to redo all steps related to hardware configurations, including IdPoint configuration, door configuration and assign IOs, whether the configuration parameters are changed or not.

For additional considerations and limitations, see AXIS A1001 & AXIS Entry Manager User Manual.

This section shows how to configure the door controller for a system with two Aperio devices:

The system also includes an Aperio hub connected to the door controller’s reader data connector. Both Aperio devices are paired with the hub.

The examples in the following sections are formatted to be used with cURL.

JSON: Copy the sample code to a file named sample_code.json and call

Replace /vapix/<service> with the relevant service , for example vapix/idpoint.

SOAP: Copy the sample code to a well-formatted SOAP file named sample_code.soap and call

The service for all SOAP requests is /vapix/services.

The card reader and keypad in device A is the entrance IdPoint. To simplify these examples, the user must only submit a PIN code to enter. No card is needed. Modify as required for more complex systems.

Set up the PIN configuration in the Aperio configuration software PAP before configuring the door controller. The maximum and minimum PIN lengths, MinPINSize and MaxPINSize, in the IdPoint must match the values in PAP. When using a fixed PIN length, the door controller ignores EndOfPIN. Timeout is also ignored.

Use axtid:SetIdPoint to create the IdPoint.

Request to service: /vapix/idpoint

Request

Response

Response

Use axtid:SetIdPointConfigurationto create a configuration for the entrance IdPoint. The configuration contains hardware-related settings:

The token aperio_idpoint_reader_entrance_token connects the configuration to the IdPoint.

Request to service: /vapix/idpoint

Request

Response

Response

The REX functionality in device A is handle-state detection. To exit, the user presses the door handle and opens the door. The door controller does not need to unlock the door.

Use axtid:SetIdPointwith action AccessDoorWithoutUnlock to create the exit IdPoint. The action AccessDoorWithoutUnlock prevents DoorForcedOpenAlarm alarms each time a user exits through the door. Notification events tns1:AccessControl/AccessGranted/Anonymous are still sent.

Request to service: /vapix/idpoint

Request

Use axtid:SetIdPointConfiguration to create a configuration for the exit IdPoint. The entrance and exit IdPoints reside in the same physical device and have the same hardware-related settings.

The token aperio_idpoint_rex_exit_tokenconnects the configuration to the IdPoint.

Request to service: /vapix/idpoint

Request

Use axtdc:SetDoor to create a Door. The Door represents the lock in device A and the door monitor in device B.

Request to service: /vapix/doorcontrol

Request

Response

Response

Use axtdc:SetDoorConfiguration to create a configuration for the Door. The configuration contains hardware related settings for the lock (device A) and the door monitor (device B).

The token aperio_door_token connects the configuration to the Door.

Request to service: /vapix/doorcontrol

Request

Response

Response

Use pacsaxis:SetAccessPoint to create two access points:

Request to service: /vapix/pacs

Request

Use pacsaxis:SetAccessController to add the two access points to an existing access controller.

Request to service: /vapix/pacs

Request

Use pacsaxis:SetAccessProfile to add two access profiles:

Request to service: /vapix/pacs

Request

Use pacsaxis:SetCredential to add a credential to the access profile pin_access_profile.

Request to service: /vapix/pacs

Request

As the final step, use axisio:SetIoAssignment to assign I/O:s to the Door Control and IdPoint Services.

The Aperio hub is connected to the door controller’s reader data connector and communicates using RS485 half duplex. Assign I/O Ser3hd to four I/O users:

Request to service: /vapix/pin

Request

SmartIntegoTM is a wireless technology that enables wireless door locks, readers and door monitors to be connected to and communicate with an electronic access control system. To use the SmartIntego technology, the following hardware is required:

The SmartIntego Gateway controls the wireless communication with the doors. It is connected to network and communicates with the door controller using the TCPIP. Before connecting to the access control using APIs, the SmartIntego doors and Gateways has to be configured and paired using a separate software.

For instructions, refer to the documentation provided by SmartIntego, however it is important to store all files and passwords in a safe place; if lost it is impossible to re-configure any SmartIntego device in a project. Once a project has been configured, a configurations-file (.csv) can be exported from the software tool which contains all information needed to setup the door controller. A SmartIntego device is identified by its physical hardware ID (PHI) string. The PHI string is located at the lock itself and may look like this: "0EX56H". The hardware ID is also available in the CSV-file. Auto-discovery is not supported.

For detailed information about required hardware, see AXIS A1001 & AXIS Entry Manager User Manual.

For full cylinders, such as SmartIntego devices with two card readers, the csv-file only contains the information for one side of the device. The other side uses the identical information except that the device address is increased by 1. For example in the csv file you read a line like this:

LN_I_MP;0x00000300;0x0027;172.25.15.123;0001FBE1;nickname_full;9202783;00EX66R;5.0.13;SW=31.12 TM=18.3;SI.Z4.30-30.MI.FD

This means that the second device on the other side of the door has address 0x00000301.

Due to limitations, the maximum access time and extended access time can’t be higher than 25 seconds. If a higher value is used, it will be changed to 25.

SmartIntego pin devices are not compatible with Axis products. Only cards are supported as a mutual method of identification.

When deploying a new wireless lock device, or replacing an existing one, it is mandatory to redo all steps related to hardware configurations, including IdPoint configuration, door configuration and assign IOs, whether the configuration parameters are changed or not.

For additional considerations and limitations, see AXIS A1001 & AXIS Entry Manager User Manual.

A system that uses SmartIntego whitelist will lose certain features in certain situations:

For more information see: Enable whitelist doors.

This section shows how to configure the door controller for a system with three SmartIntego devices:

The system also includes a SmartIntego Gateway connected to the same LAN as the controller. All devices have been paired to the Gatway using the SmartIntego software and the csv-file has been saved and looks as following:

node type;device address;wn address;connection details;chipID;nick name;phi;phi string;fw lock;fw node;equipment
GN_ER;0x00000100;0x0021;172.25.15.123;0002168B;;;;;;
LN_I_SH;0x00000200;0x0026;172.25.15.123;000167E5;SmartHandle;8703835;00E4DR7;3.8.08;SW=31.3 TM=18.2;SI.SHAS08A721CC1A
LN_I_MP;0x00000300;0x0027;172.25.15.123;0001FBE1;nickname_full;9202783;00EX66R;5.0.13;SW=31.12 TM=18.3;SI.Z4.30-30.MI.FD
LN_I_MP;0x00000400;0x0028;172.25.15.123;000168F8;nickname_half;8526949;00DSC5T;3.4.17;SW=31.3 TM=18.2;SI.Z4.SO.A40.MI

The examples in the following sections are formatted to be used with cURL.

JSON: Copy the sample code to a file named sample_code.json and call

Replace /vapix/<service>with the relevant service, for example vapix/idpoint.

SOAP: Copy the sample code to a well-formatted SOAP file named sample_code.soap and call

The service for all SOAP requests is /vapix/services

The card reader at the entrance is IdPoint. Each card reader need their own setup, i.e. if you use a full cylinder with two card readers, two IdPoints need to be created. Modify as required for more complex systems.

Since PIN is not currently supported for SmartIntego any PIN configuration like MinPINSize and MaxPINSize, is ignored by the door controller.

Use axtid:SetIdPoint to create the IdPoint.

Request to service: /vapix/idpoint

Request

Response

Response

Useaxtid:SetIdPointConfiguration to create a configuration for the entrance IdPoint. The configuration contains hardware-related settings:

The token Si_idpoint_entranceconnects the configuration to the IdPoint.

Request to service: /vapix/idpoint

Request

Response

Response

Use axtdc:SetDoor to create a Door.

One Door per SmartIntego device is needed.

Note that OpenTooLongTime and ExtendedOpenTooLongTime time is configured in the SmartIntego Software, meaning the value is ignored here.

For AccessTime and ExtendedAccessTime, the maximum value is 25 seconds. If a larger value is used, 25 will still be used.

Request to service: /vapix/doorcontrol

Request

Response

Response

Useaxtdc:SetDoorConfiguration to create a configuration for the Door. The configuration contains hardware related settings for the lock (device A) with a door monitor.

The token SmartIntego_door_token connects the configuration to the Door.

Request to service: /vapix/doorcontrol

Request

Response

Response

Use pacsaxis:SetAccessPoint to create accesspoints: For full cylinder doors two access points are needed, one for each IdPoint together with the door, where one configuration has the attribute of Direction: In and the other has Direction: Out.

Request to service: /vapix/pacs

Request

Use pacsaxis:SetAccessController to add the access point to an existing access controller. The call also overwrites pre-existing configurations, such as axisio:SetIoAssignment found in Assign I/Os.

Request to service: /vapix/pacs

Request

As the final step, use axisio:SetIoAssignment to assign the Door Control and IdPoint Services.

The Gateway is connected to the door controller through LAN and communicates using TCPIP. Assign I/O to three I/O users:

Note that this API will overwrite all existing configuration on a certain I/O when the setIoAssigment is used. If you want to keep your earlier configuration you will need append this to the API call.

Request to service: /vapix/pin

Request

Whitelist is a feature that allows SmartIntego Doors to grant access to a credential as long as it belongs to a Whitelist of the door. If Whitelist is set up on the door controller, then the card number of the selected IdData is downloaded to the Whitelist of the door, thus allowing access at all times.

Whitelist is enabled by adding an attribute in the AccessProfile and following the same instructions as provided in Set up the initial system. This attribute must have a Name set to AxisWhiteList. The value of the attribute is optional and identifies which IdData of the credential that should be downloaded to the WhiteList of the SmartIntego door. If no value is provided then it will default to Card internally in the door controller. The IdPoint Configuration IdPoint.Whitelist.IdDataName identifies which IdData that is allowed to download to the door and defaults to Card.

In order to add a Whitelist to the SmartIntego Doors, the client must first use the settings from the previous examples.

Removing related WhiteList Access Profile is a must prior to removing the IdData used by WhiteList.

Create a credential

It is only possible to set a new Value for AxisWhitelist in the AccessProfile if:

Json example

Soap example

Create an Access Profile

Json example

Soap example

Create an IdPoint configuration

Request

Request

Response

Response

For more information see Configuration structure.

Axis Physical Access Control products support IP based remote activity input devices such as IP card readers, License Plate Recognition cameras and Wireless sensors, also described in Sending activities from a remote device. This chapter will elaborate on how the activity-types Card, REX and PIN can be used.

A hardware configuration needs to be in place due to the IndicateRemoteActivities-request body requiring a valid IdPoint-token to be able to send the IdPoint events.

For detailed information about configuring the hardware, see AXIS A1001 and AXIS Entry Manager User Manual.

The second step is the access decision that will be triggered by the tns1:IdPoint/tnsaxis:Request event.

To get a positive access decision the following criteria need to be met:

The Name/Value pairs of the params in the API request need to match the Name/Value pairs of the IdData in a credential and have the same ordering. This credential needs to be associated with an AccessProfile, AccessPoint and IdPoint, that matches the ID and AuthenticationProfile as seen in Setting the credential.

Each Name in the Params of the IndicateRemoteActivities request must match the IdDataName in the IdFactor list of an AuthenticationProfile that is associated with either the Credential, AccessPoint or AccessProfile mentioned above. For additional information, see Setting the access point, Setting the access profile and Retrieve default configuration in the Access Control Service Guide.

If a Card and a PIN is expected from physical access control system all the following parameters are granted access:

But this can be denied access:

How to use the examples

The examples in the following sections are formatted to be used with cURL.

JSON: Copy the sample code to a file named sample_code.json and call:

Use /vapix/<idpoint> as the service.

SOAP: Copy the sample code to a SOAP file named sample_code.soap and call:

The service for all SOAP requests is /vapix/services.

This example requires a configuration that will grant access to a REX button press, e.g. the pre-configured AuthenticationProfile token REXOnly need to be used. The API call will trigger the same events and access decision as if the button was actually pressed.

Request

Request

Response

Response

This request requires a configuration that has "LPN" in the IdDataName of the IdFactor and AuthenticationProfile that is associated with the Credential, AccessPoint or AccessProfile involved.

Request

Request

Response

Response

This example is for a system that is configured to require both card and PIN, e.g. the pre-configured AuthenticationProfile-token CardPlusPin is used. In this example, both the Card and PIN values will be included in the event so the decision can be made as soon as the event is received by the decision-taker.

Request

Request

Response

Response

This example is for a system that is configured to require PIN only, e.g. the pre-configured AuthenticationProfile-token PINOnly is used.

Request

Request

Response

Response

```
curl --anyauth -H "Content-Type: application/json" --data @sample_code.json http://<user>:<password>@<ip>/vapix/<service>
```

```
curl --anyauth --data @sample_code.soap http://<user>:<password>@<ip>/vapix/services
```

```
{    "axissd:GetServiceProviderList": {        "Timeout": 10,        "Type": "RIO",        "Attributes": [            {                "Name": "IO",                "type": "string",                "Value": "Eth0"            }        ]    }}
```

```
<axissd:GetServiceProviderList>    <axissd:Timeout>10</axissd:Timeout>    <axissd:Attributes type="string">        <axissd:Name>IO</axissd:Name>        <axissd:Value>Eth0</axissd:Value>    </axissd:Attributes>    <axissd:Type>RIO</axissd:Type></axissd:GetServiceProviderList>
```

```
{    "ServiceProviderList": [        {            "Id": "",            "NiceName": "",            "Status": "NotAdded",            "Attributes": [                {                    "type": "string",                    "Name": "IP",                    "Value": "172.25.11.13"                },                {                    "type": "string",                    "Name": "MAC",                    "Value": "00:40:8c:18:64:07"                }            ],            "ServiceList": []        },        {            "Id": "",            "NiceName": "",            "Status": "NotAdded",            "Attributes": [                {                    "type": "string",                    "Name": "IP",                    "Value": "172.25.11.74"                },                {                    "type": "string",                    "Name": "MAC",                    "Value": "00:40:8c:18:64:0c"                }            ],            "ServiceList": []        }    ]}
```

```
<axissd:ServiceProviderList>    <axissd:Id></axissd:Id>    <axissd:NiceName></axissd:NiceName>    <axissd:Status>NotAdded</axissd:Status>    <axissd:Attributes type="string">        <axissd:Name>IP</axissd:Name>        <axissd:Value>172.25.11.13</axissd:Value>    </axissd:Attributes>    <axissd:Attributes type="string">        <axissd:Name>MAC</axissd:Name>        <axissd:Value>00:40:8c:18:64:07</axissd:Value>    </axissd:Attributes>    <axissd:ServiceList></axissd:ServiceList></axissd:ServiceProviderList><axissd:ServiceProviderList>    <axissd:Id></axissd:Id>    <axissd:NiceName></axissd:NiceName>    <axissd:Status>NotAdded</axissd:Status>    <axissd:Attributes type="string">        <axissd:Name>IP</axissd:Name>        <axissd:Value>172.25.11.74</axissd:Value>    </axissd:Attributes>    <axissd:Attributes type="string">        <axissd:Name>MAC</axissd:Name>        <axissd:Value>00:40:8c:18:64:0c</axissd:Value>    </axissd:Attributes>    <axissd:ServiceList></axissd:ServiceList></axissd:ServiceProviderList>
```

```
{    "axrio:SetDevice": {        "Device": [            {                "Name": "AXIS A9188",                "Username": "user",                "Password": "pass",                "MACAddress": "00:40:8c:18:64:07",                "IPAddress": "172.25.11.13"            }        ]    }}
```

```
<axrio:SetDevice>    <axrio:Device>        <axrio:Name>AXIS A9188</axrio:Name>        <axrio:Username>user</axrio:Username>        <axrio:Password>pass</axrio:Password>        <axrio:MACAddress>00:40:8c:18:64:07</axrio:MACAddress>        <axrio:IPAddress>172.25.11.13</axrio:IPAddress>    </axrio:Device></axrio:SetDevice>
```

```
{    "Token": "Axis-accc8e0c0ca1:1454410450.819540000"}
```

```
<axrio:Token>Axis-accc8e0c0ca1:1454410450.819540000</axrio:Token>
```

```

```

```
{    "axissd:GetServiceProviderList": {        "Timeout": 10,        "Type": "RIO",        "Attributes": [            {                "Name": "IO",                "type": "string",                "Value": "Eth0"            },            {                "Name": "Address",                "type": "string",                "Value": "Axis-accc8e0c0ca1:1454410450.819540000"            }        ]    }}
```

```
<axissd:GetServiceProviderList>    <axissd:Timeout>10</axissd:Timeout>    <axissd:Attributes type="string">        <axissd:Name>IO</axissd:Name>        <axissd:Value>Eth0</axissd:Value>    </axissd:Attributes>    <axissd:Attributes type="string">        <axissd:Name>Address</axissd:Name>        <axissd:Value>Axis-accc8e0c0ca1:1454410450.819540000</axissd:Value>    </axissd:Attributes>    <axissd:Type>RIO</axissd:Type></axissd:GetServiceProviderList>
```

```
{    "ServiceProviderList": [        {            "Id": "Axis-accc8e0c0ca1:1454410450.819540000",            "NiceName": "AXIS A9188",            "Status": "OK",            "Attributes": [                {                    "type": "string",                    "Name": "IP",                    "Value": "172.25.11.13"                },                {                    "type": "string",                    "Name": "MAC",                    "Value": "00:40:8c:18:64:07"                }            ],            "ServiceList": [                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/8",                    "NiceName": "Output 1",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/9",                    "NiceName": "Output 2",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/10",                    "NiceName": "Output 3",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/11",                    "NiceName": "Output 4",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/12",                    "NiceName": "Output 5",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/13",                    "NiceName": "Output 6",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/14",                    "NiceName": "Output 7",                    "Attributes": []                },                {                    "Id": "remote/Axis-accc8e0c0ca1:1454410450.819540000/15",                    "NiceName": "Output 8",                    "Attributes": []                }            ]        }    ]}
```

```
<axissd:ServiceProviderList>    <axissd:Id>Axis-accc8e0c0ca1:1454410450.819540000</axissd:Id>    <axissd:NiceName>AXIS A9188</axissd:NiceName>    <axissd:Status>OK</axissd:Status>    <axissd:Attributes type="string">        <axissd:Name>IP</axissd:Name>        <axissd:Value>172.25.11.13</axissd:Value>    </axissd:Attributes>    <axissd:Attributes type="string">        <axissd:Name>MAC</axissd:Name>        <axissd:Value>00:40:8c:18:64:07</axissd:Value>    </axissd:Attributes>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/8</axissd:Id>        <axissd:NiceName>Output 1</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/9</axissd:Id>        <axissd:NiceName>Output 2</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/10</axissd:Id>        <axissd:NiceName>Output 3</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/11</axissd:Id>        <axissd:NiceName>Output 4</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/12</axissd:Id>        <axissd:NiceName>Output 5</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/13</axissd:Id>        <axissd:NiceName>Output 6</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/14</axissd:Id>        <axissd:NiceName>Output 7</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList>    <axissd:ServiceList>        <axissd:Id>remote/Axis-accc8e0c0ca1:1454410450.819540000/15</axissd:Id>        <axissd:NiceName>Output 8</axissd:NiceName>        <axissd:Attributes />    </axissd:ServiceList></axissd:ServiceProviderList>
```

```
{    "axtdc:SetDoor": {        "Door": [            {                "token": "floor-token",                "Name": "Output 1",                "AccessTime": "PT7S",                "OpenTooLongTime": "PT10S",                "PreAlarmTime": "PT7S",                "ExtendedAccessTime": "PT30S",                "ExtendedOpenTooLongTime": "PT40S",                "HeartbeatInterval": "PT600S",                "DefaultPriority": ""            }        ]    }}
```

```
<axtdc:SetDoor>    <axtdc:Door token="floor-token">        <axtdc:Name>Output 1</axtdc:Name>        <axtdc:AccessTime>PT7S</axtdc:AccessTime>        <axtdc:OpenTooLongTime>PT10S</axtdc:OpenTooLongTime>        <axtdc:PreAlarmTime>PT7S</axtdc:PreAlarmTime>        <axtdc:ExtendedAccessTime>PT30S</axtdc:ExtendedAccessTime>        <axtdc:ExtendedOpenTooLongTime>PT40S</axtdc:ExtendedOpenTooLongTime>        <axtdc:HeartbeatInterval>PT600S</axtdc:HeartbeatInterval>        <axtdc:PriorityConfiguration />        <axtdc:DefaultPriority />    </axtdc:Door></axtdc:SetDoor>
```

```
{    "Token": "floor-token"}
```

```
<axtdc:Token>floor-token</axtdc:Token>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "Configuration": [                    {                        "Name": "Lock.Type",                        "Value": "RemoteIO"                    },                    {                        "Name": "Lock.Hardware.Address",                        "Value": "remote/Axis-accc8e0c0ca1:1454410450.819540000/8"                    },                    {                        "Name": "Door.Type",                        "Value": "ElevatorFloor"                    }                ],                "token": "floor-token"            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="floor-token">        <axtdc:Configuration>            <Name>Lock.Type</Name>            <Value>RemoteIO</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>Lock.Protocol</Name>            <Value />        </axtdc:Configuration>        <axtdc:Configuration>            <Name>Lock.Hardware.Address</Name>            <Value>remote/Axis-accc8e0c0ca1:1454410450.819540000/8</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>Door.Type</Name>            <Value>ElevatorFloor</Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "Token": "floor-token"}
```

```
<axtdc:Token>floor-token</axtdc:Token>
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "token": "floor-idpoint-token",                "Name": "Reader Entrance",                "Action": "Access",                "Timeout": "PT10S",                "MaxPINSize": 4,                "MinPINSize": 4            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="floor-idpoint-token">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN />        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>Reader Entrance</axtid:Name>        <axtid:Timeout />        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "Token": "floor-idpoint-token"}
```

```
<axtid:Token>floor-idpoint-token</axtid:Token>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "token": "floor-idpoint-token",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "RS-485HD"                    },                    {                        "Name": "IdPoint.RS-485HD.Protocol",                        "Value": "OSDP"                    }                ]            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="floor-idpoint-token">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>RS-485HD</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.RS-485HD.Protocol</axconf:Name>            <axconf:Value>OSDP</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Address</axconf:Name>            <axconf:Value />        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "floor-idpoint-token"}
```

```
<axtid:Token>floor-idpoint-token</axtid:Token>
```

```
{    "pacsaxis:SetAccessPoint": {        "AccessPoint": [            {                "EntityType": "axtdc:Door",                "token": "floor-access-point-token",                "Name": "Floor Accesss Point",                "Enabled": true,                "Action": "Access",                "Entity": "floor-token",                "Attribute": [                    {                        "Name": "Direction",                        "Value": "in"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "floor-idpoint-token"                    }                ],                "AuthenticationProfile": [],                "DoorDeviceUUID": ""            }        ]    }}
```

```
<pacsaxis:SetAccessPoint>    <pacsaxis:AccessPoint token="floor-access-point-token">        <pacsaxis:Action>Access</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="in" />        <pacsaxis:AuthenticationProfile />        <pacsaxis:DoorDeviceUUID />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>floor-token</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:IdPoint>floor-idpoint-token</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>Access Point</pacsaxis:Name>        <pacsaxis:EntityType>axtdc:Door</pacsaxis:EntityType>    </pacsaxis:AccessPoint></pacsaxis:SetAccessPoint>
```

```
{    "pacsaxis:SetAccessProfile": {        "AccessProfile": [            {                "token": "pin_access_profile",                "Name": "PIN Access Profile",                "Description": "",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Schedule": ["standard_always"],                "AuthenticationProfile": ["PINOnly"],                "Attribute": [],                "AccessPolicy": [                    {                        "AccessPoint": "floor-access-point-token",                        "Schedule": ["standard_always"]                    }                ]            }        ]    }}
```

```
<pacsaxis:SetAccessProfile>    <pacsaxis:AccessProfile token="pin_access_profile">        <pacsaxis:Name>PIN Access Profile</pacsaxis:Name>        <pacsaxis:Description />        <pacsaxis:ValidFrom />        <pacsaxis:ValidTo />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        <pacsaxis:AuthenticationProfile>PINOnly</pacsaxis:AuthenticationProfile>        <pacsaxis:Attribute />        <pacsaxis:AccessPolicy>            <pacsaxis:AccessPoint>floor-access-point-token</pacsaxis:AccessPoint>            <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        </pacsaxis:AccessPolicy>    </pacsaxis:AccessProfile></pacsaxis:SetAccessProfile>
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "token": "credential_token",                "UserToken": "",                "Description": "",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Status": "Enabled",                "IdData": [                    {                        "Name": "PIN",                        "Value": "1234"                    }                ],                "Attribute": [],                "AuthenticationProfile": [],                "CredentialAccessProfile": [                    {                        "AccessProfile": "pin_access_profile",                        "ValidFrom": "",                        "ValidTo": ""                    }                ]            }        ]    }}
```

```
<pacsaxis:SetCredential>    <pacsaxis:Credential token="credential_token">        <pacsaxis:UserToken />        <pacsaxis:Description />        <pacsaxis:ValidFrom />        <pacsaxis:ValidTo />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Status>Enabled</pacsaxis:Status>        <pacsaxis:IdData>            <pacsaxis:Name>PIN</pacsaxis:Name>            <pacsaxis:Value>1234</pacsaxis:Value>        </pacsaxis:IdData>        <pacsaxis:Attribute />        <pacsaxis:AuthenticationProfile />        <pacsaxis:CredentialAccessProfile>            <pacsaxis:AccessProfile>pin_access_profile</pacsaxis:AccessProfile>            <pacsaxis:ValidFrom />            <pacsaxis:ValidTo />        </pacsaxis:CredentialAccessProfile>    </pacsaxis:Credential></pacsaxis:SetCredential>
```

```
{    "pacsaxis:SetAccessController": {        "AccessController": [            {                "token": "Axis-00408c184c15 AccessController",                "AccessPoint": ["floor-access-point-token"]            }        ]    }}
```

```
<pacsaxis:SetAccessController>    <pacsaxis:AccessController token="Axis-00408c184c15 AccessController">        <pacsaxis:AccessPoint>floor-access-point-token</pacsaxis:AccessPoint>    </pacsaxis:AccessController></pacsaxis:SetAccessController>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "Ser0hd",                "IoMode": "rs485hd",                "IoUser": [                    {                        "Type": "idpoint",                        "Usage": "RS-485HD",                        "MultiIo": false,                        "token": "floor-idpoint-token"                    }                ]            },            {                "IoName": "Eth0",                "IoMode": "ethernet",                "IoUser": [                    {                        "Type": "doorcontrol",                        "Usage": "Lock_Remote",                        "MultiIo": false,                        "token": "floor-token"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>Ser0hd</axisio:IoMode>        <axisio:IoName>rs485hd</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>RS-485HD</axisio:Usage>            <axisio:token>floor-idpoint-token</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>Eth0</axisio:IoMode>        <axisio:IoName>ethernet</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>Lock_Remote</axisio:Usage>            <axisio:token>floor-token</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
curl --anyauth -H "Content-Type: application/json" --data @sample_code.json http://<user>:<password>@<ip>/vapix/<service>
```

```
curl --anyauth --data @sample_code.soap http://<user>:<password>@<ip>/vapix/services
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Name": "Aperio Reader Entrance",                "Action": "Access",                "token": "aperio_idpoint_reader_entrance_token",                "MaxPINSize": 4,                "MinPINSize": 4            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="aperio_idpoint_reader_entrance_token">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN />        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>Aperio Reader Entrance</axtid:Name>        <axtid:Timeout />        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "Token": "aperio_idpoint_reader_entrance_token"}
```

```
<axtid:Token>aperio_idpoint_reader_entrance_token</axtid:Token>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "token": "aperio_idpoint_reader_entrance_token",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "RS-485HD"                    },                    {                        "Name": "IdPoint.Hardware.Address",                        "Value": "A0B1C2"                    },                    {                        "Name": "IdPoint.RS-485HD.Protocol",                        "Value": "AADP"                    }                ]            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="aperio_idpoint_reader_entrance_token">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>RS-485HD</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.RS-485HD.Protocol</axconf:Name>            <axconf:Value>AADP</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Address</axconf:Name>            <axconf:Value>A0B1C2</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "aperio_idpoint_reader_entrance_token"}
```

```
<axtid:Token>aperio_idpoint_reader_entrance_token</axtid:Token>
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Name": "REX Exit",                "Action": "AccessDoorWithoutUnlock",                "token": "aperio_idpoint_rex_exit_token"            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="aperio_idpoint_rex_exit_token">        <axtid:Action>AccessDoorWithoutUnlock</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN />        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>REX Exit</axtid:Name>        <axtid:Timeout />        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "token": "aperio_idpoint_rex_exit_token",                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "None"                    },                    {                        "Name": "IdPoint.Hardware.Address",                        "Value": "A0B1C2"                    },                    {                        "Name": "IdPoint.RS-485HD.Protocol",                        "Value": "AADP"                    },                    {                        "Name": "IdPoint.REX.Type",                        "Value": "RS-485HD"                    }                ]            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="aperio_idpoint_rex_exit_token">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>None</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.RS-485HD.Protocol</axconf:Name>            <axconf:Value>AADP</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Address</axconf:Name>            <axconf:Value>A0B1C2</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.REX.Type</axconf:Name>            <axconf:Value>RS-485HD</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "axtdc:SetDoor": {        "Door": [            {                "token": "aperio_door_token",                "Name": "Aperio Door",                "AccessTime": "PT7S",                "OpenTooLongTime": "PT30S",                "ExtendedAccessTime": "PT7S",                "ExtendedOpenTooLongTime": "PT30S",                "PreAlarmTime": "PT10S"            }        ]    }}
```

```
<axtdc:SetDoor>    <axtdc:Door token="aperio_door_token">        <axtdc:AccessTime>PT7S</axtdc:AccessTime>        <axtdc:DefaultPriority />        <axtdc:ExtendedAccessTime>PT7S</axtdc:ExtendedAccessTime>        <axtdc:ExtendedOpenTooLongTime>PT30S</axtdc:ExtendedOpenTooLongTime>        <axtdc:HeartbeatInterval />        <axtdc:Name>Aperio Door</axtdc:Name>        <axtdc:OpenTooLongTime>PT30S</axtdc:OpenTooLongTime>        <axtdc:PreAlarmTime>PT10S</axtdc:PreAlarmTime>        <axtdc:PriorityConfiguration />    </axtdc:Door></axtdc:SetDoor>
```

```
{    "Token": "aperio_door_token"}
```

```
<axtdc:Token>aperio_door_token</axtdc:Token>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "Configuration": [                    {                        "Name": "Lock.Type",                        "Value": "RS485HD"                    },                    {                        "Name": "Lock.Protocol",                        "Value": "AADP"                    },                    {                        "Name": "Lock.Hardware.Address",                        "Value": "A0B1C2"                    },                    {                        "Name": "DoorMonitor.Type",                        "Value": "RS485HD"                    },                    {                        "Name": "DoorMonitor.Protocol",                        "Value": "AADP"                    },                    {                        "Name": "DoorMonitor.Hardware.Address",                        "Value": "F9E8C7"                    }                ],                "token": "aperio_door_token"            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="aperio_door_token">        <axtdc:Configuration>            <Name>Lock.Type</Name>            <Value>RS485HD</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>Lock.Protocol</Name>            <Value>AADP</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>Lock.Hardware.Address</Name>            <Value>A0B1C2</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>DoorMonitor.Type</Name>            <Value>RS485HD</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>DoorMonitor.Protocol</Name>            <Value>AADP</Value>        </axtdc:Configuration>        <axtdc:Configuration>            <Name>DoorMonitor.Hardware.Address</Name>            <Value>F9E8C7</Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "Token": "aperio_door_token"}
```

```

```

```
<axtdc:Token>aperio_door_token</axtdc:Token>
```

```
{    "pacsaxis:SetAccessPoint": {        "AccessPoint": [            {                "EntityType": "axtdc:Door",                "token": "entrance_access_point_token",                "Name": "Entrance Acesss Point",                "Enabled": true,                "Action": "Access",                "Entity": "aperio_door_token",                "Attribute": [                    {                        "Name": "Direction",                        "Value": "in"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "aperio_idpoint_reader_entrance_token"                    }                ],                "AuthenticationProfile": [],                "DoorDeviceUUID": ""            },            {                "EntityType": "axtdc:Door",                "token": "rex_access_point_token",                "Name": "REX Acesss Point",                "Enabled": true,                "Action": "AccessDoorWithoutUnlock",                "Entity": "aperio_door_token",                "Attribute": [                    {                        "Name": "Direction",                        "Value": "out"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "aperio_idpoint_rex_exit_token"                    }                ],                "AuthenticationProfile": ["REXOnly"],                "DoorDeviceUUID": ""            }        ]    }}
```

```
<pacsaxis:SetAccessPoint>    <pacsaxis:AccessPoint token="entrance_access_point_token">        <pacsaxis:Action>Access</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="in" />        <pacsaxis:AuthenticationProfile />        <pacsaxis:DoorDeviceUUID />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>aperio_door_token</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:IdPoint>aperio_idpoint_reader_entrance_token</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>Entrance Acesss Point</pacsaxis:Name>        <pacsaxis:EntityType>axtdc:Door</pacsaxis:EntityType>    </pacsaxis:AccessPoint>    <pacsaxis:AccessPoint token="rex_access_point_token">        <pacsaxis:Action>AccessDoorWithoutUnlock</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="out" />        <pacsaxis:AuthenticationProfile>REXOnly</pacsaxis:AuthenticationProfile>        <pacsaxis:DoorDeviceUUID />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>aperio_door_token</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:IdPoint>aperio_idpoint_reader_entrance_token</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>REX Acesss Point</pacsaxis:Name>        <pacsaxis:EntityType>axtdc:Door</pacsaxis:EntityType>    </pacsaxis:AccessPoint></pacsaxis:SetAccessPoint>
```

```
{    "pacsaxis:SetAccessController": {        "AccessController": [            {                "token": "access_controller_token",                "AccessPoint": ["entrance_access_point_token", "rex_access_point_token"]            }        ]    }}
```

```
<pacsaxis:SetAccessController>    <pacsaxis:AccessController token="access_controller_token">        <pacsaxis:AccessPoint>entrance_access_point_token</pacsaxis:AccessPoint>        <pacsaxis:AccessPoint>rex_access_point_token</pacsaxis:AccessPoint>    </pacsaxis:AccessController></pacsaxis:SetAccessController>
```

```
{    "pacsaxis:SetAccessProfile": {        "AccessProfile": [            {                "token": "REXOnly",                "Name": "REX only",                "Description": "",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Schedule": ["standard_always"],                "AuthenticationProfile": ["REXOnly"],                "Attribute": [],                "AccessPolicy": [                    {                        "AccessPoint": "rex_access_point_token",                        "Schedule": ["standard_always"]                    }                ]            },            {                "token": "pin_access_profile",                "Name": "PIN Access Profile",                "Description": "",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Schedule": ["standard_always"],                "AuthenticationProfile": ["PINOnly"],                "Attribute": [],                "AccessPolicy": [                    {                        "AccessPoint": "entrance_access_point_token",                        "Schedule": ["standard_always"]                    }                ]            }        ]    }}
```

```
<pacsaxis:SetAccessProfile>    <pacsaxis:AccessProfile token="REXOnly">        <pacsaxis:Name>REX Only</pacsaxis:Name>        <pacsaxis:Description />        <pacsaxis:ValidFrom />        <pacsaxis:ValidTo />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        <pacsaxis:AuthenticationProfile>REXOnly</pacsaxis:AuthenticationProfile>        <pacsaxis:Attribute />        <pacsaxis:AccessPolicy>            <pacsaxis:AccessPoint>rex_access_point_token</pacsaxis:AccessPoint>            <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        </pacsaxis:AccessPolicy>    </pacsaxis:AccessProfile>    <pacsaxis:AccessProfile token="pin_access_profile">        <pacsaxis:Name>PIN Access Profile</pacsaxis:Name>        <pacsaxis:Description />        <pacsaxis:ValidFrom />        <pacsaxis:ValidTo />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        <pacsaxis:AuthenticationProfile>PINOnly</pacsaxis:AuthenticationProfile>        <pacsaxis:Attribute />        <pacsaxis:AccessPolicy>            <pacsaxis:AccessPoint>entrance_access_point_token</pacsaxis:AccessPoint>            <pacsaxis:Schedule>standard_always</pacsaxis:Schedule>        </pacsaxis:AccessPolicy>    </pacsaxis:AccessProfile></pacsaxis:SetAccessProfile>
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "token": "credential_token",                "UserToken": "",                "Description": "",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Status": "Enabled",                "IdData": [                    {                        "Name": "PIN",                        "Value": "1234"                    }                ],                "Attribute": [],                "AuthenticationProfile": [],                "CredentialAccessProfile": [                    {                        "AccessProfile": "pin_access_profile",                        "ValidFrom": "",                        "ValidTo": ""                    }                ]            }        ]    }}
```

```
<pacsaxis:SetCredential>    <pacsaxis:Credential token="credential_token">        <pacsaxis:UserToken />        <pacsaxis:Description />        <pacsaxis:ValidFrom />        <pacsaxis:ValidTo />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Status>Enabled</pacsaxis:Status>        <pacsaxis:IdData>            <pacsaxis:Name>PIN</pacsaxis:Name>            <pacsaxis:Value>1234</pacsaxis:Value>        </pacsaxis:IdData>        <pacsaxis:Attribute />        <pacsaxis:AuthenticationProfile />        <pacsaxis:CredentialAccessProfile>            <pacsaxis:AccessProfile>pin_access_profile</pacsaxis:AccessProfile>            <pacsaxis:ValidFrom />            <pacsaxis:ValidTo />        </pacsaxis:CredentialAccessProfile>    </pacsaxis:Credential></pacsaxis:SetCredential>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "Ser3hd",                "IoMode": "rs485hd",                "IoUser": [                    {                        "Type": "doorcontrol",                        "Usage": "RS-485HD",                        "MultiIo": false,                        "token": "aperio_door_token"                    },                    {                        "Type": "idpoint",                        "Usage": "RS-485HD",                        "MultiIo": false,                        "token": "aperio_idpoint_reader_entrance_token"                    },                    {                        "Type": "idpoint",                        "Usage": "RS-485HD",                        "MultiIo": false,                        "token": "aperio_idpoint_rex_exit_token"                    },                    {                        "Type": "doorcontrol",                        "Usage": "DoorMonitorRS-485HD",                        "MultiIo": false,                        "token": "aperio_door_token"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>Ser3hd</axisio:IoMode>        <axisio:IoName>rs485hd</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>RS-485HD</axisio:Usage>            <axisio:token>aperio_door_token</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>RS-485HD</axisio:Usage>            <axisio:token>aperio_idpoint_reader_entrance_token</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>idpoint</axisio:Type>            <axisio:Usage>RS-485HD</axisio:Usage>            <axisio:token>aperio_idpoint_rex_exit_token</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>DoorMonitorRS-485HD</axisio:Usage>            <axisio:token>aperio_door_token</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
curl --anyauth -H "Content-Type:application/json" --data @sample_code.json http://<user>:<password>@<ip>/vapix/<service>
```

```
curl --anyauth --data @sample_code.soap http://<user>:<password>@<ip>/vapix/services
```

```
{    "axtid:SetIdPoint": {        "IdPoint": [            {                "Action": "Access",                "Area": "",                "Description": "SmartIntegoIdPointDescription",                "EndOfPIN": "#",                "HeartbeatInterval": "",                "Location": "",                "MaxPINSize": 4,                "MinPINSize": 4,                "Name": "SI IdPoint entrance",                "token": "Si_idpoint_entrance"            }        ]    }}
```

```
<axtid:SetIdPoint>    <axtid:IdPoint token="Si_idpoint_entrance">        <axtid:Action>Access</axtid:Action>        <axtid:Area />        <axtid:EndOfPIN />        <axtid:MaxPINSize>4</axtid:MaxPINSize>        <axtid:MinPINSize>4</axtid:MinPINSize>        <axtid:Name>SI IdPoint entrance</axtid:Name>        <axtid:Timeout />        <axtid:HeartbeatInterval />        <axtid:Location />    </axtid:IdPoint></axtid:SetIdPoint>
```

```
{    "Token": "Si_idpoint_entrance"}
```

```
<axtid:Token>Si_idpoint_entrance</axtid:Token>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "TCPIP"                    },                    {                        "Name": "IdPoint.TCPIP.Protocol",                        "Value": "SmartIntego"                    },                    {                        "Name": "IdPoint.Hardware.Address",                        "Value": "0x200"                    },                    {                        "Name": "IdPoint.Hardware.Id",                        "Value": "00E4DR7"                    },                    {                        "Name": "IdPoint.TCPIP.Address",                        "Value": "172.25.15.123"                    },                    {                        "Name": "IdPoint.TCPIP.Port",                        "Value": "2101"                    },                    {                        "Name": "IdPoint.Hub.Hardware.Address",                        "Value": "0x100"                    }                ],                "IdDataConfiguration": [],                "token": "Si_idpoint_entrance"            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="Si_idpoint_entrance">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>TCPIP</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Protocol</axconf:Name>            <axconf:Value>SmartIntego</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Address</axconf:Name>            <axconf:Value>0x200</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Id</axconf:Name>            <axconf:Value>00E4DR7</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Address</axconf:Name>            <axconf:Value>172.25.15.123</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Port</axconf:Name>            <axconf:Value>2101</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hub.Hardware.Address</axconf:Name>            <axconf:Value>0x100</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "Si_idpoint_entrance"}
```

```
<axtid:Token>Si_idpoint_entrance</axtid:Token>
```

```
{    "axtdc:SetDoor": {        "Door": [            {                "token": "SmartIntego_door_token",                "Name": "SmartIntego door",                "Description": "SIDoorDescription",                "AccessTime": "PT7S",                "DefaultPriority": "",                "OpenTooLongTime": "PT30S",                "PreAlarmTime": "PT10S",                "ExtendedAccessTime": "PT7S",                "ExtendedOpenTooLongTime": "PT30S",                "PriorityConfiguration": "Standard",                "HeartbeatInterval": "PT600S"            }        ]    }}
```

```
<axtdc:SetDoor>    <axtdc:Door token="SmartIntego_door_token">        <axtdc:AccessTime>PT7S</axtdc:AccessTime>        <axtdc:DefaultPriority />        <axtdc:ExtendedAccessTime>PT7S</axtdc:ExtendedAccessTime>        <axtdc:ExtendedOpenTooLongTime>PT30S</axtdc:ExtendedOpenTooLongTime>        <axtdc:HeartbeatInterval />        <axtdc:Name>SmartIntego Door</axtdc:Name>        <axtdc:OpenTooLongTime>PT30S</axtdc:OpenTooLongTime>        <axtdc:PreAlarmTime>PT10S</axtdc:PreAlarmTime>        <axtdc:PriorityConfiguration />    </axtdc:Door></axtdc:SetDoor>
```

```
{    "Token": "SmartIntego_door_token"}
```

```
<axtdc:Token>SmartIntego_door_token</axtdc:Token>
```

```
{    "axtdc:SetDoorConfiguration": {        "DoorConfiguration": [            {                "Configuration": [                    {                        "Name": "Lock.Type",                        "Value": "TCPIP"                    },                    {                        "Name": "Lock.Protocol",                        "Value": "SmartIntego"                    },                    {                        "Name": "Lock.Hardware.Address",                        "Value": "0x200"                    },                    {                        "Name": "Lock.Hardware.Id",                        "Value": "00E4DR7"                    },                    {                        "Name": "Lock.TCPIP.Address",                        "Value": "172.25.15.123"                    },                    {                        "Name": "Lock.TCPIP.Port",                        "Value": "2101"                    },                    {                        "Name": "Lock.Hub.Hardware.Address",                        "Value": "0x100"                    },                    {                        "Name": "DoorMonitor.Type",                        "Value": "TCPIP"                    },                    {                        "Name": "DoorMonitor.Protocol",                        "Value": "SmartIntego"                    }                ],                "DoorScheduleConfiguration": "",                "token": "SmartIntego_door_token"            }        ]    }}
```

```
<axtdc:SetDoorConfiguration>    <axtdc:DoorConfiguration token="SmartIntego_door_token">        <axtdc:Configuration>            <axconf:Name>Lock.Type</axconf:Name>            <axconf:Value>TCPIP</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Protocol</axconf:Name>            <axconf:Value>SmartIntego</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Hardware.Address</axconf:Name>            <axconf:Value>0x200</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.Type</axconf:Name>            <axconf:Value>TCPIP</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>DoorMonitor.Protocol</axconf:Name>            <axconf:Value>SmartIntego</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Hardware.Id</axconf:Name>            <axconf:Value>00E4DR7</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.TCPIP.Address</axconf:Name>            <axconf:Value>172.25.15.123</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.TCPIP.Port</axconf:Name>            <axconf:Value>2101</axconf:Value>        </axtdc:Configuration>        <axtdc:Configuration>            <axconf:Name>Lock.Hub.Hardware.Address</axconf:Name>            <axconf:Value>0x100</axconf:Value>        </axtdc:Configuration>        <axtdc:DeviceUUID />    </axtdc:DoorConfiguration></axtdc:SetDoorConfiguration>
```

```
{    "Token": "SmartIntego_door_token"}
```

```
<axtdc:Token>SmartIntego_door_token</axtdc:Token>
```

```
{    "pacsaxis:SetAccessPoint": {        "AccessPoint": [            {                "EntityType": "axtdc:Door",                "token": "AccessPointToken",                "Name": "AccessPoint SmartIntego",                "Enabled": true,                "Action": "Access",                "Entity": "SmartIntego_door_token",                "Attribute": [                    {                        "Name": "Direction",                        "Value": "in"                    }                ],                "IdPointDevice": [                    {                        "IdPoint": "Si_idpoint_entrance"                    }                ],                "AuthenticationProfile": []            }        ]    }}
```

```
<pacsaxis:SetAccessPoint>    <pacsaxis:AccessPoint token="AccessPointToken">        <pacsaxis:Action>Access</pacsaxis:Action>        <pacsaxis:Attribute Name="Direction" Value="in" />        <pacsaxis:AuthenticationProfile />        <pacsaxis:DoorDeviceUUID />        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Entity>SmartIntego_door_token</pacsaxis:Entity>        <pacsaxis:IdPointDevice>            <pacsaxis:IdPoint>Si_idpoint_entrance</pacsaxis:IdPoint>        </pacsaxis:IdPointDevice>        <pacsaxis:Name>AccessPoint SmartIntego</pacsaxis:Name>        <pacsaxis:EntityType>axtdc:Door</pacsaxis:EntityType>    </pacsaxis:AccessPoint></pacsaxis:SetAccessPoint>
```

```
{    "pacsaxis:SetAccessController": {        "AccessController": [            {                "token": "Axis-00408c185499 AccessController",                "Name": "",                "Description": "",                "AccessPoint": ["AccessPointToken"]            }        ]    }}
```

```
<pacsaxis:SetAccessController>    <pacsaxis:AccessController token="Axis-00408c185499 AccessController">        <pacsaxis:AccessPoint>AccessPointToken</pacsaxis:AccessPoint>        <pacsaxis:Description />        <pacsaxis:Name />    </pacsaxis:AccessController></pacsaxis:SetAccessController>
```

```
{    "axisio:SetIoAssignment": {        "IoAssignment": [            {                "IoName": "Eth0",                "IoMode": "ethernet",                "IoUser": [                    {                        "Type": "doorcontrol",                        "Usage": "TCPIP",                        "MultiIo": false,                        "token": "SmartIntego_door_token"                    },                    {                        "Type": "doorcontrol",                        "Usage": "DoorMonitorSmartIntegoTCPIP",                        "MultiIo": false,                        "token": "SmartIntego_door_token"                    },                    {                        "Type": "idpoint",                        "Usage": "TCPIP",                        "MultiIo": false,                        "token": "Si_idpoint_entrance"                    }                ]            }        ]    }}
```

```
<axisio:SetIoAssignment>    <axisio:IoAssignment>        <axisio:IoMode>Eth0</axisio:IoMode>        <axisio:IoName>ethernet</axisio:IoName>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>TCPIP</axisio:Usage>            <axisio:token>SmartIntego_door_token</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>TCPIP</axisio:Usage>            <axisio:token>Si_idpoint_entrance</axisio:token>        </axisio:IoUser>        <axisio:IoUser>            <axisio:MultiIo>false</axisio:MultiIo>            <axisio:Type>doorcontrol</axisio:Type>            <axisio:Usage>DoorMonitorSmartIntegoTCPIP</axisio:Usage>            <axisio:token>SmartIntego_door_token</axisio:token>        </axisio:IoUser>    </axisio:IoAssignment></axisio:SetIoAssignment>
```

```
{    "Fault": "env:Sender",    "FaultCode": "ter:InvalidArgs",    "FaultSubCode": "ter:InvalidCredentialFault",    "FaultReason": "Invalid argument",    "FaultMsg": "Id data XX required for credential 'xx'"}
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "token": "Axis-00408c184bdb:1351593020.016190000",                "UserToken": "user_token1",                "Description": "Credential description",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Status": "Enabled",                "IdData": [                    {                        "Name": "Card",                        "Value": "12345678"                    },                    {                        "Name": "PIN",                        "Value": "1234"                    }                ],                "Attribute": [                    {                        "Name": "AxisWhiteList",                        "Value": "Card"                    }                ],                "AuthenticationProfile": [],                "CredentialAccessProfile": [                    {                        "ValidFrom": "",                        "ValidTo": "",                        "AccessProfile": "Axis-00408c184bdb:1351591416.539133000"                    }                ]            }        ]    }}
```

```
<pacsaxis:SetCredential>    <Credential token="Axis-00408c184bdb:1351593020.016190000">        <CredentialAccessProfile>            <AccessProfile>Axis-00408c184bdb:1351591416.539133000</AccessProfile>        </CredentialAccessProfile>        <Description>Credential description</Description>        <Enabled>true</Enabled>        <IdData Name="Card" Value="12345678" />        <IdData Name="PIN" Value="1234" />        <Attribute Name="AxisWhitelist" Value="Card" />        <Status>Enabled</Status>        <UserToken>user_token1</UserToken>    </Credential></pacsaxis:SetCredential>
```

```
{    "pacsaxis:SetAccessProfile": {        "AccessProfile": [            {                "token": "Axis-00408c184bdb:1351591416.539133000",                "Name": "AccessProfile1",                "Description": "AccessProfile description",                "Enabled": true,                "Schedule": [],                "ValidFrom": "",                "ValidTo": "",                "AuthenticationProfile": [],                "Attribute": [                    {                        "Name": "AxisWhitelist",                        "Value": "Card"                    }                ],                "AccessPolicy": [                    {                        "AccessPoint": "Axis-00408c184bdb:1351589192.102223000",                        "AuthorizationProfile": [],                        "Attribute": [],                        "Schedule": []                    }                ]            }        ]    }}
```

```
<pacsaxis:SetAccessProfile>    <AccessProfile token="Axis-00408c184bdb:1351591416.539133000">        <AccessPolicy>            <AccessPoint>Axis-00408c184bdb:1351589192.102223000z</AccessPoint>        </AccessPolicy>        <Description>AccessProfile description</Description>        <Enabled>true</Enabled>        <Name>AccessProfile1</Name>        <Attribute Name="AxisWhitelist" Value="Card" />    </AccessProfile></pacsaxis:SetAccessProfile>
```

```
{    "axtid:SetIdPointConfiguration": {        "IdPointConfiguration": [            {                "Configuration": [                    {                        "Name": "IdPoint.Reader.Type",                        "Value": "TCPIP"                    },                    {                        "Name": "IdPoint.TCPIP.Protocol",                        "Value": "SmartIntego"                    },                    {                        "Name": "IdPoint.Hardware.Address",                        "Value": "0x200"                    },                    {                        "Name": "IdPoint.Hardware.Id",                        "Value": "00E4DR7"                    },                    {                        "Name": "IdPoint.TCPIP.Address",                        "Value": "172.25.15.123"                    },                    {                        "Name": "IdPoint.TCPIP.Port",                        "Value": "2101"                    },                    {                        "Name": "IdPoint.Hub.Hardware.Address",                        "Value": "0x100"                    },                    {                        "Name": "IdPoint.Whitelist.IdDataName",                        "Value": "Card"                    }                ],                "IdDataConfiguration": [],                "token": "Si_idpoint_entrance"            }        ]    }}
```

```
<axtid:SetIdPointConfiguration>    <axtid:IdPointConfiguration token="Si_idpoint_entrance">        <axtid:Configuration>            <axconf:Name>IdPoint.Reader.Type</axconf:Name>            <axconf:Value>TCPIP</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Protocol</axconf:Name>            <axconf:Value>SmartIntego</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Address</axconf:Name>            <axconf:Value>0x200</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hardware.Id</axconf:Name>            <axconf:Value>00E4DR7</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Address</axconf:Name>            <axconf:Value>172.25.15.123</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.TCPIP.Port</axconf:Name>            <axconf:Value>2101</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Hub.Hardware.Address</axconf:Name>            <axconf:Value>0x100</axconf:Value>        </axtid:Configuration>        <axtid:Configuration>            <axconf:Name>IdPoint.Whitelist.IdDataName</axconf:Name>            <axconf:Value>Card</axconf:Value>        </axtid:Configuration>        <axtid:DeviceUUID />        <axtid:IdDataConfiguration />    </axtid:IdPointConfiguration></axtid:SetIdPointConfiguration>
```

```
{    "Token": "Si_idpoint_entrance"}
```

```
<axtid:Token>Si_idpoint_entrance</axtid:Token>
```

```
curl --anyauth -H "Content-Type:application/json" --data @sample_code.json http://<user>:<password>@<ip>/vapix/<idpoint>
```

```
curl --anyauth --data @sample_code.soap http://<user>:<password>@<ip>/vapix/services
```

```
{    "axtid:IndicateRemoteActivities": {        "Token": "MyToken",        "Description": "MyDescr",        "Activities": [            {                "Type": "REX"            }        ]    }}
```

```
<?xml version="1.0" encoding="UTF8" ?><SOAP-ENV:Envelope    xmlns:ns0="http://www.w3.org/2003/05/soap-envelope"    xmlns:ns1="http://www.axis.com/vapix/ws/IdPoint"    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope">    <SOAP-ENV:Header />    <ns0:Body>        <ns1:IndicateRemoteActivities>            <ns1:Token>MyToken</ns1:Token>            <ns1:Description>MyDescr</ns1:Description>            <ns1:Activities>                <ns1:Type>REX</ns1:Type>            </ns1:Activities>        </ns1:IndicateRemoteActivities>    </ns0:Body></SOAP-ENV:Envelope>
```

```
{}
```

```
<SOAP-ENV:Envelope>    <SOAP-ENV:Header />    <SOAP-ENV:Body>        <axtid:IndicateRemoteActivitiesResponse />    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{    "axtid:IndicateRemoteActivities": {        "Token": "MyToken",        "Description": "MyDescr",        "Activities": [            {                "Type": "Card",                "Params": [                    {                        "Name": "LPN",                        "Value": "MyLPN"                    }                ]            }        ]    }}
```

```
<?xml version="1.0" encoding="UTF-8" ?><SOAP-ENV:Envelope    xmlns:ns0="http://www.axis.com/vapix/ws/IdPoint"    xmlns:ns1="http://www.w3.org/2003/05/soap-envelope"    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope">    <SOAP-ENV:Header />    <ns1:Body>        <ns0:IndicateRemoteActivities>            <ns0:Token>MyToken</ns0:Token>            <ns0:Description>MyDescr</ns0:Description>            <ns0:Activities>                <ns0:Type>Card</ns0:Type>                <ns0:Params>                    <ns0:Name>LPN</ns0:Name>                    <ns0:Value>MyLPN</ns0:Value>                </ns0:Params>            </ns0:Activities>        </ns0:IndicateRemoteActivities>    </ns1:Body></SOAP-ENV:Envelope>
```

```
{}
```

```
<SOAP-ENV:Envelope>    <SOAP_ENV:Header />    <SOAP-ENV:Body>        <axtid:IndicateRemoteActivitiesResponse />    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{    "axtid:IndicateRemoteActivities": {        "Token": "MyToken",        "Description": "MyDescr",        "Activities": [            {                "Type": "Card",                "Params": [                    {                        "Name": "Card",                        "Value": "02004fcb"                    },                    {                        "Name": "PIN",                        "Value": "1111"                    }                ]            }        ]    }}
```

```
<SOAP-ENV:Envelope    xmlns:ns0="http://www.w3.org/2003/05/soap-envelope"    xmlns:ns1="http://www.axis.com/vapix/ws/IdPoint"    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope">    <SOAP-ENV:Header />    <ns0:Body>        <ns1:IndicateRemoteActivities>            <ns1:Token>MyToken</ns1:Token>            <ns1:Description>MyDescr</ns1:Description>            <ns1:Activities>                <ns1:Type>Card</ns1:Type>                <ns1:Params>                    <ns1:Name>Card</ns1:Name>                    <ns1:Value>02004fcb</ns1:Value>                </ns1:Params>                <ns1:Params>                    <ns1:Name>PIN</ns1:Name>                    <ns1:Value>1111</ns1:Value>                </ns1:Params>            </ns1:Activities>        </ns1:IndicateRemoteActivities>    </ns0:Body></SOAP-ENV:Envelope>
```

```
{}
```

```
<SOAP-ENV:Envelope>    <SOAP-ENV:Header />    <SOAP-ENV:Body>        <axtid:IndicateRemoteActivitiesResponse />    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{    "axtid:IndicateRemoteActivities": {        "Token": "MyToken",        "Description": "MyDescr",        "Activities": [            {                "Type": "PIN",                "Params": [                    {                        "Name": "PIN",                        "Value": "1111"                    }                ]            }        ]    }}
```

```
<?xml version="1.0" encoding="UTF-8" ?><SOAP-ENV:Envelope    xmlns:ns0="http://www.axis.com/vapix/ws/IdPoint"    xmlns:ns1="http://www.w3.org/2003/05/soap-envelope"    xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope">    <SOAP-ENV:Header />    <ns1:Body>        <ns0:IndicateRemoteActivites>            <ns0:Token>MyToken</ns0:Token>            <ns0:Description>MyDescr</ns0:Description>            <ns0:Activities>                <ns0:Type>PIN</ns0:Type>                <ns0:Params>                    <ns0:Name>PIN</ns0:Name>                    <ns0:Value>1111</ns0:Value>                </ns0:Params>            </ns0:Activities>        </ns0:IndicateRemoteActivites>    </ns1:Body></SOAP-ENV:Envelope>
```

```
{}
```

```
<SOAP-ENV:Envelope>    <SOAP-ENV:Header />    <SOAP-ENV:Body>        <axtid:IndicateRemoteActivitiesResponse />    </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

- Elevator access control with AXIS A9188 Network I/O Relay Module.
- Wireless AperioTM door locks, readers and door monitors.
- SmartIntego TM door locks, readers and door monitors.
- Remote readers, keypads and REX (Request to Exit).

- Find remote I/O modules on the network
- Add the remote I/O module to the door controller
- Find the remote I/Os
- Create a floor
- Create an IdPoint for the reader
- Create an access point
- Create an access profile
- Add a credential
- Update the access controller
- Assign I/Os

- Lock.Type is "RemoteIO"
- Lock.Hardware.Address is the Id of the remote I/O connected to the floor.
- Door.Type is "ElevatorFloor"

- Doors with wireless Aperio locks and readers, and optionally, with integrated or stand-alone Aperio door monitors
- Aperio RS485 hub
- Axis door controller

- Device A is an Aperio card reader with keypad, integrated lock and handle-state detection. Hardware ID: A0B1C2.
- Device B is a stand-alone Aperio door monitor. Hardware ID: F9E8D7.

- IdPoint.Reader.Type is RS485HD
- IdPoint.Hardware.Address is device A:s hardware ID
- IdPoint.RS-485HD.Protocol is AADP

- Lock.Type and DoorMonitor.Type are RS485HD
- Lock.Protocol and DoorMonitor.Protocol are AADP
- Lock.Hardware.Address is device A:s hardware ID
- DoorMonitor.Hardware.Address is device B:s hardware ID.

- The entrance access point is connected to the entrance IdPoint. Token entrance_access_point_token.
- The exit access point is connected to the exit IdPoint. This access point has action AccessDoorWithoutUnlock and the default REX only authentication profile. Token rex_access_point_token.

- Access profile PIN Access Profile is connected to the entrance access point and uses the default PIN only authentication profile.
- Access profile REX Only is connected to the exit access point and uses the default REX only authentication profile.

- The lock. Service doorcontrol.
- The entrance IdPoint. Service idpoint.
- The exit IdPoint. Service idpoint.
- The door monitor. Service doorcontrol.

- SmartIntego TCPIP Gateway
- Doors with wireless SmartIntegeo locks and readers, and optionally, with an integrated door monitor.
- Axis door controller

- Long access time is not supported when access is given based on the Whitelist in the lock.
- Anti-passback is not supported by AccessPoints with Whitelist.
- Valid from/to is not considered for a Credential and AccessProfile when access is given based on the Whitelist in the lock. This means that credentials that seems to have expired are still kept in the Whitelist entries in the locks and still allows access.
- Schedules for AccessProfiles and AccessPoints are ignored when access is given based on the Whitelist in the lock.
- AutenticationProfiles added to AccessProfiles, AccessPoints and Credentials are ignored when access is given based on the Whitelist in the lock.
- Duress is ignored when access is given based on the Whitelist in the lock.
- Only UID mode is supported.

- Device A is a SmartIntego Smart Handle with door monitor.
- Device B is a SmartIntego full cylinder.
- Device C is a SmartIntego half cylinder.

- IdPoint.Reader.Type is TCPIP
- IdPoint.Hardware.Address is a device’s "device address" in the csv-file
- IdPoint.TCPIP.Protocol is SmartIntego
- IdPoint.Hardware.Id is a device’s "phi string" in the csv-file
- IdPoint.TCPIP.Address is a device’s "connection details" in the csv-file (IP to the Gateway the lock is paired with)
- IdPoint.TCPIP.Port is 2101
- IdPoint.Hub.Hardware.Address is a Gateway’s "device address" in the csv-file

- Lock.Type is TCPIP
- Lock.Hardware.Address is a device’s "device address" in the .csv-file
- Lock.Protocol is SmartIntego
- Lock.Hardware.Id is a device’s "phi string" in the .csv-file
- Lock.TCPIP.Address is a device’s "connection details" in the .csv-file (IP to the Gateway the lock is paired with)
- Lock.TCPIP.Port is 2101
- Lock.Hub.Hardware.Address is a Gateway's "device address" in the .csv-file
- DoorMonitor.Type are TCPIP if DoorMonitor otherwise None
- DoorMonitor.Protocol are SmartIntego if DoorMonitor otherwise None

- The lock. Service doorcontrol.
- The IdPoint. Service idpoint.
- The door monitor. Service doorcontrol. If door monitor is used.

- The value of AxisWhiteList must match the value of IdPoint.Whitelist.IdDataName when the AccessPoint is added to the AccessPolicy of the AccessProfile.
- The AccessProfile can only be added to the CredentialAccessProfile of the credential if it contains an IdData with a Name that matches the one specified in the Value of the attribute AxisWhitelist in the AccessProfile.
- If access is granted by a lock using Whitelist the IdPoint/PreAuthorization/IdData event is sent instead of IdPoint/Request/IdData/xxx.
- The Door/State/DoorMode event reflects the door state ordered by the physical access control system. Since this does not order the state of a door for Whitelist accesses, this event is never sent.
- Removing the IdData of a credential if the IdData used by the WhiteList is not supported. Error messaged received will look like the example below:

- Attribute Name: AxisWhitelist
- Attribute Value: An existing IdData name for this credential that should be synced to any Whitelist-enabled IdPoint. If left empty Card will be assumed. This value needs to correspond to the AxisWhitelist attribute in any Whitelist enabled AccessProfile that the credential references.

- All Credentials that references the AccessProfile contains an IdData field with a Name that matches the value of AxisWhitelist.
- The AccessProfile references an IdPointConfiguration and the Value of IdPoint.WhiteList.IdDataName has first been set to the new value.

- Attribute Name: AxisWhitelist
- Attribute Value: Name of the IdData that should be synced to any Whitelist-enabled IdPoint that is connected to this AccessProfile. If left empty, Card will be assumed. This value needs to correspond to the IdPoint.Whitelist.IdDataName parameter in the IdPointConfiguration that is referenced by the AccessProfile via the AccessPoint.

- Attribute Name: IdPoint.Whitelist.IdDataName
- Attribute Value: Name of the IdData that should be synced to any Whitelist-enabled IdPoint that is connected to the WhiteList AccessProfile. If left empty, Card is set as default.

- The Name/Value pairs of the params in the API request need to match the Name/Value pairs of the IdData in a credential and have the same ordering. This credential needs to be associated with an AccessProfile, AccessPoint and IdPoint, that matches the ID and AuthenticationProfile as seen in Setting the credential.
- Each Name in the Params of the IndicateRemoteActivities request must match the IdDataName in the IdFactor list of an AuthenticationProfile that is associated with either the Credential, AccessPoint or AccessProfile mentioned above. For additional information, see Setting the access point, Setting the access profile and Retrieve default configuration in the Access Control Service Guide.

- IndicateRemoteActivities (Card) + IndicateRemoteActivities (PIN) (Separate API requests)
- IndicateRemoteActivities (Card + PIN) (Same API request)
- IndicateRemoteActivities (PIN + Card) (Same API request)

- IndicateRemoteActivities (PIN) + IndicateRemoteActivities (Card) (Separate API requests)

