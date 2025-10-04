# Open Casing and Faulty Front Window

**Source:** https://developer.axis.com/vapix/network-video/open-casing-faulty-front-window/
**Last Updated:** Aug 18, 2025

---

# Open Casing and Faulty Front Window

## Overview​

### Identification​

## Events​

### Open Casing event​

### Faulty Front Window event​

The VAPIX® Open Casing and Faulty Front Window API can be used on Axis devices that has the ability to detect if the casing or front window has been tampered with.

The API consist of two events, one that activates when the device casing is opened and another when the window is tampered with.

See Event and action services for a complete guide to events and to find out which ones that are supported by your device.

Open casing events can be accessed through VAPIX and ONVIF event web service API:s and are useful when you want to be notified if a device casing has been opened.

The declaration for an open casing event from the VAPIX API would look like this:

It is possible to subscribe to events from the VAPIX/ONVIF event streams. The format of streams and its elements are described in Schema and Topics.

In VAPIX, the stream can be retrieved over RTSP with the following URL:

Faulty front window events can be accessed through VAPIX and ONVIF event web service API:s and are useful when you want to be notified if a device window has been removed, vandalized or otherwise malfunctioned.

The declaration for a faulty front window event from the VAPIX API would look like this:

It is possible to subscribe to events from the VAPIX/ONVIF event streams. The format of streams and its elements are described in Schema and Topics.

In VAPIX, the stream can be retrieved over RTSP with the following URL:

```
<tns1:Device aev:NiceName="Device">    <tnsaxis:Casing aev:NiceName="Casing">        <Open wstop:topic="true" aev:NiceName="Casing Open">            <aev:MessageInstance aev:isProperty="true">                <aev:SourceInstance>                    <aev:SimpleItemInstance Type="xsd:string" Name="Name">                        <aev:Value>NetworkCamera</aev:Value>                    </aev:SimpleItemInstance>                </aev:SourceInstance>                <aev:DataInstance>                    <aev:SimpleItemInstance Type="xsd:boolean" Name="Open" isPropertyState="true"/>                </aev:DataInstance>            </aev:MessageInstance>        </Open>    </tnsaxis:Casing></tns1:Device>
```

```
rtsp://<servername>/axismedia/media.amp?event=on&eventtopic=tns1:Device/Casing
```

```
<tns1:Device aev:NiceName="Device">    <tnsaxis:Window aev:NiceName="Window">        <Faulty wstop:topic="true" aev:NiceName="Faulty Front Window">            <aev:MessageInstance aev:isProperty="true">                <aev:SourceInstance>                    <aev:SimpleItemInstance Type="xsd:string" Name="Name">                        <aev:Value>Housing</aev:Value>                    </aev:SimpleItemInstance>                </aev:SourceInstance>                <aev:DataInstance>                    <aev:SimpleItemInstance Type="xsd:boolean" Name="Faulty" isPropertyState="true"/>                </aev:DataInstance>            </aev:MessageInstance>        </Faulty>    </tnsaxis:Window></tns1:Device>
```

```
rtsp://<servername>/axismedia/media.amp?event=on&eventtopic=tns1:Device/Window
```

| Parameter | Description |
| --- | --- |
| Property=<Open> | The lid state value.  <Open>: An open casing has the value '1', while an inactive event has the value '0'. |
| Property=<Name> | The name of the affected device. Names can consist of a maximum of 32 characters.  <Name>: Potential names include JunctionBox for a junction box or NetworkCamera for a network camera. |

| Parameter | Description |
| --- | --- |
| Property=<Faulty> | The window state value.  <Faulty>: A malfunctioning window has the value '1', while an inactive event has the value '0'. |
| Property=<Name> | The name of the affected device. Names can consist of a maximum of 32 characters.  <Name>: Potential name includes Housing for a camera housing. |

