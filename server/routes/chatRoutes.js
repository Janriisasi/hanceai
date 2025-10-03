import express from 'express';
import { InferenceClient } from '@huggingface/inference';

const router = express.Router();

// Store active requests
const activeRequests = new Map();

// POST /api/chat - Handle chat messages
router.post('/', async (req, res) => {
  const requestId = req.headers['x-request-id'];
  
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
    console.log('Sending request to OpenAI...');

    // Create abort controller for this request
    const abortController = new AbortController();
    if (requestId) {
      activeRequests.set(requestId, abortController);
    }

    // Listen for client disconnect
    req.on('close', () => {
      if (requestId && activeRequests.has(requestId)) {
        console.log(`Client disconnected, aborting request ${requestId}`);
        activeRequests.get(requestId).abort();
        activeRequests.delete(requestId);
      }
    });

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
    }, {
      signal: abortController.signal
    });

    // Clean up
    if (requestId) {
      activeRequests.delete(requestId);
    }

    console.log('Response received successfully');

    res.json({
      response: chatCompletion.choices[0].message.content
    });

  } catch (error) {
    // Clean up on error
    if (requestId) {
      activeRequests.delete(requestId);
    }

    // Handle abort errors
    if (error.name === 'AbortError') {
      console.log('Request aborted by client');
      return res.status(499).json({ error: 'Request cancelled' });
    }

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

// POST /api/chat/abort - Abort a specific request
router.post('/abort', (req, res) => {
  const { requestId } = req.body;
  
  if (requestId && activeRequests.has(requestId)) {
    activeRequests.get(requestId).abort();
    activeRequests.delete(requestId);
    console.log(`Manually aborted request ${requestId}`);
    return res.json({ success: true, message: 'Request aborted' });
  }
  
  res.status(404).json({ error: 'Request not found' });
});

export default router;