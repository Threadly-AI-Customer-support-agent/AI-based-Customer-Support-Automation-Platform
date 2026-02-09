const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

// Routes middleware
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Local MongoDB Connected"))
    .catch(err => console.log("❌ Error: ", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));