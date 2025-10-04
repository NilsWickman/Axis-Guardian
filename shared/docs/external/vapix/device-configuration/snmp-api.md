# SNMP Configuration API

**Source:** https://developer.axis.com/vapix/device-configuration/snmp-api/
**Last Updated:** Sep 10, 2025

---

# SNMP Configuration API

## Description​

## Use cases​

### General SNMP settings​

#### Get number of times SNMP has started​

### Settings for SNMP V1​

#### Enable SNMP V1​

### Settings for SNMP V2​

#### Enable SNMP V2​

### Common settings for SNMP V1 and V2​

#### Set the common SNMP settings​

#### Enable trap related settings​

#### Get all common settings for SNMP V1 and V2​

### Settings for SNMP V3​

## Structure​

### Entities​

#### snmp.v1​

#### snmp.v1.snmpV1​

#### snmp.v1.snmpV1V2Common​

#### snmp.v1.snmpV1V2Common.trap​

#### snmp.v1.snmpV2​

#### snmp.v1.snmpV3​

### Properties​

#### snmp.v1.enabled​

#### snmp.v1.engineBoots​

#### snmp.v1.transportProtocol​

#### snmp.v1.snmpV1.enabled​

#### snmp.v1.snmpV1V2Common.address​

#### snmp.v1.snmpV1V2Common.readCommunity​

#### snmp.v1.snmpV1V2Common.writeCommunity​

#### snmp.v1.snmpV1V2Common.trap.authFailEnabled​

#### snmp.v1.snmpV1V2Common.trap.coldStartEnabled​

#### snmp.v1.snmpV1V2Common.trap.community​

#### snmp.v1.snmpV1V2Common.trap.enabled​

#### snmp.v1.snmpV1V2Common.trap.linkDownEnabled​

#### snmp.v1.snmpV1V2Common.trap.linkUpEnabled​

#### snmp.v1.snmpV2.enabled​

#### snmp.v1.snmpV3.enabled​

#### snmp.v1.snmpV3.userPasswd​

#### snmp.v1.snmpV3.userPasswdSet​

### Data types​

#### CommunityNameType​

#### EngineBootsType​

#### TransportProtocolEnum​

#### TrapAddressType​

#### UserPasswdType​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

The VAPIX SNMP Configuration API makes it possible to configure the SNMP settings on the device. There are three different versions of SNMP that can be configured.
Version 1 and 2 share some settings that are applied to both versions. These settings include configuration of what kind of trap messages to receive.

General settings that affect all the versions of SNMP.

Set the property snmp.v1.enabled to true to enable SNMP, to false to turn it off. By default SNMP is turned off.

Use the property snmp.v1.transportProtocol to set what transport protocol SNMP should use. Valid values are tcp or udp. Default value is udp.

Example:

Use the property snmp.v1.engineBoots to get the number of times SNMP has started.

Example:

SNMP V1 share settings with SNMP V2. See Common settings for SNMP V1 and V2 for more information about the settings.

To enable SNMP V1, set the property snmp.v1.snmpV1.enabled to true.

Example:

SNMP V2 share settings with SNMP V1. See Common settings for SNMP V1 and V2 for more information about the settings.

To enable SNMP V2, set the property snmp.v1.snmpV2.enabled to true.

Example:

These settings are applied to both SNMP V1 and V2.

Example:

Example:

Use snmp.v1.snmpV1V2Common to get all the common settings for SNMP V1 and V2. The response includes if trap messages are enabled and what kind of trap messages are enabled.

Example:

Example:

```
PATCH /config/rest/snmp/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "enabled": true,        "transportProtocol": "tcp"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/snmp/v1/engineBoots HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": 1}
```

```
PATCH /config/rest/snmp/v1/snmpV1/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": true}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/snmp/v1/snmpV2/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": true}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/snmp/v1/snmpV1V2Common HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "address": "0.0.0.0",        "readCommunity": "string",        "writeCommunity": "string"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/snmp/v1/snmpV1V2Common/trap HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "authFailEnabled": true,        "coldStartEnabled": true,        "community": "string",        "enabled": true,        "linkUpEnabled": true,        "linkDownEnabled": true    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/snmp/v1/snmpV1V2Common HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": [        {            "address": "0.0.0.0",            "readCommunity": "public",            "trap": {                "authFailEnabled": true,                "coldStartEnabled": true,                "community": "public",                "enabled": true,                "linkUpEnabled": true            },            "writeCommunity": "write"        }    ]}
```

```
PATCH /config/rest/snmp/v1/snmpV3 HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "enabled": true,        "userPasswd": "password"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
snmp.v1 (Root Entity)    ├── enabled    ├── engineBoots    ├── transportProtocol    ├── snmpV1 (Entity)        ├── enabled    ├── snmpV1V2Common (Entity)        ├── address        ├── readCommunity        ├── writeCommunity        ├── trap (Entity)            ├── authFailEnabled            ├── coldStartEnabled            ├── community            ├── enabled            ├── linkDownEnabled            ├── linkUpEnabled    ├── snmpV2 (Entity)        ├── enabled    ├── snmpV3 (Entity)        ├── enabled        ├── userPasswd        ├── userPasswdSet
```

```
{    "minLength": 5,    "maxLength": 32,    "type": "string"}
```

```
{    "minimum": 0,    "type": "integer"}
```

```
{    "enum": ["tcp", "udp"],    "type": "string"}
```

```
{    "maxLength": 46,    "type": "string"}
```

```
{    "minLength": 8,    "maxLength": 50,    "type": "string"}
```

- To receive trap messages from the device, use snmp.v1.snmpV1V2Common.address to set the address of the management server.
- To set the community name for read operations, modify the property snmp.v1.snmpV1V2Common.readCommunity. Default value is public.
- To set the community name for write operations, modify the property snmp.v1.snmpV1V2Common.writeCommunity. Default value is write.

- To enable trap reporting, set the property
snmp.v1.snmpV1V2Common.trap.enabled to true. To turn it off set it to false. Default value is false.
- An SNMP community is the group of devices and management station running SNMP.
Community names are used to identify groups. Modify the property snmp.v1.snmpV1V2Common.trap.community to set the community to use when sending a trap message to the management system.
- To enable trap messages when authentication fails, set the property snmp.v1.snmpV1V2Common.trap.authFailEnabled to true. To turn it off set it to false. Default value is false.
- To enable trap messages when the device is rebooted or restarted, set the property snmp.v1.snmpV1V2Common.trap.coldStartEnabled to true. To turn it off set the property to false. Default value is false.
- To enable trap messages when a link changes from down to up, set the property snmp.v1.snmpV1V2Common.trap.linkUpEnabled to true. To turn it off set the property to false. Default value is false.
- To enable trap messages when a link changes from up to down, set the property snmp.v1.snmpV1V2Common.trap.linkDownEnabled to true. To turn it off set the property to false. Default value is false.

- To enable SNMP V3, set the property snmp.v1.snmpV3.enabled to true. Set it to false to turn it off. Default value is false.
- To enable user password for SNMP V3, set the property snmp.v1.snmpV3.userPasswd to true.
- To turn off user password for SNMP V3, set the property snmp.v1.snmpV3.userPasswdSet to false. Default value is false.

- Description: SNMP root entity
- Type: Singleton
- Operations:

Get
Set

Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3
- Get
- Set

Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3
- Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3

- Get
- Set

Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3
- Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3

- Fields: enabled, engineBoots, transportProtocol, snmpV1V2Common, snmpV1, snmpV2, snmpV3

- Description: V1 snmp support
- Type: Singleton
- Operations:

Get
Set

Fields: enabled
- Get
- Set

Fields: enabled
- Fields: enabled

- Get
- Set

Fields: enabled
- Fields: enabled

- Fields: enabled

- Description: Entity that has common properties for snmp V1 and V2c
- Type: Singleton
- Operations:

Get
Set

Fields: readCommunity, writeCommunity, address, trap
- Get
- Set

Fields: readCommunity, writeCommunity, address, trap
- Fields: readCommunity, writeCommunity, address, trap

- Get
- Set

Fields: readCommunity, writeCommunity, address, trap
- Fields: readCommunity, writeCommunity, address, trap

- Fields: readCommunity, writeCommunity, address, trap

- Description: Trap
- Type: Singleton
- Operations:

Get
Set

Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled
- Get
- Set

Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled
- Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled

- Get
- Set

Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled
- Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled

- Fields: authFailEnabled, coldStartEnabled, community, enabled, linkUpEnabled, linkDownEnabled

- Description: V2c snmp support
- Type: Singleton
- Operations:

Get
Set:

Fields: enabled
- Get
- Set:

Fields: enabled
- Fields: enabled

- Get
- Set:

Fields: enabled
- Fields: enabled

- Fields: enabled

- Description: V3 snmp support
- Type: Singleton
- Operations:

Get
Set

Fields: enabled, userPasswd, userPasswdSet
- Get
- Set

Fields: enabled, userPasswd, userPasswdSet
- Fields: enabled, userPasswd, userPasswdSet

- Get
- Set

Fields: enabled, userPasswd, userPasswdSet
- Fields: enabled, userPasswd, userPasswdSet

- Fields: enabled, userPasswd, userPasswdSet

- Description: Status of snmpd service
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Number of times snmpd has been started
- Data Type: EngineBootsType
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Transport protocol string
- Data Type: TransportProtocolEnum
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of V1 snmp support
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Trap address
- Data Type: TrapAddressType
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Read Community string
- Data Type: CommunityNameType
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Write Community string
- Data Type: CommunityNameType
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of trap authentication failure
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of trap coldstart
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Trap community
- Data Type: CommunityNameType
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of trap usage
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of trap link down
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of trap link up
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of V2c snmp support
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Status of V3 snmp support
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

- Description: Initial password
- Data Type: UserPasswdType
- Operations:

Set

Permissions: admin
- Set

Permissions: admin
- Permissions: admin

- Set

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: Status of initial password
- Data Type: boolean
- Operations:

Get

Permissions: viewer, operator, admin


Set

Permissions: admin
- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Get

Permissions: viewer, operator, admin
- Permissions: viewer, operator, admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: viewer, operator, admin

- Permissions: admin

