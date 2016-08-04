import * as sqlite3 from 'sqlite3'
import * as fs from 'fs'
import { range } from 'lodash'

// Set up DB
sqlite3.verbose()
const db = new sqlite3.Database('test.db')
console.log(db)

// Create Tables
db.serialize(() => {
  db.run("CREATE TABLE lorem (info TEXT)")

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)")

  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i)
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
      console.log(`${ row.id }:${ row.info }`)
  })
})

db.close()