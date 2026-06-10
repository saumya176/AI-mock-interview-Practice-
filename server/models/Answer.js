const mongoose = require('mongoose')

const AnswerSchema = new mongoose.Schema({
  interview: {type: mongoose.Schema.Types.ObjectId, ref: 'Interview'},
  questionId: String,
  text: String,
  score: Number,
  feedback: String
})

module.exports = mongoose.model('Answer', AnswerSchema)
