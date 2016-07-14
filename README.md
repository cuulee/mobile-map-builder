# Data Generator

An application that helps you build data bundles (MBTiles & GeoPackages) from TileServers.

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
    map.zoom_level ASS zoom_level,
    map.tile_column AS tile_column,
    map.tile_row AS tile_row,
    images.tile_data AS tile_data
  FROM map
  JOIN images ON images.tile_id = map.tile_id
```
