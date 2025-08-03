# Testing Guide

This document explains how to test the OmniFocus AppleScript MCP integration.

## Test Philosophy

**IMPORTANT**: Our tests validate AppleScript generation but **DO NOT execute** the AppleScript. This prevents unintended modifications to your actual OmniFocus database during testing.

## Running Tests

```bash
# Run all tests (builds first, then runs tests)
npm test

# Run tests only (assumes code is already built)
npx mocha test/*.test.js

# Build and run tests separately
npm run build
npx mocha test/omnifocus.test.js
```

## Test Structure

### Current Test Coverage

The test suite (`test/omnifocus.test.js`) covers:

1. **Basic Script Generation**
   - Minimal parameters (taskName only)
   - All parameters provided
   - Empty/null parameter handling

2. **Edge Cases**
   - Mixed valid and invalid parameters
   - Special characters in task names
   - Quote escaping
   - Inbox project handling

3. **AppleScript Structure Validation**
   - Proper tell/end tell nesting
   - Required AppleScript components
   - No undefined values in output

4. **Schema Validation**
   - Category metadata correctness
   - Script schema structure
   - Required field validation

### What Tests Verify

✅ **Generated AppleScript syntax is correct**  
✅ **No undefined values appear in scripts**  
✅ **Optional parameters are handled properly**  
✅ **Special characters don't break script generation**  
✅ **Schema definitions match expectations**

❌ **Tests DO NOT verify AppleScript execution**  
❌ **Tests DO NOT interact with OmniFocus**

## Manual Testing

For actual functionality testing:

1. **Build the project**: `npm run build`
2. **Start the server**: `npm start`
3. **Use MCP client** to send commands
4. **Verify results** in OmniFocus manually

### Example Manual Test

```json
{
  "taskName": "Test Task from MCP",
  "taskNotes": "Created via MCP for testing",
  "flagged": true
}
```

This should create a flagged task in your OmniFocus Inbox.

## Adding New Tests

When adding new features or scripts:

1. Create test cases in `test/omnifocus.test.js`
2. Test edge cases and parameter validation
3. Verify generated AppleScript structure
4. **Never execute AppleScript in tests**

### Test Template

```javascript
it('should handle [specific scenario]', () => {
  const args = {
    // test parameters
  };

  const script = createTaskScript.script(args);

  // Verify generated script contains expected elements
  assert(script.includes('expected AppleScript code'));
  
  // Verify no undefined values
  assert(!script.includes('undefined'));
});
```

## Continuous Integration

Tests run automatically and safely because:
- No external dependencies required
- No file system modifications
- No network requests
- No AppleScript execution
- Fast execution (< 100ms typically)

## Debugging Test Failures

If tests fail:

1. **Check the generated AppleScript** by logging `script` variable
2. **Verify parameter handling** in the script generation function
3. **Test with simplified parameters** to isolate issues
4. **Run individual tests** using Mocha's `--grep` option

```bash
# Run specific test
npx mocha test/omnifocus.test.js --grep "basic task creation"
```
