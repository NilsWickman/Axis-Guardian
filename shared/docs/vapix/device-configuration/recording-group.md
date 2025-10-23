# Recording group API

**Source:** https://developer.axis.com/vapix/device-configuration/recording-group/
**Last Updated:** Sep 10, 2025

---

# Recording group API

## Overview​

## Use cases​

### Get root entity​

### Add a New Recording Group​

#### No Encryption​

#### Fixed Key Encryption​

#### Rotating Key Encryption​

### Delete a Recording Group​

### Get All Recording Groups​

## API definition​

### Structure​

### Entities​

#### recording-group.v2​

##### Properties​

##### Actions​

#### recording-group.v2.recordingGroups​

##### Properties​

###### containerFormat​

###### description​

###### destinations​

###### encryption​

###### id​

###### maxRetentionTime​

###### niceName​

###### postDuration​

###### preDuration​

###### segmentDuration​

###### segmentSize​

###### spanDuration​

###### streamOptions​

##### Actions​

### Data types​

#### containerFormatEnum​

#### contentEncryption​

#### destination​

#### destinationsArray​

#### encryption​

#### hexadecimalEncryptionKey128Bit​

#### idString​

#### keyEncryption​

#### positiveInteger​

#### protectionSchemeEnum​

#### publicKey​

#### publicKeysArray​

#### remoteObjectStorage​

#### stringArray​

#### targetAndMaxPositiveInteger​

#### uuid​

The VAPIX® Recording group API makes it possible to create, update, delete and retrieve information about recording groups.

A recording group contains configuration options for recordings belonging to it.
Every recording group has a unique identifier, description, settings for segment storage, settings for encryption and stream options.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

The following is an example of how to get the root entity. The recordingGroups entity is the only entity in the root.

A new group can be added by creating it in recording-group.v2.recordingGroups. In this section, we will show how to create a recording group with three examples, one with no encryption, one with fixed key encryption, and one last with rotating key encryption.

In the following POST request example, there is no encryption field. This indicates that recordings in this new group should not be encrypted.

In the following POST request example, only the contentEncryption field of encryption is set. This indicates that fixed key encryption should be used on the recordings. contentEncryption.key is the fixed key and keyId is its identifier. See recording-group.v2.recordingGroups.encryption

In the following POST request example, only the keyEncryption field of encryption is set. This indicates that rotating key encryption should be used on the recordings. For rotating key encryption, both certificates with public keys and standalone public keys may be supplied. keyEncryption.certificateIds can contain ids of installed pem certificates and keyEncryption.publicKeys can contain public keys alongside their key IDs.

When rotating key is used, each generated encryption key is encrypted using the provided certificates/public keys and is written to the recording's pssh boxes for decrypting purposes. See encryption for more details.

In this example, we delete the group with ID SD_DISK_20230920_081416_196C2182. The request must be made to: {device-ip}/config/rest/recording-group/{api-version}/recordingGroups/{recording-group-id}
example: 192.168.0.101/config/rest/recording-group/v2/recordingGroups/SD_DISK_20230920_081416_196C2182.

The following is an example of how to get all the recording groups in the recordingGroups collection.

The root entity, it holds the recording group collection.

This entity has no properties.

This entity has no actions.

The recording group collection, it contains all recording groups.

The format used on the segment files created under the recording group. The two options are matroska and cmaf.

A string to describe the recording group. It may describe the purpose, use cases or parameters of the group.

A list of destinations on which recordings are saved. Each member of the array contains a remote object storage entry. There can only be one destination.See: destination.

This field should be set to encrypt all recordings under this group. Only recordings with containerFormat set to cmaf can be encrypted. The cmaf data is encrypted using AES-128 bit symmetric key(s).

If encryption.contentEncryption is set, the key provided in encryption.contentEncryption.key will be used as the one and only fixed symmetric key with keyId as its identifier. This pair, key/keyId, has to be agreed upon beforehand at both
the encryption and decryption sides as it will not be communicated back.

If encryption.keyEncryption is set, a new pair of key/keyId will instead be periodically generated at an interval of encryption.keyEncryption.keyRotationDuration
seconds to be used for encryption. The requirement for a new pair to generate is that keyRotationDuration seconds has elapsed since the last generation and a new recording segment is about to begin.

The generated key will always be encrypted for each configured certificate in encryption.keyEncryption.certificateIds
and each configured public key in encryption.keyEncryption.publicKeys and is thereafter supplied in its encrypted form with the recording file's pssh boxes. The algorithm used for encrypting the generated key is RSA with OAEP padding, mask generation function (MGF1) and SHA-1 label hashing.

encryption.keyEncryption.publicKeys is an alternative to encryption.keyEncryption.certificateIds. You can chose to populate only one or both.

The information needed to decrypt recordings is written to pssh boxes in the segment file's headers. In case you supplied the recording group with public keys, their IDs will be stored under the field CertificateThumbprint that is described by ONVIF.

Either encryption.contentEncryption or encryption.keyEncryption should be set. Setting neither or both is not valid. If you do not wish to encrypt the recordings, omit encryption in its entirety.

The identification string for the recording group.

The maximum number of hours the recordings in this group that can be stored. Once the expiry time is exceeded for a recording, it is deleted. Recordings can not reach their max retention time if storage capacity becomes limited. Instead, they are deleted to make space for new recordings.

A human readable name for the recording group.

The duration in milliseconds of time to include immediately after a recording is stopped in the group.

The duration in milliseconds of time to include immediately before a recording is started in the group.

The target and max segment (recording files) duration in seconds. The value should be chosen depending on the application of the recording group. It is possible that the target duration cannot be met and this depends on the values set for segmentSize as they may conflict.

The target and max segment (recording files) size in bytes. The value should be chosen depending on the application's memory constraints. It is possible that the target size cannot be met and this depends on the values set for segmentDuration as they may conflict.

The span duration in seconds. A recording is logically made up of one or more spans. When removing recordings, it is done at the span level. Spans are indexed for faster searching.

The stream options to use when recording in the group. Example: device=65e04c45-19fd-4291-918f-049dc21ff2a9&camera=1&videocodec=h264&fps=30&resolution=1920x1080&compression=30&audio=1

This entity has no actions.

Enum that describes the container format to store recordings in.

Contains options for fixed key encryptions.

key:
The 128-bit AES fixed encryption key to use for encrypting the recordings. See hexadecimalEncryptionKey128Bit.

keyId:
The key identifier in RFC UUID form.

Contains a remote storage destination to save recordings to.

Array of destination. Can only contain one element.

Contains encryption parameters and describes the methods in which recordings are encrypted in a recording group.

contentEncryption:
See: contentEncryption. Do not set with keyEncryption.

keyEncryption:
See: keyEncryption. Do not set with contentEncryption.

protectionScheme:
See: protectionSchemeEnum.

128-bit hexadecimal encryption key. All characters must be part of the hexadecimal
character set.

Contains the recording group's ID. The ID must be 1-50 characters long and contain only alphanumeric or underscore characters.

Contains options for rotating key encryption.

certificateIds:
An array of certificate IDs to use for public key encryption of the generated
symmetric key.

publicKeys:
See: publicKeysArray.

keyRotationDuration:
The duration in seconds a generated symmetric key should be used before a new one
is generated.

Integer that is greater than or equal to 0.

The following table highlights the protection schemes available.

Contains an RSA public key to encrypt generated symmetric keys with.

key:
The RSA public key.

keyId:
The key identifier in RFC UUID form.

Array of publicKey.

Contains options of a remote object storage for recordings to be saved to.

id:
The remote object storage identifier. Example: aws1 or azure1.

postfix:
A string attached to the end of the name of all files uploaded to a remote object storage destination from the group. Can be used to differentiate between recordings from different cameras (camera1).

prefix:
A string attached to the start of the name of all files uploaded to a remote object storage destination from the group.

Array of strings.

Contains a target and a max positive integer. The target is what is to be desired but may not be fulfilled and the max is a ceiling value that should not be exceeded.

target:
The target value.

max:
The maximum value.

Universally Unique IDentifier as defined by RFC specification.

```
GET /config/rest/recording-group/v2 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "data": {        "recordingGroups": [            {                "containerFormat": "matroska",                "description": "A group with parameters perfected for observing fast moving fish",                "destinations": [                    {                        "remoteObjectStorage": {                            "id": "aws1",                            "prefix": "camera1",                            "postfix": "location1"                        }                    }                ],                "id": "SD_DISK_20230920_081416_196C2182",                "maxRetentionTime": 168,                "niceName": "Nemo Finder",                "postDuration": 0,                "preDuration": 1000,                "segmentDuration": {                    "max": 20,                    "target": 15                },                "segmentSize": {                    "max": 5000000,                    "target": 4000000                },                "spanDuration": 3600,                "streamOptions": "camera=1&videocodec=h264&fps=60&resolution=1920x1080&compression=30&audio=1"            }        ]    },    "status": "success"}
```

```
POST /config/rest/recording-group/v2/recordingGroups HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "containerFormat": "cmaf",        "description": "A group with parameters perfected for observing fast moving fish",        "destinations": [            {                "remoteObjectStorage": {                    "id": "aws1",                    "prefix": "camera1",                    "postfix": "location1"                }            }        ],        "maxRetentionTime": 168,        "niceName": "Nemo Finder",        "postDuration": 0,        "preDuration": 1000,        "segmentDuration": {            "max": 20,            "target": 15        },        "segmentSize": {            "max": 5000000,            "target": 4000000        },        "spanDuration": 3600,        "streamOptions": "camera=1&videocodec=h264&fps=60&resolution=1920x1080&compression=30&audio=1"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
POST /config/rest/recording-group/v2/recordingGroups HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "containerFormat": "cmaf",        "description": "A group with parameters perfected for observing fast moving fish",        "destinations": [            {                "remoteObjectStorage": {                    "id": "aws1",                    "prefix": "camera1",                    "postfix": "location1"                }            }        ],        "encryption": {            "contentEncryption": {                "key": "00112233445566778899AABBCCDDEEFF",                "keyId": "aaaaaaaa-bbbb-cccc-dddd-ef0123456789"            },            "protectionScheme": "CENC"        },        "maxRetentionTime": 168,        "niceName": "Nemo Finder",        "postDuration": 0,        "preDuration": 1000,        "segmentDuration": {            "max": 20,            "target": 15        },        "segmentSize": {            "max": 5000000,            "target": 4000000        },        "spanDuration": 3600,        "streamOptions": "camera=1&videocodec=h264&fps=60&resolution=1920x1080&compression=30&audio=1"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
POST /config/rest/recording-group/v2/recordingGroups HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "containerFormat": "cmaf",        "description": "A group with parameters perfected for observing fast moving fish",        "destinations": [            {                "remoteObjectStorage": {                    "id": "aws1",                    "prefix": "camera1",                    "postfix": "location1"                }            }        ],        "encryption": {            "keyEncryption": {                "certificateIds": [                    "certid1",                    "certid2"                ],                "publicKeys": [                    {                        "key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArzbhy/mdpIYlSaPd07jXNsQEtJ+MX2UvlxsmUxn9yG/fFI2I7eOP4eL2NhsOKscYEvdI0aKhflk8SluwNzsXuFOnOWZ1u4yN3sCNS4CW0Qqs7i6NWAxj4EVDiwWiK00evzdzg7fiJMHi+aNHzw/qE1lVC9PYhVRkMVohFyuaRMqYCwnvK6IDDKDbc3h0dS4MbKgt2AILtdJImpexZvUQ1GzOPfKx9wC08rPYSmuPKvhtri8UJ1Moqc1IZpoodHWfOxG0CG9eUo5gt+U/t+sNtDYjPTcQqhK0MV02QVCWSqWI+1auhCzMseKGZShZxWyHkGjBeKtTf0ibTxZlXVU1XwIDAQAB\n-----END PUBLIC KEY-----",                        "keyId": "aaaaaaaa-bbbb-cccc-dddd-ef0123456789"                    }                ],                "keyRotationDuration": 86400            },            "protectionScheme": "CENC"        },        "maxRetentionTime": 168,        "niceName": "Nemo Finder",        "postDuration": 0,        "preDuration": 1000,        "segmentDuration": {            "max": 20,            "target": 15        },        "segmentSize": {            "max": 5000000,            "target": 4000000        },        "spanDuration": 3600,        "streamOptions": "camera=1&videocodec=h264&fps=60&resolution=1920x1080&compression=30&audio=1"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
DELETE /config/rest/recording-group/v2/recordingGroups/SD_DISK_20230920_081416_196C2182 HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/recording-group/v2/recordingGroups HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "data": [        {            "containerFormat": "matroska",            "description": "A group with parameters perfected for observing fast moving fish",            "destinations": [                {                    "remoteObjectStorage": {                        "id": "aws1",                        "prefix": "camera1",                        "postfix": "location1"                    }                }            ],            "id": "SD_DISK_20230920_081416_196C2182",            "maxRetentionTime": 168,            "niceName": "Nemo Finder",            "postDuration": 0,            "preDuration": 1000,            "segmentDuration": {                "max": 20,                "target": 15            },            "segmentSize": {                "max": 5000000,                "target": 4000000            },            "spanDuration": 3600,            "streamOptions": "camera=1&videocodec=h264&fps=60&resolution=1920x1080&compression=30&audio=1"        }    ],    "status": "success"}
```

```
recording-group.v2 (Root Entity)    ├── recordingGroups (Entity Collection)        ├── containerFormat (Property)        ├── description (Property)        ├── destinations (Property)        ├── encryption (Property)        ├── id (Property)        ├── maxRetentionTime (Property)        ├── niceName (Property)        ├── postDuration (Property)        ├── preDuration (Property)        ├── segmentDuration (Property)        ├── segmentSize (Property)        ├── spanDuration (Property)        ├── streamOptions (Property)
```

- Description: Recording group API.
- Type: Singleton
- Operations

GET
- GET
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET

- Dynamic Support: No

- Description: Recording group collection.
- Type: Collection (Key Property: ID)
- Operations

GET
ADD (Permissions: admin)

Required properties: destinations
Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption


Remove (Permissions: admin)
- GET
- ADD (Permissions: admin)

Required properties: destinations
Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption
- Required properties: destinations
- Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption
- Remove (Permissions: admin)
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET
- ADD (Permissions: admin)

Required properties: destinations
Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption
- Required properties: destinations
- Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption
- Remove (Permissions: admin)

- Required properties: destinations
- Optional properties: id, niceName, description, maxRetentionTime, containerFormat, spanDuration, segmentDuration, segmentSize, preDuration, postDuration, streamOptions, encryption

- Dynamic Support: No

- Description: The output format of the recordings. Default: matroska.
- Datatype: containerFormatEnum
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Description for the recording group.
- Datatype: string
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Remote object storage destinations array. The recordings in this group will be stored on all destinations in this field if possible.
- Datatype: destinationsArray
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The encryption options to use for encrypting recording segments. Default: no encryption.
- Datatype: encryption
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: ID for the recording group.
- Datatype: idString
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Max number of hours the recordings in the group will be stored for. Default: 0 (unlimited).
- Datatype: positiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: User friendly name for the recording group.
- Datatype: string
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Post-trigger time in milliseconds. Default: 0.
- Datatype: positiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Pre-trigger time in milliseconds. Default: 0.
- Datatype: positiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The segment (recording files) duration in seconds. Target value may not be reached depending on segmentSize. Default: target/max = 15/30.
- Datatype: targetAndMaxPositiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The target/max segment size in bytes. Target value may not be reached depending on segmentDuration. Default: target/max = 15728640/26214400 (15MiB/25MiB).
- Datatype: targetAndMaxPositiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The span duration in seconds. A recording is logically made up of one or more spans. Default: 3600.
- Datatype: positiveInteger
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: The stream options to use for recordings in the group.
- Datatype: string
- Operations

GET (Permissions: admin)
- GET (Permissions: admin)
- Attributes

Nullable: Yes
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- GET (Permissions: admin)

- Nullable: Yes
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Recording container format.
- Type: string
- Enum Values: "matroska", "cmaf"

- Description: Indicates that a fixed key should be used to encrypt the recordings. Setting this means that only the provided key in the key field will be used to encrypt recordings.
- Type: complex
- Fields

key

Type: hexadecimalEncryptionKey128Bit
Nullable: No / Gettable: No


keyId

Type: uuid
Nullable: No / Gettable: No
- key

Type: hexadecimalEncryptionKey128Bit
Nullable: No / Gettable: No
- Type: hexadecimalEncryptionKey128Bit
- Nullable: No / Gettable: No
- keyId

Type: uuid
Nullable: No / Gettable: No
- Type: uuid
- Nullable: No / Gettable: No

- key

Type: hexadecimalEncryptionKey128Bit
Nullable: No / Gettable: No
- Type: hexadecimalEncryptionKey128Bit
- Nullable: No / Gettable: No
- keyId

Type: uuid
Nullable: No / Gettable: No
- Type: uuid
- Nullable: No / Gettable: No

- Type: hexadecimalEncryptionKey128Bit
- Nullable: No / Gettable: No

- Type: uuid
- Nullable: No / Gettable: No

- key:
The 128-bit AES fixed encryption key to use for encrypting the recordings. See hexadecimalEncryptionKey128Bit.
- keyId:
The key identifier in RFC UUID form.

- Description: The destination to save recordings to.
- Type: complex
- Fields

remoteObjectStorage

Type: remoteObjectStorage
Nullable: Yes / Gettable: No
- remoteObjectStorage

Type: remoteObjectStorage
Nullable: Yes / Gettable: No
- Type: remoteObjectStorage
- Nullable: Yes / Gettable: No

- remoteObjectStorage

Type: remoteObjectStorage
Nullable: Yes / Gettable: No
- Type: remoteObjectStorage
- Nullable: Yes / Gettable: No

- Type: remoteObjectStorage
- Nullable: Yes / Gettable: No

- remoteObjectStorage:
See: remoteObjectStorage.

- Description: An array for destinations. Can contain only one destination.
- Type: array
- Element type: destination
- Null Value: No
- Minimum item number: 1
- Maximum item number: 1

- Description: Contains data describing the encryption method and parameters to use on recordings. Either contentEncryption (for fixed key encryption) or keyEncryption (for rotating key encryption) should be set. If both or neither are set, an error will be returned.
- Type: complex
- Fields

contentEncryption

Type: contentEncryption
Nullable: Yes / Gettable: No


keyEncryption

Type: keyEncryption
Nullable: Yes / Gettable: No


protectionScheme

Type: protectionSchemeEnum
Nullable: No / Gettable: No
- contentEncryption

Type: contentEncryption
Nullable: Yes / Gettable: No
- Type: contentEncryption
- Nullable: Yes / Gettable: No
- keyEncryption

Type: keyEncryption
Nullable: Yes / Gettable: No
- Type: keyEncryption
- Nullable: Yes / Gettable: No
- protectionScheme

Type: protectionSchemeEnum
Nullable: No / Gettable: No
- Type: protectionSchemeEnum
- Nullable: No / Gettable: No

- contentEncryption

Type: contentEncryption
Nullable: Yes / Gettable: No
- Type: contentEncryption
- Nullable: Yes / Gettable: No
- keyEncryption

Type: keyEncryption
Nullable: Yes / Gettable: No
- Type: keyEncryption
- Nullable: Yes / Gettable: No
- protectionScheme

Type: protectionSchemeEnum
Nullable: No / Gettable: No
- Type: protectionSchemeEnum
- Nullable: No / Gettable: No

- Type: contentEncryption
- Nullable: Yes / Gettable: No

- Type: keyEncryption
- Nullable: Yes / Gettable: No

- Type: protectionSchemeEnum
- Nullable: No / Gettable: No

- contentEncryption:
See: contentEncryption. Do not set with keyEncryption.
- keyEncryption:
See: keyEncryption. Do not set with contentEncryption.
- protectionScheme:
See: protectionSchemeEnum.

- Description: A 128-bit hexadecimal encryption key.
- Type: string
- Pattern: '(^[a-fA-F0-9]{32}$)|(^*\\*\\*$)

- Description: Identification string.
- Type: string
- Minimum Length: 1
- Maximum Length: 50
- Pattern: ^[a-zA-Z0-9_-]+$

- Description: Indicates that generated/rotating keys are used to encrypt the recordings. certificateIds contains certificates and publicKeys contains public keys. These fields can be used to encrypt generated keys. All public keys and certificates must belong to the RSA public-key cryptosystem.
- Type: complex
- Fields

certificateIds

Type: stringArray
Nullable: Yes / Gettable: No


keyRotationDuration

Type: positiveInteger
Nullable: No / Gettable: No


publicKeys

Type: publicKeysArray
Nullable: Yes / Gettable: No
- certificateIds

Type: stringArray
Nullable: Yes / Gettable: No
- Type: stringArray
- Nullable: Yes / Gettable: No
- keyRotationDuration

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No
- publicKeys

Type: publicKeysArray
Nullable: Yes / Gettable: No
- Type: publicKeysArray
- Nullable: Yes / Gettable: No

- certificateIds

Type: stringArray
Nullable: Yes / Gettable: No
- Type: stringArray
- Nullable: Yes / Gettable: No
- keyRotationDuration

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No
- publicKeys

Type: publicKeysArray
Nullable: Yes / Gettable: No
- Type: publicKeysArray
- Nullable: Yes / Gettable: No

- Type: stringArray
- Nullable: Yes / Gettable: No

- Type: positiveInteger
- Nullable: No / Gettable: No

- Type: publicKeysArray
- Nullable: Yes / Gettable: No

- certificateIds:
An array of certificate IDs to use for public key encryption of the generated
symmetric key.
- publicKeys:
See: publicKeysArray.
- keyRotationDuration:
The duration in seconds a generated symmetric key should be used before a new one
is generated.

- Description: Positive integer value.
- Type: integer
- Minimum Value: 0

- Description: The encryption scheme to use.
- Type: string
- Enum Values: "CENC"

- Description: Type for storing a public key and its id.
- Type: complex
- Fields

key

Type: string
Nullable: No / Gettable: No


keyId

Type: uuid
Nullable: No / Gettable: No
- key

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No
- keyId

Type: uuid
Nullable: No / Gettable: No
- Type: uuid
- Nullable: No / Gettable: No

- key

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No
- keyId

Type: uuid
Nullable: No / Gettable: No
- Type: uuid
- Nullable: No / Gettable: No

- Type: string
- Nullable: No / Gettable: No

- Type: uuid
- Nullable: No / Gettable: No

- key:
The RSA public key.
- keyId:
The key identifier in RFC UUID form.

- Description: Array of RSA public keys and their key ids.
- Type: array
- Element type: publicKey
- Null Value: No

- Description: Describes a remote object storage such as an Azure or Amazon S3 cloud server.
- Type: complex
- Fields

id

Type: idString
Nullable: No / Gettable: No


postfix

Type: string
Nullable: No / Gettable: No


prefix

Type: string
Nullable: No / Gettable: No
- id

Type: idString
Nullable: No / Gettable: No
- Type: idString
- Nullable: No / Gettable: No
- postfix

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No
- prefix

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No

- id

Type: idString
Nullable: No / Gettable: No
- Type: idString
- Nullable: No / Gettable: No
- postfix

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No
- prefix

Type: string
Nullable: No / Gettable: No
- Type: string
- Nullable: No / Gettable: No

- Type: idString
- Nullable: No / Gettable: No

- Type: string
- Nullable: No / Gettable: No

- Type: string
- Nullable: No / Gettable: No

- id:
The remote object storage identifier. Example: aws1 or azure1.
- postfix:
A string attached to the end of the name of all files uploaded to a remote object storage destination from the group. Can be used to differentiate between recordings from different cameras (camera1).
- prefix:
A string attached to the start of the name of all files uploaded to a remote object storage destination from the group.

- Description: Array of strings.
- Type: array
- Element type: string
- Null Value: No

- Description: A type for holding a target and max positive integer values.
- Type: complex
- Fields

max

Type: positiveInteger
Nullable: No / Gettable: No


target

Type: positiveInteger
Nullable: No / Gettable: No
- max

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No
- target

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No

- max

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No
- target

Type: positiveInteger
Nullable: No / Gettable: No
- Type: positiveInteger
- Nullable: No / Gettable: No

- Type: positiveInteger
- Nullable: No / Gettable: No

- Type: positiveInteger
- Nullable: No / Gettable: No

- target:
The target value.
- max:
The maximum value.

- Description: RFC Universally Unique Identifier (UUID) format.
- Type: string
- Minimum Length: 36
- Maximum Length: 36
- Pattern: ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$

| Enum | Mode | Full Sample Encryption | Comments |
| --- | --- | --- | --- |
| CENC | AES CTR | cenc | Video NAL Subsample encryption, see: ISO/IEC 23001-7 2022. Available only for 128-bit keys. |

