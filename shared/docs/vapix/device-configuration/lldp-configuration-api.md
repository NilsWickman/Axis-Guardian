# LLDP Configuration API

**Source:** https://developer.axis.com/vapix/device-configuration/lldp-configuration-api/
**Last Updated:** Sep 10, 2025

---

# LLDP Configuration API

## Overview​

## Use cases​

### Manage LLDP​

#### activate/deactivate LLDP​

#### Check if LLDP is active​

#### Get all neighbors​

## API definition​

### Structure​

### Entities​

### Data types​

The VAPIX® LLDP Configuration API makes it possible to activate and deactivate LLDP (Link Layer Discovery Protocol) as well as get neighbors information.

This API includes operations on sensitive data. You must use a secured channel for the communication transmissions.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

Activate/deactivate LLDP and retrieve neighbor information.

The state of the LLDP can be changed by setting the lldp.v1.activated property.

IEEE 802.3bt specifications requires that type 4 or higher-powered PoE Powered Device (PD) supports LLDP for Data Link Layer (DLL) classification. Type 2 PDs are required by the IEEE 802.3at specifications to support DLL negotiation. Please observe that 802.1D compliant switches do not forward LLDP packets. Deactivating LLDP will deactivate fabric attach network automation. Deactivating LLDP may cause unexpected behavior. Proceed with caution.

Example

The state of the LLDP can be checked by getting the lldp.v1.activated property.

Example

All neighbor information from all LLDP configured interfaces can be retrieved by getting the lldp.v1.neighbors property.

Example

lldp.v1

Properties

activated

neighbors

Actions

This entity has no actions.

ChassisID

ChassisIDSubType

MgmtIP

MgmtIPSubType

Neighbor

Neighbors

PortID

PortIDSubType

PositiveInt

Protocol

```
PATCH /config/rest/lldp/v1/activated HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": true}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "information": [    "string"  ],  "warnings": [    "string"  ]}
```

```
GET /config/rest/lldp/v1/activated HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": true,  "information": [      "string"  ],  "warnings": [    "string"  ]}
```

```
GET /config/rest/lldp/v1/neighbors HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": [    {      "TTL": 120,      "age": 0,      "chassisID": {        "subType": "MACAddress",        "value": "34:98:b5:ab:5a:b3"      },      "ifName": "eth0",      "mgmtIP": {        "subType": "IPv4",        "value": "192.168.0.115"      },      "portDescr": null,      "portID": {        "subType": "LocallyAssigned",        "value": "g1"      },      "protocol": "LLDP",      "sysDescr": "GS110TPv3 8-Port Gigabit Smart Managed Pro Switch with PoE+ and 2 SFP Ports",      "sysName": null    },    {      "TTL": 120,      "age": 10,      "chassisID": {        "subType": "MACAddress",        "value": "ac:cc:8e:fd:1f:ca"      },      "ifName": "eth1",      "mgmtIP": {        "subType": "IPv4",        "value": "10.10.1.145"      },      "portDescr": "eth0",      "portID": {        "subType": "MACAddress",        "value": "ac:cc:8e:fd:1f:ca"      },      "protocol": "LLDP",      "sysDescr": "AXIS S3008 Recorder 11.10+snapshot-20240202",      "sysName": "ax-accc8efd1fca"    }  ]  "information": [    "string"  ],  "warnings": [    "string"  ]}
```

```
lldp.v1 (Root Entity)| - activated (Property)| - neighbors (Property)
```

- Description: Main configuration options
- Type: Singleton
- Operation:

GET
- GET
- Attributes:

Dynamic support: No
- Dynamic support: No

- GET

- Dynamic support: No

- Description: LLDP state
- Datatype: Boolean
- Operations:

GET (Permissions: admin)
SET (Permissions: admin)
- GET (Permissions: admin)
- SET (Permissions: admin)
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Rang: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- GET (Permissions: admin)
- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Description: Information about neighbors on the interface
- Datatype: Neighbors
- Operations:

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Rang: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- GET (Permissions: admin)

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Description: The chassis ID type
- Type: Complex
- Fields:

subType

Description: Chassis ID subtype
Type: ChassisIDSubType
Nullable: No
Gettable: No


value

Description: A chassis ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- subType

Description: Chassis ID subtype
Type: ChassisIDSubType
Nullable: No
Gettable: No
- Description: Chassis ID subtype
- Type: ChassisIDSubType
- Nullable: No
- Gettable: No
- value

Description: A chassis ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A chassis ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- subType

Description: Chassis ID subtype
Type: ChassisIDSubType
Nullable: No
Gettable: No
- Description: Chassis ID subtype
- Type: ChassisIDSubType
- Nullable: No
- Gettable: No
- value

Description: A chassis ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A chassis ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: Chassis ID subtype
- Type: ChassisIDSubType
- Nullable: No
- Gettable: No

- Description: A chassis ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: The type of the identifier used for the chassis.
- Type: String
- Enum Values:

"ChassisComponent"
"InterfaceAlias"
"PortComponent"
"MACAddress"
"NetworkAddress"
"InterfaceName"
"LocallyAssigned"
- "ChassisComponent"
- "InterfaceAlias"
- "PortComponent"
- "MACAddress"
- "NetworkAddress"
- "InterfaceName"
- "LocallyAssigned"

- "ChassisComponent"
- "InterfaceAlias"
- "PortComponent"
- "MACAddress"
- "NetworkAddress"
- "InterfaceName"
- "LocallyAssigned"

- Description: The chassis ID type
- Type: Complex
- Fields:

subType

Description: Management IP address subtype
Type: MgmtIPSubType
Nullable: No
Gettable: No


value

Description: A management IP address of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- subType

Description: Management IP address subtype
Type: MgmtIPSubType
Nullable: No
Gettable: No
- Description: Management IP address subtype
- Type: MgmtIPSubType
- Nullable: No
- Gettable: No
- value

Description: A management IP address of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A management IP address of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- subType

Description: Management IP address subtype
Type: MgmtIPSubType
Nullable: No
Gettable: No
- Description: Management IP address subtype
- Type: MgmtIPSubType
- Nullable: No
- Gettable: No
- value

Description: A management IP address of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A management IP address of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: Management IP address subtype
- Type: MgmtIPSubType
- Nullable: No
- Gettable: No

- Description: A management IP address of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: The type of the address used for the management IP
- Type: String
- Enum Values:

"IPv4"
"IPv6"
- "IPv4"
- "IPv6"

- "IPv4"
- "IPv6"

- Description: Neighbor information
- Type: Complex
- Fields:

TTL

Description: Time To Live
Type: PositiveInt
Nullable: No
Gettable: No


age

Description: Age of the neighbor information in seconds from epoch
Type: PositiveInt
Nullable: No
Gettable: No


chassisID

Description: The chassis ID of the neighbor
Type: ChassisID
Nullable: No
Gettable: No


ifName

Description: Name of the interface from which the information is received
Type: String
Nullable: No
Gettable: No


mgmtIP

Description: Management IP of the neighbor
Type: MgmtIP
Nullable: Yes
Gettable: No


portDescr

Description: Port description of the neighbor
Type: String
Nullable: Yes
Gettable: No


portID

Description: Port ID of the neighbor
Type: PortID
Nullable: No
Gettable: No


protocol

Description: The protocol used
Type: Protocol
Nullable: No
Gettable: No


sysDescr

Description: System description of the neighbor
Type: String
Nullable: Yes
Gettable: No


sysName

Description: System hostname of the neighbor
Type: String
Nullable: Yes
Gettable: No
- TTL

Description: Time To Live
Type: PositiveInt
Nullable: No
Gettable: No
- Description: Time To Live
- Type: PositiveInt
- Nullable: No
- Gettable: No
- age

Description: Age of the neighbor information in seconds from epoch
Type: PositiveInt
Nullable: No
Gettable: No
- Description: Age of the neighbor information in seconds from epoch
- Type: PositiveInt
- Nullable: No
- Gettable: No
- chassisID

Description: The chassis ID of the neighbor
Type: ChassisID
Nullable: No
Gettable: No
- Description: The chassis ID of the neighbor
- Type: ChassisID
- Nullable: No
- Gettable: No
- ifName

Description: Name of the interface from which the information is received
Type: String
Nullable: No
Gettable: No
- Description: Name of the interface from which the information is received
- Type: String
- Nullable: No
- Gettable: No
- mgmtIP

Description: Management IP of the neighbor
Type: MgmtIP
Nullable: Yes
Gettable: No
- Description: Management IP of the neighbor
- Type: MgmtIP
- Nullable: Yes
- Gettable: No
- portDescr

Description: Port description of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: Port description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No
- portID

Description: Port ID of the neighbor
Type: PortID
Nullable: No
Gettable: No
- Description: Port ID of the neighbor
- Type: PortID
- Nullable: No
- Gettable: No
- protocol

Description: The protocol used
Type: Protocol
Nullable: No
Gettable: No
- Description: The protocol used
- Type: Protocol
- Nullable: No
- Gettable: No
- sysDescr

Description: System description of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: System description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No
- sysName

Description: System hostname of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: System hostname of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No

- TTL

Description: Time To Live
Type: PositiveInt
Nullable: No
Gettable: No
- Description: Time To Live
- Type: PositiveInt
- Nullable: No
- Gettable: No
- age

Description: Age of the neighbor information in seconds from epoch
Type: PositiveInt
Nullable: No
Gettable: No
- Description: Age of the neighbor information in seconds from epoch
- Type: PositiveInt
- Nullable: No
- Gettable: No
- chassisID

Description: The chassis ID of the neighbor
Type: ChassisID
Nullable: No
Gettable: No
- Description: The chassis ID of the neighbor
- Type: ChassisID
- Nullable: No
- Gettable: No
- ifName

Description: Name of the interface from which the information is received
Type: String
Nullable: No
Gettable: No
- Description: Name of the interface from which the information is received
- Type: String
- Nullable: No
- Gettable: No
- mgmtIP

Description: Management IP of the neighbor
Type: MgmtIP
Nullable: Yes
Gettable: No
- Description: Management IP of the neighbor
- Type: MgmtIP
- Nullable: Yes
- Gettable: No
- portDescr

Description: Port description of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: Port description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No
- portID

Description: Port ID of the neighbor
Type: PortID
Nullable: No
Gettable: No
- Description: Port ID of the neighbor
- Type: PortID
- Nullable: No
- Gettable: No
- protocol

Description: The protocol used
Type: Protocol
Nullable: No
Gettable: No
- Description: The protocol used
- Type: Protocol
- Nullable: No
- Gettable: No
- sysDescr

Description: System description of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: System description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No
- sysName

Description: System hostname of the neighbor
Type: String
Nullable: Yes
Gettable: No
- Description: System hostname of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No

- Description: Time To Live
- Type: PositiveInt
- Nullable: No
- Gettable: No

- Description: Age of the neighbor information in seconds from epoch
- Type: PositiveInt
- Nullable: No
- Gettable: No

- Description: The chassis ID of the neighbor
- Type: ChassisID
- Nullable: No
- Gettable: No

- Description: Name of the interface from which the information is received
- Type: String
- Nullable: No
- Gettable: No

- Description: Management IP of the neighbor
- Type: MgmtIP
- Nullable: Yes
- Gettable: No

- Description: Port description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No

- Description: Port ID of the neighbor
- Type: PortID
- Nullable: No
- Gettable: No

- Description: The protocol used
- Type: Protocol
- Nullable: No
- Gettable: No

- Description: System description of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No

- Description: System hostname of the neighbor
- Type: String
- Nullable: Yes
- Gettable: No

- Description: A list of neighbor information
- Type: Array
- Element type: Neighbor
- Null Value: No

- Description: The port ID type
- Type: Complex
- Fields:

subType

Description: Port ID subtype
Type: PortIDSubType
Nullable: No
Gettable: No


value

Description: A port ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- subType

Description: Port ID subtype
Type: PortIDSubType
Nullable: No
Gettable: No
- Description: Port ID subtype
- Type: PortIDSubType
- Nullable: No
- Gettable: No
- value

Description: A port ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A port ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- subType

Description: Port ID subtype
Type: PortIDSubType
Nullable: No
Gettable: No
- Description: Port ID subtype
- Type: PortIDSubType
- Nullable: No
- Gettable: No
- value

Description: A port ID of the type specified by the subType field
Type: String
Nullable: No
Gettable: No
- Description: A port ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: Port ID subtype
- Type: PortIDSubType
- Nullable: No
- Gettable: No

- Description: A port ID of the type specified by the subType field
- Type: String
- Nullable: No
- Gettable: No

- Description: The type of the identifier used for the port
- Type: String
- Enum Values:

"InterfaceAlias"
"PortComponent"
"MACAddress"
"NetworkAddress"
"InterfaceName"
"AgentCircuitID"
"LocallyAssigned"
- "InterfaceAlias"
- "PortComponent"
- "MACAddress"
- "NetworkAddress"
- "InterfaceName"
- "AgentCircuitID"
- "LocallyAssigned"

- "InterfaceAlias"
- "PortComponent"
- "MACAddress"
- "NetworkAddress"
- "InterfaceName"
- "AgentCircuitID"
- "LocallyAssigned"

- Description: Positive integer type
- Type: Integer
- Minimum Value: 0

- Description: The type of the identifier used for the chassis
- Type: String
- Enum Values:

"LLDP"
"CDPv1"
"CDPv2"
- "LLDP"
- "CDPv1"
- "CDPv2"

- "LLDP"
- "CDPv1"
- "CDPv2"

