import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from config import SMTP_SERVER, PORT, SENDER_EMAIL, PASSWORD


class NotificationService:

    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.port = PORT
        self.sender_email = SENDER_EMAIL
        self.password = PASSWORD

    def _send_email(self, recipient_email, subject, body):
        try:
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            # Uncomment when using real SMTP
            # server = smtplib.SMTP(self.smtp_server, self.port)
            # server.starttls()
            # server.login(self.sender_email, self.password)
            # server.sendmail(self.sender_email, recipient_email, msg.as_string())
            # server.quit()

            logging.info(f"Email sent to {recipient_email} | {subject}")
            return True

        except Exception as e:
            logging.error(f"Error sending email to {recipient_email}: {e}")
            return False

    def send_priority_alert(self, agent_email, ticket_id, issue_summary):
        subject = f"URGENT: Priority Alert for Ticket #{ticket_id}"
        body = (
            "Hello Support Agent,\n\n"
            "A ticket has been escalated to you.\n"
            f"Ticket ID: {ticket_id}\n"
            f"Issue: {issue_summary}\n\n"
            "Please check immediately."
        )
        self._send_email(agent_email, subject, body)

    def send_refund_confirmation(self, customer_email, order_id, status):
        subject = f"Update on your Refund Request for Order #{order_id}"
        body = (
            "Dear Customer,\n\n"
            "We have reviewed your request.\n"
            f"Current Status: {status}\n\n"
            "If approved, the amount will be credited soon."
        )
        self._send_email(customer_email, subject, body)

    def send_agent_assignment(self, customer_email, ticket_id, agent_name):
        subject = f"Agent Assigned to Ticket #{ticket_id}"
        body = (
            "Hello,\n\n"
            f"Agent {agent_name} has been assigned to your case.\n"
            "You will receive further updates shortly."
        )
        self._send_email(customer_email, subject, body)