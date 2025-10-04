# Virtual Host

**Source:** https://developer.axis.com/vapix/device-configuration/virtual-host/
**Last Updated:** Sep 10, 2025

---

# Virtual Host

## Overview​

## Use cases​

### Create a multiple virtual hosts​

### List virtual hosts​

### Reconfigure a virtual host​

### Remove a configured virtual host​

## API definition​

### Structure​

### Entities​

#### virtualhost.v1​

##### Properties​

##### Actions​

###### create_virtualHost​

#### virtualhost.v1.virtualhosts​

##### Properties​

###### active​

###### auth_type​

###### port​

###### server_name​

##### Actions​

### Data types​

#### auth_type​

#### boolean_type​

#### create_virtualhost_input​

#### port_type​

#### server_name_type​

The VAPIX® Virtual Host API makes it possible for the user to chose which authentication schemes they wish to use. Supported
authentication methods include OpenID connect, basic and digest authentication.

With this API, the user can create, list, modify and remove virtual hosts.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

By using the create_virtualHost action a client can set up multiple different virtual hosts using different authentication schemes.
Use the create_virtualHost action to set up multiple virtual hosts with different authentication schemes and on separate ports.

The first one will use basic authentication.

The second one will use OpenID Connect.

The OpenID Connect authentication need to be set up with its dedicated API (see the OpenID Connect Setup).

With the root entity, a client will get a list of all configured virtual hosts.

The SET operation on a virtual host entity can be used to edit an existing virtual host, such as changing between basic and digest.
If the server name is altered, the key for the virtual host will also be changed to the new name.

The change will be visible when listing the virtual hosts.

The Remove operation on a virtual host entity can be used to remove an already configured virtual host.
After it is removed, connections that used that virtual host will no longer be reachable.

The change will be visible when listing the virtual hosts.

This entity has no properties.

This entity has no actions.

```
POST /config/rest/virtualhost/v1/create_virtualHost HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "active": true,        "auth_type": "basic",        "port": 8081,        "server_name": "example-2"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
POST /config/rest/virtualhost/v1/create_virtualHost HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "active": true,        "auth_type": "oidc",        "port": 8080,        "server_name": "example-1"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/virtualhost/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "virtualhosts": [            {                "active": true,                "auth_type": "oidc",                "port": 8080,                "server_name": "example-1"            },            {                "active": true,                "auth_type": "basic",                "port": 8081,                "server_name": "example-2"            }        ]    }}
```

```
PATCH /config/rest/virtualhost/v1/virtualhosts/example-2/port HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": 8082}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/virtualhost/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "virtualhosts": [            {                "active": true,                "auth_type": "oidc",                "port": 8080,                "server_name": "example-1"            },            {                "active": true,                "auth_type": "basic",                "port": 8082,                "server_name": "example-2"            }        ]    }}
```

```
DELETE /config/rest/virtualhost/v1/virtualhosts/example-2 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/virtualhost/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "virtualhosts": [            {                "active": true,                "auth_type": "oidc",                "port": 8080,                "server_name": "example-1"            }        ]    }}
```

```
virtualhost.v1 (Root Entity)    ├── create_virtualHost (Action)    ├── virtualhosts (Entity Collection)        ├── active (Property)        ├── auth_type (Property)        ├── port (Property)        ├── server_name (Property)
```

- Description: VirtualHosts management.
- Type: Singleton
- Operations

GET
- GET
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET

- Dynamic Support: No

- Description: Create a virtual host.
- Request Datatype: create_virtualhost_input
- Response Datatype: Empty Object
- Trigger Permissions: admin

- Description: Modify Virtual Host or delete it.
- Type: Collection (Key Property: server_name)
- Operations

GET
SET

Properties: active, auth_type, port, server_name


Remove (Permissions: admin)
- GET
- SET

Properties: active, auth_type, port, server_name
- Properties: active, auth_type, port, server_name
- Remove (Permissions: admin)
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET
- SET

Properties: active, auth_type, port, server_name
- Properties: active, auth_type, port, server_name
- Remove (Permissions: admin)

- Properties: active, auth_type, port, server_name

- Dynamic Support: No

- Description: Enalble auth type.
- Datatype: boolean_type
- Operations

GET (Permissions: admin)
SET (Permissions: admin)
- GET (Permissions: admin)
- SET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)
- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The name of the authentication schema.
- Datatype: auth_type
- Operations

GET (Permissions: admin)
SET (Permissions: admin)
- GET (Permissions: admin)
- SET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)
- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The port that the auth type will use.
- Datatype: port_type
- Operations

GET (Permissions: admin)
SET (Permissions: admin)
- GET (Permissions: admin)
- SET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)
- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Server name for auth type.
- Datatype: server_name_type
- Operations

GET (Permissions: admin)
SET (Permissions: admin)
- GET (Permissions: admin)
- SET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)
- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Authentication type.
- Type: string
- Minimum Length: 1
- Maximum Length: 32
- Pattern: ^(basic|digest|oidc)$

- Description: true or false.
- Type: boolean

- Description: VirtualHost creation action parameters.
- Type: complex
- Fields

active

Description: Virtual host state, active or not.
Type: boolean_type
Nullable: No / Gettable: No


auth_type

Description: Authentication type.
Type: auth_type
Nullable: No / Gettable: No


port

Description: Port number.
Type: port_type
Nullable: No / Gettable: No


server_name

Description: Server name that vh will be based on.
Type: server_name_type
Nullable: No / Gettable: No
- active

Description: Virtual host state, active or not.
Type: boolean_type
Nullable: No / Gettable: No
- Description: Virtual host state, active or not.
- Type: boolean_type
- Nullable: No / Gettable: No
- auth_type

Description: Authentication type.
Type: auth_type
Nullable: No / Gettable: No
- Description: Authentication type.
- Type: auth_type
- Nullable: No / Gettable: No
- port

Description: Port number.
Type: port_type
Nullable: No / Gettable: No
- Description: Port number.
- Type: port_type
- Nullable: No / Gettable: No
- server_name

Description: Server name that vh will be based on.
Type: server_name_type
Nullable: No / Gettable: No
- Description: Server name that vh will be based on.
- Type: server_name_type
- Nullable: No / Gettable: No

- active

Description: Virtual host state, active or not.
Type: boolean_type
Nullable: No / Gettable: No
- Description: Virtual host state, active or not.
- Type: boolean_type
- Nullable: No / Gettable: No
- auth_type

Description: Authentication type.
Type: auth_type
Nullable: No / Gettable: No
- Description: Authentication type.
- Type: auth_type
- Nullable: No / Gettable: No
- port

Description: Port number.
Type: port_type
Nullable: No / Gettable: No
- Description: Port number.
- Type: port_type
- Nullable: No / Gettable: No
- server_name

Description: Server name that vh will be based on.
Type: server_name_type
Nullable: No / Gettable: No
- Description: Server name that vh will be based on.
- Type: server_name_type
- Nullable: No / Gettable: No

- Description: Virtual host state, active or not.
- Type: boolean_type
- Nullable: No / Gettable: No

- Description: Authentication type.
- Type: auth_type
- Nullable: No / Gettable: No

- Description: Port number.
- Type: port_type
- Nullable: No / Gettable: No

- Description: Server name that vh will be based on.
- Type: server_name_type
- Nullable: No / Gettable: No

- Description: port number.
- Type: integer
- Minimum Value: 1
- Maximum Value: 65535

- Description: Client ID type.
- Type: string
- Minimum Length: 1
- Maximum Length: 64
- Pattern: ^[A-Za-z0-9-.]+$

