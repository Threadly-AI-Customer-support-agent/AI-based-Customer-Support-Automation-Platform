/**
 * Comprehensive Seed Script — Creates fake data for the entire platform.
 * 
 * Creates:
 *  - 1 Agent user (for dashboard login)
 *  - 2 Customer users
 *  - Orders with returns
 *  - Chat sessions with messages
 *  - Tickets (open, escalated, closed)
 *  - Feedback entries
 *
 * Run: node seedData.mjs
 */

import 'dotenv/config';
import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient;
import { PrismaPg } from '@prisma/adapter-pg';
import pkgPg from 'pg';
const { Pool } = pkgPg;
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── 1. CLEAN EXISTING DATA ─────────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.feedback.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.return.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  console.log('   Done.\n');

  // ─── 2. CREATE USERS ────────────────────────────────────
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const agent = await prisma.user.create({
    data: {
      email: 'agent@threadly.com',
      passwordHash,
      role: 'AGENT',
    },
  });
  console.log(`   ✅ Agent: agent@threadly.com / password123`);

  const customer1 = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      passwordHash,
      role: 'CUSTOMER',
    },
  });
  console.log(`   ✅ Customer 1: sarah@example.com / password123`);

  const customer2 = await prisma.user.create({
    data: {
      email: 'james@example.com',
      passwordHash,
      role: 'CUSTOMER',
    },
  });
  console.log(`   ✅ Customer 2: james@example.com / password123\n`);

  // ─── 3. CREATE ORDERS ───────────────────────────────────
  console.log('📦 Creating orders...');
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: customer1.id,
        productName: 'Blue Denim Jacket',
        status: 'DELIVERED',
        trackingNo: 'TRK-2026-001',
      },
    }),
    prisma.order.create({
      data: {
        userId: customer1.id,
        productName: 'White Cotton Shirt',
        status: 'SHIPPED',
        trackingNo: 'TRK-2026-002',
      },
    }),
    prisma.order.create({
      data: {
        userId: customer1.id,
        productName: 'Black Slim Fit Jeans',
        status: 'PROCESSING',
        trackingNo: 'TRK-2026-003',
      },
    }),
    prisma.order.create({
      data: {
        userId: customer2.id,
        productName: 'Red Polo T-Shirt',
        status: 'DELIVERED',
        trackingNo: 'TRK-2026-004',
      },
    }),
    prisma.order.create({
      data: {
        userId: customer2.id,
        productName: 'Navy Blue Hoodie',
        status: 'SHIPPED',
        trackingNo: 'TRK-2026-005',
      },
    }),
    prisma.order.create({
      data: {
        userId: customer2.id,
        productName: 'Khaki Cargo Pants',
        status: 'CANCELLED',
        trackingNo: 'TRK-2026-006',
      },
    }),
  ]);
  console.log(`   ✅ Created ${orders.length} orders\n`);

  // ─── 4. CREATE RETURNS ──────────────────────────────────
  console.log('↩️  Creating returns...');
  await prisma.return.create({
    data: {
      orderId: orders[0].id, // Blue Denim Jacket
      defectLabel: 'Defective',
      confidence: 0.85,
      status: 'APPROVED',
      imagePath: 'uploads/sample-defect.jpg',
    },
  });
  await prisma.return.create({
    data: {
      orderId: orders[3].id, // Red Polo T-Shirt
      defectLabel: 'Not Defective',
      confidence: 0.45,
      status: 'PENDING',
      imagePath: 'uploads/sample-review.jpg',
    },
  });
  console.log(`   ✅ Created 2 returns (1 approved, 1 pending)\n`);

  // ─── 5. CREATE TICKETS ──────────────────────────────────
  console.log('🎫 Creating tickets...');
  await prisma.ticket.create({
    data: {
      userId: customer1.id,
      priority: 'HIGH',
      status: 'ESCALATED',
      category: 'Defective Product',
      angryCount: 3,
      aiFailCount: 1,
    },
  });
  await prisma.ticket.create({
    data: {
      userId: customer2.id,
      priority: 'MEDIUM',
      status: 'OPEN',
      category: 'Shipping Delay',
      angryCount: 1,
      aiFailCount: 0,
    },
  });
  await prisma.ticket.create({
    data: {
      userId: customer1.id,
      priority: 'LOW',
      status: 'CLOSED',
      category: 'General Inquiry',
      assignedTo: agent.id,
      angryCount: 0,
      aiFailCount: 0,
    },
  });
  await prisma.ticket.create({
    data: {
      userId: customer2.id,
      priority: 'HIGH',
      status: 'ESCALATED',
      category: 'Refund Request',
      angryCount: 2,
      aiFailCount: 2,
    },
  });
  console.log(`   ✅ Created 4 tickets (2 escalated, 1 open, 1 closed)\n`);

  // ─── 6. CREATE CHAT SESSIONS + MESSAGES ─────────────────
  console.log('💬 Creating chat sessions and messages...');

  // Session 1: Customer 1 — defect complaint
  const session1 = await prisma.chatSession.create({
    data: { userId: customer1.id, title: 'My jacket has a tear in it!' },
  });
  const s1Messages = [
    { userId: customer1.id, content: 'Hi, I received my Blue Denim Jacket and it has a tear near the collar.', sender: 'USER', type: 'TEXT', sessionId: session1.id },
    { userId: customer1.id, content: 'I\'m sorry to hear that! Could you please upload a photo of the defect so I can verify it for you?', sender: 'AI', type: 'TEXT', sentiment: 'NEUTRAL', sessionId: session1.id },
    { userId: customer1.id, content: '[Image uploaded: tear_photo.jpg]', sender: 'USER', type: 'IMAGE', sessionId: session1.id },
    { userId: customer1.id, content: 'Defect detected: "Defective" with 85% confidence. Return approved automatically ✅', sender: 'AI', type: 'TEXT', sentiment: 'NEUTRAL', sessionId: session1.id },
    { userId: customer1.id, content: 'Thank you! How long will the refund take?', sender: 'USER', type: 'TEXT', sessionId: session1.id },
    { userId: customer1.id, content: 'Your refund will be processed within 5-7 business days to your original payment method. You don\'t need to ship the defective item back.', sender: 'AI', type: 'TEXT', sentiment: 'NEUTRAL', sessionId: session1.id },
  ];
  for (const msg of s1Messages) {
    await prisma.message.create({ data: msg });
  }

  // Session 2: Customer 2 — shipping inquiry
  const session2 = await prisma.chatSession.create({
    data: { userId: customer2.id, title: 'Where is my order?' },
  });
  const s2Messages = [
    { userId: customer2.id, content: 'Where is my order? I ordered a Navy Blue Hoodie 5 days ago.', sender: 'USER', type: 'TEXT', sessionId: session2.id },
    { userId: customer2.id, content: 'Let me check that for you! Your order with tracking number TRK-2026-005 is currently in transit and has been shipped. Standard shipping takes 5-7 business days.', sender: 'AI', type: 'TEXT', sentiment: 'NEUTRAL', sessionId: session2.id },
    { userId: customer2.id, content: 'This is taking too long! I want a refund!', sender: 'USER', type: 'TEXT', sessionId: session2.id },
    { userId: customer2.id, content: 'I understand your frustration. I\'m escalating this to a human agent who can assist you with a refund. You\'ll receive an email shortly with your assigned agent\'s details.', sender: 'AI', type: 'TEXT', sentiment: 'ANGRY', sessionId: session2.id },
  ];
  for (const msg of s2Messages) {
    await prisma.message.create({ data: msg });
  }

  // Session 3: Customer 1 — sizing question
  const session3 = await prisma.chatSession.create({
    data: { userId: customer1.id, title: 'What size should I get?' },
  });
  const s3Messages = [
    { userId: customer1.id, content: 'What size should I order for a relaxed fit? I normally wear Medium.', sender: 'USER', type: 'TEXT', sessionId: session3.id },
    { userId: customer1.id, content: 'Our clothing runs true to size. Since you\'re between sizes and prefer a relaxed fit, I\'d recommend sizing up to a Large for maximum comfort!', sender: 'AI', type: 'TEXT', sentiment: 'NEUTRAL', sessionId: session3.id },
  ];
  for (const msg of s3Messages) {
    await prisma.message.create({ data: msg });
  }

  console.log(`   ✅ Created 3 chat sessions with 12 messages\n`);

  // ─── 7. CREATE FEEDBACK ─────────────────────────────────
  console.log('⭐ Creating feedback...');
  await prisma.feedback.create({
    data: { userId: customer1.id, rating: 5, comment: 'Great AI support! Resolved my defect issue instantly.' },
  });
  await prisma.feedback.create({
    data: { userId: customer2.id, rating: 2, comment: 'Shipping was too slow. Had to escalate.' },
  });
  await prisma.feedback.create({
    data: { userId: customer1.id, rating: 4, comment: 'Helpful sizing advice.' },
  });
  console.log(`   ✅ Created 3 feedback entries\n`);

  // ─── SUMMARY ────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 Seed completed successfully!\n');
  console.log('  Login Credentials:');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │ Agent:    agent@threadly.com / password123│');
  console.log('  │ Customer: sarah@example.com / password123 │');
  console.log('  │ Customer: james@example.com / password123 │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('\n  Data Created:');
  console.log('    • 3 users (1 agent, 2 customers)');
  console.log('    • 6 orders (various statuses)');
  console.log('    • 2 returns (1 approved, 1 pending)');
  console.log('    • 4 tickets (2 escalated, 1 open, 1 closed)');
  console.log('    • 3 chat sessions with 12 messages');
  console.log('    • 3 feedback entries');
  console.log('═══════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
