[![Build Status](https://travis-ci.org/DenisCarriere/mobile-map-builder.svg?branch=master)](https://travis-ci.org/DenisCarriere/mobile-map-builder)
[![Coverage Status](https://coveralls.io/repos/github/DenisCarriere/mobile-map-builder/badge.svg?branch=master)](https://coveralls.io/github/DenisCarriere/mobile-map-builder?branch=master)

# Mobile Map Builder

An application that helps you build map data (MBTiles & GeoPackages) from Tile Servers.

## Install

```bash
$ git clone git@github.com:DenisCarriere/mobile-map-builder.git
$ cd mobile-map-builder
$ npm install
```

## Quickstart

```bash
$ npm run start
```

## Docker Deployment

Docker provides an integrated technology suite that enables development and
IT operations teams to build, ship, and run distributed applications anywhere.

```bash
$ docker build -t mmb .
$ docker run --rm -it -p 5000:5000 mmb

mmb:server HTTP [PORT]: 5000 +0ms
mmb:server JWT [SECRET]: 8b58f738-42c2-432b-9847-7fdbdc16fda9 +4ms
mmb:server CPU [CORES]: 1 +7ms
mmb:server [27] Web Worker started 1 +123ms
mmb:server Listening on PORT 5000 +116ms
```

Demonized Docker as a background process.

```bash
$ docker run -d --name mmb -p 5000:5000 mmb
```

## REST API

Implementation is drasticaly changing, connect to [`localhost:5000`](http://localhost:5000) for more information.

```json
{
  "api": "Mobile Map Builder v0.1.0",
  "cluster": 27,
  "datasets": [
    "ottawa-ball-diamonds",
    "ottawa-splash-pads",
    "ottawa-outdoor-rinks",
    "ottawa-volleyball-courts",
    "ottawa-public-washrooms",
    "ottawa-wards"
  ],
  "http": [
    {
      "example": "/13/2375/5256/extent.geojson",
      "method": "GET",
      "url": "/{zoom}/{x}/{y}/extent(.json|.geojson|.osm)"
    },
    {
      "example": "/13/2375/5256/ottawa-ball-diamonds.osm",
      "method": "GET",
      "url": "/{zoom}/{x}/{y}/<dataset>(.json|.geojson|.osm)"
    }
  ],
  "ok": true,
  "status": 200
}
```