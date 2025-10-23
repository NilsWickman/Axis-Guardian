# User service

**Source:** https://developer.axis.com/vapix/physical-access-control/user-service/
**Last Updated:** Aug 28, 2025

---

# User service

## User service guide​

### Setting the user​

## User service API​

### Service capabilities​

#### ServiceCapabilities data structure​

#### GetServiceCapabilities command​

### User information and configuration​

#### UserInfo data structure​

#### User data structure​

#### GetUserInfoList command​

#### GetUserInfo command​

#### GetUserList command​

#### GetUser command​

#### SetUser command​

#### RemoveUser command​

#### GetUserInfoByCredentialToken command​

The user service is tightly coupled with the AccessControl service, and provides storage of user specific data. No events are available from this service. VAPIX® interface (/vapix/pacs).

The users from the user service will not be used by the door controller but is merely offered as a way to persistently store user data, e.g. a client may use it to present a name of a credential holder, instead of only a credential token. If to be compliant with AXIS Entry Manager, certain conventions must be followed, see Entry manager. Users is set by calling axudb:SetUser, and the following structure illustrates this:

Request

Request

If the User in above example should be linked to the Credential, the User’s token should be inserted as UserToken in the Credential. The following example shows this (continued from section Setting the credential), where the change is marked in bold:

Request

Request

By having the user linked to the credential, it is possible to retrieve the user with axudb:GetUserInfoByCredentialToken, as in the following example:

Request

Request

Response

Response

Service to manage users and their attributes etc.

This service offers commands to retrieve status information and to control user instances.

axudb = http://www.axis.com/vapix/ws/user

The capabilities of the user service. This structure can be extended with optional attributes.

The following fields are available:

MaxLimit

The maximum number of entries returned by a single GetList request. The device shall never return more than this number of entities in a single response.

Get the capabilities of the User service.

GetServiceCapabilities command

axudb = http://www.axis.com/vapix/ws/user

Information about a User.

The following fields are available:

token

A service-unique identifier of the User.

Name

Name of user.

To provide more information, the device may include the following optional field:

Description

Description for the user.

Representation of a user.

The following fields are available:

token

A service-unique identifier of the User.

Name

Name of user.

Attribute

List of attributes.

To provide more information, the device may include the following optional fields:

Description

Description for the user.

Extension

For future extension.

This operation requests a list of all of UserInfo items provided by the device. An ONVIF compliant device which provides the DoorControl service shall implement this method.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference:s at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

GetUserInfoList Command

This operation request a list of UserInfo items matching the given tokens.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned

GetUserInfo Command

This operation requests a list of all of User items provided by the device. An ONVIF compliant device which provides the DoorControl service shall implement this method.

The returned list shall start with the item specified by a StartReference parameter. If it is not specified by the client, the device shall return items starting from the beginning of the dataset.

StartReference is a device internal identifier used to continue fetching data from the last position, and shall allow a client to iterate over a large dataset in smaller chunks. The device shall be able to handle a reasonable number of different StartReference:s at the same time and they must live for a reasonable time so that clients are able to fetch complete datasets.

An ONVIF compliant client shall not make any assumptions on StartReference contents and shall always pass the value returned from a previous request to continue fetching data. Client shall not use the same reference more than once.

For example, the StartReference can be incrementing start position number or underlying database transaction identifier.

The returned NextStartReference shall be used as the StartReference parameter in successive calls, and may be changed by device in each call.

The number of items returned shall not be greater than Limit parameter. If Limit parameter is not specified by the client, the device shall assume it unbounded. The number of returned elements is determined by the device and may be less than requested if the device is limited in its resources.

GetUserList Command

This operation request a list of User items matching the given tokens.

The device shall ignore tokens it cannot resolve and may return an empty list if there are no items matching specified tokens.

If the number of requested items is greater than the max limit supported, a TooManyItems fault shall be returned.

GetUser Command

Add/update a list of User items. Each User items contains the complete information about a User. If User:s with the specified tokens already exist, they will be updated. If not, they will be added. If the token field of any User is empty, the service will allocate a token for the User. All tokens are returned in the response.

SetUser Command

Remove the specified User items.

RemoveUser command

Returns a list of UserInfo items for those users that match the specified CredentialToken.

GetUserInfoByCredentialToken command

```
{    "axudb:SetUser": {        "User": [            {                "token": "user_token1",                "Name": "Name, User",                "Description": "User description",                "Attribute": [                    { "type": "string", "Name": "First name", "Value": "User" },                    { "type": "string", "Name": "Last name", "Value": "Name" }                ]            }        ]    }}
```

```
<axudb:SetUser>    <axudb:User token="user_token1">        <axudb:Name>Name, User</axudb:Name>        <axudb:Description>User description</axudb:Description>        <axudb:Attribute type="string" Name="First name" Value="User" />        <axudb:Attribute type="string" Name="Last name" Value="Name" />    </axudb:User></axudb:SetUser>
```

```
{    "pacsaxis:SetCredential": {        "Credential": [            {                "token": "Axis-00408c184bdb:1351593020.016190000",                "UserToken": "user_token1",                "Description": "Credential description",                "ValidFrom": "",                "ValidTo": "",                "Enabled": true,                "Status": "Enabled",                "IdData": [                    { "Name": "Card", "Value": "12345678" },                    { "Name": "PIN", "Value": "1234" }                ],                "Attribute": [],                "AuthenticationProfile": [],                "CredentialAccessProfile": [                    {                        "AccessProfile": "Axis-00408c184bdb:1351591416.539133000",                        "ValidFrom": "",                        "ValidTo": ""                    }                ]            }        ]    }}
```

```
<pacsaxis:SetCredential>    <pacsaxis:Credential token="Axis-00408c184bdb:1351593020.016190000">        <pacsaxis:UserToken>user_token1</pacsaxis:UserToken>        <pacsaxis:Description>Credential description</pacsaxis:Description>        <pacsaxis:Enabled>true</pacsaxis:Enabled>        <pacsaxis:Status>Enabled</pacsaxis:Status>        <pacsaxis:IdData Name="Card" Value="12345678" />        <pacsaxis:IdData Name="PIN" Value="1234" />        <pacsaxis:CredentialAccessProfile>            <pacsaxis:AccessProfile>Axis-00408c184bdb:1351591416.539133000</pacsaxis:AccessProfile>        </pacsaxis:CredentialAccessProfile>    </pacsaxis:Credential></pacsaxis:SetCredential>
```

```
{    "axudb:GetUserInfoByCredentialToken": {        "CredentialToken": "Axis-00408c184bdb:1351593020.016190000"    }}
```

```
<axudb:GetUserInfoByCredentialToken>    <axudb:CredentialToken>Axis-00408c184bdb:1351593020.016190000</axudb:CredentialToken></axudb:GetUserInfoByCredentialToken>
```

```
{    "UserInfo": [        {            "token": "user_token1",            "Name": "Name, User",            "Description": "User description"        }    ]}
```

```
<axudb:GetUserInfoByCredentialTokenResponse>    <axudb:UserInfo token="user_token1">        <axudb:Name>Name, User</axudb:Name>        <axudb:Description>User description</axudb:Description>    </axudb:UserInfo></axudb:GetUserInfoByCredentialTokenResponse>
```

- MaxLimit
The maximum number of entries returned by a single GetList request. The device shall never return more than this number of entities in a single response.

- Name: GetServiceCapabilities
- Access Class: PRE_AUTH

- token
A service-unique identifier of the User.
- Name
Name of user.

- Description
Description for the user.

- token
A service-unique identifier of the User.
- Name
Name of user.
- Attribute
List of attributes.

- Description
Description for the user.
- Extension
For future extension.

- Name: GetUserInfoList
- Access Class: READ_SYSTEM

- Name: GetUserInfo
- Access Class: READ_SYSTEM

- Name: GetUserList
- Access Class: READ_SYSTEM_SENSITIVE

- Name: GetUser
- Access Class: READ_SYSTEM_SENSITIVE

- Name: SetUser
- Access Class: WRITE_SYSTEM

- Name: RemoveUser
- Access Class: WRITE_SYSTEM

- Name: GetUserInfoByCredentialToken
- Access Class: READ_SYSTEM_SENSITIVE

| Message name | Description |
| --- | --- |
| GetServiceCapabilitiesRequest | This message shall be empty. |
| GetServiceCapabilitiesResponse | This message contains:- Capabilities: The capabilities.axudb:ServiceCapabilities Capabilities [1][1](extendable) |

| Message name | Description |
| --- | --- |
| GetUserInfoListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetUserInfoListResponse | This message contains:- NextStartReference: StartReference to use in next call to get the following items. If absent, no more items to get.- UserInfo List of UserInfo items.xs:string NextStartReference [0][1]axudb:UserInfo UserInfo [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client need to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetUserInfoRequest | This message contains:- Token: Tokens of UserInfo items to get.pt:ReferenceToken Token [1][unbounded] |
| GetUserInfoResponse | This message shall be empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| GetUserListRequest | This message contains:- Limit: Maximum number of entries to return. If not specified, or higher than what the device supports, the number of items shall be determined by the device.- StartReference Start returning entries from this start reference. If not specified, entries shall start from the beginning of the dataset.xs:int Limit [0][1]xs:string StartReference [0][1] |
| GetUserListResponse | This message shall be empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. Client need to start fetching from the beginning. |

| Message name | Description |
| --- | --- |
| GetUserRequest | This message contains:- Token: Tokens of User items to get.pt:ReferenceToken Token [0][unbounded] |
| GetUserResponse | This message contains:- User: List of User items.axudb:User User [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested, see MaxLimit capability. |

| Message name | Description |
| --- | --- |
| SetUserRequest | This message contains:- User: The User:s to add/update.axudb:User User [1][unbounded] |
| SetUserResponse | This message contains:- Token: The tokens of the added/updated User:s.pt:ReferenceToken Token [0][unbounded] |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs |  |
| env:Receiver ter:ActionNotSupported ter:NotAllowed |  |

| Message name | Description |
| --- | --- |
| RemoveUserRequest | This message contains:- Token: Tokens of User:s to remove.pt:ReferenceToken Token [1][unbounded] |
| RemoveUserResponse | This message shall be empty. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | User not found. |

| Message name | Description |
| --- | --- |
| GetUserInfoByCredentialTokenRequest | This message contains:- CredentialToken: The Credential to look up the users for.pt:ReferenceToken CredentialToken [1][1] (extendable) |
| GetUserInfoByCredentialTokenResponse | This message contains:- UserInfo: List of UserInfo items having the provided credential.axudb:UserInfo UserInfo [0][unbounded] (extendable) |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:NotFound | User not found. |

