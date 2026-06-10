let hasGoogleSdk = false
let TextServiceClient = null
try{
  const sdk = require('@google/generative-ai')
  TextServiceClient = sdk.v1beta2?.TextServiceClient || sdk.TextServiceClient || sdk.v1?.TextServiceClient
  if(TextServiceClient) hasGoogleSdk = true
}catch(e){ hasGoogleSdk = false }

const axios = require('axios')

async function callGeminiWithSdk(prompt, generationConfig = {}, model = process.env.GOOGLE_GEMINI_MODEL || 'models/gemini-1.5-pro'){
  if(!hasGoogleSdk) throw new Error('Google generative-ai SDK not installed')
  const client = new TextServiceClient({})
  const request = {
    model,
    prompt: { text: prompt },
    temperature: generationConfig.temperature || 1,
    maxOutputTokens: generationConfig.maxOutputTokens || 1200
  }
  // SDK method may differ across versions; try generateText or generate
  if(typeof client.generateText === 'function'){
    const [response] = await client.generateText(request)
    return response
  }
  if(typeof client.generate === 'function'){
    const [response] = await client.generate(request)
    return response
  }
  throw new Error('Unsupported SDK client interface')
}

async function callGeminiWithHttp(prompt, generationConfig = {}, model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-pro'){
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if(!API_KEY) throw new Error('No API key for Gemini')
  // fallback to REST
  const modelPath = model.startsWith('models/') ? model : `models/${model}`
  const url = `https://generativelanguage.googleapis.com/v1beta2/${modelPath}:generate`
  const payload = {
    prompt: { text: prompt },
    temperature: generationConfig.temperature || 1,
    maxOutputTokens: generationConfig.maxOutputTokens || 1200,
    topP: generationConfig.topP,
    topK: generationConfig.topK
  }
  const res = await axios.post(`${url}?key=${API_KEY}`, payload, { timeout: 30000 })
  return res.data
}

async function generateText(prompt, generationConfig = {}, model){
  try{
    if(hasGoogleSdk){
      const res = await callGeminiWithSdk(prompt, generationConfig, model)
      return res
    }
  }catch(e){
    // fallthrough to HTTP
  }
  return await callGeminiWithHttp(prompt, generationConfig, model)
}

module.exports = { generateText }
