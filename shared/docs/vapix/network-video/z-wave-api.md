# Z-Wave API

**Source:** https://developer.axis.com/vapix/network-video/z-wave-api/
**Last Updated:** Aug 28, 2025

---

# Z-Wave API

## Overview​

### General concepts​

#### Nodes, endpoints and interfaces​

#### Operations​

#### S0 and S2​

#### SmartStart​

#### Command Class​

#### Device Classes​

#### Role Type​

### Identification​

## Common examples​

### Set up a Z-Wave network​

### Retrieve device information​

### Retrieve the last known device information​

### Replace a failing node​

### Remove a node​

### Remove a failed node​

### Abort operation​

### Reset network​

### Refresh node​

### SmartStart​

### Remove device from the provisioning list​

### Retrieve supported API versions​

## API Specifications​

### setEnabled​

### getEnabled​

### addNode​

### removeNode​

### getOperation​

### abortOperation​

### resetNetwork​

### refreshNetwork​

### getNodeList​

### getEndpointList​

### getEndpointInterfaceList​

### getSummaryList​

### replaceFailedNode​

### removeFailedNode​

### setEndpointInfo​

### getS2RequestedKeys​

### setS2GrantKeys​

### getS2DeviceSpecificKey​

### acceptS2​

### refreshNode​

### addToProvisioningList​

### removeFromProvisioningList​

### getProvisioningList​

### getBatteryState​

### getMultilevelSensorState​

### getMultilevelSensorSupport​

### getMultilevelSensorUnitSupport​

### getConfiguration​

### setConfiguration​

### getBinarySwitchState​

### setBinarySwitchState​

### getBasicState​

### setBasicState​

### addAssociation​

### removeAssociation​

### getAssociationData​

### getSupportedGroupings​

### getWakeUpInfo​

### setWakeUpInfo​

### getMeterReading​

### getMeterCapabilities​

### resetMeter​

### getIndicatorValue​

### setIndicatorValue​

### getIndicatorCapabilities​

### getFirmwareInfo​

### requestFirmwareUpdate​

### getFirmwareUpdateStatus​

### requestFirmwareBackup​

### getFirmwareBackupStatus​

### requestFirmwareActivation​

### getFirmwareActivationStatus​

### getNotificationCapabilities​

### getNotificationEventSupport​

### getNotificationState​

### setNotificationState​

### getCentralSceneCapabilities​

### getCentralSceneConfiguration​

### setCentralSceneConfiguration​

### getCentralSceneState​

### getAntiTheftUnlockState​

### setAntiTheftUnlockState​

### setTemperatureThreshold​

### getTemperatureThreshold​

### setIoFunctionBinarySwitch​

### setIoFunctionOneShot​

### setIoFunctionSetReset​

### setIoFunctionToggle​

### removeIoFunction​

### getIoConfiguration​

### getAllNotificationEventSupport​

### getSupportedVersions​

### General error codes​

## Events​

### Battery State Changed Event​

### Binary Switch State Changed Event​

### Multilevel Sensor State Changed Event​

### Node Alive State Changed Event​

### Operation Changed Event​

### The event stream​

## Footnotes​

The VAPIX® Z-Wave™ API provides the information that makes it possible to set up and use the wireless communications protocol found on your Axis device.

The API implements zwave.cgi as its communications interface and supports the following methods:

A Z-Wave network consists of devices (nodes) that can be either controllers or be controlled. Every node has a unique Node ID and a Home ID that identifies the network. This means that nodes with different Home IDs are unable to communicate with each other. Every node in a Z-Wave network has at least one endpoint with an interface to represent the device and its functionality.

Management of the Z-Wave network and the nodes in a network are done through sequential operations. Examples of such operations are "Add node", "Remove node", "Reset network" and "Abort operation". The following tables contains the available operations and statuses.

Available operations

Available operation statuses

S0 and S2 are layers of security that encrypts the data sent between devices on a Z-Wave network. It has been mandatory to use S2 on new devices since 2017. S2 can be divided into unauthenticated and authenticated, the latter including a unique authentication code. A DSK, or Device Specific Key, is used for the authentication.

This feature allows the user to quickly include end devices when turning them on for the first time by adding devices to a provisioning list, thus allowing a manufacturer or service provider to prepare the installation in advance. The end node will announce itself as soon as it is turned on, which results in the automatic inclusion and "out of the box" experience for the end user.

Every device function include groups of commands organized into Command Classes:

The following table details some of the available Command Classes.

Controlled Command Classes

Z-Wave devices are organized into three layers of device classes, with a certain set of requirements that needs to be supported, including mandatory Command Classes. The top layer, also known as the Basic Device Class, defines a device as either a portable controller, a static controller, an end node or a routing end node. The second layer is the Generic Device Class, which defines the main functionality. Finally, to define different variants of a given Generic Device Class, there is the Specific Device Classes.

A Z-Wave device can have a Role Type to indicate the expectations regarding battery and network functionality. See the table Z-Wave+ Role Type identifiers below for a complete list of Role Type identifiers.

Sensor types

Basic Device Class identifiers

Generic Device Class identifiers

Specific Device Class identifiers

Z-Wave+ Role Type identifiers

Node Type identifiers

This example will show you how to set up a Z-Wave network for the first time. By following this example you will be able to:

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See setEnabled for further details.

JSON input parameters

Successful response example

See getEnabled for further details.

JSON input parameters

Successful response example

See addNode for further details.

JSON input parameters

Successful response example

See getOperation for further details.

JSON input parameters

Successful response example

See getS2RequestedKeys for further details.

JSON input parameters

Successful JSON response

See setS2GrantKeys for further details.

JSON input parameters

Successful response example

See getS2DeviceSpecificKey for further details.

JSON input parameters

Successful response example

See acceptS2 for further details.

JSON input parameters

Successful response example

See getNodeList for further details.

JSON input parameters

Successful response example

See getEndpointList for further details.

JSON input parameters

Successful response example

See setEndpointInfo for further details.

This example will show you how to retrieve all available information, such as the battery status, for an end device.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

See getNodeList for further details.

JSON input parameters

Successful response example

See getEndpointList for further details.

JSON input parameters

Successful response example

See getEndpointInterfaceList for further details.

JSON input parameters

Successful response example

See getBatteryState for further details.

This example will show you how to retrieve the last known information for an available end node.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

See getNodeList for further details.

JSON input parameters

Successful response example

See getEndpointList for further details.

JSON input parameters

Successful response example

See getEndpointInterfaceList for further details.

JSON input parameters

Successful response example

See getBatteryState for further details.

This example will show you how to replace a failed node.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

See getNodeList for further details.

JSON input parameters

Successful response example

See replaceFailedNode for further details.

JSON input parameters

Successful response example

See getOperation for further details.

JSON input parameters

Successful response example

See refreshNetwork for further details.

This example will show you how to remove or exclude a Z-Wave device with the wrong security class.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See removeNode for further details.

This example will show you how to remove a faulty node from the Z-Wave network.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See removeFailedNode for further details.

This example will show you how to halt an active operation such as addNode, removeNode or removeFailedNode.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See removeNode for further details.

JSON input parameters

Successful response example

See abortOperation for further details.

This example will show you how to reset the Z-Wave network back to its default factory settings.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See resetNetwork for further details.

This example will show you how to refresh a specific node in the Z-Wave network instead of the entire network and retrieve the latest node status.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See refreshNode for further details.

This example will show you how to use the Z-Wave SmartStart feature to get an out-of-the-box experience. See SmartStart for an explanation about provisioning lists and the concept of SmartStart.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

See addToProvisioningList for further details.

JSON input parameters

Successful response example

See getProvisioningList for further details.

This example will show you how to remove a Z-Wave device that was added with the wrong device specific key from the provisioning list. See SmartStart for an explanation about provisioning lists and the concept of SmartStart.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

SeeremoveFromProvisioningList for further details.

This example will show you how to retrieve a list containing the API versions supported by your device.

Content-Type: application/json

Content-length

<size of JSON input parameters below>

JSON input parameters

Successful response example

Error response example

See getSupportedVersions for further details.

"Only applicable" for response data indicates that it will only be part of the response if the given condition is met.

This method should be used when you want to enable or disable the Z-Wave operation on your device. Please note that it will show up in the system log even if the method fails to start.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the state of the Z-Wave functionality. true means that Z-Wave is running.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to add a new Z-Wave device to the network. In the event that no device is found the process will automatically time out after a minute.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove a Z-Wave device from the network. In the event that no device is found the process will automatically time out after a minute.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve an ongoing Z-Wave network operation. See the Available operations and Available operation statuses tables for available operations and statuses in Operations.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to abort an ongoing network operation. Please note that the stage at which the operation was aborted may affect how much of the operation becomes undone. For example, the device will have already been added to or removed from the Z-Wave network once the status of addNodeStatusProtocolDone or replaceNodeStatusProtocolDone has been reached. Thus, aborting the operation at this stage will only result in the node being added/removed and you need to execute the removeNode or addNode operations manually to undo the operation completely.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to reset the Z-Wave network to the factory default settings. Please note that all devices that are part of the network need to be removed before they can be added back. This can, for example, be done with removeNode.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to refresh the Z-Wave network and its network topology, routing table and internal network data structures.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve either all of, or a subset of available nodes.

Request

JSON input parameters

Return value - Success

Response body syntax

Requested keys of the joining device

Device categories

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the node endpoints.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to list the various endpoint interfaces.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a smaller selection of information from all nodes and endpoints on the Z-Wave network that is otherwise obtained through getNodeList, getEndpointList and getEndpointInterfaceList.

Request

JSON input parameters

Return value - Success

Response body syntax

Warning messages

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to replace a failed node. Please note that this operation will time out automatically if no new node is found within one minute.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove a failed node. Please note that this method can, unlike removeNode, only be used on an unresponsive node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the nicename, a location or both for an endpoint.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to query the S2 security keys.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to grant keys to a node supporting the S2 mode.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a device specific key.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to accept or reject a node in S2 mode.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to refresh a single node on the network and keep the node information up-to-date.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to add end nodes to a provisioning list. See SmartStart for an explanation on provisioning lists and the concept of SmartStart.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove the end nodes from a provisioning list. See SmartStart for an explanation on provisioning lists and the concept of SmartStart.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to list all entries in a provisioning list. See SmartStart for more information about provisioning lists and SmartStart.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current or last known battery status from the end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve either current or last known state(s) of the multilevel sensor. A list of different sensor types and units are specified in the table Sensor types in Role Type.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the supported sensor types from the end node or cached sensor types. A list of different sensor types and units are specified in the table Sensor types in Role Type. This is applicable if the device supports version 5 or above of the Multilevel Sensor Command Class, but all devices will respond to getMultilevelSensorState.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve supported sensor units from the end node or cached sensor units. A list of different sensor types and units are specified in the table Sensor types in Role Type. This is applicable if the device supports version 5 or above of the Multilevel Sensor Command Class, but all devices will respond to getMultilevelSensorState.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the value of a configuration parameter of a device or last known value from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the value of a configuration parameter on your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current binary switch state from the end node, or the last known state stored in the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Duration values

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to turn the binary switch either ON or OFF.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the value of an interface mapped to the basic interface from the end node, or the last known state from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the value of an interface that has been mapped to the basic interface.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to add a new device to a group of devices already communicating with each other.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove a device from a group of communicating devices.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve association data for a group of devices communicating directly with each other from either an end node or the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list of group IDs supported by a specific end node from either the node itself or the cache. More information about supported groupings can be found in your device’s user manual.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve wake-up information, which can include either the minimum or default wake-up interval from the end node or the last known wake-up information from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set a wake-up interval and the node that should be notified.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the meter readings from the end node, or the most recent meter reading from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Available Meter types

Available Meter units

Available Meter rate types

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve meter capabilities information from the end node, or the last known information from the cache. Please note that this method is only applicable if the device supports Meter Command Class version 2 or above, as the behavior will otherwise be returned as ‘undefined’.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to reset all accumulated values stored on the meter device. Please note that this is only applicable if the device supports at least Meter Command Class version 2 of the, as the behavior will otherwise be returned as ‘undefined’.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve all indicator values from an end node, or the last known value from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Available indicators

Available indicator property names and values

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set an indicator value. Please note that, depending on the Command Class version, either value or indicatorName and their properties might need to be supplied.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the indicator capabilities stored in the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the firmware information on the end node, or the last known information in the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to trigger a firmware upgrade request for an end node. Please note that you need to use getFirmwareInfo before calling this method.

Request

JSON input parameters

Return value - Success

Response body syntax

Available firmware update request statuses

Available firmware update completion statuses

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the status of a firmware update request.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to trigger a new firmware backup request for an end node. Please note that you need to use getFirmwareInfo before calling this method and that it is only applicable if the device supports Firmware Update Meta Data Command Class version 5 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Available firmware backup request statuses

Available firmware backup completion statuses.

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the status of a firmware backup request. Please note that this method is only applicable if the device supports Firmware Update Meta Data Command Class version 5 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you wand to trigger a new firmware activation request for an end node. Please note that this method is only applicable if the device supports Firmware Update Meta Data Command Class version 4 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the status of a firmware activation request, but is only applicable if the device supports FIrmware Update Meta Data Command Class version 4 and above.

Request

JSON input parameters

Return value - Success

Response body syntax

Available firmware activation statuses

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the supported alarm/notifications types from either the end node or the last known types from the cache. Please note that this methods is only applicable if the Alarm/Notification Command Class supports version 2 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Common Z-Wave alarm types

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the events supported by a specific alarm/notification type from the end node or the cache. Please note that this method is only applicable if the Alarm/Notification Command Class supports version 3 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the state of the alarm/notification device when it is operating in push mode or a pending notification when operating in pull mode in either the end node or cache. Please note that an alarm/notifications report list should not be used as a history log since newer reports might overwrite older reports.

Request

JSON input parameters

Return value - Success

Response body syntax

Z-Wave alarm statuses

Extended info parameter types definitions

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the state of a specific Z-Wave alarm/notification type when the device is operating in push mode, or clear a persistent notification when the device is operating in pull mode. Please note that this method is only applicable if the Alarm/Notification Command Class supports version 2 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check supported scene capabilities, including the maximum supported scenes and key attributes, of either the end node or cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Central scene key attributes

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the configuration value of a scene notification in the end node. Please note that this methods is only applicable if the Central Scene Command Class supports version 3 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to configure a scene notification. Please note that this methods is only applicable if the Central Scene Command Class supports version 3 or above.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the cached central scene data.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current anti-theft unlock state from either the end node or the last known state from the cache.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to unlock a node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the value for a temperature threshold that will activate when the temperature goes above or below the specified threshold. Omitting any optional parameters means that the current value for those parameters are kept.

Please note that your device needs to support Multilevel Sensor Command Class to use this method.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to check the current settings for the temperature threshold.

Please note that your device needs to support Multilevel Sensor Command Class to use this method.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the binary-switch I/O functionality for an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the One-shot I/O functionality for an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to use the Set and Reset I/O functionality for an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to set the Toggle I/O functionality for an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to remove the I/O functionality from an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current I/O configuration for an end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve all notification events supported by the end node.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list containing API versions supported by your device.

Request

JSON input parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

The following table lists the errors that may occur for any CGI method, while you will find the method specific errors under their corresponding API description. JSON error codes exists in the following ranges:

1100–1199

Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.

1200–1999

API-specific server errors that may collide between different APIs.

2100–2199

Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.

2200–2999

API-specific client errors that may collide between different APIs.

The 4–digit error codes are returned in the JSON body when the service is executed, which means that the client must be prepared to handle transport-level errors codes with non-JSON responses. Specifically, HTTP error 401/403 will be emitted if either authentication or authorization fails.

This event can be invoked whenever a battery state change is detected and contains the interfaceDescriptor, which can be used to retrieve the new battery state.

Battery State Changed Event

This event can be invoked whenever a binary switch state change is detected and contains the interfaceDescriptor, which can be used to retrieve a new binary switch state.

Binary Switch State Changed Event

This event can be invoked whenever a multilevel sensor state change is detected and contains the interfaceDescriptor, which can be used to retrieve a new multilevel sensor state. Additionally, it also contains the sensor type that was changed.

Multilevel Sensor State Changed Event

This event can be invoked whenever a node alive state change is detected and contains both the nodeDescriptor and the new alive state of a node.

Node Alive State Changed Event

This event can be invoked whenever an operation change is detected and contains both the current and new operations, as well as the current operation status.

Operation Changed Event

As a client, you can subscribe to events from the VAPIX/ONVIF event stream described in http://www.onvif.org/onvif/ver10/schema/onvif.xsd . When using VAPIX, you can retrieve the stream over RTSP using the following url:

Can be a valid unit for all sensor types. ↩

Out-of-memory errors are reported as 1100 Internal error. ↩

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "setEnabled",    "params": {        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setEnabled",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setEnabled",    "error": {        "code": 2101,        "message": "Invalid JSON"    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEnabled"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEnabled",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "addNode"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "addNode",    "data": {}}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getOperation"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getOperation",    "data": {        "net": {            "operation": { "code": 0, "name": "operationNone" },            "operationStatus": { "status": 0, "name": "operationStatusNone" },            "prevOperation": { "code": 2, "name": "operationAddNode" }        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getS2RequestedKeys"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getS2RequestedKeys",    "data": {        "net": {            "security": {                "requestedKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]            }        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "setS2GrantKeys",    "params": {        "grantKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setS2GrantKeys",    "data": {}}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getS2DeviceSpecificKey"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getS2DeviceSpecificKey",    "data": {        "net": {            "security": {                "pinRequired": true,                "deviceSpecificKey": "-21937-31611-47722-25563-33846-11886-19448"            }        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "acceptS2",    "params": {        "accept": true,        "deviceSpecificKey": "09407-21937-31611-47722-25563-33846-11886-19448"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "acceptS2",    "data": {}}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getNodeList"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getNodeList",    "data": {        "net": {            "node": [                {                    "nodeDescriptor": 1,                    "nodeID": 6,                    "nodeProperty": {                        "securityCapabilities": ["S0", "S2"],                        "includedSecurely": true,                        "supportIdentification": false                    },                    "vendorID": 868,                    "vendorProductID": 1,                    "vendorProductType": 3,                    "deviceCategory": {                        "name": "onOffSwitch",                        "code": 2                    },                    "nodeAliveState": "sleeping",                    "isSecure": true,                    "secureInclusionFailed": false,                    "isFLiRSCapable": false,                    "isSleepCapable": true,                    "s2GrantKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEndpointList",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEndpointList",    "data": {        "node": {            "nodeDescriptor": 1,            "endpoint": [                {                    "endpointDescriptor": 1,                    "endpointID": 2,                    "genericDeviceClass": {                        "name": "switchBinary",                        "code": 16                    },                    "specificDeviceClass": {                        "name": "powerSwitch",                        "code": 1                    },                    "endpointName": "Mini plug",                    "endpointLocation": "Office",                    "zwavePlusVersion": 1,                    "roleType": {                        "name": "alwaysOnSlave",                        "code": 5                    },                    "nodeType": {                        "name": "zwavePlusNode",                        "code": 0                    },                    "installerIcon": 1792,                    "userIcon": 1792,                    "aggregatedEndpointList": []                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "setEndpointInfo",    "params": {        "endpointDescriptor": 1,        "name": "Freezer 1",        "location": "Kitchen"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "setEndpointInfo",    "data": {}}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getNodeList"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getNodeList",    "data": {        "net": {            "node": [                {                    "nodeDescriptor": 1,                    "nodeID": 6,                    "nodeProperty": {                        "securityCapabilities": ["S0", "S2"],                        "includedSecurely": true,                        "supportIdentification": false                    },                    "vendorID": 868,                    "vendorProductID": 1,                    "vendorProductType": 3,                    "deviceCategory": {                        "name": "onOffSwitch",                        "code": 2                    },                    "nodeAliveState": "sleeping",                    "isSecure": true,                    "secureInclusionFailed": false,                    "isFLiRSCapable": false,                    "isSleepCapable": true,                    "s2GrantKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEndpointList",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEndpointList",    "data": {        "node": {            "nodeDescriptor": 1,            "endpoint": [                {                    "endpointDescriptor": 1,                    "endpointID": 2,                    "genericDeviceClass": {                        "name": "switchBinary",                        "code": 16                    },                    "specificDeviceClass": {                        "name": "powerSwitch",                        "code": 1                    },                    "endpointName": "Mini plug",                    "endpointLocation": "Office",                    "zwavePlusVersion": 1,                    "roleType": {                        "name": "alwaysOnSlave",                        "code": 5                    },                    "nodeType": {                        "name": "zwavePlusNode",                        "code": 0                    },                    "installerIcon": 1792,                    "userIcon": 1792,                    "aggregatedEndpointList": []                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEndpointInterfaceList",    "params": {        "endpointDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEndpointInterfaceList",    "data": {        "endpoint": {            "endpointDescriptor": 1,            "interface": [                {                    "interfaceDescriptor": 8388870,                    "name": "battery",                    "simulatedVersion": 1,                    "realVersion": 1,                    "accessSupport": {                        "secure": false,                        "unsecure": true                    }                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getBatteryState",    "params": {        "interfaceDescriptor": 8388870,        "refresh": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getBatteryState",    "data": {        "interface": {            "interfaceDescriptor": 8388870,            "battery": {                "lastUpdated": "202101126T092334",                "level": 50            }        }    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getNodeList"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getNodeList",    "data": {        "net": {            "node": [                {                    "nodeDescriptor": 1,                    "nodeID": 6,                    "nodeProperty": {                        "securityCapabilities": ["S0", "S2"],                        "includedSecurely": true,                        "supportIdentification": false                    },                    "vendorID": 868,                    "vendorProductID": 1,                    "vendorProductType": 3,                    "deviceCategory": {                        "name": "onOffSwitch",                        "code": 2                    },                    "nodeAliveState": "sleeping",                    "isSecure": true,                    "secureInclusionFailed": false,                    "isFLiRSCapable": false,                    "isSleepCapable": true,                    "s2GrantKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEndpointList",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEndpointList",    "data": {        "node": {            "nodeDescriptor": 1,            "endpoint": [                {                    "endpointDescriptor": 1,                    "endpointID": 2,                    "genericDeviceClass": {                        "name": "switchBinary",                        "code": 16                    },                    "specificDeviceClass": {                        "name": "powerSwitch",                        "code": 1                    },                    "endpointName": "Mini plug",                    "endpointLocation": "Office",                    "zwavePlusVersion": 1,                    "roleType": {                        "name": "alwaysOnSlave",                        "code": 5                    },                    "nodeType": {                        "name": "zwavePlusNode",                        "code": 0                    },                    "installerIcon": 1792,                    "userIcon": 1792,                    "aggregatedEndpointList": []                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getEndpointInterfaceList",    "params": {        "endpointDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getEndpointInterfaceList",    "data": {        "endpoint": {            "endpointDescriptor": 1,            "interface": [                {                    "interfaceDescriptor": 8388870,                    "name": "battery",                    "simulatedVersion": 1,                    "realVersion": 1,                    "accessSupport": {                        "secure": false,                        "unsecure": true                    }                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getBatteryState",    "params": {        "interfaceDescriptor": 8388870,        "refresh": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getBatteryState",    "data": {        "interface": {            "interfaceDescriptor": 8388870,            "battery": {                "lastUpdated": "202101126T092334",                "level": 50            }        }    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getNodeList"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getNodeList",    "data": {        "net": {            "node": [                {                    "nodeDescriptor": 1,                    "nodeID": 6,                    "nodeProperty": {                        "securityCapabilities": ["S0", "S2"],                        "includedSecurely": true,                        "supportIdentification": false                    },                    "vendorID": 868,                    "vendorProductID": 1,                    "vendorProductType": 3,                    "deviceCategory": {                        "name": "onOffSwitch",                        "code": 2                    },                    "nodeAliveState": "sleeping",                    "isSecure": true,                    "secureInclusionFailed": false,                    "isFLiRSCapable": false,                    "isSleepCapable": true,                    "s2GrantKeys": ["S2Key0", "S2Key1", "S0LegacyKey"]                }            ]        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "replaceFailedNode",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "replaceFailedNode",    "data": {}}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getOperation"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getOperation",    "data": {        "net": {            "operation": { "code": 0, "name": "operationNone" },            "operationStatus": { "status": 0, "name": "operationStatusNone" },            "prevOperation": { "code": 2, "name": "operationAddNode" }        }    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "refreshNetwork"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "refreshNetwork",    "data": {}}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "removeNode"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeNode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeNode",    "error": {        "code": 2101,        "message": "Invalid JSON"    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "removeFailedNode",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeFailedNode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeFailedNode",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "removeNode"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeNode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeNode",    "error": {        "code": 2101,        "message": "Invalid JSON"    }}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "abortOperation"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "abortOperation",    "data": {}}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "resetNetwork"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "resetNetwork",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "resetNetwork",    "error": {        "code": 2101,        "message": "Invalid JSON"    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "refreshNode",    "params": {        "nodeDescriptor": 1    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "refreshNode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "refreshNode",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "addToProvisioningList",    "params": {        "deviceSpecificKey": "09407-21937-31611-47722-25563-33846-11886-19448"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "addToProvisioningList",    "data": {}}
```

```
{    "apiVersion": "1",    "context": "context",    "method": "getProvisioningList"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getProvisioningList",    "data": {        "net": {            "complete": true,            "deviceInfo": [                {                    "deviceSpecificKey": "09407-21937-31611-47722-25563-33846-11886-19448",                    "name": "",                    "location": "",                    "networkStatus": "included"                }            ]        }    }}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "apiVersion": "1",    "context": "context",    "method": "removeFromProvisioningList",    "params": {        "deviceSpecificKey": "09407-21937-31611-47722-25563-33846-11886-19448"    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "removeFromProvisioningList",    "data": {}}
```

```
POST http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{    "context": "context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setEnabled",  "params": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setEnabled",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setEnabled",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getEnabled"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEnabled",  "data": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEnabled",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "addNode",  "params": {    "deviceSpecificKey": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addNode",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addNode",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "removeNode"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeNode",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeNode",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getOperation"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getOperation",  "data": {    "net": {      "operation": {"code": <integer>, "name": <string>},      "operationStatus": {"status": <integer>, "name": <string>},      "prevOperation": {"code": <integer>, "name": <string>}    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getOperation",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "abortOperation"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "abortOperation",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "abortOperation",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "resetNetwork"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "resetNetwork",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "resetNetwork",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "refreshNetwork"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "refreshNetwork",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "refreshNetwork",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getNodeList",  "params": {    "nodeIDs": [<integer>]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNodeList",  "data": {    "net": {      "node": [        {          "nodeDescriptor": <integer>,          "nodeID": <integer>,          "nodeProperty": {            "securityCapabilities": [<string>],            "includedSecurely": <boolean>,            "supportIdentification": <boolean>          },          "vendorID": <integer>,          "vendorProductID": <integer>,          "vendorProductType": <integer>,          "deviceCategory": {            "name": <string>,            "code": <integer>          },          "nodeAliveState": <string>,          "isSecure": <boolean>,          "secureInclusionFailed": <boolean>,          "isFLiRSCapable": <boolean>,          "isSleepCapable": <boolean>,          "s2GrantKeys": [<string>]        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNodeList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getEndpointList",  "params": {    "nodeDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEndpointList",  "data": {    "node": {      "nodeDescriptor": <integer>,      "endpoint": [        {          "endpointDescriptor": <integer>,          "endpointID": <integer>,          "genericDeviceClass": {            "name": <string>,            "code": <integer>          },          "specificDeviceClass": {            "name": <string>,            "code": <integer>          },          "endpointName": <string>,          "endpointLocation": <string>,          "zwavePlusVersion": <integer>,          "roleType": {            "name": <string>,            "code": <integer>          },          "nodeType": {            "name": <string>,            "code": <integer>          },          "installerIcon": <integer>,          "userIcon": <integer>,          "aggregatedEndpointList": [<integer>]        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEndpointList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getEndpointInterfaceList",  "params": {    "endpointDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEndpointInterfaceList",  "data": {    "endpoint": {      "endpointDescriptor": <integer>,      "interface": [        {          "interfaceDescriptor": <integer>,          "name": <string>,          "simulatedVersion": <integer>,          "realVersion": <integer>,          "accessSupport": {            "secure": <boolean>,            "unsecure": <boolean>          }        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEndpointInterfaceList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getSummaryList"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSummaryList",  "data": {    "net": {      "node": [        {          "descriptor": <integer>,          "id": <integer>,          "deviceCategory": <string>,          "aliveState": <string>,          "securityWarning": <string>,          "endpoint": [            {              "descriptor": <integer>,              "name": <string>,              "genericDeviceClassName": <string>,              "specificDeviceClassName": <string>,              "portNumber": <integer>,              "interface": [                {                  "descriptor": <integer>,                  "name": <string>                }              ]            }          ]        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSummaryList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "replaceFailedNode",  "params": {    "nodeDescriptor": <integer>,    "deviceSpecificKey": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "replaceFailedNode",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "replaceFailedNode",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "removeFailedNode",  "params": {    "nodeDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeFailedNode",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeFailedNode",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setEndpointInfo",  "params": {    "endpointDescriptor": <integer>,    "name": <string>,    "location": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setEndpointInfo",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setEndpointInfo",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getS2RequestedKeys"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getS2RequestedKeys",  "data": {    "net": {      "security": {        "requestedKeys": [<string>]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getS2RequestedKeys",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setS2GrantKeys"  "params": {    "grantKeys": [<string>],    "accept": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setS2GrantKeys",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setS2GrantKeys",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getS2DeviceSpecificKey"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getS2DeviceSpecificKey",  "data": {    "net": {      "security": {        "pinRequired": <boolean>,        "deviceSpecificKey": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getS2DeviceSpecificKey",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "acceptS2",  "params": {    "accept": <boolean>,    "deviceSpecificKey": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "acceptS2",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "acceptS2",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "refreshNode",  "params": {    "nodeDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "refreshNode",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "refreshNode",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "addToProvisioningList",  "params": {    "deviceSpecificKey": <string>,    "name": <string>,    "location": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addToProvisioningList",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addToProvisioningList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "removeFromProvisioningList",  "params": {    "deviceSpecificKey": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeFromProvisioningList",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeFromProvisioningList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getProvisioningList"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getProvisioningList",  "data": {    "net": {      "complete": <boolean>,      "deviceInfo": [        {          "deviceSpecificKey": <string>,          "name": <string>,          "location": <string>,          "networkStatus": <string>        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getProvisioningList",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getBatteryState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBatteryState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "battery": {        "lastUpdated": <string>,        "level": <integer>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBatteryState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getMultilevelSensorState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "type": <string>,    "unit": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "multilevelSensor": [        {          "lastUpdated": <string>,          "type": <string>,          "value": <number>,          "precision": <integer>,          "unit": <string>        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getMultilevelSensorSupport",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorSupport",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "multilevelSensor": {        "lastUpdated": <string>,        "sensorTypeList": [<string>]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorSupport",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getMultilevelSensorUnitSupport",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "sensorType": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorUnitSupport",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "multilevelSensor": {        "lastUpdated": <string>,        "sensorType": <string>,        "sensorUnitList": [<string>]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMultilevelSensorUnitSupport",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getConfiguration",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "paramNum": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getConfiguration",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "configuration": {        "lastUpdated": <string>,        "paramNum": <integer>,        "paramValue": <number>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getConfiguration",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setConfiguration",  "params": {    "interfaceDescriptor": <integer>,    "paramNum": <integer>,    "useDefault": <boolean>,    "paramValue": <number>,    "paramSize": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setConfiguration",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setConfiguration",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getBinarySwitchState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBinarySwitchState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "binarySwitch": {        "lastUpdated": <string>,        "currentState": <boolean>,        "targetState": <boolean>,        "duration": <integer>,        "stateNum": <integer>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBinarySwitchState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setBinarySwitchState",  "params": {    "interfaceDescriptor": <integer>,    "value": <boolean>,    "duration": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setBinarySwitchState",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setBinarySwitchState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getBasicState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBasicState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "basic": {        "lastUpdated": <string>,        "currentState": <integer>,        "targetState": <integer>,        "duration": <integer>,        "stateNum": <integer>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getBasicState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setBasicState",  "params": {    "interfaceDescriptor": <integer>,    "value": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setBasicState",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setBasicState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "addAssociation",  "params": {    "interfaceDescriptor": <integer>,    "groupID": <integer>,    "memberCount": <integer>,    "members": [      {        "nodeID": <integer>,        "endpointID": <integer>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addAssociation",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "addAssociation",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "removeAssociation",  "params": {    "interfaceDescriptor": <integer>,    "groupID": <integer>,    "memberCount": <integer>,    "members": [      {        "nodeID": <integer>,        "endpointID": <integer>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeAssociation",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeAssociation",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getAssociationData",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "groupID": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAssociationData",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "association": {        "lastUpdated": <string>,        "groupID": <integer>,        "maxCount": <integer>,        "members": [          {            "nodeID": <integer>,            "endpointID": <integer>          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAssociationData",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getSupportedGroupings",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedGroupings",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "association": {        "lastUpdated": <string>,        "groupIDs": [<integer>]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedGroupings",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getWakeUpInfo",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getWakeUpInfo",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "wakeUp": {        "lastUpdated": <string>,        "currentInterval": <integer>,        "nodeID": <integer>,        "minInterval": <integer>,        "maxInterval": <integer>,        "defaultInterval": <integer>,        "intervalStep": <integer>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getWakeUpInfo",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setWakeUpInfo",  "params": {    "interfaceDescriptor": <integer>,    "wakeUpInterval": <integer>,    "nodeID": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setWakeUpInfo",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setWakeUpInfo",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getMeterReading",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "unit": <string>,    "rateType": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMeterReading",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "meter": [        {          "lastUpdated": <string>,          "type": <string>,          "value": <number>,          "precision": <integer>,          "unit": <string>,          "rateType": <string>,          "delta": <integer>,          "prevValue": <number>        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMeterReading",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getMeterCapabilities",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMeterCapabilities",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "meter": [        {          "lastUpdated": <string>,          "type": <string>,          "units": [<string>],          "reset": <boolean>,          "rateType": <string>        }      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMeterCapabilities",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "resetMeter",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "resetMeter",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "resetMeter",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getIndicatorValue",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "indicatorName": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIndicatorValue",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "indicator": {        "lastUpdated": <string>,        "value": <integer>,        "indicatorName": <string>,        "stateNum": <integer>,        "properties": [          {            "name": <string>,            "value": <integer>          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIndicatorValue",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setIndicatorValue",  "params": {    "interfaceDescriptor": <integer>,    "value": <integer>,    "indicatorName": <string>    "properties": [      {        "name": <string>,        "value": <integer>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIndicatorValue",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIndicatorValue",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getIndicatorCapabilities",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIndicatorCapabilities",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "indicator": {        "lastUpdated": <string>,        "indicatorSupport": [          {            "indicatorName": <string>,            "propertyNameList": [<string>]          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIndicatorCapabilities",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getFirmwareInfo",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareInfo",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "lastUpdated": <string>,        "vendorID": <integer>,        "zwaveFirmwareID": <integer>,        "checksum": <integer>,        "maxFragmentSize": <integer>,        "fixedFragmentSize": <integer>,        "upgradable": <boolean>,        "hardwareVersionValid": <boolean>,        "hardwareVersion": <integer>,        "upgradeFunctionality": <string>,        "activation": <string>,        "firmwareTargets": [          {            "firmwareTarget": <integer>,            "firmwareID": <integer>          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareInfo",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "requestFirmwareUpdate",  "params": {    "interfaceDescriptor": <integer>,    "vendorID": <integer>,    "firmwareTarget": <integer>,    "firmwareID": <integer>,    "fileName": <string>,    "hardwareVersion": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareUpdate",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "latestRequestTime": <string>,        "requestStatus": <string>,        "completionStatus": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareUpdate",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getFirmwareUpdateStatus",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareUpdateStatus",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "latestRequestTime": <string>,        "requestStatus": <string>,        "completionStatus": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareUpdateStatus",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "requestFirmwareBackup",  "params": {    "interfaceDescriptor": <integer>,    "vendorID": <integer>,    "firmwareTarget": <integer>,    "firmwareID": <integer>,    "hardwareVersion": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareBackup",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "latestRequestTime": <string>,        "requestStatus": <string>,        "completionStatus": <string>,        "backupPath": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareBackup",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getFirmwareBackupStatus",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareBackupStatus",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "latestRequestTime": <string>,        "requestStatus": <string>,        "completionStatus": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareBackupStatus",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "requestFirmwareActivation",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareActivation",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "latestRequestTime": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "requestFirmwareActivation",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getFirmwareActivationStatus",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareActivationStatus",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "firmwareUpdate": {        "vendorID": <integer>,        "firmwareTarget": <integer>,        "firmwareID": <integer>,        "hardwareVersion": <integer>,        "checksum": <integer>,        "latestRequestTime": <string>,        "requestStatus": <string>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getFirmwareActivationStatus",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getNotificationCapabilities",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationCapabilities",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "notification": {        "lastUpdated": <string>,        "hasVendorSpecificType": <boolean>,        "zwaveAlarmTypeList": [          {            "type": <string>,            "code": <integer>          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationCapabilities",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getNotificationEventSupport",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "zwaveAlarmType": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationEventSupport",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "notification": {        "lastUpdated": <string>,        "zwaveAlarmType": <string>,        "zwaveEventList": [<integer>]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationEventSupport",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getNotificationState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>,    "vendorAlarmType": <integer>,    "zwaveAlarmType": <string>,    "zwaveEvent": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "notification": {        "report": {          "lastUpdated": <string>,          "vendorAlarmType": <integer>,          "vendorAlarmLevel": <integer>,          "extendedInfoValid": <boolean>,          "extendedInfoAlarmStatus": <string>,          "extendedInfoAlarmType": <string>,          "extendedInfoAlarmEvent": <integer>,          "extendedInfoParameterLength": <integer>,          "extendedInfoParameterType": <string>,          "extendedInfoParameter": <integer>,          "extendedInfoLocation": <string>        }      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getNotificationState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setNotificationState",  "params": {    "interfaceDescriptor": <integer>,    "zwaveAlarmType": <string>,    "status": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setNotificationState",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setNotificationState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getCentralSceneCapabilities",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneCapabilities",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "centralScene": {        "lastUpdated": <string>,        "maxSceneCount": <integer>,        "slowRefresh": <boolean>,        "keyAttributes": [          {            "sceneNumber": <integer>,            "support": [<string>]          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneCapabilities",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getCentralSceneConfiguration",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneConfiguration",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "centralScene": {        "lastUpdated": <string>,        "slowRefresh": <boolean>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneConfiguration",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setCentralSceneConfiguration",  "params": {    "interfaceDescriptor": <integer>,    "slowRefresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setCentralSceneConfiguration",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setCentralSceneConfiguration",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getCentralSceneState",  "params": {    "interfaceDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "centralScene": {        "lastUpdated": <string>,        "sequenceNumber": <integer>,        "keyAttribute": <string>,        "sceneNumber": <integer>,        "slowRefresh": <boolean>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCentralSceneState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getAntiTheftUnlockState",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAntiTheftUnlockState",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "antiTheftUnlock": {        "lastUpdated": <string>,        "stateNum": <integer>,        "state": <boolean>,        "restricted": <boolean>,        "hint": <string>,        "manufacturerID": <integer>,        "entityID": <integer>      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAntiTheftUnlockState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setAntiTheftUnlockState",  "params": {    "interfaceDescriptor": <integer>,    "code": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setAntiTheftUnlockState",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setAntiTheftUnlockState",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setTemperatureThreshold",  "params": {    "endpointDescriptor": <integer>,    "active": <boolean>,    "warningRule": <string>,    "threshold": <integer>,    "unit": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTemperatureThreshold",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setTemperatureThreshold",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getTemperatureThreshold",  "params": {    "endpointDescriptor": <integer>,    "unit": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getTemperatureThreshold",  "data": {    "active": <boolean>,    "warningRule": <string>,    "threshold": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getTemperatureThreshold",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setIoFunctionBinarySwitch",  "params": {    "endpointDescriptor": <integer>,    "ioPortNumber": <integer>,    "invert": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionBinarySwitch",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionBinarySwitch",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setIoFunctionOneShot",  "params": {    "endpointDescriptor": <integer>,    "ioPortNumber": <integer>,    "alarmType": <integer>,    "event": <integer>,    "invert": <boolean>,    "duration": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionOneShot",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionOneShot",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setIoFunctionSetReset",  "params": {    "endpointDescriptor": <integer>    "ioPortNumber": <integer>,    "setAlarmType": <integer>,    "setEvent": <integer>,    "resetAlarmType": <integer>,    "resetEvent": <integer>,    "invert": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionSetReset",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionSetReset",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "setIoFunctionToggle",  "params": {    "endpointDescriptor": <integer>,    "ioPortNumber": <string>,    "alarmType": <integer>,    "event": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionToggle",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoFunctionToggle",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "removeIoFunction",  "params": {    "endpointDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeIoFunction",  "data": {}}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "removeIoFunction",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getIoConfiguration",  "params": {    "endpointDescriptor": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIoConfiguration",  "data": {    "endpointDescriptor": <integer>,    "ioConfiguration": {      "ioFunction": <string>,      "enabled": <boolean>,      "ioPortNumber": <integer>,      "alarmType": <integer>,      "event": <integer>,      "resetAlarmType": <integer>,      "resetEvent": <integer>,      "invert": <boolean>,      "duration": <integer>    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIoConfiguration",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "apiVersion": "<Major>",  "context": <string>,  "method": "getAllNotificationEventSupport",  "params": {    "interfaceDescriptor": <integer>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAllNotificationEventSupport",  "data": {    "interface": {      "interfaceDescriptor": <integer>,      "notification": {        "lastUpdated": <string>,        "zwaveAlarmTypeList": [          {            "type": <string>,            "code": <integer>,            "zwaveEventList": [              {                "type": <string>,                "code": <integer>              }            ]          }        ]      }    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getAllNotificationEventSupport",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
http://<servername>/axis-cgi/zwave.cgi HTTP/1.1
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [ "<Major1>.<Minor1>", "<Major2>.<Minor2>" ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <error message>  }}
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event>        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:ZWave/batteryState/Changed            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://5195f286-aa2f-46b6-9bce-930d35856e27/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2021-06-23T07:30:52.335597Z">                    <tt:Source>                        <tt:SimpleItem Name="interfaceDescriptor" Value="8388873" />                    </tt:Source>                    <tt:Data />                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event>        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:ZWave/binarySwitchState/Changed            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://5195f286-aa2f-46b6-9bce-930d35856e27/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2021-06-23T08:36:15.504761Z">                    <tt:Source>                        <tt:SimpleItem Name="interfaceDescriptor" Value="2425094" />                    </tt:Source>                    <tt:Data />                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event>        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:ZWave/multilevelSensorState/Changed            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://5195f286-aa2f-46b6-9bce-930d35856e27/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2021-06-23T08:45:45.956367Z">                    <tt:Source>                        <tt:SimpleItem Name="interfaceDescriptor" Value="3211530" />                    </tt:Source>                    <tt:Data>                        <tt:SimpleItem Name="sensorType" Value="lumSensor" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event>        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:ZWave/nodeState/Changed            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://5195f286-aa2f-46b6-9bce-930d35856e27/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2021-06-23T08:43:33.660643Z">                    <tt:Source>                        <tt:SimpleItem Name="nodeDescriptor" Value="6" />                    </tt:Source>                    <tt:Data>                        <tt:SimpleItem Name="aliveState" Value="unavailable" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event>        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:ZWave/operation/Changed            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://5195f286-aa2f-46b6-9bce-930d35856e27/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2021-06-23T08:41:18.833203Z">                    <tt:Source>                        <tt:SimpleItem Name="operation" Value="operationAddNode" />                    </tt:Source>                    <tt:Data>                        <tt:SimpleItem Name="status" Value="operationStatusNone" />                        <tt:SimpleItem Name="prevOperation" Value="operationNone" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
rtsp://<servername>/axis-media/media.amp?event=on&eventtopic=onvif:Device/axis:ZWave//
```

- A node can support a command class, which means that the node will implement all Command Class functions.
- A node can control a Command Class, which means that the node is able to interact with other nodes by using a subset of the commands available in a Command Class

- API Discovery: id=zwave

- Add a new device to the Z-Wave network
- Add a node and give it a niceName

- Enable Z-Wave.

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Use getEnabledto check if Z-Wave is enabled:

- Parse the JSON response.

- A node can be added to the network once Z-Wave has been successfully enabled.

- Parse the JSON response.

- Check the user manual to see how to set the device you wish to add to the network to learn mode. This will start the inclusion, which means you can then use getOperation to retrieve the current status information:

- Parse the JSON response.

- The controller is ready when operationAddNode and the status addNodeStatusRequestedKeyReady have been reached in the previous example. You will then be able to make a query to request keys:

- Parse the JSON response.

- The response data can be used in an array of strings with the parameter grantKeys.

- Parse the JSON response.

- This step uses operationAddNode, and the status addNodeStatusDSKReady, to retrieve device specific keys (DSK) with the following request:

- Parse the JSON response.

- Add the five digit pin to the device included by the integrator. The following request makes the client accept the newly added node into S2 mode:

- Parse the JSON response.

- The node will become part of the network and listed alongside all available nodes and their descriptors:

- Parse the JSON response.

- List all endpoints to retrieve the endpoint descriptor with help from the node descriptor received in the previous step . This is useful when you want to give the new node a nicename.

- Parse the JSON response.

- Finally, with the endpoint descriptor in place, the node can be given a nicename.

- Parse the JSON response.

- List all available nodes.

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- The descriptor from the previous example along with the following example will show all information associated with this endpoint.

- Parse the JSON response.

- Next, list all available interfaces for that endpoint:

- Parse the JSON response.

- Using interfaceDescriptor for the battery interface retrieves the battery state:

- Parse the JSON response.

- List all available nodes.

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- The descriptor from the previous example, together with the following example, will present all information associated with the endpoint.

- Parse the JSON response.

- This call will list all available interfaces for a particular endpoint:

- Parse the JSON response.

- The interfaceDescriptor for the battery interface will retrieve the battery state:

- Parse the JSON response.

- List all available nodes.

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Replace the faulty node.

- Parse the JSON response.

- Setting the replacing device to learn mode, which in this example is one without S2 security, will integrate it into the Z-Wave network. The method getOperation will then check if the operation is complete and if operationAddNode is replaced by operationNone.

- Parse the JSON response.

- The network change may cause the network topology, routing tables and internal network structures to no longer be up-to-date. It is therefore recommended to refresh the network with the following step:

- Parse the JSON response.

- Put the device to learn mode and exclude it from the network with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Remove the faulty node from the network with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Remove a node from the network with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- In this example, the node should ultimately not be removed. To abort the operation, the following method should be used before a one minute timeout is completed.

- Parse the JSON response.

- Reset the network to factory default with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Refresh the node with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Add an end node to the provisioning list with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Check the provisioning list to make sure the end node was added.

- Parse the JSON response.

- Remove the end node from the provisioning list with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Retrieve a list containing supported API versions with the following steps:

- Content-Type: application/json
- Content-length
<size of JSON input parameters below>

- Parse the JSON response.

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- 1100–1199
Generic error codes common for many APIs and reserved for server errors such as "Maximum number of configurations reached". The actual cause can be seen in the server log and can sometimes be solved by restarting the device.
- 1200–1999
API-specific server errors that may collide between different APIs.
- 2100–2199
Generic error codes common to many APIs and reserved for client errors such as "Invalid parameter". These errors should be possible to solve by changing the input data to the API.
- 2200–2999
API-specific client errors that may collide between different APIs.

- Can be a valid unit for all sensor types. ↩
- Out-of-memory errors are reported as 1100 Internal error. ↩

| Method | Description |
| --- | --- |
| setEnabled | Enables/disables the Z-Wave functionality. |
| getEnabled | Retrieves the currently enabled state of Z-Wave. |
| addNode | Adds a node to the network. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| removeNode | Removes a node from the network. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| getOperation | Retrieves the current network operation. |
| abortOperation | Aborts the current network operation. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| resetNetwork | Resets the network operation back to its factory default settings. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| refreshNetwork | Refreshes the network operation (topology, routing table, etc.). Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| getNodeList | Retrieves a list containing all, or a subset, of existing network nodes. |
| getEndpointList | Lists the node endpoints. |
| getEndpointInterfaceList | Lists and describes the endpoint interfaces. |
| getSummaryList | Retrieves a subset of the information obtained with getNodeList, getEndpointList and getEndpointInterfaceList on all network nodes and endpoints. |
| replaceFailedNode | Replaces a failed network node. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| removeFailedNode | Removes a failed network node. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| setEndpointInfo | Sets the name and/or location for an endpoint. |
| getS2RequestedKeys | Queries for requested S2 keys. |
| setS2GrantKeys | Grants keys to a new node while using the S2 mode. |
| getS2DeviceSpecificKey | Retrieves the S2 device specific key. |
| acceptS2 | Accepts or rejects a newly added node while using the S2 mode. |
| refreshNode | Refreshes a single Z-Wave network node. Please note that this is an asynchronous operation, which means that you must use getOperation to find out when the operation is completed. |
| addToProvisioningList | Adds an entry to the provisioning list. |
| removeFromProvisioningList | Removes an entry from the provisioning list. |
| getProvisioningList | Lists all provisioning entries. |
| getBatteryState | Retrieves the current battery state from the end node or the last known state from the cache. |
| getMultilevelSensorState | Retrieves the current state(s) of the multilevel sensor from the end node or the last known state(s) from the cache. |
| getMultilevelSensorSupport | Retrieves the supported sensor types from the end node or the cached supported sensor types. |
| getMultilevelSensorUnitSupport | Retrieves the supported sensor units from the end node or the cached supported sensor units. |
| getConfiguration | Retrieves the configuration parameter value from the end node or the last known value from the cache. |
| setConfiguration | Sets the value of a configuration parameter. |
| getBinarySwitchState | Retrieves the current state of the binary switch from the end node or the last known state from the cache. |
| setBinarySwitchState | Turns the binary switch ON or OFF. |
| getBasicState | Retrieves the current interface value mapped to the basic interface from the node or the last known state from the cache. |
| setBasicState | Sets the interface value mapped to the basic interface. |
| addAssociation | Adds a device to a group communicating directly with each other. |
| removeAssociation | Removes a device from a group communicating directly with each other. |
| getAssociationData | Retrieves association data for a group of devices capable of communicating with each other from either the end node or the cache. |
| getSupportedGroupings | Retrieves a list of group IDs supported by an end node from either the end node itself or the cache. |
| getWakeUpInfo | Retrieves the wake-up information from the end node or the most recent wake-up information from the cache. |
| setWakeUpInfo | Sets the wake-up interval and selects the node that should be notified. |
| getMeterReading | Retrieves the meter readings from the end node or the most recent meter reading from the cache. |
| getMeterCapabilities | Retrieves the meter capabilities information from the end node or the most recent meter capabilities from the cache. |
| resetMeter | Resets all accumulated values stored in the meter device. |
| getIndicatorValue | Retrieves the indicator values from the end node or the most recent indicator value from the cache. |
| setIndicatorValue | Sets an indicator value. |
| getIndicatorCapabilities | Retrieves all supported indicator information from the cache. |
| getFirmwareInfo | Retrieves firmware information from the end node or the most recent information from the cache. |
| requestFirmwareUpdate | Triggers a new firmware update request for an end node. |
| getFirmwareUpdateStatus | Retrieves the firmware update status for an end node. |
| requestFirmwareBackup | Triggers a new firmware backup request for an end node. |
| getFirmwareBackupStatus | Retrieves the firmware backup status for an end node. |
| requestFirmwareActivation | Triggers a new firmware activation request for an end node. |
| getFirmwareActivationStatus | Retrieves the firmware activation status for an end node. |
| getNotificationCapabilities | Retrieves the supported alarm/notification types from either the end node or the most recent types from the cache. |
| getNotificationEventSupport | Retrieves the supported events of a specified alarm/notification type from either an end node or the cache. |
| getNotificationState | Retrieves the state of the alarm/notification device or a pending notification from either the device or the cache. |
| setNotificationState | Sets the state of the specified Z-Wave alarm type or clears out a persistent notification. |
| getCentralSceneCapabilities | Retrieves capabilities like the maximum number of supported scenes along with their supported key attributes from either the end node or the cache. |
| getCentralSceneConfiguration | Retrieves the value of the scene notification configuration from an end node. |
| setCentralSceneConfiguration | Configures the scene notification settings. |
| getCentralSceneState | Retrieves the cached central scene data. |
| getAntiTheftUnlockState | Retrieves the Anti-Theft Unlock state from either the end node or the cache. |
| setAntiTheftUnlockState | Unlocks a node. |
| setTemperatureThreshold | Sets the temperature threshold for temperature events. |
| getTemperatureThreshold | Retrieves the temperature threshold settings from a temperature event. |
| setIoFunctionBinarySwitch | Sets I/O to Binary-switch. |
| setIoFunctionOneShot | Sets I/O to One-shot. |
| setIoFunctionSetReset | Sets I/O to Set/Reset. |
| setIoFunctionToggle | Set I/O to Toggle. |
| removeIoFunction | Removes the I/O functionality. |
| getIoConfiguration | Retrieves the current I/O configuration from an end node. |
| getAllNotificationEventSupport | Retrieves the supported events from a specified end node. |
| getSupportedVersions | Retrieves the API versions supported by your product. |

| Operation | Operation code | Description |
| --- | --- | --- |
| operationNone | 0 | No operation is in progress. |
| operationInitialize | 1 | Initializes the operation. |
| operationAddNode | 2 | Adds a node. |
| operationRemoveNode | 3 | Removes a node. |
| operationReplaceFailedNode | 4 | Replaces a failed node. |
| operationRemoveFailedNode | 5 | Removes a failed node. |
| operationRefreshNetwork | 7 | Refreshes the network. |
| operationResetNetwork | 8 | Restores the network settings back to factory default. |
| operationRefreshNode | 13 | Refreshes the node info. |

| Operation status | Status code | Description |
| --- | --- | --- |
| Generic |  | Generic status codes |
| operationStatusNone | 0 | Nothing to report. |
| operationStatusError | -1 | Error. |
| operationStatusNoNet | -4 | The network is not initialized. |
| operationStatusAborted | -5 | The network operation is aborted. |
| Add node |  | Status codes for add node |
| addNodeStatusProtocolDone | 1 | The protocol part is completed. |
| addNodeStatusGetNodeInfo | 2 | Retrieve detailed node info. |
| addNodeStatusProtocolStart | 3 | Starts the add SmartStart Z-Wave protocol operation. |
| addNodeStatusRequestedKeyReady | 11 | (S2 only) Device Requested Key info is ready. |
| addNodeStatusDSKReady | 12 | (S2 only) Device DSK info is ready. |
| addNodeStatusOnBehalfRequestedKeyReady | 21 | (S2 only) Device Requested Key info is ready. |
| addNodeStatusOnBehalfDSKReady | 22 | (S2 only) Device DSK info is ready. |
| Remove node |  | Status codes for remove node |
| removeNodeStatusLearnReady | 1 | Ready to remove a node. |
| removeNodeStatusFound | 2 | Found a node that can be removed. |
| removeNodeStatusRemoving | 3 | Remove the node. |
| Replace failed node |  | Status codes for replace a failed node |
| replaceNodeStatusReady | 1 | Ready to replace a failed node. |
| replaceNodeStatusProtocolDone | 2 | Protocol part finished. |
| replaceNodeStatusSecureInclusion | 3 | Add node securely. |
| replaceNodeStatusGetNodeInfo | 4 | Retrieve detailed node information. |
| Network refresh |  | Status codes for network refresh |
| networkRefreshStatusTopology | 1 | Network topology refresh started. |
| networkRefreshStatusNeighbor | 2 | Node neighbor refresh started. |
| networkRefreshStatusGetNodeInfo | 3 | Node information refresh started. |

| Command Class | Short Name | Note |
| --- | --- | --- |
| Anti-Theft Unlock Command Class | antiTheftUnlock |  |
| Association Command Class | association |  |
| Basic Command Class | basic |  |
| Battery Command Class | battery |  |
| Binary Switch Command Class | binarySwitch |  |
| Central Scene Command Class | centralScene |  |
| Configuration Command Class | configuration |  |
| Firmware Update Meta Data Command Class | firmwareUpdate |  |
| Indicator Command Class | indicator |  |
| Meter Command Class | meter |  |
| Multilevel Sensor Command Class | multilevelSensor |  |
| Alarm/Notification Command Class | notification | Previously called Alarm Command Class before it was renamed/overloaded by Notification Command Class. |
| Wake Up Command Class | wakeUp |  |

| Sensor Type | Short Name | Unit(s) Name | Unit(s) Notes |
| --- | --- | --- | --- |
| Temperature Sensor | tempSensor | celsius fahrenheit |  |
| General Purpose Sensor | gpSensor | percentage dimensionless |  |
| Luminance Sensor | luminSensor | percentage lux |  |
| Power Sensor | powerSensor | W btuPerHour | Btu/h |
| Humidity Sensor | humidSensor | percentage gramPerCubicMeter | g/m3 |
| Velocity Sensor | veloSensor | meterPerSecond milesPerHour | m/s, mph |
| Direction Sensor | directionSensor | degrees | 0 to 360 degrees 0 = no wind 90 = east 180 = south 270 = west 360 = north |
| Atmospheric Pressure Sensor | atmSensor | kPa inHg |  |
| Barometric Pressure Sensor | baroSensor | kPa inHg |  |
| Solar Radiation Sensor | solarSensor | wattPerSquareMeter | W/m2 |
| Dew Point Sensor | dewSensor | celsius fahrenheit |  |
| Rain Rate Sensor | rainSensor | millimeterPerHour inchesPerHour | mm/h in/h |
| Tide Level Sensor | tideSensor | m feet |  |
| Weight Sensor | weightSensor | kg pound |  |
| Voltage Sensor | voltageSensor | V mV |  |
| Current Sensor | currentSensor | A mA |  |
| CO2–level Sensor | co2Sensor | ppm |  |
| Air Flow Sensor | airSensor | cubicMeterPerHour cfm | m3/h cubic feet per minute |
| Tank Capacity Sensor | tankSensor | l cbm usGallons | US Gallons |
| Distance Sensor | distSensor | m cm feet |  |
| Angle Position Sensor | angleSensor | percentage degreeNorth degreeSouth | degrees relative to north/south pole of standing eye view |
| Rotation Sensor | rotationSensor | rpm Hz |  |
| Water Temperature Sensor | waterTempSensor | celsius fahrenheit |  |
| Soil Temperature Sensor | soilTempSensor | celsius fahrenheit |  |
| Seismic Intensity Sensor | seismicIntSensor | mercalli europeanMacroseismic liedu shindo |  |
| Seismic Magnitude Sensor | seismicMagSensor | ML MW MS MB |  |
| Ultraviolet Sensor | uvSensor | uvIndex | UV index |
| Electrical Resistivity Sensor | elecResistivitySensor | ohmMeter |  |
| Electrical Conductivity Sensor | elecCondSensor | siemensPerMeter | S/m |
| Loudness Sensor | loudnessSensor | dB dBA |  |
| Moisture Sensor | moistSensor | percentage volumeWaterContent ohm waterActivity | m3/m3 aw |
| Frequency Sensor | frequencySensor | Hz kHz |  |
| Time Sensor | timeSensor | s |  |
| Target Temperature Sensor | targetTempSensor | celsius fahrenheit |  |
| Particulate Matter 2.5 Sensor | pm2_5Sensor | molePerCubicMeter microgramPerCubicMeter | mol/m3 ug/m3 |
| Formaldehyde CH20–level Sensor | ch2oSensor | molePerCubicMeter | mol/m3 |
| Radon Concentration Sensor | radonSensor | becquerelPerCubicMeter picocuriesPerLiter | bq/m3 pCi/L |
| Methane Density CH4 Sensor | ch4Sensor | molePerCubicMeter | mol/m3 |
| Volatile Organic Compound Sensor | vocSensor | molePerCubicMeter ppm | mol/m3 |
| Carbon Monoxide CO-level sensor | coLvlSensor | molePerCubicMeter ppm | mol/m3 |
| Soil Humidity Sensor | soilHumidSensor | percentage |  |
| Soil Reactivity Sensor | soilReactivitySensor | pH |  |
| Soil Salinity Sensor | soilSalinitySensor | molePerCubicMeter | mol/m3 |
| Heart Rate Sensor | heartRateSensor | bpm |  |
| Blood Pressure Sensor | bloodPressureSensor | systolicMmHg diastolicMmHg |  |
| Muscle Mass Sensor | muscleMassSensor | kg |  |
| Fat Mass Sensor | fatMassSensor | kg |  |
| Bone Mass Sensor | boneMassSensor | kg |  |
| Total Body Water Sensor | tbwSensor | kg |  |
| Basal Metabolic Rate Sensor | bmrSensor | J |  |
| Body Mass Index Sensor | bmiSensor | bmiIndex |  |
| Acceleration, X-axis Sensor | xAccSensor | meterPerSecondSquare | m/s2 |
| Acceleration, Y-axis Sensor | yAccSensor | meterPerSecondSquare | m/s2 |
| Acceleration, Z-axis Sensor | zAccSensor | meterPerSecondSquare | m/s2 |
| Smoke Density Sensor | smokeDensitySensor | percentage |  |
| Water Flow Sensor | waterFlowSensor | literPerHour | l/h |
| Water Pressure Sensor | waterPressureSensor | kPa |  |
| RF Signal Strength Sensor | rfSignalSensor | RSSI dBm |  |
| Particulate Matter 10 Sensor | pm10Sensor | molePerCubicMeter microgramPerCubicMeter | mol/m3 ug/m3 |
| Respiratory Rate Sensor | respiratoryRateSensor | bpm |  |
| Relative Modulation Level Sensor | relativeModSensor | percentage |  |
| Boiler Water Temperature Sensor | boilerTempSensor | celsius fahrenheit |  |
| Domestic Hot Water Temperature Sensor | dhwTempSensor | celsius fahrenheit |  |
| Outside Temperature Sensor | outsideTempSensor | celsius fahrenheit |  |
| Exhaust Temperature Sensor | exhaustTempSensor | celsius fahrenheit |  |
| Water Chlorine Level Sensor | chlorineLvlSensor | milligramPerLiter | mg/l |
| Water Acidity Sensor | waterAcidSensor | pH |  |
| Water Oxidation Reduction Potential Sensor | waterOxiRedSensor | mV |  |
| Heart Rate LF/HF Sensor | lfhfRatioSensor | unitless |  |
| Motion Direction Sensor | motionSensor | degrees | 0 to 360 degrees 0 = no motion 90 = east 180 = south 270 = west 360 = north |
| Applied Force On The Sensor | appliedForceSensor | N |  |
| Return Air Temperature Sensor | returnAirTempSensor | celsius fahrenheit |  |
| Supply Air Temperature Sensor | supplyAirTempSensor | celsius fahrenheit |  |
| Condenser Coil Temperature Sensor | condenserCoilTempSensor | celsius fahrenheit |  |
| Evaporator Coil Temperature Sensor | evaporatorCoilTempSensor | celsius fahrenheit |  |
| Liquid Line Temperature Sensor | liquidLineTemp | celsius fahrenheit |  |
| Discharge Line Temperature Sensor | dischargeLineTempSensor | celsius fahrenheit |  |
| Suction Pressure Sensor | suctionPressureSensor | kPa psi |  |
| Discharge Pressure Sensor | dischargePressureSensor | kPa psi |  |
| Defrost Temperature Sensor | defrostTempSensor | celsius fahrenheit |  |
| Ozone (O3) Sensor | ozoneSensor | microgramPerCubicMeter | ug/m3 |
| Sulfur Dioxide (SO2) Sensor | so2Sensor | microgramPerCubicMeter | ug/m3 |
| Nitrogen Dioxide (NO2) Sensor | no2Sensor | microgramPerCubicMeter | ug/m3 |
| Ammonia (NH3) Sensor | nh3Sensor | microgramPerCubicMeter | ug/m3 |
| Lead (Pb) Sensor | pbSensor | microgramPerCubicMeter | ug/m3 |
| Particulate Matter 1 Sensor | pm1Sensor | microgramPerCubicMeter | ug/m3 |
| Person Counter (entering) | personEnteringCounter | unitless |  |
| Person Counter (exiting) | personExitingCounter | unitless |  |
| Unknown(1) | unknown |  | N.A |

| Basic Device Class | Code | Description |
| --- | --- | --- |
| controller | 1 | The node is a portable controller. |
| staticController | 2 | The node is a static controller. |
| endNode | 3 | The node is an end node. |
| routingEndNode | 4 | The node is an end node with routing capabilities. |

| Generic Device Class | Code | Description |
| --- | --- | --- |
| remoteController | 1 | Remote Controller |
| staticController | 2 | Static Controller |
| avControlPoint | 3 | AV Control Point |
| display | 4 | Display |
| networkExtender | 5 | Network extender |
| appliance | 6 | Appliance |
| sensorNotification | 7 | Notification sensor |
| thermostat | 8 | Thermostat |
| windowCovering | 9 | Window covering |
| repeaterEndNode | 15 | Repeater end node |
| switchBinary | 16 | Binary switch |
| switchMultilevel | 17 | Multilevel switch |
| switchRemote | 18 | Remote switch |
| switchToggle | 19 | Toggle switch |
| zipNode | 21 | Zip node |
| ventilation | 22 | Ventilation |
| securityPanel | 23 | Security panel |
| wallController | 24 | Wall controller |
| sensorBinary | 32 | Binary sensor |
| sensorMultilevel | 33 | Multilevel sensor |
| pulseMeter | 48 | Pulse meter |
| meter | 49 | Meter |
| entryControl | 64 | Entry Control |
| semiInteroperable | 80 | Semi interoperable |
| sensorAlarm | 161 | Alarm sensor |
| nonInteroperable | 255 | Non interoperable |

| Specific Device Class | Code | Description |
| --- | --- | --- |
| Generic |  |  |
| notUsed | 0 | Specific Device Class not used |
| Static Controller |  |  |
| pcController | 1 | Central Controller Device Type |
| sceneController | 2 | Scene Controller Device Type |
| staticInstallerTool | 3 | Static Installer Tool Device Type |
| setTopBox | 4 | Set Top Box Device Type |
| subSystemController | 5 | Sub System Controller Device Type |
| tv | 6 | TV Device Type |
| gateway | 7 | Gateway Device Type |
| Notification Sensor |  |  |
| notificationSensor | 1 | Notification Sensor Device Type |
| Binary Switch |  |  |
| powerSwitch | 1 | ON/OFF Power Switch Device Type |
| colorTunable | 2 | Binary Turnable Color Light Device Type |
| sceneSwitch | 3 | Binary Scene Switch Device Type |
| powerStrip | 4 | Power Strip Device Type |
| siren | 5 | Siren Device Type |
| valve | 6 | Valve (open/close) Device Type |
| irrigationController | 7 | Irrigation Controller Device Type |
| Binary Sensor |  |  |
| routingSensor | 1 | Routing Binary Sensor Device Type |
| Multilevel Sensor |  |  |
| routingSensor | 1 | Routing Multilevel Sensor Device Type |
| chimneyFan | 2 | Chimney Fan Device Type |
| Meter |  |  |
| simpleMeter | 1 | Sub Energy Meter Device Type |
| advancedEnergyControl | 2 | Whole Home Energy Meter (Advanced) Device Type |
| wholeHomeMeterSimple | 3 | Whole Home Meter (Simple) Device Type |

| Role Type | Code | Description |
| --- | --- | --- |
| centralStaticController | 0 | Central Static Controller |
| subStaticController | 1 | Sub Static Controller |
| portableController | 2 | Portable Controller |
| portableReportingController | 3 | Portable Reporting Controller |
| portableEndNode | 4 | Portable End Node |
| alwaysOnEndNode | 5 | Always On End Node |
| sleepingReportingEndNode | 6 | Reporting Sleeping End Node |
| sleepingListeningEndNode | 7 | Listening Sleeping End Node |
| networkAwareEndNode | 8 | Network Aware End Node |

| Node Type | Code | Description |
| --- | --- | --- |
| zwavePlusNode | 0 | Z-Wave Plus node |
| zwavePlusForIPRouter | 1 | Z-Wave Plus for IP router |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setEnabled" | The method that should be used. |
| params.enabled=<boolean> | The state of the Z-Wave operation. Can be either enabled or disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setEnabled" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setEnabled" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getEnabled" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEnabled" | The requested method. |
| data.enabled=<boolean> | Indicates if Z-Wave is enabled on your device. Can be either true or false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEnabled" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="addNode" | The method that should be used. |
| params.deviceSpecificKey=<string> Optional | Needs to be in the following format and only consist of numbers between 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addNode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addNode" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="removeNode" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeNode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeNode" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getOperation" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getOperation" | The requested method. |
| data.net.operation.code=<integer> | The current network operation. |
| data.net.operation.name=<string> | The nice name for the current operation. |
| data.net.operationStatus.status=<integer> | The progress status of an ongoing network operation. |
| data.net.operationStatus.name=<string> | The nice name for the progress status of an ongoing network operation. |
| data.net.prevOperation.code=<integer> | The previous network operation. |
| data.net.prevOperation.name=<string> | The nice name for the previous network operation. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getOperation" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="abortOperation" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="abortOperation" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="abortOperation" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="resetNetwork" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="resetNetwork" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="resetNetwork" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="refreshNetwork" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="refreshNetwork" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="refreshNetwork" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getNodeList" | The method that should be used. |
| params.nodeIDs=[<integer>] Optional | Retrieves a subset of nodes by specifying a list of node IDs. Any non-existent node ID is ignored, thus the result will only contain either the nodes corresponding to valid nodeIDs or none if no given nodeIDs were valid. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNodeList" | The requested method. |
| data.net.node=[<object>] | Lists the nodes on the Z-Wave network. |
| data.net.node.nodeDescriptor=<integer> | The node descriptor. |
| data.net.node.nodeID=<integer> | The node ID. Can be re-used, but must have a value less than 232 in accordance with current Z-Wave standards. |
| data.net.node.nodeProperty.securityCapabilities=[<string>] | Security capabilities included in the node. Available options are S0 and S2. |
| data.net.node.nodeProperty.includedSecurely=<boolean> | True if securely included, otherwise False. |
| data.net.node.nodeProperty.supportIdentification=<boolean> | True if the node is able to identify itself, e.g. a blinking LED. |
| data.net.node.vendorID=<integer> | The vendor ID of the device (manufacturer specific). |
| data.net.node.vendorProductID=<integer> | The product ID (manufacturer specific). |
| data.net.node.deviceCategory=<object> | The device category. A complete list of the different categories and codes can be found in the Device categories table below. |
| data.net.node.deviceCategory.name=<string> | The name of the device category. |
| data.net.node.deviceCategory.id=<integer> | The device category ID. |
| data.net.node.nodeAliveState=<string> | The node alive state. Valid values are alive, down or sleeping, but unavailable might also show up during the startup. |
| data.net.node.isSecure=<boolean> | True if the node has secure interfaces. False otherwise. |
| data.net.node.secureInclusionFailed=<integer> | True if the secure inclusion for the node failed. False otherwise. |
| data.net.node.isFLiRSCapable=<boolean> | True if the node is a Frequency Listening Routing End Node (FLiRS) device, which means that it is a battery powered device that wakes up with low latency whenever it is called |
| data.net.node.isSleepCapable=<boolean> | True if the node is capable of sleep, which means being non-listening and supporting the Wake up command class. |
| data.net.node.s2GrantKeys=[<string>] | Describes the keys used for secure inclusion. The different keys are defined in the table Requested keys of the joining device below. Please note that the node was included non-securely if this parameter is empty. |

| Key name | Description |
| --- | --- |
| S2Key0 | S2: Class key 0 (Unauthenticated devices) |
| S2Key1 | S2: Class key 1 (Authenticated devices) |
| S2Key2 | S2: Class key 2 (Access control devices) |
| S0LegacyKey | S0: Legacy security network key |

| Category | Code | Description |
| --- | --- | --- |
| unknown | 0 | Unknown |
| sensorAlarm | 1 | Sensor alarm |
| onOffSwitch | 2 | ON/OFF switch |
| powerStrip | 3 | Power strip |
| siren | 4 | Siren |
| valve | 5 | Valve |
| simpleDisplay | 6 | Simple display |
| doorlockKeypad | 7 | Door lock with keypad |
| subEnergyMeter | 8 | Sub energy meter |
| advancedEnergyMeter | 9 | Advanced whole home energy meter |
| simpleEnergyMeter | 10 | Simple whole home energy meter |
| sensor | 11 | Sensor |
| lightDimmer | 12 | Light dimmer switch |
| windowCovering | 13 | Window covering no position/endpoint |
| windowCoveringEndpointAware | 14 | Window covering, endpoint aware |
| windowCoveringPositionAware | 15 | Window covering, position/endpoint aware |
| fanSwitch | 16 | Fan switch |
| remoteControlMultiPurpose | 17 | Remote control - multipurpose |
| remoteControlAV | 18 | Remote control - AV |
| remoteControlSimple | 19 | Remote control - simple |
| unrecognizedGateway | 20 | Gateway (unrecognized by the client) |
| centralController | 21 | Central controller |
| setTopBox | 22 | Set top box |
| tv | 23 | TV |
| subSystemController | 24 | Sub system controller |
| gateway | 25 | Gateway |
| thermostatHVAC | 26 | Thermostat - HVAC |
| termostatSetback | 27 | Thermostat - setback |
| wallController | 28 | Wall controller |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNodeList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getEndpointList" | The method that should be used. |
| params.nodeDescriptor=<integer> | The node descriptor listing the endpoints. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEndpointList" | The requested method. |
| data.node.nodeDescriptor=<integer> | The node descriptor listing the endpoints. |
| data.node.endpoint=[<object>] | Lists the endpoints belonging to the node. |
| data.node.endpoint.endpointDescriptor=<integer> | The endpoint descriptor, that allows access to the endpoint. |
| data.node.endpoint.endpointID=<integer> | The endpoint ID. |
| data.node.endpoint.genericDeviceClass=<object> | The Generic Device Class. See the Generic Device Class identifiers table in Role Type for a complete list of available classes and the section Device Classes for an explanation. |
| data.node.endpoint.genericDeviceClass.name=<string> | The name of the Generic Device Class. |
| data.node.endpoint.genericDeviceClass.code=<integer> | The code of the Generic Device Class. |
| data.node.endpoint.specificDeviceClass=<object> | The Specific Device Class. See the Specific Device Class identifiers table in Role Type for a complete list of available classes and the section Device Classes for an explanation. |
| data.node.endpoint.specificDeviceClass.name=<string> | The name of the Specific Device Class. |
| data.node.endpoint.specificDeviceClass.code=<integer> | The code of the Specific Device Class. |
| data.node.endpoint.endpointName=<string> | The UTF-8 encoded endpoint name. |
| data.node.endpoint.endpointLocation=<string> | The UTF-8 encoded endpoint location. |
| data.node.endpoint.zwavePlusVersion=<integer> | The version field of the Z-Wave+ Info Report Command, a sub-category of Z-Wave+ Info command class. This value will be 0 if the node doesn’t support Z-Wave+. |
| data.node.endpoint.roleType=<object> | The role type field of the Z-Wave+ Info Report Command, a sub-category of Z-Wave+ Info command class and only applicable if the Z-Wave+ version is higher than 0. See the table Z-Wave+ Role type identifiers in Role Type for a complete list of available node types. |
| data.node.endpoint.roleType.name=<string> | The name of the role type. |
| data.node.endpoint.roleType.code=<integer> | The code of the role type. |
| data.node.endpoint.nodeType=<object> | The node type field of the Z-Wave+ Info Report Command, a sub-category of the Z-Wave+ Info command class and only applicable if the Z-Wave+ version is higher than 0. See the table Node Type identifiers in Role Type for a complete list of available node types. |
| data.node.endpoint.nodeType.name=<string> | The node type name. |
| data.node.endpoint.nodeType.code=<integer> | The node type code. |
| data.node.endpoint.installerIcon=<integer> | The Z-Wave+ installer icon type. |
| data.node.endpoint.userIcon=<integer> | The Z-Wave+ user icon type. |
| data.node.endpoint.aggregatedEndpointList=[<integer>] | ID container for the aggregated members of the endpoint that allows a Multi Channel device to implement functionality related to multiple endpoints. Please note that it will not be an aggregated endpoint if the list is empty. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEndpointList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getEndpointInterfaceList" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor for the interfaces list. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEndpointInterfaceList" | The requested method. |
| data.endpoint.endpointDescriptor=<integer> | The endpoint descriptor for the interfaces list. |
| data.endpoint.interface=[<object>] | An interface list belonging to the endpoint. |
| data.endpoint.interface.interfaceDescriptor=<integer> | The descriptor used to access the interface. |
| data.endpoint.interface.name=<string> | The interface name, based on the corresponding Z-Wave Command Class name. See Command Class for a complete list of available Command Classes. |
| data.endpoint.interface.simulatedVersion=<integer> | The Command Class version, upgradable by the device database and equal to the real version below if not upgraded. |
| data.endpoint.interface.realVersion=<integer> | The Command Class version supported by your device. Will be 0 for a simulated interface. |
| data.endpoint.interface.accessSupport=<object> | The interface accessibility support. |
| data.endpoint.interface.accessSupport.secure=<boolean> | true if the interface can be securely accessed. |
| data.endpoint.interface.accessSupport.unsecure=<boolean> | true if the interface can be accessed insecurely. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getEndpointInterfaceList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSummaryList" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSummaryList" | The requested method. |
| data.net.node=[<object>] | A list of nodes on the Z-Wave network. |
| data.net.node.descriptor=<integer> | The node descriptor. |
| data.net.node.id=<integer> | The node ID. Can be re-used, but must have a value less than 232 in accordance with current Z-Wave standards. |
| data.net.node.deviceCategory=<string> | The device category. A complete list of the different categories and codes can be found in the Device categories table in getNodeList. |
| data.net.node.aliveState=<string> | The node alive state. Valid values are alive, down or sleeping, but unavailable might also show up during the startup. |
| data.net.node.securityWarning=<string> | An error message. Available messages can be found in the table below. |
| data.net.node.endpoint=[<object>] | A list of node endpoints. |
| data.net.node.endpoint.descriptor=<integer> | The endpoint descriptor. |
| data.net.node.endpoint.genericDeviceClassName=<string> | The name of the Generic Device Class. See the Generic Device Class identifiers table in Role Type for a complete list of available Generic Device Classes and the section Device Classes for an explanation. |
| data.net.node.endpoint.specificDeviceClassName=<object> | The name of the Specific Device Class. See the Specific Device Class identifiers table in Role Type for a complete list of available Generic Device Classes and the section Device Classes for an explanation. |
| data.net.node.endpoint.name=<string> | The UTF-8 encoded endpoint name. |
| data.net.node.endpoint.portNumber=<integer> | Container for assigned I/O port numbers. Not applicable if no number was chosen. |
| data.net.node.endpoint.interface=[<object>] | Lists some of the endpoint interfaces. |
| data.net.node.endpoint.interface.descriptor=<integer> | The interface descriptor. |
| data.net.node.endpoint.interface.name=<string> | The interface name, based on the corresponding Z-Wave Command Class name. See Command Class for a complete list of available Command Classes. |

| Message | Description |
| --- | --- |
| failedToIncludeSecurely | Node was security bootstrapped with the S0 Command Class in a network capable of S2. |
| failedToIncludeWithHighestSecurity | An S2 node was not granted the highest requested S2 key during bootstrapping. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSummaryList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="replaceFailedNode" | The method that should be used. |
| params.nodeDescriptor=<integer> | The node descriptor of the node that should be replaced. |
| params.deviceSpecificKey=<string> Optional | Needs to be in the following format and only consist of numbers between 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="replaceFailedNode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="replaceFailedNode" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="removeFailedNode" | The method that should be used. |
| params.nodeDescriptor=<integer> | The node descriptor of the node that should be removed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeFailedNode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeFailedNode" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setEndpointInfo" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor of a node. |
| params.name=<string> Optional | The nicename. The maximum length of UTF-8 encoded text is 32 bytes. |
| params.location=<string> Optional | The location. The maximum length of UTF-8 encoded text is 32 bytes. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setEndpointInfo" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setEndpointInfo" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getS2RequestedKeys" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getS2RequestedKeys" | The requested method. |
| data.net.security.requestedKeys=[<string>] | An array of strings describing the appropriate keys, defined in the Requested keys of the joining device table in getNodeList. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getS2RequestedKeys" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setS2GrantKeys" | The method that should be used. |
| params.grantKeys=[<string>] | An array of strings that can be either all, or a subset, of the requested keys in the response from getS2RequestedKeys. The different keys are defined in the table Requested keys of the joining device in getNodeList. |
| params.accept=<boolean> Optional | Accept (true) or interrupt (false) Security 2 bootstrapping. The default value is true. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setS2GrantKeys" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setS2GrantKeys" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getS2DeviceSpecificKey" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getS2DeviceSpecificKey" | The requested method. |
| data.net.security.pinRequired=<boolean> | Indicates if a user needs to enter a pin when including S2. |
| data.net.security.deviceSpecificKey=<string> | The device specific key in a format where x is a number between 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. Depending on the value of pinRequired it can be either partial and without the first set of numbers, (-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx) when pinRequired=true, or complete when pinRequired=false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getS2DeviceSpecificKey" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="acceptS2" | The method that should be used. |
| params.accept=<boolean> | Accept (true) or reject (false) the node. |
| params.deviceSpecificKey=<string> | The device specific key in a format where x is a number between 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. If a partial DSK was received with getS2DeviceSpecificKey, the PIN (the first five digits) completes the DSK. This parameter is optional when accept=false. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="acceptS2" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="acceptS2" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="refreshNode" | The method that should be used. |
| params.nodeDescriptor=<integer> | The descriptor for the node that should be refreshed. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="refreshNode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="refreshNode" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="addToProvisioningList" | The method that should be used. |
| params.deviceSpecificKey=<string> | The device specific key, where x is a number from 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. |
| params.name=<string> Optional | Sets a nicename with the following rules:- The combined size of the name and location strings can not be larger than 62 bytes (excluding the NULL terminating char).:- Using . means that \. must be used for encoding.:- The string can not contain the underscore character _.:- The string can not end with a dash character -.:- The string must be case insensitive, meaning that the casing may not be maintained. |
| params.location=<string> Optional | Sets a location. Please note that the same rules applies to this parameter as params.name=<string> above. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addToProvisioningList" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addToProvisioningList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="removeFromProvisioningList" | The method that should be used. |
| params.deviceSpecificKey=<string> | The device specific key, where x is a number from 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeFromProvisioningList" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeFromProvisioningList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getProvisioningList" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getProvisioningList" | The requested method. |
| data.net.complete=<boolean> | true, if complete, otherwise false. |
| data.net.deviceInfo=[<object>] | An array containing device info for every device in the provisioning list. |
| data.net.deviceInfo.deviceSpecificKey=<string> | The device specific key, where x is a number from 0–9: xxxxx-xxxxx-xxxxx-xxxxx-xxxxxxxxxx-xxxxx-xxxxx. |
| data.net.deviceInfo.name=<string> | The nicename or an empty string if not set. |
| data.net.deviceInfo.location=<string> | The location, or an empty string if not set. |
| data.net.deviceInfo.networkStatus=<string> | The network status of the device:- included: The device is included on the network.- notIncluded: The device is pending inclusion on the network.- failing: The device was included on the network, but is now reported as failing.- unknownStatus: Unknown network status. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getProvisioningList" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getBatteryState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node and false if the state is retrieved from the cache. Retrieval from the cache is the default. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBatteryState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.battery.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, if 19700101T000000 is shown, no Z-Wave reports were received since the server started up and the rest of the values in the response should be considered undefined. |
| data.interface.battery.level=<integer> | The current battery level (between 0–100%). 255 indicates that the battery level is low. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBatteryState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getMultilevelSensorState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node and false if the state is retrieved from the cache. Retrieves from the cache by default. |
| params.type=<string> Optional | The preferred sensor type. Please note that the preferred type is not guaranteed to be reported, as this depends on whether it is supported by your device. Not specifying this will result in a report listing the factory default sensor type. This parameter is only applicable if refresh=true. |
| params.unit=<string> Optional | The preferred sensor unit. Please note that the preferred unit is not guaranteed to be reported, as this depends on whether it is supported by your device and will be ignored if the sensor type isn’t specified. This parameter is only applicable if refresh=true. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.multilevelSensor=[<object>] | The list of multilevel sensor states. Will be a single entry when the requests consists of both a specific sensor type and unit. |
| data.interface.multilevelSensor.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, if 19700101T000000 is shown, no Z-Wave reports were received since the server started and the rest of the values in the response should be considered undefined. |
| data.interface.multilevelSensor.type=<string> | The sensor type. |
| data.interface.multilevelSensor.value=<number> | The sensor value, presented as a 32 bit float. |
| data.interface.multilevelSensor.precision=<integer> | The decimal places of the value. |
| data.interface.multilevelSensor.unit=<string> | The sensor unit. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getMultilevelSensorSupport" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node and false if the state is retrieved from the cache. Will retrieve from the cache by default. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorSupport" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.multilevelSensor.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, if 19700101T000000 is shown, no Z-Wave reports were received since the server started up and the rest of the values in the response should be considered undefined. |
| data.interface.multilevelSensor.sensorTypeList=[<string>] | A list containing the supported sensor types. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorSupport" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getMultilevelSensorUnitSupport" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the sensor unit support is fetched from the end device, false if it is retrieved from cache (the default value). |
| params.sensorType=<string> | The sensor type to retrieve supported units for, as defined by Sensor types in Role Type. Please note that you need to use the short names. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorUnitSupport" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.multilevelSensor.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, if 19700101T000000 is shown, no Z-Wave reports were received since the server started up and the rest of the values in the response should be considered undefined. |
| data.interface.multilevelSensor.sensorType=<string> | The sensor type given in the request. |
| data.interface.multilevelSensor.sensorUnitList=[<string>] | A list containing the supported sensor units. The different sensor types and units are specified in Sensor types in Role Type. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMultilevelSensorUnitSupport" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getConfiguration" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the value is fetched from the end device, false if it is retrieved from cache (the default value). |
| params.paramNum=<integer> | The parameter number, generally found in the manufacturer’s user manual. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getConfiguration" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.configuration.paramNum=<integer> | The parameter number. |
| data.interface.configuration.paramValue=<number> | A signed or unsigned number. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getConfiguration" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setConfiguration" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.paramNum=<integer> | The parameter number, generally found in the manufacturer’s user manual. |
| params.useDefault=<boolean> | True if the default factory setting is used. |
| params.paramValue=<number> | The parameter value. Can be either a signed or an unsigned number and is generally found in the manufacturer’s user manual. Not required if useDefault is true. |
| params.paramSize=<integer> | The parameter size value. Please note that this is a fixed value and the semantics can generally be found in the manufacturer’s user manual. Not required if useDefault is true. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setConfiguration" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getBinarySwitchState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node, false if it is retrieved from the cache (the default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBinarySwitchState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.binaryswitch.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.binarySwitch.currentState=<boolean> | The current ON/OFF value. |
| data.interface.binaryswitch.targetState=<boolean> | The target value of either the latest or an ongoing transition. |
| data.interface.binarySwitch.duration=<integer> | The time required to reach the target value, specified in the table below. |
| data.interface.binarySwitch.stateNum=<integer> | Indicates the number of state changes. Please note that the counter will loop around from 0 when it reaches 0xFFFF. |

| Value | Time |
| --- | --- |
| 0 | Already at target value. |
| 1–127 | 1–127 seconds. |
| 128–253 | 1–126 minutes. |
| 254 | Unknown duration. |
| 255 | Reserved. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBinarySwitchState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setBinarySwitchState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.value=<boolean> | The value that should be set. ON for true and OFF for false. |
| params.duration=<integer> Optional | Only applicable for Binary Switch Command Class version 2 or above and specifies the time it should take to reach the target value, as specified in the table in the previous example. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setBinarySwitchState" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setBinarySwitchState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getBasicState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node, false if it should be retrieved from the cache (the default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBasicState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.basic.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started up if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.basic.currentState=<integer> | The current value, specified in the table below. |
| data.interface.basic.targetState=<integer> | The target value of either the latest or the ongoing transition, specified in the table below. |
| data.interface.basic.duration=<integer> | The time required to reach the target value, specified in the table Duration values in getBinarySwitchState. |
| data.interface.basic.stateNum=<integer> | Indicates the number of state changes. Please note that the counter will loop back to 0 when it reaches 0xFFFF. |

| Value | Description |
| --- | --- |
| 0 | OFF |
| 1–99 | 1–99% |
| 254 | Unknown |
| 255 | ON |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getBasicState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setBasicState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.value=<integer> | The value that should be set. Please note that the range is device specific. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setBasicState" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setBasicState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="addAssociation" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.groupID=<integer> | The group ID. |
| params.memberCount=<integer> | The number of node/endpoint pairs added out of a maximum number of five. |
| params.members=[<object>] | The node/endpoint pairs. |
| params.members.nodeID=<integer> | The node ID. |
| params.members.endpointID=<integer> | The endpoint ID. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addAssociation" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="addAssociation" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="removeAssociation" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.groupID=<integer> | The group ID. |
| params.memberCount=<integer> | The number of node/endpoint pairs added out of a maximum number of five. |
| params.members=[<object>] | The node/endpoint pairs. |
| params.members.nodeID=<integer> | The node ID. |
| params.members.endpointID=<integer> | The endpoint ID. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeAssociation" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeAssociation" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getAssociationData" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node, false if it is retrieved from the cache (the default value). |
| params.groupID=<integer> | The group ID. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAssociationData" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.association.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started up if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.association.groupID=<integer> | The group ID. |
| data.interface.association.maxCount=<integer> | The maximum number of members supported by the group. |
| data.interface.association.members=[<object>] | An array containing the members that are part of a group. Please note that group members may contain endpoints/nodes that don’t exist on the network. |
| data.interface.association.members.nodeID=<integer> | The node ID. |
| data.interface.association.members.endpointID=<integer> | The endpoint ID. 255 denotes node association and everything else denotes endpoint association. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAssociationData" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSupportedGroupings" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node, false if it should be retrieved from the cache (the default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedGroupings" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.association.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started up if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.association.groupIDs=[<integer>] | A list of group IDs. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedGroupings" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getWakeUpInfo" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node, false if it should be retrieved from the cache (the default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getWakeUpInfo" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.association.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started up if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.wakeUp.currentInterval=<integer> | The current wake-up interval, measured in seconds. |
| data.interface.wakeUp.nodeId=<integer> | The ID of the node to notify on wake-up, 255 for broadcast. |
| data.interface.wakeUp.minInterval=<integer> | The minimum wake-up interval in seconds, valid on devices with Wake Up Command Class version 2 and above. |
| data.interface.wakeUp.maxInterval=<integer> | The maximum wake-up interval in seconds, valid on devices with Wake Up Command Class version 2 and above. |
| data.interface.wakeUp.defaultInterval=<integer> | The default wake-up interval in seconds, valid on devices with Wake Up Command Class version 2 and above. |
| data.interface.wakeUp.intervalStep=<integer> | The wake-up interval step, measured in seconds, indicating the number of seconds between each value that is possible to set as the wake-up interval and only valid on devices with Wake Up Command Class version 2 and above. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getWakeUpInfo" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setWakeUpInfo" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.wakeUpInterval=<integer> | The wake-up interval to set. |
| params.nodeID=<integer> | The ID of the node that should be notified on wake-up. 255 is used for broadcasts. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setWakeUpInfo" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setWakeUpInfo" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getMeterReading" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node, false if the state is retrieved from the cache. Retrieves from the cache by default. |
| params.unit=<string> Optional | The preferred unit. Please note that this parameter is ignored if the end node doesn’t support it. See the Available Meter units table below for information about available units. This parameter will default to noPreference if it is supported, but not specified. |
| params.rateType=<string> Optional | The preferred rate type. Please note that this is ignored if the end node doesn’t support it. See the Available Meter rate types table below for information about available units. This parameter will default to noPreference if it is supported, but not specified. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMeterReading" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.meter=[<object>] | A list containing the reading data for either a single value when it was chosen for the preferred unit, or listing all available units. |
| data.interface.meter.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.meter.type=<string> | The meter type. Available types are specified in the Available Meter types table below. |
| data.interface.meter.value=<number> | The meter value. |
| data.interface.meter.precision=<integer> | The decimal places of the value. |
| data.interface.meter.unit=<string> | The meter unit. Available units are specified in the Available Meter units table below. |
| data.interface.meter.rateType=<string> | The meter rate type. Available options are specified in the Available Meter rate types table below. Please note that this is only valid if the device supports Meter Command Class version 2. |
| data.interface.meter.delta=<integer> | Elapsed time (measured in seconds) since the last meter data. Will be 0 if no previous value exists and is only valid if the device supports Meter Command Class version 2. |
| data.interface.meter.prevValue=<number> | The previous meter value. Only valid if delta > 0. However the value will be equal to the current value in cases where delta = 0. Please note that this is only valid if the device supports Meter Command Class version 2. |

| Type name | Description |
| --- | --- |
| electric | Electric meter |
| gas | Gas meter |
| water | Water meter |
| heating | Heating meter |
| cooling | Cooling meter |

| Name | Description |
| --- | --- |
| eleckWh | Electric meter unit: kWh |
| eleckVAh | Electric meter unit: kVAh |
| elecW | Electric meter unit: W |
| elecPulse | Electric meter unit: pulse count |
| elecV | Electric meter unit: V |
| elecA | Electric meter unit: A |
| elecPF | Electric meter unit: power factor |
| elecKVar | Electric meter unit: KVar |
| elecKVarh | Electric meter unit: KVarh |
| gasCM | Gas meter unit: cubic meter |
| gasCF | Gas meter unit: cubic feet |
| gasPulse | Gas meter unit: pulse count |
| waterCM | Water meter unit: cubic meters |
| waterCF | Water meter unit: Cubic feet |
| waterGal | Water meter unit: US gallons |
| waterPulse | Water meter unit: pulse count |
| heatkWh | Heating meter unit: kWh |
| coolkWh | Cooling meter unit: kWh |

| Rate type | Description |
| --- | --- |
| import | Meter value is a consumed measurement. |
| export | Meter value is a produced measurement. |
| importExport | Both import and export, but not be used in a getMeterReading request. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMeterReading" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getMeterCapabilities" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node, false if the state is retrieved from the cache. Retrieves from the cache by default. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMeterCapabilities" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.meter.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.meter.type=<string> | The meter type. Available types are specified in the Available Meter types table in getMeterReading. |
| data.interface.meter.units=[<string>] | An array containing the strings of the supported units. Available units are specified in the Available Meter units table in getMeterReading. |
| data.interface.meter.reset=<boolean> | True if the device supports resetting all accumulated values stored in the device. |
| data.interface.meter.rateType=<string> | The meter rate type. Supported options are specified in the Available Meter rate types table in getMeterReading, otherwise the value notSupported will be returned. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getMeterCapabilities" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="resetMeter" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="resetMeter" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="resetMeter" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getIndicatorValue" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the value is fetched from the end node, false if the value is retrieved from the cache (default value). |
| params.indicatorName=<string> Optional | The indicator name. Available indicators are listed in the Available indicators table below. Please note that this is only applicable for Indicator Command Class version 2 and above. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIndicatorValue" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.indicator.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.indicator.value=<integer> | The value of Indicator Command Class version 1, which can be ignored if the indicator properties are present. Valid values can be either 0 (off/disable), 255 (on/enable) or any value between 1–99. This is only for backwards compatibility in cases where the Indicator Command Class supports version 2 or above. |
| data.interface.indicator.indicatorName=<string> | The indicator name. Available indicators are specified in the Available indicators table below. |
| data.interface.indicator.stateNum=<integer> | Indicates the number of state changes in increments by one for every state change. Please note that the number will loop back to 0 when it reaches 0xFFFF. |
| data.interface.indicator.properties=[<object>] | The list of indicator properties, valid only if the Indicator Command Class supports version 2 or above. |
| data.interface.indicator.properties.name=<string> | The property name. Available values are specified in the Available indicator property names and values table below. |
| data.interface.indicator.properties.value=<integer> | The property value. Valid values are specified in the Available indicator property names and values table below. |

| Indicator name | Description |
| --- | --- |
| armed | The alarm is armed. |
| disarmed | The alarm is disarmed. |
| ready | The device is ready. |
| faulty | A general error. |
| busy | The device is busy. |
| enterID | The device is waiting for an ID. |
| enterPIN | The device is waiting for a PIN. |
| codeOK | The entered code is accepted. |
| codeNotOK | The entered code is NOT accepted. |
| armedStay | The alarm is armed and the user is staying. |
| armedAway | The alarm is armed and the user is away. |
| alarm | The alarm is triggered, reason not specified. |
| alarmBurglar | The alarm is triggered due to a burglar event. |
| alarmFire | The alarm is triggered due to a fire alarm. |
| alarmCO | The alarm is triggered due to a carbon monoxide event. |
| bypassChallenge | The device expects a bypass challenge code. |
| entryDelay | The alarm is about to be activated unless disarmed. |
| exitDelay | The alarm will be active after an exit delay. |
| zone1 | Zone 1 is armed. |
| zone2 | Zone 2 is armed. |
| zone3 | Zone 3 is armed. |
| zone4 | Zone 4 is armed. |
| zone5 | Zone 5 is armed. |
| zone6 | Zone 6 is armed. |
| lcdBacklight | Turns on the LCD backlight. |
| readyForLetter | The buttons are ready for a letter input. |
| readyForDigit | The buttons are ready for a digit input. |
| readyForCommand | The buttons are ready for a command input. |
| button1 | Draws attention to button 1. |
| button2 | Draws attention to button 2. |
| button3 | Draws attention to button 3. |
| button4 | Draws attention to button 4. |
| button5 | Draws attention to button 5. |
| button6 | Draws attention to button 6. |
| button7 | Draws attention to button 7. |
| button8 | Draws attention to button 8. |
| button9 | Draws attention to button 9. |
| button10 | Draws attention to button 10. |
| button11 | Draws attention to button 11. |
| button12 | Draws attention to button 12. |
| identify | Identifies a node. |
| buzzer | Draws attention or provides feedback. |

| Name | Value | Description |
| --- | --- | --- |
| level | 0: OFF 1–99: lowest non-zero level – 100% 255: restores most recent (non-zero) level | A specific level, for example the light level. |
| binary | 0: OFF 1–99: ON 255: ON | Turns the indicator ON or OFF. |
| togglePeriod | 0–255 (0-25.5 seconds) | Toggles the period duration in tenths of seconds. Please note that specifying this property also requires specifying the toggleCycle as well. |
| toggleCycle | 0–254 (0–254 times). 255: Run ON/OFF periods until stopped. Please note that 3 is reserved for the indicator identify. | Toggles the cycle of periods that should be run. Please note that specifying this property requires specifying the togglePeriod as well. |
| toggleOnTime | 0: ON time equal to OFF time 1–255: ON time ranging from 1–25.5 seconds. | The ON time within an ON/OFF period. Can be set in tenths of seconds. |
| timeoutMinutes | 0–255 (0–255 minutes) | The timeout duration, measured in minutes, after which the indicator is either turned OFF or muted. Please note that this can be ignored if toggling is defined (when toggleCycle and togglePeriod > 0 or toggleOnTime > 0). The values must be combined in cases where more timeout properties are supported. Setting all timeout properties to 0 means that the indicator will not time out automatically. |
| timeoutSeconds | 0–59 (0–59 seconds). 60–255 is ignored. | The timeout duration, measured in seconds, after which the indicator is either turned OFF or muted. Please note that this can be ignored if toggling is defined (when toggleCycle and togglePeriod > 0 or toggleOnTime > 0). The values must be combined in cases where more timeout properties are supported. Setting all timeout properties to 0 means that the indicator will not time out automatically. |
| timeout100thSeconds | 0–99 (0.00–0.99 seconds). 100–255 is ignored. | The timeout duration, measured in 100ths of a seconds, after which the indicator is either turned OFF or muted. Please note that this can be ignored if toggling is defined (when toggleCycle and togglePeriod > 0 or toggleOnTime > 0). The values must be combined in cases where more timeout properties are supported. Setting all timeout properties to 0 means that the indicator will not time out automatically. |
| soundLevel | 0: OFF/mute 1–100: 1–100% 255: Restores the most recent (non-zero) level. 101–254 is ignored. | Configures the volume of the indicator without switching it ON. |
| lowPower | Advertise only and can not be used with SET | Used by a supporting node to advertise that the indicator can continue its operation even in sleep mode. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIndicatorValue" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIndicatorValue" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.value=<integer> | Valid if the end node only supports Indicator Command Class version 1. The value can be either 0 (off/disable), 255 (on/enable) or any value between 1–99. |
| params.indicatorName=<string> | Valid if the end node supports Indicator Command Class version 2. Available indicators are listed in the Available indicators table in getIndicatorValue. |
| params.properties=[<object>] | A list containing the indicator properties. Please note that it is only valid if the end node supports Indicator Command Class version 2 or above. Available property names and valid property values are listed in the Available indicator property names and values table in getIndicatorValue. |
| params.properties.name=<string> | The property name. |
| params.properties.value=<integer> | The property value. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIndicatorValue" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIndicatorValue" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getIndicatorCapabilities" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIndicatorCapabilities" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.indicator.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.indicator.indicatorSupport=[<object>] | An array containing the supported indicators. |
| data.interface.indicator.indicatorSupport.indicatorName=<string> | The indicator name. Available indicators are listed in the Available indicators table in getIndicatorValue and is only valid if the Indicator Command Class supports version 2 or above. |
| data.interface.indicator.indicatorSupport.propertyNameList=[<string>] | A list containing the indicator property names when the Indicator Command Class supports version 2 or above. Available values are specified in the Available indicator property names and values table in getIndicatorValue. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIndicatorCapabilities" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFirmwareInfo" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the information is fetched from the end node and false if the information is retrieved from the cache (default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareInfo" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.firmwareUpdate.vendorID=<integer> | The manufacturer specific vendor ID of the device. |
| data.interface.firmwareUpdate.zwaveFirmwareID=<integer> | The Z-Wave firmware ID. |
| data.interface.firmwareUpdate.checksum=<integer> | The CRC-CCITT checksum. |
| data.interface.firmwareUpdate.maxFramerateSize=<integer> | The maximum meta data fragment size for the firmware update. |
| data.interface.firmwareUpdate.fixedFragmentSize=<boolean> | A flag indicating whether maxFragmentSize should be used during a Firmware update request. true indicates a fixed size, false a variable size. |
| data.interface.firmwareUpdate.upgradable=<boolean> | true if the firmware is upgradable, otherwise false. |
| data.interface.firmwareUpdate.hardwareVersionValid=<boolean> | true if the hardware version is valid, otherwise false. Using an invalid hardware version will result in an unsuccessful firmware update request. |
| data.interface.firmwareUpdate.hardwareVersion=<integer> | The hardware version. |
| data.interface.firmwareUpdate.upgradeFunctionality=<string> | A string indicating whether other command classes will function normally during a firmware upgrade. Available options are normal, limited and unknown. |
| data.interface.firmwareUpdate.activation=<string> | A string indicating whether activation is supported after download. Available options are supported, unsupported and unknown. |
| data.interface.firmwareUpdate.firmwareTargets=[<object>] | A list containing the firmware targets. |
| data.interface.firmwareUpdate.firmwareTargets.firmwareTarget=<integer> | The firmware target number, starting from 1. |
| data.interface.firmwareUpdate.firmwareTargets.firmwareID=<integer> | The firmware ID of the firmware target. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareInfo" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="requestFirmwareUpdate" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.vendorID=<integer> | The vendor ID of the device (manufacturer specific). |
| params.firmwareTarget=<integer> | The firmware target number. 0 is used for Z-Wave firmware, while any number in the range of 1–255 can be used and returned by getFirmwareInfo. |
| params.firmwareID=<integer> | The firmware ID intended for the firmware. |
| params.fileName=<string> | The firmware file path. |
| params.hardwareVersion=<integer> | The hardware version. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareUpdate" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |
| data.interface.firmwareUpdate.requestStatus=<string> | The firmware update request status. See the Available firmware update request statuses table below for a complete list of available statuses. |
| data.interface.firmwareUpdate.completionStatus=<string> | The firmware update completion status. See the Available firmware update completion statuses table below for a complete list of available statuses. |

| Update status | Description |
| --- | --- |
| invalidCombo | The combination of vendorID and firmwareID is not valid. |
| authenticationNeeded | Out-of-band authentication event to enable firmware updates required. |
| fragmentSizeError | The requested fragment size is exceeding the maximum fragment size. |
| upgradeError | Upgrading the firmware target is not possible. |
| hardwareVersionError | Hardware version is invalid. |
| transferInProgress | Another firmware image is currently transferred. |
| lowBattery | The battery level is too low to complete the firmware update. |
| validCombo | The combination of vendorID and firmwareID is valid, which means that the upgrade will start. |
| unknownStatus | The status is unknown. |

| Update status | Description |
| --- | --- |
| checksumError | The requested firmware has a checksum error. |
| downloadError | Download of the requested firmware failed. |
| vendorIDError | The vendor/manufacturer ID is mismatched. |
| firmwareIDError | The firmware ID is mismatched. |
| firmwareTargetError | The firmware target is mismatched. |
| fileHeaderError | The file header information is invalid. |
| headerFormatError | The file header format is invalid. |
| memoryError | An out of memory error. |
| hardwareVersionError | The hardware version is mismatched. |
| lowBattery | The battery level is too low to initiate the update. |
| unknownBatteryLevel | The battery level is unknown and update can’t be initiated. |
| okWait | The image has been downloaded and is awaiting an activation command. |
| okNoRestart | The image has been successfully stored in a temporary non-volatile memory and the device will not restart itself. |
| okRestart | The image has been successfully stored in a temporary non-volatile memory. The device will proceed to store the image in a primary non-volatile memory and restart itself. |
| unknownStatus | The status is unknown. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareUpdate" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFirmwareUpdateStatus" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareUpdateStatus" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |
| data.interface.firmwareUpdate.requestStatus=<string> | The firmware update request status. See the Available firmware update request statuses table in requestFirmwareUpdate for a complete list of available statuses. |
| data.interface.firmwareUpdate.completionStatus=<string> | The firmware update completion status. See the Available firmware update completion statuses table in requestFirmwareUpdate for a complete list of available statuses. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareUpdateStatus" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="requestFirmwareBackup" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.vendorID=<integer> | The vendor ID of the device (manufacturer specific). |
| params.firmwareTarget=<integer> | The target number of the firmware. 0 is used for Z-Wave firmware, while any number in the range of 1–255 can be used and returned by getFirmwareInfo. |
| params.firmwareID=<integer> | The firmware ID intended for the firmware. |
| params.hardwareVersion=<integer> | The hardware version. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareBackup" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |
| data.interface.firmwareUpdate.requestStatus=<string> | The firmware update request status. See the Available firmware backup request statuses table below for a complete list of available statuses. |
| data.interface.firmwareUpdate.completionStatus=<string> | The firmware update completion status. See the Available firmware backup completion statuses table below for a complete list of available statuses. |
| data.interface.firmwareUpdate.backPath=<string> | The path to the backup file. |

| Update status | Description |
| --- | --- |
| invalidCombo | Combination of vendorID and firmwareID is not valid. |
| authenticationNeeded | An out-of-band authentication event is required to enable firmware updates. |
| fragmentSizeError | The requested fragment size exceeds the maximum fragment size. |
| downloadError | Creating a backup of this firmware target is not possible. |
| hardwareVersionError | The hardware version is invalid. |
| requestOK | The receiving node is able to initiate the firmware backup of the target. |
| unknownStatus | The status is unknown. |

| Update status | Description |
| --- | --- |
| checksumError | The downloaded firmware has a checksum error. |
| downloadError | Downloading the requested firmware failed. |
| memoryError | An out-of-memory error. |
| requestStatusError | Could not retrieve the firmware download request status, which means that the download does not start. |
| requestTimeoutError | Initiates the firmware download request timeout, which means that the download does not start. |
| writeError | Failed to write the firmware file. |
| exceedSizeLimit | The firmware size is too large. |
| errorOther | An unspecified error. |
| statusOK | The firmware was successfully downloaded and saved to file. |
| unknownStatus | The status is unknown. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareBackup" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFirmwareBackupStatus" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareBackupStatus" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |
| data.interface.firmwareUpdate.requestStatus=<string> | The firmware update request status. See the Available firmware backup request statuses table in requestFirmwareBackup for a complete list of available statuses. |
| data.interface.firmwareUpdate.completionStatus=<string> | The firmware update completion status. See the Available firmware backup completion statuses table in requestFirmwareBackup for a complete list of available statuses. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareBackupStatus" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="requestFirmwareActivation" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareActivation" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="requestFirmwareActivation" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getFirmwareActivationStatus" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareActivationStatus" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.firmwareUpdate.vendorID=<integer> | The vendor ID of the device (manufacturer specific). |
| data.interface.firmwareUpdate.firmwareTarget=<integer> | The firmware target number. 0 is Z-Wave firmware, 1–255 is the target number returned by getFirmwareInfo. |
| data.interface.firmwareUpdate.firmwareID=<integer> | The firmware ID intended for the firmware. |
| data.interface.firmwareUpdate.hardwareVersion=<integer> | The hardware version. |
| data.interface.firmwareUpdate.checksum=<integer> | The CRC-CCITT checksum. |
| data.interface.firmwareUpdate.latestRequestTime=<string> | The last time a firmware update request was made, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). |
| data.interface.firmwareUpdate.requestStatus=<string> | The firmware update request status. See the Available firmware activation statuses table for a complete list of available statuses. |

| Update status | Description |
| --- | --- |
| invalidCombo | A combination of vendorID, firmwareID and hardwareVersion or firmwareTarget is not valid. |
| activationError | An error activating the firmware, restoring the original firmware. |
| requestOK | A firmware activation was successfully completed. |
| unknownStatus | Status unknown. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getFirmwareActivationStatus" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getNotificationCapabilities" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | True if the supported types should be fetched from the end node and false if it should be retrieved from the cache (default value. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationCapabilities" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.notification.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.notification.hasVendorSpecificType=<boolean> | True if the vendor specific alarm/notification type is supported. |
| data.interface.notification.zwaveAlarmTypeList=[<object>] | A list containing the supported Z-Wave alarm/notification types. The most common alarm/notification types can be found in the Common Z-Wave alarm types table below, although please note that vendor specific types also exists. This parameter is only valid if the Alarm/Notification Command Class supports version 2 or above. |
| data.interface.notification.zwaveAlarmTypeList.type=<string> | The alarm/notification type denoted as vendorSpecific when it belongs to a certain vendor. |
| data.interface.notification.zwaveAlarmTypeList.code=<integer> | The corresponding code. |

| Z-Wave alarm type | Code | Description |
| --- | --- | --- |
| smoke | 1 | Smoke alarm |
| co | 2 | Carbon monoxide alarm |
| co2 | 3 | Carbon dioxide alarm |
| heat | 4 | Heat alarm |
| water | 5 | Water alarm |
| lock | 6 | Lock access control alarm |
| burglar | 7 | Burglar alarm or home security |
| power | 8 | Power management alarm |
| system | 9 | System alarm |
| emergency | 10 | Emergency alarm |
| clock | 11 | Alarm clock |
| appliance | 12 | Home appliance alarm |
| health | 13 | Home health alarm |
| siren | 14 | Siren alarm |
| waterValve | 15 | Water valve alarm |
| weather | 16 | Weather alarm |
| irrigation | 17 | Irrigation alarm |
| gas | 18 | Gas alarm |
| pestControl | 19 | Pest control |
| lightSensor | 20 | Light sensor |
| waterQuality | 21 | Water quality monitoring |
| homeMonitor | 22 | Home monitoring |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationCapabilities" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getNotificationEventSupport" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the supported types should be fetched from the end node, false if it should be retrieved from the cache (default value). |
| params.zwaveAlarmType=<string> | The alarm/notification type. The most common alarm/notification types can be found in the Common Z-Wave alarm types table in getNotificationCapabilities |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationEventSupport" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.notification.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.notification.zwaveAlarmType=<string> | The given alarm/notification type. |
| data.interface.notification.zwaveEventList=[<integer>] | A list of codes denoting the supported events for the specified alarm/notification type. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationEventSupport" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getNotificationState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the supported types should be fetched from the end node, false if it should be retrieved from the cache (default value). |
| params.vendorAlarmType=<integer> | The vendor specific alarm type that defaults to 0 when not in use. -1 indicates no favorites when retrieving from the cache. |
| params.zwaveAlarmType=<string>Optional | The alarm/notification type that defaults to latest if not used. Using latest as input will only give you the latest alarm/notification report. The most common alarm/notification types can be found in the Common Z-Wave alarm types table in getNotificationCapabilities This parameter is only applicable for Alarm/Notification Command Class version 2 or above. |
| params.zwaveEvent=<integer> Optional | Valid only when operating in push mode and defaults to 0 (latest) when not used. In cases where an alarm type has been specified it will be the latest event of that type. Please note that this is only valid if the Alarm/Notification Command Class supports version 3 and above. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.notification.report=<object> | An alarm/notification report. |
| data.interface.notification.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.notification.report.vendorAlarmType=<integer> | The vendor specific alarm type. |
| data.interface.notification.report.vendorAlarmLevel=<integer> | The vendor specific alarm level. |
| data.interface.notification.report.extendedInfoValid=<boolean> | True if the extended information fields should be considered valid. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoAlarmStatus=<string> | The Z-Wave alarm/notification status. See the Z-Wave alarm statuses table below for available statuses. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoAlarmType=<string> | The Z-Wave alarm/notification type. The most common types can be found in the Common Z-Wave alarm types in getNotificationCapabilities. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoAlarmEvent=<integer> | The Z-Wave event. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoParameterLength=<integer> | The event parameter length measured in bytes. 0 means that no parameters are present. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoParameterType=<string> | The event parameter type. Available types are listed in the Extended info parameter types definitions table below. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoParameter=<integer> | The event parameter that is only available if extendedInfoParameterType is not set to location. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |
| data.interface.notification.report.extendedInfoLocation=<string> | The UTF-8 encoded event parameter that is only available if extendedInfoParameterType is set to location. Please note that this is only valid if the Alarm/Notification Command Class supports version 2 and above. |

| Alarm status | Description |
| --- | --- |
| deactivated | The unsolicited alarm/notification report is deactivated (push mode), or the report messages carries valid notification information (pull mode). |
| activated | The unsolicited alarm/notification report is activated (push mode). |
| noPendingNotice | The report messages do not carry valid notification information. The queue is empty. |

| Parameter type | Description |
| --- | --- |
| location | The device location. |
| userID | The user ID. Can be either 1 or 2 bytes long, with the first byte being the MSB. |
| oemError | The OEM proprietary system failure code. |
| proprietary | The proprietary event parameters. |
| eventID | The at this stage not active Event ID. |
| unknown | The unknown alarm/notification event parameters. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getNotificationState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setNotificationState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.zwaveAlarmType=<string> | The alarm/notification type. The most common alarm/notification types can be found in the Common Z-Wave alarm types table in getNotificationCapabilities |
| params.status=<integer> | For alarms operating in push mode: 0 = disable an unsolicited report. 255 = enable an unsolicited report. For alarms operating in pull mode: 0 = clears a persistent notification. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setNotificationState" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setNotificationState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getCentralSceneCapabilities" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the capabilities should be fetched from the end node, false if it should be retrieved from the cache (default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneCapabilities" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.centralScene.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.centralScene.maxSceneCount=<integer> | The maximum number of scenes. |
| data.interface.centralScene.slowRefresh=<boolean> | true if slow refresh is supported, false if it isn’t. |
| data.interface.centralScene.keyAttributes=[<object>] | Only valid if the Central Scene Command Class supports version 2 and above. |
| data.interface.centralScene.keyAttributes.sceneNumber=<integer> | The scene number. |
| data.interface.centralScene.keyAttributes.support=[<string>] | An array of key attributes defined in the Central scene key attributes table below. |

| Key attributes | Code | Description |
| --- | --- | --- |
| singleKeyPress | 0 | A key is pressed and released before timeout. |
| keyReleased | 1 | A key is released, terminating a keyHeldDown sequence. |
| keyHeldDown | 2 | A key is pressed and not released before timeout. |
| keyPress2Times | 3 | A key is pressed two times. |
| keyPress3Times | 4 | A key is pressed three times. |
| keyPress4Times | 5 | A key is pressed four times. |
| keyPress5Times | 6 | A key is pressed five times. |
| unknown | N.A | Unknown. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneCapabilities" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getCentralSceneConfiguration" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneConfiguration" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.centralScene.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.centralScene.slowRefresh=<boolean> | The slow refresh status of the keyHeldDown notification. true if enabled, false otherwise. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneConfiguration" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setCentralSceneConfiguration" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.slowRefresh=<boolean> | true if slow refresh should be used, false otherwise. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setCentralSceneConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setCentralSceneConfiguration" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getCentralSceneState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.centralScene.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.centralScene.sequenceNumber=<integer> | The sequence number incremented when a new report is issued. |
| data.interface.centralScene.keyAttribute=<string> | The key attribute. The available key attributes are specified in the Central scene key attributes table in getCentralSceneCapabilities. |
| data.interface.centralScene.sceneNumber=<integer> | The actual scene identifier. |
| data.interface.centralScene.slowRefresh=<boolean> | The status for the slow refresh of the keyHeldDown notification. true if enabled, false otherwise. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCentralSceneState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getAntiTheftUnlockState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the state is fetched from the end node and false if the state is retrieved from the cache (default value). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAntiTheftUnlockState" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.centralScene.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.antiTheftUnlock.stateNum=<integer> | Indicates the number of state changes. Please note that the counter will loop from 0 when it reaches 0xFFFF. |
| data.interface.antiTheftUnlock.state=<boolean> | true if locked, false otherwise. |
| data.interface.antiTheftUnlock.restricted=<boolean> | true if the node is running in restricted mode. |
| data.interface.antiTheftUnlock.hint=<string> | A hex string consisting of between 0–10 bytes and containing hints that helps you retrieve the Magic Code needed to unlock. |
| data.interface.antiTheftUnlock.manufacturerID=<integer> | The manufacturer ID belonging to the company whose product has locked the node. |
| data.interface.antiTheftUnlock.entityID=<integer> | The entity ID, a unique identifier for the entity that locked the node. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAntiTheftUnlockState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setAntiTheftUnlockState" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.code=<string> | The Magic Code used to unlock the node with a hex string between 1–10 bytes, where every byte is represented by two characters. For example, 0x01 0x02 0xFF would be presented as 0102FF. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setAntiTheftUnlockState" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setAntiTheftUnlockState" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setTemperatureThreshold" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.active=<boolean> | Defines the state of the temperature threshold functionality. Can be either active true or inactive false. |
| params.warningRule=<string>Optional | Defines when the temperature threshold event should be triggered. Can be either above or below. |
| params.threshold=<integer>Optional | The threshold value that may be either above or below the target temperature depending on warningRule. Hysteresis is not included. |
| params.unit=<string>Optional | The supported temperature units. Can be either Celsius or Fahrenheit. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setTemperatureThreshold" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setTemperatureThreshold" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getTemperatureThreshold" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.unit=<string> Optional | The supported temperature unit. Can be either Celsius (default) or Fahrenheit. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getTemperatureThreshold" | The requested method. |
| data.active=<boolean> | Defines the state of the temperature threshold functionality. Can be either active true or inactive false. |
| data.warningRule=<string> | Defines when the temperature threshold event should be triggered. Can be either above or below the specified value, however unknown will be returned if no value has been set. |
| data.threshold=<integer> | The threshold value that may be either above or below the target temperature depending on warningRule. Hysteresis is not included. 0 will be returned if no value has been set. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getTemperatureThreshold" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIoFunctionBinarySwitch" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.ioPortNumber=<integer> | The I/O port number. |
| params.invert=<boolean> | true turns on the Binary-switch when the I/O port is low, false turns on the Binary-switch when the I/O port is high. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionBinarySwitch" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionBinarySwitch" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIoFunctionOneShot" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.ioPortNumber=<integer> | The I/O port number. |
| params.alarmType=<integer> | The alarm/notification type. |
| params.event=<integer> | The event that sets the I/O port to high for a duration of time. |
| params.invert=<boolean> | true turns on the Binary-switch when the I/O port is low, false turns on the Binary-switch when the I/O port is high. |
| params.duration=<integer> | Specifies the time, in seconds, that the I/O port should be kept high or low depending on the invert flag before returning back to its default value. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionOneShot" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionOneShot" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIoFunctionSetReset" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.ioPortNumber=<integer> | The I/O port number. |
| params.setAlarmType=<integer> | The alarm/notification type for the set event. |
| params.setEvent=<integer> | The event that sets the I/O port to high. |
| params.resetAlarmType=<integer> | The alarm/notification type for the reset event. |
| params.resetEvent=<integer> | The reset event that resets the I/O port to low. |
| params.invert=<boolean> | true inverts the action where the set event sets the I/O port to low and the reset event will set it back to high, while false uses the set event to set the I/O port to high and reset will set it back to low. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionSetReset" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionSetReset" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIoFunctionToggle" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |
| params.ioPortNumber=<integer> | The I/O port number. |
| params.alarmType=<integer> | The alarm/notification type. |
| params.event=<integer> | The I/O toggle event. In this case, the I/O port should be set to high if it was previously low, or low if it was high. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionToggle" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoFunctionToggle" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="removeIoFunction" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeIoFunction" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="removeIoFunction" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getIoConfiguration" | The method that should be used. |
| params.endpointDescriptor=<integer> | The endpoint descriptor. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIoConfiguration" | The requested method. |
| data.endpointDescriptor=<integer> | The given endpointDescriptor. |
| data.ioConfiguration.ioFunction=<string> | The I/O function used by the end node configuration. Current values are Set/Reset, Toggle, One-shot and Binary-switch. |
| data.ioConfiguration.enabled=<boolean> | A boolean indicating if the configuration is currently used. |
| data.ioConfiguration.ioPortNumber=<integer> | The I/O port number. |
| data.ioConfiguration.alarmType=<integer> | The alarm/notification type for the set event. This parameter is not used by the configuration if the value is 0. |
| data.ioConfiguration.event=<integer> | The event used by the I/O function. This parameter is not used by the configuration if the value is 0. |
| data.ioConfiguration.resetAlarmType=<integer> | The alarm/notification type for the reset event valid for the Set/Reset I/O function. This parameter is not used by the configuration if the value is 0. |
| data.ioConfiguration.resetEvent=<integer> | The reset event valid for the Set/Reset I/O function. This parameter is not used by the configuration if the value is 0. |
| data.ioConfiguration.invert=<boolean> | A boolean indicating if the I/O action should be inverted. This parameter is valid for the I/O functions Set/Reset, One-shot and Binary-switch. |
| data.ioConfiguration.duration=<integer> | Specifies the duration, in seconds, when the I/O port should be high/low. This parameter is only valid for the I/O function One-shot. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIoConfiguration" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getAllNotificationEventSupport" | The method that should be used. |
| params.interfaceDescriptor=<integer> | The interface descriptor. |
| params.refresh=<boolean> Optional | true if the supported types is fetched from the end node and false if it is retrieved from the cached. Retrieves from the cache by default. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAllNotificationEventSupport" | The requested method. |
| data.interface.interfaceDescriptor=<integer> | The interface descriptor. |
| data.interface.notification.lastUpdated=<string> | The last updated time, presented in the ISO 8601 basic format (YYYYMMDDThhmmss). For example, no Z-Wave reports were received since the server started if 19700101T000000 is shown, and the rest of the values in the response should be considered undefined. |
| data.interface.notification.zwaveAlarmTypeList=[<object>] | A list containing the supported Z-Wave alarm/notification types and their corresponding zwaveEventList. |
| data.interface.notification.zwaveAlarmTypeList.type=<integer> | The alarm/notification type. |
| data.interface.notification.zwaveAlarmTypeList.code=<integer> | A code denoting the alarm/notification type. The most common alarm/notification can be found in the table Common Z-Wave alarm types in getNotificationCapabilities. |
| data.interface.notification.zwaveAlarmTypeList.zwaveEventList=[object] | Lists the events supported by the specified alarm/notification type. |
| data.interface.notification.zwaveAlarmTypeList.zwaveEventList.type=<string> | An event name denoting the supported event for a specific alarm/notification type. |
| data.interface.notification.zwaveAlarmTypeList.zwaveEventList.code=<integer> | A code denoting the supported event for a specific alarm/notification type. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getAllNotificationEventSupport" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| data.apiVersions[]=<list of versions> | A list containing all supported major versions along with their highest minor version, e.g. ["1.0", "1.2"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| JSON Code | HTTP Code | Description |
| --- | --- | --- |
| 1100 | 500 | Internal error.(2) |
| 1200 | 400 | Z-Wave is disabled. |
| 1201 | 500 | Open file error. |
| 2100 | 400 | API version not supported. |
| 2101 | 400 | Invalid JSON. |
| 2102 | 400 | Method not supported. |
| 2103 | 400 | Required parameter missing. |
| 2104 | 400 | Invalid parameter value specified. |
| 2105 | 403 | Authorization failed. |
| 2106 | 401 | Authentication failed. |
| 2107 | 4XX, 5XX | Transport-level error. |
| 2200 | 400 | Bad interface descriptor. |
| 2201 | 400 | Command Class Version not supported. |
| 2202 | 400 | Bad endpoint descriptor. |
| 2203 | 400 | Timeout. |
| 2204 | 400 | Operation already in progress. |
| 2205 | 400 | Maximum nodes reached. |
| ... | ... | ... |

