# Param API

**Source:** https://developer.axis.com/vapix/device-configuration/param-api/
**Last Updated:** Sep 10, 2025

---

# Param API

## Overview​

### Mapping parameters & parameter groups to properties and entities​

#### Parameters​

#### Groups​

#### Dynamic groups​

#### Dynamic and static groups​

## Use cases​

### Get parameters​

### Export parameters​

### Import parameters​

## API definition​

### Structure​

### Entities​

The VAPIX® Param API enables users to read, export, and import param.cgi parameters. It has a dynamic structure that is updated during runtime and is based on the param.cgi content. This document focuses on API usage and how the param.cgi parameters are mapped into the API.

This API is based on the Device Configuration API framework. For guidance on how to use these APIs, please refer to the Device Configuration APIs section in the VAPIX Library.

This API is in BETA stage. The API is provided for testing purposes and is subject to backward-incompatible changes, including modifications to functionality, behavior, and availability. Please don't use in production environment.

This API is dynamically structured at runtime and based on the param.cgi parameters. Changes to parameters, such as removal, addition, or modification of parameters or parameter groups, can be used to restructure the API.

Parameters in param.cgi map to string-type properties in the API structure, since all parameter values are strings in param.cgi.

The above example shows a parameter definition in param.cgi. The parameter Enabled maps to a string typed property with the same name. The securityLevel defines the operation types and access rights. Writable parameters are tagged as export/import properties. Below is the corresponding mapping.

A get request to the root entity will result in the following response sample:

Non-dynamic parameter groups map to singleton entities in the API structure. Non-dynamic groups have a single instance and contains sub-parameters and sub-groups. Sub-parameters map to sub-properties and sub-groups map to sub-entities. Dynamic groups are described further down in the next section. The following example shows the group root.Brand and its parameters:

The mapping of the above example would be like the following simplified API structure:

A get request to the root entity will result in the following response sample:

Dynamic groups have multiple instances that hold sub-parameters and sub-groups. They can be identified from the parameter path. The instances of dynamic groups are named with the capitalized initial group letter followed by a number. The following example shows the instances of the dynamic group IOPort and its sub-parameters and sub-groups:

Dynamic groups maps to entity collections in the API structure. The same name is used and followed by a Collection suffix. Sub-parameters and sub-groups are added to the entity collection. Additionally, a key property is added for instance identification. This key property is named groupId.
The mapping of the above example would be like the following simplified API structure:

A get request to the root entity results in the following response sample:

Some groups are dynamic and contains 'instances' with parameters and sub-groups. They can also be non-dynamic with parameters and sub-groups at the level of the group itself. The following example shows a case like this:

In this example the Audio group is both a dynamic and a non-dynamic group, and maps to the following simplified API structure:

A get request to the root entity will result in the following response sample:

Refer to this sample model when using the upcoming API use cases.

The get operation can be used to retrieve both a single parameter or a group with its parameters and sub-groups recursively. Only readable parameters are returned.

Example of retrieving a single parameter:

Group retrieval example:

Writable parameters are mapped as export/import properties. These properties are marked with export_import:true in the API definition and can be retrieved by performing an export request.

Data export example for the sample API:

Note that MaxListeners is missing from the exported data. This is because it does not have export_import: true, since it is not a writable parameter.

Use an import request to set properties tagged as import/export. The import request can handle multiple properties in one request. A common use case is to import all or some settings exported from a device to another device.

All given properties in the import request will be applied. Those that fail will be reported in the warning section of the response. Import type has no effect on this API, only the provided properties will be updated for both default and merge importType options.

Parameters belonging to dynamic groups are handled differently compared to param.cgi. The dynamic group instances must exist before they can be updated with param.cgi. This API automates this process and creates the dynamic groups before setting the values.

Import data example:

param.v2 {#param.v2}

Properties
This entity has no properties.

Actions
This entity has no actions.

```
/axis-cgi/admin/param.cgi?action=listdefinitions&group=root.HTTPS&listformat=xmlschema<group name="root">    <group name="HTTPS">        <parameter name="Enabled" value="yes" securityLevel="7706" niceName="Enabled">            <type>                <bool true="yes" false="no" />            </type>        </parameter>    </group></group>
```

```
Simplified sample from the API definition:root_entity:    entities:        HTTPS:            properties:                Enabled:                    data_type: string                    export_import: true                    operations:                        get:                            access_rights: ["viewer", "operator", "admin"]
```

```
{    "data": {        "HTTPS": {            "Enabled": "yes"        }    }}
```

```
/axis-cgi/admin/param.cgi?action=list&group=root.Brandroot.Brand.Brand=AXISroot.Brand.ProdFullName=AXIS P5655-E PTZ Dome Network Cameraroot.Brand.ProdNbr=P5655-Eroot.Brand.ProdShortName=AXIS P5655-Eroot.Brand.ProdType=PTZ Dome Network Cameraroot.Brand.ProdVariant=root.Brand.WebURL=http://www.axis.com
```

```
Simplified sample from the API model:root_entity:    entities:        Brand:            properties:                Brand: { ... }                ProdFullName: { ... }                ProdNbr: { ... }                ProdShortName: { ... }                ProdType: { ... }                ProdVariant: { ... }                WebURL: { ... }
```

```
{    "data": {        "Brand": {            "Brand": "AXIS",            "ProdFullName": "AXIS MyExampleDevice",            "ProdNbr": "ExampleDevice",            "ProdShortName": "Example",            "ProdType": "ExampleType",            "ProdVariant": "",            "WebURL": "http://www.axis.com"        }    }}
```

```
/axis-cgi/admin/param.cgi?action=list&group=root.IOPORTroot.IOPort.I0.Configurable=yesroot.IOPort.I0.Direction=inputroot.IOPort.I0.Usage=root.IOPort.I0.Input.Name=Port 1root.IOPort.I0.Input.Trig=closedroot.IOPort.I0.Output.Active=closedroot.IOPort.I0.Output.Button=noneroot.IOPort.I0.Output.DelayTime=0root.IOPort.I0.Output.Mode=bistableroot.IOPort.I0.Output.Name=Port 1root.IOPort.I0.Output.PulseTime=0root.IOPort.I1.Configurable=yesroot.IOPort.I1.Direction=inputroot.IOPort.I1.Usage=root.IOPort.I1.Input.Name=Port 2root.IOPort.I1.Input.Trig=closedroot.IOPort.I1.Output.Active=closedroot.IOPort.I1.Output.Button=noneroot.IOPort.I1.Output.DelayTime=0root.IOPort.I1.Output.Mode=bistableroot.IOPort.I1.Output.Name=Port 2root.IOPort.I1.Output.PulseTime=0
```

```
Simplified sample from the API model:root_entity:entities:    IOPortCollection:        collection: map        key_property: groupId        properties:            groupId:                data_type: string            Configurable: { ... }            Direction: { ... }            Usage: { ... }        entities:            Input:                properties:                    Name: { ... }                    Trig: { ... }            Output:                properties:                    Active: { ... }                    Button: { ... }                    DelayTime: { ... }                    Mode: { ... }                    Name: { ... }                    PulseTime: { ... }
```

```
{    "data": {        "IOPortCollection": [            {                "Configurable": "yes",                "Direction": "input",                "groupId": "I0",                "Input": {                    "Name": "Input 1",                    "Trig": "closed"                },                "Output": {                    "Active": "closed",                    "Button": "none",                    "DelayTime": "0",                    "Mode": "bistable",                    "Name": "Output 1",                    "PulseTime": "0"                },                "Usage": ""            },            {                "Configurable": "yes",                "Direction": "input",                "groupId": "I1",                "Input": {                    "Name": "Input 2",                    "Trig": "closed"                },                "Output": {                    "Active": "closed",                    "Button": "none",                    "DelayTime": "0",                    "Mode": "bistable",                    "Name": "Output 2",                    "PulseTime": "0"                },                "Usage": ""            }        ]    }}
```

```
/axis-cgi/admin/param.cgi?action=list&group=root.Audioroot.Audio.DSCP=0root.Audio.DuplexMode=fullroot.Audio.MaxListeners=20root.Audio.MaxTransmitters=1root.Audio.NbrOfConfigs=1root.Audio.ReceiverBuffer=120root.Audio.ReceiverTimeout=1000root.Audio.A0.Enabled=noroot.Audio.A0.HTTPMessageType=singlepartroot.Audio.A0.Name=root.Audio.A0.NbrOfChannels=1root.Audio.A0.Source=0
```

```
Simplified sample from the API model:root_entity:    entities:        AudioCollection:            collection: map            key_property: groupId            properties:                groupId:                    data_type: string                Enabled: { ... }                HTTPMessageType: { ... }                Name: { ... }                NbrOfChannels: { ... }                Source: { ... }        Audio:            properties:                DSCP: { ... }                DuplexMode: { ... }                MaxListeners: { ... }                MaxTransmitters: { ... }                NbrOfConfigs: { ... }                ReceiverBuffer: { ... }                ReceiverTimeout: { ... }
```

```
{    "data": {        "Audio": {            "DSCP": "0",            "DuplexMode": "full",            "MaxListeners": "20",            "MaxTransmitters": "1",            "NbrOfConfigs": "1",            "ReceiverBuffer": "120",            "ReceiverTimeout": "2500"        },        "AudioCollection": [            {                "groupId": "A0",                "Enabled": "no",                "HTTPMessageType": "singlepart",                "Name": "",                "NbrOfChannels": "1",                "Source": "0"            }        ]    }}
```

```
root_entity:    entities:        AudioCollection:            collection: map            key_property: groupId            properties:                groupId:                    data_type: string                    export_import: true                    operations:                        get:                            access_rights: ["viewer", "admin"]                Enabled:                    data_type: string                    export_import: true                    operations:                        get:                            access_rights: ["viewer", "admin"]    Audio:        properties:            DSCP:                data_type: string                export_import: true                operations:                    get:                        access_rights: ["viewer", "admin"]            MaxListeners:                data_type: string                operations:                    get:                        access_rights: ["viewer", "admin"]
```

```
{    "request": {        "operation": "GET",        "path": "param.v2.Audio.MaxListeners"    },    "response": {        "status": "success",        "data": "5"    }}
```

```
{    "request": {        "operation": "GET",        "path": "param.v2.Audio"    },    "response": {        "status": "success",        "data": {            "DSCP": 0,            "MaxListeners": "5"        }    }}
```

```
GET /config/rest/param/v2beta/$export HTTP/1.1HOST: my-deviceContent-Type: application/json
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success",    "data": {        "Audio": {            "DSCP": 0        },        "AudioCollection": [            {                "groupId": "0",                "Enabled": "yes"            }        ]    }}
```

```
PATCH /config/rest/param/v2beta/$import HTTP/1.1HOST: my-deviceContent-Type: application/json{    "data": {        "Audio": {            "DSCP": 0        },        "AudioCollection": [            {                "groupId": "0",                "Enabled": "no"            },            {                "groupId": "1",                "Enabled": "yes"            }        ]    }}
```

```
HTTP/1.1 200 OKContent-Type: application/json{    "status": "success"}
```

```
param.v2 (Root Entity)
```

- Description: Root entity containing param.cgi parameters.
- Type: Singleton
- Operations

Get
- Get
- Attributes

Dynamic Support: No
- Dynamic Support: No

- Get

- Dynamic Support: No

