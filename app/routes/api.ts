import * as turf from 'turf'
import { keys, isUndefined } from 'lodash'
import { Router, Request, Response } from 'express'
import { worker } from 'cluster'
import Tile from '../Tile'
import debug from '../debug'
import { downloadDatasets } from '../configs'
import { geojson2osm } from 'geojson2osm'

const concaveman = require('concaveman')
const lineToPolygon = require('turf-line-to-polygon')
const router = Router()
const cache: any = {}
const datasets = downloadDatasets()

interface InterfaceRequest extends Request {
  params: {
    ext: string
    tile_row: number
    tile_column: number
    zoom: number
    dataset: string
  }
}

/**
 * Documentation for API
 */
router.route('/')
  .all((req: Request, res: Response) => {
    res.json({
      api: 'Mobile Map Builder v0.1.0',
      cluster: (worker) ? worker.process.pid : undefined,
      datasets: keys(datasets),
      http: {
        GET: [
          '/<dataset>(.json|.geojson|.osm)',
          '/<dataset>/extent(.json|.geojson|.osm)',
          '/{zoom}/{x}/{y}/extent(.json|.geojson|.osm)',
          '/{zoom}/{x}/{y}/<dataset>(.json|.geojson|.osm)' 
        ]
      },
      ok: true,
      status: 200,
    })
  })

/**
 * Retrieves Geographical Extent of entire Dataset
 */
router.route('/:dataset([\da-zA-Z_\-]+)/extent:ext(.json|.geojson|.osm|)')
  .get((req: InterfaceRequest, res: Response) => {
    // Define URL
    const url = req.url.replace(/\.[json|geojson|osm]+/, '')
    debug.server(url)

    // Check if datasets is available
    if (isUndefined(datasets[req.params.dataset])) {
      return res.status(500).json({
        ok: false,
        status_code: 500,
        message: 'URL does not match any of the avaiable datasets',
        error: 'Invalid dataset',
      })
    }
    // Set up Cache
    let results: GeoJSON.FeatureCollection<any> = cache[url]
    debug.server(`cache: ${ !isUndefined(results) }`)

    if (isUndefined(results)) {
      // Converts feature collection into single points
      let dataset: GeoJSON.FeatureCollection<any> = datasets[req.params.dataset]
      dataset = turf.explode(dataset)
      const points: number[][] = []
      dataset.features.map(feature => points.push(feature.geometry.coordinates))

      // Calculate extent
      const hull: number[][] = concaveman(points)
      const line: GeoJSON.Feature<GeoJSON.LineString> = turf.lineString(hull)
      const poly: GeoJSON.Feature<GeoJSON.Polygon> = lineToPolygon(line, {
        algorithm: 'Mapbox concaveman',
        dataset: req.params.dataset,
        type: 'extent',
      })
      // Save results to cache
      results = turf.featureCollection([poly])
      cache[url] = results
    }

    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(results)
    // Parse GeoJSON to OSM
    } else {
      const osm = geojson2osm(results)
      res.set('Content-Type', 'text/xml')
      res.send(osm)
    }
  })

/**
 * Retrieves full dataset
 */
router.route('/:dataset([\da-zA-Z_\-]+):ext(.json|.geojson|.osm|)')
  .get(async (req: InterfaceRequest, res: Response) => {
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
    const url = req.url.replace(/\.[json|geojson|osm]+/, '')
    debug.server(url)

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
    const url = req.url.replace(/\.[json|geojson|osm]+/, '')
    debug.server(url)

    // Check if datasets is available
    if (isUndefined(datasets[req.params.dataset])) {
      return res.status(500).json({
        ok: false,
        status_code: 500,
        message: 'URL does not match any of the avaiable datasets',
        error: 'Invalid dataset',
      })
    }
    // Set up Cache
    let results: GeoJSON.FeatureCollection<any> = cache[url]
    debug.server(`cache: ${ !isUndefined(results) }`)

    // Parse data without cache
    if (isUndefined(results)) {
      // Build Tile
      const tile = new Tile(req.params)
      const extent = turf.bboxPolygon(tile.bbox)
      const data: GeoJSON.FeatureCollection<any> = datasets[req.params.dataset]

      // Filter by Within or intersect
      if (data.features[0].geometry.type === 'Point') {
        debug.server('within')
        results = turf.within(data, turf.featureCollection([extent]))

      // Intersect by Polygons
      } else {
        debug.server('intersect')
        const container: GeoJSON.Feature<any>[] = []
        data.features.map(feature => {

          // Parsing single Polygon
          if (feature.geometry.type === 'Polygon') {
            if (!!turf.intersect(feature, extent)) { container.push(feature) }

          // Parsing Multi Polygon
          } else if (feature.geometry.type === 'MultiPolygon') {
            const multi: GeoJSON.Feature<GeoJSON.MultiPolygon> = feature
            multi.geometry.coordinates.map(poly => {
              const polygon = turf.polygon(poly)
              if (!!turf.intersect(polygon, extent)) { container.push(polygon) }
            })
          }
        })
        results = turf.featureCollection(container)
      }
      // Store in Cache
      cache[url] = results
    }
    debug.server(`results: ${ results.features.length }`)
    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(results)
    // Parse GeoJSON to OSM
    } else {
      const osm = geojson2osm(results)
      res.set('Content-Type', 'text/xml')
      res.send(osm)
    }
  })

export default router
