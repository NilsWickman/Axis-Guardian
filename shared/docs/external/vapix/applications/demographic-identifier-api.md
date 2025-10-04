# Demographic identifier API

**Source:** https://developer.axis.com/vapix/applications/demographic-identifier-api/
**Last Updated:** Aug 18, 2025

---

# Demographic identifier API

## Common examples​

## API specification​

### Get live tracks​

### Get ended tracks​

### Get live and ended tracks​

### Get FPS​

### Restart service​

### Reboot the camera​

### Get statistics​

Get Live tracks

Request

Return (example) - No active track found

Return (example) - One active track found

Return (example) - Two active tracks found

Get Ended tracks

Request

Return (example) - No active track found

Return (example) - One ended track found

Return (example) - Two ended tracks found

Get Live and Ended tracks

Request

Return (example) - Two Live and one Ended track

This API returns live face tracks (boxes), currently active in the video stream.

Request

Return

See Common examples for return examples.

Return value descriptions

This API returns previously detected (ended) tracks.

Request

Request parameter descriptions

Return

See Common examples for return examples.

Return value descriptions

This API combines the Live API described in Get live tracks, and the Ended API described in Get ended tracks. It returns both live information, as well as ended tracks.

Request

Request parameter descriptions

Return

See Common examples for return examples.

Return value descriptions

This API checks the FPS used by the Demographics algorithm.

Request

Return

Restarts the Demographics service

Request

Reboots the camera

Request

Returns historical data in JSON format

Request

Request parameter descriptions

Return

This script returns data in JSON format.

```
http://<servername>/local/demographics/.api?tracks-live.json
```

```
{    "live": {        "tracks": []    }}
```

```
{    "live": {        "tracks": [            {                "time_start": 1447749079.091622,                "time_end": 1447749081.011605,                "gender_average": 1,                "age_average": 20,                "boxsize_average": 177,                "gender_last": 1,                "age_last": 21,                "boxsize_last": 180            }        ]    }}
```

```
{    "live": {        "tracks": [            {                "time_start": 1447749104.451576,                "time_end": 1447749109.451567,                "gender_average": 1,                "age_average": 20,                "boxsize_average": 198,                "gender_last": 1,                "age_last": 18,                "boxsize_last": 195            },            {                "time_start": 1447749107.811568,                "time_end": 1447749109.451567,                "gender_average": -1,                "age_average": 21,                "boxsize_average": 160,                "gender_last": -1,                "age_last": 23,                "boxsize_last": 158            }        ]    }}
```

```
http://<servername>/local/demographics/.api?tracks-ended.json
```

```
{    "ended": {        "time_start": 1447748743.039911,        "time_end": 1447749643.039911,        "tracks": []    }}
```

```
{    "ended": {        "time_start": 1447749887.539835,        "time_end": 1447749947.539835,        "tracks": [            {                "time_start": 1447749942.930319,                "time_end": 1447749946.210321,                "gender_average": 1,                "age_average": 21,                "boxsize_average": 219            }        ]    }}
```

```
{    "ended": {        "time_start": 1447750011.470372,        "time_end": 1447750071.470372,        "tracks": [            {                "time_start": 1447750064.890142,                "time_end": 1447750067.690133,                "gender_average": 1,                "age_average": 22,                "boxsize_average": 217            },            {                "time_start": 1447750066.130135,                "time_end": 1447750067.690133,                "gender_average": -1,                "age_average": 18,                "boxsize_average": 192            }        ]    }}
```

```
http://<servername>/local/demographics/.api?tracks-live-and-ended.json&time=60
```

```
{    "live": {        "tracks": [            {                "time_start": 1447750516.809464,                "time_end": 1447750523.329454,                "gender_average": 1,                "age_average": 19,                "boxsize_average": 218,                "gender_last": 1,                "age_last": 19,                "boxsize_last": 218            },            {                "time_start": 1447750521.569459,                "time_end": 1447750523.329454,                "gender_average": -1,                "age_average": 17,                "boxsize_average": 222,                "gender_last": 260,                "age_last": 19,                "boxsize_last": 217            }        ]    },    "ended": {        "time_start": 1447750463.936758,        "time_end": 1447750523.936758,        "tracks": [            {                "time_start": 1447750514.24947,                "time_end": 1447750515.329465,                "gender_average": 1,                "age_average": 20,                "boxsize_average": 239            }        ]    }}
```

```
http://<servername>/local/demographics/.api?tracks-live.json
```

```
http://<servername>/local/demographics/.api?tracks-ended.json&<time>
```

```
http://<servername>/local/demographics/.api?tracks-live-and-ended.json
```

```
http://<servername>/demographics/.api?fps.json
```

```
{  "fps":<fps>}
```

```
http://<servername>/demographics/.apioperator?restart
```

```
http://<servername>/demographics/.apioperator?reboot
```

```
http://<servername>/local/demographics/.api?export-json[&date=<date>][&res=<res>]
```

- Format: JSON
- Method: GET

- Format: JSON
- Method: GET

- Format: JSON
- Method: GET

- Format: JSON
- Method: GET

- Format: JSON
- Method: GET

| Value | Description |
| --- | --- |
| <time_start> | Time of the first face observation in seconds in form of UTC (Coordinated Universal Time) |
| <time-end> | Time of the last face observation in seconds. |
| <gender_average> | -1 for female estimate and 1 for male estimate on average since <time_start>. |
| <age_average> | Estimated age over the track since <time_start>. |
| <boxsize_average> | Average box size over the track since <time_start>. |
| <gender_last> | -1 for female guess and 1 for male guess on last observation. |
| <age_last> | Estimated age on last observation. |
| <boxsize_last> | Boxsize on last observation. |

| Parameter | Description |
| --- | --- |
| <time> | Use time to adjust the amount of time (in seconds) to include in the return. The default value is 15 minutes. |

| Value | Description |
| --- | --- |
| <time_start> | Time of the first face observation in seconds in form of UTC (Coordinated Universal Time) |
| <time-end> | Time of the last face observation in seconds. |
| <gender_average> | -1 for female estimate and 1 for male estimate on average since <time_start>. |
| <age_average> | Estimated age over the track since <time_start>. |
| <boxsize_average> | Average box size over the track since <time_start>. |

| Parameter | Description |
| --- | --- |
| <time> | Use time to adjust the amount of time (in seconds) to include in the return. The default value is 15 minutes. |

| Value | Description |
| --- | --- |
| <time_start> | Time of the first face observation in seconds in form of UTC (Coordinated Universal Time) |
| <time-end> | Time of the last face observation in seconds. |
| <gender_average> | -1 for female estimate and 1 for male estimate on average since <time_start>. |
| <age_average> | Estimated age over the track since <time_start>. |
| <boxsize_average> | Average box size over the track since <time_start>. |
| <gender_last> | -1 for female guess and 1 for male guess on last observation. |
| <age_last> | Estimated age on last observation. |
| <boxsize_last> | Boxsize on last observation. |

| Parameter | Description |
| --- | --- |
| <date> | a date of the form YYYYMMDD |
|  | a date interval of the form YYYYMMDD-YYYYMMDD |
|  | comma separated dates of the form YYYYMMDD,[..],YYYYMMDD |
|  | all (default) for all available data |
| <res> | 15m (default) for data in 15 minute bins |
|  | 1h for data in 1 hour bins |
|  | 24h for data in 1 day bins |

