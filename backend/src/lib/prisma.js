import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL in environment.')
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
