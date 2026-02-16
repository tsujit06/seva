const { Resend } = require('resend');

let resendClient = null;

function getResend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Sign up at https://resend.com to get a free API key.');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Build the HTML email body for a receipt
 */
function buildReceiptHTML(recipientName, transactionId) {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; border: 2px solid #C9A227; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #8B1A1A, #B22222); padding: 24px; text-align: center;">
        <h1 style="color: #FFD700; margin: 0; font-size: 22px; letter-spacing: 1px;">🙏 Shree Samrajyalakshmi Temple</h1>
        <p style="color: #FFECD2; margin: 8px 0 0; font-size: 13px;">Seva Receipt Confirmation</p>
      </div>
      <div style="padding: 28px 24px;">
        <p style="color: #5D3A1A; font-size: 15px; line-height: 1.7;">
          <strong>Om Samrajyalakshmiyai Namaha</strong>
        </p>
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
          prosperity, health, and eternal peace. 🙏
        </p>
        <p style="color: #8B4513; font-size: 14px; margin-top: 24px;">
          With divine blessings,<br/>
          <strong>Shree Samrajyalakshmi Temple Administration</strong>
        </p>
      </div>
      <div style="background: #8B1A1A; padding: 16px; text-align: center;">
        <p style="color: #FFECD2; margin: 0; font-size: 12px;">
          ${process.env.TEMPLE_ADDRESS || 'Temple Street, Sacred City'} | 
          ${process.env.TEMPLE_PHONE || '+91 98765 43210'} |
          ${process.env.TEMPLE_EMAIL || 'info@samrajyalakshmitemple.org'}
        </p>
      </div>
    </div>
  `;
}

/**
 * Send receipt email with PDF attachment via Resend HTTP API.
 * This uses HTTP (not SMTP), so it works on Render and all cloud platforms.
 */
async function sendReceiptEmail(recipientEmail, recipientName, transactionId, pdfBuffer) {
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resend = getResend();

      const fromAddress = process.env.EMAIL_FROM || 'Shree Samrajyalakshmi Temple <noreply@samrajyalakshmitemple.org>';

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [recipientEmail],
        subject: `Seva Receipt - ${transactionId} | Shree Samrajyalakshmi Temple`,
        html: buildReceiptHTML(recipientName, transactionId),
        attachments: [
          {
            filename: `SevaReceipt-${transactionId}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      });

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      console.log(`✅ Receipt email sent to ${recipientEmail} via Resend: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error(`❌ Email attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

      if (attempt === MAX_RETRIES) {
        return { success: false, error: error.message };
      }

      // Brief pause before retry
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
