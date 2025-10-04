# MQTT Event Bridge

**Source:** https://developer.axis.com/vapix/network-video/mqtt-event-bridge/
**Last Updated:** Aug 27, 2025

---

# MQTT Event Bridge

## Description​

### Model​

### Identification​

## Common examples​

### Publish events​

#### Configure an event publication​

#### Get event publication configuration​

### Subscribe to MQTT messages​

#### Configure MQTT subscription​

#### Retrieve MQTT subscription configurations​

#### Get supported versions​

## API specifications​

### configureEventPublication​

### getEventPublicationConfig​

### configureMqttSubscription​

### getMqttSubscriptionConfig​

### getSupportedVersions​

### General error codes​

The MQTT Event Bridge API contains the information and steps that makes it possible to control the bridging of Event Service events and MQTT messages. By using this API, you will be able to configure your Axis device to publish events to an external MQTT broker and convert received MQTT messages to Event Service events.

The API implements event.cgi as its communications interface and supports the following methods:

Use this example to publish a subset of device events as MQTT messages to the configured broker.

Event publications will only be enabled when the filters have been set. These filters can only be applied to topics. Please note that payload filtering is not possible.

Select events to publish.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

configureEventPublication

The event publication configuration can be obtained by making a configuration test. The response will contain the current event publication configuration.

Request the current configuration.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

getEventPublicationConfig

Use this example to activate rules by employing MQTT messages. Please note that MQTT messages published by other clients connected to the same broker can be consumed within the platform. Subscribing to topics through this API means that received messages will be converted to events that can be used to either activate or trigger rules.

A subscription is required to enable MQTT message-event conversions. MQTT topic filters are used with an external broker to select incoming MQTT messages. The filters also specify how the messages should be converted to events.

Select incoming MQTT messages.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

configureMqttSubscription

Use this example to retrieve a response containing the current MQTT subscription configurations.

Request the current configuration.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

getMqttSubscriptionConfig

Use this example to retrieve a list of API versions supported by your device.

Retrieve a list of supported API versions.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

API references

getSupportedVersions

This API method is used when you want to select events that should be published.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve the event publication configuration.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method is used when you want to select specific MQTT messages.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve the current MQTT subscription configuration.

Request

Return value - Success

Response body

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

This API method is used when you want to retrieve a list of supported API versions.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential error codes for this API.

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
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "params": {        "eventFilterList": [            {                "topicFilter": "onvif:PTZController/axis:PTZReady"            },            {                "topicFilter": "onvif:Device/axis:IO/VirtualInput"            },            {                "topicFilter": "onvif:Device/axis:Status//."            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "data": {        "eventPublicationConfig": {            "topicPrefix": "default",            "customTopicPrefix": "",            "appendEventTopic": true,            "includeTopicNamespaces": true,            "includeSerialNumberInPayload": false,            "eventFilterList": [                {                    "topicFilter": "onvif:Device/axis:IO/VirtualPort",                    "qos": 0,                    "retain": "none"                },                {                    "topicFilter": "onvif:Device/axis:Status/SystemReady",                    "qos": 0,                    "retain": "none"                },                {                    "topicFilter": "onvif:Device/axis:Status//.",                    "qos": 0,                    "retain": "none"                }            ]        }    }}
```

```
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "params": {        "mqttFilterList": [            {                "topicFilter": "building/A/door/10/opened",                "qos": 1,                "isStateData": false            },            {                "topicFilter": "building/A/window/10/state",                "qos": 0,                "isStateData": true            },            {                "topicFilter": "building/+/window/#",                "qos": 1,                "isStateData": false            }        ]    }}
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "data": {}}
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "params": {}}
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "data": {        "mqttSubscriptionConfig": {            "mqttFilterList": [                {                    "topicFilter": "building/A/door/10/opened",                    "useDeviceTopicPrefix": false,                    "qos": 1,                    "isStateData": false                },                {                    "topicFilter": "building/A/window/10/state",                    "useDeviceTopicPrefix": false,                    "qos": 0,                    "isStateData": true                },                {                    "topicFilter": "building/+/window/#",                    "useDeviceTopicPrefix": false,                    "qos": 1,                    "isStateData": false                }            ]        }    }}
```

```
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "error": {        "code": 1100,        "message": "Internal Error"    }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{    "context": "some context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "some context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "some context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{  "apiVersion": "1.0",  "context": "some context",  "method": "configureEventPublication",  "params": {    "topicPrefix": <enum_string>,    "customTopicPrefix": <string>,    "appendEventTopic": <boolean>,    "includeTopicNamespaces": <boolean>,    "includeSerialNumberInPayload": <boolean>,    "eventFilterList": [      {        "topicFilter": <string>,        "qos": <integer>,        "retain": <enum string>      },      ...    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEventPublicationConfig"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getEventPublicationConfig",  "data": {    "eventPublicationConfig": {      "topicPrefix": <enum_string>,      "customTopicPrefix": <string>,      "appendEventTopic": <boolean>,      "includeTopicNamespaces": <boolean>,      "includeSerialNumberInPayload": <boolean>,      "eventFilterList": [        {          "topicFilter": <string>,          "qos": <integer>,          "retain": <enum string>        },        ...      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "configureMqttSubscription",  "params": {    "mqttFilterList": [      {        "topicFilter": <string>,        "useDeviceTopicPrefix": <boolean>,        "qos": <integer>,        "isStateData": <boolean>      },      ...    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "configureMqttSubscription",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMqttSubscriptionConfig",}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getMqttSubscriptionConfig",  "data": {    "mqttSubscriptionConfig": {      "mqttFilterList": [        {          "topicFilter": <string>,          "useDeviceTopicPrefix": <boolean>,          "qos": <integer>,          "isStateData": <boolean>        },        ...      ]    }  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/mqtt/event.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>","<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer>,    "message": <string>  }}
```

- API Discovery: id=event-mqtt-bridge

- Select events to publish.
http://<servername>/axis-cgi/mqtt/event.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "params": {        "eventFilterList": [            {                "topicFilter": "onvif:PTZController/axis:PTZReady"            },            {                "topicFilter": "onvif:Device/axis:IO/VirtualInput"            },            {                "topicFilter": "onvif:Device/axis:Status//."            }        ]    }}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "data": {}}
Error response example
{    "apiVersion": "1.0",    "context": "some context",    "method": "configureEventPublication",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Request the current configuration.
http://<servername>/axis-cgi/mqtt/event.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "params": {}}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "data": {        "eventPublicationConfig": {            "topicPrefix": "default",            "customTopicPrefix": "",            "appendEventTopic": true,            "includeTopicNamespaces": true,            "includeSerialNumberInPayload": false,            "eventFilterList": [                {                    "topicFilter": "onvif:Device/axis:IO/VirtualPort",                    "qos": 0,                    "retain": "none"                },                {                    "topicFilter": "onvif:Device/axis:Status/SystemReady",                    "qos": 0,                    "retain": "none"                },                {                    "topicFilter": "onvif:Device/axis:Status//.",                    "qos": 0,                    "retain": "none"                }            ]        }    }}
Error response example
{    "apiVersion": "1.0",    "context": "some context",    "method": "getEventPublicationConfig",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Select incoming MQTT messages.
http://<servername>/axis-cgi/mqtt/event.cgi
JSON input parameters
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "params": {        "mqttFilterList": [            {                "topicFilter": "building/A/door/10/opened",                "qos": 1,                "isStateData": false            },            {                "topicFilter": "building/A/window/10/state",                "qos": 0,                "isStateData": true            },            {                "topicFilter": "building/+/window/#",                "qos": 1,                "isStateData": false            }        ]    }}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "data": {}}
Error response example
{    "apiVersion": "1.1",    "context": "some context",    "method": "configureMqttSubscription",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Request the current configuration.
http://<servername>/axis-cgi/mqtt/event.cgi
JSON input parameters
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "params": {}}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "data": {        "mqttSubscriptionConfig": {            "mqttFilterList": [                {                    "topicFilter": "building/A/door/10/opened",                    "useDeviceTopicPrefix": false,                    "qos": 1,                    "isStateData": false                },                {                    "topicFilter": "building/A/window/10/state",                    "useDeviceTopicPrefix": false,                    "qos": 0,                    "isStateData": true                },                {                    "topicFilter": "building/+/window/#",                    "useDeviceTopicPrefix": false,                    "qos": 1,                    "isStateData": false                }            ]        }    }}
Error response example
{    "apiVersion": "1.1",    "context": "some context",    "method": "getMqttSubscriptionConfig",    "error": {        "code": 1100,        "message": "Internal Error"    }}

- Retrieve a list of supported API versions.
http://<servername>/axis-cgi/mqtt/event.cgi
JSON input parameters
{    "context": "some context",    "method": "getSupportedVersions"}
- Parse the JSON response.
Successful response example
{    "apiVersion": "2.1",    "context": "some context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
Error response example
{    "apiVersion": "2.1",    "context": "some context",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}

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
| configureEventPublication | Configures the event publishing. |
| getEventPublicationConfig | Returns the event publish configuration. |
| configureMqttSubscription | Configures the MQTT subscription. |
| getMqttSubscriptionConfig | Returns the subscription configuration. |
| getSupportedVersions | Retrieves API versions supported by your product. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used in the request. |
| context | String | The user sets this value and the application echoes it back in the response (optional). |
| method | String | The operation that should be performed. |
| params.topicPrefix | String | Controls the topic prefix (optional). Possible values are:- default: A {serial number}/event is used as a prefix. This is the default value.- custom: The value provided when the customTopicPrefix field is used as the prefix when publishing MQTT messages. |
| params.customTopicPrefix | String | Specifies which custom topic prefix that should be used (optional). If topicPrefix is set to custom, this parameter will also be required. |
| params.appendEventTopic | String | If this parameter is set to true (its default value), the topic of the event will be appended to the prefix (optional). |
| params.includeTopicNamespaces | Boolean | Specifies if ONVIF topic namespaces should be included in the MQTT message topic (optional). The default value is true. |
| params.includeSerialNumberInPayload | Boolean | Specifies if a serial number should be included in the payload message (optional). The default value is false. |
| params.eventFilterList | Object list | A list of filters that should be applied on messages originating from the Event system. If a message matches multiple filters it will be published several times. |
| params.eventFilterList[].topicFilter | String | A subscription filter that should be used in the Event system. This filter is based on "Concrete topic expressions" and is specified in the ONVIF code specifications. This kind of filter uses name spaces for its predefined values. Examples: onvif:Device/axis:Status/SystemReady onvif:Device/axis:IO//. onvif:RuleEngine/MotionRegionDetector/Motion axis:CameraApplicationPlatform/VMD/Camera1ProfileANY |
| params.eventFilterList[].qos | Integer | A Qos policy that should be used when publishing any event from this filter (optional). Possible values are 0, 1, 2. Default value is 0. |
| params.eventFilterList[].retain | String | A retain policy that should be used when publishing any event from this filter (optional). Possible values are:- none: All messages are sent out as non-retained. This is the default value.- property: Events are sent out as non-retained, while property-states are sent out as retained.- all: All messages are sent out as retained. |

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
| data.eventPublicationConfig | Object | An object containing all options used for event publishing. The structure is the same as in configureEventPublication. |

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
| params.mqttFilterList | List | Lists the MQTT topic filters used to subscribe to the external broker. Messages matching the topic filters will be converted to internal events. |
| params.mqttFilterList[].topicFilter | String | An MQTT subscription topic filter that should be used together with the external broker. Please note that + and # are only allowed for stateless event conversions, i.e. when the isStateData is set to false. |
| params.mqttFilterList[].useDeviceTopicPrefix | Boolean | Governs the use of the device topic prefixes on subscriptions (optional). The topic specified as topicFilter will be prefixed with the device topic prefix when this parameter is true. The device topic prefix itself is configured as part of the client configuration shown in MQTT client API. Default value is false. |
| params.mqttFilterList[].qos | Integer | The MQTT subscription QoS that should be used together with the external broker (optional). Possible values are 0, 1, 2. Default value is 0. |
| params.mqttFilterList[].isStateData | boolean | Specifies if matching MQTT messages contain state data (optional). Matching incoming messages are converted into stateful (property) events when this parameter is set to true, while messages will be converted to stateless (non-property) events when it is set to false. Possible values: true, false. Default value: false. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that was used in the request. |
| context | String | The context that was used when the request was made. |
| method | String | The operation that was performed. |
| data | Object | Empty object. |

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
| data.mqttSubscriptionConfig | Object | Contains all subscription options, with a structure similar to the request found in configureMqttSubscription. |

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
| apiVersion | String | The latest API version. |
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
| 1100 | Internal error. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON format. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing or invalid. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failure. |
| 2106 | Request size too large. |

