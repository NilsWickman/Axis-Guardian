# Network video

**Source:** https://developer.axis.com/vapix/network-video/
**Last Updated:** Aug 28, 2025

---

# Network video

## Version history​

## About VAPIX​

### General abbreviations​

### Obsolete and removed CGIs​

#### Obsolete​

#### Removed​

### HTTP status codes​

### Percent encoding​

### User access rights​

### Parameter value convention​

### Unknown arguments​

### XML schemas​

#### XML schema versions​

### Style convention - CGIs​

#### Content to be replaced​

#### CGI requests​

#### CGI response​

#### CGI example​

### JSON and simplified key-value requests​

### API versioning​

### Feature discovery​

#### API Discovery​

#### Feature API version​

#### Feature API informing capabilities​

#### Legacy feature discovery​

### Connection test: Ping, ports and IP addresses​

VAPIX® Network video APIs is a set of application programming interfaces (APIs) for configuration and management of Axis network video products.

Selected functionality:

The network video API documentation describes the different APIs and provides numerous examples how to use the API functions in common scenarios. VAPIX® contains documentation for VAPIX version 3.

All Axis network cameras and video encoders support VAPIX but most products do not support all APIs and API functions. Use the Properties parameters to check supported APIs. Some network video APIs can also be used for products such as video decoders, audio products, I/O modules and access control products.

The following abbreviations are used throughout the VAPIX® documentation.

Some CGI requests, arguments and values in the VAPIX® documentation may be obsolete and are provided for backward compatibility. These might not be supported in the future.

The HTTP API version 1 (VAPIX 1) is no longer supported.

The Axis product returns standard HTTP status codes. See RFC 1945 and RFC 2616.

HTTP and RTSP VAPIX requests must follow the URI generic syntax defined in RFC 3986. Use character encoding ISO/IEC 8859-1. If a parameter in the request contains characters that are not allowed in a URI, these characters must be percent-encoded. That is, characters such as /, \, :, =, &, ?, etc in a <argument> or a <value> must be replaced by %<ASCII hex>.

Correct:

Wrong:

User access rights for CGI requests are determined by group membership.

In tables defining CGI arguments and supported values, the default value for optional arguments is system configured.

If an unknown argument is requested, for example if an argument is misspelled it will be ignored by the built-in server in the Axis product. That means that no response feedback will be given.

In many VAPIX API:s, responses are formatted according to an XML schema. Clients should always retrieve supported schema versions from the Axis product before sending other requests. In subsequent requests, the schema version must be specified. Make sure that the client and the Axis product use the same schema version.

Retrieve schema version example:

Subsequent request example:

Axis’ XML Schemas are available at http://www.axis.com/vapix/http_cgi/

The schema version consists of two numbers; major version and minor version. The major version is the number before the decimal point. The minor version is the number after the decimal point.

Example:

If a schema is updated, the version changes. The major version is changed if the update breaks backward compatibility, for example if a new element is added to the beginning of a sequence. If the major version changes, the schema namespace is also changed and the minor version is set to zero. The minor version is changed if the update does not break backward compatibility, for example if a new attribute is added.

In API requests, the major schema version must be specified. The latest minor version will be used.

In API responses, the root element contains the following attributes:

Old schema versions may be removed without first being marked as deprecated.

In URL syntax and in descriptions of CGI arguments, text in italics within angle brackets denotes content that should be replaced with either a value or a text string. When replacing the text string, the angle brackets must also be replaced. For example, the name of the camera or video encoder is denoted by <servername> in the URL syntax description. In the URL syntax examples <servername> is replaced by the string myserver.

XML responses do not apply to this style convention. For this type of responses a text string within angle brackets (including the brackets) is a tag (start-tag or end-tag). XML response descriptions use text in italics inside square brackets to denote content that is replaced by the server. For example, [int] is replaced by an integer.

CGI requests are written in lower-case. CGI arguments are written in lower-case and as one word. When the CGI request includes internal parameters, the internal parameters must be written exactly as named in the Axis product. For the POST method the parameters must be included in the body of the HTTP request. The CGIs are organized in function-related directories under the axis-cgi directory. The file extension is required.

URL syntax is written with the word "Syntax:" in bold face, followed by a box with the referred syntax, as shown below. The name of the Axis product is written as <servername>. This is intended to be replaced with the name of the actual Axis product. The name can either be a name, for example "thecam" or "thecam.adomain.net" or the associated IP number for the server, for example 10.10.2.139. Text within square brackets denotes content that can be omitted.

Syntax:

A description of the data response is written with "Response" in bold face, followed by the HTTP status code, header fields and a box with the HTTP body. Carriage Return and Line Feed (CRLF) are not explicitly printed.

Response:

Body:

Response examples are examples only. The returned data will differ depending on product model and configuration.

Request default image

Request:

In some VAPIX API:s, for example the Call service API, requests can be constructed using JSON or using a simplified key-value format.

The simplified key-value format is a flattened structure with key=value strings. Levels in the structure are indicated by underscores (_).

Character sets are not converted or validated. UTF-8 is recommended.

This example from the Call service API shows how to request the current SIP configuration using cURL. The first example shows the JSON syntax, the second example shows the corresponding simplified syntax.

NOTE

When using cURL on Windows, you might need to escape the quote characters for the commands to work, i.e:

should instead be written as:

JSON request and response:

Simplified request and response:

This example shows how to retrieve a list of structures in simplified format. The example shows a list of three SIPAccounts. Each key is prefixed with _index_ where index is the index of the element in the list. All keys that share the same prefix correspond to the same element.

Simplified request and response:

Corresponding request and response in JSON:

JSON request and response:

This example shows a response with fault codes.

JSON request:

JSON response:

Simplified request:

Simplified response:

An API includes version numbering that consists of two numbers separated by a dot X.X. The first number represents the major version number of the API while the second represents the minor.

The following example is from an entry in the API Discovery service, where the version number of the API :

Axis Communications uses both numbers to group new and/or upgraded functions. The numbers will increase for either the major or minor version depending on the change.

The major numbers of an API is changed when the API introduces an update that is backwards incompatible, i.e. when an existing client code ceases to work with the new API unless there are modifications done to it. Example of backwards incompatible changes are function signature changes, removal of a function or making an asynchronous function synchronous. To counter this, the API generally provides multiple sets of itself with different major numbers to make backwards compatibility possible when introducing new features.

The minor version of an API is changed to enhance functionality or fix bugs, which means that the client code should continue to work when there is a minor number change in the API.

As an example, a client implements a code to work with API version 1.0. The next release will then become API version 1.1. This means that the client code should work without any modifications.

A list of available APIs, together with their versions, can be retrieved through the API Discovery service, which makes it possible to retrieve information about APIs supported on a specific Axis product.

To be able to drive and control a VAPIX® device, a user must first be aware of the features that the device is supporting. A feature discovery can be made by using one of 3 different methods:

The order ranges from generic to a more specific feature discovery.

The easiest way to find a certain feature is to look for the existence of a feature API by using the API Discovery service. Through this you will be able to find an API entry with a version number that indicates whether there is support for the feature.

Example

Finding the Temperature control API entry with API Discovery means that the device supports the temperature feature.

The version of the feature API is found by using the API Discovery service and might indicate if features have been added to the API over time.

Example

The Temperature control API might exist on 2 different products and in 2 different versions. The first product might show Temperature control API version 1.0, while the second product has Temperature control API version 1.1. In this case, the documentation will show that the method setTemperatureAlarm was added as part of version 1.1.

In some cases, the feature information cannot be obtained unless you first query the feature API. This can be done by invoking the API itself.

Example

You will be able to ask the Temperature control API for the device’s current temperature by calling the method getCurrentTemperature, which will give you the feature information, but only during the runtime of the device.

If the feature API doesn’t exist on the device, legacy feature detection can be used to search for the required feature as it combines all of the previously mentioned methods.

Example

Legacy features are exposed in the Legacy parameter handling API, where you must query the API Discovery service using the id param-cgi. Doing this will indicate the presence of the Legacy parameter handling API, which is used to discover features.

The following examples will show you how to test your Ping or IP/port-address using the pingtest.cgi and tcptest.cgi.

Ping

To determine if your device is up and running and ready to ping another device or server on the network by searching for either its IP-address or the DNS-hostname, you should use the following URL:

Port

To determine if your device is up and running and ready to reach another IP-address and port, i.e. test if the application itself is up and running on the server, you should use the following URL:

```
http://<servername>/axis-cgi/record/continuous/addconfiguration.cgi?diskid=SD_DISK&options=resolution%3D640x480
```

```
http://<servername>/axis-cgi/record/continuous/addconfiguration.cgi?diskid=SD_DISK&options=resolution=640x480
```

```
http://<servername>/axis-cgi/disks/networkshare/schemaversions.cgi
```

```
http://<servername>/axis-cgi/disks/networkshare/list.cgi?schemaversion=1&shareid=all
```

```
SchemaVersion=1.0
```

```
http://<servername>/axis-cgi/<subdir>[/<subdir>...]<cgi>.<ext>[?<argument>=<value>[&<argument>=<value>...]]
```

```
<JPEG image data>
```

```
http://myserver/axis-cgi/jpg/image.cgi
```

```
-d '{"axcall:GetSIPConfiguration":{}}'
```

```
-d "{\"axcall:GetSIPConfiguration\":{}}"
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/call" -s -d '{"axcall:GetSIPConfiguration":{}}'> {>   "SIPConfiguration": {>     "SIPEnabled": false,>     "TURNServers": [],>     "STUNServers": [],>     "ICEEnabled": false,>     "AllowIncomingCalls": false,>     "TURNEnabled": false,>     "STUNEnabled": false,>     "ApplyUserAuthentication": false,>     "AllowedUsers": [],>     "SIPPort": 5060,>     "SIPTLSPort": 5061,>     "ApplyAllowedURIs": false,>     "AllowedURIs": []>   }> }
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/call?format=simple&action=axcall:GetSIPConfiguration"'> SIPConfiguration_SIPEnabled=false> SIPConfiguration_SIPPort=5060> SIPConfiguration_SIPTLSPort=5061> SIPConfiguration_STUNEnabled=false> SIPConfiguration_TURNEnabled=false> SIPConfiguration_ICEEnabled=false> SIPConfiguration_AllowIncomingCalls=false> SIPConfiguration_ApplyUserAuthentication=false> SIPConfiguration_ApplyAllowedURIs=false
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/call?format=simple&action=axcall:GetSIPAccounts"'> SIPAccount_0_Id="sip_account_0"> SIPAccount_0_Username="local_account_ipv4_udp"> SIPAccount_0_Password=null> SIPAccount_0_Registrar=null> SIPAccount_0_PublicDomain=null> SIPAccount_0_IsDefault=false> SIPAccount_0_Transport="udp"> SIPAccount_0_CallerId="local_account_ipv4_udp"> SIPAccount_1_Id="sip_account_1"> SIPAccount_1_Username="1234"> SIPAccount_1_Password="password"> SIPAccount_1_Registrar="192.168.0.91"> SIPAccount_1_PublicDomain="exampledomain.com"> SIPAccount_1_IsDefault=true> SIPAccount_1_Transport="udp"> SIPAccount_1_CallerId="Entrance Door"> SIPAccount_1_DTMFConfigurationId="internal_config"> SIPAccount_2_Id="sip_account_2"> SIPAccount_2_Username="987654"> SIPAccount_2_Password="password2"> SIPAccount_2_Registrar=null> SIPAccount_2_PublicDomain="examplesecurity.se"> SIPAccount_2_IsDefault=false> SIPAccount_2_Transport="udp"> SIPAccount_2_CallerId="Entrance Door (Axis)"> SIPAccount_2_DTMFConfigurationId="remote_config"> SIPAccount_3_Id="sip_account_3"> SIPAccount_3_Username="12309"> SIPAccount_3_Password="password3"> SIPAccount_3_Registrar=null> SIPAccount_3_PublicDomain="[fd12:3456:789a:1::90]"> SIPAccount_3_PrioritizeIPv6=true> SIPAccount_3_IsDefault=false> SIPAccount_3_Transport="udp"> SIPAccount_3_CallerId="Entrance Door (Axis)"> SIPAccount_3_DTMFConfigurationId="remote_config"> SIPAccount_4_Id="sip_account_4"> SIPAccount_4_Username="local_account_ipv6_tcp"> SIPAccount_4_Password=null> SIPAccount_4_Registrar=null> SIPAccount_4_PublicDomain=null> SIPAccount_4_PrioritizeIPv6=true> SIPAccount_4_IsDefault=false> SIPAccount_4_Transport="tcp"> SIPAccount_4_CallerId="local_account_ipv6_tcp"
```

```
$ curl --anyauth "http://root:pass@192.168.0.90/vapix/call" -s -d '{"axcall:GetSIPAccounts":{}}'> {>   "SIPAccount": [>     {>       "Username": "local_account_ipv4_udp",>       "PublicDomain": null,>       "CallerId": "local_account_ipv4_udp",>       "Registrar": null,>       "Transport": "udp",>       "Password": null,>       "Id": "sip_account_0",>       "IsDefault": false>     },>     {>       "Username": "1234",>       "PublicDomain": "exampledomain.com",>       "CallerId": "Entrance Door",>       "DTMFConfigurationId": "internal_config",>       "Registrar": "192.168.0.91",>       "Transport": "udp",>       "Password": "password",>       "Id": "sip_account_1",>       "IsDefault": true>     },>     {>       "Username": "987654",>       "PublicDomain": "examplesecurity.se",>       "CallerId": "Entrance Door (Axis)",>       "DTMFConfigurationId": "remote_config",>       "Registrar": null,>       "Transport": "udp",>       "Password": "password2",>       "Id": "sip_account_2",>       "IsDefault": false>     },>     {>       "Username": "12309",>       "Registrar": null,>       "PublicDomain": "[fd12:3456:789a:1::90]",>       "SecondaryRegistrar": "",>       "SecondaryPublicDomain": "",>       "CallerId": "Entrance Door (Axis)",>       "DTMFConfigurationId": "internal_config",>       "Transport": "udp",>       "Password": "password3",>       "Id": "sip_account_3",>       "IsDefault": false>     },>     {>       "Username": "local_account_ipv6_tcp",>       "PublicDomain": null,>       "CallerId": "local_account_ipv6_tcp",>       "Registrar": null,>       "Transport": "tcp",>       "PrioritizeIPv6": true,>       "Password": null,>       "Id": "sip_account_4",>       "IsDefault": false>     }>   ]> }
```

```
curl --anyauth "http://root:pass@192.168.0.90/vapix/axast" -s -d '{"axast:PerformSpeakerTest":{}}'
```

```
{    "Fault": "env:Receiver",    "FaultCode": "ter:Action",    "FaultSubCode": "axast:DeviceNotCalibrated",    "FaultReason": "The Auto Speaker Test cannot be done without prior calibration.",    "FaultMsg": null}
```

```
curl --anyauth "http://root:pass@192.168.0.90/vapix/axast?format=simple&action=axast:PerformSpeakerTest"
```

```
Fault="env:Receiver"FaultCode="ter:Action"FaultSubCode="axast:DeviceNotCalibrated"FaultReason="The Auto Speaker Test cannot be done without prior calibration."FaultMsg=null
```

```
{    "id": "basic-device-info",    "version": "1.2",    "docLink": "link to doc",    "name": "API name as described in the VAPIX documentation."}
```

```
http://<ip-address>/axis-cgi/pingtest.cgi?ip=ip-address
```

```
http://<ip-address>/axis-cgi/tcptest.cgi?address=ip-address&port=port
```

- Get video and audio streams.
- Get information about supported features and current product configuration.
- Update product configuration.
- Control pan, tilt and zoom (PTZ) functionality.
- Control I/O and serial ports with connected external equipment.
- Subscribe to events and notifications.
- Record video to edge storage

- CGI: Common Gateway Interface – a standardized method of communication between a client (for example a web browser) and a server (for example a web server).
- TBD: To be done/designed – signifies that the referenced section/subsection/entity is intended to be specified, but has not reached a level of maturity to be public at this time.
- N/A: Not applicable - the feature/parameter/value is of no use in a specific task.
- URL: A Uniform Resource Location (URL) is a compact string representation for a resource available via the Internet. RFC 1738 describes the syntax and semantics for a URL.
- URI: A Uniform Resource Identifier (URI) is a compact string of characters for identifying an abstract or physical resource. RFC 3986 describes the generic syntax of URI.

- HTTP Code: 200 OK
- Content-Type: image/jpeg

- Boolean values are encoded as true and false.
- The NULL value is encoded as null.
- Strings are URL-encoded and may start and end with quotation marks. Example: "a+string%0A".
- Array keys are encoded as _index_ where index is an integer starting from 0.

- HTTP code: 400 Bad Request

- HTTP code: 400 Bad Request

- API Discovery
- Feature API version
- Feature API informing capabilities

| Date | Updates |
| --- | --- |
| 2024–11–05 | RAID Management: New events added Thermometry: Updated to API version 1.1 |
| 2024–11–04 | Virtual input API: Added parameter duration to virtualinput/activate.cgi. Overlay text action: Added parameter index. |
| 2024–10–25 | Network settings API: Support for MACsec-PSK functionality added |
| 2024–10–22 | Removed Integrating AXIS Q6000-E |
| 2024–10–15 | Optics Control: Added method setRelativeFocus and setRelativeMagnification. Added examples. |
| 2024–09–19 | Time API: Method maxYearSupported added, updated examples. |
| 2024–09–05 | Network settings API: Method setGlobalProxyConfiguration added. Privacy mask API: Upgraded to version 3. |
| 2024–08–01 | Privacy mask API, Geolocation API: Corrected security levels. Zipstream API: Corrected security levels for setprofile.cgi and listprofiles.cgi. Video streaming: Corrected security level for Always multicast. Guard tour API: Corrected security levels for GuardTour.G# and GuardTour.G#.Tour.T#. PTZ control API: Corrected security level for NbrOfCameras. System date and time: Corrected security level for Time.DST. |
| 2024–05–07 | Network settings API: Methods addVlan and removeVlan added. |
| 2024–05–03 | Dynamic overlay API: Deprecated scrolling text. |
| 2024–04–26 | DayNight API: New API |
| 2024–03–14 | Media stream over HTTP and Rate control: Added fullframerate option to the video bitrate priority sections. |
| 2024–03–06 | Input and outputs: Added parameters Output.DelayTime and Output.Mode |
| 2024–02–06 | Light control API: Extended getServiceCapabilities response. |
| 2024–01–03 | API Discovery service: Updated security levels |
| 2023–12–08 | RAID Management: New API Network settings API: Method setWLANConfiguration added |
| 2023–10–13 | Group View: New API |
| 2023–09–21 | Pencil privacy filter: New API |
| 2023–09–19 | Network settings API: Added options for wired link modes. Overlay API: New parameter added to Dynamic text overlays. NTP API: Updated getNTPInfo with parameters for min/max poll. Remote Syslog: Added the syslog format ‘AXIS’. Light control API: Added error codes. |
| 2023–09–01 | MQTT client API: Added parameters for HTTP/HTTPS proxy. |
| 2023–08–28 | Media stream over HTTP: New parameters added to media.cgi. |
| 2023–07–13 | PTZ driver management API: Deprecated events and methods, updated responses. |
| 2023–06–27 | Event streaming over WebSocket: New API Thermometry: New API |
| 2023–05–22 | Network settings API: Added support for wired MSCHAPv2 802.1x and the parameter useStaticDHCPFallback. |
| 2023–04–24 | Power settings: Added support for power profiles Reorganized content list |
| 2023–04–04 | Z-Wave API: New API Systemready API: previewmode and uptime parameters added. |
| 2023–02–08 | PIR sensor configuration: New API |
| 2023–01–02 | Media stream over HTTP: New API |
| 2022–11–30 | NVR PoE switch configuration: New API |
| 2022–11–22 | Analytics Metadata Producer Configuration: New API |
| 2022–11–09 | Pan/tilt/zoom API: AutoFocusType, QuickZoom and TiltIllumination parameters added to the PTZ control API. |
| 2022–11–07 | NTP API: Added NTS support information. Video streaming: Deprecated Bitmap support. Pan/tilt/zoom API: Added parameter removeallserverpresets. |
| 2022–09–30 | RTSP Adjustable Live Stream: New API |
| 2022–09–21 | Pan/tilt/zoom API: SpotFocus parameter added to the PTZ control API. |
| 2022–07–04 | System settings: Removed date.cgi. The time.cgi, found in Time API should be used instead. |
| 2022–07–01 | Event and action services: New method Network settings API: New method PTZ driver management API: Deprecated methods Video streaming: New parameters Zipstream technology: New methods The Audio API, Call service API and Media clip API have been removed from Network video, but are available in the Audio section. |
| 2022–05–02 | Signed Video: New API |
| 2022–04–28 | PTZ control API: New attributes/properties Supervised I/O: New API version |
| 2022–03–30 | Network settings API: New parameters Video streaming: Deprecated parameters |
| 2022–03–09 | Temperature control: New API Feature Flag Service: New API External IP Device Information: New API Export recording API: New parameters |
| 2022–02–08 | Certificate management API: Added the example Set HTTPS certificate and Assign a certificate to the IEEE 802.1x configuration Remote Syslog: Updated example Send syslogs over TLS |
| 2022–01–24 | Video streaming: New RTSP parameters Network settings API: Added the method scanWLANNetworks |
| 2021–12–22 | Stitching: New API |
| 2021–11–30 | Event and action services: Added examples to LED control. Input and outputs: Added Output event. MQTT client API: Split into MQTT client API and MQTT Event Bridge. MQTT Event Bridge: Split off from MQTT client API and extended with new examples and specifications. Pan/tilt/zoom API: New parameters added for PTZ.UserBasic and PTZ.UserAdv. Serial port API: Support for wait added. |
| 2021–11–08 | Event and action services: Added SHA256 public key support. Video output API: Removed support for legacy overlays. |
| 2021–10–26 | MQTT client API: Support for ALPN added Rate control: ABR stream status example added. |
| 2021–10–12 | Optics Control: New API mDNS-SD API: Minor updates Imaging API: Updated security levels |
| 2021–09–28 | API Discovery service: New parameter Imaging API: Minor updates Network settings: New parameter, minor updates Parameter management: Minor updates System settings: Deprecated method, minor updates Video streaming: Deprecated parameters |
| 2021–08–13 | Network settings: New parameter |
| 2021–08–04 | Rate control: Minor updates mDNS-SD API: New method |
| 2021–07–19 | Clear view: Minor updates Thermal imaging: Minor updates |
| 2021–07–09 | Network settings API: New method Event and action services: New action template Media clip API: Minor updates |
| 2021–06–11 | Capture mode: Minor updates I/O port management: Minor updates Media clip API: Minor updates Overlay API: Minor updates |
| 2021–06–02 | AXIS Object analytics API : Transferred to Applications I/O port API: Minor updates |
| 2021–05–21 | Basic device information: Minor updates Disk management API: Minor updates Event and action services: Minor updates I/O port API: Minor updates Network settings: Minor updates PTZ control: Minor updates |
| 2021–04–28 | Audio API: Minor updates Event and action services Media clip API: Minor updates Rate control: Minor updates MQTT client API: Minor updates Video output API: Minor updates Dynamic overlay API: Minor updates |
| 2021–04–15 | Clear view: New API |
| 2021–04–09 | AXIS Object analytics API: New API Video streaming: Minor updates |
| 2021–03–17 | Siren and light: New API Certificate management API: New API System settings: Minor updates I/O port API: Minor updates Queuing API: Minor updates |
| 2021–02–16 | Introduction: New tutorial API Light control API: Minor updates On-screen controls: Minor updates |
| 2021–02–11 | Event and action services: Minor updates Video streaming indicator: Minor updates MQTT client API: Minor updates Basic device information: Minor updates |
| 2020–12–18 | Recording group: New API OAK API: New API Input and outputs: Minor updates Edge storage API: Minor updates Network settings: Minor updates PTZ control API: Minor updates |
| 2020–11–24 | Find my device: New API PTZ Autotracker API: New API |
| 2020–11–10 | PTZ control API: Minor updates MQTT client API: Minor updates Recording API: Minor updates Basic device information: Minor updates |
| 2020–10–27 | Event and action services: Minor updates |
| 2020–10–22 | Network settings: Minor updates Light control API: Minor updates |
| 2020–10–06 | Pan/tilt/zoom API: Minor updates. Power settings: Minor updates. |
| 2020–09–30 | Overlay modifiers: Minor updates Event and action services: Minor updates |
| 2020–08–31 | View Area API: New API |
| 2020–08–26 | Imaging API: Minor updates Image source rotation: Minor updates |
| 2020–08–25 | Remote Syslog: New API |
| 2020–08–05 | Edge storage API: Minor updates Media clip API: Minor updates |
| 2020–07–22 | Custom HTTP header API: New API |
| 2020–07–16 | MQTT client API: New API |
| 2020–07–14 | Zipstream technology: Minor updates Edge storage API: Minor updates |
| 2020–06–16 | Zipstream technology: Minor updates |
| 2020–06–15 | Privacy mask API: Minor updates |
| 2020–06–11 | Media clip API: Minor updates System settings: Minor updates Disk management API: Minor updates |
| 2020–06–04 | Network settings: Minor updates Network settings API: Minor updates Image source rotation: Minor updates Video streaming: Minor updates |
| 2020–05–29 | Disk properties API: Minor updates. |
| 2020–05–19 | Disk management API: Minor updates On-screen controls: Minor updates |
| 2020–05–15 | QuadView configuration: New API |
| 2020–05–12 | Stream profiles: New API NTP API: New API Privacy mask API: Minor updates |
| 2020–05–04 | Firmware management API: Minor updates. |
| 2020–04–17 | Video streaming: Minor updates. |
| 2020–04–02 | Network settings API: Minor updates, clarified the documentation. |
| 2020–03–13 | Systemready API: New API. Export recording API: Minor update, clarified the documentation. Firmware management API: Minor update. |
| 2020–03–09 | I/O port management: New API. SSH: New API. |
| 2020–02–10 | Power settings: New API. Light control API : Minor update. Overlay image API: Minor update. On-screen controls: Minor update. |
| 2020–01–21 | Feature discovery: New information. |
| 2020–01–20 | Deprecated record/play.cgi. |
| 2019–12–20 | Source-specific multicast: New API. Regional settings: New API. |
| 2019–12–13 | Supervised I/O: New API. |
| 2019–11–15 | Light control API: New API. |
| 2019–11–14 | On-screen directional indicator: New API. |
| 2019–10–02 | Call service API: Minor updates. |
| 2019–09–25 | Event and action services: Minor updates. |
| 2019–09–18 | Overlay image API: New API. Rate control: Minor updates. |
| 2019–08–30 | mDNS-SD API: New API. |
| 2019–08–29 | Image source rotation: New API. |
| 2019–08–23 | Rate control: New API. Guard tour API: Minor update. |
| 2019–08–19 | Serial port API: Minor update. Guard tour API: Minor update. |
| 2019–08–09 | Time API: New API. System date and time: Minor update. |
| 2019–07–22 | I/O port API: Minor update. |
| 2019–07–10 | API versioning: Added information about API versioning. |
| 2019–06–05 | Video streaming indicator: New API. |
| 2019–06–03 | Pan/tilt/zoom API: Minor update. System settings: Minor update. Firmware management API: Minor update. |
| 2019–05–24 | Dynamic overlay API: Minor update. |
| 2019–05–02 | On-screen controls: Clarified the documentation. |
| 2019–04–26 | Network settings API: New API. PTZ control API: Minor update. |
| 2019–04–17 | System settings: Minor updates. Basic device information: Minor updates. |
| 2019–04–15 | Scene profile API: Minor updates. Basic device information: Minor updates. Server report: Minor updates. |
| 2019–03–19 | Imaging API: New API. |
| 2019–02–20 | Firmware management API: Updated error codes.N/A: Removed documentation that was not included in the firmware release. |
| 2018–12–20 | Scene profile API: Added parameters and clarified the documentation.Event and action services: Clarified the documentation. |
| 2018–12–14 | Capture mode: New API.API Discovery service: New API.Basic device information: New API. |
| 2018–10–01 | Dewarped views: Added support for additional views.Edge storage API: Clarified the documentation.Zipstream technology: Added support for minimum FPS. |
| 2018–09–05 | Audio API: Added new Audio compression formats & Audio source parameters.Video output API: Added support for picture-in-picture.System settings: Updated Content-type in the Add, modify and delete user accounts examples. |
| 2018–05–18 | Privacy mask API: Updated the API and added support for Adaptive mosaic, Polygon and Multi channel products. |
| 2018–04–26 | Audio API: Updated the information in the transmit audio data-section. |
| 2018–04–06 | Firmware management API: New API. |
| 2018–03–14 | On-screen controls: Clarified the documentation. |
| 2018–02–28 | Decoder API: New API. |
| 2018–01–19 | Dynamic overlay API, Overlay modifiers & Geolocation API: New API:s.Edge storage API: Corrected an error in the Disk management API parameters table Parameters.Harmonized content across sections. |
| 2017–10–10 | Video output API: New API.Video streaming: Corrected example with multicast in RTSP SETUP. Also added the parameter FrameSkipMode in Parameter specification RTSP URL. |
| 2017–09–22 | Video streaming: Added information about videozfpsmode and videozminfps Parameter specification RTSP URL.Event and action services: Login examples using ‘Basic’ has been updated to use ‘Digest’ instead. Create web service connections. |
| 2017–09–01 | Deprecated zipstream strengths 60–100 |
| 2017–07–26 | PTZ control API: Corrected example in section PTZ control |
| 2017-05-04 | Media clip API update: Added stopclip.cgi and support for MP3.Call service API update: Added support for IPv6. |
| 2017–04–12 | On-screen controls: New API. |
| 2017–03–28 | Section Applications moved from VAPIX® Network video to VAPIX® applications. |
| 2017–03–09 | Audio Control Service API: Moved to VAPIX® Audio systems.Audio Relay Service API: Moved to VAPIX® Audio systems.Auto Speaker Test API: Moved to VAPIX® Audio systems.Audio API: Corrected example in section .RTSP API: Added videocodec=h265VMD4: Preset support for mechanical PTZ cameras. |
| 2017–02–27 | Audio Control Service API: New API.Audio Relay Service API: New API. |
| 2016–12–16 | Speed dry API: New API. |
| 2016–12–07 | Video Motion Detection 4 API: New API (moved to the Applications folder as of 2017–03–28).: Updated. |
| 2016–10–18 | Scene profile API: New API.Zipstream technology: Updated API. |
| 2016–10–14 | Axis VAPIX® version 2 released. |
| 2016–08–26 | Focus recall API: New API. |
| 2016–07–07 | Call service API release 1.7: Added encryption and certificate configuration. Added attributes in SIP configuration and SIP accounts. Added calling timeout in SIP configuration.Pan/Tilt/Zoom API: Corrected PTZ error event topic name and description. |
| 2016–05–27 | General purpose I/O service API: New API.Heartbeat service API: New API.Trigger data: Deprecated. Replaced by Event data streaming. |
| 2016–01–27 | Call service API release 1.6: Added audio codec priority and stream parameter configuration.Percent encoding: Added list of percent-encoded characters. |
| 2015–11–13 | Virtual input API: Improved descriptions.Applications: All application API:s moved to a single chapter. |
| 2015–06–30 | Audio API: Added codec opus and AudioSource.A#.Channel parameters.Auto speaker test API: New API.Pan/Tilt/Zoom API: Corrected description of continuousfocusmove in PTZ control API /com/ptz.cgi |
| 2015–05–25 | Orientation API: New API. |
| 2015–05–05 | Thermal imaging: New API. Includes Color palettes, Isotherm API and Temperature alarm API.Edge storage API: Added disk encryption in Disk management API and Disk properties API. Supported in AXIS OS 5.80.Event and action services: Parameter-based motion detection and its events are deprecated in AXIS OS 5.80 in later. Replaced by AXIS Video motion detection 3. |
| 2015–04–24 | Call service API: New API. |
| 2015–04–07 | Axis Zipstream technology: New API. |
| 2015–03–11 | Edge storage API: Added Recording storage limit API and Export recording API.I/O port API and Virtual input API: Clarified that URI-reserved characters must be percent-encoded.Event and action services: Added SFTP recipient. Supported in AXIS OS 5.70 and later. |
| 2015–02–16 | Shock detection API: New API.Digital autotracking API: Clarified that image rotation affects small object filter.Video motion detection 3 API: Clarified that image rotation affects small object filter. |
| 2015–01–08 | Digital autotracking API: Added Digital autotracking version 2.Video motion detection 3 API: Added information about multichannel products. |
| 2014–12–16 | Integrating AXIS Q6000-E: New API. |
| 2014–12–02 | Parameters Log.System and Log.Access removed in AXIS OS 5.60 and later.Edge storage API: Removed extra " characters.Event data streaming: Minor correctionsFTP recipient: Parameter temporary supported from AXIS OS 5.70. Added missing parameter upload_path. |
| 2014–10–30 | Video Motion Detection 3 API: New API. |
| 2014–10–14 | Axis VAPIX®. Initial version. |

| Character | Percent encoding |
| --- | --- |
| blank space | %20 |
| " | %22 |
| # | %23 |
| % | %25 |
| & | %26 |
| , | %2C |
| / | %2F |
| : | %3A |
| = | %3D |
| ? | %3F |
| \ | %5C |

| Security level | Description |
| --- | --- |
| viewer | Users with viewer, operator or admin rights can access this functionality. |
| operator | Users with operator or admin rights can access this functionality. |
| admin | Users with admin rights can access this functionality. |

| Attribute | Description |
| --- | --- |
| SchemaVersion | The version of the XML schema that the response is formatted according to. |
| Deprecated | true = The schema version is deprecated and will eventually be removed. Deprecated schema versions should not be used.false = The schema version is not deprecated. |

