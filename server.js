const express = require('express');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://starkville.tech'], 
  methods: ['POST', 'GET'],
  credentials: true
}));

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Verify SendGrid configuration
if (process.env.SENDGRID_API_KEY) {
  console.log('✅ SendGrid API key configured');
  console.log(`📧 Emails will be sent from: ${process.env.EMAIL_USER}`);
} else {
  console.error(' SendGrid API key is missing!');
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    console.log('📨 Received contact form submission:', req.body);

    const { name, email, phone, location, service, message } = req.body;

    // Validation
    if (!name || !email || !phone || !location || !service) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Please fill in all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Create email content
    const emailContent = {
      to: process.env.EMAIL_USER, 
      from: {
        email: process.env.EMAIL_USER, 
        name: 'Starkville Tech'
      },
      replyTo: {
        email: email, 
        name: name
      },
      subject: `New Contact Form Submission - ${service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #667eea; margin-bottom: 5px; display: block; }
            .value { background: white; padding: 12px; border-radius: 4px; border-left: 3px solid #667eea; }
            .message-box { background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #764ba2; min-height: 100px; white-space: pre-wrap; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            .reply-info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🔔 New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="reply-info">
                <strong>💡 Quick Reply:</strong> Just click "Reply" to respond directly to ${name}. Your response will come from ${process.env.EMAIL_USER} and go to ${email}.
              </div>
              
              <div class="field">
                <span class="label">👤 Name:</span>
                <div class="value">${name}</div>
              </div>
              
              <div class="field">
                <span class="label">📧 Email:</span>
                <div class="value"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></div>
              </div>
              
              <div class="field">
                <span class="label">📱 Phone:</span>
                <div class="value">${phone}</div>
              </div>
              
              <div class="field">
                <span class="label">🌍 Location:</span>
                <div class="value">${location}</div>
              </div>
              
              <div class="field">
                <span class="label">🎯 Service Interested In:</span>
                <div class="value">${service}</div>
              </div>
              
              ${message ? `
              <div class="field">
                <span class="label">💬 Message:</span>
                <div class="message-box">${message}</div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This email was sent from the Starkville contact form</p>
              <p>Submission time: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone}
Location: ${location}
Service: ${service}
${message ? `\nMessage:\n${message}` : ''}

---
Submission time: ${new Date().toLocaleString()}

To reply: Just hit "Reply" and your response will be sent from ${process.env.EMAIL_USER} to ${email}
      `
    };

    // Send email via SendGrid
    console.log('📤 Sending email via SendGrid...');
    await sgMail.send(emailContent);
    console.log('✅ Email sent successfully via SendGrid');

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    emailService: 'SendGrid'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service: SendGrid`);
  console.log(`📬 Sending emails from: ${process.env.EMAIL_USER}`);
});