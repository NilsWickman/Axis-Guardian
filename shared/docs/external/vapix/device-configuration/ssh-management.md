# SSH Management

**Source:** https://developer.axis.com/vapix/device-configuration/ssh-management/
**Last Updated:** Sep 10, 2025

---

# SSH Management

## Overview​

## Use cases​

### Add a new SSH user​

### Get all of the SSH users​

### Get an existing SSH user​

### Modify an existing SSH user​

### Remove an existing SSH user​

## API definition​

### Structure​

#### Entities​

#### Data types​

The VAPIX® SSH API is used to manage SSH accounts on a device and has methods to:

This API includes sensitive data. You must use a secured channel for the communication transmissions.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

Make a request with the following information to create a new SSH user on your device:

Example

Adding a new SSH user also creates a home directory for the user. Note that there is only a small amount of storage available on the device.

Make a request with the following information to retrieve all SSH user information from your device:

This will return an array with the following information:

Example

Make a request with the following information to retrieve SSH information for a single user from your device:

This will return the following information:

Example

Make a request with the following information to modify an SSH user on your device:

Example

Make a request with the following information to remove an SSH user from your device:

Example

Removing an existing SSH user also deletes the corresponding home directory and all of its contents.

ssh.v2

Version 1 of the SSH object.

Properties

This entry has no properties

Actions

This entry has no actions.

ssh.v2.users

This is the entity collection with SSH users. Each SSH user entity is identified by the key username.

Properties

comment

The comment is a property in the ssh.v2.users entity. It is connected to a username. If the comment property is used then it can not be an empty string.

password

The password is a property in the ssh.v2.users entity. It is connected to a username. The password can not be read once set.

username

The username is an unique key property in the ssh.v2.users entity. It is used to identify an SSH user in the SSH users collection.

Actions

This entry has no actions.

comment_type

password_type

username_type

```
POST /config/rest/ssh/v2/users HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "username": "username1",    "password": "password1",    "comment": "comment1"  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
GET /config/rest/ssh/v2/users HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status: "success",  "data": [    {      "username": "username1",      "comment": "comment1"    },    {      "username": "username2",      "comment": "comment2"    }  ]}
```

```
GET /config/rest/ssh/v2/users/username1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": {    "username": "username1",    "comment": "comment1"  }}
```

```
PATCH /config/rest/ssh/v2/users/username1 HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "password": "newpassword",    "comment": "new comment"  }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
DELETE /config/rest/ssh/v2/users/username1 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
ssh.v2 (Root Entity)  users (Entity Collection)    comment (Property)    password (Property)    username (Property)
```

- Add an SSH user
- Retrieve details of SSH users
- Modify an SSH user
- Remove an SSH user

- User collection: ssh.v2.users
- Properties: username, password and comment

- User collection: ssh.v2.users

- Properties: username and comment

- User collection: ssh.v2.users
- Key property: username

- Properties: username and comment

- User collection: ssh.v2.users
- Key property: username
- Properties: password and comment

- User collection: ssh.v2.users
- Key property: username

- Description: The SSH object
- Type: Singleton
- Operations: GET
- Attributes: Dynamic Support: No

- Description: The SSH users collection
- Type: Collection (Key Property: username)
- Operations:

GET
SET - Properties: password, comment
ADD - Permissions: admin / Required properties: username, password / Optional properties: comment
REMOVE - Permissions: admin
- GET
- SET - Properties: password, comment
- ADD - Permissions: admin / Required properties: username, password / Optional properties: comment
- REMOVE - Permissions: admin
- Attributes: Dynamic Support: No

- GET
- SET - Properties: password, comment
- ADD - Permissions: admin / Required properties: username, password / Optional properties: comment
- REMOVE - Permissions: admin

- Description: The full name or comment of the SSH user
- Datatype: comment_type
- Operations: GET - Permissions: admin | SET - Permissions: admin
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Range: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Range: No

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Range: No

- Description: The password of the SSH user
- Datatype: password_type
- Operations: SET - Permissions: admin
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Rang: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Description: The user name of the SSH user
- Datatype: username_type
- Operations: GET - Permissions: admin
- Attributes:

Nullable: No
Dynamic Support: No
Dynamic Enum: No
Dynamic Rang: No
- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Nullable: No
- Dynamic Support: No
- Dynamic Enum: No
- Dynamic Rang: No

- Description: The full name or comment of the SSH user
- Type: string
- Minimum Length: 0
- Maximum Length: 256
- Pattern: ^[^: ]*$

- Description: The password of the SSH user
- Type: string
- Minimum Length: 1
- Maximum Length: 256

- Description: The user name of the SSH user
- Type: string
- Minimum Length: 1
- Maximum Length: 32
- Pattern: ^[a-z*][a-z0-9-*]*[$]?$

