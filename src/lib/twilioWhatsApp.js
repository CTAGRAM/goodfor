/**
 * Twilio WhatsApp Service (Updated with Verify API)
 * 
 * Uses Twilio Verify API for OTP which properly handles WhatsApp channel.
 * Also supports direct messaging for notifications.
 * 
 * NOTE: For Twilio Verify to work with WhatsApp, you need to:
 * 1. Create a Verify Service in Twilio Console
 * 2. Enable the WhatsApp channel for that service
 */

// Twilio Configuration
const TWILIO_CONFIG = {
    accountSid: 'AC19f4c5120a739909b514ed61469b1f57',
    authToken: '9c4bf8f9d82fc6935b3152f7690c8201',
    phoneNumber: '+14454475622', // Twilio phone number
    whatsAppNumber: '+15557980995', // WhatsApp Business number
    // You need to create a Verify Service in Twilio Console
    // Go to: Console > Verify > Services > Create new service
    verifyServiceSid: 'VA9d4d976f41300c6a57003495075d8230', // Twilio Verify Service SID
};

/**
 * Format phone number to E.164
 */
const formatPhoneNumber = (phone) => {
    let formatted = phone.trim().replace(/\s+/g, '');
    if (!formatted.startsWith('+')) {
        formatted = '+91' + formatted.replace(/^0+/, '');
    }
    return formatted;
};

/**
 * Send OTP via Twilio Verify API (supports SMS and WhatsApp channels)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} channel - 'sms' or 'whatsapp'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendVerifyOTP = async (phoneNumber, channel = 'whatsapp') => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`[TwilioVerify] Sending OTP via ${channel} to:`, formattedPhone);

    try {
        const response = await fetch(
            `https://verify.twilio.com/v2/Services/${TWILIO_CONFIG.verifyServiceSid}/Verifications`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
                },
                body: new URLSearchParams({
                    To: formattedPhone,
                    Channel: channel, // 'sms', 'whatsapp', 'call', 'email'
                }).toString(),
            }
        );

        const data = await response.json();

        if (response.ok && data.status === 'pending') {
            console.log(`[TwilioVerify] OTP sent successfully via ${channel}`);
            return { success: true, status: data.status };
        } else {
            console.error('[TwilioVerify] API error:', data);
            return { success: false, error: data.message || 'Failed to send OTP' };
        }
    } catch (error) {
        console.error('[TwilioVerify] Network error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

/**
 * Verify OTP via Twilio Verify API
 * @param {string} phoneNumber - Phone number used for OTP
 * @param {string} code - OTP code to verify
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const checkVerifyOTP = async (phoneNumber, code) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('[TwilioVerify] Verifying OTP for:', formattedPhone);

    try {
        const response = await fetch(
            `https://verify.twilio.com/v2/Services/${TWILIO_CONFIG.verifyServiceSid}/VerificationCheck`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
                },
                body: new URLSearchParams({
                    To: formattedPhone,
                    Code: code,
                }).toString(),
            }
        );

        const data = await response.json();

        if (response.ok && data.status === 'approved') {
            console.log('[TwilioVerify] OTP verified successfully');
            return { success: true, status: data.status };
        } else {
            console.error('[TwilioVerify] Verification failed:', data);
            return { success: false, error: data.message || 'Invalid OTP' };
        }
    } catch (error) {
        console.error('[TwilioVerify] Network error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

// =====================================================
// FALLBACK: Direct WhatsApp messaging for notifications
// (Requires user to have messaged your number first)
// =====================================================

// Store OTPs temporarily for fallback mode
const otpStore = new Map();

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// =====================================================
// DIRECT TWILIO SMS OTP (Works immediately!)
// =====================================================

/**
 * Send OTP via direct Twilio SMS
 * This works immediately without any Supabase configuration
 * @param {string} phoneNumber - Recipient phone number
 * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
 */
export const sendSMSOTP = async (phoneNumber) => {
    console.log('[TwilioSMS] Sending OTP to:', phoneNumber);

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP with 'sms' prefix to differentiate from WhatsApp
    otpStore.set(`sms:${formattedPhone}`, { otp, expiresAt });

    // SMS message body
    const messageBody = `Your GoodFor verification code is: ${otp}\n\nExpires in 5 minutes. Don't share this code.`;

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
                },
                body: new URLSearchParams({
                    From: TWILIO_CONFIG.phoneNumber, // Regular phone number, not WhatsApp
                    To: formattedPhone,
                    Body: messageBody,
                }).toString(),
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('[TwilioSMS] OTP sent successfully, SID:', data.sid);
            return { success: true, otp, messageId: data.sid, formattedPhone };
        } else {
            console.error('[TwilioSMS] API error:', data);
            return { success: false, error: data.message || 'Failed to send SMS' };
        }
    } catch (error) {
        console.error('[TwilioSMS] Network error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

/**
 * Verify SMS OTP
 * @param {string} phoneNumber - Phone number used for OTP
 * @param {string} code - OTP code to verify
 * @returns {{success: boolean, error?: string}}
 */
export const verifySMSOTP = (phoneNumber, code) => {
    console.log('[TwilioSMS] Verifying OTP for:', phoneNumber);

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const stored = otpStore.get(`sms:${formattedPhone}`);

    if (!stored) {
        return { success: false, error: 'No OTP found. Please request a new code.' };
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(`sms:${formattedPhone}`);
        return { success: false, error: 'OTP expired. Please request a new code.' };
    }

    if (stored.otp !== code) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    // OTP is valid, remove from store
    otpStore.delete(`sms:${formattedPhone}`);
    console.log('[TwilioSMS] OTP verified successfully');
    return { success: true };
};

/**
 * Send WhatsApp OTP message (fallback - requires user opt-in)
 * Note: User must message your WhatsApp number first to receive messages
 * @param {string} phoneNumber - Recipient phone number in E.164 format
 * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber) => {
    console.log('[WhatsApp] Sending OTP to:', phoneNumber);

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(formattedPhone, { otp, expiresAt });

    // WhatsApp message body
    const messageBody = `🔐 Your GoodFor verification code is: *${otp}*\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this message.`;

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
                },
                body: new URLSearchParams({
                    From: `whatsapp:${TWILIO_CONFIG.whatsAppNumber}`,
                    To: `whatsapp:${formattedPhone}`,
                    Body: messageBody,
                }).toString(),
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('[WhatsApp] OTP sent successfully, SID:', data.sid);
            return { success: true, otp, messageId: data.sid, formattedPhone };
        } else {
            console.error('[WhatsApp] API error:', data);
            // Check for common opt-in error
            if (data.code === 63007) {
                return {
                    success: false,
                    error: 'Please message our WhatsApp number first to receive OTPs. Send "Hi" to +15557980995'
                };
            }
            return { success: false, error: data.message || 'Failed to send WhatsApp message' };
        }
    } catch (error) {
        console.error('[WhatsApp] Network error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

/**
 * Verify WhatsApp OTP (local verification for fallback mode)
 * @param {string} phoneNumber - Phone number used for OTP
 * @param {string} code - OTP code to verify
 * @returns {{success: boolean, error?: string}}
 */
export const verifyWhatsAppOTP = (phoneNumber, code) => {
    console.log('[WhatsApp] Verifying OTP for:', phoneNumber);

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const stored = otpStore.get(formattedPhone);

    if (!stored) {
        return { success: false, error: 'No OTP found. Please request a new code.' };
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(formattedPhone);
        return { success: false, error: 'OTP expired. Please request a new code.' };
    }

    if (stored.otp !== code) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    // OTP is valid, remove from store
    otpStore.delete(formattedPhone);
    console.log('[WhatsApp] OTP verified successfully');
    return { success: true };
};

/**
 * Send WhatsApp notification (product alert, recall, etc.)
 * Note: User must have messaged your number within last 24 hours
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} type - Notification type ('recall', 'alert', 'tip')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppNotification = async (phoneNumber, title, body, type = 'alert') => {
    console.log('[WhatsApp] Sending notification to:', phoneNumber);

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Emoji based on type
    const emoji = {
        recall: '🚨',
        alert: '⚠️',
        tip: '💡',
        success: '✅',
    }[type] || '📱';

    const messageBody = `${emoji} *${title}*\n\n${body}\n\n— GoodFor App`;

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`),
                },
                body: new URLSearchParams({
                    From: `whatsapp:${TWILIO_CONFIG.whatsAppNumber}`,
                    To: `whatsapp:${formattedPhone}`,
                    Body: messageBody,
                }).toString(),
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log('[WhatsApp] Notification sent, SID:', data.sid);
            return { success: true, messageId: data.sid };
        } else {
            console.error('[WhatsApp] API error:', data);
            return { success: false, error: data.message || 'Failed to send notification' };
        }
    } catch (error) {
        console.error('[WhatsApp] Network error:', error);
        return { success: false, error: error.message || 'Network error' };
    }
};

/**
 * Send product recall alert via WhatsApp
 */
export const sendRecallAlert = async (phoneNumber, recall) => {
    const title = `Product Recall Alert - ${recall.classification || 'Warning'}`;
    const body = `A product you may have scanned has been recalled:\n\n*${recall.brand}*\n${recall.reason}\n\nPlease check your pantry and dispose of affected products. Visit FDA.gov for more info.`;

    return sendWhatsAppNotification(phoneNumber, title, body, 'recall');
};

/**
 * Get Twilio configuration (for debugging)
 */
export const getTwilioConfig = () => ({
    phoneNumber: TWILIO_CONFIG.phoneNumber,
    whatsAppNumber: TWILIO_CONFIG.whatsAppNumber,
    hasVerifyService: TWILIO_CONFIG.verifyServiceSid !== 'VA_YOUR_VERIFY_SERVICE_SID',
});
