const router = require('express').Router()
const { verifyJWT } = require('../middleware/auth')
const ctrl = require('../controllers/aiController')

router.post('/questions', verifyJWT, ctrl.generateQuestions)
router.post('/evaluate', verifyJWT, ctrl.evaluateAnswer)
router.post('/report', verifyJWT, ctrl.finalReport)

module.exports = router
