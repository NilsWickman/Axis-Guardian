# Shock detection API

**Source:** https://developer.axis.com/vapix/network-video/shock-detection-api/
**Last Updated:** Aug 28, 2025

---

# Shock detection API

## Description​

### Identification​

## Common examples​

## Check if enabled​

## Enable shock detection​

## Get sensitivity level​

## Set sensitivity level​

## Get schema versions​

## General success response​

## General error response​

## Shock detection event​

Shock detection is available in Axis products with built-in orientation devices such as accelerometers or gyroscopes. When shock detection is enabled, the camera’s position and acceleration is monitored. If the camera is tilted or displaced from its current position, or if the camera is subject to punches, hard blows or similar, an alarm is triggered and the Axis product emits a shock detection event.

The alarm is triggered immediately when the camera is punched or displaced. There is no pre-trigger time. After the alarm, position and acceleration monitoring continues from the camera’s new position. To prevent multiple events for the same displacement, a new shock detection event will not be emitted until 5 seconds has passed.

Shock detection sensitivity can be set to an integer between 0 and 100. Low sensitivity means that a hit must be quite powerful to trigger an alarm. High sensitivity means that very small displacements, including vibrations, will be trigger alarms.

The Shock detection API is used to enable, disable and adjust the Axis product’s shock detection functionality.

Supported functionality:

VAPIX Shock detection API is available if

Retrieve supported XML schema versions.

Request:

Response:

Enable shock detection in the Axis product.

Request:

Check if shock detection is enabled.

Request:

Response:

Set shock detection sensitivity to 60.

Request:

Retrieve the shock detection sensitivity level.

Request:

Response:

Use shockdetection/getenabled.cgi to check if shock detection is enabled.

Request

Syntax:

with the following arguments and values:

Response

Responses from shockdetection/getenabled.cgi

Success

A successful request returns true is shock detection is enabled and false if shock detection is disabled.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use shockdetection/setenabled.cgi to enable and disable shock detection.

Request

Syntax:

with the following arguments and values:

Response

Responses from shockdetection/setenabled.cgi

Success

If the request is successful, shock detection is enabled and a GeneralSuccess response is returned. See General success response.

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use shockdetection/getsensitivitylevel.cgi to retrieve the current sensitivity level.

Request

Syntax:

with the following arguments and values:

Response

Responses from shockdetection/getsensitivitylevel.cgi

Success

A successful request returns the current sensitivity level.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use shockdetection/setsensitivitylevel.cgi to set the shock detection sensitivity level.

Shock detection sensitivity can be set to an integer between 0 and 100. Low sensitivity means that a hit must be quite powerful to trigger an alarm. High sensitivity means that very small displacements, including vibrations, will be trigger alarms.

Request

Syntax:

with the following arguments and values:

Response

Responses from shockdetection/setsensitivitylevel.cgi

Success

If the request is successful, the sensitivity level is set to the submitted value and a GeneralSuccess response is returned. See General success response.

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40

Use shockdetection/getschemaversion.cgi to retrieve the supported XML schema versions.

Request

Syntax:

This CGI has no arguments

Response

Responses from shockdetection/getschemaversion.cgi

Success

A successful request returns the supported schema version.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

General success response in Shock Detection API.

Body:

Supported elements, attributes and values:

General error response in Shock detection API.

Body:

Supported elements, attributes and values:

The shock detection event tns1:Device/tnsaxis:Tampering/ShockDetected is a stateless event.

To retrieve the event declaration, use aev:GetEventInstances.

Event declaration:

The topic is tns1:Device/tnsaxis:Tampering/ShockDetected. Channel is the video channel and is intended for future use.

```
http://<servername>/axis-cgi/shockdetection/getschemaversion.cgi
```

```
HTTP/1.0 200 OKContent-type: text/xml<?xml version="1.0" encoding="utf-8"?><ShockDetectionResponse xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1" SchemaVersion="1.0">  <Success>    <GetSchemaVersionsSuccess>      <SchemaVersion>        <VersionNumber>1.0</VersionNumber>        <Deprecated></Deprecated>      </SchemaVersion>    </GetSchemaVersionsSuccess>  </Success></ShockDetectionResponse>
```

```
http://<servername>/axis-cgi/shockdetection/setenabled.cgi?schemaversion=1&enabled=true
```

```
http://<servername>/axis-cgi/shockdetection/getenabled.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-type: text/xml<?xml version="1.0" encoding="UTF-8"?><ShockDetectionResponse xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1" SchemaVersion="1.0">  <Success>    <GetEnabledSuccess>      <Enabled>true</Enabled>    </GetEnabledSuccess>  </Success></ShockDetectionResponse>
```

```
http://<servername>/axis-cgi/shockdetection/setsensitivitylevel.cgi?schemaversion=1&level=60
```

```
http://<servername>/axis-cgi/shockdetection/getsensitivitylevel.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-type: text/xml<?xml version="1.0" encoding="UTF-8"?><ShockDetectionResponse xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1" SchemaVersion="1.0">  <Success>    <GetSensitivityLevelSuccess>      <SensitivityLevel>        <Level>60</Level>      </SensitivityLevel>    </GetSensitivityLevelSuccess>  </Success></ShockDetectionResponse>
```

```
http://<servername>/axis-cgi/shockdetection/getenabled.cgi?<argument>=<value>&[<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><ShockDetectionResponse    xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1"    SchemaVersion="1.0">    <Success>        <GetEnabledSuccess>            <Enabled>[true | false]</Enabled>        </GetEnabledSuccess>    </Success></ShockDetectionResponse>
```

```
http://<servername>/axis-cgi/shockdetection/setenabled.cgi?<argument>=<value>&[<argument>=<value>]
```

```
http://<servername>/axis-cgi/shockdetection/getsensitivitylevel.cgi?<argument>=<value>&[<argument>=<value>]
```

```
<?xml version="1.0" encoding="utf-8" ?><ShockDetectionResponse    xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1"    SchemaVersion="1.0">    <Success>        <GetSensitivityLevelSuccess>            <SensitivityLevel>                <Level>[level]</Level>            </SensitivityLevel>        </GetSensitivityLevelSuccess>    </Success></ShockDetectionResponse>
```

```
http://<servername>/axis-cgi/shockdetection/setsensitivitylevel.cgi?<argument>=<value>&[<argument>=<value>]
```

```
http://<servername>/axis-cgi/shockdetection/getschemaversion.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><ShockDetectionResponse    xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1"    SchemaVersion="1.0">    <Success>        <GetSchemaVersionsSuccess>            <SchemaVersion>                <VersionNumber>[major.minor]</VersionNumber>                <Deprecated>[true/false]</Deprecated>            </SchemaVersion>        </GetSchemaVersionsSuccess>    </Success></ShockDetectionResponse>
```

```
<?xml version="1.0" encoding="UTF-8" ?><ShockDetectionResponse    xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1"    SchemaVersion="1.0">    <Success>        <GeneralSuccess />    </Success></ShockDetectionResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><ShockDetectionResponse    xmlns="http://www.axis.com/vapix/http_cgi/shockdetection1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/shockdetection1 http://www.axis.com/vapix/http_cgi/shockdetection1"    SchemaVersion="1.0">    <Error>        <GeneralError>            <ErrorCode>[error code]</ErrorCode>            <ErrorDescription>[description]</ErrorDescription>        </GeneralError>    </Error></ShockDetectionResponse>
```

```
<tns1:Device aev:NiceName="Device">    <tnsaxis:Tampering aev:NiceName="Tampering">        <ShockDetected wstop:topic="true" aev:NiceName="Shock Detected">            <aev:MessageInstance>                <aev:SourceInstance>                    <aev:SimpleItemInstance aev:NiceName="Channel" Type="xsd:int" Name="channel">                        <aev:Value>1</aev:Value>                    </aev:SimpleItemInstance>                </aev:SourceInstance>                <aev:DataInstance />            </aev:MessageInstance>        </ShockDetected>    </tnsaxis:Tampering></tns1:Device>
```

- Enable and disable shock detection
- Control the sensitivity level

- Property: root.Properties.Tampering.ShockDetection=yes
- AXIS OS: 5.50 and later

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| ShockDetectionResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| GetEnabledSuccess | Successful request. |
| Enabled | true = Shock detection is enabled.false = Shock detection is disabled. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| enabled=<boolean> | true false | true = Enable shock detection.false = Disable shock detection. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| ShockDetectionResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| GetSensitivityLevelSuccess | Successful request |
| SensitivityLevel | Contains the sensitivity level. |
| Level | Integer defining the sensitivity level. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| level=<integer> | 0 .. 100 | The shock detection sensitivity level.0 = Low sensitivity100 = High sensitivity |

| Element | Description |
| --- | --- |
| ShockDetectionResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| GetSchemaVersionsSuccess | Successful request |
| SchemaVersion | Contains the schema version |
| VersionNumber | Schema version in format major.minor where major is the major version and minor the minor version. |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used.Default: false |

| Element | Description |
| --- | --- |
| ShockDetectionResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request |
| GeneralSuccess | Successful request |

| Element | Description |
| --- | --- |
| ShockDetectionResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| GeneralError | Error |
| ErrorCode | A numeric error code. See table below. |
| ErrorDescription | Description of the error |

| Error code | Description | CGI |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid request. | All |
| 30 | Unable to set shock detection sensitivity. Specified value is out of range. | setsensitivitylevel.cgi |
| 40 | Specified version is not supported. | All |

