const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function verifyJWT(req,res,next){
  let token = null
  const auth = req.headers.authorization
  if(auth && auth.split(' ')[1]) token = auth.split(' ')[1]
  if(!token && req.cookies && req.cookies.token) token = req.cookies.token
  if(!token) return res.status(401).json({message:'No token'})
  if(!process.env.JWT_SECRET) return res.status(503).json({message:'Server auth is not configured'})
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(payload.sub)
    if(!req.user) return res.status(401).json({message:'User not found'})
    next()
  }catch(e){
    return res.status(401).json({message:'Invalid token'})
  }
}

module.exports = { verifyJWT }
