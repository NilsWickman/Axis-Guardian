# MQTT client API

**Source:** https://developer.axis.com/vapix/network-video/mqtt-client-api/
**Last Updated:** Aug 18, 2025

---

# MQTT client API

## Description​

### Model​

### Identification​

## Common examples​

### MQTT client management​

#### Configure the MQTT client​

#### Activate the MQTT client​

#### Deactivate the MQTT client​

#### Get the MQTT client status​

#### Get supported versions​

## API specifications​

### configureClient​

#### Default LWT/Connected/Disconnected messages​

### activateClient​

### deactivateClient​

### getClientStatus​

### getSupportedVersions​

### Error codes​

The MQTT client API provides you with examples and specifications that makes it possible to directly control the MQTT (Message Queuing Telemetry Transport) messaging on your Axis device. This includes configuring the device to act as an MQTT client, which can then be connected to an MQTT broker to handle message exchanges.

For more information about MQTT brokers and how to connect them to Axis devices, see MQTT.

The API implements client.cgi as its communications interface and supports the following methods:

Use this example to exchange messages and data over MQTT. MQTT is based on two entities: the client and the broker. The client is able to send and receive messages, while the broker is responsible for routing said messages between different clients.

The first step to enable MQTT messaging is to configure the MQTT client, which includes all aspects such as the broker, security, protocol settings, last will testament, announcement, etc. To configure the client, a configureClient request should be sent.

Configure the MQTT client.

JSON input parameters

Parse the JSON response

Successful response

Failed response

The client have two states: active and inactive. An active client is either trying to connect, or has already connected to a configured broker, while an inactive client does not have any effect, nor connection to the broker. To activate the client, an activateClient request should be sent. Please note that an active client remains active even after a reboot.

Activate the MQTT client.

JSON input parameters

Parse the JSON response.

Successful response

Error response

An activated MQTT can be turned off by sending a deactivation request, which will terminate the connection with the broker.

Deactivate the MQTT client instance.

JSON input parameters

Parse the JSON response.

Successful response

Error response

The status of an MQTT client can be obtained by making a status request, where the response will contain the status and configuration.

Request the status of the MQTT client.

JSON input parameters

Parse the JSON response.

Use this example to retrieve a list of API versions supported by your device.

Retrieve a list of supported API versions.

JSON input parameters

Parse the JSON response.

Successful response

Error response

This API method is used when you want to configure the MQTT client.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

LWT message

Connected message

Disconnected message

This API method is used when you want to activate the MQTT client. Please note that this client will remain active after a reboot is not deactivated.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to deactivate the MQTT client.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve the status of the MQTT client.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve a list of supported API versions.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See Error codes for a complete list of potential error codes for this API.

The error codes for this API are sorted into the following ranges:

1100–1199

Generic errors that are common to many API:s and reserved for server errors, e.g. "Maximum number of configurations reached". The cause can be seen in the server log and the problems can in some cases be solved by restarting the device.

1200–1999

API-specific server errors.

2100–2199

Generic error codes common to many API:s and reserved for client errors, e.g. "Invalid parameter". These errors can be solved by changing the input data to the API.

2200–2999

API-specific client errors. Codes in this range may collide between different API:s.

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "params": {        "server": {            "protocol": "ssl",            "host": "somebroker.somewhere.com",            "port": 8883        },        "username": "user_1",        "password": "password_1",        "keepExistingPassword": false,        "clientId": "unique_id_on_broker",        "keepAliveInterval": 20,        "connectTimeout": 30,        "cleanSession": true,        "autoReconnect": true,        "deviceTopicPrefix": "some/topic/prefix",        "lastWillTestament": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Connection Lost",            "retain": true,            "qos": 1        },        "connectMessage": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Connected",            "retain": true,            "qos": 1        },        "disconnectMessage": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Disconnected",            "retain": true,            "qos": 1        },        "ssl": {            "validateServerCert": true        }    }}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "activateClient",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "come context",    "method": "activateClient",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "activateClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "deactivateClient",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "deactivateClient",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "somce context",    "method": "deactivateClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getClientStatus",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getClientStatus",    "data": {        "status": {            "state": "inactive",            "connectionStatus": "disconnected"        },        "config": {            "server": {                "protocol": "ssl",                "host": "somebroker.somewhere.com",                "port": 8883            },            "username": "user_1",            "password": "*****",            "clientId": "unique_id_on_broker",            "keepAliveInterval": 20,            "connectTimeout": 30,            "cleanSession": true,            "autoReconnect": true,            "deviceTopicPrefix": "some/topic/prefix",            "lastWillTestament": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Connection Lost",                "retain": true,                "qos": 1            },            "connectMessage": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Connected",                "retain": true,                "qos": 1            },            "disconnectMessage": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Disconnected",                "retain": true,                "qos": 1            },            "ssl": {                "validateServerCert": true            }        }    }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{    "context": "some context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "configureClient",  "params": {    "server": {      "protocol": <string>,      "host": <string>,      "port": <integer>,      "basepath": <string>,      "alpnProtocol": <string>    },    "httpProxy": <string>,    "httpsProxy": <string>,    "username": <string>,    "password": <string>,    "keepExistingPassword": <boolean>    "clientId": <string>,    "keepAliveInterval": <int>,    "connectTimeout": <int>,    "cleanSession": <boolean>,    "autoReconnect": <boolean>,    "deviceTopicPrefix": <string>,    "lastWillTestament": {      "useDefault": <boolean>,      "topic": <string>,      "message": <string>,      "retain": <boolean>,      "qos": <int>    },    "connectMessage": {      "useDefault": <boolean>,      "topic": <string>,      "message": <string>,      "retain": <boolean>,      "qos": <int>    },    "disconnectMessage": {      "useDefault": <boolean>,      "topic": <string>,      "message": <string>,      "retain": <boolean>,      "qos": <int>    },    "ssl": {      "validateServerCert": <boolean>,      "clientCertID": <string>,      "CACertID": <string>    }  }}
```

```
{  "apiVersion":"<Major>.<Minor>",  "context": <string>,  "method": <string>,  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "activateClient"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "deactivateClient"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getClientStatus"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getClientStatus",  "data": {    "status": {      "state": <string>,      "connectionStatus": <string>    },    "config": {      <all options used when configuring the client>    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/client.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>","<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

- API Discovery: id=mqtt-client

- Configure the MQTT client.
http://<servername>/axis-cgi/mqtt/client.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "params": {        "server": {            "protocol": "ssl",            "host": "somebroker.somewhere.com",            "port": 8883        },        "username": "user_1",        "password": "password_1",        "keepExistingPassword": false,        "clientId": "unique_id_on_broker",        "keepAliveInterval": 20,        "connectTimeout": 30,        "cleanSession": true,        "autoReconnect": true,        "deviceTopicPrefix": "some/topic/prefix",        "lastWillTestament": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Connection Lost",            "retain": true,            "qos": 1        },        "connectMessage": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Connected",            "retain": true,            "qos": 1        },        "disconnectMessage": {            "useDefault": false,            "topic": "Camera_1/ConnectionStatus",            "message": "Disconnected",            "retain": true,            "qos": 1        },        "ssl": {            "validateServerCert": true        }    }}
- Parse the JSON response
Successful response
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "data": {}}
Failed response
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Activate the MQTT client.
http://<servername>/axis-cgi/mqtt/client.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "activateClient",    "params": {}}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "come context",    "method": "activateClient",    "data": {}}
Error response
{    "apiVersion": "1.0",    "context": "some context",    "method": "activateClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Deactivate the MQTT client instance.
http://<servername>/axis-cgi/mqtt/client.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "deactivateClient",    "params": {}}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "some context",    "method": "deactivateClient",    "data": {}}
Error response
{    "apiVersion": "1.0",    "context": "somce context",    "method": "deactivateClient",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Request the status of the MQTT client.
http://<servername>/axis-cgi/mqtt/client.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "getClientStatus",    "params": {}}
- Parse the JSON response.
{    "apiVersion": "1.0",    "context": "some context",    "method": "getClientStatus",    "data": {        "status": {            "state": "inactive",            "connectionStatus": "disconnected"        },        "config": {            "server": {                "protocol": "ssl",                "host": "somebroker.somewhere.com",                "port": 8883            },            "username": "user_1",            "password": "*****",            "clientId": "unique_id_on_broker",            "keepAliveInterval": 20,            "connectTimeout": 30,            "cleanSession": true,            "autoReconnect": true,            "deviceTopicPrefix": "some/topic/prefix",            "lastWillTestament": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Connection Lost",                "retain": true,                "qos": 1            },            "connectMessage": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Connected",                "retain": true,                "qos": 1            },            "disconnectMessage": {                "useDefault": false,                "topic": "Camera_1/ConnectionStatus",                "message": "Disconnected",                "retain": true,                "qos": 1            },            "ssl": {                "validateServerCert": true            }        }    }}

- Retrieve a list of supported API versions.
http://<servername>/axis-cgi/mqtt/client.cgi
JSON input parameters
{    "context": "some context",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.0",    "context": "some context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0"]    }}
Error response
{    "apiVersion": "1.0",    "context": "some context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| configureClient | Configure the MQTT client. |
| activateClient | Activate the MQTT client. |
| deactivateClient | Deactivate the MQTT client. |
| getClientStatus | Return the client status. |
| getSupportedVersions | Retrieve API versions supported by the product. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |
| params.server | Object | Contains the address and protocol related information. See sub fields for additional information. |
| params.server.protocol | String | Contains the protocols used by params.server. Possible values are:- tcp: MQTT over TCP- ssl: MQTT over SSL- ws: MQTT over Websocket- wss: MQTT over Websocket Secure |
| params.server.host | String | The Broker location, i.e. the Hostname or IP address. |
| params.server.port | Integer | The port that should be used (optional). Default values for the protocols are:- tcp: 1883- ssl: 8883- ws: 80- wss: 443 |
| params.server.basepath | String | The path that should be used as a suffix for the constructed URL and will only be used for the ws and wss connections (optional). The default value is empty string. |
| params.server.alpnProtocol | String | The ALPN protocol that should be used if the selected protocol was ssl or wss (optional). If the string value is empty the ALPN will not be used. Default value is empty and the maximum length of the protocol is 255 bytes. |
| params.httpProxy | String | The HTTP proxy that should be used (optional). If the string value is empty the HTTP proxy will not be used. The maximum length of the proxy name is 255 bytes. |
| params.httpsProxy | String | The HTTPS proxy that should be used (optional). If the string value is empty the HTTPS proxy will not be used. The maximum length of the proxy name is 255 bytes. |
| params.username | String | The user name that should be used for authentication and authorization (optional). |
| params.password | String | The password that should be used for authentication (optional). |
| params.keepExistingPassword | Boolean | Specifies whether the stored password should be kept or erased. If set to true the previously stored password will be kept, while the password field will be discarded. When set to false, the given password will be used instead. (optional). The default value is false. |
| params.clientId | String | The client identifier sent to the server when the client connects to it. |
| params.keepAliveInterval | Integer | Defines the maximum time (in seconds) that should pass without communication between the client and server. At least one message will be sent over the network by the client during each keep alive period and the interval makes it possible to detect when the server is no longer available without having to wat for the TCP/IP timeout (optional). The default value is 60. |
| params.connectTimeout | Integer | The timed interval (in seconds) to allow a connect to finish (optional). The default value is 60. |
| params.cleanSession | Boolean | This parameter controls the behavior of both the client and the server during connection and disconnection time. When this parameters is true, the state information is discarded when the client and server change state. Setting the parameter to false means that the state information is kept. |
| params.autoReconnect | Boolean | Specifies if the client should reconnect on an unintentional disconnect (optional). The default value is true. |
| params.deviceTopicPrefix | String | Specifies a prefix on MQTT topics in various scenarios, such as when you want to configure the translation of events into MQTT messages or prefix all published MQTT messages with a common prefix (optional). The default value is axis/{device serial number}. |
| params.lastWillTestament | Object | Contains the options related to LWT. If LWT is not required, this parameter should not be included in the request (optional). |
| params.lastWillTestament.useDefault | Boolean | Specifies if the default LWT should be used. If set to true, other options in this parameter will be discarded. If set to false, topic, messages, retained and qos options are required and used. See Default LWT/Connected/Disconnected messages for default messages. |
| params.lastWillTestament.topic | String | The topic that should be used by LWT (optional). This field is only required if the useDefault option is set to false. |
| params.lastWillTestament.message | String | The content that should be used by LWT (optional). This field is only required if the useDefault option is set to false. |
| params.lastWillTestament.retain | Boolean | The retained option that should be used by LWT (optional). This field is only required if the useDefault option is set to false. |
| params.lastWillTestament.qos | Integer | The QoS option that should be used by LWT (optional). This field is only required if the useDefault option is set to false. Possible values are 0, 1, 2. |
| params.connectMessage | Object | Specifies if a message should be sent when a connection is established and contains options related to connect announcements (optional). If this object is not defined this message won’t be sent. For potential subfields, see lastWillTestament. |
| params.disconnectMessage | Object | Specifies if a message should be sent when the client is manually disconnected and contains options related to manual disconnect announcements (optional). If this object is not defined this message won’t be sent. This message should not be confused with LWT, as it is used when the connection is lost and managed by the broker. For potential subfields, see lastWillTestament. |
| params.ssl | Object | Contains the options related to the SSL connection (optional). This object should only be present if the connection type is ssl or wss. |
| params.ssl.validateServerCert | Boolean | Specifies if the server certificate shall be validated. |
| params.ssl.clientCertID | String | Specifies the client certificate and key that should be used. The certificates are managed through the user interface or via ONVIF services. |
| params.ssl.CACertID | String | Specifies the CA Certificate that should be used to validate the server certificate. The certificates are managed through the user interface or via ONVIF services. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| data | Object | An empty object. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| error.code | Integer | The code representing the error that occurred in the request. |
| error.message | Integer | Explains the error that occurred. |

| Property | Value |
| --- | --- |
| Topic | {device topic prefix}/event/connection |
| Qos | 1 |
| Retained | Yes |
| Payload | { "serialNumber": "{device serial number}", "connected": false, "description": "Connection Lost", "timestamp": null } |

| Property | Value |
| --- | --- |
| Topic | {device topic prefix}/event/connection |
| Qos | 1 |
| Retained | Yes |
| Payload | { "serialNumber": "{device serial number}", "connected": true, "description": "Connected", "timestamp": "2020-09-04T11:02:55z" } |

| Property | Value |
| --- | --- |
| Topic | {device topic prefix}/event/connection |
| Qos | 1 |
| Retained | Yes |
| Payload | { "serialNumber": "{device serial number}", "connected": false, "description": "Disconnected", "timestamp": "2020-09-04T11:02:55z" } |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| data | Object | An empty object. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| error.code | Integer | The code representing the error that occurred in the request. |
| error.message | Integer | Explains the error that occurred. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| data | Object | An empty object. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| error.code | Integer | The code representing the error that occurred in the request. |
| error.message | Integer | Explains the error that occurred. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| data.status.state | String | The current state of the client. Possible values are active and inactive. |
| data.status.connectionStatus | String | The current connection state of your client. Possible values are connected, disconnected. |
| data.config | Object | Contains the settings used by your client. Its structure is the same as the one found in configureClient. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| error.code | Integer | The code representing the error that occurred in the request. |
| error.message | Integer | Explains the error that occurred. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |

| Parameter | Type | Description |
| --- | --- | --- |
| context | String | The context that was used when the request was made (optional). |
| method | String | The operation that was performed. |
| data.apiVersions[]=<list of versions> | String | Specifies the list of supported versions and includes all major versions together with their highest supported minor version. |
| <list of versions> | String | The list of "<Major>.<Minor>" versions e.g. ["1.4", "2.5"]. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| error.code | Integer | The code representing the error that occurred in the request. |
| error.message | Integer | Explains the error that occurred. |

| Code | Description |
| --- | --- |
| 1100 | Internal error |
| 2100 | API version not supported |
| 2101 | Invalid JSON format |
| 2102 | Method not supported |
| 2103 | Required parameter missing or invalid |
| 2104 | Invalid parameter value specified |
| 2105 | Authorization failure |
| 2106 | Request size too large |

