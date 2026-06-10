const jwt = require('jsonwebtoken')
const User = require('../models/User')
const admin = require('../firebaseAdmin')

async function firebaseSignIn(req, res, next){
  const { idToken } = req.body
  if(!idToken) return res.status(400).json({message:'idToken required'})
  try{
    // verify with firebase admin (if initialized)
    let decoded = null
    if(admin && admin.auth && admin.auth().verifyIdToken){
      decoded = await admin.auth().verifyIdToken(idToken)
    } else if(process.env.NODE_ENV !== 'production') {
      decoded = { uid: idToken, name: 'Dev User', email: 'dev@example.com' }
    } else {
      return res.status(503).json({ message: 'Firebase authentication is not configured' })
    }

    let user = await User.findOne({ firebaseId: decoded.uid })
    if(!user){
      user = await User.create({ firebaseId: decoded.uid, name: decoded.name || 'User', email: decoded.email })
    }

    const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    // set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7*24*3600*1000
    })
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } })
  }catch(e){ next(e) }
}

async function me(req,res,next){
  try{
    if(!req.user) return res.status(401).json({message:'Not authenticated'})
    const user = req.user
    res.json({ user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } })
  }catch(e){next(e)}
}

module.exports = { firebaseSignIn, me }
