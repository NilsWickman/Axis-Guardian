# Firewall configuration service

**Source:** https://developer.axis.com/vapix/device-configuration/firewall-configuration-api/
**Last Updated:** Sep 29, 2025

---

# Firewall configuration service

## Overview​

## Use cases​

### Manage firewall​

#### Activate/deactivate firewall​

#### Check if firewall is activated​

### Manage firewall rules​

### Custom errors​

#### GET active default firewall policy​

#### GET pending default firewall policy​

#### List all firewall rules​

#### Edit firewall rules​

#### Re-order firewall rules​

#### Remove firewall rules​

#### Confirm pending firewall rules​

#### Clear pending firewall rules​

## API definition​

### Structure​

### Entities​

#### firewall.v1​

##### Properties​

#### firewall.v1.activated​

##### Actions​

##### firewall.v1.conf​

##### Properties​

##### Actions​

##### firewall.v1.conf.clearPendingRules​

##### firewall.v1.conf.confirmRules​

##### firewall.v1.conf.setRules​

##### firewall.v1.conf.rules​

##### Firewall rules entity​

##### Properties​

##### firewall.v1.conf.rules.activeDefaultPolicy​

##### activeRules​

##### firewall.v1.conf.rules.pendingDefaultPolicy​

##### firewall.v1.conf.rules.pendingRules​

##### firewall.v1.conf.rules.testTimeLeft​

##### Actions​

### Data types​

#### Filter​

#### IPRange​

#### Limit​

#### LimitAmount​

#### LimitPeriod​

#### LimitUnit​

#### MAC​

#### NetworkPort​

#### PktType​

#### Policy​

#### Port​

#### PortRange​

#### PortType​

#### PositiveNumValue​

#### Rule​

#### RuleList​

#### RuleType​

#### SetRulesReqData​

The Firewall configuration service API enables you to add, retrieve, edit, reorder, and remove existing firewall rules. In addition to rule management, the API allows you to activate or deactivate the firewall, check its current status, and test firewall rules before applying changes.

This API includes operations on sensitive data. You must use a secured channel for the communication transmissions.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

The Firewall Configuration API can activate or deactivate the firewall, and check if the firewall is activated.

To activate or deactivate the firewall, set firewall.v1.activated via a HTTP request.

JSON request:

JSON response:

The state of the firewall service can be checked by getting the
firewall.v1.activated property. This API will check if the firewall is
activated. Response is false if the service is not activated.

JSON request:

JSON response:

You can apply the firewall rules to filter or rate limit inbound traffic to the device.

This example shows how to retrieve firewall.v1.conf.rules.activeDefaultPolicy property to get the active default firewall policy.

JSON request:

JSON response:

This example shows how to retrieve firewall.v1.conf.rules.pendingDefaultPolicy property to get the pending default firewall policy.

JSON request:

JSON response:

This example shows how to retrieve the firewall.v1.conf.rules sub-entity to obtain a list of all configured firewall rules.

JSON request:

JSON response:

This example shows how to use firewall.v1.conf.setRules to edit the existing firewall rules.

The changes are written to the activeRules list. If fallbackTime is set to 0, the changes are immediately applied and the current pendingRules is cleared.

If you set rules with fallbackTime greater than 0 when the firewall is inactive, error 103 is returned.

For each rule, only one option from layer 2, 3, or 4 is allowed. To apply a rule to multiple options within the same network layer, you must create separate rules.

JSON request:

JSON response:

This example shows how to use firewall.v1.conf.setRules to reorder the existing firewall rules.

The changes are written to the activeRules list. If fallbackTime is set to 0, the changes are immediately applied and the current pendingRules is cleared.

If you set rules with fallbackTime greater than 0 when the firewall is inactive, error 103 is returned.

JSON request:

This example shows how to use firewall.v1.conf.setRules to remove the existing firewall rules.

The changes are written to the activeRules list. If fallbackTime is set to 0, the changes are immediately applied and the current pendingRules is cleared.

If you set rules with fallbackTime greater than 0 when the firewall is inactive, error 103 is returned.

JSON request:

Active firewall rules are confirmed by calling the
firewall.v1.conf.confirmRules action. The active rules will then remain
active, deactivating fallback and cleaning the pending rules list.

JSON request:

JSON response:

This example shows how to use firewall.v1.conf.clearPendingRules to clear the pending firewall rules. It will cancel the active pending rules, restore the previous set of rules, and reset the fallback timer.

JSON request:

JSON response:

This entity has no actions.

This is the entity that contains properties and actions to manage firewall
rules.

This entity has no properties.

This is the entity that contains the firewall rules.
Firewall rules are read-only properties that reflects the current state of the rules.
When setting rules, any nullable rule members can be omitted instead of explicitly setting them to null.

This entity has no actions.

When specifying a limit on new connection for UDP packages, each UDP package is not treated as a separate new connection. Instead, subsequent UDP packages from the same source IP and port to a specific destination. IP and port
are treated as a single tracked connection. This connection has a 30 second timeout, which resets with each UDP new package from the same source and destination.
In addition to the new connection limit, it is possible to specify a general limit for all packets within the connection using PACKETS unit. The main use is to be able to limit replied UDP connections.

```
PATCH /config/rest/firewall/v1/activated HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": true}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
GET /config/rest/firewall/v1/activated HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": "true"}
```

```
GET /config/rest/firewall/v1/conf/rules/activeDefaultPolicy HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": "DROP"}
```

```
GET /config/rest/firewall/v1/conf/rules/pendingDefaultPolicy HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": "DROP"}
```

```
GET /config/rest/firewall/v1/conf/rules HTTP/1.1Host: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": {    "activeRules": [      {        "ruleType": "FILTER",        "ip": null,        "ipRange": {          "start": "192.168.2.10",          "end": "192.168.2.128"        },        "mac": null,        "tcpPort": 80,        "udpPort": null,        "port": null,        "portRange": null,        "pktType": null,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "ip": "192.168.0.14",        "mac": null,        "tcpPort": 80,        "udpPort": null,        "port": null,        "portRange": null,        "pktType": null,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "ip": null,        "mac": null,        "tcpPort": null,        "udpPort": null,        "port": null,        "portRange": {          "portType": "UDP",          "start": 161,          "end": 162        },        "pktType": null,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "ip": "192.168.1.0/20",        "mac": null,        "tcpPort": 80,        "udpPort": null,        "port": null,        "portRange": null,        "pktType": null,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "ip": null,        "mac": "00:1B:63:84:45:E6",        "tcpPort": null,        "udpPort": null,        "port": {          "portType": "TCP",          "portNum": 22        },        "portRange": null,        "pktType": null,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "LIMIT",        "ip": null,        "mac": null,        "tcpPort": null,        "udpPort": null,        "port": {          "portType": "TCP",          "portNum": 443        },        "portRange": null,        "pktType": null,        "limit": {          "amount": 20,          "period": "MINUTE",          "unit": "NEWCONNECTIONS",          "burst": 10        }      },      {        "ruleType": "LIMIT",        "ip": null,        "mac": null,        "tcpPort": null,        "udpPort": null,        "port": null,        "portRange": null,        "pktType": "MULTICAST",        "limit": {          "amount": 100,          "period": "SECOND",          "unit": "NEWCONNECTIONS",          "burst": 50        }      }    ],    "activeDefaultPolicy": "ACCEPT",    "pendingRules": [],    "pendingDefaultPolicy": null,    "testTimeLeft": 0  }}
```

```
POST /config/rest/firewall/v1/conf/setRules HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "rules": [      {        "ruleType": "FILTER",        "ipRange": {          "start": "192.168.2.10",          "end": "192.168.2.128"        },        "tcpPort": 80,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "ip": "192.168.2.16",        "tcpPort": 80,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "portRange": {          "portType": "UDP",          "start": 161,          "end": 162        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "ip": "192.168.1.0/20",        "tcpPort": 80,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "mac": "00:1B:63:84:45:E6",        "port": {          "portType": "TCP",          "portNum": 22        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "LIMIT",        "port": {          "portType": "TCP",          "portNum": 443        },        "limit": {          "amount": 20,          "period": "MINUTE",          "unit": "NEWCONNECTIONS",          "burst": 10        }      },      {        "ruleType": "LIMIT",        "port": {          "portType": "UDP",          "portNum": 5060        },        "limit": {          "amount": 20,          "period": "SECOND",          "unit": "PACKETS",          "burst": 10        }      },      {        "ruleType": "LIMIT",        "pktType": "MULTICAST",        "limit": {          "amount": 100,          "period": "SECOND",          "unit": "NEWCONNECTIONS",          "burst": 50        }      }    ],    "fallbackTime": 30,    "defaultPolicy": "ACCEPT"  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
POST /config/rest/firewall/v1/conf/setRules HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "rules": [      {        "ruleType": "FILTER",        "ip": "192.168.1.0/20",        "tcpPort": 80,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "ip": "192.168.2.16",        "tcpPort": 80,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "ipRange": {          "start": "192.168.2.10",          "end": "192.168.2.128"        },        "tcpPort": 80,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "portRange": {          "portType": "UDP",          "start": 161,          "end": 162        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "mac": "00:1B:63:84:45:E6",        "port": {          "portType": "TCP",          "portNum": 22        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "LIMIT",        "pktType": "MULTICAST",        "limit": {          "amount": 100,          "period": "SECOND",          "unit": "NEWCONNECTIONS",          "burst": 50        }      },      {        "ruleType": "LIMIT",        "port": {          "portType": "UDP",          "portNum": 5060        },        "limit": {          "amount": 20,          "period": "SECOND",          "unit": "PACKETS",          "burst": 10        }      },      {        "ruleType": "LIMIT",        "port": {          "portType": "TCP",          "portNum": 443        },        "limit": {          "amount": 20,          "period": "MINUTE",          "unit": "NEWCONNECTIONS",          "burst": 10        }      }    ],    "fallbackTime": 30,    "defaultPolicy": "ACCEPT"  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
POST /config/rest/firewall/v1/conf/setRules HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "rules": [      {        "ruleType": "FILTER",        "ip": "192.168.2.16",        "tcpPort": 80,        "filter": {          "policy": "ACCEPT"        }      },      {        "ruleType": "FILTER",        "ipRange": {          "start": "192.168.2.10",          "end": "192.168.2.128"        },        "tcpPort": 80,        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "portRange": {          "portType": "UDP",          "start": 161,          "end": 162        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "FILTER",        "mac": "00:1B:63:84:45:E6",        "port": {          "portType": "TCP",          "portNum": 22        },        "filter": {          "policy": "DROP"        }      },      {        "ruleType": "LIMIT",        "port": {          "portType": "TCP",          "portNum": 443        },        "limit": {          "amount": 20,          "period": "MINUTE",          "unit": "NEWCONNECTIONS",          "burst": 10        }      }    ],    "fallbackTime": 30,    "defaultPolicy": "ACCEPT"  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
POST /config/rest/firewall/v1/conf/confirmRules HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {}}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
POST /config/rest/firewall/v1/conf/clearPendingRules HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {}}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
firewall.v1 (Root Entity)  ├── activated (Property)  ├── conf (Entity)    ├── clearPendingRules (Action)    ├── confirmRules (Action)    ├── setRules (Action)    ├── rules (Entity)      ├── activeDefaultPolicy (Property)      ├── activeRules (Property)      ├── pendingDefaultPolicy (Property)      ├── pendingRules (Property)      ├── testTimeLeft (Property)
```

```
{    "description": "Firewall filter type",    "type": "complex",    "fields": {        "policy": {            "description": "Filter policy",            "type": "Policy",            "nullable": false,            "gettable": false        }    }}
```

```
{    "description": "IP range type. Both lower and upper bounds are include",    "type": "complex",    "fields": {        "end": {            "description": "IP range end address",            "type": "string",            "nullable": false,            "gettable": true        },        "start": {            "description": "IP range start address",            "type": "string",            "nullable": false,            "gettable": true        }    }}
```

```
{    "description": "Firewall limit type to define packet rate filtering",    "fields": {        "amount": {            "description": "Max limit units allowed within the specified period",            "type": "LimitAmount",            "nullable": false,            "gettable": true        },        "burst": {            "description": "If the burst limit is reached, the firewall will filter all packets matching the rate limit strategy for the rate specified by amount and period",            "type": "LimitAmount",            "nullable": false,            "gettable": true        },        "period": {            "description": "Limit rate period",            "type": "LimitPeriod",            "nullable": false,            "gettable": true        },        "unit": {            "description": "Limit rate strategy indicating how to enforce the limit rate",            "type": "LimitUnit",            "nullable": false,            "gettable": true        }    }}
```

```
{    "description": "Limit unit amount type",    "minimum": 1,    "maximum": 65535,    "type": "integer"}
```

```
{    "description": "Rate limit period type",    "enum": "NEWCONNECTIONS",    "type": "string"}
```

```
{    "description": "Valid limit rule type",    "enum": ["NEWCONNECTIONS", "PACKETS"],    "type": "string"}
```

```
{    "description": "MAC address type",    "type": "string",    "pattern": "^[0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{2}[-]){5}([0-9A-Fa-f]{2})$"}
```

```
{    "description": "Port address type",    "fields": {        "portType": {            "description": "Port type",            "type": "PortType",            "nullable": false,            "gettable": true        },        "portNum": {            "description": "Port number",            "type": "Port"        }    },    "type": "object"}
```

```
{    "description": "Valid link-layer packet type",    "enum": ["UNICAST", "BROADCAST", "MULTICAST"],    "type": "string"}
```

```
{    "description": "Valid policies",    "enum": ["DROP", "ACCEPT"],    "type": "string"}
```

```
{    "description": "A valid port number",    "maximum": 65535,    "minimum": 1,    "type": "integer"}
```

```
{    "description": "Port range",    "fields": {        "portType": {            "description": "Port type",            "type": "PortType"        },        "start": {            "description": "Port range start number",            "type": "Port"        },        "end": {            "description": "Port range end number",            "type": "Port"        }    },    "type": "object"}
```

```
{    "description": "Port types",    "enum": ["TCP", "UDP", "BOTH"],    "type": "string"}
```

```
{    "description": "Positive number",    "type": "integer",    "minimum": 0}
```

```
{    "description": "Firewall rule entry type",    "fields": {        "filter": {            "description": "Filter rule",            "type": "Filter",            "nullable": true,            "gettable": false        },        "ip": {            "description": "IPv4/IPv6 address or network",            "type": "string",            "nullable": true,            "gettable": false        },        "ipRange": {            "description": "IPv4/IPv6 address range",            "type": "IPRange",            "nullable": true,            "gettable": false        },        "limit": {            "description": "Limit rule",            "type": "Limit",            "nullable": true,            "gettable": false        },        "mac": {            "description": "MAC address",            "type": "MAC",            "nullable": true,            "gettable": false        },        "pktType": {            "description": "The link-layer packet type",            "type": "PktType",            "nullable": true,            "gettable": false        },        "port": {            "description": "A generic port",            "type": "NetworkPort",            "nullable": true,            "gettable": false        },        "portRange": {            "description": "Port address range",            "type": "PortRange",            "nullable": true,            "gettable": false        },        "ruleType": {            "description": "Firewall rule entry type",            "type": "RuleType",            "nullable": false,            "gettable": true        },        "tcpPort": {            "description": "The TCP port",            "nullable": true,            "type": "Port"        },        "udpPort": {            "description": "The UDP port",            "nullable": true,            "type": "Port"        }    }}
```

```
{    "description": "Firewall rule list type",    "type": "array",    "items": {        "type": "Rule"    }}
```

```
{    "description": "Valid rule types",    "type": "string",    "enum": ["FILTER", "LIMIT"]}
```

```
{    "description": "Firewall rules set request data type",    "type": "complex",    "fields": {        "defaultPolicy": {            "description": "Default firewall policy",            "type": "Policy",            "nullable": false,            "gettable": true        },        "fallbackTime": {            "description": "Maximum time in seconds to wait before reverting back to previous active rules",            "type": "PositiveNumValue",            "nullable": false,            "gettable": true        },        "rules": {            "description": "Rules to set as active",            "type": "RuleList",            "nullable": false,            "gettable": true        }    }}
```

- Description: Firewall management
- Type: Singleton
- Operations:

Get

Permissions: admin


Set

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: admin

- Permissions: admin

- Dynamic Support: No

- Description: Firewall service state
- Datatype: boolean
- Operations

Get

Permissions: admin


Set

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: admin

- Permissions: admin

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Firewall configuration
- Type: Singleton
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Dynamic Support: No

- Description: Clear the set of pending rules and abort any active test
- Data Type: Empty Object
- Data Type: Empty Object
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Dynamic Support: No

- Description: Confirm to apply the active firewall rules
- Request Datatype: Empty Object
- Response Datatype: Empty Object
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Dynamic Support: No

- Description: Sets the active firewall rule list
- Data Type: SetRulesReqData
- Data Type: Empty Object
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Dynamic Support: No

- Description: Firewall rules
- Type: Singleton
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Dynamic Support: No

- Description: Active default firewall policy. Default to ACCEPT.
- Datatype: Policy
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Active firewall rules
- Data Type: RuleList
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Pending default firewall policy set by the setRules action
- Data Type: Policy
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Pending firewall rules
- Datatype: RuleList
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Measures the remaining test time for the pending firewall rules
- Datatype: PositiveNumValue
- Operations

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

| Error code | Error message | Description |
| --- | --- | --- |
| 100 | Invalid IP address | The IP address is not a valid IPv4 or IPv6 address. |
| 101 | Invalid IP address range. |  |
| 103 | Invalid request. | The request doesn't meet the internal requirements. See the following use cases. |
| 104 | Invalid port range. |  |

