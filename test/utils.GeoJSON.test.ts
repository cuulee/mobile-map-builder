import test from 'ava'
import GeoJSON from '../app/GeoJSON'
import { GOOGLE } from './globals'

test('GeoJSON', t => {
  const geojson = new GeoJSON(GOOGLE)
  t.true(!!geojson)
})
