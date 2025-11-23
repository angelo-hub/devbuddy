# Beta Testing Guide for DevBuddy

Thank you for your interest in beta testing DevBuddy! This guide will help you install, use, and provide feedback on pre-release versions.

## What is a Beta/Pre-release Version?

Beta versions (also called pre-release versions) are early releases of DevBuddy that contain:

- ✨ **New features** being tested before stable release
- 🐛 **Bug fixes** that need validation
- 🔬 **Experimental features** that may change or be removed

**Important**: Beta versions may have bugs or incomplete features. We recommend keeping your stable version as a backup.

## Types of Pre-releases

DevBuddy uses three types of pre-release versions:

- **Alpha** (X.Y.Z-alpha.N) - Very early, experimental features, may be unstable
- **Beta** (X.Y.Z-beta.N) - Feature-complete but needs testing, relatively stable  
- **RC** (X.Y.Z-rc.N) - Release Candidate, final testing before going stable

Most users should stick to **beta** or **rc** versions for testing.

## Installing Beta Versions

### Method 1: Via VS Code/Cursor (Recommended)

This is the easiest way to try beta versions:

1. **Open Extensions View**
   - Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
   - Or click the Extensions icon in the sidebar

2. **Find DevBuddy**
   - Search for "DevBuddy"
   - Find the extension by "angelogirardi"

3. **Switch to Pre-Release**
   - Click the dropdown arrow next to the "Install" or "Update" button
   - Select **"Switch to Pre-Release Version"**
   - VS Code will automatically install the latest beta version

4. **Reload**
   - Click "Reload" when prompted
   - DevBuddy is now running the beta version!

### Method 2: Manual Installation via VSIX

If you want to install a specific beta version:

1. **Download the Beta**
   - Go to [DevBuddy Releases](https://github.com/angelo-hub/devbuddy/releases)
   - Find the pre-release version you want
   - Download the `.vsix` file

2. **Install the VSIX**
   - Open VS Code/Cursor
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `Extensions: Install from VSIX`
   - Select the downloaded `.vsix` file

3. **Reload**
   - Reload your window when prompted

## Switching Back to Stable

If you encounter issues with a beta version, you can easily switch back:

1. **Via Extensions View**
   - Open Extensions view (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - Find DevBuddy
   - Click the dropdown arrow next to "Uninstall"
   - Select **"Switch to Release Version"**

2. **Reload**
   - Click "Reload" when prompted
   - You're back on the stable version!

## What to Test

When testing a beta version, please focus on:

### New Features

- Try out any new features mentioned in the release notes
- Test them in different scenarios
- Check if they work with both Linear and Jira (if applicable)

### Existing Functionality

- Make sure existing features still work correctly
- Test your typical workflow
- Verify integrations (Linear, Jira, Git, AI, etc.)

### Performance

- Notice if the extension feels slower or faster
- Check if there are any delays or freezes
- Monitor memory usage if possible

### UI/UX

- Look for visual glitches or layout issues
- Check if text is readable and properly formatted
- Test in both light and dark themes

## Providing Feedback

Your feedback is crucial for making DevBuddy better! Here's how to share it:

### Reporting Bugs

If you find a bug:

1. **Check Existing Issues**
   - Visit [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)
   - Search to see if the bug is already reported

2. **Create a New Issue**
   - Click "New Issue"
   - Use the bug report template
   - **Include the version number** (e.g., 0.6.0-beta.2)
   - Describe what happened vs. what you expected
   - Include steps to reproduce the bug
   - Add screenshots if relevant

3. **Enable Debug Mode** (Optional)
   - Open Settings (`Cmd+,` / `Ctrl+,`)
   - Search for "DevBuddy Debug Mode"
   - Enable it
   - Reproduce the bug
   - Check the "DevBuddy" output channel for logs
   - Include relevant logs in your bug report

### Suggesting Improvements

If you have ideas for improvement:

1. Go to [GitHub Discussions](https://github.com/angelo-hub/devbuddy/discussions)
2. Create a new discussion in "Ideas" category
3. Describe your suggestion
4. Explain why it would be useful
5. Share any mockups or examples if you have them

### Sharing General Feedback

For general feedback about the beta:

- Join our Discord/Slack community (if available)
- Comment on the GitHub pre-release announcement
- Send feedback via GitHub Discussions

## Beta Testing Best Practices

To be an effective beta tester:

### ✅ Do's

- **Test in a safe environment** - Use on non-critical projects first
- **Read release notes** - Understand what changed
- **Be specific** - Provide detailed bug reports
- **Be patient** - Betas may have rough edges
- **Update regularly** - Install new beta versions as they come out
- **Share both positive and negative feedback** - We want to hear it all!

### ❌ Don'ts

- **Don't use in production** without a backup plan
- **Don't expect perfection** - It's a beta for a reason
- **Don't report known issues** - Check existing issues first
- **Don't be vague** - "It doesn't work" isn't helpful feedback
- **Don't forget to update** - Old beta versions may have fixed bugs

## Frequently Asked Questions

### Q: Will I automatically get beta updates?

**A:** Yes! Once you switch to pre-release versions, you'll automatically receive new beta updates as they're published.

### Q: Can I use both stable and beta at the same time?

**A:** No, you can only have one version of DevBuddy installed at a time. However, you can easily switch between stable and beta versions.

### Q: What if a beta breaks something important?

**A:** Switch back to the stable version immediately (see "Switching Back to Stable" above). Then report the issue so we can fix it.

### Q: How long do beta periods usually last?

**A:** Typically 1-2 weeks, but it depends on the changes and feedback received.

### Q: Are my settings/data safe when using a beta?

**A:** Yes, your settings and data are stored separately from the extension code. However, new beta features might add new settings or change data formats, so it's always good to have backups.

### Q: Do I need to do anything special to test with Linear/Jira?

**A:** No, your existing Linear/Jira connections will work with beta versions. Just test as you normally would.

### Q: What if I find a security issue?

**A:** Please report security issues privately to girardi.ang@gmail.com instead of creating a public issue.

## Getting Help

If you need help while beta testing:

- **Check the Docs**: [DevBuddy Documentation](https://github.com/angelo-hub/devbuddy)
- **Ask in Discussions**: [GitHub Discussions](https://github.com/angelo-hub/devbuddy/discussions)
- **Report Issues**: [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)

## Current Beta Information

To check what beta versions are available:

1. Visit [DevBuddy Releases](https://github.com/angelo-hub/devbuddy/releases)
2. Look for releases marked as "Pre-release"
3. Read the release notes to see what's new

## Thank You!

Your beta testing helps make DevBuddy better for everyone. We truly appreciate your time and feedback! 🙏

---

**Happy Testing!** 🧪✨

If you have any questions about beta testing, feel free to ask in [GitHub Discussions](https://github.com/angelo-hub/devbuddy/discussions).

