# Network settings API

**Source:** https://developer.axis.com/vapix/network-video/network-settings-api/
**Last Updated:** Aug 27, 2025

---

# Network settings API

## Overview​

### addVlan​

### getNetworkInfo​

### getSupportedVersions​

### removeVlan​

### scanWLANNetworks​

### setDeviceConfiguration​

### setHostnameConfiguration​

### setIPv4AddressConfiguration​

### setIPv6AddressConfiguration​

### setGlobalProxyConfiguration​

### setResolverConfiguration​

### setWired8021XConfiguration​

### setWlanConfiguration​

### setWLANStationConfiguration​

### testWLANStationSettings​

### wlanSwitchAPToStation​

## Identification​

### Obsoletes​

## Common examples​

### Add a new VLAN​

### Read network configuration​

### Retrieve switch port information​

### Retrieve supported API versions​

### Remove a VLAN​

### Assign a static hostname​

### Assign the WLAN country code​

### Assign a static IPv4 address​

#### Enable classless static routes via DHCP​

### Assign a global proxy configuration​

### Assign a static DNS resolver configuration​

### Enable automatic sub-network configuration​

#### Enable link-local IPv4 address configuration as DHCP fallback​

#### Enable a link-local IPv4 address configuration to always be on​

### Enable automatic network configuration via DHCP​

#### Enable IPv4 address configuration via DHCP with static fallback​

#### Enable IPv4 address configuration via DHCP with no static fallback​

#### Enable hostname configuration via DHCP​

#### Enable global proxy configuration​

#### Enable DNS resolver configuration via DHCP​

### Assign a wired 802.1X configuration​

### Assign a wired MACsec PSK configuration​

### WLAN station configuration​

### Test current WLAN station settings​

### Assign an IPv6 address configuration​

### Configure a network interface device​

#### Disable a network interface device​

### Connect to an access point in installation mode​

## API specification​

### addVlan​

### getNetworkInfo​

#### TCP ECN mode values​

#### Device switching mode values​

#### Network interface device types​

#### IP address configuration modes​

#### Link-local modes​

#### IP address origin values​

#### IP address scope values​

#### Wired link mode values​

#### Wired 802.1X authentication modes​

#### IEEE 802.1X PEAP version​

#### IEEE 802.1X PEAP label​

#### WLAN station 802.1X authentication modes​

#### WLAN access point 802.1X authentication modes​

#### IEEE 802.1X authentication status​

#### IEEE 802.1X EAPoL version values​

#### Network interface device static state values​

#### Network interface device state values​

### getSupportedVersions​

### removeVlan​

### scanWLANNetworks​

### setDeviceConfiguration​

### setHostnameConfiguration​

### setIPv4AddressConfiguration​

#### Error codes​

#### Sub-codes​

### setIPv6AddressConfiguration​

#### Error codes​

#### Sub-codes​

### setGlobalProxyConfiguration​

#### Error codes​

#### Sub-codes​

### setResolverConfiguration​

#### Error codes​

#### Sub-codes​

### setWired8021XConfiguration​

#### Sub-codes​

### setWlanConfiguration​

#### Sub-codes​

### setWLANStationConfiguration​

#### Error codes​

### testWLANStationSettings​

#### Error codes​

### wlanSwitchAPToStation​

#### Error codes​

### General error codes​

The VAPIX® Network settings API makes it possible to configure network related functionality on an Axis device (hereafter referred to as "device"). Several different versions exists of the API, all of which can be supported simultaneously.

Terminology

The APIs are accessible through a single CGI, that can be called using HTTP POST with JSON formatted data as input. The API consists of multiple methods, where each one generally concerns a group of related network parameters. The methods are:

An API call includes the API version and, optionally, a context, method name and input parameters. The sole exception is the method getSupportedVersions, where the API version is ignored and therefore optional.

This method adds a new VLAN attached to an existing network interface.

This method retrieves the network configuration and additional relevant information from the device. This information is divided into sections, such as:

A system section, and a list of network interface devices present on the device, as well as the following network parameters:

Hostname

DNS resolver settings

TCP ECN mode

These parameters are not network interface device specific, but all network interface devices have some common parameters, such as name, type, MAC address and sections for supported IP address configurations such as IPv4 and IPv6. Depending on the interface device type and device model, they may also have sections containing specific functionality. For compatible device types, see Network interface device types.

A section containing a configuration called "wired", which can be found in network interface devices of the type ‘wired’. Configuration of this may be required if the device is connected to a network switch that does not support auto-negotiation of transmission speed and duplex mode. For possible wired link modes see Wired link mode values.

A section called "wlan", which can be found in interface devices of the WLAN type. This section may also have a section called "station" and "accessPoint", but only when the network interface device has support for WLAN station.

A section called "switchPort", which can be found in interface devices of the swith port type. This section also contains information about the port number and their stored remote MAC addresses.

The IP sections (IPv4 and IPv6), that will be available if the interface device supports the corresponding address family. It contains general settings such as:

If the IP protocols are enabled.

Their configuration mode, which includes address configurations, default router and the statically assigned address configurations.

The default router.

Possible configuration modes, which can be found in IP address configuration modes.

The IP (v4) link-local mode configuration is used to configure the procedure when assigning a link-local address. See Link-local modes for a list of supported modes

The static IP (v4 or v6) address configurations used when the network interface device does not receive the expected configuration from the network. Network interface devices have a static IP address with a default value that can be changed. Setting at least one static IP address configuration will replace any existing configuration for the network interface device. For the possible values of the address scope, see IP address scope values, and for address origin, see IP address origin values. The corresponding static default router value used when a static IP address configuration is active.

This method is used to discover the supported API versions. It is not coupled with any specific API version and consequently does not require the API version argument when invoked.

This method removes the requested VLAN from the device.

This method is used to scan for available WLAN networks for a specified WLAN network interface.

Please note that this functionality is only available on interface devices of the WLAN type with indicated support for station in getNetworkInfo. See Read network configuration for information on how to determine if your device has WLAN station support.

This method is used to configure network interface devices on an Axis device. It can, for example, be used to persistently disable network interface devices.

This method is used to configure a static hostname on the device or configure the device to automatically switch to a host name assigned to it by a DHCP server on the network. The latter only applies if a host name has been received.

In order to receive a DHCP server assigned host name, the device must have an automatic IP address configuration via DHCP enabled. See Enable automatic network configuration via DHCP on how to do this.

This method is used to set up a static IPv4 address configuration on a network interface device, but also to configure the network interface device to automatically switch to an IPv4 address configuration assigned by a DHCP server on the network. The latter only applies when such a configuration has been received. Additionally, a link-local address configuration mode can be set.

The functionality described here is only available on interface devices that have indicated support for IPv4 in getNetworkInfo. For more information on how to determine if IPv4 is supported, see Read network configuration.

This method is used to toggle IPv6 on a network interface device.

The functionality is only available on interface devices that have indicated support for IPv6 in getNetworkInfo. For information on how to determine if IPv6 is supported, see Read network configuration.

This method configures the global proxy configuration on the Axis device. It can be used by all services supporting global proxy configuration.

Please note that the Axis device must be rebooted for the global proxy settings to take effect.

This method is used to set a static domain name server (DNS) configuration on the device, but also to configure the device to use DNS servers supplied by a DHCP server. Note that name servers provided via DHCP are only used if the DHCP server offers them.

In order to receive a DHCP server assigned DNS resolver configuration, the device must have automatic IPv4 address configuration via DHCP enabled. See Enable automatic network configuration via DHCP on how to do this.

This method is used to configure 802.1X for a wired network interface device.

Note that the functionality is only available on wired interface devices that have indicated support for wired 802.1X in getNetworkInfo. For more information on how to determine if 802.1X is supported on the network interface device, see Read network configuration.

This method is used to configure device independent WLAN settings and provides the ability to set the regular domain used by all WLAN devices in station mode.

This functionality is only available on products that support WLAN, or when a WLAN device is present on the system.

This method is used when you want to configure the WLAN station access control for a specified WLAN interface. This functionality is only available on devices that has an indicated support for WLAN station, which you can determine by using the getNetworkInfo method. For more information on how you set up the configuration, see setWLANStationConfiguration.

To see if an interface device has WLAN station support see Read network configuration.

This method triggers a test of the WLAN station settings on the network interface device to confirm that they are correct and it can connect to the WLAN Access Point.

Note that this functionality is only available on network interface devices of type wlan which has indicated support for WLAN stations in getNetworkInfo. To discover if an interface device has WLAN station support see Read network configuration.

This method makes the Axis device in installation mode switch from AP to Station mode. Installation mode is a special mode in which the device is running an access point accessible by the user via a mobile device that lets them configure a WLAN network. This method can then be used to stop the access point and connect your device to the configured WLAN network.

Please note that is only available on interface devices with WLAN that has indicated support for the installation mode in getNetworkInfo where you are able to see if an access point is active. See Read network configuration for more information regarding device support for the installation mode.

For information about API Discovery service, see API Discovery service.

The AXIS OS version can be obtained either by requesting the parameter root.Properties.Firmware.Version or by using the Basic device information.

This CGI renders the process of retrieving and configuring the Network group of parameters through param.cgi obsolete, as it implements more modern methods. On devices that have both the old CGI and the Network settings API, using either will yield the same result.

Use this example to set up your Axis device to support VLAN.

Add VLAN

JSON input parameters

Successful response

Error response

See addVlan for further instructions.

Use this example to see the device’s current network configuration and verify if it has been set up correctly, or otherwise identify the settings that need to be modified.

Get network settings and parameters

Retrieve the current network configuration from the device by using the following request:

JSON input parameters

Successful response

Error response

See getNetworkInfo for further instructions.

Use this example to check which devices are connected to the switch ports on your Axis device.

Get switch port information

Retrieve the current network information from your Axis device to see the switch port information using the following command:

JSON input parameters

Parse the JSON response.

Successful response

Error response

See getNetworkInfo for further instructions.

Use this example to retrieve information about the supported API version that can be used to communicate with the device.

Get a list of supported API versions

Navigate to the device management page to add a device, then use the following method to obtain information on which API versions the device supports:

JSON input parameters

Successful response

Error response

See getSupportedVersions for further instructions.

Use this example to remove a VLAN from your Axis device.

Remove VLAN

JSON input parameters

Successful response

Error response

See removeVlan for further instructions.

Use this example to assign a specific hostname to a device.

Set static hostname configuration

Disable the DHCP hostname auto configuration on the device and set a static hostname for it.

JSON input parameters

Successful response

Error response - API version not supported

Error response - Invalid parameter

See setHostnameConfiguration for further instructions.

Use this example to configure the country code used by the WLAN device to make sure that the correct regulatory settings are used.

Set country code

Apply a new country code on your Axis device.

JSON input parameters

Successful response

Error response

See setWlanConfiguration for further instructions.

Use this example to set the device to use a particular, static IPv4 address configuration.

Set a static IPv4 address configuration

Disable the automatic IPv4 address assignment and set a static IPv4 address configuration through the following request:

JSON input parameters

Successful response

Error response

See setIPv4AddressConfiguration for further instructions.

Use this example to enable classless static routes options on the DHCP client.

Enable classless static routes

Disable the automatic IPv4 address assignment and set a static IPv4 address configuration through the following request:

JSON input parameters

Successful response

Error response

See setIPv4AddressConfiguration for further instructions.

Use this example to use a global proxy configuration.

Set global proxy configuration

Set the desired global proxy and apply the settings with the request described below.

JSON input parameters

Successful response

Error response - API version is not supported

Error response - Invalid parameter

See setGlobalProxyConfiguration for further instructions.

Use this example to use a specific DNS resolver configuration.

Set static DNS resolver configuration

Disable the DHCP auto configuration in the DNS resolver settings and set a static DNS resolver configuration.

JSON input parameters

Successful response

Error response - API version is not supported

Error response - Invalid parameter

See setResolverConfiguration for further instructions.

Use this example to make the device automatically obtain a link-local address from the sub-network. This will resolve IP address conflicts independent of the DHCP server.

Enable an automatic link-local IPv4 address assignment on the device to be used as a fallback if DHCP fails.

JSON input parameters

For information regarding successful and error examples, see Assign a static IPv4 address.

See setIPv4AddressConfiguration for further instructions.

Enable an automatic link-local IPv4 address assignment on the device even when a DHCP server is available on the network.

JSON input parameters

For information regarding successful and error examples, see Assign a static IPv4 address.

See setIPv4AddressConfiguration for further instructions.

Use this example to make the device obtain an IPv4 address configuration, DNS resolver configuration and hostname from a DHCP server present on the network instead of doing it manually.

Enable an automatic IPv4 address assignment on the device. In the event that DHCP fails it will fallback to using a static address.

JSON input parameters

For information regarding successful and error examples, see Assign a static IPv4 address.

See setIPv4AddressConfiguration for further instructions.

Enable an automatic IPv4 address assignment on the device. In the event that DHCP fails it will not fallback to using a static address.

JSON input parameters

For information regarding successful and error examples, see Assign a static IPv4 address.

See setIPv4AddressConfiguration for further instructions.

Enable an automatic hostname assignment on the device. Automatic IPv4 address assignment via DHCP must be enabled for this feature to work.

JSON input parameters

For information regarding success and error examples, see Assign a static hostname.

See setHostnameConfiguration for further instructions.

Use this example to enable global proxy configuration on your Axis device. Please note that the device must be restarted before the settings take effect.

JSON input parameters

Successful response

Error response - API version is not supported

Error response - Invalid parameter

See setGlobalProxyConfiguration for further instructions.

Enable an automatic DHCP resolver configuration on the device. Automatic IPv4 address assignment via DHCP must be enabled for this feature to work.

JSON input parameters

For information regarding success and error examples, see Assign a static DNS resolver configuration.

See setResolverConfiguration for further instructions.

Use this example to setup the device on a network that requires 802.1X authentication.

Set wired 802.1X configuration

Start by using the following request:

JSON input parameters

Successful response

Error response - API version not supported

Error response - Invalid parameter

See setWired8021XConfiguration for further instructions.

Use this example to setup an Axis device on a network requiring MACsec PSK connectivity.

Set wired MACsec PSK configuration

Please note that this method is only applicable for wired interfaces. Use getNetworkInfo to find out if wired MACsec PSK is supported. All code listings are examples. See references for a detailed description of each API command.

Start by using the following request:

JSON input parameters

Successful response

Error response - API version not supported

Error response - Invalid parameter

If the configuration is successful and the network device which it was configured on is active, a new virtual MACsec network device called macsec0 will be created. The created network device will inherit the configuration from the device it was created from, which means that during setup it will use the configuration that the originating device was using unless explicitly overridden.

If the MACsec association is successful, the MACsec network device will be activated and layer 3 services (such as IPv4 and IPv6) will be started, will go into idle mode. This will stop the layer 3 services to make sure that it does not conflict with the MACsec network device.

See setWired8021XConfiguration for further instructions.

Use this example to connect your device to a WLAN access point. This functionality is only available on interface devices of the WLAN type with indicated support for station in getNetworkInfo. See Read network configuration for information on how to determine if your device has WLAN station support.

Retrieve WLAN station scan

Scan and retrieve a list of available wireless networks using the following request:

JSON input parameters

The scan will search for available wireless networks and yield one of the following responses depending on the success of the request.

Successful response

Error response - API version not supported

Error response - Invalid parameter

See scanWLANNetworks for further instructions.

Use this example to confirm that the device can connect to the WLAN access point. This functionality is only available on interface devices of the type wlan which have indicated support for WLAN stations. For more information, see Read network configuration.

Set WLAN station configuration

Set the WLAN station authentication on your device with the following request:

JSON input parameters

Successful response

Error response - API version not supported

Error response - Parameter failure

See testWLANStationSettings for further instructions.

Perform a WLAN station connection test

Start the WLAN station settings test with the following request:

JSON input parameters

Successful response

Error response - Authentication failed

Error response - Request not supported by device

See testWLANStationSettings for further instructions.

Use this example to set up your Axis device to a network that uses IPv6.

Set IPv6 address configuration

Enable IPv6 configurations on your device by using the following request:

JSON input parameters

Successful response

Error response - API version is not supported

Error response - Invalid parameter

See setIPv6AddressConfiguration for further instructions.

Use this example to configure a network interface device on an Axis device.

JSON input parameters

Parse the JSON response.

Successful response example.

Error response example 1

The following error response demonstrates a response where the requested API version is not supported.

Error response example 2

The following error response demonstrates a response with the error Invalid parameter(s) (4004) which also contains a subCode. The sub code specifies which parameter that was deemed invalid.

See setDeviceConfiguration for further instructions.

Use this example to activate installation mode on your device and configure the WLAN station settings before connecting to the configured network.

Connect to a WLAN access point using the following command:

JSON input parameters

Parse the JSON response.

Successful response example

Error response example

See wlanSwitchAPToStation for further instructions.

Adds a new VLAN. The call verifies that the master device that should be used as the main interface for the VLAN exists. It will also ensure that no duplicates are added if the VLAN already exists.

Request

Request body syntax

Return value - Success

Returns a success code and description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on error codes.

Sub codes

Retrieves the current network configuration and network-related parameters for the device.

Request

Request body syntax

Return value - Success

Returns a snapshot of the complete network configuration on a device.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on error codes.

Retrieves a list of supported API versions.

Request

Request body syntax

Return value - Success

Return a list of supported API versions.

Response body syntax

Return value - Error

Returns an error code and description.

Response body syntax

See General error codes for information on error codes.

Removes an existing VLAN.

Request

Request body syntax

Return value - Success

Returns a success code and description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on error codes.

Sub codes

Scans for available WLAN networks.

Request

Request body syntax

Return value - Success

Returns a success code and description.

Response body syntax

WLAN frequency bands

WLAN authentication modes

WLAN security version

Return value - Error

Response body syntax

See General error codes for information on error codes.

Error codes

Sub codes

Set the network interface device configuration.

Request

Request body syntax

Return value - Success

Returns an empty response.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on error codes.

Error codes

Configure how the device selects a hostname, with the possibility to set a static hostname and/or enable auto-configuration by DHCP.

Request

Request body syntax

Return value - Success

Returns a success code and a description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on error codes.

Configure how the device selects an IPv4 address. This includes setting a static address and/or enable auto-configuration by DHCP. The latter can also be modified to either fall back to, or skip, using a static address in the event that DHCP fails.

Modifying the active IPv4 address configuration may disrupt the network connection between the device and the client, which is why this method will return once its input parameters have been validated, but before the network re-configuration is activated. In the event that the re-configuration fails, it is returned to its prior state and an error is written in the device’s system log.

Request

Request body syntax

Return value - Success

Returns a success code and description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on additional error codes.

Configure IPv6 on your device.

Modifying the active IPv6 address configuration may disrupt the network connection between the device and the client, which is why this method will return once its input parameters have been validated, but before the network re-configuration is activated. In the event that the re-configuration fails, it is returned to its prior state and an error is written in the device’s system log.

Request

Request body syntax

Return value - Success

Response body syntax

Return vale - Error

Response body syntax

See General error codes for information on additional error codes.

Configure how the Axis device connects to the network.

Request

Return value - Success

Returns a success code and a description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for additional error codes.

Configure how the device selects a DNS resolver configuration by either setting up a static configuration and/or enabling an auto-configuration by DHCP.

Request

Return value - Success

Returns a success code and a description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for additional error codes.

Configure how and if the device uses 802.1X authentication on the wired network interface.

Request

Request body syntax

Return value - Success

Returns a success code and a description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on additional error codes.

Apply the WLAN configuration used by WLAN devices. Only regulatory domains can be set.

Request

Request body syntax

Return value - Success

Returns a success code and a description.

Response body syntax

Return value - Error

Response body syntax

See General error codes for information on additional error codes.

Configure the connection to a WLAN access point.

Request

Request body syntax

Return value - Success

Return value - Error

Response body syntax

See General error codes for information on error codes.

Sub-codes

Perform a test on the WLAN interface by trying to connect and authenticate using the current settings. Missing certificates will result in the "WLAN configuration is incomplete" error.

Request

Request body syntax

Return value - Success

Returns a success code and description. A failed test does not need to result in an error as it can also be treated as a success with a specific code and message explaining what happened.

Response body syntax

Success codes

Return value - Error

Returns an error code and a description.

Response body syntax

See General error codes for additional error codes.

Please note that In the error messages in the table above, the word "device" is used to refer to a network interface device.

Connect to a configured access point when your device is in installation mode. A device is in installation mode if the WLAN device in the response from getNetworkInfo have both wlan.accessPoint.enabled and wlan.accessPoint.installationModeSupported set to true.

Request

JSON input parameters

Return value - Success

Returns a success code and a description. Please note that a successful response doesn’t mean that a connection was established, only that the connection process itself was successful started. How this result is communicated to the user is device specific and found in the user manual.

Response body syntax

Success codes

Return value - Error

Returns an error code and a description.

Response body syntax

Sub codes

See General error codes for additional error codes.

Please note that In the error messages in the table above, the word "device" is used to refer to a network interface device.

The following error codes are used by most API methods. During an ERROR_INTERNAL the HTTP response code is 500, where as during other errors the HTTP response code is 200.

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addVlan",    "params": {        "masterDeviceName": "eth0",        "VlanId": 4    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addVlan",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "addVlan",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNetworkInfo"}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getNetworkInfo",    "data": {        "system": {            "tcpEcnMode": "acceptAndInitiate",            "deviceSwitching": {                "mode": "auto",                "devices": ["eth0", "eth1"],                "manualActiveDevices": ["eth0"],                "activeDevices": ["eth0"]            },            "hostname": {                "useDhcpHostname": true,                "hostname": "somehostname",                "staticHostname": "somestatichostname"            },            "resolver": {                "useDhcpResolverInfo": true,                "nameServers": ["192.168.0.1", "fd::1"],                "staticNameServers": ["192.168.0.8", "192.168.0.4"],                "maxSupportedStaticNameServers": 3,                "searchDomains": ["example.com"],                "staticSearchDomains": ["something.net", "something-else.org"],                "maxSupportedStaticSearchDomains": 6,                "domainName": "axis.com",                "staticDomainName": "abczxcqwe.se"            }        },        "devices": [            {                "name": "eth0",                "type": "wired",                "macAddress": "ac:cc:8e:68:8e:c4",                "partOfBridge": "",                "link": true,                "state": "up",                "staticState": "up",                "IPv4": {                    "enabled": true,                    "configurationMode": "dhcp",                    "linkLocalMode": "off",                    "addresses": [                        {                            "address": "169.168.0.165",                            "prefixLength": 24,                            "origin": "dchp",                            "scope": "global",                            "broadcast": "192.168.0.255"                        },                        {                            "address": "169.254.211.16",                            "prefixLength": 16,                            "origin": "linkLocal",                            "scope": "link"                        }                    ],                    "maxSupportedStaticAddressConfigurations": 1,                    "staticAddressConfigurations": [                        {                            "address": "192.168.0.90",                            "prefixLength": 24,                            "broadcast": "192.168.0.255"                        }                    ],                    "defaultRouter": "192.168.0.1",                    "staticDefaultRouter": "192.168.0.1"                },                "IPv6": {                    "enabled": true,                    "configurationMode": "dhcp",                    "addresses": [                        {                            "address": "fe80::240:8cff:felb:eef5",                            "prefixLength": 64,                            "origin": "linkLocal",                            "scope": "link"                        },                        {                            "address": "fd1c:360:4e4d:a5b2::e42",                            "prefixLength": 128,                            "origin": "dhcp",                            "scope": "site"                        }                    ]                },                "wired": {                    "linkMode": "auto",                    "8021X": {                        "enabled": false,                        "status": "authorized",                        "mode": "WPA-Enterprise-EAPTLS",                        "configurations": [                            {                                "mode": "WPA-Enterprise-EAPTLS",                                "params": {                                    "identity": "Lobby",                                    "eapolVersion": "EAPoLv2"                                }                            }                        ],                        "supportedModes": ["WPA-Enterprise-EAPTLS"]                    }                }            },            {                "name": "eth1",                "type": "wlan",                "macAddress": "ac:cc:8e:68:8e:c4",                "partOfBridge": "",                "link": false,                "state": "up",                "staticState": "up",                "wlan": {                    "station": {                        "activeSsid": "lobby",                        "8021X": {                            "enabled": true,                            "staus": "Stopped",                            "mode": "none",                            "configurations": [                                {                                    "mode": "WPA-Personal-PSK",                                    "params": {                                        "is_psk_set": false                                    }                                },                                {                                    "mode": "WPA-Personal-HEX",                                    "params": {                                        "is_hex_set": false                                    }                                },                                {                                    "mode": "WPA-Enterprise-PEAP-MSCHAPv2",                                    "params": {                                        "identity": "",                                        "is_password_set": false,                                        "eapolVersion": "EAPoLv1",                                        "peapVersion": 1,                                        "label": 1                                    }                                },                                {                                    "mode": "WPA-Enterprise-EAPTLS",                                    "params": {                                        "identity": "",                                        "eapolVersion": "EAPoLv1"                                    }                                }                            ],                            "supportedModes": [                                "none",                                "WPA-Personal-PSK",                                "WPA-Personal-HEX",                                "WPA-Enterprise-PEAP-MSCHAPv2",                                "WPA-Enterprise_EAPTLS"                            ]                        }                    },                    "accessPoint": {                        "ssid": "hazelnut",                        "enabled": false,                        "authenticationMode": "WPA-Personal-PSK",                        "installationModeSupported": true                    }                },                "IPv4": {                    "enabled": true,                    "configurationMode": "dhcp",                    "linkLocalMode": "off",                    "addresses": [],                    "maxSupportedStaticAddressConfigurations": 1,                    "staticAddressConfigurations": [                        {                            "address": "192.168.0.90",                            "prefixLength": 24,                            "broadcast": "192.168.0.225"                        }                    ],                    "defaultRouter": "",                    "staticDefaultRouter": "dhcp"                }            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo"}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo",    "data": {        "system": {            "tcpEcnMode": "acceptAndInitiate",            "deviceSwitching": {                "mode": "manual",                "devices": ["br0", "eth0", "eth1", "eth1.1", "eth1.2", "eth1.3", "eth1.4"],                "manualActiveDevices": ["br0", "eth0"],                "activeDevices": ["br0", "eth0"]            },            "hostname": {                "useDhcpHostname": true,                "hostname": "ax-00408c1886d6",                "staticHostname": "ax-00408c1886d6"            },            "resolver": {                "useDhcpResolverInfo": true,                "nameServers": [],                "staticNameServers": [],                "maxSupportedStaticNameServers": 3,                "searchDomains": [],                "staticSearchDomains": [],                "maxSupportedStaticSearchDomains": 6,                "domainName": "",                "staticDomainName": ""            }        },        "devices": [            {                "name": "eth0",                "type": "wired",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "state": "up",                "staticState": "up",                "wired": {                    "linkMode": "auto",                    "8021X": {                        "enabled": false,                        "status": "Stopped",                        "mode": "WPA-Enterprise-EAPTLS",                        "configurations": [                            {                                "mode": "WPA-Enterprise-EAPTLS",                                "params": {                                    "identity": "",                                    "eapolVersion": "EAPoLv1"                                }                            }                        ],                        "supportedModes": ["WPA-Enterprise-EAPTLS"]                    }                }            },            {                "name": "eth1",                "type": "wired",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "",                "link": true,                "state": "up",                "staticState": "up",                "wired": {                    "linkMode": "auto",                    "8021X": {                        "enabled": false,                        "status": "Stopped",                        "mode": "WPA-Enterprise-EAPTLS",                        "params": {                            "identity": "",                            "eapolVersion": "EAPoLv1"                        }                    }                },                "supportedModes": ["WPA-Enterprise-EAPTLS"]            },            {                "name": "eth1.1",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 1,                    "remoteAddresses": ["AC:CC:8E:00:00:01"]                }            },            {                "name": "eth1.2",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 2,                    "remoteAddress": ["AC:CC:8E:00:00:02"]                }            },            {                "name": "eth1.3",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 3,                    "remoteAddress": ["AC:CC:8E:00:00:03"]                }            },            {                "name": "eth1.4",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": false,                "switchPort": {                    "portNumber": 4,                    "remoteAddress": []                }            },            {                "name": "br0",                "type": "bridge",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "",                "link": true,                "IPv4": {                    "enabled": true,                    "configurationMode": "dhcp",                    "addresses": [                        {                            "address": "192.168.0.19",                            "prefixLength": 24,                            "origin": "dhcp",                            "scope": "global",                            "broadcast": "192.168.0.255"                        }                    ],                    "maxSupportedStaticAddressConfigurations": 1,                    "staticAddressConfigurations": [                        {                            "address": "192.168.0.90",                            "prefixLength": 24,                            "broadcast": "192.168.0.255"                        }                    ],                    "defaultRouter": "192.168.0.1",                    "staticDefaultRouter": "192.168.0.1"                },                "Ipv6": {                    "enabled": true,                    "addresses": [                        {                            "address": "fe80::240:8cff:fe18:86d6",                            "prefixLength": 64,                            "origin": "linkLocal",                            "scope": "link"                        }                    ]                }            }        ]    }}
```

```
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "3.1",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "supportedVersions": ["1.0", "2.4", "3.1"]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "removeVlan",    "params": {        "VlanName": "eth0.4"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "removeVlan",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "removeVlan",    "error": {        "code": 1000,        "message": "Internal error",        "details": {            "subCode": 200        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setHostnameConfiguration",    "params": {        "useDhcpHostname": false,        "staticHostname": "mystatichostname"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setHostnameConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setHostnameConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setHostnameConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.27",    "context": "abc",    "method": "setWlanConfiguration",    "params": {        "countryCode": "DE"    }}
```

```
{    "apiVersion": "1.27",    "context": "abc",    "method": "setWlanConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.27",    "context": "abc",    "method": "setWlanConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "configurationMode": "static",        "staticDefaultRouter": "192.168.0.1",        "staticAddressConfigurations": [            {                "address": "192.168.0.90",                "prefixLength": 16,                "broadcast": "192.168.255.255"            }        ]    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 107        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.29",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "useDHCPStaticRoutes": true    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 107        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxyConfiguration",    "params": {        "httpProxy": "http://208.67.222.1:8080",        "httpsProxy": "https://208.67.222.2:8080"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "params": {        "useDhcpResolverInfo": false,        "staticNameServers": ["208.67.222.222", "208.67.220.220"],        "staticSearchDomains": ["axis.com", "axis.se"],        "staticDomainName": "mylocaldoma.in"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.21",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "linkLocalMode": "fallback"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.21",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "linkLocalMode": "on"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.21",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "configurationMode": "dhcp",        "useStaticDHCPFallback": true    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.21",    "context": "abc",    "method": "setIPv4AddressConfiguration",    "params": {        "deviceName": "eth0",        "configurationMode": "dhcp",        "useStaticDHCPFallback": false    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setHostnameConfiguration",    "params": {        "useDhcpHostname": true    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "params": {        "useDhcpResolverInfo": false,        "staticNameServers": ["208.67.222.222", "208.67.220.220"],        "staticSearchDomains": ["axis.com", "axis.se"],        "staticDomainName": "mylocaldoma.in"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setGlobalProxiesConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setResolverConfiguration",    "params": {        "useDHCPResolvInfo": true    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "params": {        "deviceName": "eth0",        "enabled": true,        "mode": "WPA-Enterprise-EAPTLS",        "identity": "Lobby",        "eapolVersion": "EAPoLv2"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "params": {        "deviceName": "eth0",        "enabled": true,        "mode": "MACsec-PSK",        "mkaCAK": "00112233445566771111111111111111",        "mkaCKN": "caffee"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "setWired8021XConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 100        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.14",    "context": "abc",    "method": "scanWLANNetworks",    "params": {        "deviceName": "wlan0",        "refresh": true    }}
```

```
{    "apiVersion": "1.14",    "context": "abc",    "method": "scanWLANNetworks",    "data": {        "networks": [            {                "ssid": "lobby",                "band": "2.4Ghz",                "channel": 2,                "signalStrengthDBm": -57,                "security": [                    {                        "authentication": "PSK",                        "version": "WPA1"                    }                ]            },            {                "ssid": "Conference",                "band": "5GHz",                "channel": 36,                "signalStrengthDBm": -62,                "security": [                    {                        "authentication": "PSK",                        "version": "WPA2"                    },                    {                        "authentication": "IEEE 802.1X",                        "version": "WPA2"                    }                ]            },            {                "ssid": "free",                "band": "2.4GHz",                "channel": 0,                "signalStrengthDBm": -55,                "security": [                    {                        "authentication": "None"                    }                ]            }        ]    }}
```

```
{    "apiVersion": "1.14",    "context": "abc",    "method": "scanWLANNetworks",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.14",    "context": "abc",    "method": "scanWLANNetworks",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 101        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.12",    "context": "abc",    "method": "setWLANStationConfiguration",    "params": {        "deviceName": "wlan0",        "ssid": "lobby",        "authentication": {            "mode": "WPA-Enterprise-PEAP-MSCHAPv2",            "params": {                "identity": "user",                "password": "guest",                "eapolVersion": "EAPoLv2",                "peapVersion": "PEAPv1",                "label": 1            }        }    }}
```

```
{    "apiVersion": "1.12",    "context": "abc",    "method": "setWLANStationConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.12",    "context": "abc",    "method": "setWLANStationConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.12",    "context": "abc",    "method": "setWLANStationConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 104        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size in bytes of JSON input parameters below>
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "testWLANStationSettings",    "params": {        "deviceName": "eth1",        "timeout": 5    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "testWLANStationSettings",    "data": {        "code": 0,        "message": "Authentication successful"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "testWLANStationSettings",    "data": {        "code": 1,        "message": "Authentication failed"    }}
```

```
{    "apiVersion": "1.0",    "context": "abc",    "method": "testWLANStationSettings",    "error": {        "code": 5001,        "message": "Invalid device supplied"    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "setIPv6AddressConfiguration",    "params": {        "deviceName": "eth0",        "enabled": true    }}
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "setIPv6AddressConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "setIPv6AddressConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.6",    "context": "abc",    "method": "setIPv6AddressConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 101        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.17",    "context": "abc",    "method": "setDeviceConfiguration",    "params": {        "deviceName": "deviceName",        "staticState": "down"    }}
```

```
{    "apiVersion": "1.17",    "context": "abc",    "method": "setDeviceConfiguration",    "data": {}}
```

```
{    "apiVersion": "1.17",    "context": "abc",    "method": "setDeviceConfiguration",    "error": {        "code": 4001,        "message": "The specified version is not supported"    }}
```

```
{    "apiVersion": "1.17",    "context": "abc",    "method": "setDeviceConfiguration",    "error": {        "code": 4004,        "message": "Invalid parameter(s)",        "details": {            "subCode": 101        }    }}
```

```
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
```

```
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation"}
```

```
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation",    "data": {        "code": 0,        "message": "Connection process started"    }}
```

```
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation",    "error": {        "code": 1000,        "message": "Internal error"    }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "addVlan",  "params":{    "masterDeviceName": <string>,    "VlanId": <integer>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "addVlan",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "addVlan",  "error": {    "code": <integer>,    "message": <string>    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNetworkInfo",  "params":{}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNetworkInfo",  "data": {    "system": {      "tcpEcnMode": <string>,      "wlan": {        "countryCode": <string>,        "countryCodeLock": <boolean>      },      "deviceSwitching": {        "mode": <string>,        "devices": [<string>],        "manualActiveDevices": [<string>],        "activeDevices": [<string>]      },      "hostname": {        "useDhcpHostname": <boolean>,        "hostname": <string>,        "staticHostname": <string>      },      "resolver": {        "useDHCPResolverInfo": <boolean>,        "nameServers": [<string>],        "staticNameServers": [<string>],        "maxSupportedStaticNameServers": <integer>,        "searchDomains" [<string>],        "staticSearchDomains": [<string>],        "maxSupportedStaticSearchDomains": <integer>,        "domainName": <string>,        "staticDomainName": <string>      },      "globalProxies": {        "httpProxy": <string>,        "httpsProxy": <string>,        "noProxy": <string>      },    }    "devices": [      {        "name": <string>,        "type": <string>,        "macAddress": <string>,        "partOfBridge": <string>,        "link": <boolean>,        "state": <string>,        "staticState": <string>,        "IPv4": {          "enabled": <boolean>,          "configurationMode": <string>,          "linkLocalMode": <string>,          "addresses": [            {              "address": <string>,              "prefixLength": <integer>,              "broadcast": <string>,              "origin": <string>,              "scope": <string>            }          ],          "maxSupportedStaticAddressConfigurations": <integer>,          "staticAddressConfigurations": [            {              "address": <string>,              "prefixLength": <integer>,              "broadcast": <string>            }          ],          "defaultRouter": <string>,          "staticDefaultRouter": <string>,          "useStaticDHCPFallback": <boolean>,          "useDHCPStaticRoutes": <boolean>        },        "IPv6": {          "enabled": <boolean>,          "configurationMode": <string>,          "addresses": [            {              "address": <string>,              "prefixLength": <integer>,              "origin": <string>,              "scope": <string>            }          ]          "maxSupportedStaticAddressConfigurations": <integer>,          "staticAddressConfigurations": [            {              "address": <string>,              "prefixLength": <integer>            }          ],          "defaultRouter": <string>,          "staticDefaultRouter": <string>        },        "wired": {          "linkMode": <string>,          "supportedLinkModes": [            <string>          ],          "isDownlink": <boolean>,          "8021X": {            "enabled": <boolean>,            "status": <string>,            "mode": <string>,            "configurations": [              {                "mode": <string>                "params": {                  "identity": <string>,                  "eapolVersion": <string>,                  "certClient": <string>,                  "certsCA": [<string>]                }                }            ]            "supportedModes": [              <string>            ],            "MACsecSecured": <boolean>          }        },        "wlan": {          "station": {            "activeSsid": <string>,            "8021X": {              "enabled": <boolean>,              "status": <string>,              "mode": <string>,              "configurations": [                {                  "mode": <string>,                  "params": {                    "is_psk_set": <boolean>                  }                },                {                  "mode": <string>,                  "params": {                    "is_hex_set": <boolean>                  }                },                {                  "mode": <string>,                  "params": {                    "identity": <string>,                    "is_password_set": <boolean>,                    "eapolVersion": <string>,                    "peapVersion": <string>,                    "label": <integer>,                    "is_mka_cak_set": <boolean>,                    "mkaCkn": <string>                  }                },                {                  "mode": <string>,                  "params": {                    "identity": <string>,                    "eapolVersion": <string>                  }                }              ],              "supportedModes": [                <string>              ]            }          },          "accessPoint": {            "ssid": <string>,            "enabled": <boolean>,            "authenticationMode": <string>,            "installationModeSupported": <boolean>          }        },        "switchPort": {          "portNUmber": <integer>,          "remoteAddress": [            <string>          ]        }      }    ]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "getNetworkInfo",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersions: <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "params": {}}
```

```
{  "apiVersions": <major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "data": {    "supportedVersions": [<string>]  }}
```

```
{  "apiVersion":<major>.<minor>,  "context": <string>,  "method": "getSupportedVersions",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "removeVlan",  "params":{    "VlanName": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "removeVlan",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "removeVlan",  "error": {    "code": <integer>,    "message": <string>    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "scanWLANNetworks",  "params":{    "deviceName": <string>,    "refresh": <boolean>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "scanWLANNetworks",  "data": {    "networks": [      {        "ssid": <string>,        "band": <string>,        "channel": <integer>,        "signalStrengthDBm": <integer>,        "security": [          {            "authentication": <string>,            "version": <string>          }        ]      }    ]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "scanWLANNetworks",  "error": {    "code": <integer>,    "message": <string>    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setDeviceConfiguration"  "params": {    "deviceName": <string>,    "staticState": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setDeviceConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setDeviceConfiguration",  "error": {    "code": <integer>,    "message": <string>,  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setHostnameConfiguration",  "params": {    "useDhcpHostname": <boolean>,    "staticHostname": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setHostnameConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setHostnameConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIPv4AddressConfiguration",  "params": {    "deviceName": <string>,    "enabled": <boolean>,    "configurationMode": <string>,    "linkLocalMode": <string>,    "staticDefaultRouter": <string>,    "staticAddressConfigurations": [      {        "address": <string>,        "prefixLength": <integer>,        "broadcast": <string>      }    ],    "useStaticDHCPFallback": <boolean>,    "useDHCPStaticRoutes": <boolean>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIPv4AddressConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  method": "setIPv4AddressConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIPv6AddressConfiguration",  "params": {    "deviceName": <string>,    "enabled": <boolean>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIPv6AddressConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setIPv6AddressConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setGlobalProxyConfiguration",  "params": {    "httpProxy": <string>,    "httpsProxy": <string>,    "noProxy": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setGlobalProxyConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setGlobalProxyConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setResolverConfiguration",  "params": {    "useDhcpResolverInfo": <boolean>,    "staticNameServers": [<string>],    "staticSearchDomains": [<string>],    "staticDomainName": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setResolverConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setResolverConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWired8021XConfiguration",  "params": {    "deviceName": <string>,    "enabled": <boolean>,    "mode": <string>,    "identity": <string>,    "password": <string>,    "eapolVersion": <string>,    "peapVersion": <string>,    "label": <integer>,    "certClient": <string>,    "certsCA": [<string>]  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWired8021XConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWired8021XConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": "<major>.<minor>",  "context": <string>,  "method": "setWlanConfiguration",  "params": {    "countryCode": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWlanConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWlanConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWLANStationConfiguration",  "params": {    "deviceName": <string>,    "ssid": <string>,    "authentication": {      "mode": <string>,      "params": {        "identity": <string>,        "password": <string>,        "eapolVersion": <string>,        "peapVersion": <string>,        "label": <integer>,        "certClient": <string>,        "certsCA": [<string>]      }    }  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWLANStationConfiguration",  "data": {}}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "setWLANStationConfiguration",  "error": {    "code": <integer>,    "message": <string>,    "details": {      "subCode": <integer>    }  }}
```

```
http://<device-address>/axis-cgi/network_settings.cgi
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "testWLANStationSettings",  "params": {    "deviceName": <string>,    "timeout": <integer>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "testWLANStationSettings",  "data": {    "code": <integer>,    "message": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "testWLANStationSettings",  "error": {    "code": <integer>,    "message": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "wlanSwitchAPToStation"}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "wlanSwitchAPToStation",  "data": {    "code": <integer>,    "message": <string>  }}
```

```
{  "apiVersion": <major>.<minor>,  "context": <string>,  "method": "wlanSwitchAPToStation",  "error": {    "code": <integer>,    "message": <string>  }}
```

- addVlan
- getNetworkInfo
- getSupportedVersions
- removeVlan
- scanWLANNetworks
- setDeviceConfiguration
- setHostnameConfiguration
- setIPv4AddressConfiguration
- setIPv6AddressConfiguration
- setGlobalProxyConfiguration
- setResolverConfiguration
- setWired8021XConfiguration
- setWlanConfiguration
- setWLANStationConfiguration
- testWLANStationSettings
- wlanSwitchAPToStation

- A system section, and a list of network interface devices present on the device, as well as the following network parameters:
- Hostname
- DNS resolver settings
- TCP ECN mode

- A section containing a configuration called "wired", which can be found in network interface devices of the type ‘wired’. Configuration of this may be required if the device is connected to a network switch that does not support auto-negotiation of transmission speed and duplex mode. For possible wired link modes see Wired link mode values.
- A section called "wlan", which can be found in interface devices of the WLAN type. This section may also have a section called "station" and "accessPoint", but only when the network interface device has support for WLAN station.
- A section called "switchPort", which can be found in interface devices of the swith port type. This section also contains information about the port number and their stored remote MAC addresses.
- The IP sections (IPv4 and IPv6), that will be available if the interface device supports the corresponding address family. It contains general settings such as:
- If the IP protocols are enabled.
- Their configuration mode, which includes address configurations, default router and the statically assigned address configurations.
- The default router.
- Possible configuration modes, which can be found in IP address configuration modes.
- The IP (v4) link-local mode configuration is used to configure the procedure when assigning a link-local address. See Link-local modes for a list of supported modes
- The static IP (v4 or v6) address configurations used when the network interface device does not receive the expected configuration from the network. Network interface devices have a static IP address with a default value that can be changed. Setting at least one static IP address configuration will replace any existing configuration for the network interface device. For the possible values of the address scope, see IP address scope values, and for address origin, see IP address origin values. The corresponding static default router value used when a static IP address configuration is active.

- API Discovery: id=network-settings
- Property: Properties.API.HTTP.Version=3
- AXIS OS: 8.50 and later

- Retrieve the current network information from your Axis device to see the switch port information using the following command:
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
JSON input parameters
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo"}
- Parse the JSON response.
Successful response
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo",    "data": {        "system": {            "tcpEcnMode": "acceptAndInitiate",            "deviceSwitching": {                "mode": "manual",                "devices": ["br0", "eth0", "eth1", "eth1.1", "eth1.2", "eth1.3", "eth1.4"],                "manualActiveDevices": ["br0", "eth0"],                "activeDevices": ["br0", "eth0"]            },            "hostname": {                "useDhcpHostname": true,                "hostname": "ax-00408c1886d6",                "staticHostname": "ax-00408c1886d6"            },            "resolver": {                "useDhcpResolverInfo": true,                "nameServers": [],                "staticNameServers": [],                "maxSupportedStaticNameServers": 3,                "searchDomains": [],                "staticSearchDomains": [],                "maxSupportedStaticSearchDomains": 6,                "domainName": "",                "staticDomainName": ""            }        },        "devices": [            {                "name": "eth0",                "type": "wired",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "state": "up",                "staticState": "up",                "wired": {                    "linkMode": "auto",                    "8021X": {                        "enabled": false,                        "status": "Stopped",                        "mode": "WPA-Enterprise-EAPTLS",                        "configurations": [                            {                                "mode": "WPA-Enterprise-EAPTLS",                                "params": {                                    "identity": "",                                    "eapolVersion": "EAPoLv1"                                }                            }                        ],                        "supportedModes": ["WPA-Enterprise-EAPTLS"]                    }                }            },            {                "name": "eth1",                "type": "wired",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "",                "link": true,                "state": "up",                "staticState": "up",                "wired": {                    "linkMode": "auto",                    "8021X": {                        "enabled": false,                        "status": "Stopped",                        "mode": "WPA-Enterprise-EAPTLS",                        "params": {                            "identity": "",                            "eapolVersion": "EAPoLv1"                        }                    }                },                "supportedModes": ["WPA-Enterprise-EAPTLS"]            },            {                "name": "eth1.1",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 1,                    "remoteAddresses": ["AC:CC:8E:00:00:01"]                }            },            {                "name": "eth1.2",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 2,                    "remoteAddress": ["AC:CC:8E:00:00:02"]                }            },            {                "name": "eth1.3",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": true,                "switchPort": {                    "portNumber": 3,                    "remoteAddress": ["AC:CC:8E:00:00:03"]                }            },            {                "name": "eth1.4",                "type": "switchPort",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "br0",                "link": false,                "switchPort": {                    "portNumber": 4,                    "remoteAddress": []                }            },            {                "name": "br0",                "type": "bridge",                "macAddress": "00:40:8c:18:86:d6",                "partOfBridge": "",                "link": true,                "IPv4": {                    "enabled": true,                    "configurationMode": "dhcp",                    "addresses": [                        {                            "address": "192.168.0.19",                            "prefixLength": 24,                            "origin": "dhcp",                            "scope": "global",                            "broadcast": "192.168.0.255"                        }                    ],                    "maxSupportedStaticAddressConfigurations": 1,                    "staticAddressConfigurations": [                        {                            "address": "192.168.0.90",                            "prefixLength": 24,                            "broadcast": "192.168.0.255"                        }                    ],                    "defaultRouter": "192.168.0.1",                    "staticDefaultRouter": "192.168.0.1"                },                "Ipv6": {                    "enabled": true,                    "addresses": [                        {                            "address": "fe80::240:8cff:fe18:86d6",                            "prefixLength": 64,                            "origin": "linkLocal",                            "scope": "link"                        }                    ]                }            }        ]    }}
Error response
{    "apiVersion": "1.9",    "context": "abc",    "method": "getNetworkInfo",    "error": {        "code": 1000,        "message": "Internal error"    }}

- Connect to a WLAN access point using the following command:
POST http://<device-address>/axis-cgi/network_settings.cgi HTTP/1.1Content-type: application/jsonContent-length: <size of JSON input parameters below>
JSON input parameters
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation"}
- Parse the JSON response.
Successful response example
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation",    "data": {        "code": 0,        "message": "Connection process started"    }}
Error response example
{    "apiVersion": "1.16",    "context": "abc",    "method": "wlanSwitchAPToStation",    "error": {        "code": 1000,        "message": "Internal error"    }}

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: POST
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

- Security level: Administrator
- Method: HTTP POST

- HTTP Code: 200 OK
- Content-Type: application/json

- HTTP Code: 200 OK
- Content-Type: application/json

| Term | Description |
| --- | --- |
| 802.1X | Port based network access control. |
| ACA | AXIS Camera Assistant is a web-browser based (web app) GUI for managing the Axis device. This web app is most often hosted on the Axis device itself. |
| ACC | AXIS Companion, a minimal VMS made by Axis Communications AB. |
| ACS | AXIS Camera Station, a VMS made by Axis Communications AB. |
| ADM | AXIS Device Manager, an installation and maintenance tool for Axis devices. |
| API | Application Programming Interface. |
| Axis device | An Axis network device (e.g. A network camera, doorbell or network speaker). |
| DHCPv4 | Dynamic Host Configuration Protocol v4, is a network configuration protocol used by a DHCP server to configure IPv4 enabled devices connected to a network, allowing them to communicate with other IPv4 enabled devices or networks. |
| DHCPv6 | Dynamic Host Configuration Protocol v6, is a network configuration protocol used by a DHCP server to configure IPv6 enabled devices connected to a network, allowing them to communicate with other IPv6 enabled devices or networks. |
| DNS | Domain Name System, used for translating domain names into IP addresses. |
| EAP | Extensible Authentication Protocol, an authentication framework for wireless networks and point-to-point connections. |
| EAP-TLS | An EAP variant using TLS. |
| EAPoL | EAP over LAN. |
| GUI | Graphical User Interface. |
| HTTP | Hyper Text Transfer Protocol, a commonly used protocol for communicating over the internet. |
| IPv4 | Internet Protocol version 4. |
| IPv6 | Internet Protocol version 6. |
| JSON | Java Style Object Notation, a standardized way of serializing data. |
| LAN | Local Area Network. |
| MAC | Media Access Control, a unique identifier assigned to a network interface controller. |
| MSCHAPv2 | Microsoft Challenge Handshake Authentication Protocol version 2, an authentication protocol for both wired and wireless networks. |
| Network interface device | A device representing a network interface (e.g. a wired network interface controller, WLAN network interface controller or a Bluetooth network interface controller). |
| TCP | Transmission Control Protocol, a protocol for controlling the transmission of data over a computer network. |
| TCP ECN | TCP Explicit Congestion Notification. It allows notifying the sender to reduce its transmission rate in order to limit network congestion. |
| TLS | Transport Layer Security, a cryptographic protocol that provides security over a network. |
| VLAN | Virtual Local Area Network. |
| VMS | Video Management System for managing network video cameras. |
| WLAN | Wireless Local Area Network. |
| WPA-Enterprise | A security protocol for enterprise networks, described in the standard IEEE 802.1X. |
| WPA-Personal | A WLAN protected access point with a pre-shared key, which can have either 64 hexadecimal digits or 8–63 characters in the form of a pass phrase. |
| TCP ECN | TCP Explicit Congestion Notification, which allows a function that notifies the sender to reduce its transmission rate in order to limit network congestion. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="removeVlan" | The method that is requested. |
| params.masterDeviceName=<string> | The network device that the VLAN should be attached to, for example ‘eth0’. |
| params.VlanName=<string> | The full name of the VLAN that should be removed, for example ‘eth0.4’. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="addVlan" | The method that is requested. |
| params.masterDeviceName=<string> | The network device that the VLAN should be attached to, for example ‘eth0’. |
| params.VlanId=<integer> | The numerical identifier for the VLAN. The VLAN will be named after its numerical identifier and master network device. An example is ‘eth0.4, where the masterDeviceName = "eth0" and VlanId = 4. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="addVlan" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="addVlan" | Optional. The requested method. This property is not present for all types of errors. |
| error.code=<integer> | An error code describing what kind of error that has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code in plain text. |
| error.details=<object> | Optional. Contains additional information about the error. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. |

| Code | Description |
| --- | --- |
| 100 | Parameter masterDeviceName error. |
| 101 | Parameter VlanId error. |
| 201 | VLAN already exists. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="getNetworkInfo" | The method that is requested. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="getNetworkInfo" | The requested method. |
| data.system=<object> | Contains network parameters that are not tied to a single network interface device. |
| data.system.tcpEcnMode=<integer> | The TCP ECN mode makes it possible to notify the sender to reduce its transmission rate in order to limit network jams. Refer to table TCP ECN mode values for possible values. |
| data.system.wlan.countryCode=<string> | The country code used to configure the regulatory domain of WLAN network devices. This field is only shown if a WLAN device is present on the system. The default value of the country code is XX, which represents that the country code has not yet been configured. |
| data.system.wlan.countryCodeLock=<boolean> | Decides if setting the country code should be allowed. The code is based on product regulatory requirements. |
| data.system.deviceSwitching=<object> | Contains the parameters related to the selection of active network interface devices(s). |
| data.system.deviceSwitching.mode=<string> | Contains the mode specifying how network interface devices are activated. See Device switching mode values for possible modes. |
| data.system.deviceSwitching.devices=[<string>] | Contains a list of available network interface devices that the system can use. The position of the devices in this list also determines their priority, where the left-most has the highest priority. |
| data.system.deviceSwitching.manualActiveDevices=[<string>] | Contains a list of network interface devices that the system will always try to bring to an active state if the device switching mode has been set to manual. |
| data.system.deviceSwitching.activeDevices=[<string>] | Contains a list of network interface devices that are currently in an active state. |
| data.system.hostname=<object> | Contains the parameter related to hostname configurations. |
| data.system.hostname.useDhcpHostname=<boolean> | Specifies whether the device should switch between using a DHCP server provided hostname over the static hostname in the event that a DHCP server provides such a hostname. |
| data.system.hostname.hostname=<string> | The hostname currently used by the system. |
| data.system.hostname.staticHostname=<string> | The static hostname. |
| data.system.resolver=<object> | Contains the parameters related to the DNS resolver configuration. |
| data.system.resolver.useDhcpResolverInfo=<boolean> | Specifies whether the device should switch between using a DHCP server provided DNS resolver configuration over the static configuration, in the event that a DHCP server provides such a configuration. |
| data.system.resolver.nameServers=[<string>] | List of name servers currently in use by the system. |
| data.system.resolver.staticNameServers=[<string>] | The statistically configured list of name servers. |
| data.system.resolver.maxSupportedStaticNameServers=<integer> | The maximum number of simultaneous static name servers. |
| data.system.resolver.searchDomains=[<string>] | List of search domains currently in use by the system. |
| data.system.resolver.staticSearchDomains=[<string>] | The statistically configured list of search domains. |
| data.system.resolver.maxSupportedStaticSearchDomains=<integer> | The maximum number of simultaneous static search domains. |
| data.system.resolver.domainName=<string> | The domain name currently in use by the system. |
| data.system.resolver.staticDomainName=<string> | The statically configured domain name. |
| data.system.globalProxies=<object> | Contains the parameters related to global proxies. |
| data.system.globalProxies.httpProxy=<string> | The global HTTP proxy currently in use by the system. Please note that any sensitive information such as passwords will be obscured. |
| data.system.globalProxies.httpsProxy=<string> | The global HTTPS proxy currently in use by the system. Please note that any sensitive information such as passwords will be obscured. |
| data.system.globalProxies.noProxy=<string> | The global no_proxy currently in use by the system. |
| data.devices=[<object>] | List of network interface devices on the device. |
| data.devices.<object>.name=<string> | Name of the network interface device. |
| data.devices.<object>.type=<string> | Type of the network interface device. See Network interface device types for possible values. |
| data.devices.<object>.macAddress=<string> | Name of the network interface device. |
| data.devices.<object>.partOfBridge=<string> | Name of a bridge network interface device used if the device is part of a bridge or as an empty string. |
| data.devices.<object>.link=<boolean> | Indicates if a link has been detected for an interface device on either the physical or lower layer on a stacked interface device. |
| data.devices.<object>.staticState=<string> | Indicates if the network interface should be up or down. |
| data.devices.<object>.state=<string> | Indicates if the network interface device is up or down. |
| data.devices.<object>.IPv4=<object> | Optional. If it is supported, contains the parameters related to IPv4 configuration. |
| data.devices.<object>.IPv4.enabled=<boolean> | Specifies if IPv4 is enabled on the network interface device. |
| data.devices.<object>.IPv4.configurationMode=<string> | Determines how the device decides which IPv4 addresses to select as active. See IP address configuration modes for possible values. |
| data.devices.<object>.IPv4.linkLocalMode=<string> | Determines how the Axis device decides when to assign a link-local address. See Link-local modes for a list of supported modes |
| data.devices.<object>.IPv4.useStaticDHCPFallback=<boolean> | Specifies if the configured static default route should be used as a fallback when a DHCP leased default router is unavailable. |
| data.devices.<object>.IPv4.useDHCPStaticRoutes=<boolean> | Specifies if the DHCP classless static routes should be used. If enabled, the DHCP leased default router will be ignored. Static routes provided by the DHCP server will be installed on the device. |
| data.devices.<object>.IPv4.addresses=[<object>] | List containing all IPv4 address configurations currently in use by the network interface device. |
| data.devices.<object>.IPv4.addresses.<object>.address=<string> | An IPv4 address currently in use by the network interface device. |
| data.devices.<object>.IPv4.addresses.<object>.prefixLength=<integer> | The subnet prefix length of the address. |
| data.devices.<object>.IPv4.addresses.<object>.broadcast=<string> | Optional. The broadcast address of the subnet. Not always available. |
| data.devices.<object>.IPv4.addresses.<object>.origin=<string> | The origin of the address. See IP address origin values for possible values. |
| data.devices.<object>.IPv4.addresses.<object>.scope=<string> | The scope of the address. See IP address scope values for possible values. |
| data.devices.<object>. IPv4.maxSupportedStaticAddressConfigurations=<integer> | The maximum number of supported simultaneous static IPv4 address configurations. |
| data.devices.<object>.IPv4.staticAddressConfigurations=[<object>] | List of static IPv4 address configurations. |
| data.devices.<object>.IPv4.staticAddressConfigurations.<object>.address=<string> | An IPv4 address in the list of static IPv4 address configurations. |
| data.devices.<object>.IPv4.staticAddressConfigurations.<object>.prefixLength=<integer> | The subnet prefix length of the address. |
| data.devices.<object>.IPv4.staticAddressConfigurations.<object>.broadcast=<integer> | Optional. The broadcast address of the subnet. Not always available. |
| data.devices.<object>.IPv4.defaultRouter=<string> | The IPv4 address of the default router currently used by the system. |
| data.devices.<object>.IPv4.staticDefaultRouter=<string> | The IPv4 address of the static default router. |
| data.devices.<object>.IPv6=<object> | Optional. If it is supported, it contains the parameters related to IPv6 configuration. |
| data.devices.<object>.IPv6.enabled=<boolean> | Specifies whether IPv6 is enabled on the network interface device. |
| data.devices.<object>.IPv6.configurationMode=<string> | Determines how the device decides which IPv6 addresses to select as active. See IP address configuration modes for supported values. |
| data.devices.<object>.IPv6.addresses=[<object>] | List containing all IPv4 address configurations currently used by the network interface device. |
| data.devices.<object>.IPv6.addresses.<object>.address=<string> | An IPv6 address currently in use by the network interface device. |
| data.devices.<object>.IPv6.addresses.<object>.prefixLength=<integer> | The subnet prefix length of the address. |
| data.devices.<object>.IPv6.addresses.<object>.origin=<string> | The origin of the address. See IP address origin values for possible values. |
| data.devices.<object>.IPv6.addresses.<object>.scope=<string> | The scope of the address. See IP address scope values for possible values. |
| data.devices.<object>.IPv6.maxSupportedStaticAddressConfigurations=<integer> | The maximum number of simultaneous static IPv6 address configurations supported. |
| data.devices.<object>.IPv6.staticAddressConfigurations=[<object>] | List of static IPv6 address configurations. |
| data.devices.<object>.IPv6.staticAddressConfigurations.<object>.address=<string> | An IPv6 address in the list of static IPv4 address configurations. |
| data.devices.<object>.IpV6.staticAddressConfigurations.<object>.prefixLength=<integer> | The subnet prefix length of the address. |
| data.devices.<object>.IPv6.defaultRouter=<string> | The IPv6 address of the default router currently used by the system. |
| data.devices.<object>.IPv6.staticDefaultRouter=<string> | The IPv6 address of the static default router. |
| data.devices.<object>.wired=<object> | Contains the parameters exclusive to wired network interface devices. |
| data.devices.<object>.wired.linkMode=<string> | Link mode determines the transmission speed and duplex mode of the Ethernet connection. See Wired link mode values for possible values. |
| data.devices.<object>.wired.isDownlink=<boolean> | Downlink indicates if this wired device is used as a downlink or an uplink device for network communication. Being uplink means that it is connected to the network core infrastructure. Downlink means that it is connected to leaf devices. |
| data.devices<object>.wired.supportedLinkModes=[<string>] | Link modes supported by the interface. See Wired link mode values for possible values. |
| data.devices.<object>.wired.8021X=<object> | Contains the parameters exclusive to the wired 802.1X configuration. Its presence indicates support for this feature. |
| data.devices.<object>.wired.8021X.enabled=<boolean> | Specifies if 802.1X has been enabled on the device interface. |
| data.devices.<object>.wired.8021X.status=<string> | Specifies the 802.1X authentication status. See IEEE 802.1X authentication status for possible values. |
| data.devices.<object>.wired.8021X.mode=<string> | Specifies which 802.1X authentication mode that is currently active. See Wired 802.1X authentication modes for possible values. |
| data.devices.<object>.wired.8021X.configurations=[<object>] | An array of the configured 802.1X modes, which includes an identity and EAPoL version parameters for each mode. |
| data.devices.<object>.wired.8021X.configurations.<object>.mode=<string> | Specifies the 802.1X authentication mode for this configuration. See Wired 802.1X authentication modes for possible values. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.identity=<string> | The EAP identity. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.is_password_set=<boolean> | Indicates if the password is set for this mode. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.eapolVersion=<string> | The EAPoL version used in communication with the authenticator. See IEEE 802.1X EAPoL version values for possible values. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.peapVersion=<string> | The PEAP version used in communication with the authenticator. See IEEE 802.1X PEAP version for possible values. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.label=<string> | The PEAP label used in communication with the authenticator. See IEEE 802.1X PEAP label for possible values. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.is_mka_cak_set=<boolean> | Indicates if the MACsec Key Agreement Connectivity Association Key is set. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.mkaCkn=<boolean> | The MACsec Key Agreement Connectivity Association Key name. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.certClient=<string> | The Client Certificate ID to use for EAP-TLS mode. |
| data.devices.<object>.wired.8021X.configurations.<object>.params.certsCA=[<string>] | The CA Certificate IDs to use for EAP-TLS and MSCHAPv2 mode. |
| data.devices.<object>.wired.8021X.supportedModes=[<string>] | Contains the supported authentication modes. See Wired 802.1X authentication modes for possible values. |
| data.devices.<object>.wired.8021X.MACsecSecured=<boolean> | Indicates if the current connection is secured by MACsec. This is only applicable if the mode is set to either MACsec-PSK, or WPA-Enterprise-EAPTLS when the EAPoL version is set to 3. |
| data.devices.<object>.wlan=<object> | Contains the parameters exclusive to wlan network interface devices. |
| data.devices.<object>.wlan.station=<object> | Contains the parameters for the WLAN station feature, with its presence indicating the support for this feature. |
| data.devices.<object>.wlan.station.activeSsid=<string> | Contains the SSID of the currently configured WLAN station. |
| data.devices.<object>.wlan.station.8021X.enabled=<boolean> | Specifies if the WLAN station has been enabled on the device interface. |
| data.devices.<object>.wlan.station..8021X.status=<string> | Specifies the WLAN station 802.1X authentication status. See IEEE 802.1X authentication status for possible values. |
| data.devices.<object>.wlan.station.8021X.mode=<string> | Specifies the WLAN station 802.1X authentication mode. See WLAN station 802.1X authentication modes for possible values. |
| data.devices.<object>.wlan.station.8021X.configurations=[<object>] | An array containing the configured WLAN station 802.1X modes with parameters for each mode. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.mode=<string> | Specifies the WLAN station 802.1X authentication mode for this particular configuration. See WLAN station 802.1X authentication modes for possible values. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.is_psk_set=<boolean> | Indicates if the pre-shared key has been set for this mode. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.is_hex_set=<boolean> | Indicates if the hex key has been set for this mode. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.is_password_set=<boolean> | Indicates if the password has been set for this mode. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.identity=<string> | The EAP identity. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.eapolVersion=<string> | The EAPoL version used in communication with the authenticator. See IEEE 802.1X EAPoL version values for possible values. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.peapVersion=<string> | The PEAP version used in communication with the authenticator. See IEEE 802.1X PEAP version for possible values. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.label=<string> | The PEAP label used in communication with the authenticator. See IEEE 802.1X PEAP label for possible values. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.certClient=<string> | The Client Certificate ID to use for EAP-TLS and MSCHAPv2 mode. |
| data.devices.<object>.wlan.station.8021X.configurations.<object>.params.certsCA=[<string>] | The CA Certificate IDs to use for EAP-TLS and MSCHAPv2 mode. |
| data.devices.<object>.wlan.station.8021X.supportedModes=[<string>] | Contains the supported authentication modes. See WLAN station 802.1X authentication modes for possible values. |
| data.devices.<object>.wlan.accessPoint=<object> | Contains the parameters related to the WLAN accessPoint feature. Its presence is required for this feature to be supported. |
| data.devices.<object>.wlan.accessPoint.ssid=<string> | Specifies the WLAN access point ssid (Service Set Identifier) name. |
| data.devices.<object>.wlan.accessPoint.enabled=<boolean> | Specifies if the WLAN access point is enabled on the device interface. |
| data.devices.<object>.wlan.accessPoint.authenticationMode=<string> | Specifies the currently active WLAN access point authentication mode. See WLAN access point 802.1X authentication modes for possible values. |
| data.devices.<object>.wlan.accessPoint.installationModeSupported=<boolean> | Its presence indicates that the WLAN access point supports the installation mode feature. |
| data.devices.<object>.switchPort=<object> | Contains the parameters exclusive to network interface devices of the type switchPort. |
| data.devices.<object>.switchPort.portNumber=<integer> | The port number of the switch port. |
| data.devices.<object>.switchPort.remoteAddresses=[<string>] | A list containing all store remote MAC addresses that can be observed on the switch port. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="getNetworkInfo" | Optional. The requested method. This property is not present for all types of errors. |
| error.code=<integer> | An error code describing what kind of error that has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code in plain text. |

| String | Description |
| --- | --- |
| disabled | Do not accept, nor initiate ECN. |
| acceptAndInitiate | Both accept and initiate ECN. |
| acceptOnly | Accept incoming ECN, but do not initiate. |

| String value | Description |
| --- | --- |
| auto | Sets the highest priority device to active. If that device is unavailable, the next device in the devices list will be selected. If a higher priority device gets set up, it will lower the priority of the other devices on the list and become the active device. |
| manual | Only the network interface devices listed in manualActiveDevices will be set to an active state. The remaining devices will be inactive. |
| none | No network interface devices are active. |

| String value | Description |
| --- | --- |
| wired | Wired network interface device. |
| wlan | WLAN network interface device. |
| bridged | Bridged network interface device. |
| switchPort | Switch port network interface device. |

| String value | Description |
| --- | --- |
| static | Static configuration. |
| dhcp | DHCP assigned configuration. |

| String value | Description |
| --- | --- |
| off | Never assign a link-local IP (v4) address. |
| on | Always assign a link-local IP (v4) address. |
| fallback | Only assign a link-local IP (v4) address if the primary address configuration mode (DHCP/static) fails. |

| String value | Description |
| --- | --- |
| unknown | Unknown string value. |
| static | Static configuration. |
| dhcp | DHCP assigned configuration. |
| linkLocal | Link-Local. |
| RA | Router Advertisement (Only applicable for IPv6 addresses. |

| String value | Description |
| --- | --- |
| nowhere | Not set. |
| host | Host. |
| link | Link-Local. |
| site | Site-Local. |
| global | Global. |

| String value | Description |
| --- | --- |
| auto | Auto-negotiate. |
| 10BaseT-HD | 10BaseT (Half duplex). |
| 10BaseT-FD | 10BaseT (Full duplex). |
| 100BaseTX-HD | 100BaseTX (Half duplex). |
| 100BaseTX-FD | 100BaseTX (Full duplex). |
| 1000BaseTX-HD | 1000BaseTX (Half duplex). |
| 1000BaseTX-FD | 1000BaseTX (Full duplex). |

| String value | Description |
| --- | --- |
| WPA-Enterprise-PEAP-MSCHAPv2 | WPA Enterprise PEAP MSCHAPv2. |
| "WPA-Enterprise-EAPTLS" | WPA Enterprise EAP-TLS. If the network has MACsec capabilities, MACsec negotiation will also be started. |
| "MACsec PSK" | MACsec Pre-shared-key using MKA. |

| String value | Description |
| --- | --- |
| PEAPv0 | PEAP version 0. |
| PEAPv1 | PEAP version 1. Specifies the PEAP label. |

| Integer value | Description |
| --- | --- |
| 1 | Use client EAP encryption. |
| 2 | Use client PEAP encryption. |

| String value | Description |
| --- | --- |
| "none" | No authentication. |
| "WPA-Personal-PSK" | WPA personal with pass pass-key. |
| "WPA-Personal-HEX" | WPA personal with hex-key. |
| "WPA-Enterprise-PEAP-MSCHAPv2" | WPA Enterprise PEAP MSCHAPv2. |
| "WPA-Enterprise-EAPTLS" | WPA Enterprise EAP-TLS. |

| String value | Description |
| --- | --- |
| "none" | No authentication. |
| "WPA-Personal-PSK" | WPA personal with pass pass-key. |
| "WPA-Personal-HEX" | WPA personal with hex-key. |
| "WPA-Enterprise-PEAP-MSCHAPv2" | WPA Enterprise PEAP MSCHAPv2. |
| "WPA-Enterprise-EAPTLS" | WPA Enterprise EAP-TLS. |

| String value | Description |
| --- | --- |
| "Unknown" | Authentication status is not known. |
| "Stopped" | Authentication is stopped 802.1X is not enabled. |
| "Unauthorized" | Authentication has failed, check credentials and certificate. |
| "Authorized" | Authentication has succeeded. |
| "Connecting" | Authentication is on-going. |

| String value | Description |
| --- | --- |
| "EAPoLv1" | EAPoL version 1. |
| "EAPoLv2" | EAPoL version 2. |
| "EAPoLv3" | EAPoL version 3. |

| String value | Description |
| --- | --- |
| "up" | Network interface device static state is up. |
| "down" | Network interface device static state is down. |

| String value | Description |
| --- | --- |
| "up" | Network interface device state is up. |
| "down" | Network interface device state is down. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | Optional. The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="getSupportedVersions" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="getSupportedVersions" | The requested method. |
| data.supportedVersions=[<string>] | Contains a list of supported API versions as strings. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="getSupportedVersions" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="removeVlan" | The method that is requested. |
| params.masterDeviceName=<string> | The network device that the VLAN should be attached to, for example ‘eth0’. |
| params.VlanName=<string> | The full name of the VLAN that should be removed, for example ‘eth0.4’. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="removeVlan" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="removeVlan" | Optional. The requested method. This property is not present for all types of errors. |
| error.code=<integer> | An error code describing what kind of error that has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code in plain text. |
| error.details=<object> | Optional. Contains additional information about the error. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. |

| Code | Description |
| --- | --- |
| 100 | Parameter VlanName error. |
| 200 | VLAN still present in manual active devices list. |
| 201 | VLAN does not exist. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="scanWLANNetworks" | The method that is requested. |
| params.deviceName=<string> | The name of the network interface device that should be configured. See getNetworkInfo on how to retrieve a list of all available network interface devices. |
| params.refresh=<boolean> | Optional. Make a new scan or fetch data from the previous scan. In cases where no prior scan has been done or if this parameter is not set a new scan will be automatically performed. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="scanWLANNetwork" | The requested method. |
| data.networks=<object> | Contains parameters related to the available WLAN networks. |
| data.networks=<object>.ssid=<string> | The SSID (service set identifier) of the network. |
| data.networks=<object>.band=<string> | The frequency band of the network. See the WLAN frequency bands table below for a complete list of supported frequency bands. |
| data.networks=<object>.channel=<integer> | The network channel. |
| data.networks=<object>.signalStrengthDBm=<integer> | The signal strength of the network in dBm. |
| data.networks=<object>.security=<object> | Contains the security parameters available on the network. |
| data.networks=<object>.security=<object>.authentication<string> | The authentication mode used by the network. See the WLAN authentication modes table below for a complete list of supported authentication modes. |
| data.networks=<object>.security=<object>.version<string> | The authentication version used by the network. Please note that this parameter is only applicable when authentication is set to PSK or IEEE 802.1X. See the WLAN security version table below for a complete list of supported security versions. |

| String value | Description |
| --- | --- |
| 2.4GHz | 2.4 GHz |
| 5GHz | 5 GHz |

| String value | Description |
| --- | --- |
| None | Open system. |
| PSK | Pre-shared key. |
| IEEE 802.1X | Enterprise, EAP-TLS/PEAP-MSCHAPv2 |

| String value | Description |
| --- | --- |
| WPA1 | WPA (version 1). |
| WPA2 | WPA 2. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included, it will also appear in the response with an identical value. |
| method="scanWLANNetworks" | Optional. The requested method. This property is not present for all types of errors. |
| error.code=<integer> | An error code describing what kind of error that has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code in plain text. |
| error.details=<object> | Optional. Contains additional information about the error. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. |

| Code | Description |
| --- | --- |
| 5000 | No device found for the given device name. |

| Code | Description |
| --- | --- |
| 100 | Parameter deviceName error. |
| 101 | Parameter refresh error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setDeviceConfiguration" | The requested method. |
| params.deviceName=<boolean> | The name of the network interface device that should be configured. See getNetworkInfo |
| params.staticState=<string> | Optional. Specifies if the network interface device should be up or down. If staticState is down, link will be false and state will be down, which will result in persistent disabled network traffic. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setDeviceConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setDeviceConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information see General error codes |
| error.message=<string> | An error message describing the error code. |

| Code | Description |
| --- | --- |
| 5000 | No device found for the given device name. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter deviceName error. |
| 101 | Parameter staticState error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setHostnameConfiguration" | The requested method. |
| params.useDhcpHostname=<boolean> | Optional. Specifies whether to use the DHCP server provided hostname before the static hostname. If excluded, the current value remains unchanged. |
| params.staticHostname=<string> | Optional. A static hostname to use unless one is obtained from a DHCP server while the device is configured to prefer DHCP assigned hostnames. If excluded, the current value remains unchanged. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setHostnameConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setHostnameConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information see General error codes |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information see the Sub-codes table below. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter staticHostname error. |
| 101 | Parameter useDhcpHostname error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> Optional | The context of the request. If it is included in the requests, it will also appear in the response with an identical value. |
| method="setIPv4AddressConfiguration" | The method that is requested. |
| params.deviceName=<string> | The name of the network interface device to configure. See getNetworkInfo on how to retrieve a list of all network interface devices. |
| params.enabled=<boolean> Optional | The enabled state of IPv4. If excluded, the current value will remain unchanged. IPv4 can not be deactivated while IPv6 is deactivated. |
| params.configurationMode=<string> Optional | The desired IPv4 address configuration mode. If excluded, the current value remains unchanged. See IP address configuration modes for a list of supported modes. |
| params.linkLocalMode Optional | The desired link-local mode. The current value remains unchanged if excluded. See Link-local modes for a list of supported modes. |
| params.staticDefaultRouter=<string> Optional | The IPv4 address of the router on the network. This is used when the configuration mode is set to either static or DHCP, but no router is advertised. If excluded, the value remains unchanged. |
| params.useStaticDHCPFallback=<boolean> Optional | Specifies if the configured static default route should be used as a fallback when a DHCP leased default router is unavailable. |
| params.useDHCPStaticRoutes=<boolean> Optional | Specifies if the DHCP classless static routes should be used. If enabled, the DHCP leased default router will be ignored. Static routes provided by the DHCP server will be installed on the device. |
| params.staticAddressConfigurations=[<object>] Optional | A list of objects each representing a static IPv4 address. The maximum number of objects is limited, see getNetworkInfo on how to determine how many are allowed (maxSupportedStaticAddressConfiguration). If excluded, the current value remains unchanged. |
| params.staticAddressConfigurations.<object>.address=<string> | A static IPv4 address. |
| params.staticAddressConfigurations.<object>.prefixLength=<string> | The subnet prefix length associated with the address. |
| params.staticAddressConfigurations.<object>.broadcast=<string> | Optional. The broadcast address of the subnet. If excluded, it will be automatically calculated using the address and prefix length. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setIPv4AddressConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setIPv4AddressConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information see General error codes. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information see Sub-codes. |

| Code | Message |
| --- | --- |
| 5000 | No device found for the given device name |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter deviceName error. |
| 101 | Parameter configurationMode error. |
| 102 | Parameter staticDefaultRouter error. |
| 103 | Parameter staticAddressConfigurations error. |
| 104 | Parameter address error. |
| 105 | Parameter prefixLength error. |
| 106 | Parameter broadcast error. |
| 107 | Parameter address/prefixLength/broadcast combination error. |
| 108 | Parameter useStaticDHCPFallback error. |
| 109 | Parameter linkLocalMode error. |
| 110 | Parameter useDHCPStaticRoutes error. |
| 111 | Parameter enable error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setIPv6AddressConfiguration" | The method that is requested. |
| params.deviceName=<string> | The name of the network interface device to configure. See getNetworkInfo on how to retrieve a list of all network interface devices. |
| params.enabled=<boolean> | Optional. The enabled state of IPv6. If excluded, the current value will remain unchanged. IPv6 can be deactivated while IPv4 is deactivated. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | Optional. The context of the request. If it was included in the request, it will appear in the response with an identical value. |
| method="setIPv6AddressConfiguration | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that was used. |
| context=<string> | Optional. The context of the request. If it was included in the request, it will also appear in the response with an identical value. |
| method="setIPv6AddressConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing the type of error that occurred. For additional information, see General error codes. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error. |
| error.details.subCode=<integer> | A code that gives further details about the error. For additional information see the Sub-codes table below. |

| Code | Message |
| --- | --- |
| 5000 | No device found for the given device name |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter deviceName error |
| 101 | Parameter enabled error |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setGlobalProxyConfiguration" | The requested method. |
| params.httpProxy=[<string>] | The global HTTP proxy. |
| params.httpsProxy=[<string>] | The global HTTPS proxy. |
| params.noProxy=[<string>] | The global no_proxy that should be used. Wildcards are not allowed. To define all subdomains to a domain name, use the dot prefix (.axis.com) and CIDR notation for networks (192.168.0.0/24). |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setGlobalProxyConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setGlobalProxyConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information, see Sub-codes. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter httpProxy error. |
| 101 | Parameter httpsProxy error. |
| 102 | Parameter noProxy error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setResolverConfiguration" | The requested method. |
| params.useDhcpResolverInfo=<boolean> | Optional. Specifies whether the device should switch to using DHCP server provided DNS resolver configuration over the static DNS resolver configuration, in the event that a DHCP server provides such a configuration. If excluded, the current value remains unchanged. |
| params.staticNameServers=[<string>] | Optional. A list of name servers to use unless name servers are obtained from a DHCP server while the device is configured to prefer DHCP assigned DNS resolver configurations. The maximum number of objects are limited, see getNetworkInfo on how to determine the allowed amount (maxSupportedStaticNameServers). If excluded, the current value remains unchanged. |
| params.staticSearchDomains=[<string>] | Optional. A list of search domains to use unless they are obtained from a DHCP server while the device is configured to prefer DHCP assigned DNS resolver configurations. The maximum number of objects is limited, see getNetworkInfo on how to determine the allowed amount (maxSupportedStaticSearchDomains). If excluded, the current value remains unchanged. |
| params.staticDomainName=<string> | Optional. A static domain name to use unless one is obtained from a DHCP server while the device is configured to prefer DHCP assigned DNS resolver configurations. If excluded, the current value remains unchanged. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setResolverConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setResolverConfiguration" | Optional. The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information, see Sub-codes. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter useDhcpResolverInfo error. |
| 101 | Parameter staticNameServers error. |
| 102 | Parameter staticSearchDomains error. |
| 103 | Parameter staticDomainName error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWired8021XConfiguration" | The requested method. |
| params.deviceName=<string> | The name of the device to configure. See getNetworkInfo on how to retrieve a list of all devices. |
| params.enabled=<boolean> | Optional. Specifies whether the device should enable 802.1X authentication. If excluded, the value remains unchanged. |
| params.mode=<string> | Optional. The 802.1X authentication mode that should be used. See Wired 802.1X authentication modes for possible values. If excluded, the value remains unchanged. |
| params.identity=<string> | Optional. The EAP identity that should be used. If excluded, the value remains unchanged. |
| params.password=<string> | Optional. The EAP password that should be used. If excluded, the value remains unchanged. This value is only used if the mode is set to WPA-Enterprise-PEAP-MSCHAPv2. |
| params.eapolVersion=<string> | Optional. The EAPoL version that should be used. See IEEE 802.1X EAPoL version values for possible values. If excluded, the value remains unchanged. |
| params.peapVersion=<string> | Optional. The PEAP version that should be used. See IEEE 802.1X PEAP version for possible values. If excluded, the value remains unchanged. This value is only used if the mode is set to WPA-Enterprise-PEAP-MSCHAPv2. |
| params.label=<integer> | Optional. The PEAP label version that should be used. See IEEE 802.1X PEAP label for possible values. If excluded, the value remains unchanged. This value is only used if the mode is set to WPA-Enterprise-PEAP-MSCHAPv2. |
| params.certClient=<string> | Optional. The Client Certificate ID to identify the client towards the 802.1X radius server. If excluded, the value remains unchanged.Required to enable 802.1X authentication with WPA-Enterprise-EAPTLS.Use an empty string to unset the existing client certification. |
| params.certsCA=[<string>] | Optional. The CA Certificate IDs to identify the certificate chain of the 802.1X radius server. If excluded, the value remains unchanged.Use an empty list to unset the CA certificate. |
| params.mkaCak=<string> Optional | The MACsec Key Agreement Connectivity Association Key to use for MACsec PSK. It must be either 16 bytes (32 hexadecimal characters) or 32 bytes (64 hexadecimal characters). If excluded, the current value remains unchanged. This value is only used if mode is set to MACsec-PSK. |
| params.mkaCkn=<string> Optional | The MACsec Key Agreement Connectivity Association Key Name to use for MACsec PSK. It must be 1 to 32 bytes (2 to 64 divisible by 2) hexadecimal characters. If excluded, the current value remains unchanged. This value is only used if mode is set to MACsec-PSK. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWired8021XConfiguration" | The method that is requested. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWired8021XConfiguration" | Optional. The required method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information, see General error codes. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information, see the Sub-codes table below. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter deviceName error. |
| 101 | Parameter enabled error. |
| 102 | Parameter mode error. |
| 103 | Parameter identity error. |
| 104 | Parameter eapolVersion error. |
| 112 | Parameter certClient error. |
| 113 | Parameter certCA error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWlanConfiguration" | The requested method. |
| params.countryCode | The country code used to configure the regulatory domain of WLAN network devices. This field is only shown if a WLAN device is present on the system. The default value of the country code is XX, which represents that the country code has not yet been configured. It is not possible to set the country code to XX. The country code is not allowed to change if countryCodeLock is true. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWlanConfiguration" | The method that is requested. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWlanConfiguration" | Optional. The required method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information, see General error codes. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information, see the Sub-codes table below. |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter countryCode error. |
| 101 | No WLAN device present on the system. |
| 102 | The countryCode of the WLAN device is locked and not allowed to change. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWLANStationConfiguration" | The requested method. |
| params.deviceName=<string> | The name of the network interface device to configure. See getNetworkInfo on how to retrieve a list of all network interface devices. |
| params.ssid=<string> | Optional. The ssid of the wireless access point. |
| params.authentication=<object> | Optional. The WLAN station authentication parameters. |
| params.authentication=<object>.mode=<string> | Optional. The WLAN station 802.1X authentication mode that should be used. See WLAN station 802.1X authentication modes for potential values. |
| params.authentication=<object>.params=<object> | Optional. The WLAN station 802.1X authentication parameters. |
| params.authentication=<object>.params=<object>.identity=<string> | Optional. The EAP identity that should be used. If excluded, the value remains unchanged. |
| params.authentication=<object>.params=<object>.password=<string> | Optional. The passwoed that should be used. If excluded, the value remains unchanged. |
| params.authentication=<object>.params=<object>.eapolVersion=<string> | Optional. The EAPoL version to use. See IEEE 802.1X EAPoL version values for potential values. |
| params.authentication=<object>.params=<object>.peapVersion=<string> | Optional. The PEAP version to use . See IEEE 802.1X PEAP version for potential values. |
| params.authentication=<object>.params=<object>.label=<integer> | Optional. The PEAP label version to use. See IEEE 802.1X PEAP label for potential values. |
| params.authentication=<object>.params=<object>.certClient=<string> | The Client Certificate ID to use for EAP-TLS mode. If excluded, the current value remains unchanged. |
| params.authentication=<object>.params=<object>.certsCA=[<string>] | The CA Certificate IDs to use for EAP-TLS and MSCHAPv2 mode. If excluded, the current value remains unchanged. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWLANStationConfiguration" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="setWLANStationConfiguration" | The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information, see the Error codes table below. |
| error.message=<string> | An error message describing the error code. |
| error.details=<object> | Optional. Contains additional information about the error when available. |
| error.details.subCode=<integer> | A code that gives further details about the error that occurred. For additional information see the Sub-codes table below. |

| Code | Message |
| --- | --- |
| 5000 | No device found for the given device name |

| Sub-code | Description |
| --- | --- |
| 100 | Parameter deviceName error |
| 102 | Parameter mode error |
| 103 | Parameter identity error |
| 104 | Parameter eapolVersion error |
| 105 | Parameter ssid error |
| 106 | Parameter authentication error |
| 107 | Parameter password error |
| 108 | Parameter peapVersion error |
| 109 | Parameter label error |
| 110 | Parameter mkaCak error. |
| 111 | Parameter mkaCkn error. |
| 112 | Parameter certClient error. |
| 113 | Parameter certsCA error. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="testWLANStationSettings" | The requested method. |
| params.deviceName=<string> | The name of the network interface device to run the rest on. See getNetworkInfo on how to retrieve a list of all network interface devices. |
| params.timeout=<integer> | Optional. The timeout for the call, measured in seconds. Default value is 10. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="testWLANStationSettings" | The requested method. |
| data.code=<integer> | A code describing the result of the test. For additional information see the Success codes table below. |
| data.message=<string> | A message describing the test result code. |

| Code | Message |
| --- | --- |
| 0 | Authentication successful. |
| 1 | Authentication failed. |
| 2 | Timeout connecting to Access Point. |
| 3 | WLAN station configuration changed. |
| 4 | Interrupted by interface change. |
| 5 | WLAN configuration is incomplete. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| method="testWLANStationSettings" | The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information, see the Error codes table below. |
| error.message=<string> | An error message describing the error code. |

| Code | Message |
| --- | --- |
| 5000 | No device found for the given device name. |
| 5001 | Invalid device supplied. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| "method"="wlanSwitchAPToStation" | The requested method. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| "method"="wlanSwitchAPToStation" | The requested method. |
| data.code=<integer> | A code describing the result of the test. For additional information see the Success codes table below. |
| data.message=<string> | A message describing the test result code. |

| Code | Message |
| --- | --- |
| 0 | Connection process started. |

| Parameter | Description |
| --- | --- |
| apiVersion=<major>.<minor> | The API version that should be used. |
| context=<string> | Optional. The context of the request. If it is included in the request, it will also appear in the response with an identical value. |
| "method"="wlanSwitchAPToStation" | The requested method. |
| error.code=<integer> | An error code describing what kind of error has occurred. For additional information, see the Error codes table below. |
| error.message=<string> | An error message describing the error code. |

| Code | Message |
| --- | --- |
| 5000 | No device found for the given device name. |
| 5003 | Device is not in installation mode. |
| 5004 | Incomplete WLAN configuration. |

| Code | Description |
| --- | --- |
| 100 | Parameter deviceName error. |

| Code | Message |
| --- | --- |
| 1000 | Internal error. |
| 2000 | Invalid request. |
| 2001 | Request body too large. |
| 3000 | Invalid JSON data. |
| 4000 | Method does not exist. |
| 4001 | The specified version is not supported. |
| 4002 | Authorization failed. |
| 4003 | Missing parameter(s). |
| 4004 | Invalid parameter(s). |

