import { describe, it } from 'mocha';
import assert from 'assert';
import { omnifocusCategory } from '../dist/categories/omnifocus.js';

describe('OmniFocus Category', () => {
  const createTaskScript = omnifocusCategory.scripts.find(s => s.name === 'createTask');

  describe('createTask script generation', () => {
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
      
      // Should return task ID
      assert(script.includes('return id of theTask'));
      
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
      
      // Should contain project assignment
      assert(script.includes('set theProject to first project whose name is "Work Projects"'));
      
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
      
      // Should include project assignment
      assert(script.includes('set theProject to first project whose name is "Valid Project"'));
      
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
  });

  describe('category structure', () => {
    it('should have correct category metadata', () => {
      assert.equal(omnifocusCategory.name, 'omnifocus');
      assert.equal(omnifocusCategory.description, 'OmniFocus task management operations');
      assert(Array.isArray(omnifocusCategory.scripts));
      assert(omnifocusCategory.scripts.length > 0);
    });

    it('should have createTask script with correct schema', () => {
      assert(createTaskScript, 'createTask script should exist');
      assert.equal(createTaskScript.name, 'createTask');
      assert.equal(createTaskScript.description, 'Create a new task in OmniFocus');
      
      // Check schema structure
      assert(createTaskScript.schema);
      assert.equal(createTaskScript.schema.type, 'object');
      assert(createTaskScript.schema.properties);
      assert(createTaskScript.schema.required);
      
      // Check required fields
      assert(createTaskScript.schema.required.includes('taskName'));
      
      // Check that taskName property exists
      assert(createTaskScript.schema.properties.taskName);
      assert.equal(createTaskScript.schema.properties.taskName.type, 'string');
    });
  });
});
