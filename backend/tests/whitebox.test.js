import 'dotenv/config';
// whitebox.test.js
import UserDAL from '../src/dal/user.dal.js';
import TicketDAL from '../src/dal/ticket.dal.js';

describe('White Box Testing - Internal Business & DAL Logic', () => {
  
  describe('Data Access Layer: UserDAL Branches', () => {
    it('WB-01: Negative Branch - Missing/invalid user ID should defensively return null instead of crashing', async () => {
      // Act: Call the function with a fake ID
      const result = await UserDAL.getUserById('invalid-uuid-0000');
      // Assert: Verify the negative path returns null gracefully 
      expect(result).toBeNull();
    });

    it('WB-02: Exception Branch - Malformed emails should defensively return null', async () => {
      const result = await UserDAL.getUserByEmail('not-an-email');
      expect(result).toBeNull();
    });
  });

  describe('Data Access Layer: TicketDAL Branches', () => {
    it('WB-03: Negative Path - Getting tickets for a non-existent user should yield empty array', async () => {
      // Internal code of getTicketsByUser queries the DB list directly
      const result = await TicketDAL.getTicketsByUser('some-random-user');
      // Branch test: Prisma findMany returns [] when there are no matches
      expect(result).toEqual([]);
    });

    it('WB-04: Negative Path - Getting a single ticket by unknown ID should return null', async () => {
      const result = await TicketDAL.getTicketById('invalid-ticket-1234');
      // Branch test: Prisma findUnique returns null 
      expect(result).toBeNull();
    });
    
    it('WB-05: Data Type Branch - Fetching open tickets resolves without crashing', async () => {
      const result = await TicketDAL.getOpenTickets();
      // Ensure the logic path executes and returns an array type
      expect(Array.isArray(result)).toBe(true);
    });
  });
});