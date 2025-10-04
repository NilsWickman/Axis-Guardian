# Best Snapshot Configuration API

**Source:** https://developer.axis.com/vapix/device-configuration/best-snapshot-configuration/
**Last Updated:** Sep 10, 2025

---

# Best Snapshot Configuration API

## Description​

## Use cases​

### Enable best snapshot with margin​

### Disable best snapshot​

### Get best snapshot settings​

## API definition​

### Structure​

#### Entities​

##### best-snapshot.v1​

#### Properties​

##### best-snapshot.v1.enabled​

##### best-snapshot.v1.margin​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

The Best Snapshot Configuration API provides configuration for sending cropped snapshots of objects with metadata from analytics metadata producers, for example, "Analytics Scene Description".

With this API, you can configure:

This example shows how to enable best snapshot with margin.

JSON request:

JSON response:

This example shows how to disable best snapshot.

JSON request:

JSON response:

This example shows how to get and understand the best snapshot settings.

JSON request:

JSON response:

```
PATCH /config/rest/best-snapshot/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "enabled": true,        "margin": true    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
PATCH /config/rest/best-snapshot/v1/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": false}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/best-snapshot/v1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "enabled": true,        "margin": true    }}
```

```
best-snapshot.v1 (Root Entity)    ├── enabled (Property)    ├── margin (Property)
```

- Whether to generate cropped snapshots of objects to be included by analytics metadata producers.
- Whether the cropped snapshot should have a margin which includes more of the image around the bounding box.

- If the value of enabled is true, best snapshot is included in the data stream.
- If the value of enabled is false, best snapshot is not included in the data stream.
- If the value of margin is true, best snapshot includes margins.
- If the value of margin is false, best snapshot does not include margins.

- Description: Root entity
- Type: Singleton
- Operations:

Get
Set

Fields: enabled, margin
- Get
- Set

Fields: enabled, margin
- Fields: enabled, margin

- Get
- Set

Fields: enabled, margin
- Fields: enabled, margin

- Fields: enabled, margin

- Description: Whether to generate cropped snapshots of objects that can be included by downstream analytics metadata producers
- Data Type: boolean
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

- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: admin

- Permissions: admin

- Description: Whether the cropped snapshot should include more of the image around the object bounding box
- Data Type: boolean
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

- Get

Permissions: admin
- Permissions: admin
- Set

Permissions: admin
- Permissions: admin

- Permissions: admin

- Permissions: admin

