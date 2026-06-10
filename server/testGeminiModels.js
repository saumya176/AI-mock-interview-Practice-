require('dotenv').config()
const axios = require('axios')
const API_KEY = process.env.GEMINI_API_KEY
const models = [
  'gemini-1.5-pro',
  'gemini-1.5-mini',
  'gemini-1.5',
  'gemini-1.0',
  'text-bison-001',
  'text-bison-002'
]

async function testModel(model){
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generate?key=${API_KEY}`
  try{
    const res = await axios.post(url, { prompt: { text: 'Hello world' }, temperature: 0.5, maxOutputTokens: 10 }, { headers: { 'Content-Type':'application/json' } })
    console.log(model, 'OK', res.status)
    console.log(JSON.stringify(res.data, null, 2))
    return true
  }catch(err){
    console.error(model, 'ERROR', err.response?err.response.status:err.message)
    if(err.response) console.error(JSON.stringify(err.response.data, null, 2))
    return false
  }
}

;(async ()=>{
  for(const model of models){
    await testModel(model)
    console.log('---')
  }
})()
