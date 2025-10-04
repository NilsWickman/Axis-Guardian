# Orientation API

**Source:** https://developer.axis.com/vapix/network-video/orientation-api/
**Last Updated:** Aug 28, 2025

---

# Orientation API

## Description​

### Identification​

## Common examples​

## Get schema versions​

## Get longitudinal angle​

## Get lateral angle​

## General error response​

VAPIX® Orientation API is used to retrieve information about the camera lens orientation. The API is available in products with built-in orientation devices such as gyroscopes and accelerometers.

Supported functionality:

Longitudinal angle. The longitudinal angle (0 to 359 degrees) is the lens’ rotation around its longitudinal axis.



Lateral angle. The lateral angle (0 to 180 degrees) is the angle between the lens’ longitudinal axis and a line perpendicular to the ground surface. 0 degrees represents a lens pointing straight downwards. 180 degrees represents a lens pointing straight upwards.



VAPIX® Orientation API is available if:

Retrieve supported XML schema versions.

Request:

Response:

Get the longitudinal angle.

Request:

Response:

Get the lateral angle.

Request:

Response:

Use orientation/getschemaversions.cgi to retrieve the supported XML schema versions.

Request

Syntax:

This CGI has no arguments

Response

Responses from orientation/getschemaversions.cgi

Success

A successful request returns the supported schema version.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use orientation/getlongitudinalvalue.cgi to retrieve the longitudinal angle.

Request

Syntax:

with the following arguments and values:

Response

Responses from orientation/getlongitudinalvalue.cgi

Success

A successful request returns the lateral angle.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

Use orientation/getlateralvalue.cgi to retrieve the lateral angle.

Request

Syntax:

with the following arguments and values:

Response

Responses from orientation/getlateralvalue.cgi

Success

A successful request returns the lateral angle.

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 40

General error response in the orientation API.

Body:

Supported elements, attributes and values:

```
http://<servername>/axis-cgi/orientation/getschemaversions.cgi
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><OrientationResponse xmlns="http://www.axis.com/vapix/http_cgi/orientation1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1" SchemaVersion="1.0">  <Success>    <GetSchemaVersionsSuccess>      <SchemaVersion>        <VersionNumber>1.0</VersionNumber>        <Deprecated>false</Deprecated>      </SchemaVersion>    </GetSchemaVersionsSuccess>  </Success></OrientationResponse>
```

```
http://<servername>/axis-cgi/orientation/getlongitudinalvalue.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><OrientationResponse xmlns="http://www.axis.com/vapix/http_cgi/orientation1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1" SchemaVersion="1.0">  <Success>    <GetLongitudinalValueSuccess>      <LongitudinalValue>        <Value>180</Value>      </LongitudinalValue>    </GetLongitudinalValueSuccess>  </Success></OrientationResponse>
```

```
http://<servername>/axis-cgi/orientation/getlateralvalue.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><OrientationResponse xmlns="http://www.axis.com/vapix/http_cgi/orientation1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1" SchemaVersion="1.0">  <Success>    <GetLateralValueSuccess>      <LateralValue>        <Value>72</Value>      </LateralValue>    </GetLateralValueSuccess>  </Success></OrientationResponse>
```

```
http://<servername>/axis-cgi/orientation/getschemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><OrientationResponse    xmlns="http://www.axis.com/vapix/http_cgi/orientation1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1"    SchemaVersion="1.0">    <Success>        <GetSchemaVersionsSuccess>            <SchemaVersion>                <VersionNumber>[major.minor]</VersionNumber>                <Deprecated>[true/false]</Deprecated>            </SchemaVersion>            [...]        </GetSchemaVersionsSuccess>    </Success></OrientationResponse>
```

```
http://<servername>/axis-cgi/orientation/getlongitudinalvalue.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><OrientationResponse    xmlns="http://www.axis.com/vapix/http_cgi/orientation1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1"    SchemaVersion="1.0">    <Success>        <GetLongitudinalValueSuccess>            <LongitudinalValue>                <Value>[angle]</Value>            </LongitudinalValue>        </GetLongitudinalValueSuccess>    </Success></OrientationResponse>
```

```
http://<servername>/axis-cgi/orientation/getlateralvalue.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><OrientationResponse    xmlns="http://www.axis.com/vapix/http_cgi/orientation1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1"    SchemaVersion="1.0">    <Success>        <GetLateralValueSuccess>            <LateralValue>                <Value>[angle]</Value>            </LateralValue>        </GetLateralValueSuccess>    </Success></OrientationResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><OrientationResponse    xmlns="http://www.axis.com/vapix/http_cgi/orientation1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/orientation1 http://www.axis.com/vapix/http_cgi/orientation1"    SchemaVersion="1.0">    <Error>        <GeneralError>            <ErrorCode>[error code]</ErrorCode>            <ErrorDescription>[description]</ErrorDescription>        </GeneralError>    </Error></OrientationResponse>
```

- Get the longitudinal angle.
- Get the lateral angle.

- Property: Properties.Orientation.Reporting=yes

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

| Element | Description |
| --- | --- |
| OrientationResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetSchemaVersionsSuccess | Successful response from getschemaversions.cgi. |
| SchemaVersion | Contains one schema version. |
| VersionNumber | Schema version. See XML schemas. |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| OrientationResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetLongitudinalValueSuccess | Successful response from getlongitudinalvalue.cgi. |
| LongitudinalValue | Contains the longitudinal angle. |
| Value | The angle in degrees. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | Integer | Required. The major version of the XML Schema to use for the response. See XML schemas. |

| Element | Description |
| --- | --- |
| OrientationResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetLateralValueSuccess | Successful response from getlateralvalue.cgi. |
| LateralValue | Contains the lateral angle. |
| Value | The angle in degrees. |

| Element | Description |
| --- | --- |
| OrientationResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Error | The request contains errors. |
| GeneralError | General error. |
| ErrorCode | A numeric error code. See table below. |
| ErrorDescription | Description of the error. |

| Error code | Description | CGI |
| --- | --- | --- |
| 10 | Error while processing the request. | All |
| 20 | Invalid request. | All |
| 40 | Specified version is not supported. | All |

