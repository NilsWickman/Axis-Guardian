# Input and outputs

**Source:** https://developer.axis.com/vapix/network-video/input-and-outputs/
**Last Updated:** Aug 28, 2025

---

# Input and outputs

## I/O port API​

### Description​

#### Identification​

### Numbering of I/O ports​

### Common examples​

### I/O parameters​

### HTTP API​

### I/O events and actions​

#### Digital Input Event​

#### Virtual Input Event​

#### Manual Trigger Event​

#### Output event​

#### Output Port Action​

## General purpose I/O service​

### Description​

#### Identification​

### Common examples​

### Service capabilities​

### GetServiceCapabilities command​

### Port​

### GetPortList command​

### GetPort command​

### SetPort command​

### Supervised port event​

## Virtual input API​

### Description​

#### Virtual input ports​

#### Identification​

### Common examples​

### Activate a virtual input​

### Deactivate a virtual input​

### Get schema versions​

### General error response​

### Manual trigger and I/O port simulation​

This section describes I/O functionality in Axis products.

Most Axis products have integrated digital input and output ports which enable connection to external devices such as detectors, lights, switches and alarm relays. The number of I/O ports is product dependent. In some products, each I/O port can be configured to act as input or output.

Input ports – For external alarm devices that can toggle between an open and grounded (closed) circuit, for example a pushbutton or a door sensor. Devices connected to input ports are usually used to trigger alarms.

Output port – For external alarm devices such as relays and LEDs that, for example, are to be activated by a triggered/scheduled event.

For information about the manual trigger /io/virtualinput.cgi, see Virtual input API.

The port.cgi described in this document replaces the input.cgi and output.cgi from VAPIX version 2. The input.cgi and output.cgi are obsolete but supported for backwards compatibility. For products with configurable ports, port.cgi must be used.

To configure Port n+1 (n is a non-negative integer) the product requires:

The numbering of the I/O ports starts from one in port.cgi requests and in all responses. For the IOPort.I# parameter groups port numbering starts from zero.

The physical port labeled n in port.cgi requests and the corresponding parameter group is IOPort.I(n-1).

Check the number of configured inputs.

Response

Body:

Check the number of configured outputs.

Response:

Body:

Check if port 1 is configurable.

Response:

Body:

Set port 2 to active for 300 ms, wait 500 ms and then set the port to active for another 300 ms. That is, create two 300 ms pulses with a 500 ms delay between the pulses. Some characters in the action argument action=2:/300\500/300\ must be percent-encoded.

Check status of port 1 and 2.

Response:

Body:

Check if port 3 is active.

Response:

Body:

Monitor data on port 3.

The Content-type multipart/x-mixed-replace contains elements that are no longer supported by Chrome or Firefox, but still work in Edge.

a) Port 3 is an input port.

Response

Body:

The characters / and \ indicate a change in the state. The characters H and L indicate that the state is unchanged.

Non-empty boundaries are sent when the port status changes. If there are no changes, empty boundaries are sent at 15-second intervals.

b) Port 3 is an output port.

Response

Body:

The characters / and \ indicate a change in the state. The characters H and L indicate that the state is unchanged.

Non-empty boundaries are sent when the port status changes. If there are no changes, empty boundaries are sent at 15-second intervals.

Port settings

The settings for the physical I/O port numbered # are defined by the group IOPort.I#, where # is an integer starting from 0 (zero) for the first physical port. These parameters are handled by param.cgi.

IOPort.I#

Input parameters

Input defines the input parameters. The parameter is handled by param.cgi.

Input

Output parameters

Output defines the output parameters. The parameter is handled by param.cgi.

Output

Properties parameters

Defines certain properties of the I/O API.

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

The Digital Input event is true if the digital I/O port configured as input is active. There is one event for each input port. The Any event is true if any of the input ports is active.

Topic

Source instance

Data instance

The Virtual Input event is true if the virtual input is active. There is one event for each virtual input.

Topic

Source instance

Data instance

The Manual Trigger event is true if the manual trigger is active. The manual trigger can be activated using axis-cgi/io/virtualinput.cgi or using the button in the product’s Live View page. For products with multiple view areas or multiple video channels, there is one manual trigger for each view area or video channel. The channel element in SourceInstance specifies the view area or video channel.

Topic

Source instance

Data instance

This event is sent every time the state of an output port changes.

Topic

Use the Output Port action to activate and inactive the product’s output ports.

This action can be run as:

fixed action — set the port state when action is triggered and return to the opposite state after the time defined by parameter duration

unlimited action — set the port state when the action is triggered and return to the opposite state when event conditions are no longer fulfilled

Action ID

com.axis.action.fixed.io.toggle

Action ID

com.axis.action.unlimited.io.toggle

VAPIX® General purpose I/O service API is used to manage I/O ports. The General purpose I/O service API complements VAPIX® I/O port API by providing support for supervised I/O and relay connectors.

Supported functionality:

To simplify configuration, only the PortId field and the fields to be modified are required when configuring a port.

Find available ports. Use GetPortList.

Find information about specific ports. Use GetPort.

Configure port settings and set ports as active or inactive. Use SetPort.

To simplify configuration, only the PortId field and the fields to be modified are required when configuring a port.

The General purpose I/O service API produces the following events:

VAPIX General purpose I/O service API applies to the following products: AXIS A9161 Network I/O Relay Module and AXIS A9188 Network I/O Relay Module.

VAPIX ® General Purpose I/O Service API is supported if:

Use axgpio:GetServiceCapabilities to list the service capabilities. See GetServiceCapabilities command.

This section contains examples how to use the General purpose I/O service API.

API calls can be constructed using JSON or using SOAP. Some of the examples here also use pseudocode to illustrate the intended workflow. To improve readability, the responses are prettified and sometimes truncated. For example, in SOAP responses the namespace attributes in the SOAP-ENV:Envelope tag are omitted. All response sizes are examples only and might differ from the actual response sizes.

Get service capabilities

Use axgpio:GetServiceCapabilities to get a list of the service capabilities.

JSON request:

JSON response:

SOAP request:

SOAP response:

List ports

Use axgpio:GetPortList to list the Axis product’s ports. The Limit, StartReference and NextStartReference fields allow clients to iterate over large data sets and fetch data in chunks. A response with a NextStartReference field indicates that the call did not return all available ports. Use the returned NextStartReference as StartReference in a new call to continue fetching data. See also GetPortList command. To list all ports, omit Limit and StartReference.

The following two examples show how to use Limit and StartReference in two successive calls. In the first call. Limit is set to 1 to list only one port. The response includes a NextStartReference field which is used as StartReference in the next call.

Example 1:

To list only one port, set Limit to 1.

The response lists the first port (port 0) and its current settings. The PortId field identifies the port. The SupportedModes field shows each port’s available modes. Here, port 0 can be used in three modes: DigitalInput, OpenCollectorOutput or SupervisedInput. Fields CurrentMode and CurrentState show the port’s current mode and state. The NextStartReference fields gives the StartReference to be used in the next call.

JSON request:

JSON response:

SOAP request:

SOAP response:

Example 2:

The second call uses the returned NextStartReference as StartReference to continue listing ports.

JSON request:

JSON response:

SOAP request:

SOAP response:

List ports settings

When a port’s PortId is known, use axgpio:GetPort to list the port’s settings. This example lists information about ports 8 and 9.

JSON request:

JSON response:

SOAP request:

SOAP response:

Configure ports as supervised inputs

To configure a port as supervised input, use axgpio:SetPort to update the Port data structure. Set the field CurrentMode to SupervisedInput.

A supervised input can be in one of the following states:

Each state has an associated voltage range. The Axis product emits a tns1:Device/tnsaxis:IO/SupervisedPort event when the analog voltage in the circuit connected to the supervised input changes from a value outside the range to a value inside the range. In the Port data structure, use the SupervisedInput field to set the voltage ranges.

The following pseudocode shows how to set port 0 as supervised input.

Pseudocode:

Supported values for the State field are PortStateEnum strings. This behavior might change in the future. Axis recommends applications to assume that State could be any string.

Only fields to be updated need to be included in a axgpio:SetPort call. Omitted fields keep their current values. The response lists the PortId of the updated ports.

The following call sets port 0 as supervised input and port 1 as digital input.

JSON request:

JSON response:

SOAP request:

SOAP response:

Configure ports as outputs

To configure a port as output, use axgpio:SetPort to update the Port data structure. Set the field CurrentMode to OpenCollectorOutput.

The following call sets ports 0 to 7 as outputs. Omitted fields keep their current values. The response lists the ports that were changed.

JSON request:

JSON response:

SOAP request:

SOAP response:

Activate ports

To set a port as active, use axgpio:SetPort to update the Port data structure. Set the field Active to true.

In this example, ports 0 to 15 are all set to active in the same request. It is also possible to use one request per port. Setting all ports in one request is recommended as this reduces the latency between the first and last port state change.

The response lists the ports that were updated.

JSON request:

JSON response:

SOAP request:

SOAP response:

Configure port names

I/O ports have configurable nice names. Each port has two nice names, one for the supervised and digital input modes and one for the open collector output and relay modes.

The following pseudocode shows how to read port 0 nice names.

Pseudocode:

Use axgpio:SetPort to update nice names.

JSON request:

SOAP request:

Event examples

VAPIX® General Purpose I/O Service API produces the following events:

The supervised port event in the event stream.

Supervised port event:

The ONVIF digital input event in the event stream.

Digital input event:

The ONVIF relay event in the event stream.

Relay event:

Read analog level

For ports configured as supervised inputs, the AnalogLevel field shows the current analog voltage at the input pin. Use axgpio:GetPort to read the value.

This example assumes that port 0 is configured as supervised input. The analog voltage is 2800 mV and the port state is cut.

JSON request:

JSON response:

SOAP request:

SOAP response:

ServiceCapabilities

The ServiceCapabilities data structure describes the available service capabilities.

Mandatory fields:

Use the GetServiceCapabilities command to retrieve the capabilities supported by the service.

Request

The request is empty.

Response

with the following data fields:

PortId

PortId is read-only string that identifies the port.

PortMode

PortMode is a string containing a port mode.

Enumeration: PortModeEnum

PortModeEnum is a non-normative enum that contains available port modes.

SupervisedInputCapabilities

The SupervisedInputCapabilities data structure contains the capabilities of a supervised input.

Mandatory fields:

PortState

PortState is a string containing a port state.

Enumeration: PortStateEnum

PortStateEnum is a non-normative enum that contains the port’s available states.

Enumeration: ActiveStateEnum

ActiveStateEnum is a non-normative enum that defines which port state is the port’s active state.

Properties

The Properties data structure contains the port’s properties. In the Port data structure, fields InputProperties and OutputProperties specify properties for input and output ports, respectively. A port can have input and output properties specified at the same time.

Optional fields

SupervisionRange

The SupervisionRange data structure defines a voltage range for a supervised input state.

The Axis product emits a Device/IO/SupervisedPort event if the analog voltage in the circuit connected to a supervised input changes from a value outside the range to a value inside the range.

Mandatory fields:

SupervisedInput

The SupervisedInput data structure contains the configuration for a supervised input.

Mandatory fields:

Port

The Port data structure contains the configuration for a port.

Mandatory fields:

Use the GetPortList command to list the Axis product’s Port data structures.

The Limit, StartReference and NextStartReference fields allow clients to iterate over large data sets and fetch data in chunks. Limit is the maximum number of Port items returned in the response. If the response does not return all available data, the response contains a NextStartReference with a reference to the first item in the next data set. To continue fetching data, use the reference as StartReference in the next call.

StartReference specifies the first item in the data set to return. Use the reference returned by the previous GetPortList request. Do not use the same reference more than once. If StartReference is omitted, the call returns items starting from the beginning of the data set.

Limit is the maximum number of items returned. The actual number of returned items may be less than Limit depending on the Axis product’s performance. If Limit is omitted, the number of returned items is determined by the ServiceCapabilities data structure and the Axis product’s performance. See Service capabilities.

Request

with the following data fields:

Response

with the following data fields:

Use the GetPort command to list specified Port data structures.

In the request, each Port is identified by its PortId. If a PortId cannot be resolved, it is ignored. A request without any valid PortId returns an empty set.

The maximum number of returned items is determined by the ServiceCapability data structure. See Service capabilities.

Request

with the following data fields:

Response

with the following data fields:

Use the SetPort command to update one or more Port data structures. Available fields are described in section Port. All fields except PortId are optional. Fields omitted in the request keep their current values.

The request returns PortId:s of the Port items that were updated. Ports with PortId:s not in the list were not updated.

Request

with the following data fields:

Response

with the following data fields:

The supervised port event tns1:Device/tnsaxis:IO/SupervisedPort is a stateful event emitted when a supervised input changes state. The event ‘s Source field contains the port number of the I/O that emitted the event. The Data field contains the port’s new state.

To retrieve the event declaration, use aev:GetEventInstances.

Event declaration:

Virtual inputs enable clients to trigger actions in an Axis product. In the Axis product, the virtual input is used as action rule start event or condition and can trigger any type of action, for example video recording, output port activation or go to PTZ preset position.

Axis products have two types of virtual inputs:

Virtual input ports. Recommended for products with AXIS OS 5.50 and later. There are 32 ports that can be connected to different actions. See Virtual input ports.

Event tns1:Device/tnsaxis:IO/tnsaxis:VirtualInput

Manual trigger. Use the manual trigger for products with older AXIS OS. Can be used to simulate I/O ports during testing or as manual trigger. See Manual trigger and I/O port simulation.

Event tns1:Device/tnsaxis:IO/tnsaxis:VirtualPort

To use virtual inputs:

Set up an action rule in the Axis product. Use the virtual input event as start event or condition. See Event and action services.

Configure the client to activate or deactivate the virtual input.

To activate virtual inputs, clients can use web services or CGI:s.

A VMS can use virtual inputs to allow users to trigger camera actions manually. By clicking a button in the VMS user interface, the user sends an activate virtual input command to the Axis product. An action rule in the Axis product listens to the virtual input event and triggers the action.

Consider a surveillance system where a camera should record video on motion detection but only when the alarm control system is activated. Configure the alarm control system to send commands to the camera to activate virtual input 1 when the alarm control system is activated, and to deactivate the input when the system is deactivated. In the camera, set up an action rule with motion detection as start event, virtual input 1 as condition and record video as action.

Each virtual input port has two states: high and low. Activating sets the port to state high. Deactivating sets the port to state low.

The default number of virtual input ports is 64. Some devices may have a different number of ports.

To activate and deactivate virtual input ports, use one of the following methods:

To check the state of a virtual input port, subscribe to the corresponding tns1:Device/tnsaxis:IO/tnsaxis:VirtualInput event. The event is described in section Virtual Input Event.

Virtual input ports are available if:

The manual trigger /io/virtualinput.cgi is available if:

Activate virtual input 10.

Request:

Response:

Deactivate virtual input 10.

Request:

Response:

Activate virtual input port 3 for a certain time.

Request:

Response:

Use virtualinput/activate.cgi to activate a virtual input.

Request

Syntax:

with the following arguments and values:

Response

The response from virtualinput/activate.cgi shows if the virtual input was activated and if the port state was changed.

Success:

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40, 50

Use virtualinput/deactivate.cgi to deactivate a virtual input.

Request

Syntax:

with the following arguments and values:

Response

The response from virtualinput/deactivate.cgi shows if the virtual input was deactivated and if the port state was changed.

Success:

Body:

Supported elements, attributes and values:

Error

If an error occurred, a GeneralError response is returned. See General error response.

Error codes: 10, 20, 30, 40

The virtualinput/getschemaversions.cgi returns a list of supported versions of the XML schema for the Virtual input API. The list also shows if the schemas are deprecated or not.

Request

Syntax:

This CGI has no arguments.

Response

The response from virtualinput/getschemaversions.cgi shows available schema versions for the Virtual input API and if the schemas are deprecated.

Success:

Body:

Supported elements, attributes and values:

General error response from Virtual input API.

Body:

Supported elements, attributes and values:

The /io/virtualinput.cgi is used to:

Both the manual trigger and the I/O ports can be activated for a specified time.

Activate the manual trigger, keep it active for 2 seconds and then deactivate the trigger. In this example, the manual trigger is port 6. Some characters in the action argument action=6:/2000\ must be percent-encoded.

Request:

Request

Syntax:

With the following arguments and values:

Response

Response from /io/virtualinput.cgi

```
http://myserver/axis-cgi/param.cgi?action=list&group=Input.NbrOfInputs
```

```
Input.NbrOfInputs=3
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=Output.NbrOfOutputs
```

```
Output.NbrOfOutputs=1
```

```
http://myserver/axis-cgi/param.cgi?action=list&group=IOPort.I1.Configurable
```

```
IOPort.I1.Configurable=yes
```

```
http://myserver/axis-cgi/io/port.cgi?action=2%3A%2F300%5C500%2F300%5C
```

```
http://myserver/axis-cgi/io/port.cgi?check=1,2
```

```
port1=0port2=0
```

```
http://myserver/axis-cgi/io/port.cgi?checkactive=3
```

```
port3=inactive
```

```
http://myserver/axis-cgi/io/port.cgi?monitor=3
```

```
--ioboundaryContent-Type: text/plain3I:/--ioboundaryContent-Type: text/plain3I:H--ioboundaryContent-Type: text/plain23I:\--ioboundaryContent-Type: text/plain3I:L--ioboundaryContent-Type: text/plain--ioboundaryContent-Type: text/plain...
```

```
--ioboundaryContent-Type: text/plain3O:/--ioboundaryContent-Type: text/plain3O:H--ioboundaryContent-Type: text/plain3O:\--ioboundaryContent-Type: text/plain3O:L--ioboundaryContent-Type: text/plain--ioboundaryContent-Type: text/plain...
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
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:GetServiceCapabilities":{}}
```

```
HTTP/1.1 200 OKContent-Length: 49Content-Type: application/json{  "Capabilities": {    "MaxLimit": "1000"  }}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetServiceCapabilities></axgpio:GetServiceCapabilities>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 2402Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetServiceCapabilitiesResponse>      <axgpio:Capabilities MaxLimit="1000"></axgpio:Capabilities>    </axgpio:GetServiceCapabilitiesResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:GetPortList":{    "Limit": "1"  }}
```

```
HTTP/1.1 200 OKContent-Length: 1384Content-Type: application/json{  "NextStartReference": "1",  "Port": [    {      "PortId": "0",      "SupportedModes": [        "DigitalInput",        "OpenCollectorOutput",        "SupervisedInput"      ],      "CurrentMode": "OpenCollectorOutput",      "CurrentState": "closed",      "Active": true,      "InputProperties": {        "NiceName": "Input 1",        "ActiveState": "closed"      },      "OutputProperties": {        "NiceName": "Output 1",        "ActiveState": "closed"      },      "SupervisedInput": {        "Triggers": [          {            "State": "shorted",            "LowerLimit": "0",            "UpperLimit": "100"          },          {            "State": "closed",            "LowerLimit": "500",            "UpperLimit": "1500"          },          {            "State": "open",            "LowerLimit": "1800",            "UpperLimit": "2200"          },          {            "State": "cut",            "LowerLimit": "2300",            "UpperLimit": "12000"          }        ],        "Capabilities": {          "MaxNumberOfRanges": 4,          "MinVoltageRange": 60,          "MinVoltageLevel": 0,          "MaxVoltageLevel": 12000        }      }    }  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortList>      <axgpio:Limit>1</axgpio:Limit>    </axgpio:GetPortList>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 3966Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortListResponse>      <axgpio:NextStartReference>1</axgpio:NextStartReference>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:SupportedModes>DigitalInput</axgpio:SupportedModes>        <axgpio:SupportedModes>OpenCollectorOutput</axgpio:SupportedModes>        <axgpio:SupportedModes>SupervisedInput</axgpio:SupportedModes>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>        <axgpio:CurrentState>closed</axgpio:CurrentState>        <axgpio:Active>true</axgpio:Active>        <axgpio:InputProperties>          <axgpio:NiceName>Input 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:InputProperties>        <axgpio:OutputProperties>          <axgpio:NiceName>Output 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:OutputProperties>        <axgpio:SupervisedInput>          <axgpio:Triggers>            <axgpio:State>shorted</axgpio:State>            <axgpio:LowerLimit>0</axgpio:LowerLimit>            <axgpio:UpperLimit>100</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>closed</axgpio:State>            <axgpio:LowerLimit>500</axgpio:LowerLimit>            <axgpio:UpperLimit>1500</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>open</axgpio:State>            <axgpio:LowerLimit>1800</axgpio:LowerLimit>            <axgpio:UpperLimit>2200</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>cut</axgpio:State>            <axgpio:LowerLimit>2300</axgpio:LowerLimit>            <axgpio:UpperLimit>12000</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Capabilities>            <axgpio:MaxNumberOfRanges>4</axgpio:MaxNumberOfRanges>            <axgpio:MinVoltageRange>60</axgpio:MinVoltageRange>            <axgpio:MinVoltageLevel>0</axgpio:MinVoltageLevel>            <axgpio:MaxVoltageLevel>12000</axgpio:MaxVoltageLevel>          </axgpio:Capabilities>        </axgpio:SupervisedInput>      </axgpio:Port>    </axgpio:GetPortListResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:GetPortList":{    "Limit": "1",    "StartReference": "1"  }}
```

```
HTTP/1.1 200 OKContent-Length: 1384Content-Type: application/json{  "NextStartReference": "2",  "Port": [    {      "PortId": "1",      ...      }    }  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortList>      <axgpio:Limit>1</axgpio:Limit>      <axgpio:StartReference>1</axgpio:StartReference>    </axgpio:GetPortList>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 3966Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortListResponse>      <axgpio:NextStartReference>2</axgpio:NextStartReference>      <axgpio:Port>        <axgpio:PortId>1</axgpio:PortId>        ...      </axgpio:Port>    </axgpio:GetPortListResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:GetPort":{    "PortId":["8","9"]  }}
```

```
HTTP/1.1 200 OKContent-Length: 598Content-Type: application/json{  "Port": [    {      "PortId": "8",      "SupportedModes": [        "RelayOutput"      ],      "CurrentMode": "RelayOutput",      "CurrentState": "closed",      "Active": true,      "OutputProperties": {        "NiceName": "Relay 1",        "ActiveState": "closed"      }    },    {      "PortId": "9",      "SupportedModes": [        "RelayOutput"      ],      "CurrentMode": "RelayOutput",      "CurrentState": "closed",      "Active": true,      "OutputProperties": {        "NiceName": "Relay 2",        "ActiveState": "closed"      }    }  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPort>      <axgpio:PortId>8</axgpio:PortId>      <axgpio:PortId>9</axgpio:PortId>    </axgpio:GetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 3099Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortResponse>      <axgpio:Port>        <axgpio:PortId>8</axgpio:PortId>        <axgpio:SupportedModes>RelayOutput</axgpio:SupportedModes>        <axgpio:CurrentMode>RelayOutput</axgpio:CurrentMode>        <axgpio:CurrentState>closed</axgpio:CurrentState>        <axgpio:Active>true</axgpio:Active>        <axgpio:OutputProperties>          <axgpio:NiceName>Relay 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:OutputProperties>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>9</axgpio:PortId>        <axgpio:SupportedModes>RelayOutput</axgpio:SupportedModes>        <axgpio:CurrentMode>RelayOutput</axgpio:CurrentMode>        <axgpio:CurrentState>closed</axgpio:CurrentState>        <axgpio:Active>true</axgpio:Active>        <axgpio:OutputProperties>          <axgpio:NiceName>Relay 2</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:OutputProperties>      </axgpio:Port>    </axgpio:GetPortResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{  get_response = axgpio.GetPort(PortId = 0)  ports = get_response.Port  port0 = ports[0]  supervised = port0.SupervisedInput  triggers[0] = {.State = "shorted", .LowerLimit = 0, .UpperLimit = 100}  triggers[1] = {.State = "closed", .LowerLimit = 500, .UpperLimit = 1500}  triggers[2] = {.State = "open", .LowerLimit = 1800, .UpperLimit = 2200}  triggers[3] = {.State = "cut", .LowerLimit = 2300, .UpperLimit = 12000}  supervised.Triggers = triggers  port0.SupervisedInput = supervised  port0.CurrentMode = "SupervisedInput"  axgpio.SetPort(port0)}
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:SetPort":{    "Port": [    {      "PortId": "0",      "CurrentMode": "SupervisedInput",      "InputProperties": {        "NiceName": "Supervised Input 1",        "ActiveState": "open"      },      "OutputProperties": {        "NiceName": "Output 1",        "ActiveState": "closed"      },      "SupervisedInput": {        "Triggers": [          {            "State": "shorted",            "LowerLimit": "0",            "UpperLimit": "100"          },          {            "State": "closed",            "LowerLimit": "500",            "UpperLimit": "1500"          },          {            "State": "open",            "LowerLimit": "1800",            "UpperLimit": "2200"          },          {            "State": "cut",            "LowerLimit": "2300",            "UpperLimit": "12000"          }        ]      }    },    {      "PortId": "1",      "CurrentMode": "DigitalInput",      "InputProperties": {        "NiceName": "Input 1",        "ActiveState": "closed"      }    }  ]}
```

```
HTTP/1.1 200 OKContent-Length: 61Content-Type: application/json{  "Port": [    "0",    "1"  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPort>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:CurrentMode>SupervisedInput</axgpio:CurrentMode>        <axgpio:InputProperties>          <axgpio:NiceName>Supervised Input 1</axgpio:NiceName>          <axgpio:ActiveState>open</axgpio:ActiveState>        </axgpio:InputProperties>        <axgpio:OutputProperties>          <axgpio:NiceName>Output 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:OutputProperties>        <axgpio:SupervisedInput>          <axgpio:Triggers>            <axgpio:State>shorted</axgpio:State>            <axgpio:LowerLimit>0</axgpio:LowerLimit>            <axgpio:UpperLimit>100</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>closed</axgpio:State>            <axgpio:LowerLimit>500</axgpio:LowerLimit>            <axgpio:UpperLimit>1500</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>open</axgpio:State>            <axgpio:LowerLimit>1800</axgpio:LowerLimit>            <axgpio:UpperLimit>2200</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>cut</axgpio:State>            <axgpio:LowerLimit>2300</axgpio:LowerLimit>            <axgpio:UpperLimit>12000</axgpio:UpperLimit>          </axgpio:Triggers>        </axgpio:SupervisedInput>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>1</axgpio:PortId>        <axgpio:CurrentMode>DigitalInput</axgpio:CurrentMode>        <axgpio:InputProperties>          <axgpio:NiceName>Input 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:InputProperties>      </axgpio:Port>    </axgpio:SetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 2409Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPortResponse>      <axgpio:PortId>0</axgpio:PortId>      <axgpio:PortId>1</axgpio:PortId>    </axgpio:SetPortResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:SetPort":{    "Port": [    {      "PortId": "0",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "1"      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "2",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "3",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "4",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "5",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "6",      "CurrentMode": "OpenCollectorOutput"    },{      "PortId": "7",      "CurrentMode": "OpenCollectorOutput"    }  ]}}
```

```
HTTP/1.1 200 OKContent-Length: 116Content-Type: application/json{  "Port": [    "0",    "1",    "2"    "3",    "4",    "5",    "6",    "7"  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPort>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>1</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>2</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>3</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>4</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>5</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>6</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>7</axgpio:PortId>        <axgpio:CurrentMode>OpenCollectorOutput</axgpio:CurrentMode>      </axgpio:Port>    </axgpio:SetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 2569Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPortResponse>      <axgpio:PortId>0</axgpio:PortId>      <axgpio:PortId>1</axgpio:PortId>      <axgpio:PortId>2</axgpio:PortId>      <axgpio:PortId>3</axgpio:PortId>      <axgpio:PortId>4</axgpio:PortId>      <axgpio:PortId>5</axgpio:PortId>      <axgpio:PortId>6</axgpio:PortId>      <axgpio:PortId>7</axgpio:PortId>    </axgpio:SetPortResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:SetPort":{    "Port":[      {        "PortId": "0",        "Active": true      },      {        "PortId": "1",        "Active": true      },      {        "PortId": "2",        "Active": true      },      {        "PortId": "3",        "Active": true      },      {        "PortId": "4",        "Active": true      },      {        "PortId": "5",        "Active": true      },      {        "PortId": "6",        "Active": true      },      {        "PortId": "7",        "Active": true      },      {        "PortId": "8",        "Active": true      },      {        "PortId": "9",        "Active": true      },      {        "PortId": "10",        "Active": true      },      {        "PortId": "11",        "Active": true      },      {        "PortId": "12",        "Active": true      },      {        "PortId": "13",        "Active": true      },      {        "PortId": "14",        "Active": true      },      {        "PortId": "15",        "Active": true      }    ]  }}
```

```
HTTP/1.1 200 OKContent-Type: application/jsonContent-Length: 210{  "PortId":    [      "0",      "1",      "2",      "3",      "4",      "5",      "6",      "7",      "8",      "9",      "10",      "11",      "12",      "13",      "14",      "15"    ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPort>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>1</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>2</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>3</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>4</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>5</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>6</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>7</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>8</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>9</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>10</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>11</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>12</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>13</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>14</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>      <axgpio:Port>        <axgpio:PortId>15</axgpio:PortId>        <axgpio:Active>true</axgpio:Active>      </axgpio:Port>    </axgpio:SetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 2831Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPortResponse>      <axgpio:PortId>0</axgpio:PortId>      <axgpio:PortId>1</axgpio:PortId>      <axgpio:PortId>2</axgpio:PortId>      <axgpio:PortId>3</axgpio:PortId>      <axgpio:PortId>4</axgpio:PortId>      <axgpio:PortId>5</axgpio:PortId>      <axgpio:PortId>6</axgpio:PortId>      <axgpio:PortId>7</axgpio:PortId>      <axgpio:PortId>8</axgpio:PortId>      <axgpio:PortId>9</axgpio:PortId>      <axgpio:PortId>10</axgpio:PortId>      <axgpio:PortId>11</axgpio:PortId>      <axgpio:PortId>12</axgpio:PortId>      <axgpio:PortId>13</axgpio:PortId>      <axgpio:PortId>14</axgpio:PortId>      <axgpio:PortId>15</axgpio:PortId>    </axgpio:SetPortResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{  get_response = axgpio.GetPort(PortId = 0)  ports = get_response['Port']  port0 = ports[0]  if (port0.CurrentMode == "SupervisedInput" or port0.CurrentMode == "DigitalInput") {    nicename = port0.InputProperties.NiceName  } else {    nicename = port0.OutputProperties.NiceName  }}
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:SetPort":{    "Port": [    {      "PortId": "0",      "InputProperties": {        "NiceName": "A new nice name for input 0"      },      "OutputProperties": {        "NiceName": "A new nice name for output 0"      }    }]  }}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:SetPort>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:InputProperties>        <axgpio:NiceName>A new nice name for input 0</axgpio:NiceName>        </axgpio:InputProperties>        <axgpio:OutputProperties>        <axgpio:NiceName>A new nice name for output 0</axgpio:NiceName>        </axgpio:OutputProperties>      </axgpio:Port>    </axgpio:SetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event xmlns:tt="http://www.onvif.org/ver10/schema">        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:tnsaxis="http://www.axis.com/2009/event/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/tnsaxis:IO/SupervisedPort            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://621c7eac-a3ee-4372-9e44-98fac02827d5/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2016-02-29T04:28:26.976004Z" PropertyOperation="Initialized">                    <tt:Source>                        <tt:SimpleItem Name="port" Value="0" />                    </tt:Source>                    <tt:Key />                    <tt:Data>                        <tt:SimpleItem Name="state" Value="cut" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event xmlns:tt="http://www.onvif.org/ver10/schema">        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/Trigger/DigitalInput            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://621c7eac-a3ee-4372-9e44-98fac02827d5/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2016-02-29T04:28:26.976004Z" PropertyOperation="Initialized">                    <tt:Source>                        <tt:SimpleItem Name="InputToken" Value="1" />                    </tt:Source>                    <tt:Key />                    <tt:Data>                        <tt:SimpleItem Name="LogicalState" Value="0" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">    <tt:Event xmlns:tt="http://www.onvif.org/ver10/schema">        <wsnt:NotificationMessage            xmlns:tns1="http://www.onvif.org/ver10/topics"            xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2"            xmlns:wsa5="http://www.w3.org/2005/08/addressing">            <wsnt:Topic Dialect="http://docs.oasis-open.org/wsn/t-1/TopicExpression/Simple">                tns1:Device/Trigger/Relay            </wsnt:Topic>            <wsnt:ProducerReference>                <wsa5:Address>uri://621c7eac-a3ee-4372-9e44-98fac02827d5/ProducerReference</wsa5:Address>            </wsnt:ProducerReference>            <wsnt:Message>                <tt:Message UtcTime="2016-02-29T04:28:26.976004Z" PropertyOperation="Initialized">                    <tt:Source>                        <tt:SimpleItem Name="RelayToken" Value="1" />                    </tt:Source>                    <tt:Key />                    <tt:Data>                        <tt:SimpleItem Name="LogicalState" Value="active" />                    </tt:Data>                </tt:Message>            </wsnt:Message>        </wsnt:NotificationMessage>    </tt:Event></tt:MetadataStream>
```

```
POST /vapix/axgpio HTTP/1.1Host: root:pass@192.168.0.90Content-Type: application/json{  "axgpio:GetPort":{    "PortId":["0"]  }}
```

```
HTTP/1.1 200 OKContent-Length: 1413Content-Type: application/json{  "Port": [    {      "PortId": "0",      "SupportedModes": [        "DigitalInput",        "OpenCollectorOutput",        "SupervisedInput"      ],      "CurrentMode": "SupervisedInput",      "CurrentState": "cut",      "Active": false,      "InputProperties": {        "NiceName": "Input 1",        "ActiveState": "open"      },      "OutputProperties": {        "NiceName": "Output 1",        "ActiveState": "closed"      }      "SupervisedInput": {        "AnalogLevel": "2800",        "Triggers": [          {            "State": "shorted",            "LowerLimit": "0",            "UpperLimit": "100"          },          {            "State": "closed",            "LowerLimit": "500",            "UpperLimit": "1500"          },          {            "State": "open",            "LowerLimit": "1800",            "UpperLimit": "2200"          },          {            "State": "cut",            "LowerLimit": "2300",            "UpperLimit": "12000"          }        ],        "Capabilities": {          "MaxNumberOfRanges": 4,          "MinVoltageRange": 60,          "MinVoltageLevel": 0,          "MaxVoltageLevel": 12000        }      }    }  ]}
```

```
POST /vapix/services HTTP/1.1Host: root:pass@192.168.0.90Content-Type: text/xml<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:axgpio="http://www.axis.com/vapix/ws/AxisGPIO" xmlns="http://www.axis.com/vapix/ws/AxisGPIO">  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPort>      <axgpio:PortId>0</axgpio:PortId>    </axgpio:GetPort>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
HTTP/1.1 200 OKAuthentication-Info: rspauth="...", cnonce="...", nc=..., qop=authConnection: closeContent-Length: 3975Content-Type: application/soap+xml; charset=utf-8Server: gSOAP/2.7<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope ...>  <SOAP-ENV:Header></SOAP-ENV:Header>  <SOAP-ENV:Body>    <axgpio:GetPortResponse>      <axgpio:Port>        <axgpio:PortId>0</axgpio:PortId>        <axgpio:SupportedModes>DigitalInput</axgpio:SupportedModes>        <axgpio:SupportedModes>OpenCollectorOutput</axgpio:SupportedModes>        <axgpio:SupportedModes>SupervisedInput</axgpio:SupportedModes>        <axgpio:CurrentMode>SupervisedInput</axgpio:CurrentMode>        <axgpio:CurrentState>cut</axgpio:CurrentState>        <axgpio:Active>false</axgpio:Active>        <axgpio:InputProperties>          <axgpio:NiceName>Input 1</axgpio:NiceName>          <axgpio:ActiveState>open</axgpio:ActiveState>        </axgpio:InputProperties>        <axgpio:OutputProperties>          <axgpio:NiceName>Output 1</axgpio:NiceName>          <axgpio:ActiveState>closed</axgpio:ActiveState>        </axgpio:OutputProperties>        <axgpio:SupervisedInput>          <axgpio:AnalogLevel>2800</axgpio:AnalogLevel>          <axgpio:Triggers>            <axgpio:State>shorted</axgpio:State>            <axgpio:LowerLimit>0</axgpio:LowerLimit>            <axgpio:UpperLimit>100</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>closed</axgpio:State>            <axgpio:LowerLimit>500</axgpio:LowerLimit>            <axgpio:UpperLimit>1500</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>open</axgpio:State>            <axgpio:LowerLimit>1800</axgpio:LowerLimit>            <axgpio:UpperLimit>2200</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Triggers>            <axgpio:State>cut</axgpio:State>            <axgpio:LowerLimit>2300</axgpio:LowerLimit>            <axgpio:UpperLimit>12000</axgpio:UpperLimit>          </axgpio:Triggers>          <axgpio:Capabilities>            <axgpio:MaxNumberOfRanges>4</axgpio:MaxNumberOfRanges>            <axgpio:MinVoltageRange>60</axgpio:MinVoltageRange>            <axgpio:MinVoltageLevel>0</axgpio:MinVoltageLevel>            <axgpio:MaxVoltageLevel>12000</axgpio:MaxVoltageLevel>          </axgpio:Capabilities>        </axgpio:SupervisedInput>      </axgpio:Port>    </axgpio:GetPortResponse>  </SOAP-ENV:Body></SOAP-ENV:Envelope>
```

```
{}
```

```
{  "Capabilities": { ServiceCapabilities }}
```

```
{    "Limit": "<integer>",    "StartReference": "<string>"}
```

```
{  "NextStartReference": "<string>"  "Port": [{ Port }, ...]}
```

```
{  "PortId": ["<PortId>", ...]}
```

```
{  "Port": [{ Port }, ...]}
```

```
{  "Port": [{ Port }, ...]}
```

```
{  "PortId": ["<PortId>", ...]}
```

```
<tns1:Device aev:NiceName="Device">    <tnsaxis:IO aev:NiceName="Input ports">        <SupervisedPort wstop:topic="true" aev:NiceName="Supervised input port">            <aev:MessageInstance aev:isProperty="true">                <aev:SourceInstance>                    <aev:SimpleItemInstance aev:NiceName="Port" Type="xsd:int" Name="port">                        <aev:Value aev:NiceName="I/O 8">7</aev:Value>                        <aev:Value aev:NiceName="I/O 7">6</aev:Value>                        <aev:Value aev:NiceName="I/O 6">5</aev:Value>                        <aev:Value aev:NiceName="I/O 5">4</aev:Value>                        <aev:Value aev:NiceName="I/O 4">3</aev:Value>                        <aev:Value aev:NiceName="I/O 3">2</aev:Value>                        <aev:Value aev:NiceName="I/O 2">1</aev:Value>                        <aev:Value aev:NiceName="I/O 1">0</aev:Value>                    </aev:SimpleItemInstance>                </aev:SourceInstance>                <aev:DataInstance>                    <aev:SimpleItemInstance aev:NiceName="State" Type="xsd:string" Name="state" isPropertyState="true">                        <aev:Value>open</aev:Value>                        <aev:Value>closed</aev:Value>                        <aev:Value>cut</aev:Value>                        <aev:Value>shorted</aev:Value>                        <aev:Value>undefined</aev:Value>                    </aev:SimpleItemInstance>                </aev:DataInstance>            </aev:MessageInstance>        </SupervisedPort>    </tnsaxis:IO></tns1:Device>
```

```
http://myserver/axis-cgi/virtualinput/activate.cgi?schemaversion=1&port=10
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><VirtualInputResponse xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" SchemaVersion="1.1"  xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1  http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">  <Success>    <ActivateSuccess>      <StateChanged>        true      </StateChanged>    </ActivateSuccess>  </Success></VirtualInputResponse>
```

```
http://myserver/axis-cgi/virtualinput/deactivate.cgi?schemaversion=1&port=10
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><VirtualInputResponse xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" SchemaVersion="1.1"  xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1  http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">  <Success>    <DeactivateSuccess>      <StateChanged>        true      </StateChanged>    </DeactivateSuccess>  </Success></VirtualInputResponse>
```

```
http://myserver/axis-cgi/virtualinput/activate.cgi?schemaversion=1&port=3&duration=5
```

```
HTTP/1.0 200 OKContent-Type: text/xml<?xml version="1.0" encoding="utf-8"?><VirtualInputResponse xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" SchemaVersion="1.1"  xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1  http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">  <Success>    <ActivateSuccess>      <StateChanged>        true      </StateChanged>    </ActivateSuccess>  </Success></VirtualInputResponse>
```

```
http://<servername>/axis-cgi/virtualinput/activate.cgi?<schemaversion>=<value>&<port>=<value>&<duration>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><VirtualInputResponse    xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.1"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1 http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">    <Success>        <ActivateSuccess>            <StateChanged>[true/false]</StateChanged>        </ActivateSuccess>    </Success></VirtualInputResponse>
```

```
http://<servername>/axis-cgi/virtualinput/deactivate.cgi?<schemaversion>=<value>&<port>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><VirtualInputResponse    xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.1"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1 http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">    <Success>        <DeactivateSuccess>            <StateChanged>[true/false]</StateChanged>        </DeactivateSuccess>    </Success></VirtualInputResponse>
```

```
http://<servername>/axis-cgi/virtualinput/getschemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><VirtualInputResponse    xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.1"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1 http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">    <Success>        <GetSchemaVersionsSuccess>            <SchemaVersion>                <MajorVersion>[major]</MajorVersion>                <MinorVersion>[minor]</MinorVersion>                <Deprecated />            </SchemaVersion>            ...        </GetSchemaVersionsSuccess>    </Success></VirtualInputResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><VirtualInputResponse    xmlns="http://www.axis.com/vapix/http_cgi/virtualinput1"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    SchemaVersion="1.1"    xsi:schemaLocation="http://www.axis.com/vapix/http_cgi/virtualinput1 http://www.axis.com/vapix/http_cgi/virtualinput1_0.xsd">    <Error>        <GeneralError>            <ErrorCode>[error code]</ErrorCode>            <ErrorDescription>[description]</ErrorDescription>        </GeneralError>    </Error></VirtualInputResponse>
```

```
http://myserver/axis-cgi/io/virtualinput.cgi?action=6%3A%2F2000%5C
```

```
http://<servername>/axis-cgi/io/virtualinput.cgi?<argument>=<value>
```

- I/O port API. Digital input and output ports. See I/O port API.
- General purpose I/O service API. Extends I/O port API with support for supervised I/Os and relay connectors. See General purpose I/O service.
- Virtual input API. See Virtual input API.

- Property: Properties.API.HTTP.Version=3.
- AXIS OS: 5.00 and later
- Product category: Products with I/O connectors

- Parameter: IOPort.In.Configurable=yes

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: multipart/x-mixed-replace; boundary=ioboundary

- HTTP Code: 200 OK
- Content-Type: multipart/x-mixed-replace; boundary=ioboundary

- Security level: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: multipart/x-mixed-replace; boundary=<boundary>

- Name: tns1:Device/tnsaxis:IO/tnsaxis:Port
- Type: Stateful
- Nice name: Digital input port

- Nice name: Port
- Type: integer
- Name: port

- Nice name: Active
- Type: boolean
- Name: state
- isPropertyState: true

- Name: tns1:Device/tnsaxis:IO/tnsaxis:VirtualInput
- Type: Stateful
- Nice name: Virtual input

- Nice name: Input
- Type: integer
- Name: port

- Nice name: Active
- Type: boolean
- Name: active
- isPropertyState: true

- Name: tns1:Device/tnsaxis:IO/tnsaxis:VirtualPort
- Type: Stateful
- Nice name: Manual trigger

- Nice name: Channel
- Type: integer
- Name: port

- Nice name: Active
- Type: boolean
- Name: state
- isPropertyState: true

- Name: tns1:Device/tnsaxis:IO/tnsaxis:OutputPort
- Type: Stateful
- Nice name: Output

- fixed action — set the port state when action is triggered and return to the opposite state after the time defined by parameter duration
- unlimited action — set the port state when the action is triggered and return to the opposite state when event conditions are no longer fulfilled
- Action ID
com.axis.action.fixed.io.toggle
- Action ID
com.axis.action.unlimited.io.toggle

- Find available ports. Use GetPortList.
- Find information about specific ports. Use GetPort.
- Configure port settings and set ports as active or inactive. Use SetPort.
To simplify configuration, only the PortId field and the fields to be modified are required when configuring a port.

- tns1:Device/tnsaxis:IO/SupervisedPort. See Supervised port event.
- 
- tns1:Device/Trigger/DigitalInput. ONVIF property event for digital input port.
- tns1:Device/Trigger/Relay. ONVIF property event for relay ports. This event is also emitted for open-collector output ports.

- Property: Properties.API.GPIO.GPIO=yes
- Property: Properties.API.GPIO.Version=1.0 and later.

- open
- closed
- cut
- shorted

- tns1:Device/tnsaxis:IO/SupervisedPort. See Supervised port event.
- 
- tns1:Device/Trigger/DigitalInput. ONVIF property event for digital input port.
- tns1:Device/Trigger/Relay. ONVIF property event for relay ports. This event is also emitted for open-collector output ports.

- Command: axgpio:GetServiceCapabilities
- Access class: PRE_AUTH

- Base type: String. Maximum length: 64. Minimum length: 1

- Base type: String. Maximum length: 32. Minimum length: 1

- Base type: String. Maximum length: 32. Minimum length: 1

- Command: axgpio:GetPortList
- Access class: READ_SYSTEM_SENSITIVE

- Command: axgpio:GetPort
- Access class: READ_SYSTEM_SENSITIVE

- Command: axgpio:SetPort
- Access class: WRITE_SYSTEM

- Virtual input ports. Recommended for products with AXIS OS 5.50 and later. There are 32 ports that can be connected to different actions. See Virtual input ports.
Event tns1:Device/tnsaxis:IO/tnsaxis:VirtualInput
- Manual trigger. Use the manual trigger for products with older AXIS OS. Can be used to simulate I/O ports during testing or as manual trigger. See Manual trigger and I/O port simulation.
Event tns1:Device/tnsaxis:IO/tnsaxis:VirtualPort

- Set up an action rule in the Axis product. Use the virtual input event as start event or condition. See Event and action services.
- Configure the client to activate or deactivate the virtual input.

- Web services. See Virtual input events in VAPIX® Event and Action Services API.
- CGI. Described in this chapter.

- Property: Properties.VirtualInput.VirtualInput=yes
- AXIS OS: 5.50 and later

- Property: Properties.API.HTTP.Version=3
- AXIS OS: 5.00 and later
- Product category: Network cameras and video encoders

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

- Simulate activation and deactivation of the physical input ports. This is useful when testing the I/O port functionality but can also be used to trigger actions. For more information about the physical I/O ports, see I/O port API.
- Activate and deactivate the manual trigger. The manual trigger is available in most Axis network video products and can be used together with the event and action functionality to trigger actions in the product. The port number to use for the manual trigger depends on the product. Normally, port 6 or port 1 should be used.

- Security level: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

| Parameter | Default value | Valid values | Security level | Description |
| --- | --- | --- | --- | --- |
| Configurable | yes Product/release dependent. See the product’s release notes. | yes no | admin: read operator: read | The port is configurable or not. |
| Direction | input | input output | admin: read, write operator: read | The port is configured to act as input or output. Read-only for non-configurable ports. |
| Usage Product/release dependent. See the product’s release notes. | Product/release dependent. See the product’s release notes. | String | admin: read, write Product/release dependent. See the product’s release notes.operator: read | Tells the intended purpose of the port and can be used as a hint for applications to automatically handle a port in a specific way. Example of valid values are: Button, Door, REX and Tampering. This parameter is read-only for non-configurable ports. |
| Input.Name Supported by products with configurable output ports. | Port n+1 n is a non-negative integer. | String | admin: read, write operator: read | User-friendly name for the input. |
| Input.Trig Supported by products with configurable output ports. | closed | closed open | admin: read, write operator: read | Determines when to trig.closed=The input port triggers when the circuit is closed open=The input port triggers when the circuit is open. |
| Output.DelayTime | 1 | Integer | admin: read, write operator: read | The timeout period until the port returns to its idle state. The period is measured in seconds. |
| Output.Mode | bistable | monostable bistable | admin: read, write operator: read | Decides if the port should return to its previous, idle state (monostable) after using DelayTime, or remain (bistable). |
| Output.Name Supported by products with configurable input ports. | Port n+1 n is a non-negative integer. | String | admin: read, write operator: read | User-friendly name for the output. |
| Output.Active Supported by products with configurable input ports. | closed | closed open | admin: read, write operator: read | The active state of the output.closed=The output port is active when the circuit is closed open=The output port is active when the circuit is open. |
| Output.Button Supported by products with configurable input ports. | none | none pulse actinact | admin: read, write operator: read | The button type associated with this output. |
| Output.PulseTime Supported by products with configurable input ports. | 0 | Integer | admin: read, write operator: read | The pulsetime for the pulse button connected to this output, if any. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| NbrOfInputs | 0 Product-dependent. Check the product's specification. | Integer | admin: read operator: read viewer: read | Number of inputs. When the ports are configurable this parameter is updated automatically to match the number of configured inputs. This means that this number is not related to the physical number of inputs for configurable ports. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| NbrOfOutputs | 0 Product-dependent. Check the product's specification. | Integer | admin: read operator: read viewer: read | Number of outputs. When the ports are configurable this parameter is updated automatically to match the number of configured outputs. This means that this number is not related to the physical number of outputs for configurable ports. |

| Parameter | Default values | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| ManualTriggerNbr | 6 Product-dependent. See your products specifications for additional information. | Integer | admin: read operator: read viewer: read | The I/O number that the manual trigger port starts at. This is product dependent, but the default value is commonly 6 for product with up to 4 I/O ports. This is the number that should be used in virtualinput.cgi actions to generate a ManualTrigger event such as http://myserver/axis-cgi/io/virtualinput.cgi?action=6:/1000\. |

| Argument | Valid values | Description |
| --- | --- | --- |
| check=<int>[,<int>,...] | <Port ID 1>[<Port ID 2>,...] | Return the status (1 or 0) of one or more ports numbered <Port ID 1>, <Port ID 2>, ... 1 = Closed circuit. 0 = Open circuit. |
| checkactive=<int> [,<int>,...] | <Port ID 1>[,Port ID 2>,...] | Return the status (active or inactive) of one or more ports numbered <Port ID 1>, <Port ID 2>, ... This value depends on the parameters Output.Active for an output and Input.Trig for an input.If the port is an output and Output.Active is configured as closed, then this request will return active if the port state is closed. The same goes for an input port that has Input.Trig configured as closed. |
| checkdirection=<int> [,<int>,...] | <Port ID 1>[,<Port ID 2>,...] | Return the port direction (input or output) of one or more ports numbered <Port ID 1>, <Port ID 2>,... |
| monitor=<int>[,<int>,...] Outputs and inputs must be monitored separately. | <Port ID 1>[,Port ID 2>,...] | Return a multipart stream of "check" ports (see return description below). Input and output ports must be monitored separately. |
| action=<string> Valid for output ports only. | [<Port ID>]:<a>[<wait><a>...] | Activate or deactivate an output. Use the <wait> option to activate/deactivate the port for a limited period of time.<Port ID> = Port number. If omitted, output 1 is selected.<a> = Action character. /=active, \=inactive<wait> = Delay before the next action. Unit: millisecondsNote: The :, / and \ characters must be percent-encoded in the URI. See Percent encoding.Example: To set output 1 to active, use 1:/. In the URI, the action argument becomes action=1%3A%2F |

| Value | Nice name |
| --- | --- |
| -1 | Any |
| 0 | User-defined name (default Input 1) |
| 1 | User-defined name (default Input 2) |
| ... | ... |
| n | User-defined name (default Input n+1) |

| Value | Nice name |
| --- | --- |
| 1 | Input 1 |
| 2 | Input 2 |
| ... | ... |
| 32 | Input 32 |

| Value | Nice name |
| --- | --- |
| 1 | — |
| 2 | — |
| ... | — |
| number of channels/view areas | — |

| Parameter | Description | Valid values |
| --- | --- | --- |
| port | The output port. | An unsigned integer that matches one of the output ports on your device. |
| state | The new state of the output port. | high low |

| Parameter | Valid values | Description |
| --- | --- | --- |
| port | Unsigned integer | The I/O port number of the output port to activate. The I/O ports are numbered starting from zero. The I/O port number is the # of parameter IOPort.I#. |
| state | high low | State to set the port to. |
| duration | Unsigned integer | Fixed actions: Number of seconds before returning to the opposite state.Use duration = 0 if the port should remain in the set state. |

| Field | Type | Description |
| --- | --- | --- |
| MaxLimit | Integer | The maximum number of entries returned by the GetPortList and GetPort commands. |

| Data field | Valid values | Description |
| --- | --- | --- |
| Capabilities | ServiceCapabilities | The supported service capabilities. |

| PortModeEnum value | Description |
| --- | --- |
| DigitalInput | The port is a digital input. |
| SupervisedInput | The port is a supervised input. |
| OpenCollectorOutput | The port is an open collector output. |
| RelayOutput | The port is a relay output. |

| Field | Type | Description |
| --- | --- | --- |
| MaxNumberOfRanges | Integer | The maximum number of SupervisionRange data structures supported by the supervised input. |
| MinVoltageRange | String | The minimum voltage span that is viable to use with respect to noise and analog-to-digital-converter (ADC) resolution. Unit: mV |
| MinVoltageLevel | String | The minimum voltage that can be specified in a SupervisionRange data structure. Unit: mV |
| MaxVoltageLevel | String | The maximum voltage that can be specified in a SupervisionRange data structure. Unit: mV |

| PortStateEnum value | Description |
| --- | --- |
| open | The port is open. |
| closed | The port is closed. |
| shorted | The port is short-circuited. |
| cut | The port is floating (wires are cut or open-circuited). |
| undefined | The port state is undefined. |

| ActiveStateEnum value | Description |
| --- | --- |
| open | The port is active when open (floating). |
| closed | The port is active when closed (grounded). |

| Field | Type | Description |
| --- | --- | --- |
| NiceName | String | The port’s nice name. |
| ActiveState | String | Specifies when the port is active. |

| Field | Type | Description |
| --- | --- | --- |
| State | PortState | The supervised input’s state.The behavior of the State field might change in future releases. Axis recommends applications to assume that State could be any string. |
| LowerLimit | String | The lower voltage limit (inclusive). Unit: mV |
| UpperLimit | String | The upper voltage limit (exclusive). Unit: mV |

| Field | Type | Description |
| --- | --- | --- |
| Triggers | List of SupervisionRange | List of user-defined ranges for the supervised input. |
| Optional fields |  |  |
| AnalogLevel | Integer | Read-only. The current analog voltage at the input pin. Unit: mV |
| Capabilities | SupervisedInputCapabilities | Read-only. The supervised input’s capabilities. |

| Field | Type | Description |
| --- | --- | --- |
| PortId | PortId | Read-only. The port identifier. |
| Optional fields |  |  |
| SupportedModes | List of PortMode | Read-only. Supported port modes. |
| PortUsage | String | String describing the port usage. |
| CurrentMode | PortMode | The port’s current mode. |
| CurrentState | PortState | The port’s current state. Read-only. Use field Active to set the port to active or inactive. |
| Active | true, false | true = The port is active.false = The port is inactive. |
| InputProperties | Properties | The port’s input properties. |
| OutputProperties | Properties | The port’s output properties. |
| SupervisedInput | SupervisedInput | The configuration to use when the port is used as a supervised input. |

| Data field | Valid values | Description |
| --- | --- | --- |
| Limit | Integer | Optional. Maximum number of items to return in the response. |
| StartReference | String | Optional. Internal reference specifying the first item in the data set to return. Use the NextStartReference returned by the previous call. |

| Data field | Valid values | Description |
| --- | --- | --- |
| NextStartReference | String | Reference to use as StartReference in the next call.Returned if the response does not include all available Port items. |
| Port | List of Port | The returned Port items. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal ter:InvalidStartReference | StartReference is invalid or has timed out. |
| env:Sender ter:InvalidArgVal |  |

| Data field | Valid values | Description |
| --- | --- | --- |
| PortId | List of PortId | List of port identifiers. |

| Data field | Valid values | Description |
| --- | --- | --- |
| Port | List of Port | The returned Port items. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs ter:TooManyItems | Too many items were requested. |

| Data field | Valid values | Description |
| --- | --- | --- |
| Port | List of Port | List of Port items. |

| Data field | Valid values | Description |
| --- | --- | --- |
| PortId | List of PortId | The PortId identifiers of the Port items that were updated. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgs | The data in the request is missing. |
| env:Sender ter:InvalidArgVal ter:InvalidArgVal | The data in the request is invalid. |

| Argument | Description |
| --- | --- |
| schemaversion=<integer> | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| port=<integer> | Required. The virtual input to activate. The value may vary for different devices. Default value is 64. |
| duration=<integer> | Optional. Specifies the number of seconds until the port is automatically deactivated. If the port is already active, it will continue to be active and will be deactivated after the specified time. If the duration is set to 0, the port will be activated first and then deactivated directly. If it is not specified, the port will not be automatically deactivated. |

| Element | Description |
| --- | --- |
| VirtualInputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| ActivateSuccess | The virtual input was activated successfully. |
| StateChanged | true = The port state was changed.false = The port state was not changed. |

| Argument | Description |
| --- | --- |
| schemaversion=<integer> | Required. The major version of the XML Schema to use for the response. See XML schemas. |
| port=<integer> | Required. The virtual input to deactivate. The value may vary for different devices. Default value is 64. |

| Element | Description |
| --- | --- |
| VirtualInputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| DeactivateSuccess | The virtual input was deactivated successfully. |
| StateChanged | true = The port state was changed.false = The port state was not changed. |

| Element | Description |
| --- | --- |
| VirtualInputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Success | Successful request. |
| GetSchemaVersionsSuccess | Successful response from getschemaversions.cgi. |
| SchemaVersion | One version of the schema. Contains Major, Minor and Deprecated. |
| MajorVersion | The major version of the XML Schema. |
| MinorVersion | The minor version of the XML Schema. |
| Deprecated | If true, this version of the XML Schema is deprecated and should not be used. |

| Element | Description |
| --- | --- |
| --- | --- |
| VirtualInputResponse | Contains the response. For information about XML schema versions, see XML schemas. |
| Error | The request contains errors. |
| GeneralError | General error. |
| ErrorCode | A numeric error code. See table below. |
| ErrorDescription | Description of the error. |

| Error code | Description | CGI |
| --- | --- | --- |
| 10 | Missing argument. | activate.cgi deactivate.cgi |
| 20 | The specified virtual input does not exist. | activate.cgi deactivate.cgi |
| 30 | The specified schema version is not supported. | All |
| 40 | Internal server error. | All |
| 50 | Invalid duration. | activate.cgi |

| Argument | Valid values | Description |
| --- | --- | --- |
| action=<string> | [<Port ID>]:<a>[<wait><a>...] | Set port <Port ID> to active or inactive and, optionally, wait <wait> milliseconds before the next action.The port can be a physical I/O port or the manual trigger. Normally, port 6 or port 1 should be used for the manual trigger.<Port ID> = Port number. If omitted, input 1 is selected.<a> = Action character: / = active, \ = inactive.<wait> = Delay before the next action. Unit: milliseconds.Note: The :, / and \ characters must be percent-encoded in the URI. See Percent encoding.Example: To activate port 6, keep it active for 2 seconds and then deactivate the port, use 6:/2000\. In the URI, the action argument becomes action=6%3A%2F2000%5C |

