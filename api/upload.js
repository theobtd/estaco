const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'estaco-add3c.firebasestorage.app',
  });
}

const storage = admin.storage();

module.exports = cors((req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, fileData } = req.body;

  if (!fileName || !fileData) {
    return res.status(400).json({ error: 'Missing fileName or fileData' });
  }

  const bucket = storage.bucket();
  const buffer = Buffer.from(fileData, 'base64');
  const file = bucket.file(`postPhotos/${fileName}`);

  file.save(buffer, { metadata: { contentType: 'image/jpeg' } })
    .then(() => {
      return file.getSignedUrl({ action: 'read', expires: '03-17-2026' });
    })
    .then(([url]) => {
      res.status(200).json({ downloadURL: url });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to upload file' });
    });
});
