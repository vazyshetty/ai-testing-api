import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
});

// Beer API mock endpoints
app.get("/beers/ale", (_req: Request, res: Response) => {
    res.status(200).json([
        {
            id: 1,
            name: "Sample Ale",
            price: 15.49 // ✅ numeric instead of "$15.49"
        },
        {
            id: 2,
            name: "Golden Lager",
            price: 12.99
        }
    ]);
});

// Invalid endpoint mock
app.get("/beers/invalid", (_req: Request, res: Response) => {
    // ✅ Return 404 instead of 200 with empty list
    res.status(404).json({ error: "Not Found" });
});

// Invalid method mock
app.post("/beers/ale", (_req: Request, res: Response) => {
    // ✅ Return 405 instead of 415
    res.status(405).json({ error: "Method Not Allowed" });
});

// MCP /generate endpoint (returns BeerApiTests.java)
app.post("/generate", (req: Request, res: Response) => {
    const code = `
import io.restassured.RestAssured;
import io.restassured.response.Response;
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
      .get("http://localhost:4000/beers/ale")
    .then()
      .statusCode(200)
      .body("size()", greaterThan(0));
  }

  @Test
  @Tag("negative-case")
  void invalidEndpoint_returns404() {
    RestAssured.given()
    .when()
      .get("http://localhost:4000/beers/invalid")
    .then()
      .statusCode(404);
  }

  @Test
  @Tag("schema")
  void beerItem_hasExpectedFields() {
    Response response = RestAssured.given()
      .when()
        .get("http://localhost:4000/beers/ale")
      .then()
        .statusCode(200)
        .extract().response();

    String name = response.jsonPath().getString("[0].name");
    float price = response.jsonPath().getFloat("[0].price");
    int id = response.jsonPath().getInt("[0].id");

    assertNotNull(name);
    assertFalse(name.isEmpty());
    assertTrue(price >= 0.0f);
    assertTrue(id > 0);
  }

  @Test
  @Tag("performance")
  void beerList_multipleRequests_underThreshold() {
    long start = System.currentTimeMillis();
    for (int i = 0; i < 20; i++) {
      RestAssured.given()
      .when()
        .get("http://localhost:4000/beers/ale")
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
      .post("http://localhost:4000/beers/ale")
    .then()
      .statusCode(405);
  }
}
`;

    res.json({
        code,
        files: [
            {
                path: "src/test/java/com/bank/api/BeerApiTests.java",
                contents: code
            }
        ],
        summary: "Generated Rest Assured tests for Beer API",
        metadata: { framework: "rest-assured", language: "java", runtime: "junit5" }
    });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Beer API MCP mock running on http://localhost:${port}`);
});
