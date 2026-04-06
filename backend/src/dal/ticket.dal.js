import prisma from '../lib/prisma.js';

class TicketDAL {
  /**
   * Create a new support ticket
   */
  static async createTicket(ticketData) {
    return prisma.ticket.create({
      data: ticketData
    });
  }

  /**
   * Fetch all tickets for a specific user
   */
  static async getTicketsByUser(userId) {
    return prisma.ticket.findMany({
      where: { userId }
    });
  }

  /**
   * Fetch a specific ticket by ID
   */
  static async getTicketById(ticketId) {
    return prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });
  }

  /**
   * Update the status and properties of a ticket
   */
  static async updateTicket(ticketId, data) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data
    });
  }

  /**
   * Retrieve all open tickets (e.g., for agents)
   */
  static async getOpenTickets() {
    return prisma.ticket.findMany({
      where: { status: 'OPEN' }
    });
  }
}

export default TicketDAL;
