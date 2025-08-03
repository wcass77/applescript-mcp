# OmniFocus Integration

This document describes the OmniFocus integration for the AppleScript MCP server.

## Features Implemented

### 1. Create Task (`omnifocus_createTask`)

Creates a new task in OmniFocus with support for various properties.

#### Parameters

- `taskName` (required): The name/title of the task
- `taskNotes` (optional): Notes or description for the task
- `dueDate` (optional): Due date in a format AppleScript can parse (e.g., "January 15, 2024")
- `flagged` (optional): Boolean to set the task as flagged (default: false)
- `projectName` (optional): Name of the project to assign the task to (default: "Inbox")
- `tagNames` (optional): Array of tag names to assign to the task

#### Example Usage

```json
{
  "taskName": "Buy groceries",
  "taskNotes": "Don't forget the milk and eggs",
  "dueDate": "January 20, 2024",
  "flagged": true,
  "projectName": "Personal",
  "tagNames": ["errands", "shopping"]
}
```

#### Minimal Example

```json
{
  "taskName": "Simple task"
}
```

#### Return Value

Returns the OmniFocus task ID if successful.

#### Error Handling

- If the specified project doesn't exist, the task will be created in the Inbox
- If specified tags don't exist, they will be skipped (the task will still be created)
- If the due date format is invalid, it will be ignored
- The task creation itself will fail only if OmniFocus is not accessible or the task name is empty

## Prerequisites

1. **OmniFocus 4**: The application must be installed and accessible
2. **System Permissions**: macOS System Preferences > Security & Privacy > Privacy > Automation must allow the MCP server (or Terminal/Script Editor) to control OmniFocus
3. **AppleScript Support**: OmniFocus has built-in AppleScript support enabled

## Technical Notes

- Uses OmniFocus 4's native AppleScript dictionary
- Tasks are created in the Inbox by default and then moved to the specified project if it exists
- Tags are added after task creation using OmniFocus 4's tag system (not the older context system)
- Error handling is implemented to gracefully handle missing projects, tags, or invalid dates

## Testing

To test the integration manually, you can run this AppleScript directly:

```applescript
tell application "OmniFocus"
  tell default document
    set theTask to make new inbox task with properties {name:"Test Task", flagged:false}
    return id of theTask
  end tell
end tell
```

This should create a simple task and return its ID.
