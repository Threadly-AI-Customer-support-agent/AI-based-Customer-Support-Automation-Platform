import express from 'express';
import prisma from '../lib/prisma.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ## ─── ALL TICKETS (Agent Dashboard) ─────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, priority } = req.query;
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && { status }),
        ...(priority && { priority })
      },
      include: {
        user: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ## ─── MY TICKETS (Customer History) ───────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ## ─── SINGLE TICKET ────────────────────────────────────
router.get('/:ticketId', authMiddleware, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticketId },
      include: {
        user: { select: { id: true, email: true } }
      }
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'CUSTOMER' && ticket.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ## ─── TICKET STATUS UPDATE (Agent Logic) ────────────
router.patch('/:ticketId/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status, priority } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: {
        ...(status && { status }),
        ...(priority && { priority })
      }
    });
    res.json({ message: 'Ticket updated successfully ✅', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ## ─── TICKET ASSIGN (Self-Assignment) ───────────────────
router.patch('/:ticketId/assign', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const ticket = await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: {
        assignedTo: req.user.id,
        status: 'OPEN'
      }
    });
    res.json({ message: 'Ticket assigned successfully ✅', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ## ─── ESCALATED TICKETS (Filter) ────────────────────────
router.get('/filter/escalated', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const tickets = await prisma.ticket.findMany({
      where: { status: 'ESCALATED' },
      include: {
        user: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;