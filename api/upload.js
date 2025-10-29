const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'estaco-add3c.appspot.com',
  });
}

const storage = admin.storage();

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', 'https://theobtd.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(204).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`Rejecting ${req.method} request`);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { fileName, fileData } = req.body;
    console.log('Received POST request with fileName:', fileName);

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
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};
