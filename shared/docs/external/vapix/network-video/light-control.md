# Light control

**Source:** https://developer.axis.com/vapix/network-video/light-control/
**Last Updated:** Aug 18, 2025

---

# Light control

## Light control API​

### Overview​

#### Identification​

#### Obsoletes​

### Common examples​

#### Get supported versions​

#### Get service capabilities​

#### Get light information​

#### Activate light​

#### Deactivate light​

#### Enable light​

#### Disable light​

#### Get light status​

#### Set automatic intensity mode​

#### Get valid intensity​

#### Set manual intensity​

#### Get manual intensity​

#### Set individual intensity​

#### Get individual intensity​

#### Get current intensity​

#### Set automatic angle of illumination mode​

#### Get valid angle of illumination​

#### Set manual angle of illumination​

#### Get manual angle of illumination​

#### Get current angle of illumination​

#### Set light synchronize day night mode​

#### Get light synchronize day night mode​

#### Get valid infrared wavelengths​

#### Set infrared wavelength​

#### Get infrared wavelength​

### API specification​

#### getSupportedVersions​

#### getServiceCapabilities​

#### getLightInformation​

#### activateLight​

#### deactivateLight​

#### enableLight​

#### disableLight​

#### getLightStatus​

#### setAutomaticIntensityMode​

#### getValidIntensity​

#### setManualIntensity​

#### getManualIntensity​

#### setIndividualIntensity​

#### getIndividualIntensity​

#### getCurrentIntensity​

#### setAutomaticAngleOfIlluminationMode​

#### getValidAngleOfIllumination​

#### setManualAngleOfIllumination​

#### getManualAngleOfIllumination​

#### getCurrentAngleOfIllumination​

#### setLightSynchronizeDayNightMode​

#### getLightSynchronizeDayNightMode​

#### getValidIRWavelengths​

#### setIRWavelength​

#### getIRWavelength​

#### General error codes​

## Light control service API​

### Prerequisites​

#### Identification​

#### API specification​

### Using the light control service​

#### Identification​

#### Light information​

#### Enable and activate the light​

#### Light intensity​

#### Angle of illumination​

#### Synchronize with day/night mode​

The VAPIX® Light control API makes it possible to control the behavior and functionality of IR and White light LEDs in the Axis devices. This is done through JSON commands, and the API also have support for the On-screen controls API in order to control the lights directly, something that was not possible with the older Light control service API.

The API is built around the lightcontrol.cgi, which makes it possible to query for one or several light devices and their status, controlling their light intensity and focus, and turning them on/off.

The CGI consists of the following methods:

A successful response from the getServiceCapabilities method will list supported capabilities of the light controller service. This is followed by an array that contains the supported capabilities for each LEDgroup. It is recommended to use this array, as the global capabilities have been deprecated.

Use this example to get a list of API versions that are supported on the device.

Send a request to receive a list of the supported API versions:

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See getSupportedVersions for further instructions.

Use this example to list the capabilities of the light controller that is supported on the device.

Please note that the global capabilities have been deprecated and the capabilities array should be used instead.

Send a request to receive a list showing the light service capabilities.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See getServiceCapabilities for further instructions.

Use this example to list the light control information on the device.

Send a request to receive a list of lights and their configuration and status.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See getLightInformation for further instructions.

Use this example to turn on the light of a specific Light ID.

Send a request to activate the lights of a given Light ID. Please note that a single Light ID can still contain several LEDs and/or lamps.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See activateLight for further instructions.

Use this example to turn off the lights of a specific Light ID.

Send a request to deactivate the lights of a given Light ID.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See deactivateLight for further instructions.

Use this example to enable the lights of a specific Light ID. Note that a disabled light can not be turned on.

Send a request to enable the lights of a given Light ID.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See enableLight for further instructions.

Use this example to disable the light of a specific Light ID. Note that a disabled light can not be turned on.

Send a request to disable the lights of a given Light ID.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See disableLight for further instructions.

Use this example to get the status of a specified Light ID.

Send a request to receive the status of the lights of a given Light ID.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See getLightStatus for further instructions.

Use this example to enable the automatic light intensity controller.

Send a request to change the setting of the automatic intensity mode.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See setAutomaticIntensityMode for further instructions.

Use this example to get a list of valid light intensity ranges. Values within this range can be used to change the intensity of the light when using the setManualIntensity method.

Send a request to receive a list of supported intensity ranges.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See getValidIntensity for further instructions.

Use this example to set the manual intensity of a light.

Send a request to receive the manual intensity level of a light.

JSON input parameters

Parse the JSON response.

a) Successful response example:

b) Failed response example:

See setManualIntensity for further instructions.

Use this example to get the manually configured intensity from the previous example.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getManualIntensity for further instructions.

Use this example to manually change the intensity of an individual LED light.

JSON input parameters

a) Successful response example:

b) Failed response example:

See setIndividualIntensity for further instructions.

Use this example to get the manually configured intensity of an individual LED light.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getIndividualIntensity for further instructions.

Use this example to get the current intensity of a light.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getCurrentIntensity for further instructions.

Use this example to automatically control the angle of illumination.

JSON input parameters

a) Successful response example:

b) Failed response example:

See setAutomaticAngleOfIlluminationMode for further instructions.

Use this example to get a list of supported angle of illumination ranges for a light.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getValidAngleOfIllumination for further instructions.

Use this example to manually control the angle of illumination.

JSON input parameters

a) Successful response example:

b) Failed response example:

See setManualAngleOfIllumination for further instructions.

Use this example to get the current configured manual angle of illumination.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getManualAngleOfIllumination for further instructions.

Use this example to get the current angle of illumination.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getCurrentAngleOfIllumination for further instructions.

Use this example to turn on automatic day/night synchronization mode.

JSON input parameters

a) Successful response example:

b) Failed response example:

See setLightSynchronizeDayNightMode for further instructions.

Use this example to check if the automatic synchronization for the day/night mode is enabled.

JSON input parameters

a) Successful response example:

b) Failed response exampled:

See getLightSynchronizeDayNightMode for further instructions.

Use this example to retrieve a list of valid infrared wavelengths. The wavelengths themselves can be changed with the setIRWavelength method.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getValidIRWavelengths for further instructions.

Use this example to set the infrared wavelength. Changing the wavelength of the will give the light different properties such as different illumination ranges and red glow emissions from the light source.

JSON input parameters

a) Successful response example:

b) Failed response example:

See setIRWavelength for further instructions.

Use this example to retrieve the currently configured infrared wavelength.

JSON input parameters

a) Successful response example:

b) Failed response example:

See getIRWavelength for further instructions.

A CGI method used to retrieve supported API versions. The returning list consists of the supported major versions as well as the highest supported minor versions. Please note that the version is for the API as a whole, i.e. for all methods in the CGI.

Request

Request body syntax

getSupportedVersions request parameters

Return value - Success

Returns an array containing the supported API versions.

Response body syntax

getSupportedVersions response parameters

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

A CGI method that lists the light service capabilities.

Please note that the global capabilities have been deprecated and the capabilities array should be used instead.

Request

Request body syntax

getServiceCapabilities request parameters

Return value - Success

Response body syntax

getServiceCapabilities response parameters

Return value - Failure

Response body syntax

Error codes

There are no specific error codes for this method. General errors are listed in General error codes.

A CGI method that lists the light control information.

Request

Request body syntax

getLightInformation request parameters

Return value - Success

Returns an array of lights in the device and their configurations.

Response body syntax

getLightInformation response parameters

Return value - Failure

Response body syntax

Error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that activates the light.

Request

Request body syntax

activateLight request parameters

Return value - Success

Response body syntax

activateLight response parameters

Return value - Failure

Response body syntax

Error codes

activateLight error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that deactivates the light.

Request

Request body syntax

deactivateLight request parameters

Return value - Success

Response body syntax

deactivateLight response parameters

Return value - Failure

Response body syntax

Error codes

deactivateLight error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that enables the light functionality.

Request

Request body syntax

enableLight request parameters

Return value - Success

Response body syntax

enableLight response parameters

Return value - Failure

Response body syntax

Error codes

enableLight error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that disables the light functionality.

Request

Request body syntax

disableLight request parameters

Return value - Success

Response body syntax

disableLight response parameters

Return value - Failure

Response body syntax

Error codes

disableLight error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that showcases the light status of a given Light ID.

Request

Request body syntax

getLightStatus request parameters

Return value - Success

Response body syntax

getLightStatus response parameters

Return value - Failure

Response body syntax

Error codes

getLightStatus error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that enables the automatic light intensity control.

Request

Request body syntax

setAutomaticIntensityMode request parameters

Return value - Success

Response body syntax

setAutomaticIntensityMode response parameters

Return value - Failure

Response body syntax

Error codes

setAutomaticIntensityMode error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that lists the valid light intensity values.

Request

Request body syntax

getValidIntensity request parameters

Return value - Success

Response body syntax

getValidIntensity response parameters

Return value - Failure

Response body syntax

Error codes

getValidIntensity error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that sets the intensity manually.

Request

Request body syntax

setManualIntensity request parameters

Return value - Success

Response body syntax

setManualIntensity response parameters

Return value - Failure

Response body syntax

Error codes

setManualIntensity error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that gets the intensity that was sent in the setManualIntensity request.

Request

Request body syntax

getManualIntensity request parameters

Return value - Success

Response body syntax

getManualIntensity response parameters

Return value - Failure

Response body syntax

Error codes

getManualIntensity error codes

This list contains the error codes for this particular method. For general errors, see General error codes.

A CGI method that manually sets the intensity of an individual LED light.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that sends the intensity in the setIndividualIntensity request.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that gets the current intensity.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that controls the automatic angle of illumination.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that lists the valid angle of the illumination values.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that sets the manual angle of illumination.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that gets the angle of illumination sent by the setManualAngleOfIllumination request.

Request

Request body syntax

getManualAngleOfIllumination request parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that gets the current angle of illumination.

Request

Request body syntax

getCurrentAngleOfIllumination request parameters

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that let you enable or disable the automatic day/night synchronization mode.

Request

Request body syntax

setLightSynchronizeDayNightMode

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that checks if the automatic synchronization with the day/night mode is enabled.

Request

Request body syntax

getLightSynchronizeDayNightMode

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that returns a list containing the infrared wavelengths.

Request body syntax

getValidIRWavelength

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that sets the infrared wavelength.

Request

Request body syntax

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

A CGI method that returns the current wavelength setting.

Request

Request body syntax

getIRWavelength

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

General errors are listed in General error codes.

The following table lists the general errors that can occur for any CGI method, while errors that are specific for a method are listed under their specific API descriptions.

For a newer version on how to use light control, see Light control API.

VAPIX® Light control service API enables applications and users to control built-in lights. Lights can be activated and inactivated using this API or using action rules. The API is a web services API.

A built-in light is an illuminator which is integrated in the Axis product. The illuminator improves the camera’s short-range visibility, in particular in low-light conditions, and can for example be an infrared LED (light emitting diode) or a white LED. In the API, a "light" is a single illuminator or a group of illuminators. Each light is identified by a unique Light ID.

Supported functionality:

Use VAPIX® Entry service API to check if the API is supported.

The API specification is available as an WSDL file at http://www.axis.com/vapix/ws/LightService.wsdl

The example outlined in this section shows how to check if the light control service is supported and how to create a light service client.

To check if the Axis product supports the Light control service API, we use GetServices from VAPIX® Entry service API.

We start by defining the IP address, user name and password for the Axis product and the namespace of the light control service. Then, we use CreateEntryServiceClient to create an entry service client.

The function CreateEntryServiceClient is defined in the sample code and is not part of the API. For more information about the entry service, see the VAPIX® Entry service API documentation.

Next, we use the entry service client and GetServices to get a list of all services in the Axis product. We search the list to check if the light control service is included.

If the service is found, we use CreateLightServiceClient() to create a light client. This function is not part of the API and is created in the same way as CreateEntryServiceClient.

The following functions can be used to retrieve information about the light:

The following functions can be used to retrieve information about the light:

GetServiceCapabilities — list the supported light control service capabilities.

GetLightInformation — list light information such as the Light ID, type of light, if the light is enabled and error information

GetLightStatus — check if the light is active or inactive

This example shows how to list the capabilities provided by the light control service.

To list the service capabilities, we use the light service client myLightService created in section Identification and GetServiceCapabilities.

This example shows how to list information about the light and how to retrieve the Light ID. We use the light service client myLightService and the GetLightInformation request.

GetLightInformation returns a list of light information for all lights. From the list, we can retrieve information about a particular light. Here, we will retrieve the Light ID of the first light.

In this example, we use the light service client myLightService, the lightID and the GetLightStatus request to check if the light is lit.

To allow users and clients to control the light, the light must first be enabled. Activating turns the light on.

For products with an IR cut filter, an IR light cannot be activated if the IR cut filter is in "On" mode (that is, when the IR cut filter is blocking IR light).

Supported operations:

Supported operations:

ActivateLight — turn on the light

DeactivateLight — turn off the light

EnableLight — enable the light control functionality

DisableLight — disable the light control functionality. This prevents users and clients from turning on the light.

This example shows to how check if the light is enabled, enable the light and turn it on.

In the example, we use the light service client myLightService created in section Identification and lightInformationList with information about all lights from section Light information.

The light intensity can be controlled automatically or set manually. Due to power and heat constraints, the actual light intensity might be lower than the set value.

Support for automatic mode is product dependent. Functionality may differ depending on product model.

Supported operations:

Supported operations:

SetAutomaticIntensityMode — enable automatic light intensity control

SetManualIntensity — set the intensity manually

GetManualIntensity — get the intensity sent in the SetManualIntensity request

GetCurrentIntensity — get the current light intensity

GetValidIntensity — list valid light intensity values

This example shows how to list valid light intensity values.

In the example, we use the light service client myLightService created in section Identification and lightInformationList with information about all lights from section Light information.

The angle of illumination defines the width of the light beam. A small angle of illumination gives a narrow beam, a large angle of illumination gives a wide beam.

The angle of illumination can be controlled automatically or set manually. Automatic mode can be used if the product supports absolute zoom (parameter PTZ.Support.S#.AbsoluteZoom=true). In automatic mode, the angle of illumination is set according to the camera’s angle of view and will be adjusted when the angle of view changes.

Supported operations:

Supported operations:

SetAutomaticAngleOfIlluminationMode — control the angle of illumination automatically

SetManualAngleOfIllumination — set the angle of illumination manually

GetManualAngleOfIllumination — get the angle of illumination sent in the SetManualAngleOfIllumination request

GetCurrentAngleOfIllumination — get the current angle of illumination

GetValidAngleOfIllumination — list valid angle of illumination values

This example shows how to get the current angle of illumination.

In the example, we use the light service client myLightService created in section Identification and lightInformationList with information about all lights from section Light information.

This example shows how to turn off the automatic mode and set the angle to 50.

For products with day/night mode capabilities, the light can be synchronized with day/night mode so that the light is automatically activated in night mode. For products with an IR cut filter, an IR light can be synchronized with day/night mode if the IR cut filter is in "Auto" or "Off" mode.

Supported operations:

Supported operations:

GetLightSynchronizeDayNightMode — check if synchronization with day/night mode is enabled.

SetLightSynchronizeDayNightMode — enable or disable automatic synchronization with day/night mode

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "context": "my context",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities"}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities",    "data": {        "automaticIntensitySupport": true,        "manualIntensitySupport": true,        "individualIntensitySupport": false,        "getCurrentIntensitySupport": true,        "manualAngleOfIlluminationSupport": false,        "automaticAngleOfIlluminationSupport": false,        "dayNightSynchronizeSupport": true,        "multiIRWaveLengthSupport": true,        "capabilities": [            {                "lightID": id,                "automaticIntensitySupport": true,                "manualIntensitySupport": true,                "individualIntensitySupport": false,                "getCurrentIntensitySupport": true,                "manualAngleOfIlluminationSupport": false,                "automaticAngleOfIlluminationSupport": false,                "dayNightSynchronizeSupport": true,                "multiIRWaveLengthSupport": true            },            {                "lightID": id,                "automaticIntensitySupport": true,                "manualIntensitySupport": true,                "individualIntensitySupport": false,                "getCurrentIntensitySupport": true,                "manualAngleOfIlluminationSupport": false,                "automaticAngleOfIlluminationSupport": false,                "dayNightSynchronizeSupport": true,                "multiIRWaveLengthSupport": true            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities",    "error": {        "code": 7000,        "message": "The requested API version is not supported by this implementation."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "data": {        "items": [            {                "lightID": "led0",                "lightType": "IR",                "enabled": true,                "synchronizeDayNightMode": true,                "lightState": false,                "automaticIntensityMode": false,                "automaticAngleOfIlluminationMode": false,                "nrOfLEDs": 1,                "error": false,                "errorInfo": ""            },            {                "lightID": "led1",                "lightType": "IR",                "enabled": true,                "synchronizeDayNightMode": false,                "lightState": false,                "automaticIntensityMode": false,                "automaticAngleOfIlluminationMode": false,                "nrOfLEDs": 2,                "error": false,                "errorInfo": ""            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "error": {        "code": 2000,        "message": "Failed to allocate memory for request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "data": {        "status": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "params": {        "lightID": "led0",        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "data": {        "ranges": [            {                "low": 0,                "high": 50            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "params": {        "lightID": "led0",        "intensity": 50    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualIntensity",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualIntensity",    "data": {        "intensity": 50    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIndividualIntensity",    "params": {        "lightID": "led0",        "LEDID": 1,        "intensity": 100    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIndividualIntensity",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setIndividualIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIndividualIntensity",    "params": {        "lightID": "led0",        "LEDID": 2    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIndividualIntensity",    "data": {        "intensity": 100    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getIndividualIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentIntensity",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentIntensity",    "data": {        "intesity": 100    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentIntensity",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticAngleOfIlluminationMode",    "params": {        "lightID": "led0",        "enabled": true    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticAngleOfIlluminationMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticAngleOfIlluminationMode",    "error": {        "code": 1001,        "message": "Method call not supported by the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidAngleOfIllumination",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidAngleOfIllumination",    "data": {        "ranges": [            {                "low": 10,                "high": 30            },            {                "low": 20,                "high": 50            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidAngleOfIllumination",    "error": {        "code": 1001,        "message": "Method call not supported by the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualAngleOfIllumination",    "params": {        "lightID": "led0",        "angleOfIllumination": 30    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualAngleOfIllumination",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualAngleOfIllumination",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualAngleOfIllumination",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualAngleOfIllumination",    "data": {        "angleOfIllumination": 30    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getManualAngleOfIllumination",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentAngleOfIllumination",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentAngleOfIllumination",    "data": {        "angleOfIllumination": 20    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getCurrentAngleOfIllumination",    "error": {        "code": 1001,        "message": "Method call not supported by the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setLightSynchronizationDayNightMode",    "params": {        "lightID": "led0",        "enabled": false    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setLightSynchronizeDayNightMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "setLightSynchronizeDayNightMode",    "error": {        "code": 1001,        "message": "Method call not supported by the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightSynchronizeDayNightMode",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightSynchronizeDayNightMode",    "data": {        "enabled": false    }}
```

```
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightSynchronizeDayNightMode",    "error": {        "code": 1001,        "message": "Method call not supported by the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getValidIRWavelengths",    "params": {        "lightID": "led0"    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getValidIRWavelengths",    "data": {        "wavelength": ["850nm", "940nm"]    }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getValidIRWavelengths",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": "1.2",  "context": "my context",  "method": "setIRWavelength",  "params": {    "lightID": "led0"    "IRWavelength": wavelength  }}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "setIRWavelength",    "data": {}}
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "setIRWavelength",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{    "apiVersion": "1.2",    "context": "my context",    "method": "getIRWavelength",    "params": {        "lightID": "led0"    }}
```

```
{  "apiVersion": "1.2",  "context": "my context",  "method": "getIRWavelength",  "data": {    "IRWavelength": wavelength  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "my context",  "method": getIRWavelength",  "error": {    "code": 1002,    "message": "Provided lightID parameter is not valid for the device."  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "params": {}}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getServiceCapabilities",  "params": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getServiceCapabilities",  "data": {    "automaticIntensitySupport": true | false,    "manualIntensitySupport": true | false,    "individualIntensitySupport": true | false,    "getCurrentIntensitySupport": true | false,    "manualAngleOfIlluminationSupport": true | false,    "automaticAngleOfIlluminationSupport": true | false,    "dayNightSynchronizeSupport": true | false,    "multiIRWaveLengthSupport": true | false,    "capabilities": [      {        "lightID": id,        "automaticIntensitySupport": true | false,        "manualIntensitySupport": true | false,        "individualIntensitySupport": true | false,        "getCurrentIntensitySupport": true | false,        "manualAngleOfIlluminationSupport": true | false,        "automaticAngleOfIlluminationSupport": true | false,        "dayNightSynchronizeSupport": true | false,        "multiIRWaveLengthSupport": true | false      },      {        "lightID": id,        "automaticIntensitySupport": true | false,        "manualIntensitySupport": true | false,        "individualIntensitySupport": true | false,        "getCurrentIntensitySupport": true | false,        "manualAngleOfIlluminationSupport": true | false,        "automaticAngleOfIlluminationSupport": true | false,        "dayNightSynchronizeSupport": true | false,        "multiIRWaveLengthSupport": true | false      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getLightInformation",  "params": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getLightInformation",  "data": {    "items": [      {        "lightID": "id",        "lightType": "type",        "enabled": true | false,        "synchronizeDayNightMode": true | false,        "lightState": true | false,        "automaticIntensityMode": true | false,        "automaticAngleOfIlluminationMode": true | false,        "nrOfLEDs": "numberOfLEDs",        "error": true | false,        "errorInfo": "Error message"      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "activateLight",  "params": {    "lightID": <string>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "activateLight",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "deactivateLight",  "params": {    "lightID": <string>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "deactivateLight",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "enableLight",  "params": {    "lightID": <string>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "enableLight",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "disableLight",  "params": {    "lightID": <string>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "disableLight",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>  "context": <string>,  "method": "getLightStatus",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getLightStatus",  "data": {    "status": true | false  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setAutomaticIntensityMode",  "params": {    "lightID": <string>,    "enabled": <boolean>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setAutomaticIntensityMode",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getValidIntensity",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getValidIntensity",  "data": {    "ranges": [      {        "low": lowerLimit,        "high": upperLimit      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setManualIntensity",  "params": {    "lightID": <string>,    "intensity": <integer>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setManualIntensity",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getManualIntensity",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getManualIntensity",  "data": {    "intensity": manualIntensity  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIndividualIntensity",  "params": {    "lightID": <string>,    "LEDID": <integer>,    "intensity": <integer>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setIndividualIntensity",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getIndividualIntensity",  "params": {    "lightID": <string>,    "LEDID": <integer>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getIndividualIntensity",  "data": {    "intensity": individualIntensity  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getCurrentIntensity",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCurrentIntensity",  "data": {    "intensity": currentIntensity  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setAutomaticAngleOfIlluminationMode",  "params": {    "lightID": <string>,    "enabled": <boolean>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setAutomaticAngleOfIlluminationMode",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getValidAngleOfIllumination",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getValidAngleOfIllumination",  "data": {    "ranges": [      {        "low": lowerLimit,        "high": upperLimit      }    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setManualAngleOfIllumination",  "params": {    "lightID": <string>,    "angleOfIllumination": <integer>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setAutomaticAngleOfIlluminationMode",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getManualAngleOfIllumination",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getManualAngleOfIllumination",  "data": {    "angleOfIllumination": angle  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getCurrentAngleOfIllumination",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getCurrentAngleOfIllumination",  "data": {    "angleOfIllumination": angle  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setLightSynchronizeDayNightMode",  "params": {    "lightID": <string>,    "enabled": <boolean>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setLightSynchronizeDayNightMode",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getLightSynchronizeDayNightMode",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getLightSynchronizeDayNightMode",  "data": {    "synchronize": true | false  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getValidIRWavelengths",  "params": {    "lightID": <string>,  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getValidIRWavelengths",  "data": {    "settings": [      wavelength,      ...    ]  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIRWavelength",  "params": {    "lightID": <string>,    "IRWavelength": <string>  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "setIRWavelength",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
http://myserver/axis-cgi/lightcontrol.cgi
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getIRWavelength",  "params": {    "lightID": <string>  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getIRWavelength",  "data": {    "IRWavelength": wavelength  }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "The called method",  "error": {    "code": integer error code,    "message": "Error message"  }}
```

```
/* Define the address, user name and password for the Axis product. <ip-address> is an IP address or host name.*/string address="<ip-address>";string username="<user name>";string password="<password>";/* Define the namespace of the light control service.*/string lightTargetNamespace = "http://www.axis.com/vapix/ws/light";/* Create an Entry Service client.*/EntryClient myEntryService = CreateEntryServiceClient(address, username, password);
```

```
/* Get a list of all services.*/Service[] serviceList = myEntryService.GetServices(false);/* Check if light control service is supported.*/for (i = 0; i < serviceList.count; i++){  if (serviceList[i].Namespace == lightTargetNamespace)  {    /* Get the service address.*/    string lightXaddr = serviceList[i].Xaddr;    /* Create a light client.*/     LightClient myLightService = CreateLightServiceClient(lightXaddr, username, password);    break;  }}
```

```
/* Get the service capabilities.*/Capabilities LightCapabilities = myLightService.GetServiceCapabilities();
```

```
/* Get a list of light information for all lights.*/LightInformationList[] lightInformationList = myLightService.GetLightInformation();/* Get the Light ID for the first light.*/LightInformation lightInformation = lightInformationList[0];string lightID = lightInformation.LightID;
```

```
/* Check if the light is lit.*/if (myLightService.GetLightStatus(lightID)){  Console.WriteLine("The light is lit");}else{  Console.WriteLine("The light is not lit");}
```

```
/* Get the Light ID.*/LightInformation lightInformation = lightInformationList[0];string lightID = lightInformation.LightID;/* Check if the light is enabled.*/if (!lightInformation.Enabled){  /* Enable the light.*/  myLightService.EnableLight(lightID);  /* Turn on the light.*/  myLightService.ActivateLight(lightID);}/* Inform user that light is lit.*/if (myLightService.GetLightStatus(lightID)){  Console.WriteLine("The light is lit");}
```

```
/* Get the Light ID.*/LightInformation lightInformation = lightInformationList[0];string lightID = lightInformation.LightID;/* Get valid light intensities.*/IntRangeList[] validIntensityList = myLightService.GetValidIntensity(lightID);/* Print the valid intensity range.*/for (i = 0; i < validIntensityList.Count; i++){  IntRange validRange = validIntensityList[i];  Console.WriteLine("Valid Intensities are {0} - {1}", validRange.Low, validRange.High);}
```

```
/* Get the Light ID.*/LightInformation lightInformation = lightInformationList[0];string lightID = lightInformation.LightID;/* Get and print the current angle of illumination.*/int angleOfIllumination = myLightService.GetCurrentAngleOfIllumination(lightID);Console.WriteLine("Current angle of illumination: {0} ", angleOfIllumination);
```

```
/* Turn off automatic angle of illumination.*/myLightService.SetAutomaticAngleOfIlluminationMode(lightID, false);/* Set the angle of illumination to 50.*/myLightService.SetManualAngleOfIllumination(lightID, 50);/* Get and print the current angle of illumination.*/int angleOfIllumination = myLightService.GetCurrentAngleOfIllumination(lightID);Console.WriteLine("Current angle of illumination: {0} ", angleOfIllumination);
```

- Property: Properties.API.HTTP.Version=3
- Property: Properties.LightControl.LightControl2=yes
- AXIS OS: 7.40 and later
- API Discovery: id=light-control

- Send a request to receive a list of the supported API versions:
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "context": "my context",    "method": "getSupportedVersions"}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.0", "2.1"]    }}
b) Failed response example:
{    "apiVersion": "2.1",    "context": "my context",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error, could not complete request."    }}

- Send a request to receive a list showing the light service capabilities.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities"}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities",    "data": {        "automaticIntensitySupport": true,        "manualIntensitySupport": true,        "individualIntensitySupport": false,        "getCurrentIntensitySupport": true,        "manualAngleOfIlluminationSupport": false,        "automaticAngleOfIlluminationSupport": false,        "dayNightSynchronizeSupport": true,        "multiIRWaveLengthSupport": true,        "capabilities": [            {                "lightID": id,                "automaticIntensitySupport": true,                "manualIntensitySupport": true,                "individualIntensitySupport": false,                "getCurrentIntensitySupport": true,                "manualAngleOfIlluminationSupport": false,                "automaticAngleOfIlluminationSupport": false,                "dayNightSynchronizeSupport": true,                "multiIRWaveLengthSupport": true            },            {                "lightID": id,                "automaticIntensitySupport": true,                "manualIntensitySupport": true,                "individualIntensitySupport": false,                "getCurrentIntensitySupport": true,                "manualAngleOfIlluminationSupport": false,                "automaticAngleOfIlluminationSupport": false,                "dayNightSynchronizeSupport": true,                "multiIRWaveLengthSupport": true            }        ]    }}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getServiceCapabilities",    "error": {        "code": 7000,        "message": "The requested API version is not supported by this implementation."    }}

- Send a request to receive a list of lights and their configuration and status.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "params": {}}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "data": {        "items": [            {                "lightID": "led0",                "lightType": "IR",                "enabled": true,                "synchronizeDayNightMode": true,                "lightState": false,                "automaticIntensityMode": false,                "automaticAngleOfIlluminationMode": false,                "nrOfLEDs": 1,                "error": false,                "errorInfo": ""            },            {                "lightID": "led1",                "lightType": "IR",                "enabled": true,                "synchronizeDayNightMode": false,                "lightState": false,                "automaticIntensityMode": false,                "automaticAngleOfIlluminationMode": false,                "nrOfLEDs": 2,                "error": false,                "errorInfo": ""            }        ]    }}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightInformation",    "error": {        "code": 2000,        "message": "Failed to allocate memory for request."    }}

- Send a request to activate the lights of a given Light ID. Please note that a single Light ID can still contain several LEDs and/or lamps.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "activateLight",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}

- Send a request to deactivate the lights of a given Light ID.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "deactivateLight",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}

- Send a request to enable the lights of a given Light ID.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "enableLight",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}

- Send a request to disable the lights of a given Light ID.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "disableLight",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}

- Send a request to receive the status of the lights of a given Light ID.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "data": {        "status": true    }}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getLightStatus",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}

- Send a request to change the setting of the automatic intensity mode.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "params": {        "lightID": "led0",        "enabled": true    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "setAutomaticIntensityMode",    "error": {        "code": 1005,        "message": "Hardware failure, could not complete request."    }}

- Send a request to receive a list of supported intensity ranges.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "params": {        "lightID": "led0"    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "data": {        "ranges": [            {                "low": 0,                "high": 50            }        ]    }}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "getValidIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}

- Send a request to receive the manual intensity level of a light.
http://myserver/axis-cgi/lightcontrol.cgi
JSON input parameters
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "params": {        "lightID": "led0",        "intensity": 50    }}
- Parse the JSON response.
a) Successful response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "data": {}}
b) Failed response example:
{    "apiVersion": "1.0",    "context": "my context",    "method": "setManualIntensity",    "error": {        "code": 1002,        "message": "Provided lightID parameter is not valid for the device."    }}

- Send a request to receive a response with the currently configured manual intensity level of a light.

- Parse the JSON response.

- Send a request to receive a manual intensity level for either a single or group of LED lights.

- Parse the JSON response.

- Send a request to receive the current intensity level for either a single or a group of LED lights.

- Parse the JSON response.

- Send a request to receive the current intensity of a light.

- Parse the JSON response.

- Send a request to receive a change of the automatic angle of illumination mode for a light.

- Parse the JSON response.

- Send a request to receive a list of valid ranges for angle of illumination for a light.

- Parse the JSON response.

- Send a request to make a change of the manual angle of illumination for a light.

- Parse the JSON response.

- Send a request to receive the current configured manual angle of illumination mode for a light.

- Parse the JSON response.

- Send a request to receive the current angle of illumination for a light.

- Parse the JSON response.

- Send a request to make a change to the automatic synchronization and day/night mode for a light.

- Parse the JSON response.

- Send a request to make a change to the automatic synchronization and day/night mode for a light.

- Parse the JSON response.

- Request a list of supported infrared wavelengths.

- Parse the JSON response.

- Request a change of the infrared wavelength.

- Parse the JSON response.

- Request a response with the currently configured infrared wavelength.

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Retrieve information about the light
- Enable and activate light. Enabling allows clients and users to control the light. Activating turns the light on.
- Synchronize with day/night mode. When synchronized, the light is automatically activated in night mode.
- Control light intensity
- Control angle of illumination. The angle of illumination (the width of the light beam) can be set to be adjusted automatically according to the camera’s angle of view.

- Namespace: http://www.axis.com/vapix/ws/light
- AXIS OS: 5.40
- Product category: Products with built-in illuminators, for example infrared LEDs or white LEDs.

- The following functions can be used to retrieve information about the light:
GetServiceCapabilities — list the supported light control service capabilities.
- GetLightInformation — list light information such as the Light ID, type of light, if the light is enabled and error information
- GetLightStatus — check if the light is active or inactive

- Supported operations:
ActivateLight — turn on the light
- DeactivateLight — turn off the light
- EnableLight — enable the light control functionality
- DisableLight — disable the light control functionality. This prevents users and clients from turning on the light.

- Supported operations:
SetAutomaticIntensityMode — enable automatic light intensity control
- SetManualIntensity — set the intensity manually
- GetManualIntensity — get the intensity sent in the SetManualIntensity request
- GetCurrentIntensity — get the current light intensity
- GetValidIntensity — list valid light intensity values

- Supported operations:
SetAutomaticAngleOfIlluminationMode — control the angle of illumination automatically
- SetManualAngleOfIllumination — set the angle of illumination manually
- GetManualAngleOfIllumination — get the angle of illumination sent in the SetManualAngleOfIllumination request
- GetCurrentAngleOfIllumination — get the current angle of illumination
- GetValidAngleOfIllumination — list valid angle of illumination values

- Supported operations:
GetLightSynchronizeDayNightMode — check if synchronization with day/night mode is enabled.
- SetLightSynchronizeDayNightMode — enable or disable automatic synchronization with day/night mode

| Method | Description |
| --- | --- |
| getSupportedVersions | Lists the API versions that are supported by the CGI. |
| getServiceCapabilities | Lists the capabilities of the light control. |
| getLightInformation | Lists the light control information. |
| activateLight | Activates the light. |
| deactivateLight | Deactivates the light. |
| enableLight | Enables the light functionality on the device. |
| disableLight | Disables the light functionality on the device. |
| getLightStatus | Retrieves the light status from a given Light ID. |
| setAutomaticIntensityMode | Enables the automatic light intensity control. |
| getValidIntensity | Lists the valid light intensity values. |
| setManualIntensity | Manually sets the intensity. |
| getManualIntensity | Retrieves the intensity from the setManualIntensity request. |
| setIndividualIntensity | Manually sets the intensity for an individual LED. |
| getIndividualIntensity | Retrieves the intensity from the setIndividualIntensity request. |
| getCurrentIntensity | Retrieves the current intensity. |
| setAutomaticAngleOfIlluminationMode | Automatically controls the angle of illumination. Using this mode means that the angle of illumination is the same as the camera’s angle of view. |
| getValidAngleOfIllumination | Lists the valid angle of illumination values. |
| setManualAngleOfIllumination | Sets the manual angle of illumination. This is useful when the angle of illumination needs to be different from the camera’s view angle. |
| getManualAngleOfIllumination | Retrieves the angle of illumination from the setManualAngleOfIllumination request. |
| getCurrentAngleOfIllumination | Retrieves the current angle of illumination. |
| setLightSynchronizeDayNightMode | Enables automatic synchronization with the day/night mode. |
| getLightSynchronizeDayNightMode | Checks if the automatic synchronization is enabled with the day/night mode. |
| getValidIRWavelengths | Lists the valid IR wavelengths. |
| setIRWavelength | Sets the IR wavelength. |
| getIRWavelength | Retrieves the currently set IR wavelength |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| apiVersions | Array | Shows the supported API versions. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| automaticIntensitySupport | Boolean | Indicates that setAutomaticIntensityMode is supported. |
| manualIntensitySupport | Boolean | Indicates that getManualIntensity and setManualIntensity are supported. |
| individualIntensitySupport | Boolean | Indicates that getIndividualIntensity and setIndividualIntensity are supported. |
| getCurrentIntensitySupport | Boolean | Indicates that getCurrentIntensity is supported. |
| manualAngleOfIlluminationsupport | Boolean | Indicates that setManualAngleOfIllumination is supported. |
| automaticAngleOfIlluminationSupport | Boolean | Indicates that setAutomaticAngleOfIlluminationMode is supported. |
| dayNightSynchronizeSupport | Boolean | Indicates that setLightSynchronizeDayNightMode is supported. |
| multiIRWaveLengthSupport | Boolean | Indicates that getValidIRWavelengths, setIRWavelength and getIRWavelength are supported. |
| capabilities | JSON object | Container for supported capabilities for each LEDgroup. |
| lightID | String | The ID of the LEDgroup. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| lightID | String | Unique ID of the light. |
| lightType | String | Type identifier of the light. |
| enabled | Boolean | Indicates if the light is enabled. |
| synchronizeDayNightMode | Boolean | Indicates if the light is synchronized with day/night. |
| lightState | Boolean | Indicates if the light is ON or OFF. |
| automaticIntensityMode | Boolean | Indicates if the mode for automatic intensity is active. |
| automaticAngleOfIlluminationMode | Boolean | Indicates if the mode for automatic angle of illumination is active. |
| nrOfLEDs | Integer | Number of configurable LEDs in a light group. The light groups are identified by their Light ID. |
| error | Boolean | An error has occurred. |
| errorInfo | String | Error description. |

| Code | Definition | Description |
| --- | --- | --- |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |
| 1008 | UPDATE_IRCUTFILTER_FAULT | Could not update IR cut filter. |
| 1009 | LIGHT_DISABLED_FAULT | The light group is turned off and can’t be activated. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| status | Boolean | Indicates if the light is ON or OFF. |

| Code | Definition | Description |
| --- | --- | --- |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| enabled | Boolean | Enables automatic light intensity control. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| ranges | Array | Array of the range objects. |
| low | Integer | The lower intensity limit for the range. |
| high | Integer | The upper intensity limit for the range. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| intensity | Integer | The intensity level of the light. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1003 | INVALID_INTENSITY_FAULT | Provided intensity level is out of the supported range. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| intensity | Intensity | The currently configured manual intensity. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| LEDID | Integer | The ID of the LED. |
| intensity | Integer | The intensity level of the light. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1003 | INVALID_INTENSITY_FAULT | Provided intensity level is out of the supported range. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| LEDID | Integer | The ID of the LED. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| intensity | Integer | The currently configured individual intensity. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| intensity | Integer | The current intensity of the light. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| enabled | Boolean | Activate or deactivate automatic angle of illumination mode for a selected light. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| ranges | Array | Array of range objects. |
| low | Integer | Lower angle limit for the range. |
| high | Integer | Upper angle limit for the range. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| angleOfIllumination | Integer | The angle of illumination. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1004 | INVALID_ANGLE_OF_ILLUMINATION_FAULT | Provided angle of illumination is out of the supported range. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| angleOfIllumination | Integer | The current manual angle of illumination. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| angleOfIllumination | Integer | The currently active angle of illumination. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| enabled | Boolean | Activate or deactivate automatic angle of illumination mode for a selected light. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| enabled | Boolean | If the day/night cut filter synchronization of the light is active. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| wavelengths | Array | An array containing the wavelengths settings. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for the method specific parameters. |
| lightID | String | The light ID. |
| IRWavelength | String | The infrared wavelength. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion |  | The API version that should be used. |
| context |  | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method |  | Container for the response specific parameters. |
| data |  | The current intensity of the light. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |
| 1007 | INVALID_IR_WAVELENGTH_FAULT | Provided infrared wavelength is not valid. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| params | JSON object | Container for method specific parameters. |
| lightID | String | The light ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The API version that should be used. |
| context | String | The client sets this value and the CGI will echo this context string back in the response (optional). |
| method | String | The performed operation. |
| data | JSON object | Container for the response specific parameters. |
| IRWavelength | String | An array containing the wavelength settings. |

| Code | Definition | Description |
| --- | --- | --- |
| 1001 | NOT_SUPPORTED_FAULT | Method call not supported by the device. |
| 1002 | INVALID_LIGHT_ID_FAULT | Provided lightID parameter is not valid for the device. |
| 1005 | CARD_MALFUNCTIONING_FAULT | Could not find light hardware, could not complete request. |
| 1006 | WRONG_POE_CLASS_FAULT | Wrong POE class, could not complete request. |

| Code | Definition | Description |
| --- | --- | --- |
| 1000 | PARAM_INVALID_VALUE_ERROR | Invalid parameter value. |
| 2000 | RESOURCE_MEM_ERROR | Failed to allocate memory. |
| 2001 | ACCESS_FORBIDDEN | Access forbidden |
| 2002 | HTTP_METHOD_NOT_SUPPORTED | HTTP request type not supported. Only POST supported. |
| 2003 | API_VERSION_NOT_SUPPORTED | The requested API version is not supported. |
| 2004 | METHOD_NOT_SUPPORTED | Method not supported. |
| 3000 | UNSUPPORTED_API_VERSION | The requested API version is not supported. |
| 4000 | JSON_INVALID_ERROR | The provided JSON input was invalid. |
| 4001 | JSON_KEY_NOT_FOUND_ERROR | A mandatory input parameter was not found in the input. |
| 4002 | JSON_INVALID_TYPE | The provided JSON parameter type was incorrect. |
| 7000 | UNSUPPORTED_API_VERSION | The requested API version is not supported by this implementation. |
| 8000 | INTERNAL_ERROR | Internal error. |
| 8001 | UNEXPECTED_ERROR | Unexpected error. |
| 8002 | GENERIC_ERROR | Generic error. |

