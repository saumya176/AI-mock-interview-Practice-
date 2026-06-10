const router = require('express').Router()
const { verifyJWT } = require('../middleware/auth')
const ctrl = require('../controllers/dashboardController')

router.get('/overview', verifyJWT, ctrl.overview)
router.get('/charts', verifyJWT, ctrl.charts)
router.get('/recommendations', verifyJWT, ctrl.recommendations)
router.get('/recent-interviews', verifyJWT, ctrl.recentInterviews)
router.get('/summary', verifyJWT, ctrl.summary)
router.get('/stats', verifyJWT, ctrl.stats)

module.exports = router
