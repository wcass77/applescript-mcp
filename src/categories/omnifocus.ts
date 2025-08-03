import { ScriptCategory } from "../types/index.js";

/**
 * OmniFocus-related scripts.
 * * createTask: Adds a new task to OmniFocus
 */
export const omnifocusCategory: ScriptCategory = {
  name: "omnifocus",
  description: "OmniFocus task management operations",
  scripts: [
    {
      name: "createTask",
      description: "Create a new task in OmniFocus",
      schema: {
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
      script: (args) => {
        // Helper function to escape quotes in AppleScript strings
        const escapeAppleScriptString = (str: string): string => {
          if (!str) return '';
          return str.replace(/"/g, '""');
        };
        
        const taskName = args.taskName || '';
        const taskNotes = args.taskNotes;
        const dueDate = args.dueDate;
        const flagged = args.flagged || false;
        const projectName = args.projectName;
        const tagNames = args.tagNames;
        
        let script = `
        tell application "OmniFocus"
          tell default document
            -- Create the task
            set theTask to make new inbox task with properties {name:"${escapeAppleScriptString(taskName)}", flagged:${flagged}}
            `;
        
        // Add notes if provided
        if (taskNotes && taskNotes.trim() !== '') {
          script += `
            -- Add notes
            set the note of theTask to "${escapeAppleScriptString(taskNotes)}"`;
        }
        
        // Set due date if provided
        if (dueDate && dueDate.trim() !== '') {
          script += `
            -- Set due date
            try
              set due date of theTask to date "${escapeAppleScriptString(dueDate)}"
            on error
              -- If date parsing fails, ignore and continue
            end try`;
        }
        
        // Move to project if specified and not "Inbox"
        if (projectName && projectName.trim() !== '' && projectName !== 'Inbox') {
          script += `
            -- Move to project
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
            -- Add tag: ${escapeAppleScriptString(tag)}
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
            
            -- Return task ID
            return id of theTask
          end tell
        end tell`;
        
        return script;
      },
    },
  ],
};

