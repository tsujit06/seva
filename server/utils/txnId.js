/**
 * Generate a unique transaction ID in the format: SSLT-YYYYMMDD-XXXX
 * SSLT = Shree Samrajyalakshmi Temple
 * YYYYMMDD = Current date
 * XXXX = 4-character random alphanumeric string
 */
function generateTransactionId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `SSLT-${dateStr}-${randomPart}`;
}

module.exports = { generateTransactionId };
