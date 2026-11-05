/** The admin password, kept as a scrypt hash (never the password itself). */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { passwordFile } from './store.mjs'

const PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LENGTH = 32

const derive = (password, salt, params) =>
  new Promise((resolve, reject) => scrypt(password, salt, KEY_LENGTH, params, (error, key) => (error ? reject(error) : resolve(key))))

export const MIN_LENGTH = 10

export const passwordIsSet = () => existsSync(passwordFile)

export async function setPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) throw new Error(`at least ${MIN_LENGTH} characters`)
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS)
  await mkdir(dirname(passwordFile), { recursive: true })
  const record = { scrypt: { N: PARAMS.N, r: PARAMS.r, p: PARAMS.p }, salt: salt.toString('base64'), hash: key.toString('base64') }
  // (written aside then swapped in: the admin never reads half a file; readable by its owner only)
  const tmp = `${passwordFile}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(record)}\n`, { mode: 0o600 })
  await rename(tmp, passwordFile)
}

export async function checkPassword(password) {
  if (typeof password !== 'string' || !passwordIsSet()) return false
  const record = JSON.parse(await readFile(passwordFile, 'utf8'))
  const expected = Buffer.from(record.hash, 'base64')
  const key = await derive(password, Buffer.from(record.salt, 'base64'), { ...record.scrypt, maxmem: PARAMS.maxmem })
  return key.length === expected.length && timingSafeEqual(key, expected)
}
