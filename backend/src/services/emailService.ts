import { Resend } from 'resend';

// Resend API key will be read from the .env file
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend.
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const data = await resend.emails.send({
      from: 'HOMEY <info@homey.irmaksuvari.me>', // Verified custom domain
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
