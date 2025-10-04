# Recording group

**Source:** https://developer.axis.com/vapix/network-video/recording-group/
**Last Updated:** Aug 28, 2025

---

# Recording group

## Description​

### Identification​

## Common examples​

### Get supported versions​

### Use a similar retention time for a group of recordings​

## API specifications​

### schemaversions.cgi​

### create.cgi​

### update.cgi​

### delete.cgi​

### list.cgi​

### General error codes​

The Recording group API makes it possible to create, update, delete and retrieve information about recording groups.

A recording group contains, but are not limited to, a set of continuous recording data as well as a unique identifier, description and information about its storage and retention time.

The recording groups reside on a storage they are connected to, which means that if the storage is removed, so is the recording group until the storage is re-attached. This also means that if the storage is attached to another device the groups will be made available on that device instead. This means that several groups can exist simultaneously and when the empty space becomes too low on the storage that the recording group data resides on, data will be removed. All recordings that are connected to a recording group will still appear as normal recording in the system though.

See Recording group video action template for more information on how to record video and audio with the groups detailed in this API.

Use this example to retrieve a list of API versions that are supported by your device.

API references

schemaversions.cgi

Use this example to control the retention time of the recording originating from different sources.

Use the recordinggroupid returned in the previous step to create an action configuration to make all recordings have a set retention time.

This retention time can be changed, which will affect all existing and future recordings belonging to the group.

API references

schemaversions.cgi

create.cgi

This API method is used when you want to retrieve a list of supported versions to check their status and whether they have been deprecated or not.

Request

Return value - Success

Response body syntax

Return value - Error

Response body syntax

See General error codes for a full list of potential errors.

This API method is used when you want to create a new recording group. An error will be returned if you reach the maximum number of allowed recording groups.

Request

Return value - Success

Response body syntax

Return value - Error

Response body syntax

See General error codes for a full list of potential errors.

This API method is used when you want to update a recording group. If the stream options are updated during an ongoing recording the recording group will be restarted.

Request

Return value - Success

Response body syntax

Return value - Error

Response body syntax

See General error codes for a full list of potential errors.

This API method is used when you want to delete a recording group along with all of its recordings. Only recording groups without any recording actions configured to them can be removed with this method, otherwise, an error will be returned.

Request

Return value - Success

Response body syntax

Return value - Error

Response body syntax

See General error codes for a full list of potential errors.

This API method is used when you want to retrieve list information for one or all recording groups.

Request

Return value - Success

Response body syntax

Return value - Error

Response body syntax

See General error codes for a full list of potential errors.

```
http://<servername>/axis-cgi/record/recording_group/schemaversions.cgi
```

```
http://<servername>/axis-cgi/record/recording_group/schemaversions.cgi
```

```
http://<servername>/axis-cgi/record/recording_group/create.cgi?schemaversion=1&retentiontime=168&diskid=SD_DISK&streamoptions=resolution%3D1920x1080%26device%3DAABBCCDDEE
```

```
http://<servername>/axis-cgi/record/recording_group/update.cgi?schemaversion=1&recordinggroupid=id&retentiontime=336
```

```
http://<servername>/axis-cgi/record/recording_group/schemaversions.cgi
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <SchemaVersionsSuccess>        <SchemaVersion>            <VersionNumber>[major1].[minor1]</VersionNumber>            <Deprecated>[deprecated]</Deprecated>        </SchemaVersion>    </SchemaVersionsSuccess></RecordingGroupResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralError>        <ErrorCode>[code]</ErrorCode>        <ErrorDescription>[Description]</ErrorDescription>    </GeneralError></RecordingGroupResponse>
```

```
http://<servername>/axis-cgi/record/recording_group/create.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <CreateSuccess RecordingGroupId="[recording group id]" /></RecordingGroupResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralError>        <ErrorCode>[code]</ErrorCode>        <ErrorDescription>[Description]</ErrorDescription>    </GeneralError></RecordingGroupResponse>
```

```
http://<servername>/axis-cgi/record/recording_group/update.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralSuccess /></RecordingGroupResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralError>        <ErrorCode>[code]</ErrorCode>        <ErrorDescription>[Description]</ErrorDescription>    </GeneralError></RecordingGroupResponse>
```

```
http://<servername>/axis-cgi/record/recording_group/delete.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralSuccess /></RecordingGroupResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralError>        <ErrorCode>[code]</ErrorCode>        <ErrorDescription>[Description]</ErrorDescription>    </GeneralError></RecordingGroupResponse>
```

```
http://<servername>/axis-cgi/record/recording_group/list.cgi?<argument>=<value>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <ListSuccess>        <RecordingGroup            RecordingGroupId="[recording group id]"            NiceName="[nice name]"            Description="[description]"            RetentionTime="[retention time]"            DiskId="[disk id]"            StreamOptions="[options]"            PreDuration="[duration]"            PostDuration="[duration]" />    </ListSuccess></RecordingGroupResponse>
```

```
<?xml version="1.0" encoding="utf-8" ?><RecordingGroupResponse    schemaversion="1.0"    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"    xsi:noNameSpaceSchemaLocation="http://www.axis.com/vapix/http_cgi/recording_group.xsd">    <GeneralError>        <ErrorCode>[code]</ErrorCode>        <ErrorDescription>[Description]</ErrorDescription>    </GeneralError></RecordingGroupResponse>
```

- API Discovery: id=recording-group

- Get a list of supported API versions.

- Parse the JSON response.

- Retrieve a supported version of the API.

- Parse the JSON response and create a recording group with a specified retention time:

- Use the recordinggroupid returned in the previous step to create an action configuration to make all recordings have a set retention time.
- This retention time can be changed, which will affect all existing and future recordings belonging to the group.

- Security level: Viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Security level: Operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Security level: Operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Security level: Operator
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

- Security level: Viewer
- Method: GET

- HTTP Code: 200 OK
- Content-Type: text/xml

- HTTP Code: 200 OK
- Content-Type: text/xml

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| SchemaVersionsSuccess | Whether the request was successful or not. |
| SchemaVersion | Contains one schema version. |
| VersionNumber | The schema version, presented in the format major.minor, i.e. [1.0 or 1.1]. |
| Deprecated | If true, this version of the XML Schema has been deprecated and should not be used. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| GeneralError | Contains all necessary error information. |
| ErrorCode | The error code. |
| ErrorDescription | Describes the error. |

| Parameter | Description |
| --- | --- |
| schemaversion=<integer> | Specifies the major XML schema that should be used. |
| recordinggroupid=<string> | Specifies the id of the recording group If the parameter is not provided, the id will be generated. Valid characters are (a-z, A-Z, 0–9, _, -) and the maximum length is 50 characters (optional). |
| description=<string> | Description of the recording group. |
| nicename=<string> | A user friendly name of the recording group. |
| retentiontime=<integer> | Sets the maximum number of hours that recordings in this group will be stored. Using zero (0) means unlimited. |
| diskid=<string> | The name of the storage that should be used. You will not be able change the name after creation. |
| streamoptions=<string> | The stream options that should be used when recording in the group. |
| preduration=<integer> | Pre-trigger time, set in millisecond, specifying the time that should be included from immediately before a recording is started in the group. |
| postduration=<integer> | Post-trigger time, set in milliseconds, specifying the time that should be included from immediately after a recording is stopped in the group. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| CreateSuccess | Will appear in successful creations. |
| RecordingGroupId | The name of the created recording group. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| GeneralError | Contains all necessary error information. |
| ErrorCode | The error code. |
| ErrorDescription | Describes the error. |

| Parameter | Description |
| --- | --- |
| schemaversion=<integer> | Specifies the major XML schema that should be used. |
| recordinggroupid=<string> | The recording group ID that should be updated. |
| description=<string> | Description of the recording group. |
| nicename=<string> | A user friendly name of the recording group. |
| retentiontime=<integer> | Sets the maximum number of hours that recordings in this group will be stored. Using zero (0) means unlimited. |
| streamoptions=<string> | The stream options that should be used when recording in the group. |
| preduration=<integer> | Pre-trigger time, set in millisecond, specifying the time that should be included from immediately before a recording is started in the group. |
| postduration=<integer> | Post-trigger time, set in milliseconds, specifying the time that should be included from immediately after a recording is stopped in the group. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| CreateSuccess | Will appear in successful creations. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| GeneralError | Contains all necessary error information. |
| ErrorCode | The error code. |
| ErrorDescription | Describes the error. |

| Parameter | Description |
| --- | --- |
| schemaversion=<integer> | Specifies the major XML schema that should be used. |
| recordinggroupid=<string> | The recording group ID that should be deleted. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| CreateSuccess | Will appear in successful creations. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| GeneralError | Contains all necessary error information. |
| ErrorCode | The error code. |
| ErrorDescription | Describes the error. |

| Parameter | Description |
| --- | --- |
| schemaversion=<integer> | Specifies the major XML schema that should be used. |
| recordinggroupid=<string> | The recording group ID that should be listed. All available recording groups will be listed unless otherwise specified. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| ListSuccess | Will appear in successful creations. |
| RecordingGroup | Container for one recording group. |
| RecordingGroupId | The name of the created recording group. |
| NiceName | The user friendly name of the recording group. |
| Description | A description of the recording group. |
| RetentionTime | The maximum number of hours that a recording will be saved. A zero means indefinite. |
| DiskId | The storage used for recordings in a specified recording group. |
| StreamOptions | The stream options that should be used for a specified recording group. |
| PreDuration | The pre-trigger time that should be included before starting a recording, measured in milliseconds. |
| PostDuration | The post-trigger time that should be included after stopping a recording, measured in milliseconds. |

| Parameter | Description |
| --- | --- |
| RecordingGroupResponse | Response container. |
| GeneralError | Contains all necessary error information. |
| ErrorCode | The error code. |
| ErrorDescription | Describes the error. |

| Code | Description |
| --- | --- |
| 10 | An error occurred while processing the request. |
| 20 | Invalid request. |
| 40 | Specified version not supported. |
| 110 | Recording group not found. |
| 120 | Max number of recording groups reached. |
| 130 | Invalid stream options. |
| 140 | Recording group in use. |

