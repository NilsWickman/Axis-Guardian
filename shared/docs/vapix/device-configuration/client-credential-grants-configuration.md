# Client credential grants configuration

**Source:** https://developer.axis.com/vapix/device-configuration/client-credential-grants-configuration/
**Last Updated:** Sep 10, 2025

---

# Client credential grants configuration

## Use cases​

### Set all settings​

#### Specify the JWKS verification URI for access token verification​

### Get all settings​

#### The JWKS verification URI used for access token verification​

### Update a single setting​

## API definition​

### Structure​

### Entities​

#### oauth-ccgrant.v1​

##### Properties​

##### Actions​

#### oauth-ccgrant.v1.AuthEntity​

##### Properties​

###### CCG_AuthzAdminClaim​

###### CCG_AuthzOperatorClaim​

###### CCG_AuthzViewerClaim​

###### CCG_OAuth2TokenVerify​

###### CCG_RequireClaim​

##### Actions​

### Data types​

#### optional_claim_type​

#### required_claim_type​

#### url_type​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

This API is in BETA stage and provided for testing purposes. It is subject to backward-incompatible changes, including modifications to its functionality, behavior and availability. The API should not be used in production environments.

The VAPIX® Client Credentials Grant API enables secure machine-to-machine communication by providing a mechanism that can be used to exchange authorization credentials with the help of JWKS (JSON Web Key Set).

All Client Credentials Grant settings can be set at the same time with the auth config entity.

Enter the claim that is required by a token that allows the correct access level to initiate the request. The claim is required for all API requests and one of admin/operator/viewer should be used to assign the proper access level.

Read out the current Client Credentials Grant settings from the auth entity.

Enter the claim that is required by a token that allows the correct access level to initiate the request. The claim is required for all API requests and one of admin/operator/viewer should be used to assign the proper access level.

All settings can be applied separately, such as changing the claim for admin access.

This entity has no properties.

This entity has no actions.

This entity has no actions.

```
PATCH /config/rest/oauth-ccgrant/v1beta/AuthEntity HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "CCG_AuthzAdminClaim": "example-claim-admin",        "CCG_AuthzOperatorClaim": "example-claim-operator",        "CCG_AuthzViewerClaim": "example-claim-viewer",        "CCG_OAuth2TokenVerify": "https://example.jwksverify.uri",        "CCG_RequireClaim": "example-claim"    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/oauth-ccgrant/v1beta/AuthEntity HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "CCG_AuthzAdminClaim": "example-claim-admin",        "CCG_AuthzOperatorClaim": "example-claim-operator",        "CCG_AuthzViewerClaim": "example-claim-viewer",        "CCG_OAuth2TokenVerify": "https://example.jwksverify.uri",        "CCG_RequireClaim": "example-claim"    }}
```

```
PATCH /config/rest/oauth-ccgrant/v1beta/AuthEntity/CCG_AuthzAdminClaim HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": "example-claim-admin"}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
oauth-ccgrant.v1 (Root Entity)    ├── AuthEntity (Entity)        ├── CCG_AuthzAdminClaim (Property)        ├── CCG_AuthzOperatorClaim (Property)        ├── CCG_AuthzViewerClaim (Property)        ├── CCG_OAuth2TokenVerify (Property)        ├── CCG_RequireClaim (Property)
```

- Description: CCG configuration.
- Type: Singleton
- Operations

Get
Set

Properties: AuthEntity
- Get
- Set

Properties: AuthEntity
- Properties: AuthEntity
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

Properties: AuthEntity
- Properties: AuthEntity

- Properties: AuthEntity

- Dynamic Support: No

- Description: Client authentication properties.
- Type: Singleton
- Operations

Get
Set

Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim
- Get
- Set

Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim
- Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get
- Set

Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim
- Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim

- Properties: CCG_AuthzAdminClaim, CCG_AuthzOperatorClaim, CCG_AuthzViewerClaim, CCG_OAuth2TokenVerify, CCG_RequireClaim

- Dynamic Support: No

- Description: Claim and value corresponding to to admin access
- Datatype: optional_claim_type
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Claim and value corresponding to operator access
- Datatype: optional_claim_type
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Claim and value corresponding to viewer access
- Datatype: optional_claim_type
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: JWKS URI that serves the public keys.
- Datatype: url_type
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Required claim.
- Datatype: required_claim_type
- Operations

Get (Permissions: admin)
Set (Permissions: admin)
- Get (Permissions: admin)
- Set (Permissions: admin)
- Attributes

Nullable: No
Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No
- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Get (Permissions: admin)
- Set (Permissions: admin)

- Nullable: No
- Dynamic Support: No / Dynamic Enum: No / Dynamic Range: No

- Description: Optional claims.
- Type: string
- Maximum Length: 256
- Pattern: ^.*$

- Description: Mandatory claims.
- Type: string
- Minimum Length: 1
- Maximum Length: 256
- Pattern: ^.*$

- Description: URL type.
- Type: string
- Minimum Length: 1
- Maximum Length: 256
- Pattern: ^[\\w "'.:\\-\\/\\/~?]+$

