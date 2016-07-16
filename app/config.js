import os from 'os'
import uuid from 'node-uuid'

export const PORT = process.env.PORT || 5000
export const SECRET = process.env.SECRET || uuid.v4()
export const CORES = process.env.CORES || os.cpus().length
