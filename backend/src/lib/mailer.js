import nodemailer from 'nodemailer';

// Email connection setup
// Pehle wale transporter ko hata kar ye naya dalo
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS ke liye false zaroori hai
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Local/Hostel network ke liye helpful hai
  }
});
// ─── AGENT KO EMAIL ──────────────────────────────────
export const sendAgentEmail = async ({ ticketId, priority, customerEmail, reason }) => {
  try {
    await transporter.sendMail({
      from: `"Support System" <${process.env.EMAIL_USER}>`,
      to: process.env.AGENT_EMAIL,
      subject: ' High Priority Ticket Escalated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #e53e3e; border-bottom: 2px solid #e53e3e; padding-bottom: 10px;">🚨 High Priority Ticket Escalated</h2>
            <div style="background: #fff5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Ticket Details</h3>
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Priority:</strong> <span style="color: #e53e3e; font-weight: bold;">${priority}</span></p>
                <p><strong>Status:</strong> ESCALATED</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Customer Details</h3>
                <p><strong>Email:</strong> ${customerEmail}</p>
            </div>
            <div style="background: #fffaf0; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3 style="color: #333; margin-top: 0;">Reason for Escalation</h3>
                <p>${reason}</p>
            </div>
            <div style="background: #e53e3e; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center;">
                <p style="color: white; font-weight: bold; margin: 0;">⚠️ ACTION REQUIRED — Please handle this ticket immediately</p>
            </div>
        </div>`
    });
    console.log('Agent email sent ');
  } catch (error) {
    console.error('Agent email error:', error);
  }
};

// ─── CUSTOMER KO EMAIL ───────────────────────────────
export const sendCustomerEmail = async ({ ticketId, customerEmail, agentEmail }) => {
  try {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: 'Your Issue Has Been Escalated — Agent Assigned',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #38a169; border-bottom: 2px solid #38a169; padding-bottom: 10px;">✅ Your Issue Has Been Escalated</h2>
            <p style="color: #555;">Dear Customer,</p>
            <p style="color: #555;">Your support request has been escalated to our team. A dedicated agent has been assigned to resolve your issue.</p>
            <div style="background: #f0fff4; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3>Ticket Details</h3>
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Status:</strong> ESCALATED</p>
            </div>
            <div style="background: #ebf8ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <h3>Agent Assigned</h3>
                <p><strong>Email:</strong> ${agentEmail}</p>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">Team Support</p>
        </div>`
    });
    console.log('Customer email sent ');
  } catch (error) {
    console.error('Customer email error:', error);
  }
};