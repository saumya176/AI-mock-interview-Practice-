const router = require('express').Router()
const { verifyJWT } = require('../middleware/auth')
const ctrl = require('../controllers/interviewController')

router.use(verifyJWT)
router.post('/', ctrl.createInterview)
router.post('/:id/answers', ctrl.saveAnswer)
router.patch('/:id', ctrl.updateInterview)
router.delete('/:id', ctrl.deleteInterview)
router.get('/history', ctrl.history)
router.get('/analytics', ctrl.analytics)
router.get('/:id', ctrl.details)

module.exports = router
