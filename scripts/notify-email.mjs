import nodemailer from "nodemailer";

async function sendEmail() {
    const transporter = nodemailer.createTransport({
        service: "gmail", // or Outlook SMTP
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "stakeholder@example.com",
        subject: "Beer API CI/CD Surefire Report",
        html: `
      <h3>Beer API CI/CD Test Results</h3>
      <p>The Surefire report has been generated.</p>
      <p><a href="https://github.com/vazyshetty/ai-testing-api/actions">View Report Artifact</a></p>
    `,
        attachments: [
            {
                filename: "surefire-report.html",
                path: "target/site/surefire-report.html",
            },
        ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
}

sendEmail().catch(console.error);
