const mongoose = require('mongoose')

const InterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewId: { type: String, index: true },
  role: { type: String },
  interviewType: { type: String },
  difficulty: { type: String },
  selectedSkills: [{ type: String }],
  duration: { type: Number },
  totalScore: { type: Number },
  technicalScore: { type: Number },
  communicationScore: { type: Number },
  confidenceScore: { type: Number },
  status: { type: String, default: 'InProgress' },
  completedAt: { type: Date },
  questions: [{
    questionId: String,
    question: String,
    answer: String,
    score: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    expectedPoints: [String],
    coveredPoints: [String],
    missedPoints: [String]
  }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  improvementSuggestions: [{ type: String }],
  config: { type: Object },
  companyTarget: { type: String },
  resumeAnalysis: { type: Object },
  generatedQuestions: [{
    id: String,
    question: String,
    category: String,
    difficulty: String,
    expectedTopics: [String]
  }],
  geminiConfig: { type: Object },
  seed: { type: Number },
  score: Number,
  overallScore: Number,
  weak: String,
  weakAreas: [{ type: String }],
  strongAreas: [{ type: String }],
  feedback: Object,
  transcript: String,
  geminiReport: {
    overallScore: Number,
    strengths: [String],
    improvements: [String],
    questions: [{
      questionId: String,
      answer: String,
      score: Number,
      feedback: String,
      expectedPoints: [String],
      coveredPoints: [String],
      missedPoints: [String]
    }]
  },
  createdAt: { type: Date, default: Date.now }
})

InterviewSchema.pre('save', function(next){
  if(!this.interviewId){
    this.interviewId = `IV-${Date.now()}`
  }
  if(!this.completedAt && String(this.status || '').toLowerCase() === 'completed'){
    this.completedAt = this.createdAt || new Date()
  }
  next()
})

module.exports = mongoose.model('Interview', InterviewSchema)
