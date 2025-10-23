# Application API

**Source:** https://developer.axis.com/vapix/applications/application-api/
**Last Updated:** Sep 23, 2025

---

# Application API

## Description​

### Identification​

## Common examples​

## Upload application​

### Request​

### Response​

## Control application​

### Request​

### Response​

## Configure applications​

### Schema for config.cgi response​

## Manage license keys​

### Request​

### Response​

## List installed applications​

### Request​

### Response​

### Schema for list.cgi response​

## Read general information​

Use VAPIX® Application API to upload, control and manage applications and their license keys.

Supported functionality:

VAPIX® Application API is supported if:

list.cgi requires:

config.cgi requires:

These examples demonstrate how to use the Application API. Text marked in bold should be replaced by application-specific values.

Upload an application to the Axis product.

Request:

Upload a license key.

Request:

Allow an unsigned application to be installed.

Start the application.

Request:

List installed applications.

Request:

Response:

The applications/upload.cgi is used to upload applications to the Axis product. Applications are installed automatically when uploaded.

Syntax:

Body:

Responses to applications/upload.cgi

Success:

Body:

Error:

If the request failed, the following is returned.

Body:

The applications/control.cgi is used to start, stop, restart and remove the application.

Syntax

With the following argument and values:

Responses to applications/control.cgi

Success:

Body:

Error:

If the request failed, the following is returned.

Body:

The applications/config.cgi is used to access or configure settings that are used by all applications, such as whether the device will allow unsigned applications to be installed.

Request

Syntax

With the following argument and values:

Configuration parameters

Response

Responses to applications/config.cgi

Success:

Body

Response example

The response body contains a key and value corresponding to the param name="configname" in the request.

Error:

The following will be returned if the request failed.

Body

Response example

The applications/license.cgi is used to upload, install and remove license keys.

Syntax

With the following arguments and values.

Responses to applications/license.cgi

Success:

Body:

Error:

If the request failed, the following is returned.

Body:

The applications/list.cgi is used to list information about installed applications.

applications/list.cgi is supported for Properties.EmbeddedDevelopment.Version=1.20 and later.

Syntax

This CGI has no arguments.

Response to applications/list.cgi. The response is in XML format.

For the XML schema, see Schema for list.cgi response

Body:

Supported elements, attributes and values:

The applications/info.cgi is used to retrieve general information related to ACAP support on the device.

Request

Syntax:

This CGI has no arguments.

Response

Responses to applications/info.cgi.

Success:

Body:

Supported elements, attributes and values:

```
POST /axis-cgi/applications/upload.cgi HTTP/1.1Content-Type: multipart/form-data; boundary=fileboundaryContent-Length: <content-length>fileboundaryContent-Disposition: form-data; name="packfil"; filename="ExampleApp.eap"Content-Type: application/octet-stream<application package data>
```

```
POST /axis-cgi/applications/license.cgi?action=uploadlicensekey&package=ExampleApp HTTP/1.1Content-Type: multipart/form-data; boundary=fileboundaryContent-Length: <content-length>fileboundaryContent-Disposition: form-data; name="licenseKey"; filename="ExampleAppLicenseKey.xml"Content-Type: application/octet-stream<license key data>
```

```
http://<servername>/axis-cgi/applications/config.cgi?action=set&name=AllowUnsigned&value=true
```

```
http://myserver/axis-cgi/applications/control.cgi?action=start&package=ExampleApp
```

```
http://myserver/axis-cgi/applications/list.cgi
```

```
<reply result="ok">    <application        Name="CrossLineDetection"        ApplicationID="3051"        NiceName="AXIS Cross Line Detection"        Vendor="Axis Communications"        Version="1.1"        Status="Running"        License="Valid"        ConfigurationPage="local/CrossLineDetection/info.html"        VendorHomePage="https://www.axis.com"        LicenseName="Proprietary" />    <application        Name="DigitalAutotracking"        ApplicationID="6789"        NiceName="AXIS Digital Autotracking beta1"        Vendor="Axis Communications"        Version="1.0"        Status="Idle"        License="None"        ConfigurationPage="local/DigitalAutotracking/index.html"        VendorHomePage="https://www.axis.com"        LicenseName="available" />    <application        Name="Metadata"        ApplicationID="22929"        NiceName="AXIS Metadata"        Vendor="Axis Communications"        Version="1.0"        Status="Stopped"        License="Invalid"        LicenseExpirationDate="2011-01-01"        ConfigurationPage="local/Metadata/setup.html"        VendorHomePage="https://www.axis.com"        LicenseName="available" />    <application        Name="VideoMotionDetection"        ApplicationID="8546"        NiceName="AXIS Video Motion Detection"        Vendor="Axis Communications"        Version="2.1"        Status="Stopped"        License="None"        ConfigurationPage="local/VideoMotionDetection/config.html"        VendorHomePage="https://www.axis.com"        LicenseName="available" />    <application        Name="ExampleApp"        ApplicationID="1"        NiceName="An Example Application"        Vendor="Example inc"        Version="1.0"        Status="Stopped"        License="Custom"        ConfigurationPage="local/ExampleApp/settings.html"        VendorHomePage="https://www.example.inc"        LicenseName="Proprietary" /></reply>
```

```
http://<servername>/axis-cgi/applications/upload.cgi
```

```
POST http://<servername>/axis-cgi/applications/upload.cgi HTTP/1.1Content-Type: multipart/form-data; boundary=fileboundaryContent-Length: <content-length>fileboundaryContent-Disposition: form-data; name="packfil"; filename="application_name"Content-Type: application/octet-stream<application package data>
```

```
OK
```

```
Error: <error code>
```

```
http://<servername>/axis-cgi/applications/control.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
OK
```

```
Error: <error code>
```

```
http://<servername>/axis-cgi/applications/config.cgi?action=<action>&name=<configname>&value=<configvalue>
```

```
<reply result="ok">    <param name="configname" value="configvalue" /></reply>
```

```
<reply result="ok">    <param name="AllowUnsigned" value="true" /></reply>
```

```
<reply result="error">    ...</reply>
```

```
<reply result="error">    <error type="1" message="Error: gdbus call failed" /></reply>
```

```
<?xml version="1.0" encoding="utf-8" ?><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">    <xs:element name="reply">        <xs:complexType>            <xs:sequence>                <xs:element name="param">                    <xs:complexType>                        <xs:simpleContent>                            <xs:extension base="xs:string">                                <xs:attribute type="xs:string" name="name" />                                <xs:attribute type="xs:string" name="value" />                            </xs:extension>                        </xs:simpleContent>                    </xs:complexType>                </xs:element>            </xs:sequence>            <xs:attribute type="xs:string" name="result" />        </xs:complexType>    </xs:element></xs:schema>
```

```
http://<servername>/axis-cgi/applications/license.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
OK
```

```
Error: <error code>
```

```
http://<servername>/axis-cgi/applications/list.cgi
```

```
<reply result="ok">    <application        Name="<Application Name>"        NiceName="<Nice name>"        Vendor="<Vendor name>"        Version="<Version>"        ApplicationID="<ID>"        License="<License status>"        LicenseExpirationDate="<Expiration date>"        Status="<Application status>"        ConfigurationPage="<Configuration link>"        ValidationResult="<Validation URL>" />        <application ... />    ...</reply>
```

```
<?xml version="1.0" encoding="utf-8" ?><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">    <xs:simpleType name="EnumResult">        <xs:restriction base="xs:string">            <xs:enumeration value="ok" />            <xs:enumeration value="error" />        </xs:restriction>    </xs:simpleType>    <xs:simpleType name="StatusType">        <xs:restriction base="xs:string">            <xs:enumeration value="Running" />            <xs:enumeration value="Stopped" />            <xs:enumeration value="Idle" />        </xs:restriction>    </xs:simpleType>    <xs:simpleType name="LicenseType">        <xs:restriction base="xs:string">            <xs:enumeration value="Valid" />            <xs:enumeration value="Invalid" />            <xs:enumeration value="Missing" />            <xs:enumeration value="Custom" />            <xs:enumeration value="None" />        </xs:restriction>    </xs:simpleType>    <xs:complexType name="ErrorType">        <xs:attribute name="type" type="xs:string" use="required" />        <xs:attribute name="message" type="xs:string" use="required" />        <xs:anyAttribute processContents="lax" />    </xs:complexType>    <xs:complexType name="ApplicationType">        <xs:attribute name="Name" type="xs:string" use="required" />        <xs:attribute name="ApplicationID" type="xs:integer" />        <xs:attribute name="NiceName" type="xs:string" />        <xs:attribute name="Vendor" type="xs:string" />        <xs:attribute name="Version" type="xs:string" />        <xs:attribute name="Status" type="StatusType" />        <xs:attribute name="License" type="LicenseType" />        <xs:attribute name="LicenseExpirationDate" type="xs:string" />        <xs:attribute name="ConfigurationPage" type="xs:string" />        <xs:attribute name="VendorHomePage" type="xs:string" />        <xs:attribute name="LicenseName" type="xs:string" />        <xs:anyAttribute processContents="lax" />    </xs:complexType>    <xs:element name="reply">        <xs:complexType>            <xs:choice>                <xs:element name="application" type="ApplicationType" minOccurs="0" maxOccurs="unbounded" />                <xs:element name="error" type="ErrorType" minOccurs="0" />            </xs:choice>            <xs:attribute name="result" type="EnumResult" />        </xs:complexType>    </xs:element></xs:schema>
```

```
http://<servername>/axis-cgi/applications/info.cgi
```

```
<reply result="ok">    <supportedSdks>        <sdk>acap3</sdk>        <sdk>acap4-cv</sdk>        <sdk>acap4-native</sdk>    </supportedSdks></reply>
```

- Upload applications to the Axis product. See Upload application.
- Start, stop, restart and remove applications. See Control application.
- Configure settings usable by all applications. See Configure applications.
- Upload, install and remove license keys. See Manage license keys.
- List installed applications. See List installed applications.

- Property: Properties.EmbeddedDevelopment.Version exists.

- Property: Properties.EmbeddedDevelopment.Version=1.20 and later.

- AXIS OS: 11.2 or later

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

| Error code | Description |
| --- | --- |
| 1 | Invalid package. The package is not an Embedded Axis Package. |
| 2 | Verification failed. The verification of the package contents failed. The signature is either missing or invalid. |
| 3 | Package too large. The package file is too large or the disk is full. |
| 5 | Package not compatible. The package is not compatible with the Axis product. See the product logs for more information. |
| 10 | Unspecified error. See the product logs for more information. |
| 12 | Upload currently unavailable. A package upload is ongoing. |
| 13 | Installation failed. The package requires a user or group that is not allowed. |
| 14 | Package already exists. The package already exists in the application store but with a different letter case. |
| 15 | Operation timed out. The outcome of the operation could not be determined. Check logs for more information. |
| 29 | Invalid manifest.json or package.conf file. |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | start stop restart remove | start = Start the application. stop = Stop the application. restart = Restart the application. remove = Remove the application. |
| package=<string> | <package name> | The application to perform the action on. |
| returnpage=<string> | <path to return page> | Optional. The web page to return to after performing the action. |

| Error code | Description |
| --- | --- |
| 1 | Invalid package. The package is not an Embedded Axis Package or it contains an invalid manifest. |
| 4 | Application not found. The specified application package could not be found. |
| 6 | The application is already running. |
| 7 | Application not running. The application must be running to perform the action. |
| 9 | Too many applications are running. The application cannot be started. This limitation was removed in AXIS OS 12.6 |
| 10 | Unspecified error. See the product logs for more information. |
| 15 | Operation timed out. The outcome of the operation could not be determined. Check logs for more information. |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | set get | set = Sets the value of a config parameter. get = Retrieves the value of a config parameter. |
| name=<string> | AllowUnsigned (from AXIS OS 11.2), AllowRoot (AXIS OS 11.5-11.11) | The name of the config parameter that should be operated on. Valid values are described in the Configuration parameters table below. |
| value=<string> Optional | true false | Should be used when the action is set to specify the required value for the config parameter. |

| Configuration name | Type | Default value | Description |
| --- | --- | --- | --- |
| AllowUnsigned | Boolean | true (until AXIS OS 11.11), false (from AXIS OS 12.0) | Controls whether unsigned applications can be installed. Can be either true or false. |
| AllowRoot | Boolean | true (until AXIS OS 11.7), false (from AXIS OS 11.8) | Controls whether applications running as root can be installed, and if the install scripts are run as root or as the application user. Can be either true or false. |

| Parameter | Description |
| --- | --- |
| param name=<key> | The parameter name. |
| value=<true | false> | The parameter value. |

| Error code | Description |
| --- | --- |
| 1 | Malformed request. value must be either true or false. (From AXIS OS 12.2, this has been replaced with HTTP 400 Bad Request) |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | uploadlicensekey removelicensekey | uploadlicensekey = Upload and install a license key. removelicensekey = Remove a license key. |
| package=<string> | <package name> | The name of the application to which the license key belongs. |

| Error code | Description |
| --- | --- |
| 21 | Invalid license key file. |
| 22 | File upload failed. See the product logs for more information. |
| 23 | Failed to remove the license key file. See the product logs for more information. |
| 24 | The application is not installed. |
| 25 | The key’s application ID does not match the installed application. |
| 26 | The license key cannot be used with this version of the application. |
| 30 | Wrong serial number. |
| 31 | The license key has expired. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| application | Information about one application | Name | Application short name. |
|  |  | NiceName | Application official name. |
|  |  | Vendor | Application vendor. |
|  |  | Version | Application version. |
|  |  | ApplicationID | Application ID |
|  |  | License | License status: Valid = License is installed and valid. Invalid = License is installed but not valid. Missing = No license is installed. Custom = Custom license is used. License status cannot be retrieved. None = Application does not require any license. |
|  |  | LicenseExpirationDate | Date (YYYY-MM-DD) when the license expires. |
|  |  | Status | Application status: Running = Application is running. Stopped = Application is not running. Idle = Application is idle. |
|  |  | ConfigurationPage | Relative URL to application configuration page. |
|  |  | ValidationResult | Complete URL to a validation or result page. |

| Argument | Description |
| --- | --- |
| supportedSdks | SDKs whose applications able to run on the device. |
| sdk | A specific SDK. |

