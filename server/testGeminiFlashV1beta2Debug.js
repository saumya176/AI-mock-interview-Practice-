require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.GEMINI_API_KEY

async function main(){
  const listUrl = `https://generativelanguage.googleapis.com/v1beta2/models?key=${API_KEY}`
  try {
    const list = await axios.get(listUrl, { timeout: 20000 })
    console.log('V1BETA2 LIST DATA', JSON.stringify(list.data, null, 2))
  } catch (err) {
    console.error('LIST ERROR MESSAGE', err.message)
    if(err.response){
      console.error('LIST ERROR STATUS', err.response.status)
      console.error('LIST ERROR BODY', JSON.stringify(err.response.data, null, 2))
    }
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
    console.error('GENERATE ERROR MESSAGE', err.message)
    if(err.response){
      console.error('GENERATE ERROR STATUS', err.response.status)
      console.error('GENERATE ERROR BODY', JSON.stringify(err.response.data, null, 2))
    }
  }
}

main()
