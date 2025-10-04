# Audio mixer API

**Source:** https://developer.axis.com/vapix/audio-systems/audio-mixer-api/
**Last Updated:** Aug 18, 2025

---

# Audio mixer API

## Description​

### Model​

### Identification​

## Common examples​

### Audio plugins​

#### Retrieve the plugin schema​

#### Retrieve plugin settings​

#### Set plugin settings​

### Retrieve available API versions​

## API specifications​

### getPluginSchema​

### getPluginsSettings​

### setPluginsSettings​

### getSupportedVersions​

### General error codes​

The AXIS Audio mixer API contains the information on how to support a plugin framework capable of adding audio plugins to an audio chain. In this API, a plugin is something that can alter the audio stream in some way.

The API uses audiomixer.cgi as its communications interface and supports the following methods:

The following examples are used when you want to modify the audio plugin settings.

Use this example to retrieve a unique set of properties for each plugin. The method in this example returns the plugin schema for each unique setting, containing a JSON schema for the settings object for a particular plugin.

JSON input parameters

Successful response

Error response

API references

Use this example to retrieve every added audio plugin setting for all available audio sources (devices, connection, busses).

JSON input parameters

Successful response

Error response

API references

Use this example to implement the settings structure retrieved from the previous example. Please note that only parameters that are changed needs to be specified in the request, as non-specified parameters will retain their existing values.

JSON input parameters

Successful response

Error response

API references

Use this example to retrieve a list containing available API versions on your connected devices and available plugins.

JSON input parameters

Successful response

Error response

API references

This method can be used when you want to retrieve the JSON schema for a settings object used in the response from the methods getPluginsSettings and setPluginsSettings.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of API specific errors.

This method can be used when you want to retrieve the settings for all available plugins. Each plugin has a unique method for retrieving the current settings added to a specific device, as described in getPluginSchema.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of API specific errors.

This method can be used when you want to configure a plugin instance retrieved from using the getPluginsSettings method.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of API specific errors.

This method can be used when you want to retrieve a list of API versions supported by your device. The list will consist of the supported major versions along with their highest supported minor version.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Error

Response body syntax

Error codes

See General error codes for a complete list of API specific errors.

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginSchema",    "params": {        "plugin": "automaticGainControl"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginSchema",    "data": {        "$schema": "http://json-schema.org/draft-07/schema#",        "title": "automaticGainControl",        "type": "object",        "properties": {            "target": {                "type": "number",                "description": "Desired output level",                "minimum": -180,                "maximum": 0            },            "dynamic_range": {                "type": "number",                "description": "Allowed dynamic range",                "minimum": 0            }        }    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginSchema",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "data": {        "devices": [            {                "id": "0",                "inputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "automaticGainControl",                                "settings": {                                    "enabled": true,                                    "target": -6,                                    "dynamicRange": 3                                }                            },                            {                                "id": "voiceEnhancer",                                "settings": {                                    "enabled": true,                                    "noiseSuppression": -6                                }                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "simpleEq",                                "settings": {                                    "enabled": true,                                    "band0": -16,                                    "band1": -12                                }                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings",    "params": {        "devices": [            {                "id": "0",                "inputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "automaticGainControl",                                "settings": {                                    "enabled": true,                                    "target": -2,                                    "dynamicRange": 4                                }                            },                            {                                "id": "voiceEnhancer",                                "settings": {                                    "enabled": false,                                    "noiseSuppression": -6                                }                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "simpleEq",                                "settings": {                                    "enabled": true,                                    "band0": -16,                                    "band1": -12                                }                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginSchema",  "params": {    "plugin": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginSchema",  "data": {    "$schema": <string>,    "title": <string>,    "type": <string>,    "properties": <object>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginSchema",  "error":{    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSettings",}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSettings",  "data": {    "devices": [      {        "id": <string>,        "inputs": [          {            "id": <string>,            "plugins": [              {                "id": <string>,                "settings": <object>              }            ]          }        ],        "outputs": [          {            "id": <string>,            "plugins": [              {                "id": <string>,                "settings": <object>              }            ]          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSettings",  "error":{    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSettings",  "params": {    "devices": [      {        "id": <string>,        "inputs": [          {            "id": <string>,            "plugins": [              {                "id": <string>,                "settings": <object>              }            ]          }        ],        "outputs": [          {            "id": <string>,            "plugins": [              {                "id": <string>,                "settings": <object>              }            ]          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSettings",  "error":{    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/audiomixer.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>","<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error":{    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: API Discovery service

- getPluginSchema

- getPluginsSettings

- setPluginsSettings

- getSupportedVersions

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getPluginSchema | Retrieves a JSON schema for a plugin setting. |
| getPluginsSettings | Retrieves the plugin settings for all plugin instances. |
| setPluginsSettings | Sets the plugin settings for all plugin instances. |
| getSupportedVersions | Retrieve a list of supported API versions. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getPluginSchema" | Specifies the API method. |
| plugin=<string> | The name of the plugin that retrieves the settings object JSON schema. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context string provided by the request (optional). |
| method="getPluginSchema" | Specifies the API method. |
| data.$schema=<string> | The URL to the core schema meta-schema. |
| data.title=<string> | The schema title. |
| data.type=<string> | The type of settings, most likely an object. |
| data.properties=<object> | A unique JSON schema describing the properties for the settings object returned in the response from getPluginsSettings and sent in the request to setPluginsSettings. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getPluginsSettings" | Specifies the API method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context string provided by the request (optional). |
| method="getPluginsSettings" | Specifies the API method. |
| data=<object> | Container for method specific parameters. |
| data.devices[]=<list of audio devices> | List of available audio devices. |
| <audio device>.id | The audio device ID. |
| <audio device>.inputs[]=<list of inputs> | List of device inputs. |
| inputs.id | The input ID. |
| input.plugins[]=<list of plugin settings> | List of plugin settings. |
| plugins.id | The plugin instance identification. |
| plugins.settings=<object> | An object containing the settings parameters described in the response from getPluginSchema. |
| <audio device>.outputs[]=<list of outputs> | List of outputs in a device. |
| outputs.id | The output ID. |
| output.plugins[]=<list of plugin settings> | List of plugin settings. |
| plugins.id | The plugin instance identification. |
| plugins.settings=<object> | Object containing the settings parameters described by the response from getPluginSchema. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context string provided by the request (optional). |
| method="setPluginsSettings" | Specifies the API method. |
| params=<object> | Container for the method specific parameters listed below. |
| data.devices[]=<list of audio devices> | List of available audio devices. |
| <audio device>.id | The audio device ID. |
| <audio device>.inputs[]=<list of inputs> | List of device inputs. |
| inputs.id | The input ID. |
| input.plugins[]=<list of plugin settings> | List of plugin settings. |
| plugins.id | The plugin instance identification. |
| plugins.settings=<object> | An object containing the settings parameters described in the response from getPluginSchema. |
| <audio device>.outputs[]=<list of outputs> | List of outputs in a device. |
| outputs.id | The output ID. |
| output.plugins[]=<list of plugin settings> | List of plugin settings. |
| plugins.id | The plugin instance identification. |
| plugins.settings=<object> | Object containing the settings parameters described by the response from getPluginSchema. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=string | A text string echoed back from the corresponding request. |
| method="setPluginsSettings" | Specifies the API method. |

| Parameter | Description |
| --- | --- |
| context=<string> | A text string echoed back in the corresponding response (optional). |
| method="getSupportedVersions" | Specifies the API method. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context string provided by the request (optional). |
| method="getSupportedVersions" | Specifies the API method. |
| data.apiVersions[]=<list of versions> | Lists the supported major versions along with their highest supported minor version. |
| <list of versions> | Lists the <Major>.<Minor> versions, e.g. ["1.2", "3.4"] |

| Code | Definition | Description |
| --- | --- | --- |
| 1100 | INTERNAL_ERROR | Internal error. |
| 2100 | UNSUPPORTED_API_VERSION | The requested API version is not supported. |
| 2101 | JSON_INVALID_ERROR | The provided JSON input was invalid. |
| 2102 | METHOD_NOT_SUPPORTED | Method not supported. |
| 2103 | JSON_KEY_NOT_FOUND | A mandatory input parameter was not found in the input. |
| 2104 | PARAM_INVALID_VALUE_ERROR | Invalid parameter value specified. |
| 2105 | AUTHORIZATION_ERROR | Authorization failed. |
| 2106 | AUTHENTICATION_ERROR | Authentication failed. |
| 2107 | TRANSPORT_LEVEL_ERROR | Transport level error. |

