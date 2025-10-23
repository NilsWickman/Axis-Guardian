# OpenID Connect Setup

**Source:** https://developer.axis.com/vapix/device-configuration/openid-connect-setup/
**Last Updated:** Sep 10, 2025

---

# OpenID Connect Setup

## Overview​

## Use cases​

### Set all settings​

### Get all settings​

### Update a single setting​

## API definition​

### Structure​

### Entities​

#### oidcsetup.v1​

##### Properties​

##### Actions​

#### oidcsetup.v1.BaseConfigEntity​

##### Properties​

###### OIDC_OutgoingProxy​

###### OIDC_ProviderMetadataURL​

###### OIDC_RemoteUserClaim​

###### OIDC_RequireClaim​

##### Actions​

#### oidcsetup.v1.BaseConfigEntity.AuthEntity​

##### Properties​

###### OIDC_AuthzAdminClaim​

###### OIDC_AuthzOperatorClaim​

###### OIDC_AuthzScopes​

###### OIDC_AuthzViewerClaim​

###### OIDC_ClientID​

###### OIDC_ClientSecret​

##### Actions​

### Data types​

#### RemoteUserClaim_type​

#### claim_type​

#### client_id_type​

#### passphrase_type​

#### proxy_type​

#### scope_list_type​

#### switch_type​

#### url_type​

The VAPIX® OpenID Connect Setup API makes it possible to set up a configuration that
allows a user to log in to the device with the OpenID Connect authentication code flow.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

All OpenID Connect settings can be set at the same time with the base config
entity.

Specify the metadata uri together with the client ID and secret strings. If the
unit requires proxy settings to reach out those are included as well.

Enter the proper claims that is validated in the given token. The remote user
claim value is used to identify the logged in user and the require claim is
validated for all requests. The different claims for admin/operator/viewer
access must also be fulfilled and values configured in the client.

Read out the current OpenID Connect settings from the base config entity.

The client secret will never be returned.

All settings can be applied separately, such as clearing a proxy
setting without changing anything else.

This entity has no properties.

This entity has no actions.

This entity has no actions.

This entity has no actions.

```
PATCH /config/rest/oidcsetup/v1/BaseConfigEntity HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "AuthEntity": {            "OIDC_AuthzAdminClaim": "example-claim-admin",            "OIDC_AuthzOperatorClaim": "example-claim-operator",            "OIDC_AuthzViewerClaim": "example-claim-viewer",            "OIDC_AuthzScopes": "some:scope",            "OIDC_ClientID": "example-id",            "OIDC_ClientSecret": "example-secret"        },        "OIDC_OutgoingProxy": "optional.proxy.settings",        "OIDC_ProviderMetadataURL": "https://example.metadata.uri",        "OIDC_RemoteUserClaim": "email",        "OIDC_RequireClaim": "example-claim"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/oidcsetup/v1/BaseConfigEntity HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "AuthEntity": {            "OIDC_AuthzAdminClaim": "example-claim-admin",            "OIDC_AuthzOperatorClaim": "example-claim-operator",            "OIDC_AuthzViewerClaim": "example-claim-viewer",            "OIDC_AuthzScopes": "some:scope",            "OIDC_ClientID": "example-id"        },        "OIDC_OutgoingProxy": "optional.proxy.settings",        "OIDC_ProviderMetadataURL": "https://example.metadata.uri",        "OIDC_RemoteUserClaim": "email",        "OIDC_RequireClaim": "example-claim"    }}
```

```
PATCH /config/rest/oidcsetup/v1/BaseConfigEntity/OIDC_OutgoingProxy HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": ""}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
oidcsetup.v1 (Root Entity)    ├── BaseConfigEntity (Entity)        ├── OIDC_OutgoingProxy (Property)        ├── OIDC_ProviderMetadataURL (Property)        ├── OIDC_RemoteUserClaim (Property)        ├── OIDC_RequireClaim (Property)        ├── AuthEntity (Entity)            ├── OIDC_AuthzAdminClaim (Property)            ├── OIDC_AuthzOperatorClaim (Property)            ├── OIDC_AuthzScopes (Property)            ├── OIDC_AuthzViewerClaim (Property)            ├── OIDC_ClientID (Property)            ├── OIDC_ClientSecret (Property)
```

- Description: OIDC client configurations.
- Type: Singleton
- Operations

GET
SET

Properties: BaseConfigEntity
- GET
- SET

Properties: BaseConfigEntity
- Properties: BaseConfigEntity
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET
- SET

Properties: BaseConfigEntity
- Properties: BaseConfigEntity

- Properties: BaseConfigEntity

- Dynamic Support: No

- Description: Required configuration for OIDC client.
- Type: Singleton
- Operations

GET
SET

Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim
- GET
- SET

Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim
- Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET
- SET

Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim
- Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim

- Properties: AuthEntity, OIDC_OutgoingProxy, OIDC_ProviderMetadataURL, OIDC_RemoteUserClaim, OIDC_RequireClaim

- Dynamic Support: No

- Description: Proxy configuration.
- Datatype: proxy_type
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

- Description: OIDC discovery API endpoint. Required format https://<host>/<optional directory>/.well-known/openid-configuration
- Datatype: url_type
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

- Description: OIDC Remote User Claim (sub, email, preferred_username).
- Datatype: RemoteUserClaim_type
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

- Description: Required claim.
- Datatype: claim_type
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

- Description: Client authentication properties.
- Type: Singleton
- Operations

GET
SET

Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret
- GET
- SET

Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret
- Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret
- Attributes

Dynamic Support: No
- Dynamic Support: No

- GET
- SET

Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret
- Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret

- Properties: OIDC_AuthzAdminClaim, OIDC_AuthzOperatorClaim, OIDC_AuthzScopes, OIDC_AuthzViewerClaim, OIDC_ClientID, OIDC_ClientSecret

- Dynamic Support: No

- Description: To set which claim and value that corresponds to admin
- Datatype: claim_type
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

- Description: To set which claim and value that corresponds to operator
- Datatype: claim_type
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

- Description: Optional list of additional scopes
- Datatype: scope_list_type
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

- Description: To set which claim and value that corresponds to viewer
- Datatype: claim_type
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

- Description: OIDC client ID.
- Datatype: client_id_type
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

- Description: OIDC client secret.
- Datatype: passphrase_type
- Operations

SET (Permissions: admin)
- SET (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- SET (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Normal string type.
- Type: string
- Minimum Length: 1
- Maximum Length: 64
- Pattern: ^(sub|email|preferred_username|("[a-zA-Z0-9]*"))$

- Description: Claim type.
- Type: string
- Minimum Length: 1
- Maximum Length: 256
- Pattern: ^.*$

- Description: Client ID type.
- Type: string
- Minimum Length: 1
- Maximum Length: 256

- Description: Passphrase type.
- Type: string
- Minimum Length: 1
- Maximum Length: 256

- Description: Proxy type.
- Type: string
- Maximum Length: 256
- Pattern: ^[\\w "'.:\\/\\/?]*$

- Description: Scope list type.
- Type: string
- Maximum Length: 256
- Pattern: ^[\\w "'.:\\/\\/?]*$

- Description: 'no' and 'yes' switch.
- Type: string
- Enum Values: "yes", "no"

- Description: URL type.
- Type: string
- Minimum Length: 1
- Maximum Length: 256
- Pattern: ^[\\w "'.:\\-\\/\\/~?]+$

