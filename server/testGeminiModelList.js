require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.GEMINI_API_KEY
const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`

axios.get(url, { timeout: 20000 })
  .then(res => {
    console.log('MODELS', JSON.stringify(res.data, null, 2))
  })
  .catch(err => {
    console.error('ERROR', err.message)
    if(err.response) console.error(JSON.stringify(err.response.data, null, 2))
    process.exit(1)
  })
