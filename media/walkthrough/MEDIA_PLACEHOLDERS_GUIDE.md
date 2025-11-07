# Media Placeholders Reference

This document tracks all media placeholders that need GIFs/videos for the walkthrough.

## VS Code Walkthrough Media Support

VS Code walkthroughs support:
- ✅ **Images**: `.png`, `.jpg`, `.gif`, `.svg`
- ✅ **Videos**: `.mp4`, `.webm`
- ✅ **Markdown**: Embedded images via markdown syntax

### How to Add Media

In `package.json` walkthrough steps, you can use:

```json
"media": {
  "image": "media/walkthrough/videos/demo.gif"
}
```

Or in markdown files:
```markdown
![Demo](./videos/demo.gif)
```

---

## TODO Converter Feature - Media Needed

### Priority 1: Essential Demos

#### 1. **Complete Workflow Demo** 🎬
**File:** `media/walkthrough/videos/todo-converter-demo.gif`  
**Duration:** 30-45 seconds  
**Shows:**
1. TODO in code: `// TODO: Add rate limiting`
2. Right-click → Convert to ticket
3. Ticket form with auto-filled permalink
4. Ticket created: `ENG-456`
5. Success message with 4 buttons
6. Click "Add More TODOs"
7. Navigate to another file
8. Paste ticket reference
9. Success!

**Script:**
```
1. Open src/auth/login.ts (show TODO comment)
2. Right-click TODO
3. Select "Convert TODO to Linear Ticket"
4. Show ticket form (zoom into permalink section)
5. Click Create
6. Show success notification
7. Click "Add More TODOs"
8. Cmd+P → type "middleware"
9. Cmd+V to paste ticket reference
10. Click "Done"
```

---

#### 2. **Permalink in Action** 🎬
**File:** `media/walkthrough/videos/permalink-in-linear.gif`  
**Duration:** 15-20 seconds  
**Shows:**
1. Linear ticket opened
2. Scroll to see permalink section
3. Click "View in code" link
4. Browser opens to exact line in GitHub
5. Code is highlighted

**Script:**
```
1. Open Linear ticket ENG-456
2. Zoom into description showing:
   📍 Location: src/auth/login.ts:145
   🔗 View in code: [GitHub](...)
3. Click the GitHub link
4. New tab opens to GitHub
5. Exact line 145 is highlighted in yellow
6. Show surrounding code context matches ticket
```

---

#### 3. **"Add More TODOs" Workflow** 🎬 (KEY FEATURE)
**File:** `media/walkthrough/videos/add-more-todos.gif`  
**Duration:** 40-50 seconds  
**Shows:**
1. Ticket created
2. Click "Add More TODOs" button
3. Modal appears with clipboard notification
4. Quick Open (Cmd+P) → navigate to file 1
5. Paste ticket reference
6. Click "Add Another"
7. Navigate to file 2
8. Paste again
9. Click "Add Another"
10. Navigate to file 3
11. Paste
12. Click "Done"
13. Show all 3 files now have ticket reference

**Script:**
```
1. Show success message after ticket creation
2. Click "Add More TODOs"
3. Modal: "📋 Ticket reference copied!"
4. Press Cmd+P
5. Type "middleware" → Open middleware.ts
6. Navigate to line 67
7. Cmd+V paste: // ENG-456: Track at...
8. Modal reappears, click "Add Another"
9. Cmd+P → Type "token" → Open token.ts
10. Navigate to line 23
11. Cmd+V paste
12. Click "Add Another"
13. Cmd+P → Type "config" → Open jwt.ts
14. Navigate to line 12
15. Cmd+V paste
16. Click "Done"
17. Quick montage showing all 4 files with ENG-456
```

---

### Priority 2: Supporting Demos

#### 4. **Basic Conversion** 🎬
**File:** `media/walkthrough/videos/basic-conversion.gif`  
**Duration:** 10-15 seconds  
**Shows:** Simplest flow - right-click → convert → done

**Script:**
```
1. TODO visible: // TODO: Fix memory leak
2. Right-click
3. Click "Convert TODO to Linear Ticket"
4. Form appears (quickly review)
5. Click "Create"
6. Success: ✅ Created ticket ENG-789
7. TODO replaced with: // ENG-789: Track at...
```

---

#### 5. **Link Existing TODOs** 🎬
**File:** `media/walkthrough/videos/link-existing-todos.gif`  
**Duration:** 20-30 seconds  
**Shows:**
1. Click "Link Existing TODOs"
2. Search results showing TODOs
3. Multi-select 3 TODOs
4. Click confirm
5. Success message
6. Show files updated

**Script:**
```
1. After ticket creation, click "Link Existing TODOs"
2. Loading spinner (2 seconds)
3. List appears with 12 TODOs found
4. Check boxes for:
   ☑ Implement Redis caching (api/users.ts:45)
   ☑ Add cache invalidation (api/auth.ts:123)
   ☑ Cache user preferences (services/userService.ts:67)
5. Press Enter
6. Loading for 2 seconds
7. Success: ✅ Linked 3 additional TODOs to ENG-456
8. Quick flash showing 3 files updated
```

---

### Priority 3: Comparisons & Context

#### 6. **Workflow Comparison** 🎬
**File:** `media/walkthrough/videos/workflow-comparison.gif`  
**Duration:** 45-60 seconds  
**Split screen showing old vs new**

**Left side (Old Way):**
```
1. Write TODO
2. Open Linear in browser
3. Click "New Issue"
4. Type title (from TODO)
5. Type description
6. Manually type file path
7. Create ticket
8. Copy ticket ID
9. Back to VS Code
10. Replace TODO with ticket ID
11. Open another file
12. Write TODO
13. Manually add ticket ID
Total time: ~3-5 minutes
```

**Right side (New Way):**
```
1. Write TODO
2. Right-click → Convert
3. Review (auto-filled)
4. Create
5. Click "Add More TODOs"
6. Navigate → Paste
7. Navigate → Paste
8. Done
Total time: ~30 seconds
```

---

#### 7. **Real-World Complete Example** 🎬
**File:** `media/walkthrough/videos/real-world-example.mp4` (video, not GIF)  
**Duration:** 1-2 minutes  
**Narrated walkthrough**

**Scenario:** "Auth refactor affecting 4 files"

**Script with voiceover:**
```
Voiceover: "I'm working on authentication and realize it needs refactoring across multiple files."

1. Show src/auth/login.ts
   VO: "First, I add a TODO where I notice the issue"
   Type: // TODO: Move JWT logic to auth service

2. Right-click TODO
   VO: "Right-click and convert to a Linear ticket"

3. Ticket form appears with permalink
   VO: "Notice it automatically includes a link to the exact line of code, branch info, and surrounding context"

4. Click Create
   VO: "The ticket is created with full context"

5. Success message with options
   VO: "Now I have options. Since I know this affects other files, I'll choose 'Add More TODOs'"

6. Modal appears
   VO: "The ticket reference is copied to my clipboard"

7. Cmd+P → type "middleware"
   VO: "I use Quick Open to navigate to the middleware file"

8. Find spot, paste
   VO: "Paste the ticket reference where I need it"

9. Repeat for 2 more files
   VO: "And quickly add it to the other locations"

10. Click Done
   VO: "Done! Now all four locations reference the same ticket."

11. Show Linear ticket
   VO: "Anyone who picks up this ticket can click the permalink and jump right to the code."

12. Click permalink in Linear
   VO: "Like this - straight to the exact line."

13. GitHub opens to exact line
   VO: "No hunting, no context loss. Everything's connected."
```

---

## How to Record

### Tools
- **macOS**: QuickTime, Kap, Gifox
- **Windows**: ShareX, ScreenToGif
- **Linux**: Peek, SimpleScreenRecorder

### Settings
- **Resolution**: 1920x1080 or 2560x1440 (scale down to 1920 for walkthrough)
- **FPS**: 30 fps (GIFs), 60 fps (MP4)
- **Format**: 
  - GIF for < 30 seconds, < 5MB
  - MP4 for longer demos
  - WebM as alternative to MP4

### Best Practices
1. **Clean workspace**: Hide personal info, use example data
2. **Slow movements**: Cursor moves slowly, pause on key actions
3. **Zoom when needed**: Zoom into important UI elements
4. **Consistent theme**: Use same VS Code theme (Dark+ or Light+)
5. **Clear text**: Use readable font size (14-16pt)
6. **No audio** for GIFs, **voiceover** for MP4

### File Size Guidelines
- **GIFs**: < 5MB (optimize with tools like ezgif.com)
- **MP4**: < 20MB for walkthrough
- Use video compression if needed

---

## Placeholder Format in Markdown

```markdown
## 🎬 Demo Title

> **[PLACEHOLDER: Insert GIF/Video]**  
> **File:** `media/walkthrough/videos/filename.gif`  
> **Duration:** 30-45 seconds  
> **Shows:**  
> - What happens step by step
> - Key actions highlighted
> 
> **Script:**
> 1. Step one
> 2. Step two
> etc.
```

---

## Replacement Process

Once media is created:

1. **Add file** to `media/walkthrough/videos/`
2. **Update markdown** - Replace placeholder with:
   ```markdown
   ![Demo Title](./videos/filename.gif)
   ```
3. **Test in VS Code** - Open walkthrough, verify media loads
4. **Optimize** - Compress if > 5MB for GIFs

---

## Current Status

### Created
- ✅ Markdown with placeholders
- ✅ Scripts for each demo
- ✅ Directory structure

### TODO
- ⬜ Record: todo-converter-demo.gif
- ⬜ Record: permalink-in-linear.gif  
- ⬜ Record: add-more-todos.gif (KEY FEATURE)
- ⬜ Record: basic-conversion.gif
- ⬜ Record: link-existing-todos.gif
- ⬜ Record: workflow-comparison.gif
- ⬜ Record: real-world-example.mp4
- ⬜ Add voiceover to MP4
- ⬜ Optimize all files
- ⬜ Update markdown with actual file references
- ⬜ Test in VS Code walkthrough

---

## Notes

- **Priority**: Focus on "add-more-todos.gif" first - this is the key differentiator
- **Demo data**: Use example repo, not real project
- **Ticket IDs**: Use consistent ENG-XXX format
- **Git provider**: Show GitHub (most common)
- **Theme**: Use VS Code Dark+ theme (most popular)

---

**When ready to record, follow the scripts exactly for consistency!**

