"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("jira-to-mcp: script load");
process.on("uncaughtException", (err) => console.error("uncaughtException:", err));
process.on("unhandledRejection", (reason) => console.error("unhandledRejection:", reason));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// --- Simple logger ---
const logger = {
    info: (data, msg) => console.log(msg ?? "", data),
    error: (err, msg) => console.error(msg ?? "", err),
};
// --- Environment variables ---
function getEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing environment variable: ${name}`);
    return value.replace(/^"|"$/g, "");
}
const MCP_ENDPOINT = getEnv("MCP_ENDPOINT"); // e.g. http://localhost:4000
// --- Mocked JIRA response ---
async function listRequirements(label) {
    logger.info({ label }, "Mocking JIRA fetch");
    return [
        {
            key: "BEER-101",
            fields: {
                summary: "Endpoint: GET https://api.sampleapis.com/beers/ale",
                description: `
Validate the Beer Ale API from sampleapis.com.

Acceptance Criteria:
- Verify GET /beers/ale returns a non-empty list of beers.
- Each beer object must include: id, name, price, rating.average, rating.reviews, image.
- Validate rating.average is between 0 and 5.
- Validate price string starts with '$' and is numeric.
- Ensure at least one beer has reviews > 400 (high volume).
- Ensure at least one beer has rating.average < 2 (low rating edge case).
- Ensure at least one beer has rating.average > 4.5 (high rating edge case).
- Performance: response time < 2s for 20 iterations.
- Negative case: invalid endpoint /beers/invalid returns 404.
    `,
                labels: [
                    "api-test",
                    "sampleapis",
                    "beer-ale",
                    "validation",
                    "performance",
                    "negative-case"
                ]
            },
        },
    ];
}
// --- Convert issue to Gherkin ---
function toGherkin(issue) {
    const title = issue.fields?.summary ?? "(no title)";
    const ac = (issue.fields?.description || "").trim();
    return `Feature: ${title}\n\nScenario: Default\n${ac}`;
}
// --- Call MCP service using built-in fetch ---
async function mcpGenerate(gherkin, env, issueKey) {
    logger.info({ env, length: gherkin.length }, "Sending request to MCP /generate");
    const res = await fetch(`${MCP_ENDPOINT}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            instructions: `Generate Rest Assured (Java, JUnit5) tests + test data for ${env}. 
Target endpoint: https://api.sampleapis.com/beers/ale. 
Use class name BeerApiTests. Cover valid/404/400, schema, non-negative amounts, performance.`,
            input: gherkin,
            context: { issueKey },
        }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "<no body>");
        throw new Error(`MCP error: ${res.status} - ${body}`);
    }
    const data = await res.json();
    logger.info(data, "MCP raw response");
    if (!data.code && !data.files) {
        throw new Error("MCP response missing 'code' or 'files'");
    }
    return data;
}
// --- Main run ---
async function run() {
    logger.info({ MCP_ENDPOINT }, "Starting jira-to-mcp");
    const issues = await listRequirements("Testing");
    logger.info({ count: issues.length }, "Fetched issues");
    for (const issue of issues) {
        const key = issue.key ?? "(unknown)";
        const title = issue.fields?.summary ?? "(no title)";
        logger.info({ key, title }, "Processing issue");
        try {
            const gherkin = toGherkin(issue);
            const env = "TEST";
            const data = await mcpGenerate(gherkin, env, key);
            if (data.files?.length) {
                for (const f of data.files) {
                    await fs_1.promises.mkdir(path_1.default.dirname(f.path), { recursive: true });
                    await fs_1.promises.writeFile(f.path, f.contents, "utf8");
                    logger.info({ key, env, outPath: f.path }, "Test file written");
                }
            }
            else if (data.code) {
                const dir = `tests/src/test/java/com/bank/api`;
                const outPath = `${dir}/${key.replace(/[^A-Za-z0-9]/g, "_")}_BeerApiTests.java`;
                await fs_1.promises.mkdir(dir, { recursive: true });
                // Replace class name and endpoint inside the code
                const updatedCode = data.code
                    .replace(/CustomerInfoTests/g, "BeerApiTests")
                    .replace(/\/api\/customers\/\{customerId\}/g, "https://api.sampleapis.com/beers/ale");
                await fs_1.promises.writeFile(outPath, updatedCode, "utf8");
                logger.info({ key, env, outPath }, "Beer API Test file written");
            }
        }
        catch (err) {
            logger.error(err, `Failed to process issue ${key}`);
        }
    }
    logger.info({}, "Run complete");
}
run().catch((err) => {
    logger.error(err, "Unhandled error in run");
    process.exit(1);
});
