# Cross line detection 1.1 API

**Source:** https://developer.axis.com/vapix/applications/cross-line-detection-1.1-api/
**Last Updated:** Aug 28, 2025

---

# Cross line detection 1.1 API

## Description​

### Identification​

### Dependencies​

## Common examples​

## Application configuration​

## Upload, control and modify the application​

## Cross line detection 1.1 event declaration​

AXIS Cross Line Detection 1.1 is a trip-wire application which detects moving objects that cross a virtual line. The application can be installed on Axis network video products with support for AXIS Camera Application Platform. The application allows an operator to configure a virtual line in the camera view. The application will monitor this line and detect moving objects that cross the line. When a moving object crosses the line, the event system can be used to trigger actions. A client application can listen to the event data stream to trigger actions from the application.

The application is uploaded and controlled using VAPIX® Application API. See Application API.

The application is configured using VAPIX® AXIS Application Configuration API. See Application configuration API.

Check if the Axis product supports AXIS Camera Application Platform.

Request:

Response:

Upload AXIS Cross Line Detection 1.1.

Request:

Start the application.

Request:

Retrieve the application configuration.

Request:

Response:

Modify the application configuration. Only the named object CrossLine0(the virtual line) and the Direction parameter are modified, all other settings should be kept as is. For more information, see Application configuration.

Request:

Retrieve the RTSP stream with event metadata.

Request:

The AXIS Cross Line Detection 1.1 event. The prefix aev is a placeholder for the namespace http://www.axis.com/vapix/ws/event1

The application configuration is in XML format. The XML schema is available at http://www.axis.com/vapix/http_cgi/

The application defines one named object: The virtual line. The application will detect objects crossing the line in the direction defined by the Direction parameter.

The virtual line can be a straight line (1 line segment) or 2 adjoining line segments. The line is defined by 2–3 points describing the line segment end points. The line is drawn from the last point to the first point in the list. Each point is a coordinate pair with one x coordinate and one y coordinate. The top right corner of the camera view is at x=1.0 and y=1.0.

The value of the Direction parameter defines the direction in which moving object must cross the line to be detected. Which value to use depends on the order in which the coordinate pairs are listed. See Example 1.

The images below show two virtual lines defined by the same coordinate pairs but with the pairs listed in different order; x0y0 is the first point in the list and x2y2 is the last point. The Direction parameter is set to leftright in both cases. The black arrows show the direction in which moving objects must cross the line to be detected. Note how the arrows are reversed when the order of the coordinate pairs is reversed.



To modify the application, update the following:

Modify the virtual line (named object CrossLine0).

Modify the value of the parameter Direction.

All other settings must be kept as is.

XML User Configuration Data Description

The application is configured by defining the virtual line and the direction in which moving objects should cross the line to be detected.

The XML node semi xpaths not listed here define how the application shall run in AXIS Camera Application Platform. These values must not be changed.

To upload and control the application, use the functions in Application API. To retrieve the application configuration and to modify settings, use vaconfig.cgi from Application configuration API.

The cross line detection 2.1 event is emitted when a moving object crosses the virtual line.

type defines the type of the event. The value touched means that the event is emitted when the virtual line was crossed.

object is the ID of the virtual line which the moving object has crossed. The ID is an integer and is to used as start event when creating an action rule.

line is a string with the coordinates defining the virtual line.

Topic

Source instance

Data instance

Nice name: Passed object id

Type: string

Name: object

Nice name

Cross line

Type

string

Name

line

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.EmbeddedDevelopment.Version
```

```
Properties.EmbeddedDevelopment.Version=1.10
```

```
POST /axis-cgi/applications/upload.cgi HTTP/1.1Content-Type: multipart/form-data; boundary=fileboundaryContent-Length: 32422fileboundaryContent-Disposition: form-data; name="packfil"; filename="CrossLineDetection.eap"Content-Type: application/octet-stream<application package data>
```

```
http://myserver/axis-cgi/applications/control.cgi?action=start&package=CrossLineDetection
```

```
http://myserver/axis-cgi/vaconfig.cgi?action=get&name=CrossLineDetection
```

```
<reply result="ok">    <application name="CrossLineDetection">        <ruleEngine>            <namedObjects>                <namedObject name="CrossLine0">                    <data knownNameType="geometry.segment">                        <segment>                            <point x="-0.5" y="0.0" />                            <point x="0.5" y="0.0" />                        </segment>                    </data>                </namedObject>            </namedObjects>            <rules>                <rule name="crossed_CrossLine0" function="line_touching">                    <parameter name="LineObj" value="CrossLine0" />                    <parameter name="Direction" value="both" />                </rule>            </rules>            <scripts>                <script encryption="1">dbgutils.lua</script>                <script encryption="1">lineTouching.lua</script>            </scripts>            <events>                <event name="linetouched">                    <attr key="type" nicename="Touched" value="touched" />                    <attr key="line" nicename="Cross line" />                    <attr key="object" nicename="Passed object id" />                </event>                <event name="timer" hiddenFromTriggerList="true" />            </events>            <moteConfig>                <option name="boundingBox" value="false" />                <option name="polygon" value="true" />                <option name="velocity" value="true" />            </moteConfig>        </ruleEngine>    </application></reply>
```

```
POST http://myserver/axis-cgi/vaconfig.cgi HTTP/1.0Content-Type: application/x-www-form-urlencodedContent-Length: <content-length>action=modify&name=CrossLineDetection<application name="CrossLineDetection">  <ruleEngine>    <namedObjects>      <namedObject name="CrossLine0">        <data knownNameType="geometry.segment">          <segment>            <point x="-0.5" y="0.0"/>            <point x="0.5" y="0.0"/>          </segment>        </data>      </namedObject>    </namedObjects>    <rules>      <rule name="crossed_CrossLine0" function="line_touching">        <parameter name="LineObj" value="CrossLine0"/>        <parameter name="Direction" value="both"/>      </rule>    </rules>    <scripts>      <script encryption="1">dbgutils.lua</script>      <script encryption="1">lineTouching.lua</script>    </scripts>    <events>      <event name="linetouched">        <attr key="type" nicename="Touched" value="touched"/>        <attr key="line" nicename="Cross line"/>        <attr key="object" nicename="Passed object id" />      </event>      <event name="timer" hiddenFromTriggerList="true">    </events>    <moteConfig>      <option name="boundingBox" value="false"/>      <option name="polygon" value="true"/>      <option name="velocity" value="true"/>    </moteConfig>  </ruleEngine></application>
```

```
rtsp://myserver/axis-media/media.amp?event=on&video=0&eventtopic=onvif:RuleEngine/axis:CrossLineDetection//.
```

```
<tnsaxis:CrossLineDetection aev:NiceName="CrossLineDetection" xmlns:tnsaxis="http://www.axis.com/2009/event/topics">    <linetouched wstop:topic="true" xmlns:wstop="http://docs.oasis-open.org/wsn/t-1">        <aev:MessageInstance>            <aev:SourceInstance>                <aev:SimpleItemInstance aev:NiceName="Touched" Type="xsd:string" Name="type">                    <aev:Value>touched</aev:Value>                </aev:SimpleItemInstance>            </aev:SourceInstance>            <aev:DataInstance>                <aev:SimpleItemInstance aev:NiceName="Passed object id" Type="xsd:string" Name="object" />                <aev:SimpleItemInstance aev:NiceName="Cross line" Type="xsd:string" Name="line" />            </aev:DataInstance>        </aev:MessageInstance>    </linetouched></tnsaxis:CrossLineDetection>
```

```
<application name="CrossLineDetection">    <ruleEngine>        <namedObjects>            <namedObject name="CrossLine0">                <data knownNameType="geometry.segment">                    <segment>                        <point x="-0.5" y="0.0" />                        <point x="0.5" y="0.0" />                    </segment>                </data>            </namedObject>        </namedObjects>        <rules>            <rule name="crossed_CrossLine0" function="line_touching">                <parameter name="LineObj" value="CrossLine0" />                <parameter name="Direction" value="both" />            </rule>        </rules>        <scripts>            <script encryption="1">dbgutils.lua</script>            <script encryption="1">lineTouching.lua</script>        </scripts>        <events>            <event name="linetouched">                <attr key="type" nicename="Touched" value="touched" />                <attr key="line" nicename="Cross line" />                <attr key="object" nicename="Passed object id" />            </event>            <event name="timer" hiddenFromTriggerList="true" />        </events>        <moteConfig>            <option name="boundingBox" value="false" />            <option name="polygon" value="true" />            <option name="velocity" value="true" />        </moteConfig>    </ruleEngine></application>
```

- Property: Properties.EmbeddedDevelopment.Version=1.10
- Embedded development version: 1.10 or later
- AXIS OS: 5.40 or later
- Software: AXIS Camera Application Platform (ACAP)

- Modify the virtual line (named object CrossLine0).
- Modify the value of the parameter Direction.
- All other settings must be kept as is.

- Name: tns1:RuleEngine/tnsaxis:CrossLineDetection/tnsaxis:linetouched
- Type: Stateless
- Nice name: CrossLineDetection

- Nice name: Touched
- Type: string
- Name: type

- Nice name: Passed object id
- Type: string
- Name: object
- Nice name
Cross line
- Type
string
- Name
line

| XML Node Semi XPath | Attribute | Valid values | Description |
| --- | --- | --- | --- |
| application | name | CrossLineDetection | Name of the application. |
| application/ruleEngine/ namedObjects |  |  | Section with all named objects used by the application. The application can have one named object. |
| application/ruleEngine/ namedObjects/namedObject | name | CrossLine0 | Name of the cross line detection object (the virtual line). |
| application/ruleEngine/ namedObjects/namedObject/ data | knownTypeName | geometry.segment | The supported object type. geometry.segment = virtual line consisting of segments |
| application/ruleEngine/ namedObjects/namedObject/ data/segment |  | XML node with points | The virtual line consists of 1–2 line segments. The line is defined by 2–3 points describing the line segment end points. The line is drawn from the last point to the first point in the list. Each point is a coordinate pair with one x coordinate and one y coordinate.The top right corner of the camera view is at x=1.0 and y=1.0 |
| application/ruleEngine/ namedObjects/namedObject/ data/segment/point | x | -1.0 ... 1.0 | The x coordinate. |
|  | y | -1.0 ... 1.0 | The y coordinate. |
| application/ruleEngine/ rules/rule/parameter | value | CrossLine0 | The parameter value specifying the named object for the LineObj parameter. |
| application/ruleEngine/ rules/rule/parameter | value | leftrightrightleftboth | The parameter value specifying in which direction a moving object must cross the virtual line to be detected.- leftright = from left to right- rightleft = from right to left- both = both directionsThe direction depends on how the line is defined. See Example 1 above. |

| Value | Nice name |
| --- | --- |
| touched | — |

