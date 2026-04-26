import jwt from "jsonwebtoken"
import redis from "../lib/redis.js"
import { getRedisStatus } from "../lib/redis.js"

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    // Check if token is blacklisted in Redis (skip if Redis is down)
    if (getRedisStatus()) {
      try {
        const isBlacklisted = await redis.get(`blacklist_${token}`)
        if (isBlacklisted) {
          return res.status(401).json({ message: "Token has been revoked" })
        }
      } catch (err) {
        console.warn("Redis blacklist check skipped:", err.message)
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export default authMiddleware