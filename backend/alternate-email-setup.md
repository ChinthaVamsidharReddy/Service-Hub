# Alternative Email Testing Setup

If you're having trouble setting up Gmail for password reset emails, you can use Ethereal Email for testing purposes. Ethereal is a fake SMTP service that captures emails sent to it without actually delivering them.

## Setup Instructions

1. **Modify the test-email.js file**:

```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

async function createTestAccount() {
  // Generate test SMTP service account from ethereal.email
  let testAccount = await nodemailer.createTestAccount();
  
  console.log('Ethereal Email credentials created:');
  console.log('Email:', testAccount.user);
  console.log('Password:', testAccount.pass);
  console.log('SMTP Host:', testAccount.smtp.host);
  console.log('SMTP Port:', testAccount.smtp.port);
  
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
    let info = await transporter.sendMail({
      from: '"Serverice Hub" <test@example.com>',
      to: testAccount.user,
      subject: "Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">Test Email</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>This is a test email from Serverice Hub.</p>
            <p>Time sent: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });
    
    console.log("Message sent successfully!");
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("Open the URL above to view the sent email");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

createTestAccount().catch(console.error);
```

2. **Run the test script**:
```
node alternate-email-test.js
```

3. **View the captured email**:
The script will output a preview URL. Open this URL in your browser to view the captured email.

## Using Ethereal for Development

1. **Create a separate auth configuration file**:

```javascript
// backend/config/email-testing.js
const nodemailer = require('nodemailer');

// Create a transporter for testing
let testTransporter = null;

async function getTestTransporter() {
  if (testTransporter) return testTransporter;
  
  // Create ethereal testing account
  const testAccount = await nodemailer.createTestAccount();
  
  // Log credentials for reference
  console.log('Using Ethereal test account:');
  console.log('Email:', testAccount.user);
  
  // Create reusable transporter object
  testTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  
  return testTransporter;
}

// Helper to get preview URL
function getPreviewUrl(info) {
  return nodemailer.getTestMessageUrl(info);
}

module.exports = { getTestTransporter, getPreviewUrl };
```

2. **Modify your auth.js to use the testing transport**:

```javascript
// In auth.js
const { getTestTransporter, getPreviewUrl } = require('../config/email-testing');

// In your email sending routes:
const info = await testTransporter.sendMail(mailOptions);
console.log('Email preview URL:', getPreviewUrl(info));
```

## Switching Back to Production Email

When you're ready to use your real email service:

1. Set up your Gmail account with App Password as described in setup-gmail-auth.md
2. Update your .env file with the real credentials
3. Revert any changes that use the test transporter

## Benefits of Ethereal Mail

- No need for real email credentials during development
- No rate limits or sending restrictions
- Instant email capture and preview
- No need to check your real inbox for test emails 