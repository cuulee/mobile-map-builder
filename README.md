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