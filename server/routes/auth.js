const router = require('express').Router()
const { firebaseSignIn, me } = require('../controllers/authController')
const { verifyJWT } = require('../middleware/auth')

router.post('/firebase', firebaseSignIn)
router.get('/me', verifyJWT, me)

module.exports = router
