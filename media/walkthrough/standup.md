# Generate Standup Updates

Let AI generate your standup update automatically from your commits and Linear activity. No more scrambling to remember what you did!

## How It Works

### Open the Standup Builder
Click the **$(notebook)** icon in the sidebar or use the command:
**"Linear Buddy: Open Standup Builder"**

### AI Analyzes Your Work
Linear Buddy automatically:
- 📊 **Fetches your recent commits** (last 24 hours by default)
- 🎫 **Checks your Linear tickets** (updated recently)
- 🔍 **Analyzes code changes** across packages
- 🧠 **Understands context** from commit messages

### Review & Customize
The standup builder shows:
- **Yesterday/Today** - What you accomplished
- **Today/Tomorrow** - What you're planning to work on
- **Blockers** - Any impediments or challenges
- **Tickets** - Linear tickets you're working on
- **Pull Requests** - Any PRs you've created

### Generate with AI
Click **"Generate with AI"** and Linear Buddy:
- ✨ **Summarizes your work** in natural language
- 📝 **Uses your preferred tone** (professional, casual, technical, concise)
- 🎯 **Highlights key accomplishments** and progress
- 🔗 **Links to relevant tickets** and PRs

### Copy & Share
One click to copy the standup to your clipboard, ready to paste in Slack, email, or your standup tool!

## Customization Options

### Time Window
Configure how far back to look:
- 24 hours (default)
- 2 days
- Since last standup
- Custom time range

**Settings** → **Linear Buddy** → **Standup Time Window**

### Writing Tone
Choose how your standup sounds:
- **Professional** - Clear, informative (default)
- **Casual** - Friendly, conversational
- **Technical** - Detailed, implementation-focused
- **Concise** - Brief, to-the-point

**Settings** → **Linear Buddy** → **Writing Tone**

## Example Output

```markdown
## Yesterday
- Completed ENG-123: User authentication flow
  - Implemented JWT token refresh mechanism
  - Added password reset functionality
- Fixed bug in payment processing (ENG-124)
- Reviewed 3 pull requests from team members

## Today
- Starting ENG-125: Dashboard redesign
- Code review session at 2pm
- Update API documentation

## Blockers
- Waiting on design assets for dashboard
```

## Pro Tips

1. **Run before your standup** - Generate it in seconds, review while drinking coffee
2. **Customize the tone** - Match your team's culture (formal vs casual)
3. **Add manual notes** - AI generates the base, you add specifics
4. **Keep commits descriptive** - Better commit messages = better standups
5. **Link Linear tickets** - Reference ticket IDs in commits for automatic correlation

## AI Model Selection

You can choose which AI model to use:
- **Auto** (recommended) - Uses the best available model
- **GPT-4o** - Most capable, best quality
- **GPT-4 Turbo** - Fast and powerful
- **GPT-4o Mini** - Faster, more efficient

**Settings** → **Linear Buddy** → **AI Model**

Try generating your standup now - it's way easier than writing it from scratch!

