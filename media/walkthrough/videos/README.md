# Video Assets for DevBuddy

This directory contains large media files (GIFs, MP4s) for documentation and walkthroughs.

## Important: These Files Are NOT Bundled

**These files are excluded from the VSIX package** to keep the extension lightweight. They are:
- ✅ Committed to Git repository
- ✅ Referenced via GitHub raw URLs
- ❌ NOT included in VSIX bundle

## How to Reference These Files

### In Walkthrough Steps (package.json)

```json
{
  "media": {
    "image": "https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif"
  }
}
```

### In Markdown Files (README, docs)

```markdown
![TODO Converter Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif)
```

### In Webview Panels (HTML)

```html
<img src="https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif" alt="Demo" />
```

## Available Videos

| File | Size | Description | GitHub URL |
|------|------|-------------|------------|
| `todo-converter-demo.gif` | 12 MB | Complete TODO to ticket conversion workflow | `https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif` |

## Adding New Videos

1. **Optimize first** (if possible):
   ```bash
   # For GIFs
   gifsicle -O3 --colors 128 input.gif -o output.gif
   
   # For MP4s
   ffmpeg -i input.mp4 -vcodec h264 -acodec aac output.mp4
   ```

2. **Name clearly** (use kebab-case, no spaces):
   - ✅ `feature-name-demo.gif`
   - ❌ `Feature Demo .gif`

3. **Add to this directory**: `media/walkthrough/videos/`

4. **Commit to Git**:
   ```bash
   git add media/walkthrough/videos/your-video.gif
   git commit -m "docs: add [feature] demo video"
   git push
   ```

5. **Reference via GitHub raw URL** (not local path)

## Bundle Size Impact

**Before optimization:**
- Extension with videos: ~20 MB
- Extension without videos: ~8 MB
- Bundle size reduction: **60%** 🎉

**Current approach:**
- Videos live in Git repo (free, unlimited)
- Referenced remotely (loads on-demand)
- VSIX stays lightweight (~8 MB)

## Why Remote Hosting?

✅ **Smaller bundle** - 8 MB vs 20 MB  
✅ **Faster installs** - Users download only what they need  
✅ **Always current** - GitHub serves latest version  
✅ **Free hosting** - No CDN costs  
✅ **Works everywhere** - VS Code Marketplace, GitHub, local development

## Testing Locally

To test remote references locally before pushing:

```bash
# Start local server
python3 -m http.server 8000

# Reference as:
# http://localhost:8000/media/walkthrough/videos/todo-converter-demo.gif
```

## Troubleshooting

**Video not showing in walkthrough?**
- Ensure file is pushed to GitHub
- Check URL is correct (no typos)
- Wait 5 minutes for GitHub CDN cache
- Try incognito/private browsing

**File too large?**
- GIFs over 10 MB should be optimized
- Consider MP4 format (usually 5-10x smaller)
- Reduce frame rate if needed
- Crop to essential area only

---

**Questions?** See `docs/developer/WEBVIEW_GUIDE.md` for more on media handling.

