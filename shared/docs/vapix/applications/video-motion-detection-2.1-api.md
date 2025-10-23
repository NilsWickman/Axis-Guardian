# Video motion detection 2.1 API

**Source:** https://developer.axis.com/vapix/applications/video-motion-detection-2.1-api/
**Last Updated:** Aug 28, 2025

---

# Video motion detection 2.1 API

## Description​

### Identification​

### Dependencies​

## Common examples​

## Application configuration​

## Upload, control and modify the application​

## Video motion detection 2.1 event declaration​

This API has been deprecated and will no longer receive updates. For a newer version, see Video motion detection 4 API.

AXIS Video Motion Detection 2.1 is an application that detects moving objects within an area of interest. The application can be installed on Axis network video products with support for AXIS Camera Application Platform. The application allows an operator to configure a polygon in the camera view to define an area of interest. The application will monitor this area and detect moving objects within its boundaries. When a moving object is detected, the event system can be used to trigger actions. A client application can listen to the event data stream to trigger actions from the application.

The application is uploaded and controlled using VAPIX® Application API. See Application API.

The application is configured using VAPIX® AXIS Application Configuration API. See Application configuration API.

Check if the Axis product supports AXIS Camera Application Platform.

Request:

Response:

Upload AXIS Video Motion Detection 2.1.

Request:

Start the application.

Request:

Retrieve the application configuration.

Request:

Response:

Modify the application configuration. Only the named object Detection Area (the area of interest) is modified, all other settings should be kept as is. If required, an exclude area can also be defined, see Application configuration.

Request:

Retrieve the RTSP stream with event metadata.

Request:

The AXIS Video Motion Detection 2.1 event. The prefix aev is a placeholder for the namespace http://www.axis.com/vapix/ws/event1

The application configuration is in XML format. The XML schema is available at http://www.axis.com/vapix/http_cgi/.

The application defines two named objects: The area of interest (required) and the exclude area (optional). The application will detect objects moving inside the area of interest. The exclude area is an area inside the area of interest in which moving objects are ignored.

The area of interest and the exclude area are polygons defined by 3–20 points describing the polygon corners. The line defining the polygon sides is drawn from point to point in the order the points are listed. Each point is a coordinate pair with one x coordinate and one y coordinate. The top right corner of the camera view is at x=1.0 and y=1.0.

To modify the application, update the following:

Modify the area of interest (named object Detection Area).

Optionally, add an exclude area (named object Exclude Area).

If using an exclude area, add the parameter Exclude.

All other settings must be kept as is.

XML user configuration data description

The application is configured by defining the area of interest and the exclude area as named objects.

The XML node semi xpaths not listed here define how the application shall run in AXIS Camera Application Platform. These values must not be changed.

To upload and control the application, use the functions in Application API. To retrieve the application configuration and to modify settings, use vaconfig.cgi from Application configuration API.

The AXIS Video Motion Detection 2.1 event is true when motion is detected in the area of interest.

areaid is the Area ID defining the area of interest.

areapolygon is a string with the coordinates defining the area of interest.

active is true if the application has detected motion in the area of interest.

Topic

Source instance

Data instance

Nice name: Polygon info

Type: string

Name: areapolygon

Nice name

Motion detected

Type

boolean

Name

active

isPropertyState

true

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.EmbeddedDevelopment.Version
```

```
Properties.EmbeddedDevelopment.Version=1.10
```

```
POST /axis-cgi/applications/upload.cgi HTTP/1.1Content-Type: multipart/form-data; boundary=fileboundaryContent-Length: 32422fileboundaryContent-Disposition: form-data; name="packfil"; filename="AXISVideoMotionDetection.eap"Content-Type: application/octet-stream<application package data>
```

```
http://myserver/axis-cgi/applications/control.cgi?action=start&package=VideoMotionDetection
```

```
http://myserver/axis-cgi/vaconfig.cgi?action=get&name=VideoMotionDetection
```

```
<reply result="ok">    <config version="1.0">        <application name="VideoMotionDetection">            <ruleEngine>                <namedObjects>                    <namedObject name="Detection Area">                        <data knownNameType="geometry.polygon">                            <polygon>                                <point x="0.60" y="0.60" />                                <point x="0.60" y="-0.60" />                                <point x="-0.60" y="-0.60" />                                <point x="-0.60" y="0.60" />                            </polygon>                        </data>                    </namedObject>                </namedObjects>                <rules>                    <rule name="detection_0" function="monitor_area">                        <parameter name="Include" value="Detection Area" />                    </rule>                </rules>                <scripts>                    <script encryption="1">detection.lua</script>                </scripts>                <events>                    <event name="motion">                        <attr key="areaid" nicename="Area ID" tag="source" value="0" />                        <attr key="areapolygon" nicename="Polygon info" tag="data" />                        <attr key="active" nicename="Motion detected" tag="property-state" />                    </event>                </events>                <moteConfig>                    <option name="boundingBox" value="false" />                    <option name="polygon" value="true" />                    <option name="velocity" value="true" />                </moteConfig>            </ruleEngine>        </application>    </config></reply>
```

```
POST http://myserver/axis-cgi/vaconfig.cgi HTTP/1.0Content-Type: application/x-www-form-urlencodedContent-Length: <content-length>action=modify&name=VideoMotionDetection  <config version="1.0">    <application name="VideoMotionDetection">      <ruleEngine>        <namedObjects>          <namedObject name="Detection Area">            <data knownNameType="geometry.polygon">              <polygon>                <point x="0.60" y="0.60"/>                <point x="0.60" y="-0.60"/>                <point x="-0.60" y="-0.60"/>                <point x="-0.60" y="0.60"/>              </polygon>            </data>          </namedObject>        </namedObjects>        <rules>          <rule name="detection_0" function="monitor_area">            <parameter name="Include" value="Detection Area"/>          </rule>        </rules>        <scripts>          <script encryption="1">detection.lua</script>        </scripts>        <events>          <event name="motion">            <attr key="areaid" nicename="Area ID" tag="source" value="0"/>            <attr key="areapolygon" nicename="Polygon info" tag="data"/>            <attr key="active" nicename="Motion detected" tag="property-state"/>          </event>        </events>        <moteConfig>          <option name="boundingBox" value="false"/>          <option name="polygon" value="true"/>          <option name="velocity" value="true"/>        </moteConfig>      </ruleEngine>    </application>  </config>
```

```
rtsp://myserver/axis-media/media.amp?event=on&video=0&eventtopic=onvif:RuleEngine/axis:VideoMotionDetection//motion
```

```
<tnsaxis:VideoMotionDetection aev:NiceName="VideoMotionDetection" xmlns:tnsaxis="http://www.axis.com/2009/event/topics">    <motion wstop:topic="true" xmlns:wstop="http://docs.oasis-open.org/wsn/t-1">        <aev:MessageInstance aev:isProperty="true">            <aev:SourceInstance>                <aev:SimpleItemInstance aev:NiceName="Area ID" Type="xsd:string" Name="areaid">                    <aev:Value>0</aev:Value>                </aev:SimpleItemInstance>            </aev:SourceInstance>            <aev:DataInstance>                <aev:SimpleItemInstance aev:NiceName="Polygon info" Type="xsd:string" Name="areapolygon" />                <aev:SimpleItemInstance                    aev:NiceName="Motion detected"                    Type="xsd:boolean"                    Name="active"                    isPropertyState="true" />            </aev:DataInstance>        </aev:MessageInstance>    </motion></tnsaxis:VideoMotionDetection>
```

```
<config version="1.0">    <application name="VideoMotionDetection">      <ruleEngine>        <namedObjects>          <namedObject name="Detection Area">            <data knownNameType="geometry.polygon">              <polygon>                <point x="0.60" y="0.60"/>                <point x="0.60" y="-0.60"/>                <point x="-0.60" y="-0.60"/>                <point x="-0.60" y="0.60"/>              </polygon>            </data>          </namedObject>          <namedObject name="Exclude Area">            <data knownNameType="geometry.polygon">              <polygon>                <point x="0.50" y="-0.20"/>                <point x="-0.50" y="-0.20"/>                <point x="-0.50" y="0.20"/>                <point x="0.50" y="0.20"/>              </polygon>            </data>          </namedObject>        </namedObjects>        <rules>          <rule name="detection_0" function="monitor_area">            <parameter name="Include" value="Detection Area"/>            <parameter name="Exclude" value="Exclude Area"/>          </rule>        </rules>        <scripts>          <script encryption="1">detection.lua</script>        </scripts>        <events>          <event name="motion">            <attr key="areaid" nicename="Area ID" tag="source" value="0"/>            <attr key="areapolygon" nicename="Polygon info" tag="data"/>            <attr key="active" nicename="Motion detected" tag="property-state"/>          </event>        </events>        <moteConfig>          <option name="boundingBox" value="false"/>          <option name="polygon" value="true"/>          <option name="velocity" value="true"/>        </moteConfig>      </ruleEngine>    </application>  </config>
```

- Property: Properties.EmbeddedDevelopment.Version=1.10
- Embedded development version: 1.10 or later
- AXIS OS: 5.40 or later
- Software: AXIS Camera Application Platform (ACAP)

- Modify the area of interest (named object Detection Area).
- Optionally, add an exclude area (named object Exclude Area).
- If using an exclude area, add the parameter Exclude.
- All other settings must be kept as is.

- Name: tns1:RuleEngine/tnsaxis:VideoMotionDetection/tnsaxis:motion
- Type: Stateful
- Nice name: VideoMotionDetection

- Nice name: Area ID
- Type: string
- Name: areaid

- Nice name: Polygon info
- Type: string
- Name: areapolygon
- Nice name
Motion detected
- Type
boolean
- Name
active
- isPropertyState
true

| XML Node Semi XPath | Attribute | Valid values | Description |
| --- | --- | --- | --- |
| application | name | VideoMotionDetection | Name of the application. |
| application/ruleEngine/ namedObjects |  | Section with all named objects used by the application. The application can have two objects:- Area of interest (Required)- Exclude area (Optional) |  |
| application/ruleEngine/ namedObjects/namedObject | name | Detection Area Exclude Area | Name of the video motion detection object.Detection Area = Area of interest Exclude Area = Exclude area |
| application/ruleEngine/ namedObjects/namedObject/data | knownTypeName | geometry.polygon | The supported object type. geometry.polygon = polygon |
| application/ruleEngine/ namedObjects/namedObject/data/polygon |  | XML node with points | The polygon is defined by 3–20 points describing the polygon corners. The line defining the polygon sides is drawn from point to point in the order the points are listed. Each point is a coordinate pair with one x coordinate and one y coordinate.The top right corner of the camera view is at x=1.0 and y=1.0 |
| application/ruleEngine/ namedObjects/namedObject/data/polygon/point | x | -1.0 ... 1.0 | The x coordinate. |
|  | y | -1.0 ... 1.0 | The y coordinate. |
| application/ruleEngine/ rules/rule/parameter | value | Detection Area | The parameter value specifying the named object for the Include parameter. |
|  |  | Exclude Area | The parameter value specifying the named object for the Exclude parameter. |
| application/ruleEngine/ rules/rule/parameter | name | Include | The parameter that specifies the area of interest. |
|  |  | Exclude | Optional. The parameter that specifies the exclude area. |

| Value | Nice name |
| --- | --- |
| 0 | — |

