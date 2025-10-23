# Network settings API

**Source:** https://developer.axis.com/vapix/device-configuration/network-settings-api/
**Last Updated:** Sep 10, 2025

---

# Network settings API

## Description​

## Use cases​

### Manage switch settings​

#### Get switch configuration​

#### Get switch port settings​

#### Set switch port settings​

## API definition​

### Structure​

### Entities​

#### network-settings.v2​

##### Properties​

###### switch_supported​

#### network-settings.v2.switch​

#### network-settings.v2.switch.port​

##### Properties​

###### enabled​

###### lowerState​

###### portId​

###### remoteAddresses​

###### security_supported​

#### network-settings.v2.switch.port.security​

##### Properties​

###### authServerEnabled​

###### authServerEnforced​

###### authState​

###### macSecState​

### Data types​

#### AuthServerEnforced​

#### AuthState​

#### MacAddress​

#### MacSecState​

#### RemoteAddresses​

#### State​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

The Network settings API makes it possible to configure the network settings on the device.

This API includes operations on sensitive data. You must use a secured channel for the communication transmissions.

Some devices have built-in switches that allow additional products to be connected for network connectivity. Switch support is dynamic and not always available. Use switch_supported to check switch support on the device.

The switch entity network-settings.v2.switch will return the current switch configuration if switch_supported is true, otherwise not available.

Retrieve individual port settings from the collection of switch ports with portId.

The switch port security settings are dynamically supported. Check security_supported for availability. security will be excluded if it is not supported.

Set portId to configure individual port settings on the collection of switch ports.

The switch port security settings are dynamically supported. Check security_supported for availability. You can't set security if security settings are not supported.

```
{    "request": {        "operation": "GET",        "path": "network-settings.v2.switch"    },    "response": {        "status": "success",        "data": [            {               "port": [                    {                        "lowerState": "UP",                        "portId": "1",                        "remoteAddresses": [                            "55:72:97:5a:c7:cf"                        ],                        "security_supported": false,                        "enabled": true,                        "security": {                            "macSecState": "SECURED",                            "authServerEnabled": true,                            "authServerEnforced": "MACSEC_SECURED",                            "authState": "AUTHENTICATED"                        }                    },                    {                        "lowerState": "DOWN",                        "portId": "2",                        "remoteAddresses": [],                        "security_supported": true,                        "enabled": true,                        "security": {                            "macSecState": "UNKNOWN",                            "authServerEnabled": true,                            "authServerEnforced": "AUTHENTICATED",                            "authState": "UNKNOWN"                        }                    }                ]            }        ]    }}
```

```
{    "request": {        "operation": "GET",        "path": "network-settings.v2.switch.port['1']"    },    "response": {        "status": "success",        "data": {                    "lowerState": "UP",                    "portId": "1",                    "remoteAddresses": [                        "55:72:97:5a:c7:cf"                    ],                    "security_supported": true,                    "enabled": true,                    "security": {                        "macSecState": "SECURED",                        "authServerEnabled": true,                        "authServerEnforced": "MACSEC_SECURED",                        "authState": "AUTHENTICATED"                    }                }    }}
```

```
{    "request": {        "operation": "SET",        "path": "network-settings.v2.switch.port['1']",        "data": {            "enabled": true,            "security": {                "authServerEnabled": false,                "authServerEnforced": "NONE"            }        }    },    "response": {        "status": "success"    }}
```

```
network-settings.v2 (Root Entity)    ├── switch_supported (Property)    ├── switch (Entity)        ├── port (Entity Collection)            ├── enabled (Property)            ├── lowerState (Property)            ├── portId (Property)            ├── remoteAddresses (Property)            ├── security_supported (Property)            ├── security (Entity)                ├── authServerEnabled (Property)                ├── authServerEnforced (Property)                ├── authState (Property)                ├── macSecState (Property)
```

- To enable a port, set enabled to true, which is the default value.
- To disable a port, set enabled to false.

- Description: System wide network configurations
- Type: Singleton
- Operations

Get
- Get
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

- Dynamic Support: No

- Description: Indicates if switch is supported.
- Datatype: boolean
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Global switch configurations
- Type: Singleton
- Operations

Get
- Get
- Attributes

Dynamic Support: Yes
- Dynamic Support: Yes

- Get

- Dynamic Support: Yes

- Description: Switch port configurations
- Type: Collection (Key Property: portId)
- Operations

Get
Set
- Get
- Set
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

- Dynamic Support: No

- Description: Specifies if a network interface device is enabled.
- Datatype: boolean
- Operations

Get
Set (Permissions: admin)
- Get
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Indicates if the network interface device status is UP or DOWN.
- Datatype: State
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Switch port ID
- Datatype: string
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: List all stored remote MAC addresses observed on the switch port.
- Datatype: RemoteAddresses
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Indicates if security is supported.
- Datatype: boolean
- Operations

Get
Set (Permissions: admin)
- Get
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Switch port security configurations
- Type: Singleton
- Operations

Get
Set
- Get
- Set
- Attributes

Dynamic Support: Yes
- Dynamic Support: Yes

- Get
- Set

- Dynamic Support: Yes

- Description: Indicates if the authentication server is enabled.
- Datatype: boolean
- Operations

Get
Set (Permissions: admin)
- Get
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Indicates if the authentication server is enforced
- Datatype: AuthServerEnforced
- Operations

Get
Set (Permissions: admin)
- Get
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Indicates the authentication state of the port
- Datatype: AuthState
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Indicates the MACSec state of the port
- Datatype: MacSecState
- Operations

Get
- Get
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Authentication server enforcement level
- Type: string
- Enum Values: NONE, AUTHENTICATED, MACSEC_SECURED

- Description: Authentication state type
- Type: string
- Enum Values: UNKNOWN, AUTHENTICATED, AUTHENTICATING, STOPPED, FAILED

- Description: MAC address type
- Type: string
- Pattern: ^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$

- Description: MACsec state type
- Type: string
- Enum Values: UNKNOWN, SECURED, CONNECTING, STOPPED, FAILED

- Description: Remote addresses type
- Type: array
- Element type: MacAddress
- Null Value: No

- Description: Link state type
- Type: string
- Enum Values: UP, DOWN

