const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Root route 
app.get('/', (req, res) => {
  res.json({ 
    message: 'Starkville Tech API Server is running!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      contact: 'POST /api/contact',
      testEmail: 'GET /api/test-email'
    }
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Enhanced validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'All fields are required',
        missing: {
          name: !name,
          email: !email,
          message: !message
        }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const mailOptions = {
      from: `"Starkville Tech" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL || 'admin@starkville.tech',
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message:
${message}

This message was sent from the Starkville Tech website contact form.
      `
    };

    await transporter.sendMail(mailOptions);
    
    console.log(` Contact form submitted by: ${name} (${email})`);
    res.status(200).json({ 
      success: true,
      message: 'Thank you! Your message has been sent successfully.' 
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);

    // Enhanced error handling
    let errorMessage = 'Failed to send message. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check server configuration.';
    } else if (error.code === 'EENVELOPE') {
      errorMessage = 'Invalid email address. Please check your email and try again.';
    }

    res.status(500).json({ 
      success: false,
      error: errorMessage 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test transporter endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.status(200).json({ 
      success: true,
      message: ' Email transporter is configured correctly' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Email configuration error: ' + error.message 
    });
  }
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/contact',
      'GET /api/test-email'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📧 Contact endpoint: http://localhost:${PORT}/api/contact`);
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('✅ Email credentials found');
  } else {
    console.log('❌ Email credentials missing. Check your .env file');
    console.log('   Make sure you have:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
  }
});