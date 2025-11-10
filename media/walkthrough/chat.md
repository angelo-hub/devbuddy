# Use the AI Chat Assistant

Talk to DevBuddy naturally using VS Code's chat interface. Ask questions, get help, and automate your workflow with natural language!

## Getting Started

### Open Chat
1. Click the **Chat** icon in the Activity Bar
2. Or press **Cmd/Ctrl + I** (depending on your VS Code setup)
3. Or use **View** → **Chat**

### Talk to DevBuddy
Type `@devbuddy` to start talking to DevBuddy:

```
@devbuddy show me my tickets
@devbuddy help me write a standup
@devbuddy what's the status of ENG-123?
```

## Built-in Commands

### `/tickets` - View Your Tickets
```
@devbuddy /tickets
```
Shows all your assigned tickets from your configured platform (Linear, Jira, etc.)

### `/standup` - Generate Standup (Linear)
```
@devbuddy /standup
```
Generates a standup update from your recent commits and tickets

### `/pr` - Generate PR Summary (Linear)
```
@devbuddy /pr
```
Creates a comprehensive PR description for your current changes

### `/status` - Update Ticket Status
```
@devbuddy /status
```
Helps you change the status of a ticket interactively

## Natural Language

You don't need to use commands! Just ask naturally:

### About Your Work
```
@devbuddy What am I working on?
@devbuddy Show me my in-progress tickets
@devbuddy Which tickets are due this week?
```

### About Specific Tickets
```
@devbuddy Tell me about ENG-123
@devbuddy What's the priority of my tickets?
@devbuddy Show me high-priority bugs
```

### Get Help
```
@devbuddy How do I create a branch?
@devbuddy Help me set up my API key
@devbuddy What features do you have?
@devbuddy How do I switch platforms?
```

### Workflow Automation
```
@devbuddy Create a ticket for adding dark mode
@devbuddy Generate a standup for yesterday
@devbuddy Help me write a PR description
```

## Multi-Platform Support

DevBuddy works with both Linear and Jira:

```
@devbuddy show my Jira issues
@devbuddy what Linear tickets do I have?
@devbuddy switch to Jira
```

The chat assistant adapts to your current platform configuration!

## Why Use Chat?

- **Natural language** - No need to remember commands
- **Contextual** - Ask follow-up questions
- **Quick access** - Keyboard shortcut to chat
- **Multitasking** - Chat while viewing code
- **Smart suggestions** - AI understands your intent
- **Multi-platform** - Works with Linear, Jira, and more

## Chat vs. UI

Both have their place:

### Use Chat When:
- You want to ask questions
- You're exploring features
- You need quick info
- You want conversational help

### Use UI When:
- You need detailed ticket views
- You're creating complex tickets
- You want visual organization
- You're reviewing multiple tickets

## Pro Tips

1. **Use `@devbuddy` first** - This directs your message to DevBuddy
2. **Ask for clarification** - Follow up with "tell me more" or "explain that"
3. **Combine with other agents** - Use `@workspace` and `@devbuddy` together
4. **Share context** - Mention specific ticket IDs or branches
5. **Request different tones** - Ask for "casual" or "technical" responses
6. **Platform-specific queries** - Ask about Linear or Jira specifically

## Example Conversations

### Quick Status Check
```
You: @devbuddy what's on my plate today?
DevBuddy: You have 3 tickets in progress:
- ENG-123: User authentication (In Progress)
- ENG-124: Dashboard redesign (In Progress)  
- ENG-125: Fix login bug (Todo)
```

### Get Help
```
You: @devbuddy how do I convert a TODO to a ticket?
DevBuddy: Here's how to convert a TODO comment to a Linear ticket:
1. Select the TODO comment in your code
2. Click the lightbulb icon or press Cmd+.
3. Choose "Convert TODO to Linear Ticket"
...
```

### Workflow Help
```
You: @devbuddy I need to start work on a new feature
DevBuddy: Great! Here's what I recommend:
1. Create a ticket with /createTicket
2. Create a branch with the git-branch icon (Linear)
3. Update status to "In Progress"
Would you like me to walk you through it?
```

### Platform Switching
```
You: @devbuddy how do I switch from Linear to Jira?
DevBuddy: To switch platforms:
1. Open Settings (Cmd/Ctrl + ,)
2. Search for "devBuddy.provider"
3. Change the value to "jira"
4. Run "DevBuddy: Setup Jira Cloud" to configure
```

The chat is your friendly multi-platform assistant - don't hesitate to ask anything!


