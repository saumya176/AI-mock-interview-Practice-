const router = require('express').Router()
const { upload, uploadResume } = require('../controllers/resumeController')
const { verifyJWT } = require('../middleware/auth')

router.post('/upload', verifyJWT, upload.single('file'), uploadResume)

module.exports = router
