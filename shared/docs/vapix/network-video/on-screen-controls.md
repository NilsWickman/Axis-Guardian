# On-screen controls

**Source:** https://developer.axis.com/vapix/network-video/on-screen-controls/
**Last Updated:** Aug 18, 2025

---

# On-screen controls

## Description​

### Model​

### Prerequisites​

## Common examples​

### Languages​

### Features​

#### Get a list of features that support the English language​

#### Get a list of features that support the Swedish language​

#### Get features for a specific channel​

### Add features​

### List added features​

### Remove features​

### Get all features​

#### Get a collection of all feature descriptions​

#### Get a collection of all feature descriptions including disabled features​

### Get supported versions​

### Enable and disable features​

#### Enable features​

#### Disable features​

### Use a feature that accepts audio data​

## API specification​

### OnscreenControls CGI​

### Languages​

### Features​

### addFeatures​

### listAddedFeatures​

### removeFeatures​

### getAllFeatures​

### getSupportedVersions​

### enableFeature​

### disableFeature​

### Error codes​

## Parameters​

### Description of fields in featureGroups structure​

### Description of fields in feature structures​

### Description of fields in requestURL response structures​

The AXIS On-screen controls API makes it possible for the user to receive information about various features of the camera. This information is available via a CGI, with the various methods described in the table below:

The On-screen Controls CGI methods

The Api consists of a CGI which should be called using the HTTP/HTTPS Post method, and with JSON formatted data as input. The CGI includes a number of methods which gives the user the ability to:

An API call includes the requested method along with any required input parameters.

Application Identification

Use this example to check if feature descriptions can be displayed in a certain language.

JSON input parameters

Successful response

API reference

See Languages for further instructions.

Use this example to access and list the camera’s unique features, all of which supports the English language.

JSON input parameters

API reference

See Features for further instructions.

Use this example to list features that supports the locale language "Svenska" (sv-sv). If there are no feature descriptions (default or added by user) available in Swedish, the response will contain an error. This means that the requested language should be one of the languages given in the response of Languages. If a feature is lacking a description in the requested language, the default (en-us) version for that feature will be included in the response.

JSON input parameters

Response to a request with an unsupported locale

API reference

See Features for further instructions.

Use this example to see the features for the currently active video channel.

JSON input parameters

API reference

See Features for further instructions.

Use this example to add a new feature in the form of an application, intended to be used with the Video Management Software (VMS).

Add new features

JSON input parameters

API reference

See addFeatures for further instructions.

Use this example to list manually added features and their supported languages.

List manually installed features

JSON input parameters

API reference

See listAddedFeatures for further instructions.

Use this example to remove features from previously installed applications.

Remove manually installed features

JSON input parameters

API reference

See section removeFeatures for further instructions.

Use this example to get all available descriptions in the supported languages with one CGI request.

JSON input parameters

Successful response

Error response

API references

See section getAllFeatures for further instructions.

JSON input parameters

Successful response

Error response

API references

See section getAllFeatures for further instructions.

Use this example to check if the API version are supported before the application uses them.

JSON input parameters

Successful response

Error response

API reference

See section getSupportedVersions for further instructions.

Use this example when you are implementing an application that uses On-screen controls and you want to use a method that can show or hide a feature from a user without having to remove it. The disabled feature does not appear in the response from a feature request.

JSON input parameters

Successful response

Error response

API references

See enableFeature for further instructions.

JSON input parameters

Successful response

Error response

API specification

See disableFeature for further instructions.

Use this example to specify audio encoding for features that are able to take binary audio data as input.

JSON input parameters

Successful response

API reference

See Features for further instructions.

The API consists of a single CGI, namely onscreencontrols.cgi, that takes JSON formatted data which specifies the method.

Request

Request body syntax

CGI input parameters table

Return value

Successful response

Error response

CGI output parameters table

Methods

Possible values of method for onscreencontrols.cgi.

Returns a list supported languages and locales.

Request

Request body syntax

CGI input parameters table

Return value

If the result is successful, the method returns a list with supported languages and locales.

If the result is an error, the method returns an error code and a corresponding error message.

Successful response

Error response

Language output parameters table

Language output data

The parameter data in the response is a JSON object that will contain one JSON array with the identifier languages. This array contains JSON objects that specify the languages, and their respective locales, in which available features can be described. The locales are used as inputs in Features.

Error return values

Error content for languages

Returns a collection of available features.

Request

Request body syntax

CGI input parameters

Feature data parameters

Return value

If the result is successful, the method returns a collection of available features.

If the result is an error, the method returns an error code and a corresponding error message.

Successful response

Error response

Feature output parameters

Error return values

Error content for features

Add information about a manually installed feature.

Request

Request body syntax

CGI input parameters

addFeatures data parameters

JSON example for the addFeatures CGI method

Return value

If the result is successful, the method saves the new feature descriptions.

If the result is an error, the method returns an error code and a corresponding error message.

Successful response

Error response

addFeatures output parameters

Error return values

Error content for features

Lists the feature descriptions added by the user.

Request

Request body syntax

CGI input parameters table

Return value

If the result is successful, the method returns the list of manually added features. For descriptions and APIs, see Features.

If the result is an error, the method returns an error code and a corresponding error message.

Successful response

listAddedFeatures output parameters

Error return values

Error content for listAddedFeatures

Remove information that has been added about a manually installed feature.

Request

Request body syntax

CGI input parameters

removeFeatures input parameters

JSON example for the removeFeatures CGI method

Return value

If the result is successful, the method removes the feature descriptions.

If the result is an error, the method returns an error code and a corresponding error message.

Successful response

Error response

removeFeatures output parameters

Error return values

Error content for features

A CGI method for retrieving all feature descriptions in all available languages. The returned collection contains all feature descriptions arranged in JSON objects identical with Features, using locales as keys. The locales are the same as returned by Languages.

Request

Request body syntax

The following table lists the JSON parameters for this CGI method.

getAllFeatures data parameters

Return value

A CGI method for retrieving the supported API versions. The returned list consists of the supported major versions, with highest supported minor versions. Note that the version is for the API as a whole, i.e. for all methods in the CGI.

Request

Request body syntax

The following table lists the JSON parameters for this CGI method.

getSupportedVersions data parameters

Return value

Response body syntax

This CGI method can be used to change the status of a feature to enabled.

Request

Request body syntax

Return value

Response body syntax

This CGI method is used to change the status of a feature to disabled.

Request

Request body syntax

Return value

Response body syntax

Fields in featureGroups structure table

Fields in feature structure table

Fields in the requestURL parameter structure

Range specific fields in parameter object

There is a number of parameter types that interacts with position on the video feed. This position should be collected with a mouse pointer or similar. All coordinates are normalized. A parameter that uses coordinates have a type and a niceName.

Geometric types

Specific field in a string parameter object

Specific fields in a multiOption parameter object

Specific fields in a multiOption values parameter object

There exist a number of parameter types that is only used when the target CGI requires a JSON payload.

Specific field in json only parameter type

transmitAudioData types

This table shows how to format the value part of a JSON parameter.

Valid values for the jsonVariableFormat parameter

Valid values for the vmsHint parameter

Valid values for the vmsReq parameter

Fields in the requestURL response structure

Valid values for vmsHint in response

Example: requestURL response structure

```
The status method in the axis/addon.cgi lists axis-onscreencontrols as active.
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "languages",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "languages",    "data": {        "languages": [            {                "language": "English",                "locale": "en-us"            },            {                "language": "Svenska",                "locale": "sv-se"            },            {                "language": "Deutsch",                "locale": "de-de"            }        ]    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "features",    "params": {        "locale": "en-us",        "acceptLocaleMismatch": false    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "features",    "params": {        "locale": "sv-sv",        "acceptLocaleMismatch": false    }}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "features",    "error": {        "errorCode": 2002,        "errorMsg": "The given locale is not supported."    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "features",    "params": {        "channel": 1    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "addFeatures",    "params": {        "locale": "en-us",        "language": "English",        "featureDescription": {            "name": "featureGroup_identifier",            "niceName": "featureGroup niceName",            "featureGroups": [],            "features": [                {                    "user": ["operator"],                    "name": "colorLevel",                    "niceName": "Color Level",                    "info": "Choose color level",                    "requestType": "GET",                    "requestURL": "/axis-cgi/param.cgi?action=update&root.ImageSource.I0.Sensor.ColorLevel={color}",                    "parameters": {}                }            ]        }    }}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "addFeatures",    "data": {}}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "listAddedFeatures",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "listAddedFeatures",    "data": {        "addedFeatures": [            {                "name": "featureGroup_identifier",                "locales": [                    {                        "locale": "en-us",                        "language": "English"                    },                    {                        "locale": "de-de",                        "language": "Deutsch"                    },                    {                        "locale": "es-es",                        "language": "Espanol"                    }                ]            },            {                "name": "featureGroup_identifer_2",                "locales": [                    {                        "locale": "de-de",                        "language": "Deutsch"                    }                ]            },            {                "name": "featureGroup_identifer_3",                "locales": [                    {                        "locale": "es-es",                        "language": "Espanol"                    }                ]            }        ]    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "removeFeatures",    "params": {        "locale": "en-us",        "name": "featureGroup_identifier"    }}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "removeFeatures",    "data": {}}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "params": {}}
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "data": {        "en-us": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Remove water from the camera dome.",                            "requestType": "GET",                            "response": false,                            "requestURL": "/axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": []        },        "de-de": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Wasser aus der Kamera entfernen.",                            "requestType": "GET",                            "response": false,                            "requestURL": "/axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": []        },        "sv-sv": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Avlägsna vatten från kameran.",                            "requestType": "GET",                            "response": false,                            "requestURL": "/axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": []        }    }}
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "error": {        "code": 9999,        "message": "Internal error"    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "params": {        "showDisabled": true    }}
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "data": {        "en-us": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Remove water from the camera dome.",                            "requestType": "GET",                            "response": false,                            "requestURL": "/axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": [],            "status": "disabled"        },        "de-de": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Wasser aus der Kamera entfernen.",                            "requestType": "GET",                            "response": false,                            "requestURL": "axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": [],            "status": "enabled"        },        "sv-sv": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "PTZ",                    "niceName": "PTZ",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "SpeedDry",                            "niceName": "Speed Dry",                            "info": "Avlägsna vatten från kameran.",                            "requestType": "GET",                            "response": false,                            "requestURL": "/axis-cgi/com/ptz.cgi?auxiliary=speeddry"                        }                    ]                }            ],            "features": [],            "status": "disabled"        }    }}
```

```
{    "apiVersion": "1.1",    "context": "",    "method": "getAllFeatures",    "error": {        "code": 9999,        "message": "Internal error"    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "2.0",    "context": "abc",    "method": "getSupportedVersions"}
```

```
{    "apiVersion": "2.0",    "context": "abc",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["1.1", "2.0"]    }}
```

```
{    "apiVersion": "2.0",    "context": "abc",    "method": "getSupportedVersions",    "error": {        "code": 9999,        "message": "Internal error"    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "enableFeature",    "params": {        "name": "IR"    }}
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "enableFeature",    "data": {}}
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "enableFeature",    "error": {        "code": 2005,        "message": "Feature not found."    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "disableFeature",    "params": {        "name": "IR"    }}
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "disableFeature",    "data": {}}
```

```
{    "apiVersion": "1.3",    "context": "",    "method": "disableFeature",    "error": {        "code": 2005,        "message": "Feature not found."    }}
```

```
http://myserver/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.4",    "context": "",    "method": "features",    "params": {        "locale": "en-us"    }}
```

```
{    "apiVersion": "1.4",    "context": "",    "method": "features",    "data": {        "featureDescription": {            "name": "root",            "niceName": "",            "featureGroups": [                {                    "name": "transmitAudio",                    "niceName": "Play audio",                    "featureGroups": [],                    "features": [                        {                            "user": ["operator"],                            "name": "transmitAudio",                            "niceName": "Play audio",                            "info": "Play audio",                            "requestType": "POST",                            "requestPayload": "BINARY",                            "response": false,                            "requestURL": "/axis-cgi/audio/transmit.cgi",                            "parameters": {                                "audio": {                                    "type": "transmitAudioData",                                    "contentType": ["g711", "g726", "axis-mulaw-128"]                                }                            }                        }                    ],                    "status": "enabled"                }            ],            "features": []        }    }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "Major.Minor",    "context": "context-id",    "method": "method-id",    "params": {}}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided in the corresponding request.",    "method": "method-id",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided in the corresponding request.",  "method": "method-id",  "error": {    "code": errorCode,    "message": "A description of the error."  }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "languages",    "params": {}}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided in the corresponding request",    "method": "languages",    "data": {        "languages": [            { "language": "English", "locale": "en-us" },            { "language": "Deutsch", "locale": "de-de" },            { "language": "Svenska", "locale": "sv-sv" }        ]    }}
```

```
{  "apiVersion": "1.0",  "context": "Echoed if provided in the corresponding request",  "method": "languages",  "error": {    "code": errorCode,    "message": "This thing went wrong."  }}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided in the corresponding request",    "method": "languages",    "data": {        "languages": [            { "language": "English", "locale": "en-us" },            { "language": "Deutsch", "locale": "de-de" },            { "language": "Svenska", "locale": "sv-sv" }        ]    }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "features",    "params": {        "locale": "en-us",        "acceptLocaleMismatch": true    }}
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "features",    "data": {        "featureDescription": {            "name": "root",            "niceName": "",            "featureGroups": [],            "features": []        }    }}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided in the corresponding request",  "method": "features",  "error": {    "code": errorCode,    "message": "Could not return any features."  }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "addFeatures",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "addFeatures",    "params": {        "locale": "en-us",        "language": "English",        "featureDescription": {            "name": "featureGroup_identifier",            "niceName": "featureGroup niceName",            "featureGroups": [],            "features": [                {                    "user": ["operator"],                    "name": "colorLevel",                    "niceName": "Color Level",                    "info": "Choose color level",                    "requestType": "GET",                    "requestURL": "/axis-cgi/param.cgi?action=update&root.ImageSource.I0.Sensor.ColorLevel={color}",                    "parameters": {}                }            ]        }    }}
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "addFeatures",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided in the corresponding request",  "method": "addFeatures",  "error": {    "code": errorCode,    "message": "Could not save the feature description."  }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "listAddedFeatures",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "",    "method": "listAddedFeatures",    "data": {        "addedFeatures": [            {                "name": "featureGroup_identifier",                "locales": [                    {                        "locale": "en-us",                        "language": "English"                    },                    {                        "locale": "de-de",                        "language": "Deutsch"                    },                    {                        "locale": "es-es",                        "language": "Espanol"                    }                ]            },            {                "name": "featureGroup_identifier_2",                "locales": [                    {                        "locale": "de-de",                        "langauge": "Deutsch"                    }                ]            },            {                "name": "featureGroup_identifier_3",                "locales": [                    {                        "locale": "es-es",                        "language": "Espanol"                    }                ]            }        ]    }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "removeFeatures",    "params": {}}
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "removeFeatures",    "params": {        "locale": "en-us",        "name": "featureGroup_identifier"    }}
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "removeFeatures",    "data": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided in the corresponding request",  "method": "addFeatures",  "error": {    "code": errorCode,    "message": "Could not remove feature description."  }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.1",    "context": "context-id",    "method": "getAllFeatures",    "params": {}}
```

```
{  "apiVersion": "Major.Minor",  "context": "Echoed if provided by the client in the corresponding request",  "method": "getAllFeatures",  "data": {    "en-us": {      "name": "root",      "niceName": "",      "featureGroups": [...],      "features": []    }    "de-de": {      "name": "root",      "niceName": "",      "featureGroups": [...],      "features": []    }    "sv-sv": {      "name": "root",      "niceName": "",      "featureGroups": [...],      "features": []    },    ...  }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.0",    "context": "context-id",    "method": "getSupportedVersions",    "params": {}}
```

```
{    "apiVersion": "Major.Minor",    "context": "Echoed if provided by the client in the corresponding request",    "method": "getSupportedVersions",    "data": {        "apiVersions": ["<Major1>.<Minor1>", "<Major2>.<Minor2>"]    }}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.3",    "context": "context-id",    "method": "enableFeature",    "params": {        "name": "feature-name"    }}
```

```
{    "apiVersion": "Major.Minor",    "context": "",    "method": "enableFeature",    "data": {}}
```

```
http://<myserver>/local/axis-onscreencontrols/onscreencontrols.cgi
```

```
{    "apiVersion": "1.3",    "context": "context-id",    "method": "disableFeature",    "params": {        "name": "feature-name"    }}
```

```
{    "apiVersion": "Major.Minor",    "context": "",    "method": "disableFeature",    "data": {}}
```

```
{    "vmsHint": "display",    "type": "string",    "value": "Hi!"}
```

- Get a list of supported languages and locales.
- Get information about available features in a given (supported) locale.
- Add information about a manually installed feature.
- List manually added features.
- Remove information about a manually installed feature.
- Get information about available features in all supported languages.
- Get a list of supported API versions.

- Property: Properties.PackageManager.PackageManager=yes
- Property: Properties.AddOnFramework.Version=1.0 or higher
- AXIS OS: 7.10 and later
- Product category: Axis cameras with application support

- Query for supported languages.

- Parse the JSON response.

- Get a list of all the pre- and post installed features from the Camera that are available in the locale language English (en-us).

- Get a list of all the pre- and post installed features from the Camera that are available in the Swedish language.

- Retrieve a list of the installed features from a device. This can be done on both devices where you have requested a channel ID and devices that doesn’t have a channel ID.

- Updates the features in the camera with the new feature descriptions.

- Response when new features are added to the camera.

- List the added features from the camera.

- Response list added feature from the camera.

- Remove the feature information from the camera.

- Response features removed from the camera.

- Get a list of all feature descriptions.

- Parse the JSON response.

- Retrieve a list of all feature descriptions, including disabled features.

- Parse the JSON response.

- Get a list of supported API versions.

- Parse the JSON response.

- Show the option either enable or disable the feature in the API.

- Parse the JSON response.

- Remove the option to either enable or disable the feature in the API.

- Parse the JSON response.

- Get a list of supported features.

- Parse the JSON response.

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- languages - Details found in Languages
- features - Details found in Features
- addFeatures - Details found in addFeatures
- listAddedFeatures - Details found in listAddedFeatures
- removeFeatures - Details found in removeFeatures
- getAllFeatures - Details found in getAllFeatures
- getSupportedVersions - Details found in getSupportedVersions
- enableFeature - Details found in enableFeature
- disableFeature - Details found in disableFeature

- apiVersion: 1.0

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.0

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.0

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.0

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.0

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.1

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.0

- Security level: Viewer
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.3

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

- apiVersion: 1.3

- Security level: Admin
- Method: POST

- HTTP Code: 200 OK
- Content-Type: application/json

| Method | Usage |
| --- | --- |
| languages | Get a list of supported languages and locales. |
| features | Get descriptions of available features in one of the supported languages. |
| addFeatures | Add information about a manually installed feature. |
| listAddedFeatures | Get a list of manually added features. |
| removeFeatures | Remove information about a manually installed feature. |
| getAllFeatures | Get a collection of feature descriptions in all available languages. |
| getSupportedVersions | Get a list of supported API versions. |
| enableFeature | Show the option to enable/disable a feature. |
| disableFeature | Remove the option to enable/disable a feature. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Optional context string. Client sets this value and the application echoes it back in the response. |
| method | String | The operation to perform. |
| params | JSON object | Container for method parameters. Note: This is required for some methods and optional for others. See respective method description for info. |

| Parameter | Type | Description |
| --- | --- | --- |
| apiVersion | String | The requested API version in the format Major.Minor. |
| context | String | Echoed if provided by the client in the corresponding request. |
| method | String | The operation that was performed. |
| data | JSON object | Present if a request was successfully performed. Container for method output data. |
| error | JSON object | Present if a request could not be performed. Container for error information. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required |
| context | String | Optional |
| method | String | Required |
| params | JSON object | Redundant. This method does not support any input parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| data | JSON object | Present if request was performed successfully. Container for method output data. The content is described in Language output data below. |
| error | JSON object | Present if request could not be performed. Container for error information. The content is described in Error return values below. |

| Parameter | Type | Description |
| --- | --- | --- |
| code | Integer | An error code, see Error codes. |
| message | String | A text describing the error. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required |
| context | String | Optional |
| method | String | Required |
| params | JSON object | Optional. See the Feature data parameters table below for default values. |

| Parameter | Type | Description |
| --- | --- | --- |
| locale | String | A locale specifier (e.g. en-us) which determines the language of the returned information. Must be one of the supported locales obtained with Languages. Defaults to "en-us" if not specified. |
| acceptLocaleMismatch | Boolean | If set to true, feature information that is not available in the given locale or in English will be included in the response in the first found language. Otherwise it will be ignored. Defaults to false. |
| channel | Integer | A channel/source specifier that filters the returning information. If set, the default returned information will contain both the features with the chosen channel ID and the features without a channel ID. |

| Parameter | Type | Description |
| --- | --- | --- |
| data | JSON object | Present if request was performed successfully. Container for method output data. The content is described in Description of fields in featureGroups structure. |
| error | JSON object | Present if request could not be performed. Container for error information. The content is described in Error return values below. |

| Parameter | Type | Description |
| --- | --- | --- |
| code | Integer | An error code, see Error codes. |
| message | String | A text describing the error. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required |
| context | String | Optional |
| method | String | Required |
| params | JSON object | Required, see the addFeatures data parameters table below. |

| Parameter | Type | Description |
| --- | --- | --- |
| locale | String | Must be formatted in on of two ways, ab or ab-xy. |
| language | String | Name of the language. |
| featureDescription | JSON Object | See Description of fields in feature structures for description of this parameter. |

| Parameter | Type | Description |
| --- | --- | --- |
| data | JSON object | Present but empty if the request was successfully performed. |
| error | JSON object | Present if the request could not be performed. Container for error information. The content is described in Error return values below. |

| Parameter | Type | Description |
| --- | --- | --- |
| code | Integer | An error code, see Error codes. |
| message | String | A text describing the error. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON object | Redundant. This method does not take any input parameters. |

| Parameter | Type | Description |
| --- | --- | --- |
| data | JSON object | Present but empty if the request was successfully performed. |
| error | JSON object | Present if the request could not be performed. Container for error information. The content is described in the table Error content for listAddedFeatures below. |

| Parameter | Type | Description |
| --- | --- | --- |
| code | Integer | An error code, see Error codes. |
| message | Integer | A text describing the error. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON object | Required. See the removeFeatures input parameters table below. |

| Parameter | Type | Description |
| --- | --- | --- |
| locale | String | Required. Specifies the locale for which the featureGroup should be removed. |
| name | String | Required. Specifies the featureGroup to remove. |

| Parameter | Type | Description |
| --- | --- | --- |
| data | JSON object | Present but empty if the requested was successfully performed. |
| error | JSON object | Present if the request could not be performed. Container for error information. The content is described in Error return values below. |

| Parameter | Type | Description |
| --- | --- | --- |
| code | Integer | An error code, see Error codes. |
| message | String | A text describing the error. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON Object | Redundant. This method does not take any input parameters. |

| Parameter | Type | Requirements |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON Object | Redundant. This method does not take any input parameters. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON object | Required. |

| Parameter | Type | Description |
| --- | --- | --- |
| name | String | Required. Specifies the name of the feature that should be enabled. |

| Parameter | Type | Requirement |
| --- | --- | --- |
| apiVersion | String | Required. |
| context | String | Optional. |
| method | String | Required. |
| params | JSON object | Required. |

| Parameter | Type | Description |
| --- | --- | --- |
| name | String | Required. Specifies the name of the feature that should be disabled. |

| Code | Description |
| --- | --- |
| 1001 | Out of memory. |
| 1002 | Error in the CGI request. |
| 1003 | CGI request is an invalid method. |
| 2001 | Error in the database. |
| 2002 | Invalid locale. |
| 2003 | Invalid JSON. |
| 2004 | Unsupported API version. |
| 2005 | Missing data param. |
| 9999 | Internal error. |

| Parameter | Type | Description |
| --- | --- | --- |
| name | String | Name of a feature in English, used as an identifier. |
| niceName | String | Translated name of the featureGroup according to the requested locale. |
| featureGroups | Array [JSON Object] | An array of featureGroups, used for grouping features together like PTZ features or similar. Features added with addFeatures will be placed in a post install group, and then an individual group for the specific request. |
| features | Array [JSON Object] | An array of features that are located in this featureGroup, see Description of fields in feature structures. |

| Parameter | Type | Description |
| --- | --- | --- |
| name | String | Name of a feature in English and used as an identifier. |
| niceName | String | Translated name of a feature according to the requested locale. |
| user | Array [String] | Recommended user level for accessing this feature. Valid values are operator, admin and event. |
| info | String | Translated information string about the feature. |
| requestType | String | How the CGI request should be sent to a camera. Valid values are GET and POST. |
| requestPayload | String | Specify the format of the request payload. Valid values are JSON and BINARY. Reserved for future use is SOAP and XML. |
| requestURL | String | URL to trigger the feature param, which should be replaced by parameter values. See table Fields in requestURL parameter structure below. |
| response | Boolean | If the request will return a value to the VMS. See Description of fields in requestURL response structures. |
| vmsHint | Array [Strings] | vmsHint specifies the client side actions that is suitable to do when a button is pressed. These are not mandatory. See the Valid values for vmsHint parameter table below. |
| vmsReq | Array [Strings] | vmsReq specifies a requirement to the VMS that needs to be fulfilled for the button to be useful for a user. If these Requirements are not fulfilled, ignore this button. See table Valid values for vmsReq parameter below. |
| jsonTemplate | String | Used as a template for the json payload of a POST request, this field is only present when requestPayload is JSON. The String that shows how a Json Request should be formatted. The template string could for example look like this: "{1,2,3,4:[4,5],6}" or "{1}", "{1,2,3,4:{5}}". 1,2,3,4.. is the name of the parameters in the JSON Object. |
| parameters | JSON Object | Description of parameters to use in requestURL. See table Fields in requestURL parameter structure below. |

| Parameter | Type | Description |
| --- | --- | --- |
| type | String | Type of parameters to be used in the URL. For valid values, see tables Range specific fields in parameter object, Geometric types, Specific field in string parameter object, Specific fields in a multiOption parameter object, Specific field in json only parameter type and transmitAudioData types below. |
| niceName | String | Short description (one or two words) of the parameter. |
| info | String | Optional information about the parameter. |
| Key | String | String to use as a key for parameters in a JSON Payload. |
| jsonVariableFormat | String | Which format for the JSON parameters to use. For valid values, see table Valid values for jsonVariableFormat parameter. |

| Parameter | Type | Description |
| --- | --- | --- |
| defaultValue | String | Default value for range. |
| unit | String | Type of value to be used in a range. Valid values are integer, fraction. |
| min | String | Minimum value for range. |
| max | String | Maximum value for range. |
| step | String | Stepsize for range. |

| Type | Description |
| --- | --- |
| coordinate | Specify the normalized coordinates on the form [X,Y]. The [0.0,0.0] is the top left corner of the image frame [1.0,1.0] is the bottom right corner. |
| line | Two normalized coordinate pairs that forms a line. Given in the format [X1,Y1,X2,Y2], where X1,Y1 is the first point in a line draw by an operator. |
| box | Two normalized coordinate pairs that forms a box. Given in the format [X1,Y1,X2,Y2], where X1,Y1 is the top left corner of the box and X2,Y2 is the bottom right corner of the box. |
| polygon | A number of normalized coordinate pairs that creates a closed shape. Given in the format [X1,Y1,X2,Y2,. . . ,Xn,Yn], where Xn,Yn is the point that connects back to X1,Y1. |
| niceName | Name of the coordinate, line . . . translated to the user language. For example, a Polygon could have a niceName "Motion Detection Area". |

| Parameter | Type | Description |
| --- | --- | --- |
| defaultValue | String | Default value of a string that suggests user as input. Any string, including empty, is valid. |

| Parameter | Type | Description |
| --- | --- | --- |
| defaultValue | String | Default value for multiOption (Value, not the translated niceName). |
| values | Array [JSON Object] | List of possible values for a multiOption parameter. Each object contains a value and a niceName. See table Specific fields in a multiOption values parameter object below. |

| Parameter | Type | Description |
| --- | --- | --- |
| value | String | Value that should be part of requestURL for multiOption parameters. |
| niceName | String | Translated name for multiOption parameters. |

| Type | Description |
| --- | --- |
| fixed | The string in "value" should be used as the value in the key:value json pair. |
| context | The value in the value field in the key:value pair will be returned by the camera. |
| keyOnly | Used when only a key is needed, for example as the header for JSON objects and lists. |

| Parameter | Type | Description |
| --- | --- | --- |
| contentType | String | Audio content type that should be used when you want to transmit data. Valid values are- g711- g726- axis-mulaw-128 |

| Type | Description |
| --- | --- |
| string | The key:value pair should be formatted to read "key":"variable string". |
| integer | The key:value pair should be formatted to read "key":5 or "key"-5. |
| fraction | The key:value pair should be formatted to read "key": 5.0 or "key":–5.0. |
| exponent | The key:value pair should be formatted to read "key":5.0e+2 or "key":-5.0e-3. |
| boolean | The key:value pair should be formatted to read "key":true or "key": false. |
| null | The key:value pair should be formatted to read "key":null. |

| Hint | Description |
| --- | --- |
| windowClose | If the camera appears in a popup window, this command will close the window. |
| audioOutDisable | Mute the operator microphone. This command is usually used as a mute button for cameras with audio communication devices. |
| audioOutEnable | Open the operator microphone to the camera. This command is usually used as an unmute button for cameras with audio communication devices. |
| audioOutToggle | Toggle the operator microphone between a mute and an unmute state. |
| audioInDisable | Mute the camera microphone. This command is usually used as a mute button for cameras with audio communication devices. |
| audioInEnable | Start listening on the microphone for the camera. |
| audioInToggle | Toggle the camera microphone between a mute and an unmute state. |
| hidden | These features are of lower importance and could be hidden from the operator. An example is trigger virtual input 20. |

| Req | Description |
| --- | --- |
| eventStream | This button produces an event in the Dynamic Event Stream. The VMS needs to be able to understand these events to have any benefit of this button. |

| Parameter | Type | Description |
| --- | --- | --- |
| vmsHint | Array [String] | What the VMS should do with the return value. The valid value is display, store as shown in the table Valid values for vmsHint in response below. |
| context | String | Variable containing the context value from the request. |
| type | String | Type of response. Can be either in the form of an integer, string, boolean, array, object. |
| value | Defined by type | Return value from Request. |

| Value | Description |
| --- | --- |
| display | The returned value should be displayed to the user. |
| store | Store the returned value as a searchable metadata. |

