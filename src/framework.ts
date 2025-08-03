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
import os from "os";
import {
  ScriptCategory,
  ScriptDefinition,
  FrameworkOptions,
  LogLevel,
} from "./types/index.js";

const execAsync = promisify(exec);

// Get system information for logging
const systemInfo = {
  platform: os.platform(),
  release: os.release(),
  hostname: os.hostname(),
  arch: os.arch(),
  nodeVersion: process.version
};



export class AppleScriptFramework {
  private server: Server;
  private categories: ScriptCategory[] = [];
  private _initInfo: Record<string, any> = {};
  private _isConnected: boolean = false;
  private _pendingCategories: Array<Record<string, any>> = [];

  /**
   * Constructs an instance of AppleScriptFramework.
   * @param options - Configuration options for the framework.
   */
  constructor(options: FrameworkOptions = {}) {
    const serverName = options.name || "applescript-server";
    const serverVersion = options.version || "1.0.0";
    
    this.server = new Server(
      {
        name: serverName,
        version: serverVersion,
      },
      {
        capabilities: {
          tools: {},
          logging: {}, // Enable logging capability
        },
      },
    );

    if (options.debug) {
      this.enableDebugLogging();
    }
    
    // Log server initialization with stderr (server isn't connected yet)
    console.error(`[INFO] AppleScript MCP server initialized - ${serverName} v${serverVersion}`);
    
    // Store initialization info for later logging after connection
    this._initInfo = {
      name: serverName,
      version: serverVersion,
      debug: !!options.debug,
      system: systemInfo
    };
  }

  /**
   * Enables debug logging for the server.
   * Sets up error handlers and configures detailed logging.
   */
  private enableDebugLogging(): void {
    console.error("[INFO] Debug logging enabled");
    
    this.server.onerror = (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MCP Error]", error);
      
      // Only use MCP logging if connected
      if (this._isConnected) {
        this.log("error", "MCP server error", { error: errorMessage });
      }
    };
    
    // Set up additional debug event handlers if needed
    this.server.oninitialized = () => {
      this._isConnected = true;
      console.error("[DEBUG] Connection initialized");
      
      // We'll log initialization info in the run method after connection is fully established
      console.error("[DEBUG] Connection initialized");
    };
    
    this.server.onclose = () => {
      this._isConnected = false;
      console.error("[DEBUG] Connection closed");
      
      // No MCP logging here since we're disconnected
    };
  }

  /**
   * Adds a new script category to the framework.
   * @param category - The script category to add.
   */
  addCategory(category: ScriptCategory): void {
    this.categories.push(category);
    
    // Use console logging since this is called before server connection
    console.error(`[DEBUG] Added category: ${category.name} (${category.scripts.length} scripts)`);
    
    // Store category info to log via MCP after connection
    if (!this._pendingCategories) {
      this._pendingCategories = [];
    }
    this._pendingCategories.push({
      categoryName: category.name,
      scriptCount: category.scripts.length,
      description: category.description
    });
  }

  /**
   * Logs a message with the specified severity level.
   * Uses the MCP server's logging system to record events if available.
   * Always logs to console for visibility.
   * 
   * @param level - The severity level of the log message following RFC 5424 syslog levels
   * @param message - The message to log
   * @param data - Optional additional data to include with the log message
   * 
   * @example
   * // Log a debug message
   * framework.log("debug", "Processing request", { requestId: "123" });
   * 
   * @example
   * // Log an error
   * framework.log("error", "Failed to execute script", { scriptName: "calendar_add" });
   */
  log(level: LogLevel, message: string, data?: Record<string, any>): void {
    // Format for console output
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    // Always log to stderr for visibility
    console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`);
    
    // Only try to use MCP logging if we're connected
    if (this._isConnected) {
      try {
        this.server.sendLoggingMessage({
          level: level,
          message: message,
          data: data || {},
        });
      } catch (error) {
        // Silently ignore logging errors - we've already logged to console
      }
    }
  }

  /**
   * Executes an AppleScript and returns the result.
   * @param script - The AppleScript to execute.
   * @returns The result of the script execution.
   * @throws Will throw an error if the script execution fails.
   */
  private async executeScript(script: string): Promise<string> {
    // Log script execution (truncate long scripts for readability)
    const scriptPreview = script.length > 100 ? script.substring(0, 100) + "..." : script;
    this.log("debug", "Executing AppleScript", { scriptPreview });
    
    try {
      const startTime = Date.now();
      const { stdout } = await execAsync(
        `osascript -e '${script.replace(/'/g, "'\"'\"'")}'`,
      );
      const executionTime = Date.now() - startTime;
      
      this.log("debug", "AppleScript executed successfully", { 
        executionTimeMs: executionTime,
        outputLength: stdout.length
      });
      
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
      
      this.log("error", "AppleScript execution failed", { 
        error: errorMessage,
        scriptPreview
      });
      
      throw new Error(`AppleScript execution failed: ${errorMessage}`);
    }
  }

  /**
   * Parses hierarchical text data from OmniFocus and converts it to JSON.
   * @param rawData - The raw text data from AppleScript.
   * @returns JSON string representing the hierarchical structure.
   */
  private parseHierarchicalData(rawData: string): string {
    try {
      // Parse the structured text format
      const lines = rawData.split('\n').filter(line => 
        line.trim() && 
        !line.includes('HIERARCHICAL_START') && 
        !line.includes('HIERARCHICAL_END')
      );
      
      interface HierarchicalItem {
        name: string;
        id: string;
        type: string;
        depth: number;
        completed?: boolean;
        flagged?: boolean;
        dropped?: boolean;
        hidden?: boolean;
        dueDate?: string;
        children: HierarchicalItem[];
      }
      
      const parseItem = (line: string): HierarchicalItem | null => {
        const parts = line.split('|');
        if (parts.length < 7) return null;
        
        const [type, name, id, itemType, ...rest] = parts;
        
        let completed = false;
        let flagged = false;
        let dropped = false;
        let hidden = false;
        let depth = 0;
        let dueDate = '';
        
        if (type === 'FOLDER') {
          hidden = rest[0] === 'true';
          depth = parseInt(rest[3] || '0', 10);
        } else if (type === 'PROJECT') {
          completed = rest[0] === 'true';
          dropped = rest[2] === 'true';
          depth = parseInt(rest[3] || '0', 10);
        } else if (type === 'TASK') {
          completed = rest[0] === 'true';
          flagged = rest[1] === 'true';
          dropped = rest[2] === 'true';
          depth = parseInt(rest[3] || '0', 10);
          dueDate = rest[4] || '';
        } else if (type === 'INBOX') {
          depth = 0;
        }
        
        const item: HierarchicalItem = {
          name,
          id: id || '',
          type: itemType,
          depth,
          children: []
        };
        
        if (completed !== undefined) item.completed = completed;
        if (flagged !== undefined) item.flagged = flagged;
        if (dropped !== undefined) item.dropped = dropped;
        if (hidden !== undefined) item.hidden = hidden;
        if (dueDate) item.dueDate = dueDate;
        
        return item;
      };
      
      const items: HierarchicalItem[] = [];
      const stack: HierarchicalItem[] = [];
      
      for (const line of lines) {
        const item = parseItem(line);
        if (!item) continue;
        
        // Find the correct parent based on depth
        while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          // Top-level item
          items.push(item);
        } else {
          // Child item
          stack[stack.length - 1].children.push(item);
        }
        
        stack.push(item);
      }
      
      return JSON.stringify({ folders: items }, null, 2);
    } catch (error) {
      this.log("error", "Failed to parse hierarchical data", { error: error instanceof Error ? error.message : String(error) });
      return rawData; // Return original data if parsing fails
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
      const toolName = request.params.name;
      this.log("info", "Tool execution requested", { 
        tool: toolName,
        hasArguments: !!request.params.arguments
      });
      
      try {
        // Split on underscore instead of dot
        const [categoryName, ...scriptNameParts] =
          toolName.split("_");
        const scriptName = scriptNameParts.join("_"); // Rejoin in case script name has underscores

        const category = this.categories.find((c) => c.name === categoryName);
        if (!category) {
          this.log("warning", "Category not found", { categoryName });
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Category not found: ${categoryName}`,
          );
        }

        const script = category.scripts.find((s) => s.name === scriptName);
        if (!script) {
          this.log("warning", "Script not found", { 
            categoryName, 
            scriptName 
          });
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Script not found: ${scriptName}`,
          );
        }

        this.log("debug", "Generating script content", { 
          categoryName, 
          scriptName,
          isFunction: typeof script.script === "function"
        });
        
        const scriptContent =
          typeof script.script === "function"
            ? script.script(request.params.arguments)
            : script.script;

        const rawResult = await this.executeScript(scriptContent);
        
        // Post-process the result if it's hierarchical data from OmniFocus
        let processedResult = rawResult;
        if (categoryName === "omnifocus" && scriptName === "listItems" && rawResult.includes("HIERARCHICAL_START")) {
          processedResult = this.parseHierarchicalData(rawResult);
        }
        
        this.log("info", "Tool execution completed successfully", { 
          tool: toolName,
          resultLength: processedResult.length
        });

        return {
          content: [
            {
              type: "text",
              text: processedResult,
            },
          ],
        };
      } catch (error) {
        if (error instanceof McpError) {
          this.log("error", "MCP error during tool execution", { 
            tool: toolName,
            errorCode: error.code,
            errorMessage: error.message
          });
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

        this.log("error", "Error during tool execution", { 
          tool: toolName,
          errorMessage
        });

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
    console.error("[INFO] Setting up request handlers");
    this.setupHandlers();
    
    console.error("[INFO] Initializing StdioServerTransport");
    const transport = new StdioServerTransport();
    
    try {
      console.error("[INFO] Connecting server to transport");
      await this.server.connect(transport);
      this._isConnected = true;
      
      // Log server running status using console only
      const totalScripts = this.categories.reduce((count, category) => count + category.scripts.length, 0);
      console.error(`[NOTICE] AppleScript MCP server running with ${this.categories.length} categories and ${totalScripts} scripts`);
      
      console.error("AppleScript MCP server running");
    } catch (error) {
      let errorMessage = "Unknown error occurred";
      if (error && typeof error === "object" && error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("Failed to start AppleScript MCP server:", errorMessage);
      throw error;
    }
  }
}
