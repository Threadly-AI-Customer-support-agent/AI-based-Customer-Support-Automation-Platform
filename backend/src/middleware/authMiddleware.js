import jwt from "jsonwebtoken"
import redis from "../lib/redis.js"
import { getRedisStatus } from "../lib/redis.js"

const authMiddleware = async (req, res, next) => {
  try {
    // Token header se lo
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Token nahi mila" })
    }

    // Redis mein check karo — blacklist mein toh nahi (skip if Redis is down)
    if (getRedisStatus()) {
      try {
        const isBlacklisted = await redis.get(`blacklist_${token}`)
        if (isBlacklisted) {
          return res.status(401).json({ message: "Token invalid hai" })
        }
      } catch (err) {
        console.warn("Redis blacklist check skipped:", err.message)
      }
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()

  } catch (error) {
    return res.status(401).json({ message: "Token galat hai" })
  }
}

export default authMiddleware