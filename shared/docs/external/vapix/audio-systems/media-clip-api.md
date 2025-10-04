# Media clip API

**Source:** https://developer.axis.com/vapix/audio-systems/media-clip-api/
**Last Updated:** Aug 28, 2025

---

# Media clip API

## Description​

## Prerequisites​

### Identification​

### Dependencies​

## Common examples​

## Parameters​

### Max number of media clips​

### Media clip parameters​

### AudioClip properties parameters​

## API specifications​

### Manage media clips​

### Play media clips​

### Stop media clips​

### API responses​

## Footnotes​

The Media clip API gives applications and users the ability to play media clips controlled from the user interface or external applications. The supported media type is audio.

The API supports the following functionality:

The API consists of two CGIs; mediaclip.cgi that allows operators to manage media clips and playclip.cgi that allows viewers to play media clips. A media clip is an audio clip that is stored in the camera and could be played with the camera's speaker.

The following audio clip formats are supported:

The parameter Properties.AudioClip.Format specifies audio formats available on the Axis product.

Further capabilities may be specified in the Properties.AudioClip parameter group, see AudioClip properties parameters.

The parameters (see Parameters) are managed through the parameter management CGI param.cgi. This function is device specific, which means that transmit.cgi might not be used while playing a media clip.

Please note that this API no longer support the option to record media clips. Instead, see Edge Storage API for information and examples on how to make recordings with your device.

Play a media clip

Audio clips can be played by using one of the following methods:

Play clip 0 (MediaClip.M0).

Play clip 0 (MediaClip.M0) at audiodeviceid 0 and audiooutputid 0.

Remove a media clip

Remove clip 2 (MediaClip.M2).

List all media clips

List the current media clips on the Axis product.

Request:

The request will result in a list of all current media clips on the Axis product.

Response:

Stop a media clip

Stop any currently playing audio clips.

Request

MediaClip

These parameters define the media clip. There is one group for each media clip. See Manage media clips for how to create a new media clip.

Template: mediaclip

Access control – Create

admin, operator

Access control – Delete

admin, operator

MediaClip.M#

The # in Clip MediaClip.M# identifies the media clip and is replaced by an integer starting from 0, e.g. Clip MediaClip.M0.

The parameters in the Properties.AudioClip group identify the audio clip capabilities supported by the Axis product. If the parameter does not exist in the product, then default support applies as shown in the table below.

Properties.AudioClip

Request mediaclip.cgi

The mediaclip.cgi is used to play, upload, remove, update and download media clips. Depending on the selected action, different additional arguments are supported.

Syntax:

With the following arguments and values:

For action=upload the POST method must be used; the file content is provided in the HTTP body. Audio files should be uploaded using Multipart/Form-Data as defined in RFC 1867.

Body:

Response

Success for all actions except download

If the request was successful, the Axis product returns:

Return

Body:

Success for action=download

For a successful download, the Axis product returns the requested media file. An audio file is returned.

Return

Body:

Request playclip.cgi

Viewers can play media clips using the playclip.cgi.

Syntax:

With the following arguments and values:

Using stopclip.cgi makes it possible to stop any currently playing media clip.

Syntax:

Successful responses for all actions except download

All actions except action=download returns the Content-Type text/plain containing OK and a description.

Body

Response for action=download

The action action=download returns the Content-Type audio/basic containing the audio in the .au file format.

Body

Failure - Bad request

Body

Product/release-dependent. Check the product’s release notes. ↩

```
http://<servername>/axis-cgi/mediaclip.cgi?action=play&clip=0
```

```
http://<servername>/axis-cgi/mediaclip.cgi?action=play&clip=0&audiodeviceid=0&audiooutputid=0
```

```
http://<servername>/axis-cgi/mediaclip.cgi?action=remove&clip=2
```

```
http://<servername>/axis-cgi/param.cgi?action=list&group=MediaClip
```

```
root.MediaClip.M0.Name=My new cliproot.MediaClip.M0.Location=/etc/audioclips/MediaClip.M0.auroot.MediaClip.M0.Type=audioroot.MediaClip.M1.Name=My new clip1root.MediaClip.M1.Location=/etc/audioclips/MediaClip.M1.auroot.MediaClip.M1.Type=audioroot.MediaClip.M2.Name=My new clip2root.MediaClip.M2.Location=/etc/audioclips/MediaClip.M2.auroot.MediaClip.M2.Type=audio
```

```
http://<servername>/axis-cgi/mediaclip.cgi?action=stop
```

```
http://<servername>/axis-cgi/mediaclip.cgi?<argument>=<value>[&<argument>=<value>...]
```

```
POST /axis-cgi/mediaclip.cgi?action=upload HTTP/1.0Content-Type: multipart/form-data; boundary=<boundary>Content-Length: <content length>--<boundary>Content-Disposition: form-data; name="<name>";filename="<file name>"Content-Type: audio/basic<file content>--<boundary>
```

```
OKplaying=<clip> | removed=<clip> | uploaded=<clip> | updated=<clip> | stopping
```

```
<audio data in .au file format>
```

```
http://<servername>/axis-cgi/playclip.cgi?<argument>=<value>
```

```
http://<servername>/axis-cgi/stopclip.cgi
```

```
OKplaying=<clip> | removed=<clip> | uploaded=<clip> | updated=<clip> | stopping
```

```
audio data in .au file format
```

```
400 Bad Request<message>
```

- Play and stop a media clip.
- Upload a media clip to the Axis product.
- Download a media clip from the Axis product (for backup or editing purposes).

- au format, with audio encoded in µ-law or PCM.
- wav format, with audio encoded in µ-law, mp3 or PCM .
- mp3 format.
- opus format
- vorbis format (e.g. Ogg Vorbis)

- Property: Properties.API.HTTP.Version=3
- Property: Properties.Audio.Audio=yes
- Property: Properties.Audio.Source.A#.Output=yes

- AXIS OS: 5.40 and later
- Product category: For playing, an audio output is required (speaker or line out).

- Template: mediaclip
- Access control – Create
admin, operator
- Access control – Delete
admin, operator

- Access control: admin, operator
- Method: POST for action=upload, GET for all other actions

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: audio/basic

- Access control: admin, operator, viewer
- Method: GET

- Access control: viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/plain

- HTTP Code: 200 OK
- Content-Type: audio/basic

- HTTP Code: 400 Bad Request
- Content-Type: text/plain

- Product/release-dependent. Check the product’s release notes. ↩

| Parameter | Default value | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| MaxGroups | 10(1) | 1... | admin: read operator: read viewer: read | Maximum number of media clips. Read-only. |
| MaxUploadSize |  | 1... | admin: read operator: read viewer: read | Maximum supported upload size for a media clip, measured in megabytes. If this parameter is missing, the maximum upload size is 1.5 MB. |

| Parameter | Default value | Valid values | Access control | Description |
| --- | --- | --- | --- | --- |
| Name | Clip MediaClip.M# | A string. | admin: read, write operator: read, write viewer: read | Descriptive name for the media clip. |
| Location | /etc/audioclips/MediaClip.M#.au | A local file path. | admin: read, write operator: read, write viewer: read Please note that this parameter can’t be edited with param.cgi. | Location of the clip. The local file path in the Axis product file system. |
| Type | audio | audio | admin: read, write operator: read, write viewer: read Please note that this parameter can’t be edited with param.cgi. | Media type. |

| Parameter | Valid values | Default support (if parameter does not exist in the product) | Access Control | Description |
| --- | --- | --- | --- | --- |
| PlayOptions | A comma-seperated list containing any combination of "repeat", "volume", "location", "audiodeviceid" or "audiooutputid". | "" (PlayOptions not supported) | Read: viewer, operator, admin | Specifies which optional arguments that are supported for play clips |
| StopClip | "yes", "no" | no (StopClip not supported) | Read: viewer, operator, admin | Specifies if stopclip.cgi is supported |
| Format | A comma-seperated list containing any of the audio formats "au", "wav", "opus", "vorbis" and "mp3". | "au,wav,mp3" | Read: viewer, operator, admin | Specifies supported file formats. |

| Argument | Values | Description |
| --- | --- | --- |
| action=<action> | play stop upload remove update download | play = Play a clip stop = Stops the current clip upload = Add a new clip by uploading an audio file remove = Remove a clip update = Change the name of a clip download = Send a clip to the client |
| clip=<int> | 0...<n> | The media clip the action applies to. Supported by action=play, update, remove and download. <n> = The value of the MaxGroups parameter. |
| audiooutput=<int> Optional | 1... (#index + 1 where Properties.Audio.Source.A[index].Output = "yes"#) | NoteThis parameter has been deprecated as of AXIS OS 11.7 and will no longer receive any updates. Please use audiodeviceid and audiooutputid instead. Parameter that determines what audio output that should play medicalips (action=play). |
| media=<string> | audio | Type of media when applicable. Required for action=upload. |
| name=<string> | Name of clip | Name of the media clip. Supported by update and upload. |
| repeat=<int> | -1,0... | Number of times to repeat the clip, where -1 means repeat forever. 0 (default) means play once (no repeat). Supported by action=play. Supported only if PlayOptions include repeat |
| volume=<int> | 0...1000 | The clip volume in percentage and linear volume scale. 0 means mute. Default is 100. Supported by action=play. Only supported if PlayOptions include volume. |
| location=<uri> | <uri> | Location of the clip. When using the location parameter for the play action, the clip parameter is not necessary. Accepts * as wildcard to play a random matching clip. Supported by action=play. Supported only if PlayOptions include location. |
| audiodeviceid=<int> Optional | 0, ... | Parameter that determines what audio device that should play a media clip. Used as an alternative to audiooutput and they can not be used together. Needs to be paired with audiooutputid (audiodeviceid=0&audiooutputid=0). |
| audiooutputid=<int> Optional | 0, ... | Parameter that determines which output on an audio device that should play a media clip. Required when audiodeviceid is specified. |

| Argument | Valid values | Description |
| --- | --- | --- |
| clip=<int> | 0...<n> | Specifies the media clip to be played. <n> = The value of the MaxGroups parameter. |
| audiooutput=<int> Optional | 1... (#index + 1 where Properties.Audio.Source.A[index].Output = "yes"#) | NoteThis parameter has been deprecated as of AXIS OS 11.7 and will no longer receive any updates. Please use audiodeviceid and audiooutputid instead. Parameter that determines what audio output that should play medicalips (action=play). |
| repeat=<int> | -1,0... | Number of times to repeat the clip, where -1 means repeat forever. 0 (default) means play once (no repeat). Supported only if PlayOptions include repeat |
| volume=<int> | 0...1000 | The clip volume in percentage and linear volume scale. 0 means mute. Default is 100. Supported only if PlayOptions include volume. |
| location=<string> | <location> | Location of the clip. When using the location parameter for the play action, the clip parameter is not necessary. Accepts * as wildcard to play a random matching clip. Supported only if PlayOptions include location. |
| audiodeviceid=<int> Optional | 0, ... | Parameter that determines what audio device that should play a media clip. Used as an alternative to audiooutput and they can not be used together. Needs to be paired with audiooutputid (audiodeviceid=0&audiooutputid=0). |
| audiooutputid=<int> Optional | 0, ... | Parameter that determines which output on an audio device that should play a media clip. Required when audiodeviceid is specified. |

