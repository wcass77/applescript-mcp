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
            description: "Name of the project (for single task creation) - deprecated, use projectId instead",
            default: "Inbox",
          },
          projectId: {
            type: "string",
            description: "ID of the project to add the task to (preferred over projectName)",
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
                  description: "Name of the project - deprecated, use projectId instead",
                  default: "Inbox",
                },
                projectId: {
                  type: "string",
                  description: "ID of the project to add the task to (preferred over projectName)",
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
            projectId: args.projectId,
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
          const projectId = task.projectId;
          const tagNames = task.tagNames;
          
          // Create task in appropriate location
          if (projectId && projectId.trim() !== '') {
            // Create task directly in project by ID (preferred method)
            script += `
            
            -- Create task ${index + 1} directly in project by ID: ${escapeAppleScriptString(taskName)}
            try
              set theProject to project id "${escapeAppleScriptString(projectId)}"
              set theTask to make new task at end of tasks of theProject with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
            on error
              -- Project ID doesn't exist, create in inbox instead
              set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
            end try`;
          } else if (projectName && projectName.trim() !== '' && projectName !== 'Inbox') {
            // Create task directly in project by name
            script += `
            
            -- Create task ${index + 1} directly in project by name: ${escapeAppleScriptString(taskName)}
            try
              set projectList to flattenedProjects whose name is "${escapeAppleScriptString(projectName)}"
              if (count of projectList) > 0 then
                set theProject to first item of projectList
                set theTask to make new task at end of tasks of theProject with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
              else
                -- Project doesn't exist, create in inbox instead
                set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
              end if
            on error
              -- Error finding project, create in inbox instead
              set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
            end try`;
          } else {
            // Create task in inbox (default)
            script += `
            
            -- Create task ${index + 1} in inbox: ${escapeAppleScriptString(taskName)}
            set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}`;
          }
          
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
            set resultString to ""
            repeat with i from 1 to count of taskIds
              if i > 1 then
                set resultString to resultString & ", "
              end if
              set resultString to resultString & (item i of taskIds)
            end repeat
            return "Created " & (count of taskIds) & " tasks with IDs: " & resultString
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
          },
          hierarchical: {
            type: "boolean",
            description: "Return hierarchical structure as JSON with nested folders, projects, and tasks",
            default: false
          },
          maxDepth: {
            type: "number",
            description: "Maximum depth to traverse in hierarchical mode (0=current level only, 1=one level down, etc.)",
            default: 10
          },
          parentId: {
            type: "string",
            description: "ID of specific folder or project to start traversal from (only used in hierarchical mode)"
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
        const hierarchical = args.hierarchical || false;
        const maxDepth = args.maxDepth !== undefined ? args.maxDepth : 10;
        const parentId = args.parentId || '';

        // Helper function to escape quotes in AppleScript strings
        const escapeAppleScriptString = (str: string): string => {
          if (!str) return '';
          return str.replace(/"/g, '""');
        };

        if (hierarchical) {
          // Hierarchical mode - return structured text that JS will parse into JSON
          const hasParentId = parentId && parentId.trim() !== '';
          
          return `
            global itemCount
            global maxItems
            set itemCount to 0  -- Global counter for maxResults
            set maxItems to ${maxResults}
            
            tell application "OmniFocus"
              tell default document
                set resultText to "HIERARCHICAL_START\n"
                
                ${hasParentId ? `
                -- Start from specific parent ID: ${escapeAppleScriptString(parentId)}
                try
                  -- Try to find folder with this ID
                  set targetFolder to folder id "${escapeAppleScriptString(parentId)}"
                  set {resultText, itemCount} to my processFolderRecursive(targetFolder, 0, resultText, itemCount)
                on error
                  try
                    -- Try to find project with this ID
                    set targetProject to project id "${escapeAppleScriptString(parentId)}"
                    set {resultText, itemCount} to my processProjectRecursive(targetProject, 0, resultText, itemCount)
                  on error
                    -- ID not found, return empty result
                    set resultText to resultText & "ERROR|Parent ID not found|${escapeAppleScriptString(parentId)}|error|false|false|false|0|\n"
                  end try
                end try` : `
                -- Process top-level folders
                repeat with theFolder in folders
                  if itemCount >= maxItems then exit repeat
                  ${folderStatus === "all" ? "" : folderStatus === "active" ? "if (hidden of theFolder) is false then" : "if (hidden of theFolder) is true then"}
                    set {resultText, itemCount} to my processFolderRecursive(theFolder, 0, resultText, itemCount)
                  ${folderStatus === "all" ? "" : "end if"}
                end repeat
                
                -- Process top-level projects (not in folders)
                repeat with theProject in projects
                  if itemCount >= maxItems then exit repeat
                  try
                    set projectContainer to container of theProject
                    if (class of projectContainer) is document then
                      ${includeCompleted ? '' : 'if (status of theProject) is not done status then'}
                        set {resultText, itemCount} to my processProjectRecursive(theProject, 0, resultText, itemCount)
                      ${includeCompleted ? '' : 'end if'}
                    end if
                  on error
                    -- Project has no container or error accessing it
                    ${includeCompleted ? '' : 'if (status of theProject) is not done status then'}
                      set {resultText, itemCount} to my processProjectRecursive(theProject, 0, resultText, itemCount)
                    ${includeCompleted ? '' : 'end if'}
                  end try
                end repeat
                
                ${itemTypes.includes("inbox") ? `
                -- Add inbox as a special container
                if itemCount < maxItems then
                  set resultText to resultText & "INBOX|Inbox||inbox|false|false|false|0|\n"
                  set itemCount to itemCount + 1
                  repeat with theTask in (every inbox task)
                    if itemCount >= maxItems then exit repeat
                    ${includeCompleted ? '' : 'if (completed of theTask) is false then'}
                      set {resultText, itemCount} to my processTaskRecursive(theTask, 1, resultText, itemCount)
                    ${includeCompleted ? '' : 'end if'}
                  end repeat
                end if` : ""}`}
                
                return resultText & "HIERARCHICAL_END"
              end tell
            end tell
            
            on processFolderRecursive(theFolder, depth, currentText, currentCount)
              tell application "OmniFocus"
                tell default document
                  -- Check if we've reached the limit or max depth
                  if currentCount >= maxItems or depth > ${maxDepth} then
                    return {currentText, currentCount}
                  end if
                  
                  set folderName to name of theFolder
                  set folderId to id of theFolder
                  set isHidden to (hidden of theFolder)
                  
                  set resultText to currentText & "FOLDER|" & folderName & "|" & folderId & "|folder|" & isHidden & "|false|false|" & depth & "\n"
                  set itemCount to currentCount + 1
                  
                  -- Only process children if we haven't reached max depth
                  if depth < ${maxDepth} then
                    -- Process subfolders
                    repeat with subFolder in folders of theFolder
                      if itemCount >= maxItems then exit repeat
                      ${folderStatus === "all" ? "" : folderStatus === "active" ? "if (hidden of subFolder) is false then" : "if (hidden of subFolder) is true then"}
                        set {resultText, itemCount} to my processFolderRecursive(subFolder, depth + 1, resultText, itemCount)
                      ${folderStatus === "all" ? "" : "end if"}
                    end repeat
                    
                    -- Process projects in this folder
                    repeat with theProject in projects of theFolder
                      if itemCount >= maxItems then exit repeat
                      ${includeCompleted ? '' : 'if (status of theProject) is not done status then'}
                        set {resultText, itemCount} to my processProjectRecursive(theProject, depth + 1, resultText, itemCount)
                      ${includeCompleted ? '' : 'end if'}
                    end repeat
                  end if
                  
                  return {resultText, itemCount}
                end tell
              end tell
            end processFolderRecursive
            
            on processProjectRecursive(theProject, depth, currentText, currentCount)
              tell application "OmniFocus"
                tell default document
                  -- Check if we've reached the limit or max depth
                  if currentCount >= maxItems or depth > ${maxDepth} then
                    return {currentText, currentCount}
                  end if
                  
                  set projectName to name of theProject
                  set projectId to id of theProject
                  set projectStatus to (status of theProject) as string
                  set projectCompleted to (status of theProject) is done status
                  set projectDropped to (status of theProject) is dropped status
                  
                  set resultText to currentText & "PROJECT|" & projectName & "|" & projectId & "|project|" & projectCompleted & "|false|" & projectDropped & "|" & depth & "\n"
                  set itemCount to currentCount + 1
                  
                  -- Only process children if we haven't reached max depth
                  if depth < ${maxDepth} then
                    -- Process root tasks in this project
                    repeat with theTask in tasks of theProject
                      if itemCount >= maxItems then exit repeat
                      ${includeCompleted ? '' : 'if (completed of theTask) is false then'}
                        set {resultText, itemCount} to my processTaskRecursive(theTask, depth + 1, resultText, itemCount)
                      ${includeCompleted ? '' : 'end if'}
                    end repeat
                  end if
                  
                  return {resultText, itemCount}
                end tell
              end tell
            end processProjectRecursive
            
            on processTaskRecursive(theTask, depth, currentText, currentCount)
              tell application "OmniFocus"
                tell default document
                  -- Check if we've reached the limit or max depth
                  if currentCount >= maxItems or depth > ${maxDepth} then
                    return {currentText, currentCount}
                  end if
                  
                  set taskName to name of theTask
                  set taskId to id of theTask
                  set isCompleted to (completed of theTask)
                  set isFlagged to (flagged of theTask)
                  set isDropped to (dropped of theTask)
                  
                  set dueDateStr to ""
                  try
                    if (due date of theTask) is not missing value then
                      set dueDateStr to (due date of theTask) as string
                    end if
                  end try
                  
                  set resultText to currentText & "TASK|" & taskName & "|" & taskId & "|task|" & isCompleted & "|" & isFlagged & "|" & isDropped & "|" & depth & "|" & dueDateStr & "\n"
                  set itemCount to currentCount + 1
                  
                  -- Only process subtasks if we haven't reached max depth
                  if depth < ${maxDepth} then
                    -- Process subtasks
                    repeat with subTask in tasks of theTask
                      if itemCount >= maxItems then exit repeat
                      ${includeCompleted ? '' : 'if (completed of subTask) is false then'}
                        set {resultText, itemCount} to my processTaskRecursive(subTask, depth + 1, resultText, itemCount)
                      ${includeCompleted ? '' : 'end if'}
                    end repeat
                  end if
                  
                  return {resultText, itemCount}
                end tell
              end tell
            end processTaskRecursive`;
        } else {
          // Flat mode - return simple text list (existing functionality)
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
                  set resultString to resultString & anItem & "\\n"
                end repeat
                return "Found " & (count of resultList) & " items:\\n" & resultString
              end if
            end tell
          end tell`;

          return script;
        }
      },
    },
  ],
};
