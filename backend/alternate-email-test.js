require('dotenv').config();
const nodemailer = require('nodemailer');

async function createTestAccount() {
  // Generate test SMTP service account from ethereal.email
  let testAccount = await nodemailer.createTestAccount();
  
  console.log('\n===== Ethereal Email Test Account Created =====');
  console.log('Email:', testAccount.user);
  console.log('Password:', testAccount.pass);
  console.log('SMTP Host:', testAccount.smtp.host);
  console.log('SMTP Port:', testAccount.smtp.port);
  console.log('================================================\n');
  
  // Create reusable transporter
  let transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  
  // Test email
  try {
    console.log('Sending test email...');
    
    let info = await transporter.sendMail({
      from: '"Serverice Hub" <test@example.com>',
      to: testAccount.user,
      subject: "Serverice Hub Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Test Email</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>This is a test email from Serverice Hub.</p>
            <p>If you can see this, your email configuration is working correctly!</p>
            <p>Time sent: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });
    
    console.log('\n===== Email Sent Successfully =====');
    console.log('Message ID:', info.messageId);
    console.log('\n===== View Email Online =====');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Open the URL above in your browser to view the sent email');
    console.log('================================\n');
  } catch (error) {
    console.error('\n===== Email Error =====');
    console.error(error);
    console.error('=======================\n');
  }
}

createTestAccount().catch(console.error); 