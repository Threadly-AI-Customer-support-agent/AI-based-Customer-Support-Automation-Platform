import prisma from '../lib/prisma.js';

class UserDAL {
  /**
   * Fetch a user by ID
   */
  static async getUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  /**
   * Fetch a user by email
   */
  static async getUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Create a new user in the database
   */
  static async createUser(userData) {
    return prisma.user.create({
      data: userData
    });
  }

  /**
   * Update a user's details
   */
  static async updateUser(userId, data) {
    return prisma.user.update({
      where: { id: userId },
      data
    });
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId) {
    return prisma.user.delete({
      where: { id: userId }
    });
  }
}

export default UserDAL;
