# Queue monitor API

**Source:** https://developer.axis.com/vapix/applications/queue-monitor-api/
**Last Updated:** Aug 18, 2025

---

# Queue monitor API

## Common examples​

## API specification​

### Get real time people in queue data​

### Request CSV minute data​

### Request CSV people data​

### Clear local queue data​

### List application parameters​

### Set application related parameters​

### Show the system log​

### Generate a log archive​

Request the number of people standing in queue at this moment.

Request

Return

See Get real time people in queue data for more information.

Request historical minutes of queue data in CSV format for the 1st and the 3rd of May 2017 with a 5 hour resolution.

Request

Return

See Request CSV minute data for more information.

Request historical people in queue data, in CSV format, for the 4th of April and the 3rd of May 2017 with a 120 minute resolution.

Request

Return

See Request CSV people data for more information.

Request

Return

Return value descriptions

Request

Request parameter descriptions

Return

This script returns data in plain text, comma-separated values. The first line is a comma-separated header describing each column. Each integer value states the number of minutes for which there has been a certain amount of queue (High/Mid/Low) for a certain region.

Request

Request parameter descriptions

Return

This script returns data in plain text, comma-separated values. The first line is a comma separated header describing each column. Each integer value states the average number of people within a certain region of interest.

Request

Return

Request

Return

A JSON object of all the application related parameters.

The post format has a format where pairs and values need to be specified, best described by an example: &p1=Counter.Enabled&v1=1&p2=WebReportUpload.Enabled&v2=1

Request

Return

Request

Return

Displays the system logs.

Request

Return

A log archive

```
http://<servername>/local/queue/.api?live-sum-people.json
```

```
{    "serial": "ACCC8E20F09B",    "name": "Service Counter",    "timestamp": "20170113181132",    "region1name": "Product Display",    "region1people": 1,    "region2name": "Aisle Display",    "region2people": 0,    "region3name": "Service Counter",    "region3people": 3}
```

```
http://<servername>/local/queue/.api?export-csv-minutes&date=20170501,20170503&res=5h
```

```
Interval start,Interval stop,Camera serial number,Name,Region1 High,Region1 Mid,Region1 Low,Region2 High,Region2 Mid,Region2 Low,Region3 High,Region3 Mid,Region3 Low2017-05-01 00:00:00,2017-05-01 05:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,0,3002017-05-01 05:00:00,2017-05-01 10:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,20,2802017-05-01 10:00:00,2017-05-01 15:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,174,1262017-05-01 15:00:00,2017-05-01 20:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,109,1912017-05-01 20:00:00,2017-05-02 01:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,0,3002017-05-03 00:00:00,2017-05-03 05:00:00,00XXXXXXXXXX,Camera1,0,0,300,0,0,300,0,0,3002017-05-03 05:00:00,2017-05-03 10:00:00,00XXXXXXXXXX,Camera1,0,34,266,0,17,283,8,67,225
```

```
http://<servername>/local/queue/.api?export-csv-people&date=20170428,20170503&res=120m
```

```
Interval start,Interval stop,Camera serial number,Name,People in Region1,People in Region2,People in Region32017-05-03 00:00:00,2017-05-03 02:00:00,00XXXXXXXXXX,Camera2,0,0,22017-05-03 02:00:00,2017-05-03 04:00:00,00XXXXXXXXXX,Camera2,1,1,12017-05-03 04:00:00,2017-05-03 06:00:00,00XXXXXXXXXX,Camera2,1,0,12017-05-03 06:00:00,2017-05-03 08:00:00,00XXXXXXXXXX,Camera2,1,0,22017-05-03 08:00:00,2017-05-03 10:00:00,00XXXXXXXXXX,Camera2,1,0,1
```

```
http://<servername>/local/queue/.api?live-sum-people.json
```

```
{  "serial":"<camera-serial>",  "name":"<counter-name>",  "timestamp":"<timestamp>",  "region1name":"<name1>",  "region1people":<people1>,  "region2name":"<name2>",  "region2people":<people2>,  "region3name":"<name3>",  "region3people":<people3>}
```

```
http://<servername>/local/queue/.api?export-csv-minutes[&date=<date>][&res=<res>]
```

```
http://<servername>/local/queue/.api?export-csv-people[&date=<date>][&res=<res>]
```

```
http://<servername>/local/queue/.apioperator?clear-data
```

```
OK
```

```
http://<servername>/local/queue/.api?params.json
```

```
http://<servername>/local/queue/.apioperator?setparams
```

```
OK
```

```
http://<servername>/local/queue/.apioperator?show-logs
```

```
http://<servername>/local/queue/.apioperator?generate-logs
```

- Format: JSON
- Method: GET

- Format: CSV
- Method: GET

- Format: CSV
- Method: GET

- Format: text/plain
- Method: GET

- Format: JSON
- Method: GET

- Format: text
- Method: POST

- Format: text/plain
- Method: GET

- Format: tar.gz
- Method: GET

| Value | Description |
| --- | --- |
| <camera-serial> | camera serial number |
| <counter-name> | name of the counter |
| <timestamp> | time in the camera in the format YYYYMMDDhhmmss |
| <region1name> | name of region 1 |
| <region1people> | number of people standing in region 1 |

| Parameter | Description |
| --- | --- |
| <date> | a date of the form YYYYMMDD |
|  | a date interval of the form YYYYMMDD-YYYYMMDD |
|  | comma separated dates of the form YYYYMMDD,[..],YYYYMMDD |
|  | all (default) for all available data |
| <res> | 15m (default) for data in 15 minute bins |
|  | 1h for data in 1 hour bins |
|  | 24h for data in 1 day bins |

| Parameter | Description |
| --- | --- |
| <date> | a date of the form YYYYMMDD |
|  | a date interval of the form YYYYMMDD-YYYYMMDD |
|  | comma separated dates of the form YYYYMMDD,[..],YYYYMMDD |
|  | all (default) for all available data |
| <res> | 1m for data in 1 minute bins |
|  | 15m (default) for data in 15 minute bins |
|  | 1h for data in 1 hour bins |
|  | 24h for data in 1 day bins |

