import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiRouter } from "./routes/index";
import {
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

const app = new OpenAPIHono();

function startServer() {
  const PORT = process.env.PORT || 3000;
  app.use(logger());
  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });

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
}

startServer();
