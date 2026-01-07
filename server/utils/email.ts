import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminSignupEmail(email: string) {
  try {
    const fromEmail = process.env.FROM_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("❌ RESEND_API_KEY environment variable not set");
      return;
    }

    if (!fromEmail || !adminEmail) {
      console.error("❌ FROM_EMAIL or ADMIN_EMAIL environment variables not set");
      return;
    }

    console.log(`📧 Sending admin signup notification for: ${email}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   To: ${adminEmail}`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: "New DRD Fitness signup",
      html: `
        <h2>New User Signup</h2>
        <p>A new user has signed up for DRD Fitness:</p>
        <p><strong>Email:</strong> ${email}</p>
      `,
      text: `New User Signup\n\nA new user has signed up for DRD Fitness:\n\nEmail: ${email}`,
    });

    console.log(`✅ Admin email sent successfully. ID: ${result.data?.id}`);
  } catch (err) {
    console.error("❌ Failed to send admin signup email:", err);
    // Fail gracefully - don't throw
  }
}

export async function sendWelcomeEmail(toEmail: string) {
  try {
    const fromEmail = process.env.FROM_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("❌ RESEND_API_KEY environment variable not set");
      return;
    }

    if (!fromEmail) {
      console.error("❌ FROM_EMAIL environment variable not set");
      return;
    }

    console.log(`📧 Sending welcome email to: ${toEmail}`);
    console.log(`   From: ${fromEmail}`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "Welcome to DRD Fitness 💪",
      html: `
        <h1>Welcome to DRD Fitness! 💪</h1>
        <p>Your account has been successfully created. We're excited to help you on your fitness journey!</p>
        <p>
          <a href="https://drdfitness.vercel.app" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Get Started
          </a>
        </p>
        <p>Thanks for joining us!</p>
      `,
      text: `Welcome to DRD Fitness! 💪\n\nYour account has been successfully created. We're excited to help you on your fitness journey!\n\nGet started: https://drdfitness.vercel.app\n\nThanks for joining us!`,
    });

    console.log(`✅ Welcome email sent successfully. ID: ${result.data?.id}`);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err);
    // Fail gracefully - don't throw
  }
}
