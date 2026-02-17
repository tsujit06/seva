const { google } = require('googleapis');

let oauth2Client = null;
let gmailApi = null;

/**
 * Initialize the Gmail API client (HTTPS-based, no SMTP).
 * Requires OAuth2 credentials from Google Cloud Console.
 */
function getGmail() {
  if (!gmailApi) {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Gmail API credentials are missing. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in environment variables.'
      );
    }

    oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    gmailApi = google.gmail({ version: 'v1', auth: oauth2Client });
  }
  return gmailApi;
}

/**
 * Build the HTML email body for a receipt
 */
function buildReceiptHTML(recipientName, transactionId) {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; border: 2px solid #C9A227; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8B1A1A, #B22222); padding: 24px; text-align: center;">
        <h1 style="color: #FFD700; margin: 0; font-size: 22px; letter-spacing: 1px;">Shree Samrajyalakshmi Temple</h1>
        <p style="color: #FFECD2; margin: 8px 0 0; font-size: 13px;">Seva Receipt Confirmation</p>
      </div>
      <div style="padding: 28px 24px;">
        <p style="color: #5D3A1A; font-size: 15px; line-height: 1.7;">
          Dear <strong>${recipientName}</strong>,
        </p>
        <p style="color: #5D3A1A; font-size: 15px; line-height: 1.7;">
          Thank you for your generous seva contribution to Shree Samrajyalakshmi Temple. 
          Your devotion and support are deeply appreciated.
        </p>
        <div style="background: #FFF3E0; border-left: 4px solid #C9A227; padding: 14px 18px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; color: #8B4513; font-size: 14px;">
            <strong>Transaction ID:</strong> ${transactionId}
          </p>
        </div>
        <p style="color: #5D3A1A; font-size: 15px; line-height: 1.7;">
          Please find your official seva receipt attached to this email. 
          You may download and print it for your records.
        </p>
        <p style="color: #5D3A1A; font-size: 15px; line-height: 1.7; margin-top: 24px;">
          May the Goddess Samrajyalakshmi bless you and your family with 
          prosperity, health, and eternal peace.
        </p>
        <p style="color: #8B4513; font-size: 14px; margin-top: 24px;">
          With divine blessings,<br/>
          <strong>Shree Samrajyalakshmi Temple Administration</strong>
        </p>
      </div>
      <div style="background: #8B1A1A; padding: 16px; text-align: center;">
        <p style="color: #FFECD2; margin: 0; font-size: 12px;">
          ${process.env.TEMPLE_ADDRESS || 'Temple Street, Sacred City'} | 
          ${process.env.TEMPLE_EMAIL || 'info@samrajyalakshmitemple.org'}
        </p>
      </div>
    </div>
  `;
}

/**
 * Build a RFC 2822 MIME message with HTML body and PDF attachment,
 * then base64url-encode it for the Gmail API.
 */
function buildRawEmail(from, to, subject, htmlBody, pdfBuffer, pdfFilename) {
  const boundary = 'boundary_' + Date.now() + '_' + Math.random().toString(36).substring(2);

  const mimeLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody).toString('base64'),
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${pdfFilename}"`,
    `Content-Disposition: attachment; filename="${pdfFilename}"`,
    'Content-Transfer-Encoding: base64',
    '',
    pdfBuffer.toString('base64'),
    '',
    `--${boundary}--`,
  ];

  const raw = mimeLines.join('\r\n');

  // Gmail API expects base64url encoding (no padding, + → -, / → _)
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send receipt email with PDF attachment via Gmail REST API (HTTPS).
 * No SMTP required — works on Render and all cloud platforms.
 */
async function sendReceiptEmail(recipientEmail, recipientName, transactionId, pdfBuffer) {
  const MAX_RETRIES = 2;
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const fromAddress = `Shree Samrajyalakshmi Temple <${gmailUser}>`;
  const subject = `Seva Receipt - ${transactionId} | Shree Samrajyalakshmi Temple`;
  const htmlBody = buildReceiptHTML(recipientName, transactionId);
  const pdfFilename = `SevaReceipt-${transactionId}.pdf`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const gmail = getGmail();

      const raw = buildRawEmail(fromAddress, recipientEmail, subject, htmlBody, pdfBuffer, pdfFilename);

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      console.log(`✅ Receipt email sent to ${recipientEmail} via Gmail API: ${result.data.id}`);
      return { success: true, messageId: result.data.id };
    } catch (error) {
      console.error(`❌ Email attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

      // If token expired, reset the client so it refreshes on next attempt
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        oauth2Client = null;
        gmailApi = null;
      }

      if (attempt === MAX_RETRIES) {
        return { success: false, error: error.message };
      }

      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

/**
 * Fire-and-forget email: sends the email in the background without blocking.
 * Calls the optional callback when done (for updating DB, etc).
 */
function sendReceiptEmailAsync(recipientEmail, recipientName, transactionId, pdfBuffer, onComplete) {
  sendReceiptEmail(recipientEmail, recipientName, transactionId, pdfBuffer)
    .then(result => {
      if (onComplete) onComplete(result);
    })
    .catch(err => {
      console.error('Background email error:', err);
      if (onComplete) onComplete({ success: false, error: err.message });
    });
}

module.exports = { sendReceiptEmail, sendReceiptEmailAsync };
