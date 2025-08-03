# OmniFocus AppleScript Integration - Feature Specifications

## Overview
This document outlines the detailed specifications for each planned capability in the OmniFocus AppleScript integration system.

---

## Feature 1: Create Task

### User Story
As a user, I want to create new tasks in OmniFocus programmatically so that I can automate task creation from external systems, scripts, or workflows.

### Priority
**High** (1/5) - Core functionality for task management automation

### Effort Estimate
**Medium** (3/5) - Requires handling various task properties and validation

### Preconditions
- OmniFocus application is installed and accessible
- User has granted necessary permissions for AppleScript automation
- Target project exists (if specified)

### AppleScript Handler Signatures

```applescript
-- Basic task creation
on createTask(taskName as string)
    -- Returns: task ID or error

-- Full task creation with all properties
on createTaskWithProperties(taskName as string, taskNotes as string, dueDate as date, flagged as boolean, projectName as string, tagNames as list)
    -- Returns: task record with ID and created properties

-- Batch task creation
on createMultipleTasks(taskList as list)
    -- taskList: list of records containing task properties
    -- Returns: list of created task IDs or error details
```

### Expected Outputs

#### Success Cases
- **Single Task Creation**: Returns task ID (string) and confirmation message
- **Batch Creation**: Returns list of successfully created task IDs
- **Task with Properties**: Returns complete task record with all assigned properties

#### Edge Cases & Error Handling
- **Duplicate Task Names**: Allow creation (OmniFocus permits duplicates)
- **Invalid Date Formats**: Return descriptive error message
- **Non-existent Project**: Create task in inbox with warning
- **Invalid Tag Names**: Skip invalid tags, create task with valid ones
- **Empty Task Name**: Return error - task name is required
- **OmniFocus Not Running**: Attempt to launch, return error if failed
- **Permission Denied**: Return clear error message about automation permissions

### Sample Expected Response
```json
{
  "success": true,
  "taskId": "ABC123-DEF456",
  "message": "Task 'Review quarterly report' created successfully",
  "warnings": ["Tag 'nonexistent-tag' not found, skipped"]
}
```

---

## Feature 2: Fetch Task

### User Story
As a user, I want to retrieve task information from OmniFocus so that I can display task status, sync with external systems, or generate reports.

### Priority
**High** (2/5) - Essential for integration and synchronization

### Effort Estimate
**Medium** (2/5) - Straightforward data retrieval with filtering options

### Preconditions
- OmniFocus application is accessible
- Task exists in the system
- User has read permissions for OmniFocus data

### AppleScript Handler Signatures

```applescript
-- Fetch single task by ID
on fetchTaskById(taskId as string)
    -- Returns: task record with all properties

-- Fetch tasks by name (may return multiple)
on fetchTasksByName(taskName as string)
    -- Returns: list of task records

-- Fetch tasks with filters
on fetchTasksWithFilters(projectName as string, tagNames as list, status as string, dueDateRange as record)
    -- Returns: list of filtered task records

-- Fetch all tasks in a specific context
on fetchTasksInContext(contextName as string)
    -- contextName: "Inbox", "Flagged", "Today", "Forecast", or project name
    -- Returns: list of task records
```

### Expected Outputs

#### Success Cases
- **Single Task**: Complete task record with all properties
- **Multiple Tasks**: Array of task records
- **Filtered Results**: Subset of tasks matching criteria
- **Empty Results**: Empty array with success status

#### Task Record Structure
```json
{
  "id": "ABC123-DEF456",
  "name": "Review quarterly report",
  "notes": "Focus on sales metrics and growth trends",
  "status": "open", // open, completed, canceled
  "creationDate": "2024-01-15T10:30:00Z",
  "modificationDate": "2024-01-16T14:20:00Z",
  "dueDate": "2024-01-20T17:00:00Z",
  "flagged": true,
  "project": "Q1 Planning",
  "tags": ["urgent", "review", "quarterly"]
}
```

#### Edge Cases & Error Handling
- **Non-existent Task ID**: Return error with clear message
- **Invalid Filter Parameters**: Return error explaining valid options
- **No Matching Tasks**: Return empty array with success status
- **OmniFocus Database Issues**: Return error with retry suggestion
- **Large Result Sets**: Implement pagination or result limits

---

## Feature 3: Update Status

### User Story
As a user, I want to update task status (complete, cancel, reopen) programmatically so that I can automate workflow state changes and keep OmniFocus synchronized with external systems.

### Priority
**High** (3/5) - Critical for workflow automation

### Effort Estimate
**Low** (2/5) - Simple property updates with validation

### Preconditions
- Task exists and is accessible
- New status is valid for current task state
- User has write permissions for OmniFocus

### AppleScript Handler Signatures

```applescript
-- Update single task status
on updateTaskStatus(taskId as string, newStatus as string)
    -- newStatus: "completed", "canceled", "open"
    -- Returns: updated task record

-- Bulk status update
on updateMultipleTaskStatus(taskIds as list, newStatus as string)
    -- Returns: list of update results

-- Complete task with specific completion date
on completeTaskWithDate(taskId as string, completionDate as date)
    -- Returns: updated task record

-- Reopen completed/canceled task
on reopenTask(taskId as string)
    -- Returns: updated task record
```

### Expected Outputs

#### Success Cases
- **Status Updated**: Confirmation with new status and timestamp
- **Bulk Update**: Summary of successful and failed updates
- **State Transition**: Clear indication of status change

#### Edge Cases & Error Handling
- **Invalid Status Values**: Return error with valid options
- **Task Not Found**: Return clear error message
- **Invalid State Transition**: Error for impossible transitions (e.g., completing already completed task)
- **Completion Date in Future**: Warning or error based on configuration

### Sample Expected Response
```json
{
  "success": true,
  "taskId": "ABC123-DEF456",
  "previousStatus": "open",
  "newStatus": "completed",
  "completionDate": "2024-01-16T15:30:00Z",
  "message": "Task 'Review quarterly report' marked as completed"
}
```

---

## Feature 4: Assign Tags/Projects

### User Story
As a user, I want to assign and modify tags and projects for tasks in OmniFocus so that I can organize and categorize tasks programmatically based on external data or automated rules.

### Priority
**Medium** (4/5) - Important for organization and categorization

### Effort Estimate
**Medium** (3/5) - Requires handling relationships and validation

### Preconditions
- Target task exists
- Projects and tags exist in OmniFocus (or can be created)

### AppleScript Handler Signatures

```applescript
-- Assign task to project
on assignTaskToProject(taskId as string, projectName as string)
    -- Returns: updated task record

-- Add tags to task
on addTagsToTask(taskId as string, tagNames as list)
    -- Returns: updated task record with new tags

-- Remove tags from task
on removeTagsFromTask(taskId as string, tagNames as list)
    -- Returns: updated task record

-- Replace all tags
on replaceTaskTags(taskId as string, newTagNames as list)
    -- Returns: updated task record

-- Bulk tag assignment
on bulkAssignTags(taskIds as list, tagNames as list, operation as string)
    -- operation: "add", "remove", "replace"
    -- Returns: list of update results
```

### Expected Outputs

#### Success Cases
- **Assignment Confirmed**: Task record with updated project/tags
- **Bulk Operations**: Summary of successful assignments
- **Auto-creation**: Confirmation when new tags/projects are created

#### Edge Cases & Error Handling
- **Non-existent Project**: Create project or return error based on configuration
- **Non-existent Tags**: Auto-create tags or skip based on settings
- **Invalid Project Hierarchy**: Error with explanation
- **Permission Issues**: Clear error for read-only projects

### Sample Expected Response
```json
{
  "success": true,
  "taskId": "ABC123-DEF456",
  "changes": {
    "project": {
      "previous": "Inbox",
      "new": "Q1 Planning"
    },
    "tags": {
      "added": ["urgent", "review"],
      "removed": [],
      "final": ["urgent", "review", "quarterly"]
    }
  },
  "warnings": ["Project 'Q1 Planning' was created automatically"]
}
```

---

## Feature 5: Sync Metadata

### User Story
As a user, I want to synchronize custom metadata between OmniFocus tasks and external systems so that I can maintain data consistency and enable advanced automation workflows.

### Priority
**Low** (5/5) - Advanced feature for power users

### Effort Estimate
**High** (4/5) - Complex data mapping and synchronization logic

### Preconditions
- External system APIs are accessible
- Mapping configuration is defined

### AppleScript Handler Signatures

```applescript
-- Sync task with external system
on syncTaskMetadata(taskId as string, externalSystemId as string, mappingConfig as record)
    -- Returns: sync result with conflicts and resolutions

-- Bulk metadata sync
on bulkSyncMetadata(taskIds as list, externalSystemId as string, mappingConfig as record)
    -- Returns: list of sync results

-- Extract metadata for export
on extractTaskMetadata(taskId as string, metadataFields as list)
    -- Returns: record with requested metadata fields

-- Import metadata from external source
on importTaskMetadata(taskId as string, externalData as record, mappingConfig as record)
    -- Returns: updated task record

-- Validate metadata consistency
on validateMetadataConsistency(taskId as string, externalSystemId as string)
    -- Returns: consistency report with discrepancies
```

### Expected Outputs

#### Success Cases
- **Sync Completed**: Summary of synchronized fields
- **Metadata Extracted**: Structured data ready for external system
- **Import Success**: Task updated with external metadata

#### Metadata Mapping Structure
```json
{
  "fieldMappings": {
    "omnifocusField": "externalSystemField",
    "dueDate": "deadline",
    "tags": "labels",
    "notes": "description",
    "project": "category"
  },
  "transformations": {
    "dateFormat": "ISO8601",
    "tagSeparator": ",",
    "textEncoding": "UTF-8"
  },
  "conflictResolution": {
    "strategy": "external_wins", // external_wins, omnifocus_wins, newest_wins
    "excludeFields": ["creationDate", "id"]
  }
}
```

#### Edge Cases & Error Handling
- **API Connection Failures**: Retry logic with exponential backoff
- **Data Format Mismatches**: Transformation errors with clear messages
- **Conflict Resolution**: Handle conflicting data based on strategy

### Sample Expected Response
```json
{
  "success": true,
  "taskId": "ABC123-DEF456",
  "externalId": "EXT-789",
  "syncedFields": ["dueDate", "tags", "notes"],
  "conflicts": [
    {
      "field": "dueDate",
      "omnifocusValue": "2024-01-20T17:00:00Z",
      "externalValue": "2024-01-21T17:00:00Z",
      "resolution": "external_wins",
      "finalValue": "2024-01-21T17:00:00Z"
    }
  ],
  "warnings": ["Tag 'external-only-tag' not supported in OmniFocus"],
  "lastSyncDate": "2024-01-16T15:45:00Z"
}
```

---

## Priority and Effort Summary

| Feature | Priority | Effort | Justification |
|---------|----------|--------|---------------|
| Create Task | High (1) | Medium (3) | Core functionality, foundation for all automation |
| Fetch Task | High (2) | Medium (2) | Essential for reading current state and integration |
| Update Status | High (3) | Low (2) | Critical for workflow automation, simple implementation |
| Assign Tags/Projects | Medium (4) | Medium (3) | Important for organization, moderate complexity |
| Sync Metadata | Low (5) | High (4) | Advanced feature, complex implementation |

## Implementation Notes

### Error Handling Strategy
- Consistent error response format across all features
- Graceful degradation when OmniFocus is unavailable
- Clear error messages with actionable resolution steps
- Logging for debugging and audit trails

### Performance Considerations
- Batch operations for multiple tasks
- Caching for frequently accessed data
- Async operations where possible
- Rate limiting for external API calls

### Security and Permissions
- Validate all input parameters
- Respect OmniFocus privacy settings
- Secure handling of external system credentials
- Audit logging for sensitive operations

### Testing Strategy
- Unit tests for each handler function
- Integration tests with OmniFocus
- Error condition testing
- Performance testing with large datasets
- User acceptance testing with real workflows


---

This document provides a comprehensive outline for the integration of AppleScript capabilities with OmniFocus, ensuring a robust and flexible automation framework.
