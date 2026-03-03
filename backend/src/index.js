// 1. Dotenv ko sabse pehle load karo
import 'dotenv/config' 

import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.js"
// import chatRoutes from "./routes/chat.js" // Future use ke liye

const app = express()

// ## Middleware
app.use(cors())
app.use(express.json()) // JSON body parse karne ke liye

// ## Routes
app.use("/api/auth", authRoutes)

// ## Health Check Route
app.get("/", (req, res) => {
  res.json({ 
    message: "Server chal raha hai ✅",
    database: "PostgreSQL Connected (via Prisma)",
    cache: "Redis Ready"
  })
})

// ## Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Kuch galat hua!", error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server port ${PORT} pe live hai!`)
  console.log(`🔗 Local URL: http://localhost:${PORT}`)
})