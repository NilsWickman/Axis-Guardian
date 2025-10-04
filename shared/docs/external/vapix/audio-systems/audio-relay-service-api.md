# Audio relay service API

**Source:** https://developer.axis.com/vapix/audio-systems/audio-relay-service-api/
**Last Updated:** Aug 21, 2025

---

# Audio relay service API

## Description​

### Identification​

### Terminology and abbreviations​

## Common examples​

### Simple cURL examples​

### Add audio peer​

### Remove audio peer​

### Rename audio peer and change its output gain​

### Setup audio relay network using multicast​

### Change multicast settings in existing audio relay network​

### Adjust the master volume​

### Monitor audio relay peers status​

## API specification​

### Common data types​

#### AudioPeerId​

#### Enumeration: AudioPeerConnectionStatus​

## Service capabilities​

## Audio relay network configuration​

## Audio relay network monitoring​

## Audio relay network sound configuration​

The Audio Relay service provides configuration mechanisms for connecting audio peers to each other. An audio relay network can be altered by adding and removing audio peers. Status monitoring of the audio peers is provided.

An audio relay network is based on one audio peer being a leader, and the rest of the peers being followers. The audio content intended for the audio relay network shall be provided by the leader, which will stream the audio content to its followers.

The Audio Relay service also provides sound configuration, for adjusting the master volume of an audio relay network. The audio peers' output gain is also provided via the audio peer configuration. The master volume applies to all peers in the audio relay network, while output gain is separate for each audio peer.

Please note that this API has been deprecated as of AXIS OS version 10.12 and will no longer receive any updates.

Audio Relay Service API is available if:

This section will show common use cases for this service. General concepts are discussed, and details are provided in the detailed specification.

Most examples use pseudocode to illustrate the intended flow of requests to the Audio Relay service and data will be shown in JavaScript Object Notation (JSON).

API calls can be encoded in either JSON format or in a key-value format referred to as "simple", which flattens out a structure to key=value strings, where each level in a structure is separated by underscore ('_') when encoding the key.

Boolean values are encoded as true or false, and the NULL value is encoded as null.

String values are URL-encoded and may start and end with quotation marks, e.g. "a+string%0A".

Character sets are not converted or validated by the service, but UTF-8 is recommended.

The below shows examples of how to set and get audio peers via cURL. The set operation shows the possibility of using both IP address and MAC address to identify the peers. The example also illustrates how a list of elements will be represented.

cURL JSON request for SetAudioPeerConfigurations

cURL simple request for SetAudioPeerConfigurations

cURL JSON request for GetAudioPeers

cURL simple Request for GetAudioPeers

Use axar:SetAudioPeerConfiguration to add a new audio peer to the existing audio relay network. The example shows how to add a new follower called "lobby speaker left" with IP. The audio peer may be retrieved by axar:GetDiscoveredPeers prior to adding it.

Request to add audio peer using JSON format

Response

Request to add audio peer using simple format

Response

The AudioPeerId in the response is generated in this example. It may be set by the client by providing it in the request. The difference between axar:SetAudioPeerConfiguration and axar:SetAudioPeers is that the latter would reset the current audio relay network and set the configuration as provided in the parameters.

Use axar:RemoveAudioPeer to remove an audio peer from the audio relay network.

Request to remove audio peer using JSON format

Response

Request to remove audio peer using simple format

Response

Use axar:SetAudioPeerConfiguration to modify an audio peer. This example shows how two values are changed at the same time.

Current audio peer configuration

Request to modify audio peer using JSON format

Response

Request to modify audio peer using simple format

Response

Use axar:SetAudioPeers to setup a new audio relay network. This also gives the opportunity to configure usage of multicast stream instead of unicast between the peers. This example show how to set up multicast with two peers and the device to generate the multicast group.

Request to set audio peers using JSON format

Response

Request to set audio peers using simple format

Response

The generated multicast group can be retrieved via axar:GetAudioPeers.

Use axar:SetAudioNetworkConfiguration to setup a uni- or multicast stream in the audio relay network. The call to the leader comes with the ability to change the setting without the need of re-transmitting all existing peers.

If the multicast group isn’t specified, the one that is generated will be returned upon a successful request.

Request to enable multicast using the JSON format

Response

Request to enable multicast using a simple format

Response

Use axar:SetSoundConfiguration to adjust the master volume of the audio relay network, i.e the common volume level for all audio peers. Prior to setting the master volume, its boundaries should be retrieved by calling axar:GetServiceCapabilities.

Request to modify sound configuration using JSON format

Response

Request to modify sound configuration using simple format

Response

Use axar:GetAudioPeerStatus to monitor the audio relay network. This example will show the status of each follower and their connection status to the leader, where the leader is AudioPeer_01.

Request to retrieve audio peer status using JSON format

Response

Request to retrieve audio peer status using simple format

Response

Non-normative enum of connection status. This may be extended in the future.

The following values are available:

The GetServices call can be used to retrieve the capabilities of the service, to handle future extensions.

Range

Describes a range of valid values and the unit. The following fields are available:

ServiceCapabilities

The structure of ServiceCapabilities reflects the optional functionality of a service. The information is static and does not change during device operation. The following capabilities are available:

GetServiceCapabilities command

This operation returns the capabilities of the service.

Request

The request is empty.

Response

AudioPeerCredentials

The credentials for accessing an audio peer at the time of setup. The following fields are available:

AudioPeerAddress

The address of an audio peer. The following fields are available and each is optional:

Gain definition

A definition for the gain controls of a device.

The following fields are available:

AudioPeerMetaData

Metadata information for an audio peer.

The following fields are available:

Gain

A gain control for a device.

The following fields are available:

AudioPeerConfiguration

The configuration of a peer in the audio relay network.

the IP address or the MAC address is used to identify a peer. If the MAC address is given, it will be matched against discovered peers. The IP Address will be ignored if the MAC address is found via discovery, and a discovered IP address takes precedence over any current IP address.

If only the IP address is given (MAC is left empty), then a connection to this specific IP address will be used. Once a connection is established, the MAC address will be known and used in the configuration.

Credentials must be supplied when setting the audio peer configurations, if the devices are not accessible using default credentials. The supplied credential password will never be returned to a client upon a GetAudioPeers-call.

The following fields are available:

The following fields are optional:

AudioPeer

The Audio peer information of a peer in the audio relay network.

The following fields are available:

DiscoveredAudioPeer

The audio peer information as discovered on the current network.

The following fields are available:

AudioNetworkConfiguration

The configuration of parameters affecting the audio relay network as an entity.

The following fields are available but optional:

SetAudioPeerConfigurations command

Requests that a list of audio peers shall be set as the Audio Relay network.

The list of audio peer configurations must not contain more than one peer set as leader. The list must also always contain the address of the device that receives this request. The request will fail if these rules are violated.

This call replaces all of the existing AudioPeerConfigurations on the receiving device with the content of the Configuration parameter.

The optional parameter AudioNetworkConfiguration contain two members. MulticastEnabled may be set to true or false in order to enable/disable multicast support for the audio network. If this parameter is not set, unicast will be used. MulticastGroup may be set to a desired multicast group. If the parameter is not set, a default multicast group will be used.

Request

Response

SetAudioPeerConfiguration command

Requests that an audio peer be added or modified in the Audio Relay network.

The new AudioPeerConfiguration must not modify the Audio Relay network so that it would have more or less than one peer set as the leader.

The new AudioPeerConfiguration may have the ID field set or empty. If not set, or set to a non-existing ID, the call will be considered an 'add operation' of a new AudioPeerConfiguration. If set to an existing ID, the call will be considered to be a modify operation for an existing AudioPeerConfiguration.

Request

Response

GetAudioPeers command

Returns the current Audio Relay network configuration of the device that receives this request.

AudioPeerIds that cannot be resolved will be ignored and an empty set may be returned if there are no audio peers matching specified IDs.

If no AudioPeerId is supplied, a list of all audio peers will be returned.

Request

Response

GetDiscoveredAudioPeers command

Returns the Audio Relay peers discovered by the device that receives this request. The returned list is a snapshot and Audio Relay peers may both be added and removed in subsequent requests.

Request

The request is empty.

Response

RemoveAudioPeer command

Removes an audio peer from the audio relay network. The ID must be for an audio peer other than the recipient of this request.

Request

Response

The response is empty.

SetAudioNetworkConfiguration command

Modifies the audio network configuration for the Audio Relay Network.

The configuration for multicasting two parameters. MulticastEnabled may be set to "true" or "false" in order to enable/disable multicast support for the audio network, and if not set, unicast will be used. MulticastGroup may be set to a desired multicast group and if not set, a default multicast group will be generated.

Request

Response

AudioPeerStatus

The Audio Peer status. The following fields are available:

GetAudioPeerStatus command

Returns the current status of the link between the leader and its followers in the configured Audio Peer network. It is the leader that tracks the status.

AudioPeerIds that cannot be resolved will be ignored and an empty set may be returned if there are no audio peers matching specified IDs.

If no AudioPeerIds are supplied, a list of all audio peers will be returned.

Request

Response

SoundConfiguration

The configuration of parameters affecting the sound in the audio relay network.

Valid parameter values may be defined by the service capabilities.

The following fields are available, and all are optional:

SetSoundConfiguration command

Requests that a SoundConfiguration should be set on all the peers in the AudioPeerConfiguration.

All members of the SoundConfiguration are optional, thus a SoundConfiguration with all members empty will be accepted, but will change nothing.

Request

Response

The response is empty.

GetSoundConfiguration command

Returns the SoundConfiguration of an Audio Relay network.

Request

The request is empty.

Response

```
$ curl --anyauth -s "http://root:pass@192.168.0.90/vapix/audiorelay" \   -d '{"axar:SetAudioPeerConfigurations": {"Configuration": [      {"Id":"1",       "Address": {"IPAddress":"192.168.0.90"},       "Leader":true},      {"Id":"2",       "Address": {"MAC": "00:40:8C:18:00:01"},       "Leader":false} ]}}'> {>   "AudioPeerId":>     [>       "1",>       "2">     ]> }
```

```
$ curl --anyauth -s "http://root:pass@192.168.0.90/vapix/audiorelay? ...  format=simple&action=axar:SetAudioPeerConfigurations& ...  Configuration_0_Id=1&Configuration_0_Address_IPAddress=192.168.0.1&Configuration_0_Leader=true& ...  Configuration_1_Id=2&Configuration_1_Address_MAC=00:40:8C:18:00:00&Configuration_1_Leader=false"> AudioPeerId_0="1"> AudioPeerId_1="2"
```

```
$ curl --anyauth -s "http://root:pass@192.168.0.90/vapix/audiorelay" -d '{"axar:GetAudioPeers":{}}'> {>   "Peer":>     [>       {>         "Configuration": {>           "Id": "1",>           "Address": {>             "IPAddress": "192.168.0.90",>             "MAC": "00:40:8C:18:00:00">           },>           "Leader": true,>           "Credentials": {>             "User": "root",>             "Password": null>           },>           "OutputGain":>             [>               {>                 "Name": "AudioSource.A0.OutputGain",>                 "Value": "0">               }>             ]>         },>         "MetaData": {>           "Type": "C2005">         },>         "ConnectionStatus": "Online",>         "OutputGainDefinitions":>           [>             {>               "Name": "AudioSource.A0.OutputGain",>               "Range":>                 [>                   "Mute",>                   "-57",>                   ... ,>                   "6">                 ]>             }>           ]>       },>       {>         "Configuration": {>           "Id": "2",>           "Address": {>             "IPAddress": "192.168.0.91",>             "MAC": "00:40:8C:18:00:01">           },>           "Leader": false,>           "Credentials": {>             "User": "root",>             "Password": null>           },>           "OutputGain":>             [>               {>                 "Name": "AudioSource.A0.OutputGain",>                 "Value": "0">               }>             ]>         },>         "MetaData": {>           "Type": "C1004-E">         },>         "ConnectionStatus": "Online",>         "OutputGainDefinitions":>           [>             {>               "Name": "AudioSource.A0.OutputGain",>               "Range":>                 [>                   "Mute",>                   "-57",>                   ... ,>                   "6">                 ]>             }>           ]>       }>     ]> }
```

```
$ curl --anyauth -s "http://root:pass@192.168.0.90/vapix/audiorelay? ...  format=simple&action=axar:GetAudioPeers"> Peer_0_Configuration_Id="2"> Peer_0_Configuration_Address_IPAddress="192.168.0.91"> Peer_0_Configuration_Address_MAC="00:40:8C:18:00:01"> Peer_0_Configuration_Leader=false> Peer_0_Configuration_Credentials_User="root"> Peer_0_Configuration_Credentials_Password=null> Peer_0_Configuration_OutputGain_0_Name="AudioSource.A0.OutputGain"> Peer_0_Configuration_OutputGain_0_Value="0"> Peer_0_MetaData_Type="C1004-E"> Peer_0_ConnectionStatus="Online"> Peer_0_OutputGainDefinitions_0_Name="AudioSource.A0.OutputGain"> Peer_0_OutputGainDefinitions_0_Range_0="Mute"> Peer_0_OutputGainDefinitions_0_Range_1="-57"> ...> Peer_0_OutputGainDefinitions_0_Range_64="6"> Peer_1_Configuration_Id="1"> Peer_1_Configuration_Address_IPAddress="192.168.0.90"> Peer_1_Configuration_Address_MAC="00:40:8C:18:00:00"> Peer_1_Configuration_Leader=true> Peer_1_Configuration_Credentials_User="root"> Peer_1_Configuration_Credentials_Password=null> Peer_1_Configuration_OutputGain_0_Name="AudioSource.A0.OutputGain"> Peer_1_Configuration_OutputGain_0_Value="0"> Peer_1_MetaData_Type="C2005"> Peer_1_ConnectionStatus="Online"> Peer_1_OutputGainDefinitions_0_Name="AudioSource.A0.OutputGain"> Peer_1_OutputGainDefinitions_0_Range_0="Mute"> Peer_1_OutputGainDefinitions_0_Range_1="-57"> ...> Peer_1_OutputGainDefinitions_0_Range_64="6"
```

```
{    "axar:SetAudioPeerConfiguration": {        "Configuration": {            "Name": "lobby speaker left",            "Address": {                "IPAddress": "192.168.0.92"            }        }    }}
```

```
{    "AudioPeerId": "AudioPeer_03"}
```

```
format=simple&action=axar:SetAudioPeerConfiguration& ...Configuration_Name=lobby%20speaker%20left&Configuration_Address_IPAddress=192.168.0.92
```

```
AudioPeerId="AudioPeer_03"
```

```
{    "axar:RemoveAudioPeer": {        "AudioPeerId": "AudioPeer_03"    }}
```

```
{}
```

```
format=simple&action=axar:RemoveAudioPeer&AudioPeerId=AudioPeer03
```

```

```

```
{    "Configuration": {        "Id": "AudioPeer_01",        "Name": "SpeakerX",        "Address": {            "IPAddress": "192.168.0.90",            "MAC": "00:40:8C:18:00:00"        },        "Leader": true,        "Credentials": {            "User": "root",            "Password": null        },        "OutputGain": [            {                "Name": "AudioSource.A0.OutputGain",                "Value": "0"            }        ]    }}
```

```
{    "axar:SetAudioPeerConfiguration": {        "Configuration": {            "Id": "AudioPeer_01",            "Name": "lobby speaker left",            "OutputGain": [                {                    "Name": "AudioSource.A0.OutputGain",                    "Value": "-6"                }            ],            "Address": {}        }    }}
```

```
{    "AudioPeerId": "AudioPeer_01"}
```

```
format=simple&action=axar:SetAudioPeerConfiguration& ...Configuration_Id=AudioPeer_01&Configuration_Name=lobby%20speaker%20left& ...Configuration_OutputGain_0_Name=AudioSource.A0.OutputGain& ...Configuration_OutputGain_0_Value=-6
```

```
AudioPeerId="AudioPeer_01"
```

```
{    "axar:SetAudioPeerConfigurations": {        "Configuration": [            {                "Id": "1",                "Address": {                    "IPAddress": "192.168.0.90"                },                "Leader": true            },            {                "Id": "2",                "Address": {                    "IPAddress": "192.168.0.91"                }            }        ],        "AudioNetworkConfiguration": {            "MulticastEnabled": true        }    }}
```

```
{    "AudioPeerId": ["1", "2"]}
```

```
format=simple&action=axar:SetAudioPeerConfigurations& ...  Configuration_0_Id=1&Configuration_0_Address_IPAddress=192.168.0.90&Configuration_0_Leader=true& ...  Configuration_1_Id=2&Configuration_0_Address_IPAddress=192.168.0.91& ...  AudioNetworkConfiguration_MulticastEnabled=true"
```

```
AudioPeerId_0="1"AudioPeerId_1="2"
```

```
{    "axar:SetAudioNetworkConfiguration": {        "AudioNetworkConfiguration": {            "MulticastEnabled": true        }    }}
```

```
{    "MulticastGroup": "239.168.0.90"}
```

```
format=simple&action=axar:"SetAudioNetworkConfiguration&AudioNetworkConfiguration_MulticastEnabled=true"
```

```
"MulticastGroup": "239.168.0.90"
```

```
{    "axar:SetSoundConfiguration": {        "Configuration": {            "MasterVolume": 0,            "MasterVolumeUnit": "dB"        }    }}
```

```
{}
```

```
format=simple&action=axar:SetSoundConfiguration& ...Configuration_MasterVolume=0&Configuration_MasterVolumeUnit="dB"
```

```

```

```
{    "axar:GetAudioPeerStatus": {}}
```

```
{    "PeerStatus": [        {            "Id": "AudioPeer_02",            "ConnectionStatus": "Offline"        },        {            "Id": "AudioPeer_01",            "ConnectionStatus": "Online"        }    ]}
```

```
format=simple&action=axar:GetAudioPeerStatus
```

```
PeerStatus_0_Id="AudioPeer_02"PeerStatus_0_ConnectionStatus="Offline"PeerStatus_1_Id="AudioPeer_01"PeerStatus_1_ConnectionStatus="Online"
```

```
{}
```

```
{  "Capabilities": {    <ServiceCapabilities>  }}
```

```
{  "Configuration": [{    "AudioPeerConfiguration"  },  ...  ]}
```

```
{    "AudioPeerId": "<AudioPeerId>"}
```

```
{  "Configuration": {    <AudioPeerConfiguration>  }}
```

```
{    "AudioPeerId": "<AudioPeerId>"}
```

```
{  "AudioPeerId": [    "<AudioPeerId>",  ...  ]}
```

```
{  "Peer": [    {      "AudioPeer"    },    ...  ]}
```

```
{}
```

```
{  "Peer": [    {      "DiscoveredAudioPeer"    },    ...  ]}
```

```
{    "AudioPeerId": "<AudioPeerId>"}
```

```
{}
```

```
{  "AudioNetworkConfiguration": {    <AudioNetworkConfiguration>  }}
```

```
{  "MulticastGroup": "<string>" (optional)}
```

```
{  "AudioPeerId": [    "<AudioPeerId>",    ...  ]}
```

```
{  "PeerStatus": [{    "AudioPeerStatus"  },  ...  ]}
```

```
{  "Configuration": {    <SoundConfiguration>  }}
```

```
{}
```

```
{}
```

```
{  "Configuration": {    <SoundConfiguration>  }}
```

- Property: Properties.API.AudioRelay.Version="1.2" or later.

| Term | Description |
| --- | --- |
| Non-normative Enum | Enum whose values are used as strings to enable future extensions. |

| Parameter | Type | Valid values | Description |
| --- | --- | --- | --- |
| AudioPeerId | String | minLength=0 maxLength=64 | Identifier of an Audio peer. |

| Common Data Types | Description |
| --- | --- |
| Initiating | Initial state. |
| Offline | Cannot establish a connection to Audio Peer. |
| Online | Connection established to Audio Peer. |
| AuthenticationFailed | Cannot connect due to invalid credentials. |
| InOtherPeerNetwork | Audio Peer already allocated to other Audio Peer Network. |

| Field | Type | Description |
| --- | --- | --- |
| Unit | String | The unit of the value (e.g. dB). |
| MaxValue | int | The maximum value of the range. |
| MinValue | int | The minimum value of the range. |

| Field | Type | Description |
| --- | --- | --- |
| MasterVolumeRanges | Range | Master volume ranges as supported by this service. |

| Parameter | Description |
| --- | --- |
| Capabilities | The capability response message contains the requested AudioRelay service capabilities. |

| Field | Type | Description |
| --- | --- | --- |
| User | String | The user account name. |
| Password | String | The un-encrypted password. |

| Field | Type | Description |
| --- | --- | --- |
| IPAddress | String | The IP address. |
| MAC | String | The MAC address in the form 00:00:00:00:00:00. |

| Field | Type | Description |
| --- | --- | --- |
| Name | String | The name of the gain to set e.g. AudioSource.A0.OutputGain |
| Range | String | The valid gain values, as retrieved from axis-cgi/param.cgi with action=listdefinitions. |

| Field | Type | Description |
| --- | --- | --- |
| Type | String | The product type. |

| Field | Type | Description |
| --- | --- | --- |
| Name | String | The name of the gain to set e.g. AudioSource.A0.OutputGain |
| Value | String | The gain value. Must be valid according to the gain definition range. |

| Field | Type | Description |
| --- | --- | --- |
| Address | AudioPeerAddress | The audio peer network address. |
| OutPutGain | Gain | Optional output gain for the audio peer as described via its parameters retrieved by axis-cgi/param.cgi. |

| Field | Type | Description |
| --- | --- | --- |
| Id | AudioPeerId | The audio peer id is a unique identifier for an audio peer within an audio peer network. It is generated by the device if empty or missing. |
| Name | String | A descriptive name for the audio peer. |
| Leader | Boolean | Set if this peer is the leader. Recognized as false if not provided at creation, and as unchanged when modifying an existing configuration. |
| Credentials | AudioPeerCredentials | Optional credential information. If not available, default credentials will be assumed. |

| Field | Type | Description |
| --- | --- | --- |
| Configuration | AudioPeerConfiguration | The audio peer configuration. |
| MetaData | AudioPeerMetaData | The audio peer metadata information. |
| ConnectionStatus | String | The status as described by axar:AudioPeerConnectionStatus. |
| OutputGainDefinitions | GainDefinition | The gain definitions. |

| Field | Type | Description |
| --- | --- | --- |
| Address | AudioPeerAddress | The audio peer network address. |
| MetaData | AudioPeetMetaData | Metadata information of the audio peer. |

| Field | Type | Description |
| --- | --- | --- |
| Name | String | A descriptive name for the audio relay network. |
| Description | String | A description of the audio relay network. |
| MulticastEnabled | Boolean | Specifies if unicast or multicast shall be used. |
| MulticastGroup | String | Multicast group address. |

| Parameter | Description |
| --- | --- |
| Configuration | AudioPeerConfiguration(s) to set. |

| Parameter | Description |
| --- | --- |
| AudioPeerId | The IDs of the items provided. |

| Parameter | Description |
| --- | --- |
| Configuration | AudioPeerConfiguration(s) to set. |

| Parameter | Description |
| --- | --- |
| AudioPeerId | The IDs of the items provided. |

| Parameter | Description |
| --- | --- |
| AudioPeerId | IDs of the audio peers to get. |

| Parameter | Description |
| --- | --- |
| Peer | The peers of the Audio Relay network. |

| Parameter | Description |
| --- | --- |
| Peer | The discovered Audio Relay peers. |

| Parameter | Description |
| --- | --- |
| AudioPeerId | Id of audio peer to remove. |

| Fault codes | Description |
| --- | --- |
| env:Sender ter:InvalidArgVal | Supplied ID is invalid (invalid values). |

| Parameter | Description |
| --- | --- |
| AudioNetworkConfiguration | AudioNetworkConfiguration is set. |

| Parameter | Description |
| --- | --- |
| MulticastGroup | Multicast group address if enabled. |

| Field | Type | Description |
| --- | --- | --- |
| Id | AudioPeerId | The Audio Peer Id. |
| ConnectionStatus | String | The status as described by axar:AudioPeerConnectionStatus. |

| Parameter | Description |
| --- | --- |
| AudioPeerId | IDs of audio peers to get. |

| Parameter | Description |
| --- | --- |
| PeerStatus | The status of the Audio Relay peers. |

| Field | Type | Description |
| --- | --- | --- |
| MasterVolume | int | The master volume of the Audio Relay network. |
| MasterVolumeUnit | String | The unit of the master volume. Optional parameter to use if not default unit type is used. |
| MasterVolumeMute | Boolean | Mutes the master volume of the Audio Relay Network. |

| Parameter | Description |
| --- | --- |
| Configuration | The SoundConfiguration to set. |

| Parameter | Description |
| --- | --- |
| Configuration | The returned SoundConfiguration. |

