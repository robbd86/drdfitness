import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminSignupEmail(email: string) {
  try {
    const fromEmail = process.env.FROM_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!fromEmail || !adminEmail) {
      console.error("FROM_EMAIL or ADMIN_EMAIL environment variables not set");
      return;
    }

    await resend.emails.send({
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
  } catch (err) {
    console.error("Failed to send admin signup email:", err);
    // Fail gracefully - don't throw
  }
}
