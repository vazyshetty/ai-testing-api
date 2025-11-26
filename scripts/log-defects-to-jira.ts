import fs from "fs";
import path from "path";
import axios from "axios";

const JIRA_BASE = process.env.JIRA_BASE; // e.g. https://yourcompany.atlassian.net
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY; // e.g. "QA"
const JIRA_AUTH = {
    username: process.env.JIRA_USER,
    password: process.env.JIRA_TOKEN // API token
};

async function logDefects() {
    const reportDir = path.join(__dirname, "../target/surefire-reports");
    const files = fs.readdirSync(reportDir).filter(f => f.endsWith(".txt"));

    for (const file of files) {
        const content = fs.readFileSync(path.join(reportDir, file), "utf8");

        // Simple parse: look for "FAILURES" or "Errors"
        const failures = content.match(/(?<=

        \[ERROR\]

   ).+/g);
        if (!failures) continue;

        for (const failure of failures) {
            const [testName, message] = failure.split(":");

            const issuePayload = {
                fields: {
                    project: { key: JIRA_PROJECT_KEY },
                    summary: `[API Test Failure] ${testName.trim()}`,
                    description: `
h3. Description
Test *${testName.trim()}* failed.

h3. Error Message
${message.trim()}

h3. Steps to Reproduce
1. Run Maven tests with command:
   {code}
   mvn clean test -DAPI_BASE=https://api.sampleapis.com/beers/ale -DPERF_ITER=20
   {code}
2. Observe failure in ${testName.trim()}.

h3. Acceptance Criteria
- Test passes successfully against Beer API mocks.
- Status code and schema match expected contract.

Labels: API
          `,
                    issuetype: { name: "Bug" },
                    labels: ["API"]
                }
            };

            try {
                const res = await axios.post(
                    `${JIRA_BASE}/rest/api/2/issue`,
                    issuePayload,
                    {
                        auth: JIRA_AUTH,
                        headers: { "Content-Type": "application/json" }
                    }
                );
                console.log(`Logged defect to JIRA: ${res.data.key}`);
            } catch (err) {
                console.error("Failed to log defect:", err.message);
            }
        }
    }
}

logDefects();
