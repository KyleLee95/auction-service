import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import prisma from "../db";
import { z } from "zod";
import { CategoryModel, CategoryModelInput } from "../../prisma/zod";
import { ParamsSchema } from "./schemas";
const router = new OpenAPIHono();

const getCategorysRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Category"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            categories: z.array(CategoryModel),
          }),
        },
      },
      description: "Retrieve all Categorys",
    },
  },
});

router.openapi(getCategorysRoute, async (c) => {
  const category = await prisma.category.findMany();
  return c.json(
    {
      categories: category,
    },
    200,
  );
});

const getCategoryByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Category"],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(CategoryModel) }),
        },
      },
      description: "Retrieve a category tag by Id",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Could not find category tag",
    },
  },
});

router.openapi(getCategoryByIdRoute, async (c) => {
  const { id } = c.req.valid("param");
  const category = await prisma.category.findFirst({
    where: {
      id: id,
    },
  });
  if (!category) {
    return c.json({ message: "Could not find category tag" }, 404);
  }
  return c.json(
    {
      data: [category],
    },
    200,
  );
});

const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Category"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CategoryModelInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: z.array(CategoryModel) }),
        },
      },
      description: "Create a new category tag",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Unable to create new category tag",
    },
  },
});

router.openapi(createCategoryRoute, async (c) => {
  const body = await c.req.json();
  const newCategory = await prisma.category.create({
    data: {
      ...body,
    },
  });
  if (!newCategory) {
    return c.json({ message: "unable to create category tag" }, 400);
  }

  return c.json(
    {
      data: [newCategory],
    },
    200,
  );
});

const updateCategoryRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Category"],
  request: {
    params: ParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: CategoryModelInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ categories: z.array(CategoryModel) }),
        },
      },
      description: "Unable to update category tag",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Unable to create new category tag",
    },
  },
});

router.openapi(updateCategoryRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  const updatedCategory = await prisma.category.update({
    where: { id: id },
    data: { ...body },
  });

  if (!updatedCategory) {
    return c.json({ message: "unable to update category tag" }, 422);
  }

  return c.json({ categories: [updatedCategory] }, 200);
});

const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Category"],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ categories: z.array(CategoryModel) }),
        },
      },
      description: "Deleted a category based on its unique ID",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Unable to create new category tag",
    },
  },
});

router.openapi(deleteCategoryRoute, async (c) => {
  const { id } = c.req.valid("param");

  const deletedCategory = await prisma.category.delete({
    where: { id: id },
  });

  if (!deletedCategory) {
    return c.json({ message: "unable to update category tag" }, 422);
  }

  return c.json({ categories: [deletedCategory] }, 200);
});

export { router as categoriesRouter };
