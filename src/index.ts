import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { OpenAPIHono } from "@hono/zod-openapi";
import { prettyJSON } from "hono/pretty-json";
import { showRoutes } from "hono/dev";
import { apiRouter } from "./routes/index";
import { startConsumer } from "./mq/consumer";
import dotenv from "dotenv";
import {
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

dotenv.config();

const app = new OpenAPIHono().basePath("/");

export const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

function startServer() {
  const PORT = process.env.PORT || 3000;

  startConsumer().catch(console.error);

  app.get("/", (c) => {
    return c.json({ hello: "world" }, 200);
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    console.log(c.req);
    console.log(body);
    return c.json({ hello: "world" }, 200);
  });
  app.use(prettyJSON()); // With options: prettyJSON({ space: 4 })
  app.use(logger(customLogger));
  app.route("/api", apiRouter);

  // The OpenAPI documentation will be available at /doc
  app.get(
    "/ui",
    swaggerUI({
      url: "/doc",
    }),
  );
  app.doc31("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Auction Service API",
    },
  });

  app.getOpenAPI31Document({
    openapi: "3.1.0",
    info: { title: "Auction Service API", version: "1" },
  }); // schema object
  console.log(`Server is running on http://localhost:${PORT}`);
  function generateOpenApiDoc() {
    extendZodWithOpenApi(z);
    const registry = app.openAPIRegistry;
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateComponents();
  }

  generateOpenApiDoc();
  serve({
    fetch: app.fetch,
    port: PORT as number,
  });

  app.onError((err, c) => {
    console.error(`${err}`);
    return c.text("Custom Error Message", 500);
  });
}

showRoutes(app, {
  verbose: true,
});

startServer();
