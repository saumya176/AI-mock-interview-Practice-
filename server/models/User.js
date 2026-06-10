const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  firebaseId: {type:String, index:true},
  name: String,
  email: {type:String, index:true},
  avatar: String,
  createdAt: {type:Date, default: Date.now}
})

module.exports = mongoose.model('User', UserSchema)
