import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types";

export type CallTool = {
  name: string;
  description: string;
  paramsSchema: {
    name: z.ZodString;
  };
  callback: (args: { name: string }) => Promise<CallToolResult>;
};
