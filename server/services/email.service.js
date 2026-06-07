// Email service: sends OTP and transactional emails via Resend.
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a real OTP email. No fallback or bypass allowed.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (to, otp) => {
	if (!process.env.RESEND_API_KEY) {
		throw new Error('CRITICAL: RESEND_API_KEY is not configured in server .env. Email delivery is required for security.');
	}

	const mailOptions = {
		from: `"MediSync Clinical" <onboarding@resend.dev>`,
		to,
		subject: `[MediSync] Security Code: ${otp}`,
		html: `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Verification Code</title>
			</head>
			<body style="margin: 0; padding: 0; background-color: #f6f9f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
				<!-- Improved Preheader for Notifications -->
				<div style="display: none; font-size: 1px; color: #f6f9f8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
					${otp} is your verification code. Valid for 5 minutes.
					&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
				</div>

				<table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
					<tr>
						<td style="padding: 40px 0;" align="center">
							<table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
								<!-- Branding Header -->
								<tr>
									<td style="padding: 48px 48px 0 48px;">
										<table border="0" cellpadding="0" cellspacing="0" width="100%">
											<tr>
												<td>
													<div style="display: flex; align-items: center; gap: 8px;">
														<span style="font-size: 24px; font-weight: 800; color: #30A46C; letter-spacing: -1px;">MediSync</span>
														<span style="color: #94a3b8; font-size: 14px; font-weight: 500; margin-left: 10px;">Clinical Portal</span>
													</div>
												</td>
												<td align="right">
													<div style="width: 10px; height: 10px; background-color: #30A46C; border-radius: 50%; display: inline-block;"></div>
													<span style="color: #30A46C; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-left: 5px;">Active Session</span>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								
								<!-- Main Body -->
								<tr>
									<td style="padding: 48px;">
										<h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Security Verification</h2>
										<p style="color: #475569; font-size: 16px; line-height: 26px; margin: 0 0 40px 0;">
											A request has been made to verify your identity on the MediSync Clinical Platform. Please use the following one-time code to complete your authorization.
										</p>
										
										<!-- Verification Code Block -->
										<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px; text-align: center;">
											<span style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 24px;">Authorization Code</span>
											<div style="font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; font-size: 48px; font-weight: 800; color: #1e293b; letter-spacing: 12px; margin: 0;">
												${otp}
											</div>
										</div>
										
										<div style="margin-top: 40px; text-align: center;">
											<p style="color: #64748b; font-size: 14px; margin: 0;">
												Valid for <strong style="color: #0f172a;">5 minutes</strong> • Requested from <span style="color: #30A46C; font-weight: 600;">Secure Portal</span>
											</p>
										</div>
									</td>
								</tr>
								
								<!-- Security Notice Banner -->
								<tr>
									<td style="padding: 0 48px 48px 48px;">
										<div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px;">
											<table border="0" cellpadding="0" cellspacing="0" width="100%">
												<tr>
													<td width="24" valign="top" style="padding-top: 2px;">
														<span style="color: #b45309; font-size: 18px;">⚠️</span>
													</td>
													<td style="padding-left: 12px; color: #92400e; font-size: 13px; line-height: 20px;">
														<strong>Security Protocol:</strong> If you did not request this code, your account may be compromised. Please ignore this email and update your security credentials immediately.
													</td>
												</tr>
											</table>
										</div>
									</td>
								</tr>
								
								<!-- Footer -->
								<tr>
									<td style="padding: 40px 48px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
										<table border="0" cellpadding="0" cellspacing="0" width="100%">
											<tr>
												<td>
													<p style="color: #64748b; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; letter-spacing: 0.5px;">
														MEDISYNC HEALTHCARE TECHNOLOGIES
													</p>
													<p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 16px;">
														This is an automated security message. Please do not reply to this email.<br>
														&copy; ${new Date().getFullYear()} MediSync Clinical. Enterprise Grade Security.
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
							
							<!-- Sub-footer links -->
							<table border="0" cellpadding="0" cellspacing="0" width="600">
								<tr>
									<td style="padding: 24px 0; text-align: center;">
										<span style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
											Privacy Policy • Help Center • Security Standards
										</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`,
	};

	try {
		const { error } = await resend.emails.send(mailOptions);
		if (error) {
			console.error(`[CRITICAL] OTP Email Delivery Failed to ${to}:`, error);
			throw new Error(`Failed to deliver verification email. Please try again later.`);
		}
		return { delivered: true };
	} catch (error) {
		console.error(`[CRITICAL] OTP Email Delivery Failed to ${to}:`, error.message);
		throw new Error(`Failed to deliver verification email. Please try again later.`);
	}
};

module.exports = {
	sendOtpEmail,
};
