# Application configuration API

**Source:** https://developer.axis.com/vapix/applications/application-configuration-api/
**Last Updated:** Aug 28, 2025

---

# Application configuration API

## Description​

### Identification​

### Dependencies​

### Obsoletes​

## Common examples​

## Application configuration​

## HTTP API​

### Get application configuration​

### Modify application configuration​

### List installed applications​

### Error responses​

## Get RTSP stream with event topic filter​

VAPIX® AXIS Application Configuration API is used to configure applications developed by Axis, for example AXIS Video Motion Detection and AXIS Cross Line Detection.

Supported functionality:

Applications are uploaded and controlled using VAPIX® Application API.

The list operation vaconfig.cgi?action=list is obsolete and should not be used.

This operation is replaced by applications/list.cgi in VAPIX® Application API.

The application configuration interface has been made obsolete as of Axis OS version 11.11 and will be removed and made unavailable with Axis OS version 12.0.

These examples demonstrate how to use VAPIX® AXIS Application Configuration API. Everything marked in bold should be replaced by application-specific values.

Get the application configuration.

Request:

Response:

Modify the application configuration.

Request:

Example of an event emitted from the application. Application-specific content is marked in bold, the rest is part of the ONVIF stream and defined in ONVIF core specification version 1.0.

The application configuration is an XML file stored in the Axis product. If the application configuration is modified, the file is replaced by a new configuration file.

If the application configuration is modified while the application is running, the application will be restarted with the new configuration.

The application cannot be started if it is not possible to parse the XML file. If the application configuration is malformed, but still parsable, the application may not work properly or may fail to run.

XML Application Setup Data Description

The application configuration is defined in XML format. Most parts define how the application shall run and should not be modified.

For description of the application configuration for a particular application, see the documentation provided with the application.

Manage I/O ports - port.cgi

Use io/port.cgi to retrieve information about port status and directions, to activate and deactivate ports and to monitor ports.

In port.cgi requests and in all responses, port numbering (Port ID below) starts from one (where one corresponds to the physical port labeled ‘1’).

With the following arguments and values:

Example 1:

Retrieve information about port 1.

Response

Example 2:

Configure port 2 to act as output. This example is only applicable to configurable ports.

Example 3:

Set port 2 to active, wait 300 ms and then set the port to inactive. Some characters in the action argument action=2:/300\ must be percent-encoded.

Successful request, all arguments except monitor

Response

The body is empty for the action argument.

Successful request, argument monitor

Response

Body:

Where the returned <monitor data> is:

Here <id> is the port and <port direction> is I for inputs and O for outputs. The action character is / or H for active and \ or L for inactive ports. The characters / and \ indicates a change in the state. The characters H and L indicates that the state is unchanged.

Non-empty boundaries are sent when the port status changes. If there are no changes, empty boundaries are sent at 15-second intervals.

The vaconfig.cgi?action=get is obsolete and should not be used.

Use vaconfig.cgi?action=get to retrieve the application configuration.

Syntax

with the following arguments and values

Body:

For a description of the application configuration, see the API documentation for the application.

For error responses, see Error responses.

The vaconfig.cgi?action=modify is obsolete and should not be used.

Use vaconfig.cgi?action=modify to modify the application configuration.

Syntax

Body:

Body:

The XML Schema is available at http://www.axis.com/vapix/http_cgi/vaconfig/modify_response1.xsd.

For error responses, see Error responses.

The vaconfig.cgi?action=list is obsolete and should not be used. Replaced by applications/list.cgi in VAPIX® Application API.

vaconfig.cgi?action=list lists the installed applications.

Syntax

with the following arguments and values:

Body:

XML Schema: http://www.axis.com/vapix/http_cgi/vaconfig/list1.xsd.

For error responses, see Error responses.

If the requested operation cannot be executed, the type of error and an error message will be returned.

Body:

Retrieve an RTSP stream with an event topic filter.

Syntax:

```
http://myserver/axis-cgi/vaconfig.cgi?action=get&name=ExampleApp
```

```
<reply result="ok">    <config version="1.0">        <application name="ExampleApp">            <ruleEngine>                <namedObjects>                    <namedObject name="ExampleLine1">                        <data knownNameType="geometry.segment">                            <segment>                                <point x="-0.5" y="0.0" />                                <point x="0.5" y="0.0" />                            </segment>                        </data>                    </namedObject>                    <namedObject name="ExamplePolygon1">                        <data knownNameType="geometry.polygon">                            <polygon>                                <point x="0.60" y="0.60" />                                <point x="0.60" y="-0.60" />                                <point x="-0.60" y="-0.60" />                                <point x="-0.60" y="0.60" />                            </polygon>                        </data>                    </namedObject>                </namedObjects>                <rules>                    <rule name="example_rule" function="example_function">                        <parameter name="ExampleLineParameter" value="ExampleLine1" />                        <parameter name="ExamplePolygonParameter" value="ExamplePolygon1" />                    </rule>                </rules>                <scripts>                    <script encryption="1">example.lua</script>                </scripts>                <events>                    <event name="example_event">                        <attr key="example_state" nicename="Example State" tag="property_state" />                    </event>                </events>                <moteConfig>                    <option name="boundingBox" value="false" />                    <option name="polygon" value="true" />                    <option name="velocity" value="true" />                </moteConfig>            </ruleEngine>        </application>    </config></reply>
```

```
POST http://myserver/axis-cgi/vaconfig.cgi HTTP/1.0Content-Type: application/x-www-form-urlencodedContent-Length: <content length>action=modify&name=ExampleApp<config version="1.0">  <application name="ExampleApp">    <ruleEngine>      <namedObjects>        <namedObject name="ExampleLine1">          <data knownNameType="geometry.segment">            <segment>              <point x="-0.5" y="0.0"/>              <point x="0.5" y="0.0"/>            </segment>          </data>        </namedObject>        <namedObject name="ExamplePolygon1">          <data knownNameType="geometry.polygon">            <polygon>              <point x="0.60" y="0.60"/>              <point x="0.60" y="-0.60"/>              <point x="-0.60" y="-0.60"/>              <point x="-0.60" y="0.60"/>            </polygon>          </data>        </namedObject>      </namedObjects>      <rules>        <rule name="example_rule" function="example_function">          <parameter name="ExampleLineParameter" value="ExampleLine1"/>          <parameter name="ExamplePolygonParameter" value="ExamplePolygon1"/>        </rule>      </rules>      <scripts>        <script encryption="1">example.lua</script>      </scripts>      <events>        <event name="example_event">          <attr key="example_state" nicename="Example State" tag="property_state"/>        </event>      </events>      <moteConfig>        <option name="boundingBox" value="false"/>        <option name="polygon" value="true"/>        <option name="velocity" value="true"/>      </moteConfig>    </ruleEngine>  </application></config></reply>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event xmlns:tt="http://www.onvif.org/ver10/schema">        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:RuleEnginge/tnsaxis:ExampleApp/example_event            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://daf20c8-c41f-11e0-8c89-00408cb96106/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2012-03-07T13:44:34.112703Z" PropertyOperation="Initialized">                    <tt:Source />                    <tt:Key />                    <tt:Data>                        <tt:SimpleItem Name="example_state" Value="0" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
http://<servername>/axis-cgi/io/port.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=IOPort.I0
```

```
root.IOPort.I0.Configurable=yesroot.IOPort.I0.Direction=outputroot.IOPort.I0.Input.Name=Input 1root.IOPort.I0.Input.Trig=closedroot.IOPort.I0.Output.Name=Output 1root.IOPort.I0.Output.Active=openroot.IOPort.I0.Output.Button=actinactroot.IOPort.I0.Output.PulseTime=0
```

```
http://myserver/axis-cgi/param.cgi?action=update&IOPort.I2.Direction=output
```

```
http://myserver/axis-cgi/io/port.cgi?action=2%3A%2F300%5C
```

```
<Port ID>=<information>
```

```
--<boundary><monitor data>
```

```
<Port ID><port direction>:<action character>--<boundary><monitor data>
```

```
http://<servername>/axis-cgi/vaconfig.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<reply result="error">    <script />    <error type="no_such_application" message="No application 'hello_glib' exists" /></reply>
```

```
http://<servername>/axis-cgi/vaconfig.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
POST http://myserver/axis-cgi/vaconfig.cgi HTTP/1.0Content-Type: application/x-www-form-urlencodedContent-Length: <content-length>action=modify&name=[application name]<config version="1.0">  [application xml configuration]</config>
```

```
<reply result="error">    <script />    <error type="no_such_application" message="No application 'hello_glib' exists" /></reply>
```

```
http://<servername>/axis-cgi/vaconfig.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<reply result="ok">    <application name="[Application name]"/>    <application name="[Application name]"/>    ...<reply>
```

```
<reply result="error">  <error type="<Error type>" message="<Error message>"/></reply>
```

```
rtsp://<servername>/axis-media/media.amp?<argument>=<value>[&<argument>=<value>...]
```

- Get the application configuration. See Get application configuration.
- Modify the application configuration. Modify application configuration.
- Obsolete: List installed applications. This operation has been removed from AXIS OS 12.0. Replaced by applications/list.cgi in VAPIX® Application API.

- Property: Properties.EmbeddedDevelopment.Version=1.00 or later
- AXIS OS: 5.11 or later. Removed in 12.0

- Security level: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: multipart/x-mixed-replace; boundary=<boundary>

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: GET

| XML path | Attribute | Valid values | Description |
| --- | --- | --- | --- |
| application/ruleEngine/namedObjects |  |  | Section with all named objects used by the application. |
| application/ruleEngine/rules |  |  | Section will all rules used by the application. |
| application/ruleEngine/rules/rule | name | String | Name of the rule. |
|  | function | String | Name of the rule function used to execute the rule. The function which is defined in a script file (see scripts section), is executed with the provided parameter values as input. |
| application/ruleEngine/rules/rule/parameter | name | String | Name of a paramer used by the rule function. |
|  | value | String | Value of a parameter used by the rule function. |
| application/ruleEngine/scripts |  |  | Section with scripts used by the application. |
| application/ruleEngine/scripts/script |  | String | Name of a script file used by the application. |
|  | encryption | 0 1 | 1 = The script is encrypted. 0 = The script is not encrypted. |
| application/ruleEngine/events |  |  | Section with all events used by the application. |
| application/ruleEngine/events/event | name | String | Name of an event emitted by the application. |
| application/ruleEngine/events/event/attr | key | String | Key string for the event. |
|  | tag | source data property-state | source = This is source information in the event metadata. data = This is data information in the event metadata. property-state = This is a stateful event. The current state is 0 or 1. |
| application/ruleEngine/moteConfig |  |  | Section with all MOTE configuration options. Different applications may have different MOTE configuration. |
| application/ruleEngine/moteConfig/option | name | boundingBox | Name of the MOTE configuration option. |
|  | value | true false | true = Bounding box should be used. false = Bounding box should not be used. |
| application/ruleEngine/moteConfig/option | name | polygon | Name of the MOTE configuration option. |
|  | value | true false | true = Polygon should be used. false = Polygon should not be used. |
| application/ruleEngine/moteConfig/option | name | velocity | Name of the MOTE configuration option. |
|  | value | true false | true = Velocity should be used. false = Velocity should not be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| check=<int>[,<int>,...] | <Port ID 1>[<Port ID 2>,...] | Return the status (1 or 0) of one or more ports numbered <Port ID 1>, <Port ID 2>, ... 1 = Closed circuit. 0 = Open circuit. |
| checkactive=<int> [,<int>,...] | <Port ID 1>[,Port ID 2>,...] | Return the status (active or inactive) of one or more ports numbered <Port ID 1>, <Port ID 2>, ... This value depends on the parameters Output.Active for an output and Input.Trig for an input.If the port is an output and Output.Active is configured as closed, then this request will return active if the port state is closed. The same goes for an input port that has Input.Trig configured as closed. |
| checkdirection=<int> [,<int>,...] | <Port ID 1>[,<Port ID 2>,...] | Return the port direction (input or output) of one or more ports numbered <Port ID 1>, <Port ID 2>,... |
| monitor=<int>[,<int>,...] Outputs and inputs must be monitored separately. | <Port ID 1>[,Port ID 2>,...] | Return a multipart stream of "check" ports (see return description below). Input and output ports must be monitored separately. |
| action=<string> Valid for output ports only. | [<Port ID>]:<a>[<wait><a>...] | Activate or deactivate an output. Use the <wait> option to activate/deactivate the port for a limited period of time.<Port ID> = Port number. If omitted, output 1 is selected.<a> = Action character. /=active, \=inactive<wait> = Delay before the next action. Unit: millisecondsNote: The :, / and \ characters must be percent-encoded in the URI. See .Example: To set output 1 to active, use 1:/. In the URI, the action argument becomes action=1%3A%2F |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | get | Get the application configuration in XML format. |
| name=<string> | String | Application name. |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | modify | Modify the application configuration in XML format. |
| name=<string> | String | Application name. |

| Argument | Valid values | Description |
| --- | --- | --- |
| action | list | List the installed applications. |

| Error type | Description |
| --- | --- |
| bad_request | Bad request. The request URL was not formatted correctly. |
| no_such_application | There is no application with the given name. |
| internal | The action could not be performed. This is for example returned if the application fails to restart after a configuration modification. |

| Argument | Valid values | Description |
| --- | --- | --- |
| video | 0 1 | Specify whether video should be available in the stream.0 = no video 1= video |
| event | on off | Specify whether event metadata should be available in the stream.on = event metadata is included off = event metadata is not included |
| eventtopic | String | The event topic filter to include.For AXIS Video Motion Detection 3, use onvif:RuleEngine/axis:VMD3//.For AXIS Video Motion Detection 2.1 use onvif:RuleEngine/axis:VideoMotionDetection//motionFor AXIS Digital Autotracking, use onvif:RuleEngine/axis:DigitalAutotracking/tracking//.For AXIS Cross Line Detection 1.1, use onvif:RuleEngine/axis:CrossLineDetection//. |
| For additional arguments, see Network Video > Video Streaming > Video streaming Over RTSP > Parameter Specification RTSP URL in VAPIX®. |  |  |

