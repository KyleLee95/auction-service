import { z } from "zod";
export const ParamsSchema = z
  .object({
    id: z
      .preprocess((val) => {
        if (typeof val === "string") {
          const num = Number(val);
          if (Number.isInteger(num)) {
            return num;
          } else {
            return NaN;
          }
        }
        return val;
      }, z.number().int())
      .openapi({
        param: {
          in: "path",
          name: "id",
          required: true,
        },
        description: "The unique resource identifier.",
        example: 123,
      }),
  })
  .strict();

export const QuerySchema = z
  .object({
    id: z
      .preprocess((val) => {
        if (typeof val === "string") {
          const num = Number(val);
          if (Number.isInteger(num)) {
            return num;
          } else {
            return NaN;
          }
        }
        return val;
      }, z.number().int())
      .openapi({
        param: {
          in: "path",
          name: "id",
          required: true,
        },
        description: "The unique resource identifier.",
        example: 123,
      }),
  })
  .strict();
