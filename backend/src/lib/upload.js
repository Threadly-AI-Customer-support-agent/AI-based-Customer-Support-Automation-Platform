import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure uploads folder exists
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove path traversal chars and spaces
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueName = `${Date.now()}-${safeName}`
    cb(null, uniqueName)
  }
})

// Image filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

// Audio filter — browsers send MIME types with codec suffixes (e.g. "audio/ogg; codecs=opus")
// so we use startsWith matching instead of exact equality
const audioFilter = (req, file, cb) => {
  const allowedPrefixes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/mp4']
  if (allowedPrefixes.some(prefix => file.mimetype.startsWith(prefix))) {
    cb(null, true)
  } else {
    cb(new Error('Only audio files are allowed'), false)
  }
}

// Image upload
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

// Audio upload
export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})