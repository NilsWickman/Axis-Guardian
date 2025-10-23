# Audio Multicast Controller

**Source:** https://developer.axis.com/vapix/audio-systems/audio-multicast-controller/
**Last Updated:** Aug 28, 2025

---

# Audio Multicast Controller

## API use cases​

### Toggle Audio Multicast Controller​

### Adjust the audio codec​

### Add a new multicast source​

### Delete a multicast source​

### List all sources​

### Prioritize a source​

## Parameter information​

### API objects​

### Data types​

## Source state event​

The VAPIX® Audio Multicast Controller API makes it possible to configure audio devices to activate multicast reception and prioritize between multicast sources from a list. This include internal audio sources such as SIP calls.

The audio source with the highest priority that is currently playing will be the audio coming out of the device. Sources with a lower priority will be silenced until they themselves become the highest active priority.

This API is atomic, which means that every property have a SET and GET command attached to it. These commands allows the user to interact with each individual property by itself, which is detailed in the use cases below.

This API is in BETA stage and provided for testing purposes. It is subject to backward-incompatible changes, including modifications to its functionality, behavior and availability. The API should not be used in production environments.

Use case scenarios can be a shopping mall or grocery store, where all speakers listen to the same multicast sources with identical priorities:

Emergencies

Announcements

Background music

This example will show you how to PATCH the feature of the value from audio-multicast-ctrl.v1beta.enabled to true or false.

Example

See API objects and Data types for additional API information.

This example will show you how to PATCH the audio codec expected from the multicast sources by using audio-multicast-ctrl.v1beta.audiocodec. Valid values are PCMA and PCMU.

Example

See API objects and Data types for additional API information.

This example will show you how to POST a new multicast source by adding a new instance to the audio-multicast-ctrl.v1beta.sources entity collection.

Only IPAddress, Label and Port are required. Remaining parameters will be set to a default value if they are not provided in the request. A unique ID will be generated and assigned to the source.

Example

See API objects and Data types for additional API information.

This example will show you how to DELETE a multicast source by deleting a new instance to the audio-multicast-ctrl.v1beta.sources entity collection by using the ID as the key.

Example

See API objects and Data types for additional API information.

This example will show you how to GET a list of all sources from the audio-multicast-ctrl.v1beta.sources entity collection. The code below shows all valid properties for each source type.

Example

See API objects and Data types for additional API information.

This example will show you how to PATCH the priority of a source with the value retrieved from audio-multicast-ctrl.v1beta.sources.ID.prio to any integer value where the ID part of source that should apply the new priority.

Setting the priority ensures that it keeps the integrity in the source list. This also applies when adding or removing a source. In this example, the list contains 3 sources with priority 1-3 and ID A-C.

A

B

C

Changing the priority of source A to 3 will adjust sources B and C to have priority 1 and 2 respectively. This means that the command will not only change the priority of one source, but will adjust all sources in the list accordingly. These 2 mechanics are also used when adding or removing a source to ensure that there are no duplicate priorities or gaps in the list.

Example

See API objects and Data types for additional API information.

ID

SRTPKey

Label

Priority

LatencyProfile

Port

AudioCodec

SourceType

IpAddress

This event is sent every time a source changes state. The data included in the event is the source ID as well as the new state of the source.

```
~~HTTP~~PATCH /config/rest/audio-multicast-ctrl/v1beta/enabled HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": true}~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
~~HTTP~~PATCH /config/rest/audio-multicast-ctrl/v1beta/audiocodec HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": "PCMU"}~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
~~HTTP~~POST /config/rest/audio-multicast-ctrl/v1beta/sources HTTP/1.1HOST: my-deviceContent-Type: application/json{  "data": {    "ipAddress": "239.0.0.1",    "label": "This is a label",    "port": 4000,    "prio": 1,    "profile": "Normal",    "srtpKey": "A hexadecimal string that is 60 or 92 characters long",    "type": "Multicast"  }}~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}}
```

```
~~HTTP~~DELETE /config/rest/audio-multicast-ctrl/v1beta/sources HTTP/1.1HOST: my-deviceContent-Type: application/json~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
~~HTTP~~GET /config/rest/audio-multicast-ctrl/v1beta/sources HTTP/1.1HOST: my-deviceContent-Type: application/json~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success",  "data": [    {      "id": "Unique ID",      "ipAddress": "239.0.0.1",      "label": "This is a label",      "port": 4000,      "prio": 1,      "profile": "Normal",      "type": "Multicast"    },    {      "id": "Unique ID",      "ipAddress": "239.0.0.1",      "label": "This is a different label",      "port": 4002,      "prio": 2,      "profile": "Low",      "type": "Multicast"    }  ]}
```

```
~~HTTP~~PATCH /config/rest/audio-multicast-ctrl/v1beta/sources/ID/prio HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": 1}~~HTTP REMOVE~~HTTP/1.1 200 OKContent-Type: application/json{  "status": "success"}
```

```
{    "description": "A unique ID.",    "maxLength": 63,    "type": "string"}
```

```
{    "description": "An SRTP key used for encrypted multicast sources.",    "maxLength": 127,    "type": "string"}
```

```
{    "description": "A string used to describe entities.",    "maxLength": 31,    "type": "string"}
```

```
{    "description": "The priority of the multicast source.",    "maximum": 13,    "minimum": 1,    "type": "string"}
```

```
{    "description": "The time delay between the audio input (in this case RTP packets received from the multicast source) and audio output (sound being played through the speaker). Different sources have different latency requirements.",    "enum": ["Normal", "Low", "UltraLow"],    "type": "string"}
```

```
{    "description": "The transport layer port.",    "maximum": 65534,    "minimum": 1024,    "type": "integer"}
```

```
{    "description": "The supported audio codecs.",    "enum": ["PCMU", "PCMA"],    "type": "string"}
```

```
{    "description": "Indicates the source type.",    "enum": ["Multicast", "Internal"],    "type": "string"}
```

```
{    "description": "The IPv4 address.",    "maxLength": 39,    "type": "string"}
```

```
<tnsaxis:AudioMulticastController>    <SourceState wstop:topic="true">        <aev:MessageInstance aev:isProperty="true">            <aev:SourceInstance>                <aev:SimpleItemInstance Type="xsd:string" Name="SrcID">                    <aev:Value>VAPIXAudio</aev:Value>                    <aev:Value>VAPIXMediaClip</aev:Value>                    <aev:Value>SIP</aev:Value>                    <aev:Value>Any created sources</aev:Value>                </aev:SimpleItemInstance>            </aev:SourceInstance>            <aev:DataInstance>                <aev:SimpleItemInstance isPropertyState="true" Type="xsd:string" Name="State" />            </aev:DataInstance>        </aev:MessageInstance>    </SourceState></tnsaxis:AudioMulticastController>
```

- Emergencies
- Announcements
- Background music

- A
- B
- C

| Object | Operations | Description |
| --- | --- | --- |
| audio-multicast-ctrl.v1beta (Entity) | Get | Configures the Audio Multicast Controller |
| audio-multicast-ctrl.v1beta.audioCodec (Property) | Get: roles["admin"] Set: roles["admin"] | Determines which audio codec that should be used. This setting will apply to all multicast sources. |
| audio-multicast-ctrl.v1beta.enabled (Property) | Get: roles["admin"] Set: roles["admin"] | Turns ON/OFF the Audio Multicast Controller. |
| audio-multicast-ctrl.v1beta.sources (Entity map) | Get Add: roles["admin"], optional-fields["srtpKey", "latencyProfile", "prio", "ipAddress", "port", "type"] required-fields["label"] Remove: roles["admin"] | A multicast source. Contains all sources except RTCP. |
| audio-multicast-ctrl.v1beta.sources.id (Property) | Get: roles["admin"] | A unique source ID generated by the backend. |
| audio-multicast-ctrl.v1beta.sources.ipAddress(Property) | Get: roles["admin"] Set: roles["admin"] | The multicast address to listen to. Valid values ranges between 224.0.0.0 - 239.255.255.255. |
| audio-multicast-ctrl.v1beta.sources.label (Property) | Get: roles["admin"] Set: roles["admin"] | The nicename of the source. |
| audio-multicast-ctrl.v1beta.sources.latencyProfile (Property) | Get: roles["admin"] Set: roles["admin"] | The time delay between an audio input (an RTP packet received from the multicast source) and audio output (sound played through the speaker). Different sources have different latency requirements. |
| audio-multicast-ctrl.v1beta.sources.port (Property) | Get: roles["admin"] Set: roles["admin"] | The device port from which the audio source originates. |
| audio-multicast-ctrl.v1beta.sources.prio (Property) | Get: roles["admin"] Set: roles["admin"] | Priority of the multicast source. |
| audio-multicast-ctrl.v1beta.sources.srtpKey (Property) | Get: roles["admin"] Set: roles["admin"] | The SRTP key for encrypted multicast sources. |
| audio-multicast-ctrl.v1beta.sources.type (Property) | Get: roles["admin"] Set: roles["admin"] | Indicates the source type. Internal: Used for built-in media sources such as SIP, VAPIXAudio and VAPIXMediaClip. These can not be modified or removed by the user apart from their priority rank. Multicast: Used for all user created sources. All properties apart from the unique ID can be modified. Thses sources can all be removed. |

