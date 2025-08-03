import { ScriptCategory } from "../types/index.js";

/**
 * OmniFocus-related scripts.
 * * createTasks: Creates one or more tasks in OmniFocus
 * * listItems: Gets a list of projects, folders, and/or tasks from OmniFocus
 */
export const omnifocusCategory: ScriptCategory = {
  name: "omnifocus",
  description: "OmniFocus task management operations",
  scripts: [
    {
      name: "createTasks",
      description: "Create one or more tasks in OmniFocus",
      schema: {
        type: "object",
        properties: {
          // Support for single task (backward compatibility)
          taskName: {
            type: "string",
            description: "Task name (for single task creation)",
          },
          taskNotes: {
            type: "string",
            description: "Notes for the task (for single task creation)",
            default: "",
          },
          dueDate: {
            type: "string",
            description: "Due date (for single task creation)",
          },
          flagged: {
            type: "boolean",
            description: "Flagged status (for single task creation)",
            default: false,
          },
          projectName: {
            type: "string",
            description: "Name of the project (for single task creation)",
            default: "Inbox",
          },
          tagNames: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of tag names (for single task creation)",
            default: [],
          },
          // Support for multiple tasks
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskName: {
                  type: "string",
                  description: "Task name",
                },
                taskNotes: {
                  type: "string",
                  description: "Notes for the task",
                  default: "",
                },
                dueDate: {
                  type: "string",
                  description: "Due date (optional)",
                },
                flagged: {
                  type: "boolean",
                  description: "Flagged status",
                  default: false,
                },
                projectName: {
                  type: "string",
                  description: "Name of the project",
                  default: "Inbox",
                },
                tagNames: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "List of tag names",
                  default: [],
                },
              },
              required: ["taskName"],
            },
            description: "Array of tasks to create (for multiple task creation)",
            minItems: 1,
          },
        },
        required: [],
      },
      script: (args) => {
        // Helper function to escape quotes in AppleScript strings
        const escapeAppleScriptString = (str: string): string => {
          if (!str) return '';
          return str.replace(/"/g, '""');
        };
        
        const tasks = args.tasks || [];
        
        // If no tasks array provided, add the single task to tasks array
        if (!Array.isArray(tasks) || tasks.length === 0) {
          // Validate that we have at least a taskName for single task mode
          if (!args.taskName || args.taskName.trim() === '') {
            return 'tell application "OmniFocus"\n  return "Error: Either taskName or tasks array must be provided"\nend tell';
          }
          
          tasks.push({
            taskName: args.taskName,
            taskNotes: args.taskNotes,
            dueDate: args.dueDate,
            flagged: args.flagged,
            projectName: args.projectName,
            tagNames: args.tagNames,
          });
        }

        let script = `
        tell application "OmniFocus"
          tell default document
            set taskIds to {}
            `;
        
        // Process each task
        tasks.forEach((task: any, index: number) => {
          const taskName = task.taskName || '';
          const taskNotes = task.taskNotes;
          const dueDate = task.dueDate;
          const flagged = task.flagged || false;
          const projectName = task.projectName;
          const tagNames = task.tagNames;
          
          script += `
            
            -- Create task ${index + 1}: ${escapeAppleScriptString(taskName)}
            set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
            `;
          
          // Add notes if provided
          if (taskNotes && taskNotes.trim() !== '') {
            script += `
            -- Add notes to task ${index + 1}
            set the note of theTask to "${escapeAppleScriptString(taskNotes)}"`;
          }
          
          // Set due date if provided
          if (dueDate && dueDate.trim() !== '') {
            script += `
            -- Set due date for task ${index + 1}
            try
              set due date of theTask to date "${escapeAppleScriptString(dueDate)}"
            on error
              -- If date parsing fails, ignore and continue
            end try`;
          }
          
          // Move to project if specified and not "Inbox"
          if (projectName && projectName.trim() !== '' && projectName !== 'Inbox') {
            script += `
            -- Move task ${index + 1} to project
            try
              set theProject to first project whose name is "${escapeAppleScriptString(projectName)}"
              move theTask to theProject
            on error
              -- Project doesn't exist, leave in inbox
            end try`;
          }
          
          // Add tags if provided
          if (tagNames && Array.isArray(tagNames) && tagNames.length > 0) {
            for (const tag of tagNames) {
              if (tag && tag.trim() !== '') {
                script += `
            -- Add tag "${escapeAppleScriptString(tag)}" to task ${index + 1}
            try
              set theTag to first tag whose name is "${escapeAppleScriptString(tag)}"
              add theTag to tags of theTask
            on error
              -- Tag doesn't exist, skip it
            end try`;
              }
            }
          }
          
          script += `
            
            -- Store task ID for task ${index + 1}
            set end of taskIds to (id of theTask)`;
        });
        
        script += `
            
            -- Return all created task IDs
            set AppleScript's text item delimiters to ", "
            set result to (taskIds as string)
            set AppleScript's text item delimiters to ""
            return "Created " & (count of taskIds) & " tasks with IDs: " & result
          end tell
        end tell`;
        
        return script;
      },
    },
    {
      name: "listItems",
      description: "Get a list of projects, folders, and/or tasks from OmniFocus",
      schema: {
        type: "object",
        properties: {
          itemTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["projects", "folders", "tasks", "inbox"]
            },
            description: "Types of items to retrieve (projects, folders, tasks, inbox)",
            default: ["projects", "folders", "tasks"]
          },
          includeCompleted: {
            type: "boolean",
            description: "Include completed items in the results",
            default: false
          },
          projectFilter: {
            type: "string",
            description: "Filter tasks by project name (only applies when retrieving tasks)"
          },
          tagFilter: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Filter tasks by tag names (only applies when retrieving tasks)"
          },
          maxResults: {
            type: "number",
            description: "Maximum number of items to return per type",
            default: 100
          },
          folderStatus: {
            type: "string",
            enum: ["active", "hidden", "all"],
            description: "Filter folders by visibility (active=visible, hidden=hidden, all=both)",
            default: "active"
          }
        },
        required: []
      },
      script: (args) => {
        const itemTypes = args.itemTypes || ["projects", "folders", "tasks"];
        const includeCompleted = args.includeCompleted || false;
        const projectFilter = args.projectFilter || "";
        const tagFilter = args.tagFilter || [];
        const maxResults = args.maxResults || 100;
        const folderStatus = args.folderStatus || "active";

        // Helper function to escape quotes in AppleScript strings
        const escapeAppleScriptString = (str: string): string => {
          if (!str) return '';
          return str.replace(/"/g, '""');
        };

        let script = `
        tell application "OmniFocus"
          tell default document
            set resultList to {}
            `;

        // Add folders if requested
        if (itemTypes.includes("folders")) {
          const folderStatusCheck = folderStatus === "all" ? "" : 
            folderStatus === "active" ? "if (hidden of theFolder) is false then" :
            folderStatus === "hidden" ? "if (hidden of theFolder) is true then" : "";
          const folderStatusEndIf = folderStatus === "all" ? "" : "end if";

          script += `
            
            -- Get folders
            set folderCount to 0
            repeat with theFolder in folders
              if folderCount >= ${maxResults} then exit repeat
              ${folderStatusCheck}
                set hiddenText to ""
                if (hidden of theFolder) is true then
                  set hiddenText to " [HIDDEN]"
                else if (effectively hidden of theFolder) is true then
                  set hiddenText to " [EFFECTIVELY HIDDEN]"
                end if
                
                set folderInfo to "[FOLDER] " & (name of theFolder) & hiddenText & " (ID: " & (id of theFolder) & ")"
                set end of resultList to folderInfo
                set folderCount to folderCount + 1
              ${folderStatusEndIf}
            end repeat
            `;
        }

        // Add projects if requested
        if (itemTypes.includes("projects")) {
          script += `
            
            -- Get projects
            set projectCount to 0
            repeat with theProject in projects
              if projectCount >= ${maxResults} then exit repeat
              ${includeCompleted ? '' : 'if (status of theProject) is not done status then'}
                set projectStatus to ""
                if (status of theProject) is done status then
                  set projectStatus to " [COMPLETED]"
                else if (status of theProject) is dropped status then
                  set projectStatus to " [DROPPED]"
                else if (status of theProject) is on hold status then
                  set projectStatus to " [ON HOLD]"
                end if
                
                set folderName to ""
                try
                  set theContainer to container of theProject
                  if (class of theContainer) is folder then
                    set folderName to " (Folder: " & (name of theContainer) & ")"
                  end if
                on error
                  -- No folder assigned or not accessible
                end try
                
                set projectInfo to "[PROJECT] " & (name of theProject) & folderName & projectStatus & " (ID: " & (id of theProject) & ")"
                set end of resultList to projectInfo
                set projectCount to projectCount + 1
              ${includeCompleted ? '' : 'end if'}
            end repeat
            `;
        }

        // Add inbox tasks if requested
        if (itemTypes.includes("inbox")) {
          script += `
            
            -- Get inbox tasks
            set inboxCount to 0
            repeat with theTask in (every inbox task)
              if inboxCount >= ${maxResults} then exit repeat
              ${includeCompleted ? '' : 'if (completed of theTask) is false then'}
                set taskStatus to ""
                if (completed of theTask) is true then
                  set taskStatus to " [COMPLETED]"
                else if (dropped of theTask) is true then
                  set taskStatus to " [DROPPED]"
                end if
                
                set flaggedStatus to ""
                if (flagged of theTask) is true then
                  set flaggedStatus to " [FLAGGED]"
                end if
                
                set dueDateInfo to ""
                try
                  if (due date of theTask) is not missing value then
                    set dueDateInfo to " (Due: " & (due date of theTask) & ")"
                  end if
                on error
                  -- No due date or not accessible
                end try
                
                set taskInfo to "[INBOX] " & (name of theTask) & flaggedStatus & dueDateInfo & taskStatus & " (ID: " & (id of theTask) & ")"
                set end of resultList to taskInfo
                set inboxCount to inboxCount + 1
              ${includeCompleted ? '' : 'end if'}
            end repeat
            `;
        }

        // Add tasks if requested
        if (itemTypes.includes("tasks")) {
          script += `
            
            -- Get tasks from projects
            set taskCount to 0
            repeat with theProject in projects
              ${includeCompleted ? '' : 'if (status of theProject) is not done status then'}
                repeat with theTask in flattened tasks of theProject
                  if taskCount >= ${maxResults} then exit repeat
                  ${includeCompleted ? '' : 'if (completed of theTask) is false then'}
                    set projectNameMatch to true
                    ${projectFilter ? `set projectNameMatch to ((name of theProject) contains "${escapeAppleScriptString(projectFilter)}")` : ''}
                    
                    if projectNameMatch then
                      set taskStatus to ""
                      if (completed of theTask) is true then
                        set taskStatus to " [COMPLETED]"
                      else if (dropped of theTask) is true then
                        set taskStatus to " [DROPPED]"
                      end if
                      
                      set flaggedStatus to ""
                      if (flagged of theTask) is true then
                        set flaggedStatus to " [FLAGGED]"
                      end if
                      
                      set dueDateInfo to ""
                      try
                        if (due date of theTask) is not missing value then
                          set dueDateInfo to " (Due: " & (due date of theTask) & ")"
                        end if
                      on error
                        -- No due date or not accessible
                      end try
                      
                      set taskInfo to "[TASK] " & (name of theTask) & " (Project: " & (name of theProject) & ")" & flaggedStatus & dueDateInfo & taskStatus & " (ID: " & (id of theTask) & ")"
                      set end of resultList to taskInfo
                      set taskCount to taskCount + 1
                    end if
                  ${includeCompleted ? '' : 'end if'}
                end repeat
              ${includeCompleted ? '' : 'end if'}
            end repeat
            `;
        }

        script += `
            
            -- Return results
            if (count of resultList) is 0 then
              return "No items found matching the specified criteria."
            else
              set resultString to ""
              repeat with anItem in resultList
                set resultString to resultString & anItem & "\n"
              end repeat
              return "Found " & (count of resultList) & " items:\n" & resultString
            end if
          end tell
        end tell`;

        return script;
      },
    },
  ],
};
