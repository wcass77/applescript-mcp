# OmniFocus 4 AppleScript & Automation Interfaces Research

## Overview
Research catalog for OmniFocus 4.6.1 (Build 182.3.0) automation capabilities, including AppleScript dictionaries, Omni Automation (JavaScript), URL schemes, and integration APIs.

## AppleScript Dictionary

### Core Classes and Objects

#### Application Class
- **Bundle ID**: `com.omnigroup.OmniFocus4`
- **Version**: 4.6.1 (Build 182.3.0)
- **Properties**:
  - `default document`: Access to the user's default document
  - `quick entry`: Quick Entry panel interface
  - `perspective names`: List of all available perspectives
  - `reference date`: Base date for smart groups
  - `current time offset`: Timing utilities for scripts

#### Document Class
- **Properties**:
  - `id`: Unique document identifier
  - `can undo`/`can redo`: Undo/redo state
  - `will autosave`: Autosave configuration
  - `syncing`: Current sync status
  - `last sync date`/`last sync error`: Sync information
- **Elements**:
  - `folders`, `projects`, `tasks`, `tags`
  - `inbox task`: Tasks in inbox
  - `flattened task`: Flat task lists
  - `perspectives`: Custom perspectives

#### Project Class (`FCpr`)
- **Inherits**: `section`
- **Key Properties**:
  - `id`, `name`, `note`
  - `status`: `active status`, `on hold status`, `done status`, `dropped status`
  - `root task`: The project's main task container
  - `next task`: Next actionable task
  - `singleton action holder`: For action lists
  - `sequential`: Sequential vs parallel tasks
  - `completed by children`: Auto-completion setting
  - `review interval`: Project review settings
  - `last review date`/`next review date`
- **Date Properties**:
  - `creation date`, `modification date`
  - `defer date` (synonym: `start date`)
  - `due date`, `completion date`, `dropped date`
  - `effective defer date`/`effective due date`: Including inherited dates
  - `should use floating time zone`: Timezone handling
- **Repetition**:
  - `repetition rule`: Modern repetition handling
  - `repetition` (deprecated): Legacy repetition support
  - `next defer date`/`next due date`: For repeating projects

#### Task Class (`FCac`)
- **Properties**:
  - `id`, `name`, `note`
  - `container`: Parent task, project, or document
  - `containing project`: Project hierarchy
  - `parent task`: Direct parent task
  - `in inbox`: Inbox status check
  - `primary tag`: First/main tag
  - `flagged`: Flag status
  - `next`: Is next actionable task
  - `blocked`: Dependency blocking status
  - `completed`, `dropped`: Status properties
  - `estimated minutes`: Time estimation
- **Date Properties**: Same as projects
- **Child Management**:
  - `completed by children`: Auto-completion
  - `sequential`: Task ordering
  - `number of tasks`/`number of available tasks`/`number of completed tasks`

#### Tag Class (`FCtg`) 
- **Properties**:
  - `id`, `name`, `note`
  - `container`: Parent tag
  - `allows next action`: Next action participation
  - `hidden`/`effectively hidden`: Visibility
  - `available task count`/`remaining task count`: Task counts
  - `location`: Physical location information
- **Location Properties**:
  - `latitude`, `longitude`, `altitude`, `radius`
  - `trigger`: `notify when arriving`/`notify when leaving`

#### Folder Class (`FCAr`)
- **Inherits**: `section`
- **Properties**: Similar to projects but for organization
- **Elements**: Contains projects and sub-folders

### Commands

#### Standard Commands
- `make new`: Create objects with properties
- `delete`: Remove objects
- `move`: Relocate objects in hierarchy
- `duplicate`: Copy objects with properties

#### OmniFocus-Specific Commands
- `mark complete`/`mark incomplete`: Change completion status
- `mark dropped`: Drop tasks/projects
- `compact`: Process inbox assignments
- `synchronize`: Trigger sync
- `complete`: Auto-completion for names
- `parse tasks into`: Parse text into tasks
- `archive`: Archive completed items

### Enumerations

#### Project Status (`FCPs`)
- `active status` (`FCPa`)
- `on hold status` (`FCPh`) 
- `done status` (`FCPd`)
- `dropped status` (`FCPD`)

#### Repetition Method (`FRmM`)
- `fixed repetition` (`FRmF`): Fixed schedule
- `start after completion` (`FRmS`): Sliding from completion
- `due after completion` (`FRmD`): Due-based sliding

#### Interval Units (`FCIu`)
- `minute`, `hour`, `day`, `week`, `month`, `year`

## URL Schemes

### Supported Schemes
1. **omnifocus**: Legacy scheme
2. **omnifocus4**: OmniFocus 4 specific
3. **com.omnigroup.omnifocus4**: Callback URLs
4. **com.omnigroup.omnifocus4+4.6.1**: Version-specific
5. **x-omnifocus-settings**: Settings URLs

### Usage Examples
```
omnifocus:///
omnifocus4:///add?name=Task%20Name&note=Task%20details
```

## Omni Automation (JavaScript)

### Framework Support
- **OmniJS Framework**: `/Applications/OmniFocus.app/Contents/Frameworks/OmniJS.framework/`
- **Cross-Platform**: JavaScript plug-ins work across Mac and iOS
- **Plug-In Template Generator**: Available for creating new plug-ins

### Resources
- **Official Documentation**: https://omni-automation.com/omnifocus/index.html
- **Plug-In Collection**: Example plug-ins available
- **Tutorial Support**: Step-by-step learning materials

## App Intents & Shortcuts

### Integration
- **Metadata Version**: 3.0 support
- **App Intents**: `/Applications/OmniFocus.app/Contents/Resources/Metadata.appintents/`
- **Shortcuts Support**: Native iOS/macOS Shortcuts integration

## Security & Permissions

### App Sandbox Entitlements
- `com.apple.security.app-sandbox`: Fully sandboxed
- `com.apple.security.automation.apple-events`: AppleScript support

### Permission Requirements
- **Apple Events**: Required for AppleScript automation
- **Personal Information**: 
  - `com.apple.security.personal-information.addressbook`: Contact access
  - `com.apple.security.personal-information.calendars`: Calendar integration
  - `com.apple.security.personal-information.location`: Location features
- **Network**: Client/server capabilities for sync

### Scripting Targets
- **Mail.app**: `com.apple.mail.compose`
- **System Preferences**: `preferencepane.reveal`
- **Various Applications**: Temporary exceptions for specific app interactions

## Performance Considerations

### Caching
- **Document Cache**: `using cache` parameter in open commands
- **Cache Control**: Can disable cache for fresh data retrieval

### Memory Management
- **Sandboxing**: May limit some direct file operations
- **Transaction Compression**: `compresses transactions` property for efficiency
- **Summary Information**: `includes summaries` for optimized writes

### Best Practices
1. **Batch Operations**: Group multiple changes together
2. **Efficient Queries**: Use specific object references rather than searches
3. **Error Handling**: Check for `can undo`/`can redo` states
4. **Sync Awareness**: Monitor `syncing` property for timing

## Version Support

### Current Version
- **OmniFocus**: 4.6.1 (Build 182.3.0)
- **macOS**: Compatible with sandboxed environment
- **Legacy Support**: Maintains backward compatibility with older script syntax

### Deprecated Features
- **Context → Tag**: Use `tag` instead of deprecated `context`
- **Repetition Interval**: Use `repetition rule` instead of `repetition`

## Example AppleScript Snippets

### Basic Project Creation
```applescript
tell application "OmniFocus"
    tell default document
        make new project with properties {name:"New Project", note:"Project description"}
    end tell
end tell
```

### Task Management
```applescript
tell application "OmniFocus"
    tell default document
        set myTask to make new inbox task with properties {name:"Sample Task", flagged:true}
        mark complete myTask
    end tell
end tell
```

### Query Projects
```applescript
tell application "OmniFocus"
    tell default document
        get name of every project whose status is active status
    end tell
end tell
```

## Resources & Documentation

### Official Resources
- **Omni Automation**: https://omni-automation.com/omnifocus/index.html
- **Dictionary File**: `/Applications/OmniFocus.app/Contents/Resources/OmniFocus.sdef`
- **Plug-In Collection**: Examples and templates available

### Development Tools
- **Script Editor**: Built-in macOS AppleScript development
- **OmniFocus Plug-In Template Generator**: For JavaScript plug-ins
- **URL Scheme Testing**: Use `open` command for testing schemes

---

*Research conducted on OmniFocus 4.6.1 (Build 182.3.0) running on macOS*
*Last updated: August 2025*
