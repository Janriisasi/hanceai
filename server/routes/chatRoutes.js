import express from 'express';
import { InferenceClient } from '@huggingface/inference';

const router = express.Router();

// POST /api/chat - Handle chat messages
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Debug: Check if token exists
    const token = process.env.HF_TOKEN;
    if (!token) {
      console.error('HF_TOKEN is not set in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing HF_TOKEN' 
      });
    }

    console.log('Token exists:', token.substring(0, 7) + '...');
    console.log('Sending request to HuggingFace...');

    const client = new InferenceClient(token);
    const chatCompletion = await client.chatCompletion({
      provider: "together",
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    console.log('Response received successfully');

    res.json({
      response: chatCompletion.choices[0].message.content
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    // More detailed error response
    if (error.httpResponse?.status === 401) {
      return res.status(500).json({ 
        error: 'Authentication failed with HuggingFace. Please check your HF_TOKEN.',
        details: 'The token may be invalid or expired.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

export default router;