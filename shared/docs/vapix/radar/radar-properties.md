# Radar Properties

**Source:** https://developer.axis.com/vapix/radar/radar-properties/
**Last Updated:** Aug 18, 2025

---

# Radar Properties

## Overview​

### Identification​

### Limitations​

## Use cases​

## API Specifications​

### getRadarProperties​

The VAPIX® Radar Properties API makes it possible to inspect a multitude of radar properties, including the minimum and maximum detection ranges, the number of radar objects, object speed, pairing status and more.

This API is available on all Axis devices with radar support.

The following example will show you how to fetch all radar characteristics. Additional details can be found in the API Specifications below.

Retrieve all radar properties.

Request

Responses

Successful response

Error response

400 Bad request

500 Internal server error

```
POST /properties.cgi#getRadarProperties
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarProperties"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarProperties",    "data": {        "device": "D2210-VE",        "minDetectionRange": 10,        "maxDetectionRange": 100,        "minHorizontalAngle": -30,        "maxHorizontalAngle": 30,        "minVerticalAngle": -20,        "maxVerticalAngle": 20,        "maxRadarObjects": 50,        "maxObjectSpeed": 120.5,        "networkPaired": true    }}
```

```
Status: 400 Bad RequestContent-Type: text/plain
```

```
500 Internal server errorContent-Type: text/plain
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getRadarProperties",    "error": {        "code": 1100,        "message": "Internal error."    }}
```

- API Discovery: id=radar-properties
- Parameter Properties.Radar.Properties.Version

- Send a getRadarProperties request to check which capabilities are available on the radar. Examples on properties include radar detection range and angle settings.

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version that is used in the request. |
| context=<string>  Optional | my context | The user sets this value in the request and the application will echo it back in the response. |
| method="getRadarProperties" |  | The API method that is called in the request. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getRadarProperties" |  | The requested API method. |
| device=<string> | "D2210-VE" | The product number of the radar device. |
| minDetectionRange=<integer> | 10 | The minimum detection range. |
| maxDetectionRange=<integer> | 100 | The maximum detection range. |
| minHorizontalAngle=<integer> | -30 | The minimum horizontal angle. |
| maxHorizontalAngle=<integer> | 30 | The maximum horizontal angle. |
| minVerticalAngle=<integer> | -20 | The minimum vertical angle. |
| maxVerticalAngle=<integer> | 20 | The maximum vertical angle. |
| maxRadarObjects=<integer> | 50 | The maximum number of radar objects. |
| maxObjectSpeed=<number> | 120.5 | The maximum object speed. |
| networkPaired=<boolean> | true | Checks if the radar device is paired with another device. Can be either true or false. |

| Parameter | Example value | Description |
| --- | --- | --- |
| apiVersion=<string> | 1.0 | The API version used in the request. |
| context=<string>  Optional | my context | The context set by the user in the request. |
| method="getRadarProperties" |  | The requested API method. |
| error.code=<integer> | 1100 | The error code. |
| error.message=<string> | Internal error. | The error message for the corresponding error code. |

| Error code | Error message |
| --- | --- |
| 1100 | Internal error. |
| 2100 | API version not supported. |
| 2101 | Invalid JSON. |
| 2102 | Method not supported. |
| 2103 | Required parameter missing. |
| 2104 | Invalid parameter value specified. |
| 2105 | Authorization failed. |
| 2106 | Authentication failed. |
| 2107 | Transport level error. |

