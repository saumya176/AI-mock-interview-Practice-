require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.GEMINI_API_KEY

async function main(){
  const modelUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash?key=${API_KEY}`
  try {
    const info = await axios.get(modelUrl, { timeout: 20000 })
    console.log('MODEL INFO', JSON.stringify(info.data, null, 2))
  } catch (err) {
    console.error('MODEL INFO ERR', err.response ? JSON.stringify(err.response.data, null, 2) : err.message)
  }

  try {
    const genUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`
    const res = await axios.post(genUrl, {
      contents: [{ role: 'user', parts: [{ text: 'Test JSON output' }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 50 }
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 })
    console.log('GENERATE OK', JSON.stringify(res.data, null, 2))
  } catch (err) {
    console.error('GENERATE ERR', err.response ? JSON.stringify(err.response.data, null, 2) : err.message)
  }
}

main()
