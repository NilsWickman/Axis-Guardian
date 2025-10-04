# Edge-to-edge camera pairing API

**Source:** https://developer.axis.com/vapix/device-configuration/edge-to-edge-camera-pairing-api/
**Last Updated:** Sep 10, 2025

---

# Edge-to-edge camera pairing API

## Overview​

## Use cases​

### Pair an external camera to a device​

### Unpair an external camera from a device​

### Get current camera pairing settings​

### Modify an existing camera pairing​

### Get current camera pairing status​

## API definition​

### Structure​

### Entities​

#### Properties​

### Data types​

#### Address​

#### Username​

#### Password​

#### ID​

#### CameraPairingStatus​

#### CameraPairingStreamingProtocol​

#### ProductModel​

#### ProductName​

#### Description​

### Error codes​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

This API is in BETA stage and provided for testing purposes. It is subject to backward-incompatible changes, including modifications to its functionality, behavior and availability. The API should not be used in production environments.

With the edge-to-edge camera pairing API, you can pair your device to an external camera to view video from the external camera on your device.

This example shows how to pair an external camera to a device. Currently you can only add one camera pairing.

Example request

Example successful response

password is not included in the response for security reasons.

Example failure response

This example shows how to unpair an external camera from a device by specifying the ID of the camera pairing.

Example request

Example successful response

Example failure response

This example shows how to get the current camera pairing settings by specifying the ID of the camera pairing.

Example request

Example successful response

Example failure response

This example shows how to modify the address, username, password, description, streamingprotocol, and verifycertificate of the current camera pairing. You need to specify the ID of the camera pairing and the property you want to modify.

Example request to modify the address

Example request to modify the username

Example request to modify the password

Example request to modify the description

Example request to modify the streamingprotocol setting

Example request to modify the verifycertificate setting

Example successful response

Example failure response

This example shows how to get the current status of the camera pairing by specifying the ID of the camera pairing.

Example request

Example successful response

If Error is returned, use Get current camera pairing settings to get more information about the error.

Example failure response

camera-pairing.v1

camera-pairing.v1.camerapairings

id

address

username

password

status

streamingprotocol

verifycertificate

productmodel

productname

description

```
curl -X 'POST' \  '/config/rest/camera-pairing/v1beta/camerapairings' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": {    "address": "string",    "description": "string",    "password": "string",    "streamingprotocol": "SRTSP",    "username": "string",    "verifycertificate": true  }}'
```

```
{  "status": "success",  "data": {    "address": "string",    "description": "string",    "id": "CameraPairing-1717587392-934150",    "productmodel": "I7010-VE",    "productname": "AXIS I7010-VE Network Intercom",    "status": "Paired",    "streamingprotocol": "SRTSP",    "username": "string",    "verifycertificate": true  }}
```

```
{  "error": {    "code": 0,    "message": "string"  },  "status": "string"}
```

```
curl -X 'DELETE' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717585565-843505' \  -H 'accept: application/json'
```

```
{  "status": "success"}
```

```
{  "error": {    "code": 0,    "message": "string"  },  "status": "string"}
```

```
'/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717587844-211730' \  -H 'accept: application/json'
```

```
{  "status": "success",  "data": {    "address": "string",    "description": "string",    "id": "CameraPairing-1717587844-211730",    "productmodel": "I7010-VE",    "productname": "AXIS I7010-VE Network Intercom",    "status": "Paired",    "streamingprotocol": "SRTSP",    "username": "string",    "verifycertificate": true  }}
```

```
{  "error": {    "code": 0,    "message": "string"  },  "status": "string"}
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717585565-843505/address' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": "string"}'
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717585565-843505/username' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": "string"}'
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717585565-843505/password' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": "string"}'
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1731406548-55051/description' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": "string"}'
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1731406548-55051/streamingprotocol' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": "SRTSP"}'
```

```
curl -X 'PATCH' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1731406548-55051/verifycertificate' \  -H 'accept: application/json' \  -H 'Content-Type: application/json' \  -d '{  "data": true}'
```

```
{  "status": "success"}
```

```
{  "error": {    "code": 0,    "message": "string"  },  "status": "string"}
```

```
curl -X 'GET' \  '/config/rest/camera-pairing/v1beta/camerapairings/CameraPairing-1717585565-843505/status' \  -H 'accept: application/json'
```

```
{  "status": "success",  "data": "string"}
```

```
{  "error": {    "code": 0,    "message": "string"  },  "status": "string"}
```

```
camera-pairing.v1 (Root Entity)    camerapairings (Entity Collection)        address (Property)        description (Property)        id (Property)        password (Property)        productmodel (Property)        productname (Property)        status (Property)        streamingprotocol (Property)        username (Property)        verifycertificate (Property)
```

```
{    "description": "Address for the camera pairing",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "Username for the camera pairing",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "Password for the camera pairing",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "The unique ID generated automatically for the camera pairing",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "Current status of the camera pairing",    "enum": ["NotPaired", "Paired", "Error", "Connecting"],    "type": "string"}
```

```
{    "description": "Streaming protocol used for the camera pairing",    "enum": ["RTSP", "SRTSP"],    "type": "string"}
```

```
{    "description": "The product model of the paired camera",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "The full product name of the paired camera",    "maxLength": 64,    "type": "string"}
```

```
{    "description": "Description of the paired camera",    "maxLength": 128,    "type": "string"}
```

- Description: The configuration of edge-to-edge camera pairing.
- Type: Singleton
- Operation:

GET
- GET
- Attributes:

Dynamic support: No
- Dynamic support: No

- GET

- Dynamic support: No

- Description: Camera pairing
- Type: Collection (Key property: id)
- Operation:

GET
ADD (Permissions: admin)

Required properties: address, username, password, streamingprotocol, verifycertificate, description


REMOVE (Permissions: admin)
- GET
- ADD (Permissions: admin)

Required properties: address, username, password, streamingprotocol, verifycertificate, description
- Required properties: address, username, password, streamingprotocol, verifycertificate, description
- REMOVE (Permissions: admin)

- GET
- ADD (Permissions: admin)

Required properties: address, username, password, streamingprotocol, verifycertificate, description
- Required properties: address, username, password, streamingprotocol, verifycertificate, description
- REMOVE (Permissions: admin)

- Required properties: address, username, password, streamingprotocol, verifycertificate, description

- Description: The unique ID generated automatically for the camera pairing.
- Datatype: ID
- Operations:

GET (Permissions: admin)
- GET (Permissions: admin)

- GET (Permissions: admin)

- Description: Address for the camera pairing.
- Datatype: Address
- Operations:

SET (Permissions: admin)
GET (Permissions: admin)
- SET (Permissions: admin)
- GET (Permissions: admin)

- SET (Permissions: admin)
- GET (Permissions: admin)

- Description: Username for the camera pairing.
- Datatype: Username
- Operations:

SET (Permissions: admin)
GET (Permissions: admin)
- SET (Permissions: admin)
- GET (Permissions: admin)

- SET (Permissions: admin)
- GET (Permissions: admin)

- Description: Password for the camera pairing.
- Datatype: Password
- Operations:

SET (Permissions: admin)
- SET (Permissions: admin)

- SET (Permissions: admin)

- Description: Current status of the camera pairing.
- Datatype: CameraPairingStatus
- Operations:

GET (Permissions: admin)
- GET (Permissions: admin)

- GET (Permissions: admin)

- Description: Streaming protocol used for the camera pairing (RTSP or SRTSP).

When SRTSP is set, you can specify verifycertificate to

true to verify the certificate
false to ignore the certificate verification, for example for self-signed certificates


When RTSP is set, verifycertificate will be ignored.
- When SRTSP is set, you can specify verifycertificate to

true to verify the certificate
false to ignore the certificate verification, for example for self-signed certificates
- true to verify the certificate
- false to ignore the certificate verification, for example for self-signed certificates
- When RTSP is set, verifycertificate will be ignored.
- Datatype: CameraPairingStreamingProtocol
- Operations:

SET (Permissions: admin)
GET (Permissions: admin)
- SET (Permissions: admin)
- GET (Permissions: admin)

- When SRTSP is set, you can specify verifycertificate to

true to verify the certificate
false to ignore the certificate verification, for example for self-signed certificates
- true to verify the certificate
- false to ignore the certificate verification, for example for self-signed certificates
- When RTSP is set, verifycertificate will be ignored.

- true to verify the certificate
- false to ignore the certificate verification, for example for self-signed certificates

- SET (Permissions: admin)
- GET (Permissions: admin)

- Description: Indicates whether to verify the certificates. It is only useful when streamingprotocol is set to SRTSP.
- Datatype: boolean
- Operations:

SET (Permissions: admin)
GET (Permissions: admin)
- SET (Permissions: admin)
- GET (Permissions: admin)

- SET (Permissions: admin)
- GET (Permissions: admin)

- Description: The product model of the paired camera.
- Datatype: ProductModel
- Operations:

GET (Permissions: admin)
- GET (Permissions: admin)

- GET (Permissions: admin)

- Description: The full product name of the paired camera.
- Datatype: ProductName
- Operations:

GET (Permissions: admin)
- GET (Permissions: admin)

- GET (Permissions: admin)

- Description: Description of the paired camera.
- Datatype: Description
- Operations:

SET (Permissions: admin)
GET (Permissions: admin)
- SET (Permissions: admin)
- GET (Permissions: admin)

- SET (Permissions: admin)
- GET (Permissions: admin)

- NotPaired: The device is not paired to an external camera.
- Paired: The device is paired to an external camera and the streaming works fine.
- Error: The device is paired to an external camera but there is some problem with the streaming.
- Connecting: The device is connecting to the external camera.

| Error code | Error message | Description |
| --- | --- | --- |
| 101 | The specified address is already assigned to the device itself. | Occurs when you try to create a camera pairing to the device itself. |
| 102 | The specified address is not valid. | Occurs when the specified address is not a valid IPv4/IPv6 address, or a DNS name. |
| 104 | Maximum number of camera pairings reached. | Occurs when you try to create a second camera pairing. |
| 106 | Lost connection | Streaming connection is lost. |
| 107 | Unauthorized | Unauthorized streaming. |
| 108 | Could Not Connect | Couldn't connect to streaming. |

