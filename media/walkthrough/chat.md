# Use the AI Chat Assistant

Talk to Linear Buddy naturally using VS Code's chat interface. Ask questions, get help, and automate your workflow with natural language!

## Getting Started

### Open Chat
1. Click the **Chat** icon in the Activity Bar
2. Or press **Cmd/Ctrl + I** (depending on your VS Code setup)
3. Or use **View** → **Chat**

### Talk to Linear Buddy
Type `@linear` to start talking to Linear Buddy:

```
@linear show me my tickets
@linear help me write a standup
@linear what's the status of ENG-123?
```

## Built-in Commands

### `/tickets` - View Your Tickets
```
@linear /tickets
```
Shows all your assigned Linear tickets with status and details

### `/standup` - Generate Standup
```
@linear /standup
```
Generates a standup update from your recent commits and tickets

### `/pr` - Generate PR Summary
```
@linear /pr
```
Creates a comprehensive PR description for your current changes

### `/status` - Update Ticket Status
```
@linear /status
```
Helps you change the status of a ticket interactively

## Natural Language

You don't need to use commands! Just ask naturally:

### About Your Work
```
@linear What am I working on?
@linear Show me my in-progress tickets
@linear Which tickets are due this week?
```

### About Specific Tickets
```
@linear Tell me about ENG-123
@linear What's the priority of my tickets?
@linear Show me high-priority bugs
```

### Get Help
```
@linear How do I create a branch?
@linear Help me set up my API key
@linear What features do you have?
```

### Workflow Automation
```
@linear Create a ticket for adding dark mode
@linear Generate a standup for yesterday
@linear Help me write a PR description
```

## Why Use Chat?

- **Natural language** - No need to remember commands
- **Contextual** - Ask follow-up questions
- **Quick access** - Keyboard shortcut to chat
- **Multitasking** - Chat while viewing code
- **Smart suggestions** - AI understands your intent

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

1. **Use `@linear` first** - This directs your message to Linear Buddy
2. **Ask for clarification** - Follow up with "tell me more" or "explain that"
3. **Combine with other agents** - Use `@workspace` and `@linear` together
4. **Share context** - Mention specific ticket IDs or branches
5. **Request different tones** - Ask for "casual" or "technical" responses

## Example Conversations

### Quick Status Check
```
You: @linear what's on my plate today?
Linear Buddy: You have 3 tickets in progress:
- ENG-123: User authentication (In Progress)
- ENG-124: Dashboard redesign (In Progress)  
- ENG-125: Fix login bug (Todo)
```

### Get Help
```
You: @linear how do I convert a TODO to a ticket?
Linear Buddy: Here's how to convert a TODO comment to a Linear ticket:
1. Select the TODO comment in your code
2. Click the lightbulb icon or press Cmd+.
3. Choose "Convert TODO to Linear Ticket"
...
```

### Workflow Help
```
You: @linear I need to start work on a new feature
Linear Buddy: Great! Here's what I recommend:
1. Create a ticket with /createTicket
2. Create a branch with the git-branch icon
3. Update status to "In Progress"
Would you like me to walk you through it?
```

The chat is your friendly assistant - don't hesitate to ask anything!

