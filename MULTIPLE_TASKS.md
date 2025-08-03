# Multiple Task Creation Feature

The `createTasks` script in the OmniFocus category now supports creating multiple tasks in a single request while maintaining backward compatibility with single task creation.

## Usage

### Single Task Creation (Backward Compatible)

```json
{
  "taskName": "Review quarterly report",
  "taskNotes": "Focus on sales metrics and growth trends",
  "dueDate": "January 20, 2024",
  "flagged": true,
  "projectName": "Q1 Planning",
  "tagNames": ["urgent", "review"]
}
```

### Multiple Task Creation

```json
{
  "tasks": [
    {
      "taskName": "Review quarterly report",
      "taskNotes": "Focus on sales metrics",
      "dueDate": "January 20, 2024",
      "flagged": true,
      "projectName": "Q1 Planning",
      "tagNames": ["urgent", "review"]
    },
    {
      "taskName": "Prepare presentation slides",
      "taskNotes": "Create slides for board meeting",
      "dueDate": "January 22, 2024",
      "projectName": "Q1 Planning",
      "tagNames": ["presentation"]
    },
    {
      "taskName": "Schedule team meeting",
      "flagged": false,
      "projectName": "Q1 Planning"
    }
  ]
}
```

## Features

- **Backward Compatibility**: Existing single task creation calls continue to work unchanged
- **Flexible Validation**: Either `taskName` or `tasks` array must be provided
- **Individual Task Properties**: Each task in the array can have its own properties (notes, due date, project, tags, etc.)
- **Error Handling**: Graceful handling of missing projects, invalid tags, and date parsing errors
- **Return Summary**: Returns a summary with the count of created tasks and their IDs

## Return Format

The script returns a string in the format:
```
"Created 3 tasks with IDs: ABC123-DEF456, GHI789-JKL012, MNO345-PQR678"
```

## Error Handling

- If neither `taskName` nor `tasks` is provided, returns an error message
- Invalid dates are skipped with a try/catch block
- Non-existent projects leave tasks in the inbox
- Invalid tags are skipped silently
- Each task requires at least a `taskName` property

## Schema

The updated schema supports both modes:

- **Single Task Mode**: Use `taskName`, `taskNotes`, `dueDate`, `flagged`, `projectName`, `tagNames` properties
- **Multiple Task Mode**: Use `tasks` array where each item has the same properties as single task mode

Both modes are optional at the schema level, with validation performed in the script logic to ensure at least one valid input method is provided.
