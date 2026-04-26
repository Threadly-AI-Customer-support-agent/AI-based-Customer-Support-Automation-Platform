import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import prisma from "../lib/prisma.js"
import redis from "../lib/redis.js"
import authMiddleware from "../middleware/authMiddleware.js" 

const router = express.Router()

// ## REGISTER
router.post("/register", [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { email, password, role } = req.body

    // Only CUSTOMER registration is allowed — agents are created by admins
    if (role && role !== "CUSTOMER") {
      return res.status(403).json({ message: "Only customer registration is allowed" })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "CUSTOMER",
      },
    })

    res.status(201).json({
      message: "Register successful",
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// ## LOGIN
router.post("/login", [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// ## TEST 3: ME (Protected Route)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // req.user middleware se aa raha hai
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, createdAt: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
});

// ## TEST 4: LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(400).json({ message: "No token provided" })

    // Token ko blacklist mein dalo (Redis) — skip if Redis is down
    try {
      await redis.set(`blacklist_${token}`, "true", { EX: 604800 })
    } catch (err) {
      console.warn("Could not blacklist token in Redis:", err.message)
    }
    res.json({ message: "Logout successful" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router