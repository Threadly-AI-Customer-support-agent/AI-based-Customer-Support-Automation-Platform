import { createClient } from "redis"

const redis = createClient({
  url: process.env.REDIS_URL,
})

let isRedisConnected = false

redis.on("error", (err) => {
  console.log("Redis Error:", err.message)
  isRedisConnected = false
})
redis.on("connect", () => {
  console.log("Redis Connected ✅")
  isRedisConnected = true
})
redis.on("end", () => {
  isRedisConnected = false
})

// Connect gracefully — don't crash if Redis is unavailable
try {
  await redis.connect()
} catch (err) {
  console.warn("Redis could not connect — running without cache:", err.message)
}

export const getRedisStatus = () => isRedisConnected
export default redis