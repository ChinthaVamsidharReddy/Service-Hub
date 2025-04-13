# Setting Up Gmail Authentication for Your Application

The password reset functionality uses email to send verification codes. To make this work with Gmail's security, follow these steps:

## Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Select "Security" from the left menu
3. Under "Signing in to Google," select "2-Step Verification"
4. Follow the steps to turn on 2-Step Verification

## Step 2: Create an App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Select "Security" from the left menu
3. Under "Signing in to Google," select "App passwords" 
   (You may need to sign in again)
4. At the bottom, select "Select app" and choose "Other (Custom name)"
5. Enter "Serverice Hub" or any name you'll recognize
6. Click "Generate"
7. Google will show you a 16-character app password. **Copy this password**

## Step 3: Update Your .env File

1. Open the `.env` file in your project's backend folder
2. Replace the placeholder values with your actual information:
   ```
   EMAIL_USER=your_actual_gmail_address@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```
   (Do not use quotes around the values)

3. Save the file

## Step 4: Restart Your Server

After making these changes, restart your server for the changes to take effect.

## Troubleshooting

If you're still having authentication issues:
- Make sure you're using the app password exactly as Google provided it
- Verify your Gmail account doesn't have additional security restrictions
- If you're using a Google Workspace account (for business), check with your administrator about SMTP access

Remember: Never share your app password with anyone, and don't commit it to public repositories. 