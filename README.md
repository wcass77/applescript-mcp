# applescript-mcp MCP Server

A Model Context Protocol server

This is a TypeScript-based MCP server that implements interaction with macOS via AppleScript.

## Categories

### Calendar
- `add` - Create a new calendar event
  - Takes title, start time, and end time as required parameters
  - Adds event to the Calendar app
- `list` - List all calendar events for the current day
  - Returns a structured list of all events in the Calendar app

### Clipboard
- `set_clipboard` - Copy text to the clipboard
  - Takes text as a required parameter
  - Copies text to the clipboard
- `get_clipboard` - Retrieve text from the clipboard
  - Returns the current contents of the clipboard
- `clear_clipboard` - Clear the clipboard
  - Clears the contents of the clipboard

### Finder
- `get_selected_files` - Retrieve the selected files in the Finder
  - Returns a structured list of selected files
- `search_files` - Search for files in the Finder
  - Takes a search query as a required parameter
  - Returns a structured list of search results
- `quick_look` - Open a Quick Look preview of a file
  - Takes a file path as a required parameter
  - Opens a Quick Look preview of the file

### Notifications
- `send_notification` - Display a notification
  - Takes a title and message as required parameters
  - Displays a notification with the given title and message
- `toggle_do_not_disturb` - Toggle Do Not Disturb mode
  - Toggles the Do Not Disturb mode on or off

### System
- `volume` - Set the system volume
- `get_frontmost_app`- Get the frontmost application
- `launch_app` - Open an application
- `quit_app` - Quit an application
- `toggle_dark_mode` - Toggle Dark Mode

### iTerm
- `paste_clipboard` - Paste clipboard content into iTerm
- `run` - Run a command in iTerm

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "applescript-mcp": {
      "command": "/path/to/applescript-mcp/dist/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
