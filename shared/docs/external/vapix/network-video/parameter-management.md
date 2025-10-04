# Parameter management

**Source:** https://developer.axis.com/vapix/network-video/parameter-management/
**Last Updated:** Aug 28, 2025

---

# Parameter management

## Description​

### Non-dynamic parameters​

### Dynamic parameters​

## Prerequisites​

### Identification​

## HTTP API​

### list​

### listdefinitions​

### update​

### add​

### remove​

## Footnotes​

The HTTP-based interface provides the functionality for getting and setting internal parameter values. This document describes the general syntax and values that are used to request and configure/alter parameters. There are two types of parameters. Dynamic parameters and non—dynamic parameters. All parameters are managed through the CGI param.cgi. The CGI-requests are then handled by the built-in web server in the Axis product.

When requesting a parameter root is not needed in the request.

Non-dynamic parameters are pre-configured and already exist in your Axis product. A non-dynamic parameter has one or more values. Some non-dynamic parameters are configurable and some are read only. A non-dynamic parameter has the following syntax:

Non-dynamic parameter groups can also have subgroups:

A non-dynamic parameter in a subgroup.

Dynamic parameters are created at runtime. A dynamic parameter has the following syntax:

The P in the second part refers to the first letter of the parent group. The group number # is added dynamically by the system in your Axis product. The last part Parameter is the actual parameter name.

Parameter groups can also have dynamic subgroups:

A dynamic parameter in a subgroup.

To handle the parameters of an Axis product you need to request the CGI param.cgi. This needs to be followed by the argument action and a valid value.

Syntax:

With the following arguments and values:

Request

The list request is used to list the parameters and their values. See also listdefinitions.

Syntax:

With the following arguments and values:

Example 1:

List the Network parameters.

Example 2:

List the names of all ImageSource parameters (this request requires operator access).

Response

1. Success
A list of parameter-value pairs is returned.

Response:

Body:

Example 3:

Properties query response (only a small part of the response is shown here).

2. Error
If the CGI request includes an invalid parameter, an error message is returned.

Response:

Body:

Request

The listdefinitions request is used to list the parameters and their values. The response includes parameter name, value, security level, nice name and valid values (where applicable).

Syntax:

With the following arguments and values:

Example 1:

List the Properties parameters.

Example 2:

List parameters using wildcards.

Successful request: Response in XML format

Response

Body:

Where parameter=

Parameter information is contained in the <parameter> element. The attribute "value" contains the current parameter value. All valid values and their type (integer, bool, enum, string) are listed within the <type> element. See examples below.

The security level (attribute securityLevel) consists of 4 integers in order create, delete, read and write (e.g. 7007). To perform an action on a parameter a user must have an access right equal to or higher than the corresponding security level of that parameter. The following integers are used:

Example 3:

The Properties.API.HTTP parameter. Security level 7707 means that all users can read this parameter, but root access is required to create, delete and write the parameter.

Body:

Example 4:

The AudioSource.A0.AudioEncoding parameter. This parameter has 3 valid values. Security level 7714 means that root access is required to create/delete the parameter, reading requires viewer rights and writing requires operator rights.

Body (only a portion of the body is shown here):

Example 5:

The Image.I0.Appearance.Compression parameter is an integer with valid values between 0 and 100.

Body (only a portion of the body is shown here):

Request

The update request is used to update already existing parameters with new parameter values.

Syntax:

With the following arguments and values:

Example 1:

Set the default image resolution to 320x240 pixels.

Example 2:

Set the maximum number of viewers to 5.

The update action produces one of the following responses:

1. Success

Response

Body:

2. Failure

Response:

Body:

Request

The add request is used to add new parameters. The parameters are only applicable for dynamic parameter groups such as motion detection windows and stream profiles.

Syntax:

With the following arguments and values:

Example 1:

Create a new stream profile under the group Streamprofile and set the name to "My profile".

A listing of the new group will output the following:

In this example the id is S8. This can be any number, depending on if other streamprofiles were added before. Parameters that are not specified in the request will have their default values.

The add action produces one of the following responses:

1. Success

Response

Body:

2. Failure – No group created
The group could not be created due to missing or erroneous CGI arguments.

Response

Body:

Failure – Parameters could not be set
The group was created, but the specified parameters could not be set.

Response:

Body:

Request

The remove parameter is used to delete already existing parameters. The parameter is only applicable for dynamic parameter groups such as motion detection windows and stream profiles.

Syntax:

With the following arguments and values:

Delete stream profile groups S7 and S8.

The remove action produces one of the following responses.

1. Success:

Response

Body:

2. Failure:

Response

Body:

Product/release-dependent. Check the product’s release notes. ↩

```
ParentGroup.Parameter
```

```
ParentGroup.Subgroup.Parameter
```

```
Properties.PTZ.DriverManagement
```

```
ParentGroup.P#.Parameter
```

```
ParentGroup.P#.Subgroup.S#.Parameter
```

```
PTZ.Preset.P0.HomePosition
```

```
http://<servername>/axis-cgi/param.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/param.cgi?action=list[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Network
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=ImageSource.*.Name
```

```
<parameter>=<value><parameter>=<value>...
```

```
root.Network.Media=autoroot.Network.Autoneg=normalroot.Network.Enabled=yes
```

```
# Error: <description>
```

```
http://<servername>/axis-cgi/param.cgi?action=listdefinitions[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=listdefinitions&listformat=xmlschema&group=Properties
```

```
http://myserver/axis-cgi/param.cgi?action=listdefinitions&listformat=xmlschema&group=ImageSource.*.Name
```

```
<?xml version="1.0" encoding="iso-8859-1" ?><parameterDefinitions [attributes] >  <model> [string] </model>  <firmwareVersion> [int.int] </firmwareVersion>  <group name="[string]">  [additional group name start-tags]  parameter  parameter  ...  [additional group name end-tags]  </group>  ...</parameterDefinitions>
```

```
parameter name="[string]" value="[value]" securityLevel="[int]"  niceName="[string]">  type [attributes] >  ...  </type>  </parameter>
```

```
<?xml version="1.0" encoding="iso-8859-1" ?><parameterDefinitions    xmlns="http://www.axis.com/ParameterDefinitionsSchema"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:schemaLocation="http://www.axis.com/ParameterDefinitionsSchema  http://device-ip-address/pub/parameterdefinitions.xsd"    version="1.0">    <model>AXIS P1311</model>    <firmwareVersion>5.00</firmwareVersion>    <group name="Properties">        <group name="API">            <group name="HTTP">                <parameter name="Version" value="3" securityLevel="7707" niceName="Version">                    <type readonly="true" const="true">                        <int />                    </type>                </parameter>            </group>        </group>    </group></parameterDefinitions>
```

```
<group name="AudioSource">    <group name="A0">        <parameter name="AudioEncoding" value="g711" securityLevel="7714" niceName="Audio encoding">            <type>                <enum>                    <entry value="g711" niceValue="G711 &amp;micro;-law" />                    <entry value="g726" niceValue="G726" />                    <entry value="aac" niceValue="AAC" />                </enum>            </type>        </parameter>    </group></group>
```

```
<group name="Image">    <group name="I0">        <group name="Appearance">            <parameter name="Compression" value="50" securityLevel="7744" niceName="Compression">                <type>                    <int min="0" max="100" maxlen="3" />                </type>            </parameter>        </group>    </group></group>
```

```
http://<servername>/axis-cgi/param.cgi?action=update[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=update&Image.I0.Appearance.Resolution=320x240
```

```
http://myserver/axis-cgi/param.cgi?action=update&Image.MaxViewers=5
```

```
OK
```

```
# Error: Error setting '<group.name>' to '<value>'!
```

```
http://<servername>/axis-cgi/param.cgi?action=add[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=add&template=streamprofile&group=StreamProfile&StreamProfile.S.Name=myprofile&StreamProfile.S.Description=My%204CIF%20profile&StreamProfile.S.Parameters=videocodec%3dh264%26resolution%3d4CIF%26text%3d1%26textstring%3d4CIF%2520profile
```

```
root.StreamProfile.S8.Name=myprofileroot.StreamProfile.S8.Description=My%204CIF%20profileroot.StreamProfile.S8.Parameters=videocodec=h264&resolution=4CIF&text=1&textstring=4CIF%20profile
```

```
<entry> OK
```

```
<additional error information># Request failed: <error message>
```

```
<additional error information># Error: <error message><entry> OK
```

```
http://<servername>/axis-cgi/param.cgi?action=remove[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=remove&group=StreamProfile.S7,StreamProfile.S8
```

```
OK
```

```
<additional error information># Request failed: <error message>
```

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later.

- Access control: The CGI can be accessed by all users, but some requests require operator or admin rights.
- Method: GET/POST

- Access control: Parameter dependent. The CGI can be accessed by all users, but a user can only list parameters that are accessible to that user (determined by access control of the parameter).

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: Parameter dependent. The CGI can be accessed by all users, but a user can only list parameters that are accessible to that user (determined by the parameter security level).

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: Parameter dependent. The CGI can be accessed by users with operator or admin rights, but operators can only update parameters that are accessible to operators.

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: operator

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Access control: operator

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- Product/release-dependent. Check the product’s release notes. ↩

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | add remove update list listdefinitions | Add, remove, update or list parameters. See the following subsections for more information and examples. add = Add new parameters. remove = Delete parameters. update = Update parameters. list = List parameters. listdefinitions = Get parameter listing in XML-format. |
| usergroup=<string> | anonymous viewer operator admin | Elevate user access level. This might be necessary if the browser has cached the credentials or if "anonymous viewer login" is enabled. anonymous = Anybody on the network could access the Axis product (but not the admin tools) and without to log in. viewer = Viewer access rights. operator = Operator access rights. admin = Admin access rights. |
| Additional arguments depending on selected action. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| group=<string> | <group[.name]> [,<group[.name]>...] | Get the value of the parameter named <group>.<name>. If <name> is omitted, all the parameters of the <group> are returned. The parameters must be entered exactly as they are named in the Axis product. Wildcard (*) can be used when listing parameters. See example below. If this parameter is omitted, all parameters in the device are returned. |
| responseformat=<string> | rfc | Get the HTTP response format according to RFC 1945. This argument should always be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| listformat=<string> | xmlschema | Response format. |
| group=<string> | <group[.name]> | Get the parameter named <group>.<name>. If <name> is omitted, all the parameters of the <group> are returned. The parameters must be entered exactly as they are named in the Axis product. Wildcards (*) can be used when listing parameters. See example below. If this parameter is omitted, all parameters in the device are returned. |

| Security level | Description |
| --- | --- |
| 0 | Unprotected, but it is not possible to access the Axis product from outside without at least viewer rights. |
| 1 | Viewer access |
| 4 | Operator access |
| 6 | Administrator access |
| 7 | Root access. Internal parameters that can be changed by software applications or by root editing the configuration files directly. |

| Argument | Valid values | Description |
| --- | --- | --- |
| <string>=<string> | <group.name>=<value> | Assign <value> to the parameter <group.name>. The <value> must be percent-encoded when it contains non-alphanumeric characters. The parameters must be entered exactly as named in the Axis product. |

| Argument | Valid values | Description |
| --- | --- | --- |
| template=<string> | <template>(1) | The template is a file describing all parameters for this group. Use the specified <template> when creating the new group. See examples below. |
| group=<string> | <group> | Specify the parent group. The parent group defines where in the parameter structure the new group will be created. For example, if adding a stream profile (template=streamprofile) and specify group=Streamprofile the new group will be available as Streamprofile.S<number>. Where <number> is the unique number for the group (see return values below). The character before <number> is generated from the last section of the group name. E.g. Streamprofile will generate the character S. |
| <string>=<string> | <group.name>=<value> | Set a parameter in the newly created group. As the group number is not known before the group is created, the id-number is left out, see the examples below. The new group number is created dynamically and can be any number. This is why all parameters are specified to set without any group number. The base path to the parameter is specified as<group>.<uppercase first letter of group>.<parameter name>. |
| force=<string> | yes | Exceed limits set for adding to dynamic parameter groups. Example: A dynamic parameter group can be configured for up to 10 parameters. The force parameter can be used to exceed this maximum number of parameters. |

| Argument | Valid values | Description |
| --- | --- | --- |
| group=<string> | <group>[,<group>,...] | Delete the specified group(s). |

