[![Build Status](https://travis-ci.org/dlcspm/data-generator.svg?branch=master)](https://travis-ci.org/dlcspm/data-generator)
[![Coverage Status](https://coveralls.io/repos/github/dlcspm/data-generator/badge.svg?branch=master)](https://coveralls.io/github/dlcspm/data-generator?branch=master)

# Data Generator

An application that helps you build data bundles (MBTiles & GeoPackages) from TileServers.

## Useful Applications

**[MapTiler](https://www.maptiler.com)** - Previews MBTiles graphically.

![image](https://cloud.githubusercontent.com/assets/550895/16849152/3a88b8ea-49c7-11e6-91bd-ead7c08569c4.png)

- [SQLite Database Browser](http://sqlitebrowser.org/) - Previews MBTiles SQL tables & views.

![image](https://cloud.githubusercontent.com/assets/550895/16849211/77e61188-49c7-11e6-9a05-e42bc30d2fea.png)

## MBTile Table Schema

### Tables

**`images`**

| Name      | Type | Example                          |
|-----------|------|----------------------------------|
| tile_data | BLOB | PNG/JPG image                    |
| tile_id   | UUID | 9e8b4eb18049340b2f116a7bb5e69349 |

**`map`**

| Name        | Type  | Example                          |
|-------------|-------|----------------------------------|
| zoom_level  | INT   | 17                               |
| tile_column | INT   | 156                              |
| tile_row    | INT   | 85                               |
| tile_id     | UUID  | 9e8b4eb18049340b2f116a7bb5e69349 |

**`metadata`**

| Name        | Type        | Example                 |
|-------------|-------------|--------------------------|
| bounds      | x1,y1,x2,y2 | -27,62,-11,67.5          |
| minzoom     | INT         | 5                        |
| maxzoom     | INT         | 13                       |
| name        | STRING      | Island                   |
| version     | STRING      | 1.0.0                    |
| center      | x,y,z       | -18.7,65,7               |
| attribution | STRING      | Map data © OpenStreetMap |
| description | STRING      | Tiles from OSM           |

### Views

**`tiles`**

```sql
CREATE VIEW tiles AS
  SELECT
    map.zoom_level AS zoom_level,
    map.tile_column AS tile_column,
    map.tile_row AS tile_row,
    images.tile_data AS tile_data
  FROM map
  JOIN images ON images.tile_id = map.tile_id
```

### Bounds

Global bounding box extent of Tile (0,0) zoom 0.

- `EPSG:4326 (Degrees)`: (-180,-85.05112877980659,180,85.05112877980659)
- `EPSG:3857 (Meters)`: (-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244) 

### Scales

| Level of Detail | Map Width and Height (pixels) | Ground Resolution (meters / pixel) | Map Scale (at 96 dpi) |
|-----------------|-------------------------------|------------------------------------|-----------------------|
| 1  |	512            |	78_271.52 |	1 : 295_829_355.45  |
| 2  |	1_024          |	39_135.76 |	1 : 147_914_677.73  |
| 3  |	2_048          |	19_567.88 |	1 : 73_957_338.86   |
| 4  |	4_096          |	9_783.94  |	1 : 36_978_669.43   |
| 5  |	8_192          |	4_891.97  |	1 : 18_489_334.72   |
| 6  |	16_384         |	2_445.98  |	1 : 9_244_667.36    |
| 7  |	32_768         |	1_222.99  |	1 : 4_622_333.68    |
| 8  |	65_536         |	611.4962  |	1 : 2_311_166.84    |
| 9  |	131_072        |	305.7481  |	1 : 1_155_583.42    |
| 10 |	262_144        |	152.8741  |	1 : 577_791.71      |
| 11 |	524_288        |	76.437    |	1 : 288_895.85      |
| 12 |	1_048_576      |	38.2185   |	1 : 144_447.93      |
| 13 |	2_097_152      |	19.1093   |	1 : 72_223.96       |
| 14 |	4_194_304      |	9.5546    |	1 : 36_111.98       |
| 15 |	8_388_608      |	4.7773    |	1 : 18_055.99       |
| 16 |	16_777_216     |	2.3887    |	1 : 9_028.00        |
| 17 |	33_554_432     |	1.1943    |	1 : 4_514.00        |
| 18 |	67_108_864     |	0.5972    |	1 : 2_257.00        |
| 19 |	134_217_728    |	0.2986    |	1 : 1_128.50        |
| 20 |	268_435_456    |	0.1493    |	1 : 564.25          |
| 21 |	536_870_912    |	0.0746    |	1 : 282.12          |
| 22 |	1_073_741_824  |	0.0373    |	1 : 141.06          |
| 23 |	2_147_483_648  |	0.0187    |	1 : 70.53           |


### Testings

Test server speeds & performance.

```bash
$ siege -c100 -t1M http://localhost:5000
** SIEGE 3.0.8
** Preparing 100 concurrent users for battle.
The server is now under siege...^C
Lifting the server siege...      done.

Transactions:		        6891 hits
Availability:		      100.00 %
Elapsed time:		       34.39 secs
Data transferred:	        2.04 MB
Response time:		        0.01 secs
Transaction rate:	      200.38 trans/sec
Throughput:		        0.06 MB/sec
Concurrency:		        1.16
Successful transactions:        6891
Failed transactions:	           0
Longest transaction:	        0.25
Shortest transaction:	        0.00
```

### References

- http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection
- https://msdn.microsoft.com/en-us/library/bb259689.aspx
- https://github.com/DefinitelyTyped/DefinitelyTyped
- https://blogs.esri.com/esri/arcgis/2014/05/05/creating-custom-tileservicelayer-android/
- http://spatialreference.org/ref/sr-org/7483/