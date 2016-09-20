[![Build Status](https://travis-ci.org/DenisCarriere/mobile-map-builder.svg?branch=master)](https://travis-ci.org/DenisCarriere/mobile-map-builder)
[![Coverage Status](https://coveralls.io/repos/github/DenisCarriere/mobile-map-builder/badge.svg?branch=master)](https://coveralls.io/github/DenisCarriere/mobile-map-builder?branch=master)

# Mobile Map Builder

An application that helps you build maps & data for mobile applications.

## Install

```bash
$ git clone git@github.com:DenisCarriere/mobile-map-builder.git
$ cd mobile-map-builder
$ npm install
$ npm run build
```

## Quickstart

The core application is a Command Line Interface (CLI) which can be executed in any environment.

Here's how to create your first MBTile map bundle.

```bash
$ node app/cli.js --provider imagery --bounds "[-75.7,45.4,-75.6,45.5]" --min 5 --max 17 tiles.mbtiles
  downloading [====================] 100% (2680/2680)
  mapping     [====================] 100% (2680/2680)
```

For more information on the optional parameters enter `--help` at the end.

```bash
$ node app/cli.js --help

  Usage: cli [options] <tiles.mbtile>

  Creates MBTiles from Web Map Tile Service

  Options:

    -h, --help                    output usage information
    -V, --version                 output the version number
    -b, --bounds <Array<number>>  bounds extent in [minX, minY, maxX, maxY] order
    -p, --provider <string>       provider tile server
    --name [string]               Name given to MBTiles DB
    --max, --maxZoom [number]     Maximum Zoom Level
    --min, --minZoom [number]     Minimum Zoom Level
    --scheme [string]             Scheme given to MBTiles DB
    --attribution [string]        Attribution given to MBTiles DB
    --description [string]        Description given to MBTiles DB
    --format [string]             Tile image format [png/jpg]
    --type [string]               Type of MBTiles layer [baselayer/overlay]
```

Once your MBTiles is created, you can preview it using your application of choice (QGIS for example).

![image](https://cloud.githubusercontent.com/assets/550895/18670647/f3bf8ac4-7f0e-11e6-9c7c-b5fb66b2584e.png)

## Server (**in development)

This application can also be hosted as a service running over HTTP(S).

```bash
$ npm start

  mmb:server HTTP [PORT]: 5000
  mmb:server JWT [SECRET]: d6cd605d-557d-40b7-9006-2bb4fa35357d
  mmb:server CPU [CORES]: 1
  mmb:server [16614] Web Worker started 1
  mmb:server Listening on PORT 5000
```

## Docker Deployment

Docker provides an integrated technology suite that enables development and
IT operations teams to build, ship, and run distributed applications anywhere.

With Compose, you use `docker-compose.yml` to configure your application’s services.
Then, using a single command, you create and start all the services from your configuration. 

**Interactive**

> Interactive mode will enable a debugger to output everything to CLI

```bash
$ docker-compose up
```

**Background Process**

```
$ docker-compose start
$ docker-compose restart
$ docker-compose stop
```


## REST API

Implementation is drasticaly changing, connect to [`localhost:5000`](http://localhost:5000) for more information.


## Testing

All test cases are written in Typescript and can be found in the `tests` folder.

```bash
$ npm test
```

Tests will fail if JS syntax does not follow ESLint using the `tslint.json` rules.

```bash
$ npm run lint
```

Code coverage is also being calculated after each test. When implementing a new feature you must add a test case for it, otherwise the coverage will decrease.

```bash
$ npm run coverage
```

```bash
--------------------------------|----------|----------|----------|----------|----------------|
File                            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------------------------|----------|----------|----------|----------|----------------|
All files                       |    87.55 |    72.02 |    94.64 |    88.12 |                |
 app                            |    83.25 |    72.02 |    94.37 |    84.56 |                |
  GlobalMercator.ts             |    80.54 |     71.6 |      100 |    82.72 |... 190,191,192 |
  Grid.ts                       |    84.62 |    72.73 |      100 |    84.44 |... 128,129,130 |
  MBTiles.ts                    |       80 |    63.64 |    88.89 |       80 |... 378,379,402 |
  Tile.ts                       |     95.4 |    85.71 |    83.33 |    97.65 |        132,275 |
  debug.ts                      |      100 |      100 |      100 |      100 |                |
 app/models                     |      100 |      100 |      100 |      100 |                |
  Images.ts                     |      100 |      100 |      100 |      100 |                |
  Log.ts                        |      100 |      100 |      100 |      100 |                |
  Map.ts                        |      100 |      100 |      100 |      100 |                |
  Metadata.ts                   |      100 |      100 |      100 |      100 |                |
  index.ts                      |      100 |      100 |      100 |      100 |                |
 tests                          |    98.56 |      100 |    95.12 |    98.29 |                |
  globals.ts                    |      100 |      100 |      100 |      100 |                |
  utils.GlobalMercator.tests.ts |      100 |      100 |      100 |      100 |                |
  utils.Grid.tests.ts           |      100 |      100 |      100 |      100 |                |
  utils.MBTiles.tests.ts        |    96.08 |      100 |    66.67 |    95.56 |          81,93 |
  utils.Tile.tests.ts           |    98.18 |      100 |      100 |    97.96 |             73 |
--------------------------------|----------|----------|----------|----------|----------------|
```