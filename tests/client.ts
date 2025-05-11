import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ListToolsRequest,
  ListToolsResultSchema,
  CallToolRequest,
  CallToolResultSchema,
  ListToolsResult,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

// Global client and transport for interactive commands
let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;
let serverUrl = "http://localhost:3000/mcp?token=test";
let sessionId: string | undefined = undefined;

async function connect(): Promise<void> {
  console.log(`Connecting to ${serverUrl}...`);

  // Create a new client
  client = new Client({
    name: "test-client",
    version: "1.0.0",
  });
  client.onerror = (error) => {
    throw error;
  };

  transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    sessionId: sessionId,
  });

  // Connect the client
  await client.connect(transport);
  sessionId = transport.sessionId;
  console.log("Transport created with session ID:", sessionId);
  console.log("Connected to MCP server");
}

async function terminateSession(): Promise<void> {
  if (!client || !transport) {
    return;
  }

  try {
    console.log("Terminating session with ID:", transport.sessionId);
    await transport.terminateSession();
    console.log("Session terminated successfully");

    // Check if sessionId was cleared after termination
    if (!transport.sessionId) {
      console.log("Session ID has been cleared");
      sessionId = undefined;

      // Also close the transport and clear client objects
      await transport.close();
      console.log("Transport closed after session termination");
      client = null;
      transport = null;
    } else {
      console.log("Server responded with 405 Method Not Allowed (session termination not supported)");
      console.log("Session ID is still active:", transport.sessionId);
    }
  } catch (error) {
    console.error("Error terminating session:", error);
  }
}

async function listTools(): Promise<ListToolsResult["tools"]> {
  if (!client) {
    throw new Error("Not connected to server.");
  }

  const toolsRequest: ListToolsRequest = {
    method: "tools/list",
    params: {},
  };

  const toolsResult = await client.request(toolsRequest, ListToolsResultSchema);

  return toolsResult.tools;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult["content"]> {
  if (!client) {
    throw new Error("Not connected to server.");
  }

  const request: CallToolRequest = {
    method: "tools/call",
    params: {
      name,
      arguments: args,
    },
  };

  console.log(`Calling tool '${name}' with args:`, args);
  const result = await client.request(request, CallToolResultSchema);

  return result.content;
}

async function main() {
  await connect();
  const tools = await listTools();
  console.log("Available tools:", tools.length);
  const tool = tools.find((tool) => tool.name === "fake");
  if (!tool) {
    throw new Error("Fake tool not found");
  }
  const result = await callTool(tool.name, { name: "John" });
  const expectedGreeting = "Hello John!";
  if (result[0].text !== expectedGreeting) {
    throw new Error(`Expected tool result to contain "${expectedGreeting}", but got: "${result[0].text}"`);
  }
  console.log("\x1b[32m%s\x1b[0m", "All tests passed successfully!");
  await terminateSession();
}

main().catch(async (error: unknown) => {
  console.error("Error running test:", error);
  await terminateSession();
  process.exit(1);
});
