const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { mimetype, buffer } = req.file;

    // Use gemini-flash-latest which is great (and free tier friendly) for standard multimodality
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = "Please act as a professional audio transcription system. Transcribe the following audio precisely. Only respond with the transcribed text.";
    
    // Gemini API accepts audio via inlineData
    const audioData = {
        inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimetype,
        },
    };

    const result = await model.generateContent([prompt, audioData]);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: error.message || 'Error processing transcription' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
