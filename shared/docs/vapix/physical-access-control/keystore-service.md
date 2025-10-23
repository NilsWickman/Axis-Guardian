# Keystore service

**Source:** https://developer.axis.com/vapix/physical-access-control/keystore-service/
**Last Updated:** Aug 27, 2025

---

# Keystore service

## Keystore service guide​

## Keystore service API​

### Encryption key configuration​

### GetEncryptionKeyList command​

### SetEncryptionKey command​

### GetEncryptionKey command​

### RemoveEncryptionKey command​

axkey = http://www.axis.com/vapix/ws/KeyStore

The axkey service implements a keystore. The following functions are available:

Apart from the obvious key value, an entry in the keystore also contains metadata, such as a name, a description and a modification time. The modification time cannot be set using SetEncryptionKey, but will instead be automatically updated to the current time on the A1001 when the API call is made.

Note that the key value is never revealed in plain text using the GetEncryptionKey and GetEncryptionKeyList functions. The key value is shown as "*****".

The keystore is generic with a few exceptions, the known key SCBK-D is one example. This key value is not allowed when adding a key to the keystore (it will generate an API fault). Another exception is the value 0x00 0x00 .. 0x00 (16 byte).

This service provides an API for storing encryption keys.

Encryption key object. The following fields are available:

To provide more information, the device may include the following optional fields:

Only the token is returned. This operation requests a list of all of EncryptionKey items provided by the device. No key values are returned, these will be empty to hide their true values.

The returned list shall start with the item specified by a StartReference parameter. If not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device-internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReferences at the same time, and they must live for a reasonable time so that clients are able to fetch complete datasets.

Clients shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. The client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than the Limitparameter. If Limit is not specified by the client, the device shall assume it be unbounded. The number of returned elements is determined by the device and may be less than requested if the device has limited resources.

Add/update a list of EncryptionKeys.

Get information about one or more keys. The value of the key itself will not be returned.

Remove the EncryptionKeys specified by the Tokens.

```
{    "axkey:SetEncryptionKey": {        "axkey:EncryptionKey": [            {                "Name": "My key name",                "Description": "My key description",                "token": "my_key",                "Key": "00010203040506070809101112131415"            }        ]    }}
```

```
<axkey:SetEncryptionKey>    <axkey:EncryptionKey token="my_key">     <axkey:Key>00010203040506070809101112131415</axkey:Key>     <axkey:Name>My key name</axkey:Name>     <axkey:Description>My key description</axkey:Description>    </axkey:EncryptionKey>   </axkey:SetEncryptionKey>
```

- SetEncryptionKey
- GetEncryptionKey(tokens)
- GetEncryptionKeyList
- RemoveEncryptionKey(tokens)

- Token: A service-unique identifier of the EncryptionKey.
- Key: Cryptographic key, will not be returned by GetEncryptionKeyList (1024 characters).

- Name: Optional name of the key.
- Description: Optional extra information (1024 characters).
- ModificationTime: UTC time when key was last updated, cannot be set by SetEncryptionKey.

- Name: GetEncryptionKeyList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: SetEncryptionKey
- Access Class: WRITE_SYSTEM

- Name: GetEncryptionKey
- Access Class: READ_SYSTEM_SENSITIVE

- Name: RemoveEncryptionKey
- Access Class: WRITE_SYSTEM

| Message name | Description |
| --- | --- |
| GetEncryptionKeyListRequest | This message contains- Limit Maximum number of entries to return. If not specified, or greater than the device supports, the number of items shall be determined by the device.- StartReference Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1] xs:string StartReference [0][1] |
| GetEncryptionKeyListResponse | This message contains:- NextStartReference: StartReferenceto use in next call to get the following items. If absent, there are no more items to get.- EncryptionKey List of EncryptionKey items.xs:string NextStartReference [0][1] axkey:EncryptionKey EncryptionKey [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Senderter:InvalidArgValter:InvalidStartReference | StartReference is invalid or has timed out. Client needs to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| SetEncryptionKeyRequest | This message contains:- EncryptionKey: The new versions of the EncryptionKeysaxkey:EncryptionKey EncryptionKey [1][unbounded] |
| SetEncryptionKeyResponse | This message contains:- Token: Tokens of the added/updated EncryptionKeyspt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs | Invalid key value |

| Message name | Description |
| --- | --- |
| GetEncryptionKeyRequest | This message contains:- Token:pt:ReferenceToken Token [1][unbounded] |
| GetEncryptionKeyResponse | This message contains:- EncryptionKey:axkey:EncryptionKey EncryptionKey [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | EncryptionKey not found |

| Message name | Description |
| --- | --- |
| RemoveEncryptionKeyRequest | This message contains:- Token: Token of the EncryptionKeys to removept:ReferenceToken Token [1][unbounded] |
| RemoveEncryptionKeyResponse | This message shall be empty |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | EncryptionKey not found |

