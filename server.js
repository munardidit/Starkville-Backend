const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const mailOptions = {
      from: `"Starkville Tech" <${process.env.EMAIL_USER}>`, 
      to: process.env.CONTACT_EMAIL || 'admin@starkville.tech', 
      replyTo: email, 
      subject: `New Message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>This message was sent from the website contact form.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed. Check your credentials.' });
    } else {
      res.status(500).json({ error: 'Failed to send message: ' + error.message });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Test email transporter config
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.status(200).json({ message: 'Email transporter is configured correctly' });
  } catch (error) {
    res.status(500).json({ error: 'Email configuration error: ' + error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('✅ Email credentials found');
  } else {
    console.log('❌ Email credentials missing. Check your .env file');
  }
});
