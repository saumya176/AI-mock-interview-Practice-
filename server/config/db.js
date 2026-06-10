const mongoose = require('mongoose')

module.exports = async function connectDB(){
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aimock'
  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    if (process.env.NODE_ENV === 'production') process.exit(1)
  }
  mongoose.connection.on('error', (e) => console.error('MongoDB error', e))
}
