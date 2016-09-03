import * as turf from 'turf'
import { Router, Request, Response } from 'express'
import { worker } from 'cluster'
import * as rp from 'request-promise'
import Tile from '../Tile'
import debug from '../debug'

const geojson2osm = require('geojson2osm')
const router = Router()

async function downloadData(url: string): Promise<GeoJSON.FeatureCollection<any>> {
  debug.download(url)
  return rp.get(url)
    .then(
      data => JSON.parse(data),
      error => { if (error) { debug.error(error.message) }}
    )
}

const ballDiamonds = downloadData(
  'http://data.ottawa.ca/dataset/cad648df-85d9-45e9-a573-914dc7c00b74/resource/' +
  'fcc7bdf7-dc8b-4396-be5b-db3e2dab41d3/download/ball-diamonds.json')

router.route('/')
  .all((req: Request, res: Response) => {
    res.json({
      api: 'Mobile Map Bundler v1.0.0',
      cluster: worker.process.pid,
      http: [
        { method: 'GET', url: '/{zoom}/{x}/{y}(.json|.geojson|.osm)' },
        { method: 'GET', url: '/{zoom}/{x}/{y}/extent(.json|.geojson|.osm)' },
        { method: 'GET', url: '/{zoom}/{x}/{y}/ball-diamonds(.json|.geojson|.osm)'},
      ],
      ok: true,
      status: 200,
    })
  })

router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)(/extent(.osm|)|.osm|)')
  .get(async (req: Request, res: Response) => {
    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    poly.properties = tile
    poly.bbox = tile.bbox
    const collection = turf.featureCollection([ poly ])

    // Parse OSM
    const osm = geojson2osm.geojson2osm(collection)
    res.set('Content-Type', 'text/xml')
    res.send(osm)
  })

router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)(/extent(.json|.geojson)|(.json|.geojson))')
  .get(async (req: Request, res: Response) => {
    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    poly.properties = tile
    poly.bbox = tile.bbox
    const collection = turf.featureCollection([ poly ])
    res.json(collection)
  })

router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)/ball-diamonds(.json|.geojson)')
  .get(async (req: Request, res: Response) => {
    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    const collection = turf.featureCollection([ poly ])

    // Only find points within
    const within = turf.within(await ballDiamonds, collection)
    res.json(within)
  })

router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)/ball-diamonds(.osm|)')
  .get(async (req: Request, res: Response) => {
    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    const collection = turf.featureCollection([ poly ])

    // Only find points within
    const within = turf.within(await ballDiamonds, collection)

    // Parse GeoJSON to OSM
    const osm = geojson2osm.geojson2osm(within)
    res.set('Content-Type', 'text/xml')
    res.send(osm)
  })

export default router
