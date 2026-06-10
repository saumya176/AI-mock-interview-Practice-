const admin = require('firebase-admin')

function initFirebase(){
  if(admin.apps && admin.apps.length) return admin
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  if(!projectId || !clientEmail || !privateKey){
    console.warn('Firebase admin not configured; auth verification will fallback in dev')
    return admin
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  })
  return admin
}

module.exports = initFirebase()
