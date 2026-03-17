import express from 'express';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { getBrainResponse, getSentiment, analyzeImage, transcribeVoice } from '../lib/aiClient.js';
import { sendAgentEmail, sendCustomerEmail } from '../lib/mailer.js';
import { setCache, getCache, deleteCache } from '../lib/cache.js';
import { uploadImage, uploadAudio } from '../lib/upload.js';

const router = express.Router();

// ─── 1. MESSAGE BHEJO ────────────────────────────────────────────
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Cache clear karo — naya message aaya hai
    await deleteCache(`chat:history:${userId}`);

    // Step 1: User message save karo
    await prisma.message.create({
      data: { userId, content: message, sender: 'USER', type: 'TEXT' }
    });

    // Step 2: Sentiment check karo
    const sentiment = await getSentiment(message);
    const sentimentLabel = sentiment.label || 'NEUTRAL';

    // Step 3: AI reply lo
    const aiResponse = await getBrainResponse(message, userId);

    // Step 4: AI reply DB mein save karo
    await prisma.message.create({
      data: {
        userId,
        content: aiResponse.reply,
        sender: 'AI',
        type: 'TEXT',
        sentiment: sentimentLabel
      }
    });

    // Step 5: Ticket Logic
    await handleTicketLogic(userId, sentimentLabel, message);

    res.json({ reply: aiResponse.reply, sentiment: sentimentLabel });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── 2. CHAT HISTORY ─────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `chat:history:${userId}`;

    // Pehle Redis check karo
    const cachedMessages = await getCache(cacheKey);
    if (cachedMessages) {
      console.log('Cache se mila ✅');
      return res.json({ messages: cachedMessages, source: 'cache' });
    }

    // Cache mein nahi tha — DB se lo
    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // Redis mein save karo
    await setCache(cacheKey, messages);
    console.log('DB se liya, cache mein save kiya ✅');

    res.json({ messages, source: 'database' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 3. FEEDBACK ─────────────────────────────────────────────────
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const feedback = await prisma.feedback.create({
      data: { userId: req.user.id, rating, comment: comment || null }
    });
    res.json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 4. IMAGE UPLOAD ─────────────────────────────────────────────
router.post('/image', authMiddleware, uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image required hai' });
    }

    const userId = req.user.id;
    const imagePath = req.file.path;

    // Step 1: User message save karo
    await prisma.message.create({
      data: {
        userId,
        content: `[Image uploaded: ${req.file.filename}]`,
        sender: 'USER',
        type: 'IMAGE'
      }
    });

    // Step 2: Vision AI ko bhejo
    const imageBuffer = fs.readFileSync(imagePath);
    const visionResult = await analyzeImage(imageBuffer);

    // Step 3: Confidence check karo
    let aiReply = '';
    let shouldInitiateReturn = false;

    if (visionResult.confidence >= 0.70) {
      aiReply = `Defect detected: "${visionResult.defect}" with ${Math.round(visionResult.confidence * 100)}% confidence. Return approved automatically ✅`;
      shouldInitiateReturn = true;
    } else {
      aiReply = `Image received. Confidence is low (${Math.round((visionResult.confidence || 0) * 100)}%). Human agent will review ⚠️`;
    }

    // Step 4: AI reply save karo
    await prisma.message.create({
      data: {
        userId,
        content: aiReply,
        sender: 'AI',
        type: 'TEXT'
      }
    });

    // Step 5: Cache clear karo
    await deleteCache(`chat:history:${userId}`);

    // Step 6: Return initiate karo agar high confidence
    if (shouldInitiateReturn) {
      const order = await prisma.order.findFirst({
        where: { userId }
      });

      if (order) {
        await prisma.return.create({
          data: {
            orderId: order.id,
            imagePath,
            defectLabel: visionResult.defect,
            confidence: visionResult.confidence,
            status: 'APPROVED'
          }
        });
      }
    }

    res.json({
      reply: aiReply,
      defect: visionResult.defect,
      confidence: visionResult.confidence,
      returnInitiated: shouldInitiateReturn
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 5. VOICE UPLOAD ─────────────────────────────────────────────
router.post('/voice', authMiddleware, uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file required hai' });
    }

    const userId = req.user.id;
    const audioPath = req.file.path;

    // Step 1: Audio ko text mein convert karo
    const audioBuffer = fs.readFileSync(audioPath);
    const transcription = await transcribeVoice(audioBuffer);
    const transcribedText = transcription.text;

    if (!transcribedText) {
      return res.status(400).json({ message: 'Audio transcribe nahi ho saka' });
    }

    // Step 2: Voice message save karo
    await prisma.message.create({
      data: {
        userId,
        content: transcribedText,
        sender: 'USER',
        type: 'VOICE'
      }
    });

    // Step 3: Sentiment check karo
    const sentiment = await getSentiment(transcribedText);
    const sentimentLabel = sentiment.label || 'NEUTRAL';

    // Step 4: Brain AI ko bhejo
    const aiResponse = await getBrainResponse(transcribedText, userId);
    const aiReply = aiResponse.reply;

    // Step 5: AI reply save karo
    await prisma.message.create({
      data: {
        userId,
        content: aiReply,
        sender: 'AI',
        type: 'TEXT',
        sentiment: sentimentLabel
      }
    });

    // Step 6: Cache clear karo
    await deleteCache(`chat:history:${userId}`);

    // Step 7: Ticket logic
    await handleTicketLogic(userId, sentimentLabel, transcribedText);

    res.json({
      transcribedText,
      reply: aiReply,
      sentiment: sentimentLabel
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── TICKET LOGIC ─────────────────────────────────────────────────
const handleTicketLogic = async (userId, sentimentLabel, message) => {
  try {
    let ticket = await prisma.ticket.findFirst({
      where: { userId, status: { in: ['OPEN', 'ESCALATED'] } }
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: { userId, priority: 'LOW', status: 'OPEN', angryCount: 0 }
      });
    }

    let isNewlyEscalated = false;
    let escalationReason = '';

    // Angry count check
    if (sentimentLabel === 'ANGRY') {
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { angryCount: { increment: 1 } }
      });

      if (updated.angryCount >= 3 && updated.status !== 'ESCALATED') {
        isNewlyEscalated = true;
        escalationReason = '3 consecutive angry messages detected';
      }
    }

    // Keyword check
    const keywords = ['refund', 'legal', 'court', 'human', 'agent', 'manager'];
    if (
      keywords.some(word => message.toLowerCase().includes(word)) &&
      ticket.status !== 'ESCALATED'
    ) {
      isNewlyEscalated = true;
      escalationReason = `Escalation keyword detected: "${message}"`;
    }

    // Escalate karo
    if (isNewlyEscalated) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'ESCALATED', priority: 'HIGH' }
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (user && user.email) {
        await sendAgentEmail({
          ticketId: ticket.id,
          priority: 'HIGH',
          customerEmail: user.email,
          reason: escalationReason
        });

        await sendCustomerEmail({
          ticketId: ticket.id,
          customerEmail: user.email,
          agentEmail: process.env.AGENT_EMAIL
        });

        console.log(`Emails sent for escalated ticket ${ticket.id} ✅`);
      }
    }

  } catch (error) {
    console.error('Ticket logic error:', error);
  }
};

export default router;