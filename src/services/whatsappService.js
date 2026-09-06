
/**
 * Send a WhatsApp message via Fonnte API.
 * Fonnte expects the token directly in the Authorization header (NO "Bearer" prefix).
 *
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message text
 * @returns {object|null} API response or null on failure
 */
const sendWhatsAppMessage = async (phone, message) => {
  try {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      console.warn('⚠️  FONNTE_TOKEN not configured. Skipping WA message.');
      return null;
    }

    // Fonnte only accepts form-urlencoded bodies (rejects JSON with
    // "invalid/empty body value" while still returning HTTP 200).
    const params = new URLSearchParams({
      target: phone,
      message: message,
      countryCode: '62', // Indonesia
    });

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token, // NO "Bearer" prefix for Fonnte
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await response.json();

    // Fonnte returns HTTP 200 even when delivery fails (e.g. invalid body,
    // disconnected device). Trust the JSON `status` field, not the HTTP code.
    if (!response.ok || data.status !== true) {
      console.error('❌ Fonnte API error:', data);
      return null;
    }

    console.log(`📱 WA message sent to ${phone}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to send WA message:', error.message);
    return null; 
  }
};

/**
 * Send queue confirmation after customer joins the queue.
 *
 * @param {string} phone
 * @param {string} name - Customer name
 * @param {string} queueNumber - e.g. 'HC-005'
 * @param {number} position - Current position in queue
 * @param {number} estimatedWait - Estimated wait in minutes
 */
const sendQueueConfirmation = async (phone, name, queueNumber, position, estimatedWait) => {
  const message =
    `✅ *Hair Connect - Konfirmasi Antrian*\n\n` +
    `Halo *${name}*! 👋\n\n` +
    `Nomor antrian Anda: *${queueNumber}*\n` +
    `Posisi saat ini: *${position}*\n` +
    `Estimasi waktu tunggu: *${estimatedWait} menit*\n\n` +
    `Kami akan mengirim notifikasi saat giliran Anda hampir tiba. Terima kasih! 🙏`;

  await sendWhatsAppMessage(phone, message);
};

/**
 * Send reminder when customer is 2 positions away from being served.
 *
 * @param {string} phone
 * @param {string} name
 * @param {number} positionsLeft - Number of people ahead
 */
const sendQueueReminder = async (phone, name, positionsLeft) => {
  const message =
    `⏰ *Hair Connect - Reminder*\n\n` +
    `Halo *${name}*!\n\n` +
    `Giliran Anda hampir tiba! Tinggal *${positionsLeft} orang* lagi di depan Anda.\n\n` +
    `Mohon bersiap-siap dan pastikan Anda sudah di lokasi. 💈`;

  await sendWhatsAppMessage(phone, message);
};

/**
 * Notify customer that it's their turn.
 *
 * @param {string} phone
 * @param {string} name
 */
const sendQueueCalled = async (phone, name) => {
  const message =
    `🔔 *Hair Connect - Giliran Anda!*\n\n` +
    `Halo *${name}*!\n\n` +
    `*Giliran Anda sekarang!* 🎉\n\n` +
    `Silakan menuju kursi barber. Kami menunggu Anda! 💈✂️`;

  await sendWhatsAppMessage(phone, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendQueueConfirmation,
  sendQueueReminder,
  sendQueueCalled,
};
