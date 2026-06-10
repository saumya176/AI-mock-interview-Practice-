require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const connectDB = require('./config/db')

const cookieParser = require('cookie-parser')
const app = express()
connectDB()

app.use(helmet())

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json())
app.use(cookieParser())

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 })
app.use(limiter)

// routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/interviews', require('./routes/interviews'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/resume', require('./routes/resume'))
app.use('/api/dashboard', require('./routes/dashboard'))

// global error handler
app.use((err, req, res, next)=>{
  console.error(err)
  res.status(err.status||500).json({message: err.message||'Server error'})
})

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log(`Server running on ${port}`))
