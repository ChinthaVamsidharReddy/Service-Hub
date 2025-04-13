require('dotenv').config();
const nodemailer = require('nodemailer');

// Create test email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000      // 60 seconds
});

// Test email function
async function testEmailConfig() {
  console.log('Testing email configuration...');
  console.log(`Using email: ${process.env.EMAIL_USER}`);
  
  try {
    // Verify connection configuration
    const verifyResult = await transporter.verify();
    console.log('SMTP connection verified:', verifyResult);
    
    // Send test email (to yourself)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Serverice Hub Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Email Configuration Test</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>This is a test email to verify that your email configuration is working correctly.</p>
            <p>If you received this email, your app can now send emails successfully!</p>
            <p>Time sent: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    console.log('\nEmail configuration is working correctly.');
  } catch (error) {
    console.error('Email configuration test failed:');
    console.error(error);
    console.log('\nPlease check your .env file and make sure:');
    console.log('1. EMAIL_USER contains your full Gmail address');
    console.log('2. EMAIL_PASSWORD contains your 16-character App Password (not your regular password)');
    console.log('3. You have followed all steps in setup-gmail-auth.md');
  }
}

// Run the test
testEmailConfig().catch(console.error); 