"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Generate endpoint
app.post("/generate", (req, res) => {
    const { instructions, input } = req.body;
    if (!instructions || !input) {
        return res.status(400).json({ error: "Missing instructions or input" });
    }
    // For POC: return deterministic Rest Assured test code for Beer API
    const code = `
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

public class BeerApiTests {

  @Test
  @Tag("validation")
  void beerList_returns200_andNotEmpty() {
    RestAssured.given()
    .when()
      .get("https://api.sampleapis.com/beers/ale")
    .then()
      .statusCode(200)
      .body("size()", greaterThan(0));
  }

  @Test
  @Tag("negative-case")
  void invalidEndpoint_returns404() {
    RestAssured.given()
    .when()
      .get("https://api.sampleapis.com/beers/invalid")
    .then()
      .statusCode(404);
  }

  @Test
  @Tag("schema")
  void beerItem_hasExpectedFields() {
    RestAssured.given()
    .when()
      .get("https://api.sampleapis.com/beers/ale")
    .then()
      .statusCode(200)
      .body("[0].name", not(isEmptyOrNullString()))
      .body("[0].price", greaterThanOrEqualTo(0.0f))
      .body("[0].id", greaterThan(0));
  }

  @Test
  @Tag("performance")
  void beerList_multipleRequests_underThreshold() {
    long start = System.currentTimeMillis();
    for (int i = 0; i < 20; i++) {
      RestAssured.given()
      .when()
        .get("https://api.sampleapis.com/beers/ale")
      .then()
        .statusCode(200);
    }
    long duration = System.currentTimeMillis() - start;
    assertTrue(duration < 5000, "20 requests should complete under 5 seconds");
  }

  @Test
  @Tag("negative-case")
  void beerList_invalidMethod_returns405() {
    RestAssured.given()
    .when()
      .post("https://api.sampleapis.com/beers/ale")
    .then()
      .statusCode(anyOf(is(400), is(405)));
  }
}
`;
    res.json({
        code,
        files: [
            {
                path: "tests/src/test/java/com/bank/api/BeerApiTests.java",
                contents: code
            }
        ],
        summary: "Generated Rest Assured tests for Beer API",
        metadata: { framework: "rest-assured", language: "java", runtime: "junit5" }
    });
});
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`MCP service running on http://localhost:${port}`);
});
