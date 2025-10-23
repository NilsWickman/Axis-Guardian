# Basic Device Info

**Source:** https://developer.axis.com/vapix/device-configuration/basic-device-info-api/
**Last Updated:** Aug 18, 2025

---

# Basic Device Info

## Use cases​

### Get root entity​

#### Enable anonymous users to access Basic Device Info​

#### Get the state of anonymous user access​

## Structure​

### Entities​

#### basic-device-info.v2 (Entity)​

##### Properties​

###### allowAnonymous​

##### Actions​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

This API is in BETA stage and provided for testing purposes. It is subject to backward-incompatible changes, including modifications to its functionality, behavior and availability. The API should not be used in production environments.

The VAPIX® Basic Device Info API makes it possible to turn on/off anonymous access to a set of Basic Device Info properties on the device.
The access to these properties is currently only possible via the basicdeviceinfo.cgi.

Here is an example on how to get the root entity.

Example

Set the property basic-device-info.v2beta.allowAnonymous to true. This will enable anonymous access. Set it to false to turn off anonymous access. This setting is enabled by default.

Example

Retrieve the property basic-device-info.v2.allowAnonymous. When true, then anonymous access is activated. When false, anonymous access has been deactivated.

Example

This entity has no actions.

```
- GET /config/rest/basic-device-info/v2beta HTTP/1.1- HOST: my-device- Content-Type: application/jsonHTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "allowAnonymous": false    }}
```

```
PATCH /config/rest/basic-device-info/v2beta/allowAnonymous HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "allowAnonymous": true    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/basic-device-info/v2beta/allowAnonymous HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": true}
```

```
basic-device-info.v2 (Root Entity)    ├── allowAnonymous (Property)
```

- Description: Basic Device Info Root Entity
- Type: Singleton
- Operations

Get
- Get
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

- Dynamic Support: No

- Description: Allow anonymous users to access the get properties functions
- Datatype: boolean
- Operations

Get (Permissions: admin, operator, viewer)
Set (Permissions: admin)
- Get (Permissions: admin, operator, viewer)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin, operator, viewer)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

