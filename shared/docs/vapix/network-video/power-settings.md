# Power settings

**Source:** https://developer.axis.com/vapix/network-video/power-settings/
**Last Updated:** Aug 27, 2025

---

# Power settings

## Overview​

### General concepts​

#### Power-saving mode​

#### Delayed power down mode​

#### Power status​

#### Power consumers​

#### Power profiles​

#### Power configurations​

#### Dynamic power mode​

#### Power history​

#### Disable power warning overlay​

#### IO Port Power​

### Identification​

## Common examples​

### Power saving mode​

### Delayed power down mode​

### Power status information​

### Check power consumer information​

### Configure power consumers​

### Retrieve power profile information​

### Set a pre-defined power profile​

### Power configurations​

### Dynamic power mode​

### Power history​

### Disable the power warning overlay​

### Control the IO Port Power​

#### Get the current state of the IO Port Power​

#### Enable IO Port Power​

## API specification​

### getSupportedVersions​

### getCapabilities​

### getPowerSavingMode​

### setPowerSavingMode​

### getDelayedPowerDownMode​

### setDelayedPowerDownMode​

### getPowerStatus​

### getPowerConsumers​

### setPowerConsumer​

### getPowerProfiles​

### setPowerProfile​

### getPowerConfigurations​

### getActivePowerConfiguration​

### setActivePowerConfiguration​

### getDynamicPowerMode​

### setDynamicPowerMode​

### getPowerHistory​

### getPowerWarningOverlay​

### setPowerWarningOverlay​

### getIoPortPower​

### setIoPortPower​

### General error codes​

The VAPIX® Power settings API provides the methods and parameters that makes it possible to control the power settings on your Axis devices.

The API uses the power-settings.cgi as its communication interface and supports the following methods:

The power-saving mode lowers the power consumption of your Axis device while maintaining its overall operational performance. This feature is recommended for larger camera installations, where it can lower the continuous power consumption and reduce the overall energy cost. A user with operator level access and higher can either manually, or by triggering pre-configured conditions, turn off the power saving mode without rebooting the device. This is useful if optimal image quality is necessary.

Some Axis devices have an extra pin that can be connected to the ignition of a vehicle. This means that the vehicle can control whether your camera should be active and can be enabled by setting delayedPowerDown to true. By extension, this also means that the camera will stop recording when you turn off the vehicle. You are also able to set a timer, but only when delayedPowerDown is true. Doing this will delay the power down of the camera, which is useful when the vehicle is making several short stops, or the driver leaves the vehicle, and you want to continue the recording.

Power status is a selection of information and statistics about the total power consumption of your device and may be used by the products web interface.

The maximum power consumption can be changed on either selected parts of a device or allow a functionality to be disabled by the user. This makes it possible to reduce the power consumption, or redirect more of the available power according to meet the current requirements.

Caution

This feature should only be used with great knowledge of the device since it will affect the product’s sensitivity and limitations regarding temperature and condensation.

A power profile is a pre-defined configuration of power consumer settings that allows the user to change the power consumption by using officially tested settings. This includes documented limitations for temperature and condensation.

Some devices allow the user to completely change their power configurations. This means that it is possible to set different configurations, or priorities for PoE 3 and PoE 4, in order to limit the total power usage and change power related behaviors of the device.

This configuration can be used to lower the performance and power consumption of the system during periods of inactivity when a full performance is not required. The amount of power drawn is product dependant and the functionality is able to increase the latency of the initial video start by up to a fraction of a second, which means that the product performance won’t be noticeable affected.

This configuration is used by devices with the hardware support to measure the momentary power draw. Power history is set up to record the power consumption of the device and allows the user to plot the power consumption over various time intervals. This means that you are able to see how the power consumption varies over the span of a day/night cycle, in a particular climate or over the seasons for the last day, week, year, etc.

Some products support a text overlay warning about insufficient Power over Ethernet. For those products, the system will use the enabled overlay when appropriate unless the overlay is actively turned off by the user.

Some products can turn on/off the 12 volt power of the IO connector. The extra power can then be used by another power consumer in the camera, such as the heater, IR or deep learning.

This example will show you how to control the power consumption on your Axis device.

JSON input parameters

Successful response

Failed response

See getSupportedVersions for further details.

JSON input parameters

Successful response

Failed response

See getCapabilities for further details.

JSON input parameters

Successful response

Failed response

See getPowerSavingMode for further details.

JSON input parameters

Successful response

Failed response

See setPowerSavingMode for further details.

This example will show you how to configure the camera to power down after a predefined amount of time, for example when the motor of a vehicle in a surveilled zone is shut down.

JSON input parameters

Successful response

Failed response

JSON input parameters

Successful response

Failed response

See getDelayedPowerDownMode and setDelayedPowerDownMode for further details.

This example will show you how to verify the power consumption of your device by initiating a health check that will investigate if the power consumption correspond to the device configuration.

JSON input parameters

Successful response

Failed response

See getPowerStatus for further details.

This example will show you how to check the power consumption of your device by listing all power consumers and how they can be changed to optimize power requirements.

JSON input parameters

Successful response

Failed response

See getPowerConsumers for further details.

This example will show you how to configure the power consumption of the heater on your device.

JSON input parameters

Successful response

Failed response

See setPowerConsumer for further details.

This example will show you how to control the power consumption on your device by listing pre-defined configurations of power consumers found on your device.

JSON input parameters

Successful response

Failed response

See getPowerProfiles for further details.

This example will show you how to control the power consumption of your device by using a pre-defined and tested configuration for the available power consumers.

JSON input parameters

Successful response

Failed response

See setPowerProfile for further details.

This example will show you how to control the power consumption of your device to reduce the operating cost of the installation by listing and applying supported and active power configurations.

Check available power configurations

JSON input parameters

Successful response

Failed response

See getPowerConfigurations for further details.

Check active power configuration

JSON input parameters

Successful response

Failed response

See getActivePowerConfiguration for further details.

Apply a power configuration

JSON input parameters

Successful response

Failed response

See setActivePowerConfiguration for further details.

This example will show you how to disable the dynamic power mode when you wish to lower the video latency.

Check dynamic power mode

JSON input parameters

Successful response

Failed response

See getDynamicPowerMode for further details.

JSON input parameters

Successful response

Failed response

See setDynamicPowerMode for further details.

This example will show you how to collect data on your camera’s power consumption without the need for external tools.

JSON input parameters

Successful response

Failed response

See getPowerHistory for further details.

This example will show you how to remove the text overlay warning about too low power levels after connecting a camera to a lower PoE class switch than what is normally required for full functionality.

JSON input parameters

Successful response

Failed response

See setPowerWarningOverlay for further details.

This example will show you how to connect an accessory to the camera that requires 12 volt on the IO port.
Note that the 12 volt pin in the IO port needs to be enabled for this method to work.

JSON input parameters

Successful response

Failed response

See getIoPortPower for further details.

JSON input parameters

Successful response

Failed response

See setIoPortPower for further details.

This method should be used when you want to retrieve a list containing all API versions supported by your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codesfor a complete list of potential errors.

This method should be used when you want to retrieve the different capabilities that can be controlled.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current state of the power saving mode.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getPowerSavingMode

See General error codes for a complete list of potential errors.

This method should be used when you want to apply a new state to the Power saving mode.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setPowerSavingMode

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the current state of the delayed power down mode.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getDelayedPowerDownMode

See General error codes for a complete list of potential errors.

This method should be used when you want to apply a new state to the delayed power down mode.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDelayedPowerDownMode

See General error codes for a complete list of potential errors.

This method should be used when you want to check the power status of your device. Please note that the values will be -1 if the parameters aren’t available on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getPowerStatus

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list containing all available power consumers on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getPowerConsumers

See General error codes for a complete list of potential errors.

This method should be used when you want to apply properties to a power consumer.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setPowerConsumer

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list containing all available power profiles.

Request

Return value - Success

Response body syntax

The following table lists the objects supported by labels=<object>.

Return value - Failure

Response body syntax

Error codes

Error codes for getPowerProfiles

See General error codes for a complete list of potential errors.

This method should be used when you want to apply a pre-defined power profile.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setPowerProfile

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve a list containing all available power configurations.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getPowerConfigurations

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve an active power configuration.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getActivePowerConfiguration

See General error codes for a complete list of potential errors.

This method should be used when you want to apply a requested power configuration to be active on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setActivePowerConfiguration

See General error codes for a complete list of potential errors.

This method should be used when you want to retrieve the dynamic power mode state.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for getDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to either enable or disable dynamic power mode on your device.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to check the power history of your device. The history is accumulated and stored on the device memory for persistent and long term statistics.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to check whether the text overlay warning regarding a lack of power on the PoE is enabled. If enabled, the system will show the overlay when appropriate. Some products support the possibility to change the power configuration with setActivePowerConfiguration instead of disabling the overlay withsetPowerWarningOverlay.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to check whether the text overlay warning regarding a lack of power on the PoE is enabled. If enabled, the system will show the overlay when appropriate. Some products support the possibility to change the power configuration with setActivePowerConfiguration instead of disabling the overlay withsetPowerWarningOverlay.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to check the status of the IO Port Power feature. This API makes it possible to see if the 12V output on the IO connector is enabled or disabled.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

This method should be used when you want to set the state of the power output for the IO connector and turn the 12V IO Port Power on or off.

Request

Return value - Success

Response body syntax

Return value - Failure

Response body syntax

Error codes

Error codes for setDynamicPowerMode

See General error codes for a complete list of potential errors.

The following table lists the general errors that can occur to any CGI method. Errors unique to a method are listed under the API description of that particular method.

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.3", "2.1"]    }}
```

```
{    "apiVersion": "2.1",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 8000,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getCapabilities",    "params": {}}
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "getCapabilities",    "data": {        "powerSavingSupport": true,        "delayedPowerDownSupport": false,        "powerProfileSupport": true,        "powerConsumerSupport": true,        "powerStatusSupport": true,        "powerConfigurationSupport": false,        "dynamicPowerModeSupport": true,        "powerHistorySupport": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getCapabilities",    "error": {        "code": 8000,        "message": "Internal error"    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPowerSavingMode",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPowerSavingMode",    "data": {        "powerSavingMode": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getPowerSavingMode",    "error": {        "code": 300,        "message": "Power saving mode is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPowerSavingMode",    "params": {        "powerSavingMode": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPowerSavingMode",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setPowerSavingMode",    "error": {        "code": 301,        "message": "Unable to store Power saving mode."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "getDelayedPowerDownMode",    "params": {}}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "getDelayedPowerDownMode",    "data": {        "delayedPowerDownMode": true,        "delayTime": 30    }}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "getDelayedPowerDownMode",    "error": {        "code": 300,        "message": "Delayed power down mode is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "setDelayedPowerDownMode",    "params": {        "delayedPowerDownMode": true,        "delayTime": 30    }}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "setDelayedPowerDownMode",    "data": {}}
```

```
{    "apiVersion": "1.1",    "context": "abc",    "method": "setDelayedPowerDownMode",    "error": {        "code": 301,        "message": "Unable to set delayed power down mode."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerStatus"}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerStatus",    "data": {        "usage": {            "currentPower": 60.0,            "averagePower": 60.0,            "maxPower": 60.0        },        "psePoeClass": 4,        "lldpPoeClass": 4,        "powerRequested": 30.0    }}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerStatus",    "error": {        "code": 300,        "message": "Power status is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerConsumers"}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerConsumers",    "data": {        "consumers": [            {                "powerConsumer": "WindowHeater",                "type": "Heater",                "maxPower": 5.0,                "adjustablePower": true,                "enabled": true            }        ]    }}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerConsumers",    "error": {        "code": 300,        "message": "Power consumers is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerConsumer",    "params": {        "powerConsumer": "WindowHeater",        "maxPower": 5.0,        "enabled": true    }}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerConsumer",    "data": {}}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerConsumer",    "error": {        "code": 301,        "message": "Unable to set power consumer."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerProfiles"}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerProfiles",    "data": {        "currentPowerProfile": "Default",        "profiles": [            {                "powerProfile": "Default",                "powerRank": 10,                "lowerTemperature": -50,                "upperTemperature": 50,                "labels": ["highPerformance", "temperatureRange"],                "default": true,                "consumers": [                    {                        "powerConsumer": "WindowHeater",                        "maxPower": 5.0,                        "enabled": true                    }                ]            },            {                "powerProfile": "LimitedTemperatureRange",                "powerRank": 1,                "lowerTemperature": 0,                "upperTemperature": 50,                "labels": ["lowPower", "temperatureRange", "disableHeaters"],                "default": false,                "consumers": [                    {                        "powerConsumer": "WindowHeater",                        "maxPower": 5.0,                        "enabled": false                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "getPowerProfiles",    "error": {        "code": 300,        "message": "Power profiles is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerProfile",    "params": {        "powerProfile": "LimitedTemperatureRange"    }}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerProfile",    "data": {}}
```

```
{    "apiVersion": "1.2",    "context": "abc",    "method": "setPowerProfile",    "error": {        "code": 301,        "message": "Unable to set power profile."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getPowerConfigurations"}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getPowerConfigurations",    "data": {        "powerConfigurations": [            {                "index": 0,                "name": "PoE 4"            },            {                "index": 1,                "name": "PoE 3"            }        ]    }}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getPowerConfigurations",    "error": {        "code": 300,        "message": "Power configurations are not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getActivePowerConfiguration"}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getActivePowerConfiguration",    "data": {        "index": 0    }}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "getActivePowerConfiguration",    "error": {        "code": 300,        "message": "Power configurations are not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "setActivePowerConfiguration",    "params": {        "index": 2    }}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "setActivePowerConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.4",    "context": "abc",    "method": "setActivePowerConfiguration",    "error": {        "code": 301,        "message": "Unable to set power configuration."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "getDynamicPowerMode",    "params": {}}
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "getDynamicPowerMode",    "data": {        "dynamicPowerMode": true    }}
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "getDynamicPowerMode",    "error": {        "code": 300,        "message": "Dynamic power mode is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "setDynamicPowerMode",    "params": {        "dynamicPowerMode": false    }}
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "setDynamicPowerMode",    "data": {}}
```

```
{    "apiVersion": "1.5",    "context": "abc",    "method": "setDynamicPowerMode",    "error": {        "code": 301,        "message": "Unable to store dynamic power mode."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "getPowerHistory",    "params": {        "requestedTimeSpan": 7200    }}
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "getPowerHistory",    "data": {        "acquiredTimeSpan": 14400,        "numberOfSamples": 16,        "endTimeStamp": "2023-01-23T14:00:01.549356Z",        "powerMeasurements": [            49.939, 49.893, 49.933, 49.954, 49.949, 49.936, 49.847, 49.929, 49.923, 49.952, 49.962, 49.858, 49.973,            49.964, 49.882, 49.964        ],        "powerAverage": 49.929    }}
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "getPowerHistory",    "error": {        "code": 300,        "message": "Power history is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.7",    "context": "abc",    "method": "setPowerWarningOverlay",    "params": {        "enable": false    }}
```

```
{    "apiVersion": "1.7",    "context": "abc",    "method": "setPowerWarningOverlay",    "data": {}}
```

```
{    "apiVersion": "1.7",    "context": "abc",    "method": "setPowerWarningOverlay",    "error": {        "code": 301,        "message": "Unable to disable Power Warning Overlay."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getIoPortPower",    "params": {}}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getIoPortPower",    "data": {        "enabled": true    }}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getIoPortPower",    "error": {        "code": 300,        "message": "Get IO Port Power is not supported."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "setIoPortPower",    "params": {        "enable": true    }}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "setIoPortPower",    "data": {}}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "setIoPortPower",    "error": {        "code": 301,        "message": "Unable to set IO Port Power to its new state."    }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "context": <string>,  "method": "getSupportedVersions"}
```

```
{  "context": <string>,  "method": "getSupportedVersions",  "data": {    "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCapabilities"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getCapabilities",  "data": {    "powerSavingSupport": <boolean>,    "delayedPowerDownSupport": <boolean>,    "powerProfileSupport": <boolean>,    "powerConsumerSupport": <boolean>,    "powerStatusSupport": <boolean>,    "powerConfigurationSupport": <boolean>,    "dynamicPowerModeSupport": <boolean>,    "powerHistorySupport": <boolean>,    "disablePowerWarningOverlaySupport": <boolean>,    "ioPortPowerSupport": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "method": "getCapabilities",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerSavingMode"}
```

```
{  "apiVersion": "<Major>.<Minor>"  "context": <string>,  "method": "getPowerSavingMode",  "data": {    "powerSavingMode": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerSavingMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerSavingMode",  "params": {    "powerSavingMode": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>"  "context": <string>,  "method": "setPowerSavingMode"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerSavingMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDelayedPowerDownMode"}
```

```
{  "apiVersion": "<Major>.<Minor>"  "context": <string>,  "method": "getDelayedPowerDownMode",  "data": {    "delayedPowerDownMode": <boolean>,    "delayTime": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDelayedPowerDownMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDelayedPowerDownMode",  "params": {    "delayedPowerDownMode": <boolean>,    "delayTime": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDelayedPowerDownMode"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDelayedPowerDownMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerStatus"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerStatus",  "data": {    "usage": {      "currentPower": <double>,      "averagePower": <double>,      "maxPower": <double>    },    "psePoeClass": <integer>,    "lldpPoeClass": <integer>,    "powerRequested": <double>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerStatus",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConsumers"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConsumers",  "data": {    "consumers": [      {        "powerConsumer": <string>,        "type": <string>,        "maxPower": <double>,        "adjustablePower": <boolean>,        "enabled": <boolean>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConsumers",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerConsumer",  "params": {    "powerConsumer": <string>,    "maxPower": <number>,    "enabled": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerConsumer"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerConsumer",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerProfiles"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerProfiles",  "data": {    "currentPowerProfile": <string>,    "profiles": [      {        "powerProfile": <string>,        "powerRank": <integer>,        "lowerTemperature": <integer>,        "upperTemperature": <integer>,        "labels": [          <string>        ],        "default": <boolean>,        "consumers": [          {            "powerConsumer": <string>,            "maxPower": <double>,            "enabled": <boolean>          }        ]      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerProfiles",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerProfile",  "params": {    "powerProfile": <string>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerProfile"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerProfile",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConfigurations"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConfigurations",  "data": {    "powerConfigurations": [      {        "index": <integer>,        "name": <string>      }    ]  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerConfigurations",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getActivePowerConfiguration"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getActivePowerConfiguration",  "data": {    "index": <integer>,  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getActivePowerConfiguration",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setActivePowerConfiguration",  "params": {    "index": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setActivePowerConfiguration"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setActivePowerConfiguration",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDynamicPowerMode"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDynamicPowerMode",  "data": {    "dynamicPowerMode": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getDynamicPowerMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDynamicPowerMode",  "params": {    "dynamicPowerMode": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDynamicPowerMode"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setDynamicPowerMode",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerHistory",  "params": {    "requestedTimeSpan": <integer>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerHistory",  "data": {    "acquiredTimeSpan": <integer>,    "numberOfSamples": <integer>,    "endTimeStamp": <string>,    "powerMeasurements": [<double>, ..., <double>],    "powerAverage": <double>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerHistory",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerWarningOverlay",  "params": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerWarningOverlay",  "data": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getPowerWarningOverlay",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerWarningOverlay",  "params": {    "enable": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerWarningOverlay"}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setPowerWarningOverlay",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIoPortPower",  "params": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIoPortPower",  "data": {    "enabled": <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "getIoPortPower",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

```
http://<servername>/axis-cgi/power-settings.cgi
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoPortPower",  "params": {    "enable" <boolean>  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoPortPower",  "data": {  }}
```

```
{  "apiVersion": "<Major>.<Minor>",  "context": <string>,  "method": "setIoPortPower",  "error": {    "code": <integer error code>,    "message": <string>  }}
```

- API Discovery: id=power-settings

- Request a list of supported API versions.

- Parse the JSON response.

- Request the capabilities that will verify if the device supports the power saving mode.

- Parse the JSON response.

- Request information about the power saving mode and verify its present state.

- Parse the JSON response.

- Activate the Power saving mode.

- Parse the JSON response.

- Verify the current state of the delayed power down mode.

- Parse the JSON response.

- Activate the delayed power down mode.

- Parse the JSON response.

- Request the current power status of your device.

- Parse the JSON response.

- Request the available power consumers from the product.

- Parse the JSON response.

- Configure a power consumer on your device.

- Parse the JSON response.

- Request a list containing all available power profiles on your device.

- Parse the JSON response.

- Configure a power profile on your device.

- Parse the JSON response.

- Retrieve a list containing all available power configurations on your device.

- Parse the JSON response.

- Check your device to see the currently active power configuration.

- Parse the JSON response.

- Change the active power configuration.

- Parse the JSON response.

- Retrieve the current state of the dynamic power mode.

- Parse the JSON response.

- Disable dynamic power mode.

- Parse the JSON response.

- Request a list containing the power consumption over a specific time period.

- Parse the JSON response.

- Disable the overlay with the method setPowerWarningOverlay.

- Parse the JSON response.

- Use IoPortPower to read the current state of IO Port Power. It can be either enabled or disabled.

- Parse the JSON response.

- Use setIoPortPower to enable or disable IO Port Power.

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

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Description |
| --- | --- |
| getSupportedVersions | Retrieves the API versions supported by your Axis device. |
| getCapabilities | Retrieves supported product capabilities. |
| getPowerSavingMode | Retrieves the current state of the Power saving mode from your Axis device |
| setPowerSavingMode | Applies the requested state of the Power saving mode to your Axis device. |
| getDelayedPowerDownMode | Retrieves the current state of the delayed power down mode from your Axis device. |
| setDelayedPowerDownMode | Applies the requested state of the delayed power down mode on your Axis device. |
| getPowerStatus | Retrieves power status for your Axis device. |
| getPowerConsumers | Retrieves a list containing available power consumers for your Axis device. |
| setPowerConsumer | Applies the requested properties to a power consumer on your Axis device. |
| getPowerProfiles | Retrieves a list of available power profiles on your Axis device. |
| setPowerProfile | Applies the requested power profile to your Axis device. |
| getPowerConfigurations | Retrieves a list of available power configurations on your Axis device. |
| getActivePowerConfiguration | Retrieves the active power configuration on your Axis device. |
| setActivePowerConfiguration | Applies the requested active power configuration to your Axis device. |
| getDynamicPowerMode | Retrieves the current state of Dynamic Power Mode. |
| setDynamicPowerMode | Applies the requested state of Dynamic Power Mode. |
| getPowerHistory | Retrieves power history data from your Axis device. |
| getPowerWarningOverlay | Checks if the power warning overlay is enabled. |
| setPowerWarningOverlay | Enable or disable the power warning overlay by setting the parameter to either true or false. |
| getIoPortPower | Check if IO Port Power is enabled. |
| setIoPortPower | Enable or disable IO port power. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getSupportedVersions" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| data.apiVersions[]=<list of versions> | A list containing all supported major versions along with their highest minor version, e.g. ["1.0", "1.2"]. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getSupportedVersions" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion: "<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getCapabilities" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion: "<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCapabilities" | The requested method. |
| data.powerSavingSupport=<boolean> | A boolean returning one of the following responses: true if the device support Power saving mode. false if the device doesn’t support Power saving mode. |
| data.delayedPowerDownSupport=<boolean> | A boolean returning one of the following responses: true if the device support Delayed power down mode. false if the device doesn’t support Delayed power down mode. |
| data.powerProfileSupport=<boolean> | A boolean returning one of the following responses: true if the device support power profiles. false if the device doesn’t support power profiles. |
| data.powerConsumerSupport=<boolean> | A boolean returning one of the following responses: true if the device support power consumers. false if the device doesn’t support power consumers. |
| data.powerStatusSupport=<boolean> | A boolean returning one of the following responses: true if the device support power status. false if the device doesn’t support power status. Please note that the value will be -1 if the parameter isn’t available on your device. |
| data.powerConfigurationSupport=<boolean> | A boolean returning one of the following responses: true if the device support power configurations. false if the device doesn’t support power configurations. |
| data.dynamicPowerModeSupport=<boolean> | A boolean returning one of the following responses: true if the device supports dynamic power mode. false if the device doesn’t support dynamic power mode. |
| data.powerHistorySupport=<boolean> | A boolean returning one of the following responses: true if the device supports power history. false if the device doesn’t support power history. |
| data.disablePowerWarningOverlaySupport=<boolean> | A boolean returning true if the the device can toggle the power warning overlay and false if power warning overlay handing is not supported. |
| data.ioPortPowerSupport=<boolean> | A boolean returning true if the device can toggle IO Port Power on or off and false if it is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getCapabilities" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerSavingMode" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerSavingMode" | The requested method. |
| data.powerSavingMode=<boolean> | A boolean returning the state of the power saving mode: true if power saving mode is active. false if power saving mode is not active. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerSavingMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power saving mode is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setPowerSavingMode" | The method that should be used. |
| params.powerSavingMode=<boolean> | A boolean applying the state for the Power saving mode. true activates power saving mode. false deactivates power saving mode. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerSavingMode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerSavingMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power saving mode is not supported. |
| 301 | Unable to store Power saving mode. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getDelayedPowerDownMode" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerSavingMode" | The requested method. |
| data.delayedPowerDownMode=<boolean> | A boolean returning the state of the delayed power down mode: true if delayed power down mode is active. false if delayed power down mode is not active. |
| data.delayTime=<integer> | An integer returning the delay time in seconds. It is not used if delayedPowerDownMode is false. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getDelayedPowerDownMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Delayed power down mode is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setDelayedPowerDownMode" | The method that should be used. |
| params.delayedPowerDownMode=<boolean> | A boolean applying the state for the delayed power down mode. true: if delayed power down mode should be activated. false: if delayed power down mode should be deactivated. |
| params.delayTime=<integer> | An integer returning the delay time in seconds. It is not used if delayedPowerDownMode is false. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setDelayedPowerDownMode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setDelayedPowerDownMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Delayed power down mode is not supported. |
| 301 | Unable to set delayed power down mode. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerStatus" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerStatus" | The requested method. |
| usage=<object> | An object containing the power and energy usage statistics of your device. |
| currentPower=<double> | Contains the power in watts currently used by your device. |
| averagePower=<double> | Contains the average power in watts used by your device. |
| maxPower=<double> | Contains the max power in watts used by your device. |
| psePoeClass=<integer> | Contains the PoE class according to the hardware power source equipment. |
| lldpPoeClass=<integer> | Contains the PoE class according to the LLDP software negotiation. |
| powerRequested=<double> | Contains the power in watts requested by your device. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerStatus" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power status is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerConsumers" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerConsumers" | The requested method. |
| consumers=<object> | Contains all available power consumers. |
| powerConsumer=<string> | Contains the name of the power consumer. |
| type=<string> | Contains the consumer type. |
| maxPower=<double> | The maximum power, in watts, used by the consumer. |
| adjustablePower=<boolean> | Indicates if the power for the consumer can be adjusted. |
| enabled=<boolean> | Indicates if the consumer is enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerConsumers" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power consumers is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setPowerConsumer" | The method that should be used. |
| powerConsumer=<string> | Contains the name of the power consumer. |
| maxPower=<double> | The maximum power, in watts, used by the consumer. |
| enabled=<boolean> | Indicates if the consumer is enabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerConsumer" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerConsumer" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power consumers is not supported. |
| 301 | Unable to set power consumer. |
| 302 | Invalid parameter value for power consumer. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerProfiles" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerProfiles" | The requested method. |
| currentPowerProfile=<string> | Contains the name of the active profile. |
| profiles=<object> | Lists the power profiles available on your device. |
| powerProfile=<string> | Contains the profile name. |
| powerRank=<integer> | Contains a value that ranks the power usage of a profile relative to other profiles from lowest to highest. |
| lowerTemperature=<integer> | Contains the lowest profile specific temperature limit, which is dependant on if the profile allows heaters or fans to be used. Please note that your device is not guaranteed to have full functionality if the ambient temperature is lower than this value. |
| upperTemperature=<integer> | Contains the highest profile specific temperature limit, which is dependant on if the profile allows coolers or fans to be used. Please note that your device is not guaranteed to have full functionality if the ambient temperature is higher than this value. |
| labels=<object> | Profile labels. |
| default=<boolean> | Boolean indicating if the profile is the default profile. |
| consumers=<object> | Power consumers settings for the profile. |
| powerConsumer=<string> | Contains the consumer names. |
| maxPower=<double> | Contains the maximum power, in watts, for the consumer when a profile is used. |
| enabled=<boolean> | Indicator for if the consumer should be active when a profile is used. |

| Property name | Description |
| --- | --- |
| disableHeaters | Profile has disabled heaters. |
| highPerformance | Profile is optimized for high performance. |
| lowPower | Profile is optimized for low power consumption. |
| temperatureRange | Profile has a suggested temperature range indicated by lowerTemperature and upperTemperature limits. |
| enableIo | Profile has 12V IO enabled (only used if there are other profiles with 12V IO disabled). |
| enableHdmiAndAudio | Profile has HDMI and Audio enabled (only used if there are other profiles with HDMI and Audio disabled). |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerProfiles" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power profiles is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setPowerProfile" | The method that should be used. |
| powerProfile=<string> | Contains the name of the profile that should be applied. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerProfile" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerProfile" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power profiles is not supported. |
| 301 | Unable to set power profile. |
| 302 | Invalid parameter value for power profile. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerConfigurations" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerConfigurations" | The requested method. |
| powerConfigurations=<object> | Lists the power configurations available for your device. |
| index=<integer> | The index number of the power configuration. |
| name=<string> | The name of the power configuration. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerConfigurations" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power configurations are not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getActivePowerConfiguration" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getActivePowerConfiguration" | The requested method. |
| index=<integer> | The index number of the active power configuration. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getActivePowerConfiguration" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power configurations are not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setActivePowerConfiguration" | The method that should be used. |
| index=<integer> | The index number of the power configuration that should be set. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setActivePowerConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setActivePowerConfiguration" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power configurations are not supported. |
| 301 | Unable to set power configuration, index out of bounds. |
| 302 | Invalid parameter value for power configuration. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getDynamicPowerMode" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getDynamicPowerMode" | The requested method. |
| dynamicPowerMode=<boolean> | true: dynamic power mode is active. false: dynamic power mode is not active. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getDynamicPowerMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Dynamic power mode is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setDynamicPowerMode" | The method that should be used. |
| dynamicPowerMode=<boolean> | true: enables dynamic power mode. false: disables dynamic power mode. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setDynamicPowerMode" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setDynamicPowerMode" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Dynamic power mode is not supported. |
| 301 | Unable to set dynamic power mode. |
| 302 | Invalid parameter value for dynamic power mode. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerHistory" | The method that should be used. |
| params.requestedTimeSpan=<integer> | Contains the requested time length in seconds for which to request data. Please note that the acquired time length will likely differ as the algorithm finds the closest matching set of data points with the highest possible resolution. Parameters should be larger than or equal to zero, or the error code 302 will be returned. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerHistory" | The requested method. |
| data.acquiredTimeSpan=<integer> | Contains the length of the requested time span in seconds and is obtained after an algorithm finds the set of data best matching the requested time length, along with the highest resolution of data for the time interval. |
| data.numberOfSamples=<integer> | Contains the number of data points in the powerMeasurements array. |
| data.endTimeStamp=<string> | Contains the time stamp in the ISO8601 format of the last data point in the powerMeasurements array. |
| data.powerMeasurements[]=<list of doubles> | Contains the data points in watts for the acquired time span. |
| data.powerAverage=<double> | Contains the average power consumption, in watts, over the acquired time span. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerHistory" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Power history is not supported. |
| 301 | Unable to retrieve power history data. |
| 302 | Invalid parameter value for power history. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getPowerWarningOverlay" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerWarningOverlay" | The requested method. |
| data.enabled=<boolean> | Returns that state of the power warning overlay functionality. Can be either true = enabled or false = disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getPowerWarningOverlay" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Disable Power Warning Overlay is not supported. |
| 301 | Unable to disable Power Warning Overlay. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setPowerWarningOverlay" | The method that should be used. |
| params.enable=<boolean> | States if the power warning overlay should be enabled. Can be either true = enabled or false = disabled. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerWarningOverlay" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setPowerWarningOverlay" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | Disable Power Warning Overlay is not supported. |
| 301 | Unable to disable Power Warning Overlay. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="getIoPortPower" | The method that should be used. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIoPortPower" | The requested method. |
| data.enabled=<boolean> | Returns the IO Port Power state.  true = enabled  false = disabled |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="getIoPortPower" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | IO Port Power is not supported. |

| Parameter | Description |
| --- | --- |
| apiVersion="<Major>.<Minor>" | The API version that should be used. |
| context=<string> Optional | The user sets this value and the application echoes it back in the response. |
| method="setIoPortPower" | The method that should be used. |
| params.enable=<boolean> | States if IO Port Power should be enabled.  true = enabled  false = disabled |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoPortPower" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<Major>.<Minor> | The API version that was used in the request. |
| context=<string> Optional | The context set by the user in the request. |
| method="setIoPortPower" | The requested method. |
| error.code=<integer> | The error code. |
| error.message=<string> | The error message for the corresponding error code. |

| Code | Description |
| --- | --- |
| 300 | IO Port Power is not supported. |
| 301 | Unable to set IO Port Power to its new state. |
| 302 | Invalid parameter value for set IO Port Power. |

| Code | Description |
| --- | --- |
| 100 | The requested API version is not supported. |
| 4001 | Mandatory input parameters was not found in the input. |
| 4002 | The type of a provided JSON parameter was incorrect. |
| 8000 | Internal error. |

