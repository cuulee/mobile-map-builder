[![Build Status](https://travis-ci.org/DenisCarriere/mobile-map-builder.svg?branch=master)](https://travis-ci.org/DenisCarriere/mobile-map-builder)
[![Coverage Status](https://coveralls.io/repos/github/DenisCarriere/mobile-map-builder/badge.svg?branch=master)](https://coveralls.io/github/DenisCarriere/mobile-map-builder?branch=master)

# Mobile Map Builder

An application that helps you build maps & data for mobile applications.

## Install

```bash
$ git clone git@github.com:DenisCarriere/mobile-map-builder.git
$ cd mobile-map-builder
$ npm install
```

## Quickstart

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

**Interactive** debugging will output to CLI

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
