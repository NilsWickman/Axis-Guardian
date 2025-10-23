# Stitching

**Source:** https://developer.axis.com/vapix/network-video/stitching/
**Last Updated:** Aug 18, 2025

---

# Stitching

## Description​

### Model​

### Identification​

## Use cases​

### Retrieve supported API versions and capabilities​

#### Retrieve supported API versions​

#### Retrieve supported capabilities​

### Change blending amount​

#### Retrieve blending amount​

#### Set blending amount​

### Change parallax compensation distance​

#### Retrieve parallax compensation distance​

#### Set parallax compensation distance​

### Align the sensor images in a panoramic view​

### Restore settings back to factory default​

### Enable or disable horizon straightening​

#### Enable horizon straightening​

#### Disable horizon straightening​

### Check if horizon straightening is enabled​

### Change horizon straightening tilt​

#### Retrieve horizon straightening properties​

#### Set horizon straightening tilt​

### Enable or disable horizon straightening stretch​

#### Retrieve horizon straightening properties​

#### Enable horizon straightening stretch​

#### Disable horizon straightening stretch​

### Change horizon straightening stretch amount​

#### Retrieve horizon straightening properties​

#### Set horizon straightening stretch amount​

### Get horizontal and vertical field of view​

## API specifications​

### getSupportedVersions​

### getCapabilities​

### getBlendingAmount​

### setBlendingAmount​

### getParallaxCompensationDistance​

### setParallaxCompensationDistance​

### rotateAngle​

### restore​

### setHorizonStraighteningEnabled​

### getHorizonStraighteningEnabled​

### getHorizonStraighteningProperties​

### setHorizonStraighteningTilt​

### setHorizonStraighteningStretchEnabled​

### setHorizonStraighteningStretchAmount​

### getFieldOfView​

### General error codes​

The Stitching API documentation introduces you to the steps that lets you set the blending amount and parallax compensation distance in order to reach optimized alignment in a panoramic video stream. By using this API you will also be able to align the sensor images in a panoramic view in the event that one or several sensors have been moved from their original position.

The API implements stitching.cgi as its communications interface and supports the following methods:

Use these examples to retrieve a list of API versions and information about what parts of the stitching.cgi are supported by your device.

JSON input parameters

Successful response example

Error response example

API references

getSupportedVersions

JSON input parameters

Successful response example

Error response example

API references

getCapabilities

Use these examples to change the blending amount, which makes seams between sensor images appear sharper or blurrier.

JSON input parameters

Successful response example

Error response example

API references

getBlendingAmount

JSON input parameters

Successful response example

Error response example

API references

setBlendingAmount

Use these examples to change the parallax compensation distance so that the most important object is aligned around the seams.

JSON input parameters

Successful response example

Error response example

API references

getParallaxCompensationDistance

JSON input parameters

Successful response example

Error response example

API references

setParallaxCompensationDistance

Use these examples to align the sensor images in a panoramic view in the event that they have become unaligned.

Pan the sensor

JSON input parameters

Successful response example

Error response example

Tilt the sensor

JSON input parameters

Successful response example

Error response example

Roll the sensor

JSON input parameters

Successful response example

Error response example

API references

rotateAngle

Use this example to restore the device settings to factory default. This is useful when you have made changes to either the blending amount, parallax compensation distance or alignment in the previous examples and want to return to the original settings.

JSON input parameters

Successful response example

Error response example

API references

restore

Use these examples to enable horizon straightening to make the horizon to be straight, or disable horizon straightening.

JSON input parameters

Successful response example

Error response example

JSON input parameters

Successful response example

Error response example

API references

setHorizonStraighteningEnabled

Use this example to check if horizon straightening is enabled.

JSON input parameters

Successful response example

Error response example

API references

getHorizonStraighteningEnabled

Use these examples to change the horizon straightening tilt to make the straight horizon not in the middle of the image.

JSON input parameters

Successful response example

Error response example

API references

getHorizonStraighteningProperties

JSON input parameters

Successful response example

Error response example

API references

setHorizonStraighteningTilt

Use these examples to enable or disable horizon straightening stretch to hide or show the black areas in the corners of the image.

JSON input parameters

Successful response example

Error response example

API references

getHorizonStraighteningProperties

JSON input parameters

Successful response example

Error response example

JSON input parameters

Successful response example

Error response example

API references

setHorizonStraighteningStretchEnabled

Use these examples to change the horizon straightening stretch amount.

JSON input parameters

Successful response example

Error response example

API references

getHorizonStraighteningProperties

JSON input parameters

Successful response example

Error response example

API references

setHorizonStraighteningStretchAmount

Use this example to get the supported horizontal and vertical field of view.

JSON input parameters

Successful response example

Error response example

API references

getFieldOfView

This method is used when you want to retrieve a list of API versions supported by your device. The list will consist of the major API versions along with their highest supported minor version. Please note that the version is for the API as a whole, i.e. all methods supported by stitching.cgi.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to retrieve a list of stitching.cgi methods supported on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to return the current blending amount value.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to set a new blending amount value. Changing this value is useful when there are differences in the white balance between sensors.

It is generally a good idea to set the blending amount to 0 when there is only one object at the same distance as the parallax compensation distance around the seams. This will add a sharp transition between seams, however, in cases where there are many different objects at different distances around the seams it is usually better to increase the blending amount. Doing this will blur our any skewered alignments that might occur around the seams.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to retrieve the value for the parallax compensation distance.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to set a new value for the parallax compensation distance.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to align the sensor images in the panoramic view to improve the stitching effect.

Each sensor can rotate on the "pan", "tilt" and "roll" axis. The hard limits of the angles can’t exceed -180 to +180 degrees, but there are lower soft limits that are product and sensor dependent. AXIS Q3819–PVE for example, has a soft limit of ± 1.4 degrees when using pan. Exceeding these limits can cause unknown behavior in the image.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method is used when you want to reset the alignment, parallax compensation distance or blending amount to the unit specific default settings.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

Use this method to enable or disable horizon straightening.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Use this method to retrieve if the horizon straightening is enabled.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

Use this method to retrieve the value of horizon straightening tilt, if horizon straightening stretch is enabled, and the stretch amount.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Use this method to set the position of the straight horizon.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Use this method to enable or disable horizon straightening stretch.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Use this method to set a value of horizon straightening stretch amount.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Use this method to retrieve the supported horizontal and vertical field of view.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This table lists the errors that can occur for all CGI methods. Method specific errors are listed under their respective API specification.

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1", "3.0"]    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error, could not complete request."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getCapabilities"}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getCapabilities",    "data": {        "capabilities": {            "getBlendingAmount": true,            "setBlendingAmount": true,            "getParallaxCompensationDistance": true,            "setParallaxCompensationDistance": true,            "rotateAngle": true,            "restore": true        },        "limits": {            "blendingAmountMin": 0.0,            "blendingAmountMax": 100.0,            "parallaxCompensationDistanceMin": 1.0,            "parallaxCompensationDistanceMax": 50.0,            "idMin": 0,            "idMax": 3,            "angleMin": -180,            "angleMax": 180        }    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getCapabilities",    "error": {        "code": 2003,        "message": "The requested API version is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getBlendingAmount"}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getBlendingAmount",    "data": {        "blendingAmount": 50.0    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getBlendingAmount",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setBlendingAmount",    "params": {        "blendingAmount": 75.0    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setBlendingAmount",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setBlendingAmount",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getParallaxCompensationDistance"}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getParallaxCompensationDistance",    "data": {        "parallaxCompensationDistance": 10.0    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "getParallaxCompensationDistance",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setParallaxCompensationDistance",    "params": {        "parallaxCompensationDistance": 20.0    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setParallaxCompensationDistance",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "setParallaxCompensationDistance",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "params": {        "id": 2,        "axis": "pan",        "angle": 0.05    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "params": {        "id": 0,        "axis": "tilt",        "angle": 0.15    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "params": {        "id": 3,        "axis": "roll",        "angle": -0.2    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "rotateAngle",    "error": {        "code": 4001,        "message": "Mandatory input parameter was not found in the input."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "restore",    "params": {        "id": 0    }}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "restore",    "data": {}}
```

```
{    "apiVersion": "3.0",    "context": "abc",    "method": "restore",    "error": {        "code": 1000,        "message": "Invalid parameter value."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "params": {        "horizonStraighteningEnabled": true    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "error": {        "code": 2300,        "message": "Internal vipd error, could not complete request."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "params": {        "horizonStraighteningEnabled": false    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningEnabled",    "error": {        "code": 2004,        "message": "Method not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningEnabled"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningEnabled",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningEnabled",    "error": {        "code": 2213,        "message": "Operation is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "data": {        "horizonStraighteningTilt": 10.0,        "horizonStraighteningStretchEnabled": true,        "horizonStraighteningStretchAmount": 50.0    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "error": {        "code": 2215,        "message": "Horizon Straightening is not enabled."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningTilt",    "params": {        "horizonStraighteningTilt": 10    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningTilt",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningTilt",    "error": {        "code": 2213,        "message": "Operation is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "data": {        "horizonStraighteningTilt": 10.0,        "horizonStraighteningStretchEnabled": true,        "horizonStraighteningStretchAmount": 50.0    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "error": {        "code": 2215,        "message": "Horizon Straightening is not enabled."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "params": {        "horizonStraighteningStretchEnabled": true    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "error": {        "code": 2213,        "message": "Operation is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "params": {        "horizonStraighteningStretchEnabled": false    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchEnabled",    "error": {        "code": 2213,        "message": "Operation is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "data": {        "horizonStraighteningTilt": 10.0,        "horizonStraighteningStretchEnabled": true,        "horizonStraighteningStretchAmount": 50.0    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "error": {        "code": 2215,        "message": "Horizon Straightening is not enabled."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchAmount",    "params": {        "horizonStraighteningStretchAmount": 50    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchAmount",    "data": {}}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "setHorizonStraighteningStretchAmount",    "error": {        "code": 2216,        "message": "Horizon Straightening stretch is disabled."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getFieldOfView"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getFieldOfView",    "data": {        "hFoV": 180,        "vFoV": 90    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getFieldOfView",    "error": {        "code": 2003,        "message": "The requested API version is not supported."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": [      <string>,      <string>    ]  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getCapabilities"}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getCapabilities",  "data": {    "capabilities": {      "getBlendingAmount": <boolean>,      "setBlendingAmount": <boolean>,      "getParallaxCompensationDistance": <boolean>,      "setParallaxCompensationDistance": <boolean>,      "rotateAngle": true,      "restore": true    },    "limits": {      "blendingAmountMin": <number>,      "blendingAmountMax": <number>,      "parallaxCompensationDistanceMin": <number>,      "parallaxCompensationDistanceMax": <number>,      "idMin": <number>,      "idMax": <number>,      "angleMin": <number>,      "angleMax": <number>    }  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getCapabilities",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getBlendingAmount"}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getBlendingAmount",  "data": {    "blendingAmount": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getBlendingAmount",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setBlendingAmount"  "params": {    "blendingAmount": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setBlendingAmount",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setBlendingAmount",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getParallaxCompensationDistance"}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getParallaxCompensationDistance",  "data": {    "parallaxComensationDistance": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getParallaxCompensationDistance",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setParallaxCompensationDistance"  "params": {    "parallaxCompensationDistance": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setParallaxCompensationDistance",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setParallaxCompensationDistance",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "rotateAngle"  "params": {    "id": <number>,    "axis": <string>,    "angle": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "rotateAngle",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "rotateAngle",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "restore"  "params": {    "id": <number>,  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "restore",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "restore",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "setHorizonStraighteningEnabled",    "params": {        "horizonStraighteningEnabled": <boolean>    }}
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "setHorizonStraighteningEnabled",    "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningEnabled",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "getHorizonStraighteningEnabled"}
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "getHorizonStraighteningEnabled",    "data": {        "enabled": <boolean>    }}
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "getHorizonStraighteningEnabled",    "error": {        "code": <number>,        "message": <string>    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties"}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "data": {        "horizonStraighteningTilt": 10.0,        "horizonStraighteningStretchEnabled": true,        "horizonStraighteningStretchAmount": 50.0    }}
```

```
{    "apiVersion": "3.2",    "context": "my context",    "method": "getHorizonStraighteningProperties",    "error": {        "code": 2215,        "message": "Horizon Straightening is not enabled."    }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningTilt"  "params": {    "horizonStraighteningTilt": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningTilt",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningTilt",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "setHorizonStraighteningStretchEnabled",    "params": {        "horizonStraighteningStretchEnabled": <boolean>    }}
```

```
{    "apiVersion": <string>,    "context": <string>,    "method": "setHorizonStraighteningStretchEnabled",    "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningStretchEnabled",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningStretchAmount"  "params": {    "horizonStraighteningStretchAmount": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningStretchAmount",  "data": {}}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "setHorizonStraighteningStretchAmount",  "error": {    "code": <number>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/stitching.cgi
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getFieldOfView"}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getFieldOfView",  "data": {    "hFoV": <number>,    "vFoV": <number>  }}
```

```
{  "apiVersion": <string>,  "context": <string>,  "method": "getFieldOfView",  "error": {    "code": <number>,    "message": <string>  }}
```

- API Discovery: id=stitching

- Request a list containing the API versions supported by your device.

- Parse the JSON response.

- Request a list containing supported stitching.cgi capabilities.

- Parse the JSON response, which should include a list containing the supported methods.

- Request the current value of the blending amount.

- Parse the JSON response, which should include the current value of the blending amount.

- Set a new blending amount value.

- Parse the JSON response.

- Request the current value of the parallax compensation distance.

- Parse the JSON response.

- Set the new value for the parallax compensation distance.

- Parse the JSON response.

- Pan sensor 2 by 0.05 degrees.

- Parse the JSON response.

- Tilt sensor 0 by 0.15 degrees.

- Parse the JSON response.

- Roll sensor 3 by -0.2 degrees.

- Parse the JSON response.

- Undo the current actions on sensor 0 with the restore method. This will restore the configuration back to factory default.

- Parse the JSON response.

- Use a supported version to enable horizon straightening.

- Parse the JSON response.

- Use a supported version to disable horizon straightening.

- Parse the JSON response.

- Use a supported version to retrieve horizon straightening.

- Parse the JSON response.

- Request the horizon straightening properties.

- Parse the JSON response.

- Set a new value for horizon straightening tilt.

- Parse the JSON response.

- Request the horizon straightening properties.

- Parse the JSON response.

- Use a supported version to enable horizon straightening stretch.

- Parse the JSON response.

- Use a supported version to disable horizon straightening stretch.

- Parse the JSON response.

- Request the horizon straightening properties.

- Parse the JSON response.

- Set a new value for horizon straightening stretch amount.

- Parse the JSON response.

- Use a supported version to retrieve supported horizontal and vertical field of view.

- Parse the JSON response.

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Admin
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getSupportedVersions | Retrieves API versions supported by your device. |
| getCapabilities | Retrieves stitching capabilities available on your device. |
| getBlendingAmount | Retrieves the current blending amount. |
| setBlendingAmount | Sets the blending amount. |
| getParallaxCompensationDistance | Retrieves the current distance to an object. |
| setParallaxCompensationDistance | Sets the distance to an object (in meters). |
| rotateAngle | Rotates a sensor ID. |
| restore | Restores a sensor ID to the factory default setting, i.e. removes all changes made with: setBlendingAmount setParallaxCompensationDistance rotateAngle |
| getHorizonStraighteningProperties | Retrieves the value of horizon straightening tilt, if horizon straightening stretch is enabled, and the stretch amount. |
| setHorizonStraighteningEnabled | Enables or disables horizon straightening. |
| getHorizonStraighteningEnabled | Retrieves if horizon straightening is enabled. |
| setHorizonStraighteningTilt | Sets horizon straightening tilt to make the straight horizon not in the middle of the image. |
| setHorizonStraighteningStretchEnabled | Enables or disables horizon straightening stretch. |
| setHorizonStraighteningStretchAmount | Sets the horizon straightening stretch amount. |
| getFieldOfView | Retrieves the value of horizontal and vertical field of view. |

| Parameter | Description |
| --- | --- |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getSupportedVersions"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getSupportedVersions" | The requested method. |
| data=<JSON object> | Container for the response specific parameter listed below. |
| apiVersions=<array> | The supported API versions in the format "Major.Minor", i.e. 1.4 or 2.1. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getSupportedVersions"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getCapabilities"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getCapabilities" | The requested method. |
| data=<JSON object> | Container for the response specific parameters listed below. |
| capabilities=<JSON object> | Container for the method support responses. |
| getBlendingAmount=<boolean> | Value can be either true or false depending on if the method is supported. |
| setBlendingAmount=<boolean> | Value can be either true or false depending on if the method is supported. |
| getParallaxCompensationDistance=<boolean> | Value can be either true or false depending on if the method is supported. |
| setParallaxCompensationDistance=<boolean> | Value can be either true or false depending on if the method is supported. |
| rotateAngle=<boolean> | Value can be either true or false depending on if the method is supported. |
| restore=<boolean> | Value can be either true or false depending on if the method is supported. |
| limits=<JSON object> | Container for the limits responses. |
| blendingAmountMin=<number> | The minimum blending amount value used for setBlendingAmount. |
| blendingAmountMax=<number> | The maximum blending amount value used for setBlendingAmount. |
| parallaxCompensationDistanceMin=<number> | The minimum parallax compensation distance value used for setParallaxCompensationDistance. |
| parallaxCompensationDistanceMax=<number> | The maximum parallax compensation distance value used for setParallaxCompensationDistance. |
| idMin=<number> | The minimum id value used for rotateAngle and restore. |
| idMax=<number> | The maximum id value used for rotateAngle and restore. |
| angleMin=<number> | The minimum angle value used for rotateAngle . |
| angleMax=<number> | The maximum angle value used for rotateAngle . |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getCapabilities"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getBlendingAmount"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getBlendingAmount" | The requested method. |
| data=<JSON object> | Container for the response specific parameters listed below. |
| blendingAmount=<number> | The returned value that specifies the current amount of blurriness around the image seams. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getBlendingAmount"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"setBlendingAmount"> | The requested method. |
| params=<JSON object> | Container for method specific parameters. |
| blendingAmount=<number> | Specifies the new value with a range between 0–100. The value can be entered as a <number> and when using decimals only the 15 first are used. 0 = sharp edges with no blurriness. 100 = maximum blurriness. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setBlendingAmount" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setBlendingAmount"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2204 | Failed to apply blending. |
| 2214 | Blending is disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getParallaxCompensationDistance"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getParallaxCompensationDistance" | The requested method. |
| data=<JSON object> | Container for the response specific parameter listed below. |
| parallaxCompensationDistance=<number> | The returned value where the alignment is currently being calculated, measured in meters. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getParallaxCompensationDistance"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"setParallaxCompensationDistance"> | The requested method. |
| params=<JSON object> | Container for the method specific parameter below. |
| parallaxCompensationDistance=<number> | Specifies the distance to the objects in meters. The distance is where the alignment between the seams will be calculated with a value between 1–50 entered as a <number>. Please note that only the first 15 decimals can be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setParallaxCompensationDistance" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setParallaxCompensationDistance"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"rotateAngle"> | The requested method. |
| params=<JSON object> | Container for the method specific parameter below. |
| id=<number> | Specifies what sensor image that should be rotated. Valid range is 0 to the number of sensors minus 1. |
| axis=<string> | Specifies which axis that should be rotated. Valid values are "pan", "tilt" and "roll". |
| angle=<number> | Specifies how many degrees the axis should be rotated for a chosen sensor id. The value can be entered as <number> with valid values between -180 to +180. Please note that if you are using decimals, only the first 15 are used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="rotateAngle" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"rotateAngle"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"restore"> | The requested method. |
| params=<JSON object> | Container for the method specific parameter below. |
| id=<number> | Specifies what sensor image that should be restored. Valid range is 0 to the number of sensors minus 1. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="restore" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"restore"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="setHorizonStraighteningEnabled" | The requested method. |
| params=<JSON object> | Container for method specific parameters. |
| horizonStraighteningEnabled=<boolean> | true: Enable horizon straightening. false: Disable horizon straightening. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setHorizonStraighteningEnabled" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setHorizonStraighteningEnabled"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2300 | Internal vipd error, could not complete request. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getHorizonStraighteningEnabled"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getHorizonStraighteningEnabled" | The requested method. |
| data=<JSON object> | Container for the response specific parameters listed below. |
| enabled=<boolean> | true: Horizon straightening is enabled. false: Horizon straightening is not enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getHorizonStraighteningEnabled"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getHorizonStraighteningProperties"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getHorizonStraighteningProperties" | The requested method. |
| data=<JSON object> | Container for the response specific parameters listed below. |
| horizonStraighteningTilt=<number> | The current value of the straight horizon position. |
| horizonStraighteningStretchEnabled=<boolean> | Whether the image is stretched over the black areas. |
| horizonStraighteningStretchAmount=<number> | The returned value shows how the stretching is performed. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getHorizonStraighteningProperties"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2215 | Horizon straightening is not enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"setHorizonStraighteningTilt"> | The requested method. |
| params=<JSON object> | Container for the method specific parameter below. |
| horizonStraighteningTilt=<number> | Specifies the position of the straight horizon in angles relative to the middle of the image. Please note that only the first 15 decimals can be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setHorizonStraighteningTilt" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setHorizonStraighteningTilt"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2215 | Horizon straightening is not enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method="setHorizonStraighteningStretchEnabled" | The requested method. |
| params=<JSON object> | Container for method specific parameters. |
| horizonStraighteningStretchEnabled=<boolean> | true: Enable horizon straightening stretch. false: Disable horizon straightening stretch. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setHorizonStraighteningStretchEnabled" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setHorizonStraighteningStretchEnabled"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2215 | Horizon straightening is not enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"setHorizonStraighteningStretchAmount"> | The requested method. |
| params=<JSON object> | Container for method specific parameters. |
| horizonStraighteningStretchAmount=<number> | Specifies the new value with a range between 0–100. 0 = Stretch images non-linearly. 100 = Stretch images linearly. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="setHorizonStraighteningStretchAmount" | The requested method. |
| data=<JSON object> | Container for the response. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"setHorizonStraighteningStretchAmount"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 2215 | Horizon straightening is not enabled. |
| 2216 | Horizon Straightening stretch is disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version that should be used. |
| context=<string> | The context set by the user and echoed in the response (optional). |
| method=<"getFieldOfView"> | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method="getFieldOfView" | The requested method. |
| data=<JSON object> | Container for the response specific parameters listed below. |
| hFoV=<number> | The supported horizontal field of view. |
| vFoV=<number> | The supported vertical field of view. |

| Parameter | Description |
| --- | --- |
| apiVersion=<string> | The API version returned from the request. |
| context=<string> | The context set by the user in the request (optional). |
| method=<"getFieldOfView"> | The requested method. |
| error.code=<integer error code> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 1000 | Invalid parameter value. |
| 2000 | Failed to allocate memory. |
| 2004 | Method not supported. |
| 2200 | Unknown error has occurred. |
| 2201 | Failed to init transformation tables. |
| 2202 | Failed to generate table with given parameters. |
| 2203 | Failed to apply table with given parameters. |
| 2205 | Failed read calibration file. |
| 2206 | Calibration file is missing. |
| 2207 | Failed to unlink calibration file. |
| 2208 | Unsupported stitching mode. |
| 2209 | Failed to read configuration file. |
| 2210 | Failed to save configuration file. |
| 2211 | Failed to parse configuration file. |
| 2212 | Method is not allowed in disabled mode. |
| 2213 | Operation is not supported. |
| 2300 | Internal vipd error, could not complete request. |
| 4001 | Mandatory input parameters was not found in the input. |
| 4002 | The type of a provided JSON parameter was incorrect. |
| 8000 | Internal error, could not complete request. |
| 8002 | Generic error. |

