require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.GEMINI_API_KEY

async function main(){
  const listUrl = `https://generativelanguage.googleapis.com/v1beta2/models?key=${API_KEY}`
  try {
    const list = await axios.get(listUrl, { timeout: 20000 })
    console.log('V1BETA2 MODELS', JSON.stringify(list.data.models.map(m => m.name), null, 2))
  } catch (err) {
    console.error('LIST ERR', err.response ? JSON.stringify(err.response.data, null, 2) : err.message)
  }
  try {
    const genUrl = `https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-flash:generate?key=${API_KEY}`
    const res = await axios.post(genUrl, {
      prompt: { text: 'Hello world' },
      temperature: 0.2,
      maxOutputTokens: 50
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 })
    console.log('V1BETA2 GENERATE OK', JSON.stringify(res.data, null, 2))
  } catch (err) {
    console.error('V1BETA2 GENERATE ERR', err.response ? JSON.stringify(err.response.data, null, 2) : err.message)
  }
}

main()
