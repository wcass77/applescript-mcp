import { describe, it } from 'mocha';
import assert from 'assert';
import { omnifocusCategory } from '../dist/categories/omnifocus.js';

describe('OmniFocus Category', () => {
  const createTaskScript = omnifocusCategory.scripts.find(s => s.name === 'createTasks');
  const listItemsScript = omnifocusCategory.scripts.find(s => s.name === 'listItems');

  describe('createTasks script generation', () => {
    it('should generate basic task creation script with minimal parameters', () => {
      const args = {
        taskName: 'Test Task'
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Basic Task Creation Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should contain the basic task creation
      assert(script.includes('make new inbox task with properties {name:"Test Task", flagged:false}'));
      
      // Should return task summary with count and IDs (new format)
      assert(script.includes('return "Created " & (count of taskIds) & " tasks with IDs: " & resultString'));
      
      // Should NOT contain undefined values
      assert(!script.includes('undefined'));
      
      // Should NOT contain empty conditionals for optional parameters
      assert(!script.includes('if "" is not ""'));
    });

    it('should generate script with all parameters provided', () => {
      const args = {
        taskName: 'Complete Project',
        taskNotes: 'Important project with deadline',
        dueDate: 'January 15, 2024',
        flagged: true,
        projectName: 'Work Projects',
        tagNames: ['urgent', 'work']
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Full Parameters Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should contain task creation with flagged=true
      assert(script.includes('flagged:true'));
      
      // Should contain notes
      assert(script.includes('set the note of theTask to "Important project with deadline"'));
      
      // Should contain due date
      assert(script.includes('set due date of theTask to date "January 15, 2024"'));
      
      // Should contain project assignment (new direct creation pattern)
      assert(script.includes('set projectList to flattenedProjects whose name is "Work Projects"'));
      assert(script.includes('set theTask to make new task at end of tasks of theProject'));
      
      // Should contain tag assignments
      assert(script.includes('set theTag to first tag whose name is "urgent"'));
      assert(script.includes('set theTag to first tag whose name is "work"'));
      
      // Should NOT contain undefined
      assert(!script.includes('undefined'));
    });

    it('should handle empty/null optional parameters gracefully', () => {
      const args = {
        taskName: 'Simple Task',
        taskNotes: '',
        dueDate: null,
        projectName: 'Inbox',
        tagNames: []
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Empty/Null Parameters Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should create basic task
      assert(script.includes('make new inbox task with properties {name:"Simple Task", flagged:false}'));
      
      // Should NOT include notes section for empty notes
      assert(!script.includes('set the note of theTask'));
      
      // Should NOT include due date section for null date
      assert(!script.includes('set due date of theTask'));
      
      // Should NOT include project movement for 'Inbox'
      assert(!script.includes('move theTask to theProject'));
      
      // Should NOT include tag assignments for empty array
      assert(!script.includes('add theTag to tags'));
      
      // Should NOT contain undefined
      assert(!script.includes('undefined'));
    });

    it('should handle mixed valid and invalid optional parameters', () => {
      const args = {
        taskName: 'Mixed Task',
        taskNotes: 'Valid notes',
        dueDate: '',  // empty string
        projectName: 'Valid Project',
        tagNames: ['valid-tag', '', null, 'another-tag']  // mixed array
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Mixed Parameters Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should include notes
      assert(script.includes('set the note of theTask to "Valid notes"'));
      
      // Should NOT include due date for empty string
      assert(!script.includes('set due date of theTask'));
      
      // Should include project assignment (new direct creation pattern)
      assert(script.includes('set projectList to flattenedProjects whose name is "Valid Project"'));
      assert(script.includes('set theTask to make new task at end of tasks of theProject'));
      
      // Should include valid tags only
      assert(script.includes('set theTag to first tag whose name is "valid-tag"'));
      assert(script.includes('set theTag to first tag whose name is "another-tag"'));
      
      // Should NOT contain undefined or empty strings in tag assignments
      assert(!script.includes('undefined'));
      assert(!script.match(/set theTag to first tag whose name is ""\s/));
    });

    it('should escape quotes in task names and notes', () => {
      const args = {
        taskName: 'Task with "quotes" in name',
        taskNotes: 'Notes with "quoted" content'
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Quotes Test Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // The script should handle quotes properly - quotes should be escaped as "" in AppleScript
      assert(script.includes('Task with ""quotes"" in name'));
      assert(script.includes('Notes with ""quoted"" content'));
    });

    it('should generate valid AppleScript structure', () => {
      const args = {
        taskName: 'Structure Test'
      };

      const script = createTaskScript.script(args);

      // Should have proper AppleScript structure
      assert(script.includes('tell application "OmniFocus"'));
      assert(script.includes('tell default document'));
      assert(script.includes('end tell'));
      
      // Should have proper nesting (basic check)
      const tellCount = (script.match(/tell /g) || []).length;
      const endTellCount = (script.match(/end tell/g) || []).length;
      assert.equal(tellCount, endTellCount, 'Should have matching tell/end tell statements');
    });

    it('should handle special characters in task names', () => {
      const args = {
        taskName: 'Task with & special $ characters % and # symbols'
      };

      const script = createTaskScript.script(args);

      // Should include the full task name
      assert(script.includes('Task with & special $ characters % and # symbols'));
      
      // Should not contain undefined
      assert(!script.includes('undefined'));
    });

    it('should not include project movement for Inbox project', () => {
      const args = {
        taskName: 'Inbox Task',
        projectName: 'Inbox'
      };

      const script = createTaskScript.script(args);

      // Should NOT include project movement logic for Inbox
      assert(!script.includes('move theTask to theProject'));
      assert(!script.includes('set theProject to first project'));
    });

    it('should create multiple tasks from tasks array', () => {
      const args = {
        tasks: [
          {
            taskName: 'First Task',
            taskNotes: 'Notes for first task',
            flagged: true
          },
          {
            taskName: 'Second Task',
            dueDate: 'January 20, 2024',
            projectName: 'Test Project',
            tagNames: ['urgent']
          },
          {
            taskName: 'Third Task'
          }
        ]
      };

      const script = createTaskScript.script(args);
      console.log('\n=== Multiple Tasks Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should create all three tasks (note: comments now include creation location)
      assert(script.includes('-- Create task 1 in inbox: First Task'));
      assert(script.includes('-- Create task 2 directly in project by name: Second Task'));
      assert(script.includes('-- Create task 3 in inbox: Third Task'));
      
      // Should handle different properties for each task
      assert(script.includes('make new inbox task with properties {name:"First Task", flagged:true}'));
      // Second task should be created in project, not inbox
      assert(script.includes('make new task at end of tasks of theProject with properties {name:"Second Task", flagged:false}'));
      assert(script.includes('make new inbox task with properties {name:"Third Task", flagged:false}'));
      
      // Should include task-specific properties
      assert(script.includes('set the note of theTask to "Notes for first task"'));
      assert(script.includes('set due date of theTask to date "January 20, 2024"'));
      // New project lookup pattern
      assert(script.includes('set projectList to flattenedProjects whose name is "Test Project"'));
      assert(script.includes('set theTag to first tag whose name is "urgent"'));
      
      // Should collect all task IDs
      assert(script.includes('-- Store task ID for task 1'));
      assert(script.includes('-- Store task ID for task 2'));
      assert(script.includes('-- Store task ID for task 3'));
      
      // Should return summary (new format)
      assert(script.includes('return "Created " & (count of taskIds) & " tasks with IDs: " & resultString'));
    });

    it('should handle error when no taskName or tasks provided', () => {
      const args = {};

      const script = createTaskScript.script(args);
      console.log('\n=== Error Handling Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should return error message
      assert(script.includes('return "Error: Either taskName or tasks array must be provided"'));
      
      // Should still be valid AppleScript
      assert(script.includes('tell application "OmniFocus"'));
      assert(script.includes('end tell'));
    });
  });

  describe('listItems script generation', () => {
    it('should generate basic list items script with default parameters', () => {
      const args = {};

      const script = listItemsScript.script(args);
      console.log('\n=== Basic List Items Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should include all default item types
      assert(script.includes('-- Get folders'));
      assert(script.includes('-- Get projects'));
      assert(script.includes('-- Get tasks from projects'));
      
      // Should NOT include inbox by default
      assert(!script.includes('-- Get inbox tasks'));
      
      // Should have proper AppleScript structure
      assert(script.includes('tell application "OmniFocus"'));
      assert(script.includes('tell default document'));
      assert(script.includes('end tell'));
      
      // Should return results with proper formatting
      assert(script.includes('return "Found " \u0026 (count of resultList) \u0026 " items:\\n" \u0026 resultString'));
    });

    it('should generate script for specific item types', () => {
      const args = {
        itemTypes: ['projects', 'inbox']
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Specific Item Types Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should include requested types
      assert(script.includes('-- Get projects'));
      assert(script.includes('-- Get inbox tasks'));
      
      // Should NOT include unrequested types
      assert(!script.includes('-- Get folders'));
      assert(!script.includes('-- Get tasks from projects'));
    });

    it('should handle includeCompleted parameter', () => {
      const args = {
        itemTypes: ['projects'],
        includeCompleted: true
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Include Completed Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should NOT filter out completed items when includeCompleted is true
      assert(!script.includes('if (status of theProject) is not done status then'));
      
      // Should include status indicators
      assert(script.includes('if (status of theProject) is done status then'));
      assert(script.includes('set projectStatus to " [COMPLETED]"'));
    });

    it('should filter out completed items by default', () => {
      const args = {
        itemTypes: ['projects']
      };

      const script = listItemsScript.script(args);

      // Should filter out completed projects by default
      assert(script.includes('if (status of theProject) is not done status then'));
    });

    it('should handle project filter for tasks', () => {
      const args = {
        itemTypes: ['tasks'],
        projectFilter: 'Work Project'
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Project Filter Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should include project name filtering
      assert(script.includes('set projectNameMatch to ((name of theProject) contains "Work Project")'));
    });

    it('should handle maxResults parameter', () => {
      const args = {
        itemTypes: ['projects'],
        maxResults: 50
      };

      const script = listItemsScript.script(args);

      // Should use custom maxResults
      assert(script.includes('if projectCount >= 50 then exit repeat'));
    });

    it('should escape quotes in project filter', () => {
      const args = {
        itemTypes: ['tasks'],
        projectFilter: 'Project with "quotes"'
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Quotes in Filter Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should escape quotes properly
      assert(script.includes('Project with ""quotes""'));
    });

    it('should generate valid AppleScript structure for all item types', () => {
      const args = {
        itemTypes: ['folders', 'projects', 'tasks', 'inbox']
      };

      const script = listItemsScript.script(args);

      // Should have proper AppleScript structure
      assert(script.includes('tell application "OmniFocus"'));
      assert(script.includes('tell default document'));
      
      // Should have proper nesting (basic check)
      const tellCount = (script.match(/tell /g) || []).length;
      const endTellCount = (script.match(/end tell/g) || []).length;
      assert.equal(tellCount, endTellCount, 'Should have matching tell/end tell statements');
      
      // Should include all item type sections
      assert(script.includes('-- Get folders'));
      assert(script.includes('-- Get projects'));
      assert(script.includes('-- Get tasks from projects'));
      assert(script.includes('-- Get inbox tasks'));
    });

    it('should handle empty itemTypes array', () => {
      const args = {
        itemTypes: []
      };

      const script = listItemsScript.script(args);

      // Should still generate valid script but with no item retrieval sections
      assert(script.includes('tell application "OmniFocus"'));
      assert(script.includes('tell default document'));
      assert(script.includes('set resultList to {}'));
      
      // Should NOT include any item retrieval sections
      assert(!script.includes('-- Get folders'));
      assert(!script.includes('-- Get projects'));
      assert(!script.includes('-- Get tasks from projects'));
      assert(!script.includes('-- Get inbox tasks'));
    });

    it('should handle folderStatus parameter with active filter (default)', () => {
      const args = {
        itemTypes: ['folders']
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Folder Status Active Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should filter for visible (non-hidden) folders by default
      assert(script.includes('if (hidden of theFolder) is false then'));
      assert(script.includes('end if'));
      
      // Should include hidden status indicators
      assert(script.includes('if (hidden of theFolder) is true then'));
      assert(script.includes('set hiddenText to " [HIDDEN]"'));
      assert(script.includes('set hiddenText to " [EFFECTIVELY HIDDEN]"'));
    });

    it('should handle folderStatus parameter with hidden filter', () => {
      const args = {
        itemTypes: ['folders'],
        folderStatus: 'hidden'
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Folder Status Hidden Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should filter for hidden folders only
      assert(script.includes('if (hidden of theFolder) is true then'));
      assert(script.includes('end if'));
    });

    it('should handle folderStatus parameter with all filter', () => {
      const args = {
        itemTypes: ['folders'],
        folderStatus: 'all'
      };

      const script = listItemsScript.script(args);
      console.log('\n=== Folder Status All Script ===');
      console.log(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
      console.log('=== End Script ===\n');

      // Should NOT filter folders by hidden status when set to 'all' (no hidden filter condition around the main folder processing)
      // The script should not contain the filtering around the main loop
      assert(!script.includes('if (hidden of theFolder) is false then'));
      
      // But should still include hidden status indicators in the output (these are for display, not filtering)
      assert(script.includes('set hiddenText to " [HIDDEN]"'));
      assert(script.includes('set hiddenText to " [EFFECTIVELY HIDDEN]"'));
      
      // The hidden check for display purposes should be present inside the loop (not as a filter around it)
      assert(script.includes('if (hidden of theFolder) is true then'));
    });
  });

  describe('category structure', () => {
    it('should have correct category metadata', () => {
      assert.equal(omnifocusCategory.name, 'omnifocus');
      assert.equal(omnifocusCategory.description, 'OmniFocus task management operations');
      assert(Array.isArray(omnifocusCategory.scripts));
      assert(omnifocusCategory.scripts.length > 0);
    });

    it('should have listItems script with correct schema', () => {
      assert(listItemsScript, 'listItems script should exist');
      assert.equal(listItemsScript.name, 'listItems');
      assert.equal(listItemsScript.description, 'Get a list of projects, folders, and/or tasks from OmniFocus');
      
      // Check schema structure
      assert(listItemsScript.schema);
      assert.equal(listItemsScript.schema.type, 'object');
      assert(listItemsScript.schema.properties);
      assert(listItemsScript.schema.required);
      
      // Check that required is an empty array
      assert(Array.isArray(listItemsScript.schema.required));
      assert.equal(listItemsScript.schema.required.length, 0);
      
      // Check itemTypes property
      assert(listItemsScript.schema.properties.itemTypes);
      assert.equal(listItemsScript.schema.properties.itemTypes.type, 'array');
      assert(listItemsScript.schema.properties.itemTypes.items);
      assert.equal(listItemsScript.schema.properties.itemTypes.items.type, 'string');
      assert(Array.isArray(listItemsScript.schema.properties.itemTypes.items.enum));
      
      // Check other properties exist
      assert(listItemsScript.schema.properties.includeCompleted);
      assert.equal(listItemsScript.schema.properties.includeCompleted.type, 'boolean');
      
      assert(listItemsScript.schema.properties.projectFilter);
      assert.equal(listItemsScript.schema.properties.projectFilter.type, 'string');
      
      assert(listItemsScript.schema.properties.maxResults);
      assert.equal(listItemsScript.schema.properties.maxResults.type, 'number');
      
      // Check folderStatus property
      assert(listItemsScript.schema.properties.folderStatus);
      assert.equal(listItemsScript.schema.properties.folderStatus.type, 'string');
      assert(Array.isArray(listItemsScript.schema.properties.folderStatus.enum));
      assert(listItemsScript.schema.properties.folderStatus.enum.includes('active'));
      assert(listItemsScript.schema.properties.folderStatus.enum.includes('hidden'));
      assert(listItemsScript.schema.properties.folderStatus.enum.includes('all'));
      
      // Check hierarchical property
      assert(listItemsScript.schema.properties.hierarchical);
      assert.equal(listItemsScript.schema.properties.hierarchical.type, 'boolean');
      assert.equal(listItemsScript.schema.properties.hierarchical.default, false);
    });

    it('should have createTasks script with correct schema', () => {
      assert(createTaskScript, 'createTasks script should exist');
      assert.equal(createTaskScript.name, 'createTasks');
      assert.equal(createTaskScript.description, 'Create one or more tasks in OmniFocus');
      
      // Check schema structure
      assert(createTaskScript.schema);
      assert.equal(createTaskScript.schema.type, 'object');
      assert(createTaskScript.schema.properties);
      assert(createTaskScript.schema.required);
      
      // Check that required is an empty array (validation is done in script logic)
      assert(Array.isArray(createTaskScript.schema.required));
      assert.equal(createTaskScript.schema.required.length, 0);
      
      // Check that taskName property exists for single task mode
      assert(createTaskScript.schema.properties.taskName);
      assert.equal(createTaskScript.schema.properties.taskName.type, 'string');
      
      // Check that tasks array property exists for multi-task mode
      assert(createTaskScript.schema.properties.tasks);
      assert.equal(createTaskScript.schema.properties.tasks.type, 'array');
    });
  });
});
