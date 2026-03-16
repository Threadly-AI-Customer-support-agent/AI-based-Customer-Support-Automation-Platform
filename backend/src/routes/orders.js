import express from 'express';
import prisma from '../lib/prisma.js'; // .js extension zaroori hai
import authMiddleware from '../middleware/authMiddleware.js'; // Humne middleware ka naam yahi rakha tha
import { seedOrders } from '../lib/seed.js';

const router = express.Router();

// ─── 1. SEED ORDERS (Sirf testing ke liye) ───────────────────
router.post('/seed', authMiddleware, async (req, res) => {
  try {
    await seedOrders(req.user.id);
    res.json({ message: 'Orders seeded successfully ✅' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── 2. ALL ORDERS OF USER (History) ────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { returns: true }
    });
    res.json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 3. SINGLE ORDER STATUS ─────────────────────────────
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        userId: req.user.id // Sirf apna order dekh sake
      },
      include: { returns: true }
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 4. RETURN INITIATE (With AI Confidence) ─────────────────
router.post('/:orderId/return', authMiddleware, async (req, res) => {
  try {
    const { defectLabel, confidence, imagePath } = req.body;

    // Order check karo
    const order = await prisma.order.findFirst({
      where: { id: req.params.orderId, userId: req.user.id }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Already return hai?
    const existingReturn = await prisma.return.findFirst({
      where: { orderId: order.id }
    });

    if (existingReturn) {
      return res.status(400).json({ message: 'Return already initiated for this order' });
    }

    // Return banao
    const newReturn = await prisma.return.create({
      data: {
        orderId: order.id,
        defectLabel: defectLabel || null,
        confidence: confidence || null,
        imagePath: imagePath || null,
        status: 'PENDING'
      }
    });

    // High confidence logic — auto approve (70% threshold)
    if (confidence && confidence >= 0.70) {
      await prisma.return.update({
        where: { id: newReturn.id },
        data: { status: 'APPROVED' }
      });
      return res.json({
        message: 'Defect verified. Return approved automatically ✅',
        return: { ...newReturn, status: 'APPROVED' }
      });
    }

    // Low confidence — human review
    res.json({
      message: 'Return initiated. Under review by our team ⚠️',
      return: newReturn
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── 5. PROCESS REFUND ──────────────────────────────────
router.post('/:orderId/refund', authMiddleware, async (req, res) => {
  try {
    const returnRecord = await prisma.return.findFirst({
      where: {
        orderId: req.params.orderId,
        status: 'APPROVED'
      }
    });

    if (!returnRecord) {
      return res.status(400).json({
        message: 'No approved return found for this order'
      });
    }

    // Order aur Return status update karo
    await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Refund processed successfully ✅',
      refundStatus: 'APPROVED'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;