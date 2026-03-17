import prisma from './prisma.js'; // .js extension zaroori hai

/**
 * seedOrders function: 
 * Ye function ek specific userId ke liye dummy orders database mein save karta hai.
 */
export const seedOrders = async (userId) => {
  try {
    const orders = [
      {
        userId,
        productName: 'Blue Denim Jacket',
        status: 'SHIPPED',
        trackingNo: 'TRK123456'
      },
      {
        userId,
        productName: 'White Cotton Shirt',
        status: 'PROCESSING',
        trackingNo: 'TRK789012'
      },
      {
        userId,
        productName: 'Black Jeans',
        status: 'DELIVERED',
        trackingNo: 'TRK345678'
      }
    ];

    // Har order ko ek-ek karke create karo
    for (const order of orders) {
      await prisma.order.create({ 
        data: order 
      });
    }

    console.log('Orders seeded successfully ✅');
  } catch (error) {
    console.error('Seeding error ❌:', error.message);
    throw error;
  }
};