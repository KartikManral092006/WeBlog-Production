import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import dns from 'dns/promises'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!connectionString) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL in environment.')
}

const isNeon = connectionString.includes('.neon.tech')

function isPrivateIpv4(address) {
  const [a, b] = address.split('.').map(Number)

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  )
}

async function createPool() {
  if (!isNeon) {
    return new pg.Pool({ connectionString })
  }

  const url = new URL(connectionString)
  const addresses = await dns.lookup(url.hostname, { family: 4, all: true })
  const publicAddress = addresses.find(({ address }) => !isPrivateIpv4(address))?.address

  if (!publicAddress) {
    throw new Error(`Could not resolve a public IPv4 address for ${url.hostname}`)
  }

  return new pg.Pool({
    host: publicAddress,
    port: Number(url.port || 5432),
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: {
      rejectUnauthorized: false,
      servername: url.hostname,
    },
  })
}

const pool = await createPool()
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
