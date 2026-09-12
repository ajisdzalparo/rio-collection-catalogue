import nodemailer from 'nodemailer';

interface SendOtpEmailParams {
  to: string;
  code: string;
  type?: 'ORDER' | 'LOGIN' | 'PHONE_CHANGE' | 'PASSWORD_RESET';
  storeName?: string;
}

export async function sendOtpEmail({
  to,
  code,
  type = 'ORDER',
  storeName = 'RIO COLLECTION'
}: SendOtpEmailParams): Promise<{ success: boolean; isDevMode?: boolean; error?: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.SMTP_FROM || `"${storeName}" <${user || 'no-reply@riocollection.com'}>`;

  const subject =
    type === 'LOGIN'
      ? `Kode OTP Masuk Akun - ${storeName}`
      : type === 'PASSWORD_RESET'
        ? `Kode Reset Kata Sandi - ${storeName}`
      : type === 'PHONE_CHANGE'
        ? `Kode Pergantian Nomor WhatsApp - ${storeName}`
        : `Kode Verifikasi Pesanan Anda - ${storeName}`;

  const purposeText =
    type === 'LOGIN'
      ? 'Gunakan kode OTP di bawah ini untuk masuk ke akun Anda.'
      : type === 'PASSWORD_RESET'
        ? 'Gunakan kode OTP di bawah ini untuk mengatur ulang kata sandi akun dashboard Anda.'
      : type === 'PHONE_CHANGE'
        ? 'Gunakan kode OTP di bawah ini untuk mengonfirmasi pergantian nomor WhatsApp pada profil Anda.'
        : 'Gunakan kode verifikasi berikut untuk menyelesaikan pesanan Anda.';

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 4px; overflow: hidden;">
        <!-- Header -->
        <tr>
          <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #f0eeeb;">
            <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 26px; font-weight: normal; letter-spacing: 0.05em; color: #1c1917; text-transform: uppercase;">
              ${storeName}
            </h1>
            <p style="margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716c;">
              Official Verification
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 36px 40px;">
            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #1c1917;">
              Kode Verifikasi (OTP)
            </h2>
            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #57534e;">
              ${purposeText} Kode ini berlaku selama <strong>10 menit</strong>.
            </p>

            <!-- OTP Code Box -->
            <div style="background-color: #f5f5f4; border: 1px dashed #d6d3d1; border-radius: 4px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0c0a09; display: inline-block;">
                ${code}
              </span>
            </div>

            <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #a8a29e;">
              * Jangan berikan kode ini kepada siapapun demi keamanan transaksi Anda. Jika Anda tidak merasa meminta kode ini, silakan abaikan email ini.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px; background-color: #fafaf9; border-top: 1px solid #f0eeeb; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #a8a29e;">
              &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Fallback to dev mode if SMTP credentials are not configured
  if (!user || !pass) {
    console.log('\n======================================================');
    console.log(`📧 [EMAIL OTP DEV MODE] Target: ${to}`);
    console.log(`🔐 [KODE OTP]: ${code}`);
    console.log(`ℹ️ [TYPE]: ${type}`);
    console.log('======================================================\n');
    return { success: true, isDevMode: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email via SMTP:', error);
    // Still log in console to prevent development blockage
    console.log('\n======================================================');
    console.log(`📧 [FALLBACK OTP CONSOLE LOG] Target: ${to}`);
    console.log(`🔐 [KODE OTP]: ${code}`);
    console.log('======================================================\n');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengirim email OTP'
    };
  }
}
