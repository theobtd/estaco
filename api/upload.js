const admin = require('firebase-admin');

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

module.exports = async (req, res) => {
  console.log(`Received ${req.method} request from ${req.headers.origin}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://theobtd.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      res.status(400).json({ error: 'Missing fileName or fileData' });
      return;
    }

    const bucket = storage.bucket();
    const buffer = Buffer.from(fileData, 'base64');
    const file = bucket.file(`postPhotos/${fileName}`);

    await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });

    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-17-2026' });

    res.status(200).json({ downloadURL: url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};
