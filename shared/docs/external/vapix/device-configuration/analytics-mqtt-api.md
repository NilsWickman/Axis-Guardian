# Analytics MQTT API

**Source:** https://developer.axis.com/vapix/device-configuration/analytics-mqtt-api/
**Last Updated:** Aug 27, 2025

---

# Analytics MQTT API

## Overview​

## Use cases​

### Get available analytics data sources​

#### Add a publisher​

### Get existing publishers​

### Delete a publisher​

## API definition​

### Structure​

### Entities​

#### analytics-mqtt.v1​

#### analytics-mqtt.v1.data_sources​

##### Properties​

###### analytics-mqtt.v1.data_sources.key​

#### analytics-mqtt.v1.publishers​

##### Properties​

###### analytics-mqtt.v1.publishers.data_source_key​

###### analytics-mqtt.v1.publishers.id​

###### analytics-mqtt.v1.publishers.mqtt_topic​

###### analytics-mqtt.v1.publishers.qos​

###### analytics-mqtt.v1.publishers.retain​

###### analytics-mqtt.v1.publishers.use_topic_prefix​

### Data types​

#### data_source_key​

#### id​

#### mqtt_topic​

#### qos​

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX®.

There are internal producers of analytics data on the camera, known as "analytics data sources". The Analytics MQTT API allows you to create publishers to send analytics data from these sources to the specified MQTT (Message Queuing Telemetry Transport) topics.

This example shows how to get all analytics data sources available for sending data over MQTT.

JSON request:

JSON response:

This example shows how to add a publisher that sends data from the analytics data source over MQTT.

JSON request:

JSON response:

This example shows how to get the existing publishers.

JSON request:

JSON response:

This example shows how to delete a specified publisher to stop it from sending data over MQTT.

JSON request:

JSON response:

```
GET /config/rest/analytics-mqtt/v1/data_sources HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "data_sources": [            {                "key": "com.axis.analytics_scene_description.v0.beta#1"            },            {                "key": "com.axis.consolidated_track.v1.beta#1"            },            {                "key": "some_other_structure#other_information=value1"            }        ]    }}
```

```
POST /config/rest/analytics-mqtt/v1/publishers HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "id": "my_publisher",        "data_source_key": "com.axis.analytics_scene_description.v0.beta#1",        "mqtt_topic": "my_mqtt_topic",        "qos": 0,        "retain": false,        "use_topic_prefix": false    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
GET /config/rest/analytics-mqtt/v1/publishers HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": [        {            "id": "my_publisher",            "key": "com.axis.analytics_scene_description.v0.beta#1",            "mqtt_topic": "my_mqtt_topic",            "qos": 0,            "retain": false,            "use_topic_prefix": false        },        {            "id": "another_publisher",            "key": "com.axis.analytics_scene_description.v0.beta#1",            "mqtt_topic": "my_other_mqtt_topic",            "qos": 1,            "retain": true,            "use_topic_prefix": false        }    ]}
```

```
DELETE /config/rest/analytics-mqtt/v1/publishers/my_publisher HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
analytics-mqtt.v1 (Root Entity)    ├── data_sources (Entity Collection)        ├── key (Property)    ├── publishers (Entity Collection)        ├── data_source_key (Property)        ├── id (Property)        ├── mqtt_topic (Property)        ├── qos (Property)        ├── retain (Property)        ├── use_topic_prefix (Property)
```

```
{    "description": "An analytics datasource key.",    "maxLength": 128,    "minLength": 3,    "type": "string"}
```

```
{    "description": "Publisher identifier.",    "maxLength": 128,    "minLength": 1,    "type": "string"}
```

```
{    "description": "The mqtt topic",    "maxLength": 128,    "minLength": 1,    "pattern": "^([a-zA-Z0-9_-]+)(/[a-zA-Z0-9_-]+)*$",    "type": "string"}
```

```
{    "description": "The quality of service level of a publisher",    "enum": [0, 1, 2],    "type": "integer"}
```

- Description: Root entity
- Type: Singleton
- Operations:

Get
- Get

- Get

- Description: The data sources
- Type: Collection (Key property: key)
- Operations:

Get
- Get

- Get

- Description: A key to reference an analytics data source
- Data Type: data_source_key
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: The created publishers
- Type: Collection (Key property: id)
- Operations:

Get
Add

Permissions: admin
Required properties: id, data_source_key, mqtt_topic
Optional properties: qos, retain, use_topic_prefix


Remove

Permissions: admin
- Get
- Add

Permissions: admin
Required properties: id, data_source_key, mqtt_topic
Optional properties: qos, retain, use_topic_prefix
- Permissions: admin
- Required properties: id, data_source_key, mqtt_topic
- Optional properties: qos, retain, use_topic_prefix
- Remove

Permissions: admin
- Permissions: admin

- Get
- Add

Permissions: admin
Required properties: id, data_source_key, mqtt_topic
Optional properties: qos, retain, use_topic_prefix
- Permissions: admin
- Required properties: id, data_source_key, mqtt_topic
- Optional properties: qos, retain, use_topic_prefix
- Remove

Permissions: admin
- Permissions: admin

- Permissions: admin
- Required properties: id, data_source_key, mqtt_topic
- Optional properties: qos, retain, use_topic_prefix

- Permissions: admin

- Description: An analytics datasource key
- Data Type: data_source_key
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: Publisher identifier
- Data Type: id
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: The MQTT topic
- Data Type: mqtt_topic
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: The quality of service level
- Data Type: qos
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: The retain policy
- Data Type: Boolean
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

- Description: Use topic prefix, configured in MQTT client
- Data Type: Boolean
- Operations:

Get

Permissions: admin
- Get

Permissions: admin
- Permissions: admin

- Get

Permissions: admin
- Permissions: admin

- Permissions: admin

