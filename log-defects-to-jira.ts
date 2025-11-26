import fs from "fs";
import path from "path";
import axios, { AxiosError } from "axios";

const JIRA_BASE = process.env.JIRA_BASE || "";
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "";
const JIRA_USER = process.env.JIRA_USER || "";
const JIRA_TOKEN = process.env.JIRA_TOKEN || "";

async function logDefects() {
    const reportDir = path.join(__dirname, "../target/surefire-reports");
    const files = fs.readdirSync(reportDir).filter(f => f.endsWith(".txt"));

    for (const file of files) {
        const content = fs.readFileSync(path.join(reportDir, file), "utf8");

        // ✅ Proper regex to match lines starting with "[ERROR]"
        const failures = content.match(/^

        \[ERROR\]

            .+ /gm);
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
${message?.trim()}

h3. Steps to Reproduce
1. Run Maven tests with command:
   {code}
   mvn clean test -DAPI_BASE=https://api.sampleapis.com/beers/ale -DPERF_ITER=20
   {code}
2. Observe failure in ${testName.trim()}.

h3. Acceptance Criteria
- Test passes successfully against Beer API mocks.
- Status code and schema match expected contract.
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
                        auth: { username: JIRA_USER, password: JIRA_TOKEN },
                        headers: { "Content-Type": "application/json" }
                    }
                );
                console.log(`Logged defect to JIRA: ${res.data.key}`);
            } catch (err: unknown) {
                const error = err as AxiosError;
                console.error("Failed to log defect:", error.message);
            }
        }
    }
}

logDefects();
