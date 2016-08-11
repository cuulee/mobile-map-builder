import test from 'ava'
import MBTiles from '../app/utils/MBTiles'

test('MBTiles', t => {
  const mbtiles = new MBTiles('test.mbtiles')
  t.pass()
})

test('MBTiles', t => {
  const mbtiles = new MBTiles('tiles.mbtiles')
  mbtiles.metadata({
    center: [-18.7, 65, 7],
    bounds: [-27, 62, -11, 67.5],
    minzoom: 1,
    maxzoom: 18
  })
  t.pass()
})