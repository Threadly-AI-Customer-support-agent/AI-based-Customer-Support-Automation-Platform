import redis from './redis.js'

const CACHE_TTL = 60 * 60

export const setCache = async (key, data) => {
  try {
    await redis.set(key, JSON.stringify(data), { EX: CACHE_TTL })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export const getCache = async (key) => {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export const deleteCache = async (key) => {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}