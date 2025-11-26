const nodemailer = require("nodemailer");

async function sendEmail() {
    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",   // Outlook SMTP host
        port: 587,                    // TLS port
        secure: false,                // STARTTLS, not SSL
        auth: {
            user: process.env.EMAIL_USER, // your Outlook email
            pass: process.env.EMAIL_PASS, // your Outlook password or app password
        },
        tls: {
            ciphers: "SSLv3"
        }
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
    } catch (err) {
        console.error("Email error:", err);
        process.exit(1);
    }
}

sendEmail();
