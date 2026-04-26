import 'dotenv/config';
// blackbox.test.js
import express from 'express';
import request from 'supertest';
import authRoutes from '../src/routes/auth.js';
import ticketRoutes from '../src/routes/tickets.js';

// Setup Express instances strictly for routing tests
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

describe('Black Box Testing - Authentication & Ticket APIs', () => {

  describe('POST /api/auth/register', () => {
    it('BB-01: Should NOT successfully register a valid agent (Backend blocks agent registration)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newagent1@company.com', password: 'securePassword123', role: 'AGENT' });
      
      // Our backend explicitly returns 403 for role !== "CUSTOMER"
      expect(response.statusCode).toBe(403); 
    });

    it('BB-02: Should reject registration if body is completely empty', async () => {
      const response = await request(app).post('/api/auth/register').send({});
      // Without valid email/password, our backend returns 400 due to validation
      expect([400, 500]).toContain(response.statusCode);
    });
  });

  describe('POST /api/auth/login', () => {
    it('BB-03: Should fail login if fields are missing', async () => {
      // Trying to login with username instead of email will fail
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'validAgent', password: 'correctPassword' });
        
      // Validation catches missing email field, returns 400
      expect(response.statusCode).toBe(400);
    });

    it('BB-04: Should reject login with an incorrect password / non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'fake@fake.com', password: 'wrongPassword' });
        
      // Backend returns 400 for incorrect credentials
      expect(response.statusCode).toBe(400); 
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('BB-05: Should reject logout request if Auth token header is entirely missing', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});
        
      // Expect custom 400 rejection from logout logic
      expect(response.statusCode).toBe(400); 
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/tickets/ (Role-Based Testing)', () => {
    it('BB-06: Should block general ticket viewing if no Auth token is provided', async () => {
      // Testing an actual existing route without auth headers
      const response = await request(app)
        .get('/api/tickets/');
        
      // Auth middleware throws 401 when token is missing entirely
      expect(response.statusCode).toBe(401); 
    });

    it('BB-07: Should block "my tickets" history viewing if no Auth token is provided', async () => {
      const response = await request(app)
        .get('/api/tickets/my');
        
      expect(response.statusCode).toBe(401); 
    });
  });
});