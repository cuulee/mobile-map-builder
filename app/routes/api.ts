import * as turf from 'turf'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import { keys } from 'lodash'
import { Router, Request, Response } from 'express'
import { worker } from 'cluster'
import * as rp from 'request-promise'
import Tile from '../Tile'
import debug from '../debug'
import { geojson2osm } from 'geojson2osm'

const concaveman = require('concaveman')
const lineToPolygon = require('turf-line-to-polygon')
const router = Router()

interface InterfaceRequest extends Request {
  params: {
    ext: string
    tile_row: number
    tile_column: number
    zoom: number
    dataset: string
  }
}

async function downloadData(url: string): Promise<GeoJSON.FeatureCollection<any>> {
  debug.download(url)
  return rp.get(url)
    .catch(error => debug.log('URL Connection', url, error))
    .then(data => JSON.parse(data.trim()))
    .catch(error => debug.error('JSON.parse', url, error))
}

// Build datasets
const datasets: any = {}
const data = yaml.safeLoad(fs.readFileSync(`${ __dirname }/../../configs/data.yml`, 'utf8'))
keys(data).map(key => {
  datasets[key] = downloadData(data[key])
})

/**
 * Documentation for API
 */
router.route('/')
  .all((req: Request, res: Response) => {
    res.json({
      api: 'Mobile Map Builder v0.1.0',
      cluster: (worker) ? worker.process.pid : undefined,
      datasets: keys(data),
      http: [
        { example: '/ottawa-ball-diamonds.geojson',
          method: 'GET',
          url: '/<dataset>(.json|.geojson|.osm)'},
        { example: '/ottawa-ball-diamonds.geojson',
          method: 'GET',
          url: '/<dataset>/extent(.json|.geojson|.osm)'},
        { example: '/13/2375/5256/extent.geojson',
          method: 'GET',
          url: '/{zoom}/{x}/{y}/extent(.json|.geojson|.osm)'},
        { example: '/13/2375/5256/ottawa-ball-diamonds.osm',
          method: 'GET',
          url: '/{zoom}/{x}/{y}/<dataset>(.json|.geojson|.osm)' },
      ],
      ok: true,
      status: 200,
    })
  })

/**
 * Retrieves Geographical Extent of entire Dataset
 */
router.route('/:dataset([\da-zA-Z_\-]+)/extent:ext(.json|.geojson|.osm|)')
  .get(async (req: InterfaceRequest, res: Response) => {
    debug.server({ dataset: req.params.dataset, ext: req.params.ext })

    const dataset: GeoJSON.FeatureCollection<GeoJSON.Point> = await datasets[req.params.dataset]

    if (dataset.features[0].geometry.type === 'Point') {
      const points: number[][] = []
      dataset.features.map(feature => points.push(feature.geometry.coordinates))
      const hull: number[][] = concaveman(points)
      const line: GeoJSON.Feature<GeoJSON.LineString> = turf.lineString(hull)
      const poly: GeoJSON.Feature<GeoJSON.Polygon> = lineToPolygon(line)
      const collection = turf.featureCollection([poly])

      poly.properties = {
        algorithm: 'Mapbox concaveman',
        dataset: req.params.dataset,
        type: 'extent',
      }
      // Output as GeoJSON or OSM
      if (req.params.ext === '.json' || req.params.ext === '.geojson') {
        res.json(collection)
      // Parse GeoJSON to OSM
      } else {
        const osm = geojson2osm(collection)
        res.set('Content-Type', 'text/xml')
        res.send(osm)
      }
    } else {
      const message = 'Cannot process exent for polygons shapes'
      debug.error(message)
      res.json({
        error: message,
        ok: false,
        status_code: 500,
      })
    }
  })

/**
 * Retrieves full dataset
 */
router.route('/:dataset([\da-zA-Z_\-]+):ext(.json|.geojson|.osm|)')
  .get(async (req: InterfaceRequest, res: Response) => {
    debug.server({ dataset: req.params.dataset, ext: req.params.ext })

    const dataset: GeoJSON.FeatureCollection<any> = await datasets[req.params.dataset]

    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(dataset)
    // Parse GeoJSON to OSM
    } else {
      const osm = geojson2osm(dataset)
      res.set('Content-Type', 'text/xml')
      res.send(osm)
    }
  })

/**
 * Retrieves Geographical Extent of Tile
 */
router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)/extent:ext(.json|.geojson|.osm|)')
  .get(async (req: InterfaceRequest, res: Response) => {
    debug.server({ ext: req.params.ext })

    // Build Tile
    const tile = new Tile(req.params)
    const poly = turf.bboxPolygon(tile.bbox)
    poly.properties = tile
    poly.bbox = tile.bbox
    const extent = turf.featureCollection([poly])

    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(extent)
    // Parse GeoJSON to OSM
    } else {
      const osm = geojson2osm(extent)
      res.set('Content-Type', 'text/xml')
      res.send(osm)
    }
  })

/**
 * Retrieves data within Tile
 */
router.route('/:zoom(\\d+)/:tile_column(\\d+)/:tile_row(\\d+)/:dataset([\da-zA-Z_\-]+):ext(.json|.geojson|.osm|)')
  .get(async (req: InterfaceRequest, res: Response) => {
    debug.server({ dataset: req.params.dataset, ext: req.params.ext })

    // Build Tile
    const tile = new Tile(req.params)
    const extent = turf.bboxPolygon(tile.bbox)
    const dataset: GeoJSON.FeatureCollection<any> = await datasets[req.params.dataset]

    // Filter by Within or intersect
    let within: GeoJSON.FeatureCollection<any>
    if (dataset.features[0].geometry.type === 'Point') {
      within = turf.within(dataset, turf.featureCollection([extent]))
    } else {
      const intersect = dataset.features.filter(feature => turf.intersect(feature, extent) )
      within = turf.featureCollection(intersect)
    }

    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(within)
    // Parse GeoJSON to OSM
    } else {
      const osm = geojson2osm(within)
      res.set('Content-Type', 'text/xml')
      res.send(osm)
    }
  })

export default router
