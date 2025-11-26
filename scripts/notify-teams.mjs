import fetch from "node-fetch";
import fs from "fs";

const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
const reportPath = "target/site/surefire-report.html";

const reportExists = fs.existsSync(reportPath);

const message = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    summary: "Beer API CI/CD Surefire Report",
    themeColor: "0076D7",
    title: "Beer API CI/CD Test Results",
    text: reportExists
        ? "✅ Surefire report generated. Click below to view."
        : "⚠️ Surefire report not found.",
    potentialAction: [
        {
            "@type": "OpenUri",
            name: "View Surefire Report",
            targets: [
                {
                    os: "default",
                    uri: "https://github.com/vazyshetty/ai-testing-api/actions" // artifact link
                }
            ]
        }
    ]
};

(async () => {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
    });
    console.log("Teams notification status:", res.status);
})();
