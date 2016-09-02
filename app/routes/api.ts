import * as fs from 'fs'
import * as turf from 'turf'
import { Router } from 'express'
import { worker } from 'cluster'
import * as rp from 'request-promise'
import Tile from '../Tile'
import debug from '../debug'

const geojson2osm = require('geojson2osm')
const router = Router()

router.route('/')
  .all((request: any, response: any) => {
    response.json({
      api: 'Data Generator',
      cluster: worker.process.pid,
      http: [
        { method: 'GET', url: '/product' },
        { method: 'GET', url: '/token' },
        { method: 'GET', url: '/user' },
      ],
      message: 'Demonstrates the Data Generator API, yay!!',
      ok: true,
      status: 200,
    })
  })

router.route('/:zoom/:tile_column/:tile_row/ball-diamonds.osm')
  .get(async (request: any, response: any) => {
    // Build Tile
    const tile = new Tile(request.params)
    const polygon = turf.polygon(tile.geometry.coordinates)
    const collection = turf.featureCollection([polygon])

    // Download Dataset
    const url = 'http://data.ottawa.ca/dataset/cad648df-85d9-45e9-a573-914dc7c00b74/resource/' +
                'fcc7bdf7-dc8b-4396-be5b-db3e2dab41d3/download/ball-diamonds.json'
    const data = JSON.parse(await rp.get(url))

    // Only find points within
    const within = turf.within(data, collection)

    // Parse GeoJSON to OSM
    const osm = geojson2osm.geojson2osm(within)
    response.set('Content-Type', 'text/xml')
    response.send(osm)
  })

export default router
