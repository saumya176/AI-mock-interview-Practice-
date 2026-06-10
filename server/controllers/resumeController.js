const multer = require('multer')
const { parseResume } = require('../utils/resumeParser')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

async function uploadResume(req,res,next){
  try{
    if(!req.file) return res.status(400).json({message:'No file'})
    const data = req.file.buffer
    const mimeType = req.file.mimetype
    const filename = req.file.originalname || req.file.filename
    const analysis = await parseResume(data, mimeType, filename)
    return res.json({ resumeAnalysis: analysis })
  }catch(e){ next(e) }
}

module.exports = { upload, uploadResume }
