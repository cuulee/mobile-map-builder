import { isUndefined } from 'lodash'
import * as turf from '@turf/turf'
import * as fs from 'fs'
import { bboxLatLngToMeters } from '../app/GlobalMercator'
import * as minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
console.log(argv)

// gdalwarp -of GTiff -te -8581121.501851652 -1353354.7654779512 -8575634.45283096 -1349909.177990999 lima_imagery.mbtiles lima_imagery.tif
const bbox = JSON.parse(argv['bbox'])
const source = argv['source']
const target = argv['target']
const cellSize = JSON.parse(argv['cellSize'])

if (isUndefined(bbox)) { throw new Error('--bbox is required') }
if (isUndefined(source)) { throw new Error('--source is required') }
if (isUndefined(target)) { throw new Error('--target is required') }
if (isUndefined(cellSize)) { throw new Error('--cellSize is required') }

// Create Grid using LatLng
const grid = turf.squareGrid(bbox, cellSize)

console.log(grid)

// Create Grid file using LatLng
fs.writeFileSync('grid.geojson', JSON.stringify(grid, null, 4))

let count = 0
const commands: string[] = []
for (const feature of grid.features) {
  count ++
  const bboxMeters = bboxLatLngToMeters(turf.bbox(feature)).join(' ')
  const targetFeature = target.replace(/.tif/, `_${ count }.tif`)

  commands.push(`gdalwarp -of GTiff -te ${  bboxMeters } ${ source } ${ targetFeature }`)
  commands.push(`gdal_translate -of GTiff -b 1 -b 2 -b 3 -co "TILED=YES" -co JPEG_QUALITY=80 -co COMPRESS=JPEG ${ targetFeature } compress_${ targetFeature }`)
  commands.push(`gdaladdo -r average compress_${ targetFeature } 2 4 8 16`)
}
fs.writeFileSync('commands.sh', commands.join('\n'))
