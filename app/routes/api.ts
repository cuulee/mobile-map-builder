import * as turf from 'turf'
import { Router, Request, Response } from 'express'
import { worker } from 'cluster'
import * as rp from 'request-promise'
import Tile from '../Tile'

const geojson2osm = require('geojson2osm')
const router = Router()

router.route('/')
  .all((req: Request, res: Response) => {
    res.json({
      api: 'Mobile Map Bundler v1.0.0',
      cluster: worker.process.pid,
      http: [
        { method: 'GET', url: '/{zoom}/{x}/{y}/ball-diamonds.osm' },
      ],
      ok: true,
      status: 200,
    })
  })

router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)/ball-diamonds.osm')
  .get(async (req: Request, res: Response) => {
    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    const collection = turf.featureCollection([ poly ])

    // Download Dataset
    const url = 'http://data.ottawa.ca/dataset/cad648df-85d9-45e9-a573-914dc7c00b74/resource/' +
                'fcc7bdf7-dc8b-4396-be5b-db3e2dab41d3/download/ball-diamonds.json'
    const data = JSON.parse(await rp.get(url))

    // Only find points within
    const within = turf.within(data, collection)

    // Parse GeoJSON to OSM
    const osm = geojson2osm.geojson2osm(within)
    res.set('Content-Type', 'text/xml')
    res.send(osm)
  })

export default router
