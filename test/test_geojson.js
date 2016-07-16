import test from 'ava'
import GeoJSON from '../app/utils/GeoJSON'
import { GOOGLE } from './globals'

test('GeoJSON', async t => {
  const geojson = new GeoJSON(GOOGLE)
  t.pass()
})
