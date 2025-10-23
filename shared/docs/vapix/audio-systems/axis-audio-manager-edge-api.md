# AXIS Audio Manager Edge API

**Source:** https://developer.axis.com/vapix/audio-systems/axis-audio-manager-edge-api/
**Last Updated:** Aug 18, 2025

---

# AXIS Audio Manager Edge API

## Targets​

### List targets​

### Retrieve a target​

### Examples​

## Volume controllers​

### List volume controllers​

### Retrieve a volume controller​

### Modify volume controller​

### Examples​

## Audio sessions​

### List audio sessions​

### Retrieve an audio session​

### Examples​

With AXIS Audio Manager Edge API, you can integrate external tools to the AXIS Audio Manager Edge solution.

A target can be a physical zone or a physical device managed by AXIS Audio Manager Edge. You can use the endpoints to get information of the targets, such as the current status of a device in the site.

The target object is an enum that can be extended with additional variants. To be compatible with later versions, the client must ignore the unknown variants.

Use this method to retrieve all targets managed by AXIS Audio Manager Edge.

Request

Successful response

Response example:

Parameters when the type is device

Parameters when the type is physicalZone

Use this method to retrieve the detailed information of a specified target.

Request

Successful response

Response example:

Parameters when the type is device

Parameters when the type is physicalZone

Error response

Response example:

Example 1 shows how to fetch all targets managed by AXIS Audio Manager Edge. The response shows:

Request:

Response:

Example 2 shows how to use targetId to fetch a specific target managed by AXIS Audio Manager Edge. The response shows the device status.

Request:

Response:

Use this endpoint to set different volumes for different content type based on zones within the site.

Use this method to retrieve all volume controllers managed by AXIS Audio Manager Edge.

Request

Successful response

Response example:

Use this method to retrieve the detailed information of a specified volume controller.

Request

Successful response

Response example:

Error response

Response example:

Request

Request body example:

Successful response

Response example:

Error response 400

Response example:

Error response 415

Response example:

Example 1 shows how to fetch all volume controllers managed by AXIS Audio Manager Edge.

Request:

Response:

Example 2 shows how to use a unique ID to fetch a specific volume controller managed by AXIS Audio Manager Edge.

Request:

Response:

Example 3 shows how to update volume and unmute a specific volume controller.

Request:

Use this endpoint to view the configured audio sessions managed by AXIS Audio Manager Edge.

Use this method to retrieve all audio sessions managed by AXIS Audio Manager Edge.

Request

Successful response

Response example:

Use this method to retrieve the detailed information of a specified audio session.

Request

Successful response

Response example:

Example 1 shows how to fetch all audio sessions managed by AXIS Audio Manager Edge.

Request:

Response:

Example 2 shows how to use a unique ID to fetch a specific audio session managed by AXIS Audio Manager Edge.

Request:

Response:

```
https://<servername>/vapix/aam-edge/api/v1.0/targets
```

```
[    {        "type": "device",        "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",        "niceName": "AXIS C0000 - ACCC8E000000",        "status": {            "type": "ok"        }    }]
```

```
https://<servername>/vapix/aam-edge/api/v1.0/targets/{targetId}
```

```
{  "type": "device",  "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",  "niceName": "AXIS C0000 - ACCC8E000000",  "status": {    "type": ok  }}
```

```
{    "error": {        "code": 404,        "message": "string",        "errors": [            {                "reason": "ResourceInstanceNotFound",                "message": "string",                "errors": [{}]            }        ]    }}
```

```
GET /vapix/aam-edge/api/v1.0/targets
```

```
[    {        "type": "device",        "id": "5109a18b-1f48-40d8-b185-586d152fa0e7",        "niceName": "AXIS C8210 - 00408C1865FF",        "status": {            "type": "ok"        }    },    {        "type": "device",        "id": "c9820c2a-08c8-4957-8bb4-db67957fad75",        "niceName": "AXIS C1110 - B8A44F4DFD23",        "status": {            "type": "warning"        }    },    {        "type": "physicalZone",        "id": "1b5c939d-c622-423d-a297-d6b8925e785d",        "niceName": "5th floor",        "children": [            {                "type": "device",                "id": "5109a18b-1f48-40d8-b185-586d152fa0e7"            }        ]    }]
```

```
GET /vapix/aam-edge/api/v1.0/targets/fd25b527-b36a-4473-90fc-273810671d25
```

```
{    "type": "device",    "id": "fd25b527-b36a-4473-90fc-273810671d25",    "niceName": "AXIS C8210 - B8A44F4DFD12",    "status": {        "type": "error"    }}
```

```
https://<servername>/vapix/aam-edge/api/v1.1/volumeControllers
```

```
[    {        "allowMute": true,        "contentClasses": [            {                "type": "music"            }        ],        "id": "d290f1ee-6c54-4b01-90e6-d701748f0864",        "maxVolume": 100,        "minVolume": 0,        "muted": true,        "target": [            {                "type": "device",                "id": "d290f1ee-6c54-4b11-90e6-d701748f0864"            }        ],        "volume": 62    }]
```

```
https://<servername>/vapix/aam-edge/api/v1.1/volumeControllers/{volumeControllerId}
```

```
{    "allowMute": true,    "contentClasses": [        {            "type": "music"        }    ],    "id": "d290f1ee-6c54-4b01-90e6-d701748f0864",    "maxVolume": 100,    "minVolume": 0,    "muted": true,    "target": [        {            "type": "device",            "id": "d290f1ee-6c54-4b11-90e6-d701748f0864"        }    ],    "volume": 62}
```

```
{    "error": {        "code": 404,        "message": "string",        "errors": [            {                "reason": "ResourceInstanceNotFound",                "message": "string",                "errors": [{}]            }        ]    }}
```

```
https://<servername>/vapix/aam-edge/api/v1.1/volumeControllers/{volumeControllerId}
```

```
{    "volume": 50,    "muted": true}
```

```
{    "allowMute": true,    "contentClasses": [        {            "type": "music"        }    ],    "id": "d290f1ee-6c54-4b01-90e6-d701748f0864",    "maxVolume": 100,    "minVolume": 0,    "muted": true,    "target": [        {            "type": "device",            "id": "d290f1ee-6c54-4b11-90e6-d701748f0864"        }    ],    "volume": 62}
```

```
{    "error": {        "code": 400,        "message": "string",        "errors": [            {                "reason": "ResourceInstanceNotFound",                "message": "string",                "errors": [{}]            }        ]    }}
```

```
{    "error": {        "code": 415,        "message": "string",        "errors": [            {                "reason": "ResourceInstanceNotFound",                "message": "string",                "errors": [{}]            }        ]    }}
```

```
GET /vapix/aam-edge/api/v1.1/volumeControllers
```

```
[    {        "allowMute": true,        "contentClasses": ["music"],        "id": "fc058559-7fa1-4b4b-a06d-712dcf8a8791",        "maxVolume": 100.0,        "minVolume": 0.0,        "muted": false,        "targets": [            {                "type": "physicalZone",                "id": "88dd3c6c-bca2-4fde-b2e1-3bf5521697d1"            }        ],        "volume": 39.0    },    {        "allowMute": true,        "contentClasses": ["music"],        "id": "439efad0-133d-4e55-a67b-a78c1da76ad3",        "maxVolume": 100.0,        "minVolume": 0.0,        "muted": false,        "targets": [            {                "type": "physicalZone",                "id": "10791ec1-b01d-46d9-8983-4d27cbad82bb"            }        ],        "volume": 20.0    },    {        "allowMute": false,        "contentClasses": ["advertisements"],        "id": "44182ec9-92b3-43f6-a2c0-e7e6d40c1649",        "maxVolume": 100.0,        "minVolume": 0.0,        "muted": false,        "targets": [            {                "type": "physicalZone",                "id": "88dd3c6c-bca2-4fde-b2e1-3bf5521697d1"            }        ],        "volume": 20.0    }]
```

```
GET /vapix/aam-edge/api/v1.1/volumeControllers/fc058559-7fa1-4b4b-a06d-712dcf8a8791
```

```
{    "allowMute": true,    "contentClasses": ["music"],    "id": "fc058559-7fa1-4b4b-a06d-712dcf8a8791",    "maxVolume": 100.0,    "minVolume": 0.0,    "muted": false,    "targets": [        {            "type": "physicalZone",            "id": "88dd3c6c-bca2-4fde-b2e1-3bf5521697d1"        }    ],    "volume": 39.0}
```

```
PATCH /vapix/aam-edge/api/v1.1/volumeControllers/fc058559-7fa1-4b4b-a06d-712dcf8a8791
```

```
{    "muted": false,    "volume": 39.0}
```

```
https://<servername>/vapix/aam-edge/api/v1.2/audioSessions
```

```
[    {        "type": "vapixOneWay",        "intermediaryDevice": "5109a18b-1f48-40d8-b185-586d152fa0e7",        "targets": [            "5109a18b-1f48-40d8-b185-586d152fa0e7",            "d290f1ee-6c54-4b01-90e6-d701748f0851",            "1b5c939d-c622-423d-a297-d6b8925e785d"        ],        "id": "35dc8237-877a-4e2d-a6a1-e362feacd6d0",        "prio": 4499,        "niceName": "Vapix paging"    },    {        "type": "sipTwoWay",        "intermediaryDevice": "c9820c2a-08c8-4957-8bb4-db67957fad75",        "id": "692baed9-1f6f-483e-bb50-899734a68cd4",        "prio": 4498,        "niceName": "Sip talkback session"    }]
```

```
https://<servername>/vapix/aam-edge/api/v1.2/audioSessions/{audioSessionId}
```

```
{    "id": "62d3ed6d-7fde-4a5c-90de-0a12c60639ab",    "type": "vapixOneWay",    "intermediaryDevice": "d56e3f21-d784-4cbe-877c-34cc4e3814a9",    "targets": [        "c41d4b02-03ba-45dd-95a0-d1e9ecfe6b6e",        "06c7bd9a-43c3-44a0-b799-5df136a179bd",        "9ac4e622-0d23-4d02-8275-5240f1242fc3",        "a80a6ee5-7899-4335-a34f-789088318ed8"    ],    "prio": 4499,    "niceName": "All zones callout"}
```

```
GET /vapix/aam-edge-api/v1.2/audioSessions
```

```
[    {        "id": "62d3ed6d-7fde-4a5c-90de-0a12c60639ab",        "type": "vapixOneWay",        "intermediaryDevice": "d56e3f21-d784-4cbe-877c-34cc4e3814a9",        "targets": [            "c41d4b02-03ba-45dd-95a0-d1e9ecfe6b6e",            "06c7bd9a-43c3-44a0-b799-5df136a179bd",            "9ac4e622-0d23-4d02-8275-5240f1242fc3",            "a80a6ee5-7899-4335-a34f-789088318ed8"        ],        "prio": 4499,        "niceName": "All zones callout"    },    {        "id": "becf375f-d880-4104-8959-853b40a3636a",        "type": "vapixTwoWay",        "intermediaryDevice": "1ce0cc54-5931-4a00-9760-59427917b8b5",        "prio": 4498,        "niceName": "Cafeteria register two way call"    },    {        "id": "7b170af0-9974-4b73-85e9-e6689c3f8606",        "type": "sipOneWay",        "intermediaryDevice": "6b9ab050-f05b-43f7-812a-feedbe07185f",        "targets": ["9ac4e622-0d23-4d02-8275-5240f1242fc3"],        "prio": 4497,        "niceName": "Cafeteria paging"    },    {        "id": "7b288085-21af-4b24-9f34-ebf15bb19da6",        "type": "sipTwoWay",        "intermediaryDevice": "34523c85-c61a-40d0-9ce9-db91d54650d7",        "prio": 4496,        "niceName": "Breakroom call"    },    {        "id": "4fc68ffb-a10e-4075-808f-7673faf1afa7",        "type": "externalRtp",        "targets": [            "9ac4e622-0d23-4d02-8275-5240f1242fc3",            "06c7bd9a-43c3-44a0-b799-5df136a179bd",            "a80a6ee5-7899-4335-a34f-789088318ed8"        ],        "prio": 4495,        "niceName": "External paging",        "port": 1455,        "multicastAddress": "224.1.44.44"    },    {        "id": "166dcca8-0136-446c-985f-340a1053a099",        "type": "lineIn",        "intermediaryDevice": "6b9ab050-f05b-43f7-812a-feedbe07185f",        "targets": [            "bca44a7a-b59a-4424-b4f7-2d9e5db17317",            "d56e3f21-d784-4cbe-877c-34cc4e3814a9",            "34523c85-c61a-40d0-9ce9-db91d54650d7",            "6b9ab050-f05b-43f7-812a-feedbe07185f"        ],        "prio": 4494,        "niceName": "Line-in paging"    },    {        "id": "8c057089-6498-449b-b617-c3cf54c212a1",        "type": "vapixMediaClip",        "intermediaryDevice": "bca44a7a-b59a-4424-b4f7-2d9e5db17317",        "targets": [            "c41d4b02-03ba-45dd-95a0-d1e9ecfe6b6e",            "a80a6ee5-7899-4335-a34f-789088318ed8",            "bca44a7a-b59a-4424-b4f7-2d9e5db17317",            "d56e3f21-d784-4cbe-877c-34cc4e3814a9"        ],        "prio": 4493,        "niceName": "Mediaclip"    }]
```

```
GET /vapix/aam-edge-api/v1.2/audioSessions/35dc8237-877a-4e2d-a6a1-e362feacd6d0
```

```
{    "type": "vapixOneWay",    "intermediaryDevice": "5109a18b-1f48-40d8-b185-586d152fa0e7",    "targets": [        "5109a18b-1f48-40d8-b185-586d152fa0e7",        "d290f1ee-6c54-4b01-90e6-d701748f0851",        "1b5c939d-c622-423d-a297-d6b8925e785d"    ],    "id": "35dc8237-877a-4e2d-a6a1-e362feacd6d0",    "prio": 4499,    "niceName": "Vapix paging"}
```

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 404 Not found
- Content-Type: application/json

- the status of the devices in the site
- the information of the devices included in the zone

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 404 Not found
- Content-Type: application/json

- Method: PATCH
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- HTTP Code: 400 Bad Request
- Content-Type: application/json

- HTTP Code: 415 Payload format is not application/json
- Content-Type: application/json

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

- Method: GET
- Content-Type: application/json

- HTTP Code: 200 Operation successful
- Content-Type: application/json

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the target device |
| id | string | A unique ID of the device. |
| niceName | string or null | The nice name of the device. |
| status | object | The status of the device. |
| type | string | The status type. Valid values: error, warning, pending, ok |

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the target physicalZone |
| id | string | A unique ID of the physical zone. |
| niceName | string or null | The nice name of the physical zone. |
| children | array | A list of devices that are contained in the zone. |
| type | string | The type of the target. Valid values: device, physicalZone. It may be extended with other values in the future. |
| id | string | A unique ID of the target. |

| Path parameter | Data type | Description |
| --- | --- | --- |
| targetId | string | A unique target ID. |

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the target device |
| id | string | A unique ID of the device. |
| niceName | string or null | The nice name of the device. |
| status | object | The status of the device. |
| type | string | The status type. Valid values: error, warning, pending, ok |

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the target physicalZone |
| id | string | A unique ID of the physical zone. |
| niceName | string or null | The nice name of the physical zone. |
| children | array | A list of devices that are contained in the zone. |
| type | string | The type of the target. Valid values: device, physicalZone |
| id | string | A unique ID of the target. |

| Parameter | Data type | Description |
| --- | --- | --- |
| error | object | Container for the error data. |
| code | integer | The error code. |
| message | string | Description of the error. |
| errors | array | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| reason | string | Unique identifier for this error. Valid values: ResourceInstanceNotFound. It may be extended with other reasons in the future. |
| message | string | Detailed description of the error. |
| errors | array | Array of sub errors. |

| Parameter | Data type | Description |
| --- | --- | --- |
| allowMute | boolean | Shows whether the volume controller can be muted. |
| contentClasses | array | Contains the target content classes. type: Valid values: music, paging, announcements, advertisements. |
| id | string | The id of volume controller. |
| maxVolume | number | The maximum volume. |
| minVolume | number | The minimum volume. |
| muted | boolean | Shows whether the volume controller is muted. |
| target | array | The targets of the volume controller. type: Valid values: device, physicalZone.id: The id of the target. |
| volume | number | The volume value for the specified content type of all targets associated with the volume controller. Valid value is between the maximum volume and minimum volume. |

| Path parameter | Data type | Description |
| --- | --- | --- |
| volumeControllerId | string | The unique ID of the volume controller. |

| Parameter | Data type | Description |
| --- | --- | --- |
| allowMute | boolean | Shows whether the volume controller can be muted. |
| contentClasses | array | Contains the target content classes. type: Valid values: music, paging, announcements, advertisements. |
| id | string | The id of volume controller. |
| maxVolume | number | The maximum volume. |
| minVolume | number | The minimum volume. |
| muted | boolean | Shows whether the volume controller is muted. |
| target | array | The targets of the volume controller. type: Valid values: device, physicalZone.id: The id of the target. |
| volume | number | The volume value for the specified content type of all targets associated with the volume controller. Valid value is between the maximum volume and minimum volume. |

| Parameter | Data type | Description |
| --- | --- | --- |
| error | object | Container for the error data. |
| code | integer | The error code. |
| message | string | Description of the error. |
| errors | array | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| reason | string | Unique identifier for this error. Valid values: ResourceInstanceNotFound. It may be extended with other reasons in the future. |
| message | string | Detailed description of the error. |
| errors | array | Array of sub errors. |

| Path parameter | Data type | Description |
| --- | --- | --- |
| volumeControllerId | string | The unique ID of the volume controller. |

| Parameter | Data type | Description |
| --- | --- | --- |
| volume | number | The volume value for the specified content type of all targets associated with the volume controller. Valid value is between the maximum volume and minimum volume. |
| muted | boolean | Shows whether the volume controller is muted. |

| Parameter | Data type | Description |
| --- | --- | --- |
| allowMute | boolean | Shows whether the volume controller can be muted. |
| contentClasses | array | Contains the target content classes. type: Valid values: music, paging, announcements, advertisements. |
| id | string | The id of volume controller. |
| maxVolume | number | The maximum volume. |
| minVolume | number | The minimum volume. |
| muted | boolean | Shows whether the volume controller is muted. |
| target | array | The targets of the volume controller. type: Valid values: device, physicalZone.id: The id of the target. |
| volume | number | The volume value for the specified content type of all targets associated with the volume controller. Valid value is between the maximum volume and minimum volume. |

| Parameter | Data type | Description |
| --- | --- | --- |
| error | object | Container for the error data. |
| code | integer | The error code. |
| message | string | Description of the error. |
| errors | array | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| reason | string | Unique identifier for this error. Valid values: ResourceInstanceNotFound. It may be extended with other reasons in the future. |
| message | string | Detailed description of the error. |
| errors | array | Array of sub errors. |

| Parameter | Data type | Description |
| --- | --- | --- |
| error | object | Container for the error data. |
| code | integer | The error code. |
| message | string | Description of the error. |
| errors | array | Container for detailed error information. Each element in the array represents a different error and several errors can be returned with a single request. |
| reason | string | Unique identifier for this error. Valid values: ResourceInstanceNotFound. It may be extended with other reasons in the future. |
| message | string | Detailed description of the error. |
| errors | array | Array of sub errors. |

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the audio session. Possible values: vapixOneWay, vapixTwoWay, sipOneWay, sipTwoWay, lineIn, vapixMediaclip, externalRTP |
| intermediaryDevice | string | The ID of the physical device used as intermediary device. Not available when type is externalRTP. |
| targets | array | A list of targets of the audio session. Not available when type is vapixTwoWay or sipTwoWay. |
| id | string | The ID of the audio session. |
| prio | integer | The priority of the audio session. A larger number indicates a higher priority. |
| niceName | string | The nice name of the audio session. |
| multicastAddress | string | The multicast address of the targets. Only available when type is externalRTP. |
| port | integer | The multicast port. Only available when type is externalRTP. |

| Path parameter | Data type | Description |
| --- | --- | --- |
| audioSessionId | string | The unique ID of the audio session. |

| Parameter | Data type | Description |
| --- | --- | --- |
| type | string | The type of the audio session. Possible values: vapixOneWay, vapixTwoWay, sipOneWay, sipTwoWay, lineIn, vapixMediaclip, externalRTP |
| intermediaryDevice | string | The ID of the physical device used as intermediary device. Not available when type is externalRTP. |
| targets | array | A list of targets of the audio session. Not available when type is vapixTwoWay or sipTwoWay. |
| id | string | The ID of the audio session. |
| prio | integer | The priority of the audio session. A larger number indicates a higher priority. |
| niceName | string | The nice name of the audio session. |
| multicastAddress | string | The multicast address of the targets. Only available when type is externalRTP. |
| port | integer | The multicast port. Only available when type is externalRTP. |

