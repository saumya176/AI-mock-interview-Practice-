require('dotenv').config()
const axios = require('axios')

const API_KEY = process.env.GEMINI_API_KEY
const targets = [
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent'
]

const bodies = [
  {contents: [{parts: [{text: 'Hello world'}]}], generationConfig: {temperature: 0.5, maxOutputTokens: 16}},
  {contents: [{role: 'user', parts: [{text: 'Hello world'}]}], generationConfig: {temperature: 0.5, maxOutputTokens: 16}},
  {contents: [{role: 'user', parts: [{text: 'Hello world'}]}]},
]

async function run(){
  for(const url of targets){
    for(const body of bodies){
      try{
        console.log('TRY', url, JSON.stringify(body))
        const res = await axios.post(`${url}?key=${API_KEY}`, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000
        })
        console.log('OK', url, JSON.stringify(body), res.status, JSON.stringify(res.data, null, 2))
      }catch(err){
        console.error('ERR', url, JSON.stringify(body), err.message)
        if(err.response) console.error('BODY', JSON.stringify(err.response.data, null, 2))
      }
    }
  }
}

run()
