
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
