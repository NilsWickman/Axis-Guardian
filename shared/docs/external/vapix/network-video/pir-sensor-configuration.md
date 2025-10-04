# PIR sensor configuration

**Source:** https://developer.axis.com/vapix/network-video/pir-sensor-configuration/
**Last Updated:** Sep 2, 2025

---

# PIR sensor configuration

## Overview​

### Identification​

## Common examples​

### Configure the PIR sensors on a device​

## API specifications​

### listSensors​

### getSensitivity​

### setSensitivity​

### getSupportedVersions​

### General error codes​

The PIR sensor configuration API helps you list and configure the sensitivity of the PIR (passive infrared) sensors on your Axis device.

The API uses pirsensor.cgi as its communications interface and supports the following methods:

Please note that this API is only applicable on devices with configurable PIR sensors.

These examples will show you how to update the sensitivity of the PIR sensor on your device.

List available PIR sensors

JSON input parameters

a) Successful response example. This response will list all sensors, and their IDs, on your device. If a sensor supports configurable sensitivity its entry will contain the parameter sensitivityConfigurable with the value true, while the parameter sensitivity will be showing the sensitivity value. Non configurable sensors will not list sensitivity in its entry and will instead contain the parameter sensitivityConfigurable with the value false. The sensor ID is used to identify the specific sensor when implementing or receiving the configured sensitivity.

b) Successful response example. This response lists two sensors on the device, one of which is configurable.

c) Error response example.

API references

listSensors

Set PIR sensor sensitivity

JSON input parameters

a) Successful response example.

b) Error response example.

API references

setSensitivity

Retrieve PIR sensor sensitivity

JSON input parameters

a) The response will present you with the configured sensitivity information. Please note that this value may not be exactly the same as the one set with setSensitivity due to the accuracy of your senor’s sensitivity.

b) Error response example.

API references

getSensitivity

This method should be used when you want to list all PIR sensors on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the configured sensitivity of a specific sensor.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to configure the sensitivity of a specific sensor.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to list all API versions supported by your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "listSensors"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "listSensors",    "data": {        "sensors": [            {                "id": 0,                "sensitivityConfigurable": true,                "sensitivity": 0.05098038911819458            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "listSensors",    "data": {        "sensors": [            {                "id": 12,                "sensitivityConfigurable": false            },            {                "id": 7,                "sensitivityConfigurable": true,                "sensitivity": 0.05098038911819458            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "listSensors",    "error": {        "code": 1100,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setSensitivity",    "params": {        "id": 0,        "sensitivity": 0.5    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setSensitivity"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setSensitivity",    "error": {        "code": 2201,        "message": "Sensor does not have configurable sensitivity"    }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSensitivity",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSensitivity",    "data": {        "sensitivity": 0.05098038911819458    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSensitivity",    "error": {        "code": 2200,        "message": "Invalid sensor ID"    }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listSensors"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "listSensors",  "data": {    "sensors": [      {        "id": <integer>,        "sensitivityConfigurable": true,        "sensitivity": <number>      },      {        "id": <integer>,        "sensitivityConfigurable": false      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSensitivity"  "params": {    "id": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSensitivity",  "data": {    "sensitivity": <number>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setSensitivity"  "params": {    "id": <integer>,    "sensitivity": <number>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setSensitivity"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/pirsensor.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [ "<Major1>.<Minor1>", "<Major2>.<Minor2>" ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": <string>,  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=pir-sensor-configuration

- Request a listing of the PIR sensors on your device.

- Parse the JSON response.

- Set the sensitivity value for a PIR sensor.

- Parse the JSON response.

- Retrieve the configured PIR sensor’s sensitivity.

- Parse the JSON response.

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
| listSensors | Lists all available PIR sensors. |
| getSensitivity | Retrieves the sensitivity set for a sensor. |
| setSensitivity | Sets the sensitivity for a sensor. |
| getSupportedVersions | Retrieves a list containing API versions supported by your product. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="listSensors" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="listSensors" | The requested method. |
| data.sensors[] | Lists all sensors along with their features and data. |
| data.sensors[].id<int> | The sensor identifier. |
| data.sensors[].sensitivityConfigurable<boolean> | Indicator for whether the sensor sensitivity can be configured true or not false. |
| data.sensors[].sensitivity<number> | The sensor’s configured sensitivity, ranging from 0 to 1 (optional). |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<string> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSensitivity" | The method that should be used. |
| params | Parameters retrieved by the method. |
| params.id<int> | The sensor identity getting its sensitivity configured. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSensitivity" | The requested method. |
| data.sensitivity<number> | The configured sensitivity of the sensor, ranging from 0 to 1. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<string> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| JSON code | Description |
| --- | --- |
| 2200 | Invalid sensor id. |
| 2201 | Sensor does not have configurable sensitivity. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that should be used. |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="setSensitivity" | The method that should be used. |
| params | Parameters retrieved by the method. |
| params.id<int> | The sensor identity getting its sensitivity configured. |
| params.sensitivity<number> | The sensitivity that should be set, ranging from 0 to 1. Please note that the resulting sensitivity may not match the requested value due to the accuracy of the configuration of the sensor and it will be rounded to a supported value. The client can then use getSensitivity or listSensors to query for the value. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setSensitivity" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<string> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| JSON code | Description |
| --- | --- |
| 2200 | Invalid sensor id. |
| 2201 | Sensor does not have configurable sensitivity. |

| Parameter | Description |
| --- | --- |
| context=<string> | The user sets this value and the application echoes it back in the response (optional). |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| data.apiVersions[]=<list of versions> | A list containing all supported major versions along with their highest minor version, e.g. ["1.4", "2.5"]. |

| Parameter | Description |
| --- | --- |
| apiVersion | The API version that was used in the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<string> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| JSON code | Description |
| --- | --- |
| 1100 | Internal error |
| 2100 | API version not supported |
| 2101 | Invalid JSON |
| 2102 | Method not supported |
| 2103 | Required parameter missing |
| 2104 | Invalid parameter value specified |

