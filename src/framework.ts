import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import {
  ScriptCategory,
  ScriptDefinition,
  FrameworkOptions,
} from "./types/index.js";

const execAsync = promisify(exec);

export class AppleScriptFramework {
  private server: Server;
  private categories: ScriptCategory[] = [];

  /**
   * Constructs an instance of AppleScriptFramework.
   * @param options - Configuration options for the framework.
   */
  constructor(options: FrameworkOptions = {}) {
    this.server = new Server(
      {
        name: options.name || "applescript-server",
        version: options.version || "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    if (options.debug) {
      this.enableDebugLogging();
    }
  }

  /**
   * Enables debug logging for the server.
   */
  private enableDebugLogging(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };
  }

  /**
   * Adds a new script category to the framework.
   * @param category - The script category to add.
   */
  addCategory(category: ScriptCategory): void {
    this.categories.push(category);
  }

  /**
   * Executes an AppleScript and returns the result.
   * @param script - The AppleScript to execute.
   * @returns The result of the script execution.
   * @throws Will throw an error if the script execution fails.
   */
  private async executeScript(script: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `osascript -e '${script.replace(/'/g, "'\"'\"'")}'`,
      );
      return stdout.trim();
    } catch (error) {
      // Properly type check the error object
      let errorMessage = "Unknown error occurred";
      if (error && typeof error === "object") {
        if ("message" in error && typeof error.message === "string") {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      throw new Error(`AppleScript execution failed: ${errorMessage}`);
    }
  }

  /**
   * Sets up request handlers for the server.
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.categories.flatMap((category) =>
        category.scripts.map((script) => ({
          name: `${category.name}_${script.name}`, // Changed from dot to underscore
          description: `[${category.description}] ${script.description}`,
          inputSchema: script.schema || {
            type: "object",
            properties: {},
          },
        })),
      ),
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Split on underscore instead of dot
        const [categoryName, ...scriptNameParts] =
          request.params.name.split("_");
        const scriptName = scriptNameParts.join("_"); // Rejoin in case script name has underscores

        const category = this.categories.find((c) => c.name === categoryName);
        if (!category) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Category not found: ${categoryName}`,
          );
        }

        const script = category.scripts.find((s) => s.name === scriptName);
        if (!script) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Script not found: ${scriptName}`,
          );
        }

        const scriptContent =
          typeof script.script === "function"
            ? script.script(request.params.arguments)
            : script.script;

        const result = await this.executeScript(scriptContent);

        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        let errorMessage = "Unknown error occurred";
        if (error && typeof error === "object") {
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Runs the AppleScript framework server.
   */
  async run(): Promise<void> {
    this.setupHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AppleScript MCP server running");
  }
}
