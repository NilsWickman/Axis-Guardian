# Audio Analytics

**Source:** https://developer.axis.com/vapix/audio-systems/audio-analytics/
**Last Updated:** Aug 18, 2025

---

# Audio Analytics

## Overview​

### Identification​

## Common examples​

### Audio analytics plugin​

### Retrieve supported API versions​

## API specifications​

### getPluginsSchemas​

### getPluginsSettings​

### setPluginsSettings​

### getSupportedVersions​

### General error codes​

The VAPIX® Audio Analytics API provides the information that makes it possible to manage the settings for an audio plugin framework.

The API implements audioanalytics.cgi as its communications interface and supports the following methods:

This API works with the Audio Device Control API, which can be used to configure hardware devices. The Audio Analytics API can then be used to configure the audio analytics features on the devices.

These examples will show you how to configure an existing audio analytics plugin. A plugin is made to analyze and react to an audio signal received from an audio source. Each plugin has its own unique settings object that can be used by the set/get methods detailed below.

getPluginsSchemas

Each plugin has its own individual settings object. This means that the method getPluginsSchemas will return the JSON schema for all analytics plugins.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See getPluginsSchemas for additional details.

getPluginsSettings

Return added audio plugin settings for all audio sources. The properties in the settings object are unique to the plugin and are described by the JSON schema returned with getPluginsSchemas.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See getPluginsSettings for additional details.

setPluginsSettings

The settings returned by getPluginsSettings can be used to configure the plugins with the following request. Descriptions for the settings can be requested with the method getPluginsSchemas.

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See setPluginsSettings for additional details.

This example will show you how to list all API versions supported by your device.

JSON input parameters

Successful response example

Error response example

See getSupportedVersions for additional details.

This method should be used when you want to retrieve the JSON schema for a settings object originating from the getPluginsSettings response, or in the request set by setPluginsSettings.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the settings for all plugins. The plugins all have their own settings object, detailed by the response from getPluginsSchemas.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to configure a plugin to work with the response from getPluginsSettings.

Request

Return value - Success

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to request a list of all API versions supported by your device.

Request

Return value - Success

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

The following table consist of errors that may occur for any method. Errors specific to a method are listed under their separate API description.

```
http://<servername>/axis-cgi/audioanalytics.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSchemas",    "params": {}}
```

```
{  "apiVersion": "1.0",  "context": "abc",  "method": "getPluginsSchemas",  "data": {    "schemas": [      {        "$schema": "http://json-schema.org/draft/2020-12/schema#",        "title": Adaptive Audio Detection",        "type": "object",        "properties": {          "threshold": {            "type": "number",            "description": "Required threshold (dBFs) for detection",            "minimum": -180,            "maximum": 0          },          "enable": {            "type": "boolean",            "description": "Enable detection"          }        }      },      {        "$schema": "http://json-schema.org/draft/2020-12/schema#",        "title": "Classification",        "id": "Classification",        "type": "object",        "properties": {          "enable": {            "title": "Enable",            "type": "boolean",            "description": "Enable classification"          }        }      }    ]  }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSchemas",    "error": {        "code": 2104,        "message": "Invalid parameter value specified."    }}
```

```
http://<servername>/axis-cgi/audioanalytics.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "data": {        "devices": [            {                "id": "0",                "inputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "AdaptiveAudioDetection",                                "settings": {                                    "enabled": true,                                    "threshold": -6                                }                            },                            {                                "id": "DirectionOfArrival",                                "settings": {                                    "enable": true                                }                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "AggressionDetection",                                "settings": {                                    "enable": true,                                    "level": 0                                }                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPluginsSettings",    "error": {        "code": 2100,        "message": "The requested API version is not supported."    }}
```

```
http://<servername>/axis-cgi/audioanalytics.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings",    "params": {        "devices": [            {                "id": "0",                "inputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "AdaptiveAudioDetection",                                "settings": {                                    "enable": false,                                    "threshold": -3                                }                            },                            {                                "id": "DirectionOfArrival",                                "settings": {                                    "enable": false                                }                            }                        ]                    }                ],                "outputs": [                    {                        "id": "0",                        "plugins": [                            {                                "id": "AggressionDetection",                                "settings": {                                    "enable": true,                                    "level": 2                                }                            }                        ]                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPluginsSettings",    "error": {        "code": 2104,        "message": "Invalid parameter value specified."    }}
```

```
http://<servername>/axis-cgi/audioanalytics.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 2100,        "message": "The requested API version is not supported."    }}
```

```
http://myserver/axis-cgi/audioanalytics.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSchema",  "params": {    "plugin": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSchemas",  "data": {    "schemas": [      {        "$schema": <string>,        "title": <string>,        "id": <string>,        "type": <string>,        "properties": <object>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSchemas",  "error": {    "code": <integer error code>,    "message". <string>  }}
```

```
http://myserver/axis-cgi/audioanalytics.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSetting",  "data": {    "devices": [{      "id": <string>,      "inputs": [{        "id": <string>,        "plugins": [{          "id": <string>,          "settings": <object>        }]      }],      "outputs": [{        "id": <string>,        "plugins": [{          "id": <string>,          "settings": <object>        }]      }]    }]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPluginsSettings",  "error": {    "code": <integer error code>,    "message". <string>  }}
```

```
http://myserver/axis-cgi/audioanalytics.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSetting",  "params": {    "devices": [{      "id": <string>,      "inputs": [{        "id": <string>,        "plugins": [{          "id": <string>,          "settings": <object>        }]      }],      "outputs": [{        "id": <string>,        "plugins": [{          "id": <string>,          "settings": <object>        }]      }]    }]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSettings"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPluginsSettings",  "error": {    "code": <integer error code>,    "message". <string>  }}
```

```
http://myserver/axis-cgi/audioanalytics.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions",}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=audio-analytics

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
| getPluginsSchemas | Lists the JSON schema for all settings related to an analytics plugin. |
| getPluginsSettings | Lists the plugin settings for all plugin instances. |
| setPluginsSettings | Applies the plugin settings for all plugin instances. |
| getSupportedVersions | Lists all API versions supported by your device. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the server echoes it back in the response. |
| method="getPluginsSchemas" | The method that should be used. |
| plugin=<string> | The plugin name. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPluginsSchemas" | The requested method. |
| data=<object> | Container for method specific parameters. |
| data.schemas[]=<list of plugin schemas> | List of available plugin schemas. |
| <plugin schema>.$schema=<string> | The URL for the core schema meta-schema. |
| <plugin schema>.title=<string> | The schema title. |
| <plugin schema>.id=<string> | Identification of the plugin. |
| <plugin schema>.type=<string> | The settings type, usually an object. |
| <plugin schema>.properties=<object> | A unique JSON schema describing the properties of the settings objects returned by getPluginsSettings and sent in the request by setPluginsSettings. All JSON schemas has a link to the version used in the node property $schema. The plugin uses draft/2020-12 to describe the properties. This means that a deviation will be explained if it occur from draft/2020-12. Example of a schema version:"$schema": "http://json-schema.org/draft/2020-12/schema#" |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPluginsSchemas" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional | The user sets this value and the server echoes it back in the response. |
| method="getPluginsSetting" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPluginsSettings" | The requested method. |
| data=<object> | Container for the parameters listed below. |
| data.devices[]=<list of audio devices> | Lists all available audio devices. |
| <audio device>.id | The audio device id. |
| <audio device>.inputs[]=<list of inputs> | Lists the device inputs. |
| inputs.id | The input id. |
| input.plugins[]=<list of plugin settings> | Lists the plugin settings. |
| plugins.id | The plugin instance id. |
| plugins.settings=<object> | An object containing settings parameters detailed by the response from getPluginsSchemas. |
| <audio device>.outputs[]=<list of outputs> | Lists the device outputs. |
| outputs.id | The output id. |
| output.plugins[]=<list of plugin settings> | Lists the plugin settings. |
| plugins.id | The plugin instance id. |
| plugins.settings=<object> | An object containing the settings parameters detailed in the response from getPluginsSchemas. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPluginsSettings" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPluginsSettings" | The requested method. |
| params=<object> | Container for method specific parameters listed below. |
| data.devices[]=<list of audio devices> | List containing all available audio devices. |
| <audio device>.id | The audio device id. |
| <audio device>.inputs[]=<list of inputs> | Lists the device inputs. |
| inputs.id | The input id. |
| input.plugins[]=<list of plugin settings> | Lists the plugin settings. |
| plugins.id | The plugin instance id. |
| plugins.settings=<object> | An object containing settings parameters detailed by the response from getPluginsSchemas. |
| <audio device>.outputs[]=<list of outputs> | Lists the device outputs. |
| outputs.id | The output id. |
| output.plugins[]=<list of plugin settings> | Lists the plugin settings. |
| plugins.id | The plugin instance id. |
| plugins.settings=<object> | An object containing settings parameters detailed by the response from getPluginsSchemas. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> Optional. | The user sets this value and the server echoes it back in the response. |
| method="setPluginsSettings" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional. | The context set by the user in the request. |
| method="setPluginsSettings" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The user sets this value and the server echoes it back in the response. |
| method="getSupportedVersions" | The method that should be used. |
| data.apiVersions[]=<list of versions> | A list containing all supported major versions along with their highest minor version, e.g. ["1.2", "3.4"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

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
| 2107 | TRANSPORT_LEVEL_ERROR | Transport Level Error. |

