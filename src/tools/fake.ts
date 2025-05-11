import { z } from "zod";
import { CallTool } from "./types";

export const fakeTool: CallTool = {
  name: "fake",
  description: "Fake tool",
  paramsSchema: {
    name: z.string(),
  },
  callback: async ({ name }) => {
    return {
      content: [{ type: "text", text: `Hello ${name}!` }],
    };
  },
};
