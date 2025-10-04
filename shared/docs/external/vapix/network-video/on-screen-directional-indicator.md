# On-screen directional indicator

**Source:** https://developer.axis.com/vapix/network-video/on-screen-directional-indicator/
**Last Updated:** Aug 18, 2025

---

# On-screen directional indicator

## Description​

### Model​

### Identification​

## Common examples​

### Define an OSDI zone​

## API specification​

### PTZ.Locator​

### PTZ.Locator.L#.Zone​

The On-screen directional indicator (OSDI) API makes it possible to set a user-defined name to a location or zone observed by a PTZ camera, e.g. names of buildings, streets or geographical directions. A zone is defined as a range of pan, tilt and zoom coordinates. This means that when the camera is positioned within these coordinates, it is also within the OSDI zone. By using the correct modifiers, the name of the zone can be displayed in the text overlay.

This API is parameter based and the zones are defined by creating parameter groups and setting their values. Deleting the parameter group will also remove its corresponding zones. A zone, in the context of this API, refers to an area between a pan and a tilt coordinate a 3 dimensional setting.

Use this example to identify which zone the camera is pointing at. This is prepared during the installation of the camera and dictates which zones the OSDI will be set to.

Detect if OSDI is supported

Check the number of supported OSDI zones for image source 1:

If the parameter exists and its value is greater than 0, the OSDI setup will be displayed.

Create a zone

Create an OSDI zone parameter group:

The following parameters showcases the OSDI zone capabilities and how to best utilize them.

The valid values for the index of image sources (L#) ranges from L0 to the number of image sources -1.

The methods explained in this group are used to configure the OSDI zone through parameter handling.

The valid values for the index of image sources (L#) ranges from L0 to the number of image sources -1. The valid values for the index of zones (Z#) ranges from Z0 to MaxZones -1.

For a description of valid ranges for Pan, Tilt and Zoom, see Pan/tilt/zoom API.

```
http://myserver/axis-cgi/param.cgi?action=list&group=root.PTZ.Locator.L0.MaxZones
```

```
http://myserver/axis-cgi/param.cgi?action=add&root.PTZ.Locator.L0.Zone.Z.Name=NewZone&root.PTZ.Locator.L0.Zone.Z.Pan=0.06%3A29.54&root.PTZ.Locator.L0.Zone.Z.Tilt=-44.99%3A-30.06&root.PTZ.Locator.L0.Zone.Z.Enabled=yes&group=root.PTZ.Locator.L0.Zone&template=ptzlocator
```

```
PTZ.Locator.L#.<parameter>
```

```
PTZ.Locator.L#.Zone.Z#.<parameter>
```

- Product category: PTZ cameras
- Parameter: PTZ.Locator.L#.MaxZones

- Security level to view the list: Viewer
- Security level to update the list: Operator or N/A

- Security level to view the list: Viewer
- Security level to update the list: Operator

| Parameter | Security level | Description |
| --- | --- | --- |
| MaxZones=<integer> | N/A | Read-only parameter that indicates the maximum number of Zone.Z# parameter groups supported. |

| Parameter | Description |
| --- | --- |
| Enabled=yes | no | Determines if the zone is currently used. |
| Name=<string> | Identifies the zone. |
| Pan=<float>:<float> | The pan coordinates, presented in degrees, for the zone. |
| Tilt<float>:<float> | The tilt coordinates, presented in degrees, for the zone. |
| Zoom=<unsigned integer>:<unsigned integer> | If set, this parameter will specify the zoom levels and when the zone should be considered active. If it is not set, the zoom level will not be taken into consideration for this zone. |

