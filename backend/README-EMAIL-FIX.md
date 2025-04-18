# Email Authentication Fix

## Issues Identified
The application's password reset functionality was experiencing two issues:

1. **Gmail Authentication Error**: Gmail was rejecting the authentication attempts
2. **Connection Timeout**: SMTP connection was timing out before completing

## Solutions Implemented

### 1. Gmail Configuration
Follow these steps to enable the password reset email functionality with Gmail:

- Follow the instructions in `setup-gmail-auth.md` to:
  - Enable 2-Step Verification on your Google account
  - Generate an App Password for this application
   
- Edit the `.env` file in the backend folder with your Gmail credentials:
  ```
  EMAIL_USER=your_actual_gmail@gmail.com
  EMAIL_PASSWORD=your_16_char_app_password
  ```

### 2. Timeout Improvements
We've implemented these fixes to address timeout issues:

- **Backend**: Increased SMTP timeout settings to handle slower network conditions
- **Frontend**: Extended Axios request timeout from 10 to 30 seconds
- **Frontend**: Improved error handling to show more specific error messages

### 3. Alternative Email Testing
For development and testing, you can now use Ethereal Email:

- Run `node alternate-email-test.js` to create a temporary email account
- This will send a test email and provide a URL to view it
- No real email configuration needed for testing

See `alternate-email-setup.md` for detailed instructions on this approach.

## Testing Your Configuration

### Option 1: Test with Gmail
```
cd backend
node test-email.js
```

### Option 2: Test with Ethereal (Recommended for Development)
```
cd backend
node alternate-email-test.js
```
Then open the preview URL that appears in the console.

## Password Reset Flow
This application implements a secure password reset flow through these steps:

1. **Request Password Reset**
   - User enters email on the forgot password page
   - System sends a 6-digit OTP to the user's email

2. **Verify OTP**
   - User receives and enters the OTP
   - System validates the OTP and generates a reset token
   - OTP expires after 15 minutes for security

3. **Reset Password**
   - User creates and confirms a new password
   - System updates the password in the database

## Troubleshooting

### Email Issues
- Gmail account security settings might be blocking the connection
- Your internet provider might be blocking outgoing SMTP traffic
- Try the Ethereal testing option if you continue to have issues
  
### Timeout Issues
If timeouts persist:
- Check your internet connection stability
- Try testing with smaller timeouts first to identify bottlenecks
- Consider using a more reliable email service provider

### Network Issues
- Ensure your backend server can make outgoing connections
- Check for any firewall or network restrictions
- Verify DNS resolution is working correctly

## Security Notes
- App Passwords provide a more secure way to authenticate your application with Gmail
- OTPs expire after 15 minutes for security
- The system limits OTP verification attempts to prevent brute force attacks
