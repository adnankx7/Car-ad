const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ort = require('onnxruntime-node');
const sharp = require('sharp');
const { getAdReviewChain } = require('./reviewAgent');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'data.json';

// Multer setup for image upload
const upload = multer({ storage: multer.memoryStorage() });

// Load ONNX model
let session;
const modelPath = path.join('runs', 'classify', 'train', 'weights', 'best.onnx');
ort.InferenceSession.create(modelPath)
  .then(s => {
    session = s;
    console.log('ONNX model loaded!');
  })
  .catch(err => console.error('Failed to load model:', err));

// Middleware
app.use(express.json());
app.use(express.static('static'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/submit', upload.array('images'), async (req, res) => {
  try {
    if (!session) {
      return res.status(500).json({ message: 'Model not loaded yet.' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required.' });
    }

    const labels = ['non-vehicle', 'vehicle'];
    for (const file of files) {
      // Preprocess image for classification
      const imageBuffer = await sharp(file.buffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data } = imageBuffer;
      const floatData = Float32Array.from(data, v => v / 255.0);

      const transposed = new Float32Array(3 * 224 * 224);
      for (let i = 0; i < 224 * 224; i++) {
        transposed[i] = floatData[i * 3]; // R
        transposed[i + 224 * 224] = floatData[i * 3 + 1]; // G
        transposed[i + 2 * 224 * 224] = floatData[i * 3 + 2]; // B
      }

      const inputTensor = new ort.Tensor('float32', transposed, [1, 3, 224, 224]);
      const feeds = {};
      feeds[session.inputNames[0]] = inputTensor;

      const results = await session.run(feeds);
      const output = results[session.outputNames[0]];
      const scores = output.data;

      const maxIndex = scores.indexOf(Math.max(...scores));
      const predictedClass = labels[maxIndex];

      if (predictedClass === 'non-vehicle') {
        return res.status(400).json({ message: 'Ad rejected: One or more images classified as non-vehicle.' });
      }
    }

    // If vehicle, proceed to review description
    const newData = req.body;

    const chain = getAdReviewChain();
    let reviewResult;
    try {
      reviewResult = await chain.invoke(newData);
    } catch (error) {
      const errorMessage = error.message;
      if (errorMessage.includes('ConnectError') || errorMessage.toLowerCase().includes('connection refused')) {
        return res.status(503).json({ message: 'Error: Cannot connect to Ollama local model server. Please ensure it is running.' });
      }
      return res.status(500).json({ message: `Error during AI review: ${errorMessage}` });
    }

    // Load existing data
    let adsData = [];
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        adsData = JSON.parse(fileContent);
      } catch (err) {
        adsData = [];
      }
    }

    // Append new entry with review status
    const newDataWithStatus = { ...newData };
    newDataWithStatus.status = reviewResult.decision.toLowerCase(); // 'approve' or 'reject'
    newDataWithStatus.review_reason = reviewResult.reason;
    newDataWithStatus.image_class = 'vehicle';

    adsData.push(newDataWithStatus);

    // Save back to JSON file
    fs.writeFileSync(DATA_FILE, JSON.stringify(adsData, null, 2));

    if (reviewResult.decision === 'Reject') {
      return res.status(400).json({ message: `Ad rejected: ${reviewResult.reason}` });
    }

    res.json({ message: 'Car details saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing submission.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
