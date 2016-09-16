import * as turf from '@turf/turf'
import { isUndefined } from 'lodash'
import { Router, Request, Response } from 'express'
import Tile from '../Tile'
import debug from '../debug'
import { configs, downloadDatasets } from '../configs'
import { geojson2osm } from 'geojson2osm'
import * as concaveman from 'concaveman'

const router = Router()
export const cache: any = {}
export const datasets = downloadDatasets()

const parseOSM = (results: GeoJSON.FeatureCollection<any>) : string => {
  return geojson2osm(results).replace(/changeset="false"/g, 'action=\"modifiy\"')
}

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
 * CONFIGS
 */
router.route('/')
  .all((req: Request, res: Response) => {
    res.json(configs.datasets)
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
        error: 'Invalid dataset',
        message: 'URL does not match any of the avaiable datasets',
        ok: false,
        status_code: 500,
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
      const polygon = turf.polygon([concaveman(points)], {
        algorithm: 'Mapbox concaveman',
        dataset: req.params.dataset,
        type: 'extent',
      })
      // Save results to cache
      results = turf.featureCollection([polygon])
      cache[url] = results
    }

    // Output as GeoJSON or OSM
    if (req.params.ext === '.json' || req.params.ext === '.geojson') {
      res.json(results)
    // Parse GeoJSON to OSM
    } else {
      res.set('Content-Type', 'text/xml')
      res.send(parseOSM(results))
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
      res.set('Content-Type', 'text/xml')
      res.send(parseOSM(dataset))
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
      res.set('Content-Type', 'text/xml')
      res.send(parseOSM(extent))
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
        error: 'Invalid dataset',
        message: 'URL does not match any of the avaiable datasets',
        ok: false,
        status_code: 500,
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
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'LineString') {
            if (!!turf.intersect(feature, extent)) { container.push(feature) }

          // Parsing Multi Polygon
          } else if (feature.geometry.type === 'MultiPolygon') {
            const multi: GeoJSON.Feature<GeoJSON.MultiPolygon> = feature
            multi.geometry.coordinates.map(poly => {
              const polygon = turf.polygon(poly)
              if (!!turf.intersect(polygon, extent)) { container.push(polygon) }
            })
          } else {
            return res.status(500).json({
              error: 'Invalid dataset geometry',
              message: `${ feature.geometry.type }: Dataset's geometry could not be parsed`,
              ok: false,
              status_code: 500,
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
      res.set('Content-Type', 'text/xml')
      res.send(parseOSM(results))
    }
  })

export default router
