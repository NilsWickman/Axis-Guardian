# Guard tour API

**Source:** https://developer.axis.com/vapix/network-video/guard-tour-api/
**Last Updated:** Aug 28, 2025

---

# Guard tour API

## Preset tours​

### Description​

### Prerequisites​

#### Identification​

### Common examples​

### Parameters​

## Recorded tour API​

### Description​

### Prerequisites​

#### Identification​

### Common examples​

### Parameters​

### XML schema versions​

### List​

### Record​

### Stop recording​

### Play​

### Stop playback​

### Pause​

### Resume​

### Modify​

### Remove​

### Error responses​

### General success response​

## Guard tours and action rules​

### Example​

### Guard tour action​

### Recorded tour action​

Guard tours are supported by most cameras with pan/tilt/zoom (PTZ) capabilities and are used to automatically move the camera view in a predefined order. Guard tours enable operators to get a quick overview of the immediate surroundings, and allows one camera to be used in areas traditionally requiring several cameras for effective coverage. Tour recording simplifies configuration and management for PTZ installers and operators.

A guard tour can be set up as a:

Preset tour — The tour is set up using PTZ preset positions. The tour can display the presets in a predefined order or randomly and for configurable time periods.

Preset tours are defined by parameters in the dynamic GuardTour parameter group. See Preset tours.

Recorded tour — The tour is set up by recording PTZ movements. While recording the tour, the user steers the camera using an input device, such as a joystick, mouse, keyboard or application. The tour will play the recorded sequence of PTZ movements.

Recorded tours are set up using the Recorded tour API, see Recorded tour API.

Using the event and action functionality, a guard tour can be configured to run at preprogrammed time periods, for example once every 20 minutes. See Guard tours and action rules.

If the camera’s PTZ functionality can be controlled by several users, for example guard tours, events and operators, the PTZ Control Queue can be used to distribute PTZ control among users. Control queue settings for preset tours are defined by the PTZ control queue user group Guardtour while settings for recorded tours are defined by user group Recordedtour. For more information about the PTZ control queue, see VAPIX® Pan/tilt/zoom API.

With the default PTZ control queue settings, user groups Administrator, Event, Operator and Autotracking have higher priority than Guardtour and Recordedtour. This means that a camera operator can steer the camera using PTZ controls even if a guard tour has been started, but control is lost while the camera moves to the next position in the tour. To change this behavior, configure parameter Priority for the different user groups.

User group Recordedtour is available in AXIS OS 5.50 and later.

A preset tour is a guard tour which is set up using PTZ preset positions. The tour displays the preset positions one-by-one in a predefined order or at random and for configurable time periods.

Preset tours are defined by parameters in the dynamic GuardTour.G# group. Dynamic parameters are configured using param.cgi, see VAPIX® Parameter Management.

To set up a guard tour using preset positions:

To set up a guard tour using preset positions:

Create the preset positions using /com/ptzconfig.cgi, see section PTZ configuration.

Create the group GuardTour.G#.

Add preset positions to the guard tour group. Each position is added as a dynamic subgroup GuardTour.G#.Tour.T#.

Start the guard tour or schedule the guard tour using action rules (AXIS OS 5.50 and later) or scheduled event types (AXIS OS 5.00 to 5.4x).

If adding a nonexisting preset position, the subgroup will still be created but the preset will be ignored when running the tour. Similarly, if a preset position is removed, the tour is still valid and the missing preset is ignored.

Create a preset tour

The examples in this section demonstrate how to set up a guard tour using preset positions. The tour is defined by parameters in the dynamic GuardTour group.

Check that the Axis product supports guard tours.

Request:

Response:

Add a guard tour.

Request:

The response returns the group number assigned to the new group.

Response:

List the new group GuardTour.G0.

Request:

Response:

Set the guard tour name to "DayTour".

Request:

Response:

Add a guard tour and set the name in the same request. Because the group number is not known, it is omitted in the request.

Request:

The response returns the group number assigned to the new group.

Response:

Add preset positions to the tour

The examples in this section demonstrate how to add preset positions to the guard tour GuardTour.G0. Each preset positions is a dynamic subgroup GuardTour.G0.Tour.T#.

Retrieve available preset positions.

Request:

The response returns the preset positions from all video channels or view areas.

Response:

PTZ presets are added using /com/ptzconfig.cgi. See section PTZ configuration.

Add the first preset position to the guard tour GuardTour.G0. The preset is added as a dynamic subgroup GuardTour.G0.Tour.T0.

Parameter PresetNbr must be specified explicitly when creating GuardTour.G0.Tour.T# subgroups.

Request:

The response returns the group number assigned to the new group.

Response:

List the created parameters.

Request:

The response shows that the preset will be viewed for 10 seconds.

Response:

Add a second preset to the same guard tour.

Request:

The response returns the group number assigned to the new group.

Response:

List the created parameters.

Request:

The response shows that the preset will be viewed for 10 seconds.

Response:

Add preset position 5 to GuardTour.G0.

Request:

The response returns the group number assigned to the new group.

Response:

List the created parameters.

Request:

The response shows that the preset will be viewed for 10 seconds.

Response:

List the presets included in the tour.

Request:

Response:

Remove a preset position from the guard tour.

Request:

To remove a preset position from the Axis product, use /com/ptzconfig.cgi. See section PTZ configuration.

Start and stop the tour

Start the guard tour.

Request:

Stop the guard tour.

Request:

Guard tour parameters

The parameters in the dynamic GuardTour.G# group define a guard tour. This group is for guard tours that are set up using preset positions.

GuardTour.G#

The # in GuardTour.G# is replaced by an integer starting from zero.

Tour parameters

The parameters in the GuardTour.G#.Tour.T# group define the preset positions used in the tour.

GuardTour.G#.Tour.T#

The #:s in GuardTour.G#.Tour.T# are replaced by integers starting from zero, for example GuardTour.G3.Tour.T0.

A recorded tour is a guard tour which is set up by recording PTZ movements. While recording the tour, the user steers the camera using an input device, such as a joystick, mouse, keyboard or application. The tour will play the recorded sequence of PTZ movements.

The Recorded tour API consists of the following CGIs:

Check that the product supports recorded tours.

Request:

The response shows that recorded tours are supported and that the maximum number of tours is 10.

Response:

Start recording a tour.

Request:

The response returns the ID assigned to the recorded tour.

Response:

Stop the ongoing recording with ID 1.

Request:

Play the recorded tour with ID 1.

Request:

Pause playback.

Request:

Stop playback.

Request:

List all recorded tours.

Request:

Response

Remove the recorded tour with ID 1.

Request:

Maximum number of recorded tours

Properties

The recordedtour/getschemaversions.cgi returns a list of supported versions of the XML Schemas for the Recorded Tour API and whether the schemas are deprecated or not.

Request

Syntax:

This CGI has no arguments.

Response

Responses to recordedtour/getschemaversions.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Body:

Supported elements, attributes and values:

The recordedtour/list.cgi is used to list recorded tours.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/list.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success:

Body:

Supported elements, attributes and values:

Error: See Error responses.

The recordedtour/record.cgi is used to start a tour recording. Any running guard tour on the selected video channel will be stopped when a tour recording is started.

To stop the recording, use recordedtour/stoprecording.cgi, see Stop recording.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/record.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: The ID of the recorded tour is returned.

Body:

Supported elements, attributes and values:

Error: See Error responses.

The recordedtour/stoprecording.cgi is used to stop an ongoing recording.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/stoprecording.cgi

The XML Schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/play.cgi is used to play a recorded tour. Any ongoing playback on the selected video channel will be stopped if a new playback is started. Other PTZ operations will be stopped if their priority is lower than the recorded tour’s priority. For more information about priorities and the PTZ control queue, see VAPIX® Pan/tilt/zoom API.

Playback cannot be started while a tour is recorded.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/play.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/stopplayback.cgi is used to stop playback of a recorded tour.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/stopplayback.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/pause.cgi is used to pause playback of a recorded tour.

Use recordedtour/resume.cgi to resume playback.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/pause.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/resume.cgi is used to resume playback of a paused recorded tour.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/resume.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/modify.cgi is used to modify an existing recorded tour. The tour name and the loop delay can be modified. The tour must be inactive, that is, recording and playback must be stopped before the tour can be modified.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/modify.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The recordedtour/remove.cgi is used to remove a recorded tour. The tour must be inactive, that is, recording and playback must be stopped before the tour can be removed.

Request

Syntax:

Supported arguments and values:

Response

Responses to recordedtour/remove.cgi

The XML schema is available at http://www.axis.com/vapix/http_cgi/recordedtour1.xsd

Success: See General success response.

Error: See Error responses.

The following error responses can be returned by the Recorded tour API.

Body:

Supported elements, attributes and values:

Body:

Supported elements, attributes and values:

Using the event functionality, a guard tour can be started as an event action or can be configured to run at preprogrammed time periods, for example once every 20 minutes.

Preset tours and recorded tour use different action templates:

This section describes how to use guard tours with the web services based event functionality available in AXIS OS 5.50 and later. The event functionality is described in section Event and action services.

This example shows how to set up an action rule that runs a guard tour Monday through Friday from 7 a.m. to 7 p.m.

The action rule is created in three steps:

The action rule is created in three steps:

Create a scheduled event using AddScheduledEvent.

Create a guard tour action configuration using AddActionConfiguration.

Create an action rule using AddActionRule. The action rule uses the Scheduled Event ID scheduledEventId returned by AddScheduledEvent and the Action Configuration ID actionId returned by AddActionConfiguration.

The examples are written in C# and use the helper functions defined in section Helper functions.

Step 1: Create a scheduled event that runs Monday through Friday from 7 a.m. to 7 p.m.

Step 2: Create an action configuration that starts the guard tour. The guard tour action used here is unlimited, that is, the guard tour will keep running as long as the action rule conditions are fulfilled.

Step 3: Create the action rule. The scheduled event is used as condition and the action configuration is used as the primary action.

Use the guard tour action to start a guard tour (preset tour).

The action can be run as:

The action can be run as:

fixed action — run the guard tour once

unlimited action — keep the guard tour running as long as all conditions are fulfilled

Action ID

com.axis.action.fixed.guardtour

Action ID

com.axis.action.unlimited.guardtour

Use the recorded tour action to start a recorded tour. The action is unlimited; the recorded tour keeps running as a long as all conditions are fulfilled.

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.GuardTour
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.Properties.GuardTour.GuardTour=yes
```

```
http://myserver/axis-cgi/param.cgi?action=add&group=GuardTour&template=guardtour
```

```
HTTP/1.0 200 OKContent-Type: text/plainG0 OK
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=GuardTour.G0
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.GuardTour.G0.Running=noroot.GuardTour.G0.Name=GuardtourNameroot.GuardTour.G0.CamNbr=1root.GuardTour.G0.RandomEnabled=noroot.GuardTour.G0.TimeBetweenSequences=0
```

```
http://myserver/axis-cgi/param.cgi?action=update&GuardTour.G0.Name=DayTour
```

```
HTTP/1.0 200 OKContent-Type: text/plainOK
```

```
http://myserver/axis-cgi/param.cgi?action=add&group=GuardTour&template=guardtour&GuardTour.G.Name=NightTour
```

```
HTTP/1.0 200 OKContent-Type: text/plainG1 OK
```

```
http://myserver/axis-cgi/com/ptz.cgi?query=presetposall
```

```
HTTP/1.0 200 OKContent-Type: text/plainPreset Positions for camera 1presetposno5=Northpresetposno4=Westpresetposno3=Southpresetposno2=Eastpresetposno1=Home
```

```
http://myserver/axis-cgi/param.cgi?action=add&group=GuardTour.G0.Tour&template=tour&GuardTour.G0.Tour.T.PresetNbr=1&GuardTour.G0.Tour.T.Position=1
```

```
HTTP/1.0 200 OKContent-Type: text/plainT0 OK
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=GuardTour.G0.Tour.T0
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.GuardTour.G0.Tour.T0.PresetNbr=1root.GuardTour.G0.Tour.T0.Position=1root.GuardTour.G0.Tour.T0.MoveSpeed=70root.GuardTour.G0.Tour.T0.WaitTime=10root.GuardTour.G0.Tour.T0.WaitTimeViewType=Seconds
```

```
http://myserver/axis-cgi/param.cgi?action=add&group=GuardTour.G0.Tour&template=tour&GuardTour.G0.Tour.T.PresetNbr=2&GuardTour.G0.Tour.T.Position=2
```

```
HTTP/1.0 200 OKContent-Type: text/plainT1 OK
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=GuardTour.G0.Tour.T1
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.GuardTour.G0.Tour.T1.PresetNbr=2root.GuardTour.G0.Tour.T1.Position=2root.GuardTour.G0.Tour.T1.MoveSpeed=70root.GuardTour.G0.Tour.T1.WaitTime=10root.GuardTour.G0.Tour.T1.WaitTimeViewType=Seconds
```

```
http://myserver/axis-cgi/param.cgi?action=add&group=GuardTour.G0.Tour&template=tour&GuardTour.G0.Tour.T.PresetNbr=5&GuardTour.G0.Tour.T.Position=3
```

```
HTTP/1.0 200 OKContent-Type: text/plainT2 OK
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=GuardTour.G0.Tour.T2
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.GuardTour.G0.Tour.T2.PresetNbr=5root.GuardTour.G0.Tour.T2.Position=3root.GuardTour.G0.Tour.T2.MoveSpeed=70root.GuardTour.G0.Tour.T2.WaitTime=10root.GuardTour.G0.Tour.T2.WaitTimeViewType=Seconds
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=GuardTour.G0.Tour.*.PresetNbr
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.GuardTour.G0.Tour.T0.PresetNbr=1root.GuardTour.G0.Tour.T1.PresetNbr=2root.GuardTour.G0.Tour.T2.PresetNbr=5
```

```
http://myserver/axis-cgi/param.cgi?action=remove&group=GuardTour.G0.Tour.T0
```

```
http://myserver/axis-cgi/param.cgi?action=update&GuardTour.G0.Running=yes
```

```
http://myserver/axis-cgi/param.cgi?action=update&GuardTour.G0.Running=no
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Properties.GuardTour
```

```
HTTP/1.0 200 OKContent-Type: text/plainroot.Properties.GuardTour.GuardTour=yesroot.Properties.GuardTour.RecordedTour=yesroot.Properties.GuardTour.MaxRecordedTours=10
```

```
http://myserver/axis-cgi/recordedtour/record.cgi?schemaversion=1&nicename=MyFirstRecording
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">  <Success>    <RecordSuccess>      <RecordingId>1</RecordingId>    </RecordSuccess>  </Success></RecordedTourResponse>
```

```
http://myserver/axis-cgi/recordedtour/stoprecording.cgi?schemaversion=1&recordedtourid=1
```

```
http://myserver/axis-cgi/recordedtour/play.cgi?schemaversion=1&recordedtourid=1
```

```
http://myserver/axis-cgi/recordedtour/pause.cgi?schemaversion=1&recordedtourid=1
```

```
http://myserver/axis-cgi/recordedtour/stopplayback.cgi?schemaversion=1&recordedtourid=1
```

```
http://myserver/axis-cgi/recordedtour/list.cgi?schemaversion=1
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">  <Success>    <ListSuccess>      <RecordingInformation>        <RecordingId>1</RecordingId>        <NiceName>MyFirstRecording</NiceName>        <Status>stopped</Status>        <Camera>1</Camera>        <DefaultLoopDelay>60</DefaultLoopDelay>      </RecordingInformation>    </ListSuccess>  </Success></RecordedTourResponse>
```

```
http://myserver/axis-cgi/recordedtour/remove.cgi?schemaversion=1&recordedtourid=1
```

```
http://<servername>/axis-cgi/recordedtour/getschemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">    <Success>        <GetSchemaVersionsSuccess>            <SchemaVersion>                <VersionNumber>[major1].[minor1]</VersionNumber>                <Deprecated>[deprecated]</Deprecated>            </SchemaVersion>            ...        </GetSchemaVersionsSuccess>    </Success></RecordedTourResponse>
```

```
http://<servername>/axis-cgi/recordedtour/list.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">    <Success>        <ListSuccess>            <RecordingInformation>                <RecordingId>[Recorded Tour ID]</RecordingId>                <NiceName>[Recorded tour name]</NiceName>                <Status>[Recorded tour status]</Status>                <Camera>[Video channel]</Camera>                <DefaultLoopDelay>[Time]</DefaultLoopDelay>            </RecordingInformation>            ...        </ListSuccess>    </Success></RecordedTourResponse>
```

```
http://<servername>/axis-cgi/recordedtour/record.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">    <Success>        <RecordSuccess>            <RecordingId>[Recorded Tour ID]</RecordingId>        </RecordSuccess>    </Success></RecordedTourResponse>
```

```
http://<servername>/axis-cgi/recordedtour/stoprecording.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/play.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/stopplayback.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/pause.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/resume.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/modify.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
http://<servername>/axis-cgi/recordedtour/remove.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">    <GeneralError>        <ErrorCode>[Error code]</ErrorCode>        <ErrorDescription>[Error description]</ErrorDescription>    </GeneralError></RecordedTourResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordedTourResponse    xmlns="http://www.axis.com/vapix/http_cgi/recordedtour1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:SchemaLocation="http://www.axis.com/vapix/http_cgi/recordedtour1    http://www.axis.com/vapix/http_cgi/recordedtour1.xsd"    SchemaVersion="1.0">    <Success>        <GeneralSuccess />    </Success></RecordedTourResponse>
```

```
// Create the web service client.EventClient client = CreateEventServiceClient("<address>", "<username>", "<password>");try{  // Create the scheduled event.  NewScheduledEvent scheduledEvent = new NewScheduledEvent  {    Name = "My schedule",    Schedule = new Schedule    {      ICalendar = new ICalendar      {        Value =          "DTSTART:20111212T07:00 " +          "DTEND:20111212T19:00 " +          "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"      }    }  };  // Add the scheduled event.  string scheduledEventId = client.AddScheduledEvent(scheduledEvent);}catch (Exception e){  HandleException(e);}
```

```
ActionClient client = CreateActionServiceClient("<address>", "<username>", "<password>");try{  // Verify that the camera supports the action.  ActionTemplate[] actiontemplates = client.GetActionTemplates();  if (actiontemplates.Any(    template => template.TemplateToken == "com.axis.action.unlimited.guardtour") == false)  {    // Camera does not support the guard tour action.    return;  }  // Create guard tour action  NewActionConfiguration newAction = new NewActionConfiguration  {    TemplateToken = "com.axis.action.unlimited.guardtour",    Parameters = new ActionParameters    {      Parameter = new[]      {        new ActionParameter { Name = "tour_id", Value = "0" }        new ActionParameter { Name = "goto_home", Value = "1" }        new ActionParameter { Name = "channel", Value = "0" }      }    }  };  // Add the action to the camera.  string actionId = client.AddActionConfiguration(newAction);}catch (Exception e){  HandleException(e);}
```

```
ActionClient client = CreateActionServiceClient("<address>", "<username>", "<password>");try{  // Create action rule  NewActionRule newActionRule = new NewActionRule  {    Name = "Run daily guard tour",    Conditions = new[]    {      FormatTopicExpression(        "tns1:UserAlarm/tnsaxis:Recurring/tnsaxis/Interval",        "boolean(//SimpleItem[@Name=\"id\" and @Value=\"scheduledEventId\"]) and "        + "boolean(//SimpleItem[@Name=\"active\" and @Value=\"1\"])")      },    PrimaryAction = actionId,    Enabled = true  };  // Add the action rule to the camera.  string actionRuleId = client.AddActionRule(newActionRule);}catch (Exception e){  HandleException(e);}
```

- Preset tour — The tour is set up using PTZ preset positions. The tour can display the presets in a predefined order or randomly and for configurable time periods.
Preset tours are defined by parameters in the dynamic GuardTour parameter group. See Preset tours.
- Recorded tour — The tour is set up by recording PTZ movements. While recording the tour, the user steers the camera using an input device, such as a joystick, mouse, keyboard or application. The tour will play the recorded sequence of PTZ movements.
Recorded tours are set up using the Recorded tour API, see Recorded tour API.

- To set up a guard tour using preset positions:
Create the preset positions using /com/ptzconfig.cgi, see section PTZ configuration.
- Create the group GuardTour.G#.
- Add preset positions to the guard tour group. Each position is added as a dynamic subgroup GuardTour.G#.Tour.T#.
- Start the guard tour or schedule the guard tour using action rules (AXIS OS 5.50 and later) or scheduled event types (AXIS OS 5.00 to 5.4x).

- API Discovery: id=guard-tour
- Property: root.Properties.GuardTour.GuardTour=yes/no
- Property: root.Properties.GuardTour.MaxGuardTour=integer (only applicable if GuardTour is set to yes). Specifies the max number of guard tours that can be configured and sends a warning whenever no more tours can be created.
- Property: root.Properties.GuardTour.MinGuardTourWaitTime=integer (only applicable if GuardTour is set to yes). Specifies the minimum preset wait time for guard tours on a product and presents the correct limitations before a guard tour can be created.
- Property: root.Properties.GuardTour.GuardTourChannels=comma separated integer list (only applicable if GuardTour is set to yes). Specifies the channel that should have guard tour capabilities. Example: 1, 2, 3, 4.
- Property: Properties.API.HTTP.Version=3
- Product category: Network cameras and video encoders with mechanical or digital PTZ

- Template: guardtour
- Access control — Create: admin, operator
- Access control — Delete: admin, operator
- Access control — Get: admin, operator, viewer
- Group range: 0 – 9

- Template: tour
- Access control — Create: admin, operator
- Access control — Delete: admin, operator
- Access control — Get: admin, operator, viewer
- Group range: 0 – 9

- API Discovery: id=recorded-guard-tour
- Property: root.Properties.API.HTTP.Version=3
- Property: root.Properties.GuardTour.RecordedTour=yes/no
- Property: root.Properties.GuardTour.MaxRecordedTours=integer (only applicable if RecordedTour is set to yes). Specifies the max number of recorded tours that can be configured and sends a warning whenever no more tours can be created.
- Property: Properties.GuardTour.RecordedTourChannels=comma separated integer list (only applicable if RecordedTour is set to yes). Specifies the channel that should have recorded tour capabilities. Example: 1, 2, 3, 4.
- Product category: Network cameras and video encoders with mechanical or digital PTZ

- Access control: admin, operator, viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator, viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- Access control: admin, operator
- Method: POST

- Access control: admin, operator, viewer with PTZ control access
- Method: POST

- Access control: admin, operator, viewer with PTZ control access
- Method: POST

- Access control: admin, operator, viewer with PTZ control access
- Method: POST

- Access control: admin, operator, viewer with PTZ control access
- Method: POST

- Access control: admin, operator
- Method: POST

- Access control: admin, operator
- Method: POST

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Preset tours, see Guard tour action.
- Recorded tours, see Recorded tour action.

- The action rule is created in three steps:
Create a scheduled event using AddScheduledEvent.
- Create a guard tour action configuration using AddActionConfiguration.
- Create an action rule using AddActionRule. The action rule uses the Scheduled Event ID scheduledEventId returned by AddScheduledEvent and the Action Configuration ID actionId returned by AddActionConfiguration.

- The action can be run as:
fixed action — run the guard tour once
- unlimited action — keep the guard tour running as long as all conditions are fulfilled
- Action ID
com.axis.action.fixed.guardtour
- Action ID
com.axis.action.unlimited.guardtour

- Action ID: com.axis.action.unlimited.recordedtour

| Parameter | Default value | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| Running | no | yes no | admin: read, write operator with/without PTZ control: read, write viewer: read | Status of the guard tour.yes = The guard tour is running.no = The guard tour is idle. |
| Name | GuardTourName | String | admin: read, write operator: read, write viewer: read | Name of the guard tour.The name cannot contain the following characters: ", <, >.If using non-standard ASCII characters, the representation of the name may not be correct. |
| CamNbr | 1 | Integer | admin: read, write operator: read, write viewer: read | View area or video source for which the guard tour is defined. |
| RandomEnabled | no | yes no | admin: read, write operator: read, write viewer: read | yes = The guard tour moves between the preset positions in a random order.no = The tour is not random. |
| TimeBetweenSequences | Product-dependent | 0 ... 9999 | admin: read, write operator: read, write viewer: read | Number of minutes to wait between successive tours.The guard tour will move to all specified preset positions and when wait TimeBetweenSequences minutes before continuing to the first preset position. |

| Parameter | Default value | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| PresetNbr |  | 1 ... 3600 | admin: read, write operator: read, write viewer: read | Required. Preset position number. |
| Position | 1 | 1 ... 3600 | admin: read, write operator: read, write viewer: read | The position of the preset in the guard tour.If the tour is not random, that is, if GuardTour.G#.RandomEnabled=no, this parameter defines the order of the presets in the tour. The tour will first visit the preset with the lowest Position, then move to the preset with the second lowest Position and so on. |
| MoveSpeed | 70 | 1 ... 100 | admin: read, write operator: read, write viewer: read | Pan and tilt speed when moving between presets. Applies to products with mechanical PTZ. |
| WaitTime | 10 | 0 ... 3600 | admin: read, write operator: read, write viewer: read | Time to wait before moving to the next preset position.Unit is defined by parameter WaitTimeViewType. |
| WaitTimeViewType | Seconds | Seconds Minutes | admin: read, write operator: read, write viewer: read | Unit for parameter WaitTime. |

| Name | Description |
| --- | --- |
| getschemaversions.cgi | Get supported XML Schema versions, see XML schema versions. |
| list.cgi | List recorded tours, see List. |
| record.cgi | Start recording a tour, see Record. |
| stoprecording.cgi | Stop recording, see Stop recording. |
| play.cgi | Play a recorded tour, see Play. |
| stopplayback.cgi | Stop playing a recorded tour, see Stop playback. |
| pause.cgi | Pause a recorded tour, see Pause. |
| resume.cgi | Resume a paused recorded tour, see Resume. |
| modify.cgi | Modify a recorded tour, see Modify. |
| remove.cgi | Remove a recorded tour, see Remove. |

| Parameter | Default Value | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| GuardTour.MaxRecordedTours | Product-dependent | Integer | admin: read | Maximum number of recorded tours. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RecordedTourResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated. false = SchemaVersion is not deprecated. |
| GetSchemaVersionsSuccess | Contains the supported XML Schema versions. |  |  |
| SchemaVersion | Supported version of the XML Schema. |  |  |
| VersionNumber | The version number of the XML Schema in the form [major].[minor] Example: 1.0 |  |  |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. Default: false |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required.The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| camera=<integer> | 1 ... | The video channel or view area. If omitted, recorded tours from all video channels or view areas are listed. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the recorded tour to list. If omitted, all recorded tours will be listed. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RecordedTourResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated. false = SchemaVersion is not deprecated. |
| RecordingInformation | Contains information about the recorded tour. |  |  |
| RecordingId | The recorded tour ID. |  |  |
| NiceName | Descriptive name of the recorded tour. |  |  |
| Status | Status of the tour.Available values: playing recording stopped |  |  |
| Camera | Video channel or view area. |  |  |
| DefaultLoopDelay | Number of seconds to wait before continuing a loop tour. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required. The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| nicename=<string> | <recorded tour name> | The name of the recorded tour. Use a string with maximum 31 characters.Supported characters: a-z, A-Z, 0–9,’.’,’-’,’_’ |
| camera=<integer> | 1 ... | Required. The video channel or view area. |
| recordedtourid=<integer> | 0 ... 9999 | Recorded tour ID. Each tour must have a unique ID. If omitted, an autogenerated ID will be assigned. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RecordedTourResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated. false = SchemaVersion is not deprecated. |
| RecordSuccess | Contains the response to a successful request. |  |  |
| RecordingId | Contains the Recorded Tour ID. |  |  |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required.The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the recorded tour to stop. If omitted, all ongoing recordings will be stopped. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required. The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | Required. ID of the recorded tour to play. |
| loop=<integer> | 0 1 | 0 = No loop. The recorded tour will be played once from start to end.1 = Loop. The recorded tour will keep running until stopped. When the end point is reached, playback will pause the number of seconds specified in loopdelay before continuing from the start point.Default: loop=0. |
| loopdelay=<integer> | 0 ... 9999 | Number of seconds to wait before continuing the loop.If omitted, the defaultloopdelay set by modify.cgi will be used. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required.The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the recorded tour to stop. If omitted, playback of all ongoing recorded tours will be stopped. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required.The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the recorded tour to pause. If omitted, all playing recorded tours will be paused. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required.The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the paused recorded tour to resume. If omitted, playback of all paused recorded tours will be resumed. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required. The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | ID of the recorded tour to modify. |
| nicename=<string> | String | New descriptive name for the recording. If omitted, the current name is kept.Maximum 31 characters.Supported characters: a-z, A-Z, 0–9, ‘.’,’-’,’_’ |
| defaultloopdelay=<integer> | 0 ... 9999 | New loop delay in seconds. If omitted, the current delay is kept.Default value: 60 seconds. |

| Argument | Valid values | Description |
| --- | --- | --- |
| schemaversion=<integer> | 1 ... | Required. The major version of the XML Schema that the response is structured according to. The latest supported minor version is always used. |
| recordedtourid=<integer> | 0 ... 9999 | Required. ID of the recorded tour to remove. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RecordedTourResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated. false = SchemaVersion is not deprecated. |
| GeneralError | Contains the response to an unsuccessful request. |  |  |
| ErrorCode | See below for supported error codes |  |  |
| ErrorDescription | Description of the error. |  |  |

| Error Code | Error Description |
| --- | --- |
| 10 | Invalid Recorded Tour ID. |
| 20 | The provided Recorded Tour ID is not unique. |
| 30 | Maximum number of recorded tours is already reached. A new tour cannot be recorded. |
| 40 | No space left. A new tour cannot be recorded. |
| 50 | Invalid argument. The provided value is not supported. |
| 60 | Invalid state. |
| 70 | Missing or invalid XML schema version. |
| 100 | General error. |

| Element | Description | Attribute | Description |
| --- | --- | --- | --- |
| RecordedTourResponse | Contains the response to the CGI request. | SchemaVersion | The version of the XML Schema that the response is formatted according to. |
|  |  | Deprecated | true = SchemaVersion is deprecated. false = SchemaVersion is not deprecated. |
| GeneralSuccess | The request was successful. |  |  |

| Name | Value | Reference |
| --- | --- | --- |
| Start event: None | - | - |
| Condition: Scheduled event | Event: tns1:UserAlarm/tnsaxis:Recurring/tnsaxis:Interval | See VAPIX® Event and action services. See Scheduled event. |
| Primary action: Guard tour | Action template: com.axis.action.unlimited.guardtour | This template is for preset tours. See Guard tour action. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| tour_id | Unsigned integer | The guard tour to start. If the guard tour is defined by the GuardTour.G# parameter group, the tour_id is the number #. |
| goto_home | 0 1 | 1 = Return to the home position when the action is finished. 0 = Stay at the current position when the action is finished. |
| channel | Unsigned integer | The view area in which the guard tour is defined. The view area is defined by the Image.I# parameter group where # is the view area number. |

| Parameter | Valid values | Description |
| --- | --- | --- |
| tour_id | Unsigned integer | The ID of the recorded tour to start. IDs of configured recorded tours can be retrieved using axis-cgi/recordedtour/list.cgi |
| goto_home | 0 1 | 1 = Return to the home position when the action is finished. 0 = Stay at the current position when the action is finished. |

