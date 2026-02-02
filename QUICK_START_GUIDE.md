# Quick Start Guide: Fullscreen Help Page Add-On

## What You'll See in the Website Builder

### Add-Ons Section
When you navigate to the **Add-Ons** section of your Strikebot website builder, you'll now see a new add-on card:

```
┌─────────────────────────────────────────────┐
│ Fullscreen Help Page                     ✓ │
│                                             │
│ Add a dedicated fullscreen chatbot help    │
│ page with sidebar and chat history         │
│                                             │
│ $49 /month                                  │
└─────────────────────────────────────────────┘
```

### How to Enable It
1. Click on the "Fullscreen Help Page" card
2. A checkmark (✓) will appear, and the card will be highlighted in orange
3. The add-on cost will be added to your total

### Where It Appears
The add-on appears in the same grid as other add-ons:
- **Extra Messages** - $25/month
- **Remove Branding** - $199/month
- **Fullscreen Help Page** - $49/month (NEW!)

## What Happens in WordPress

### Before Enabling the Add-On
WordPress Admin Menu:
```
Strikebot
├── Dashboard
├── Knowledge Base
├── Appearance
└── Settings
```

### After Enabling the Add-On
WordPress Admin Menu:
```
Strikebot
├── Dashboard
├── Knowledge Base
├── Appearance
├── Settings
└── Help Page (NEW!)
```

### The Help Page Settings Panel

When you click "Strikebot > Help Page", you'll see configuration options:

```
┌─────────────────────────────────────────────────────┐
│ Fullscreen Chatbot Settings                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ OpenAI API Key:      [••••••••••••••••••]          │
│ OpenAI Model:        [GPT-4o ▼]                    │
│ Chatbot Page:        [-- Select a Page -- ▼]       │
│ System Prompt:       [You are a helpful...]        │
│                                                     │
│ Header Logo:         [Upload Logo]  [Remove Logo]  │
│                      Preview: [logo image]          │
│                                                     │
│ Chat Icon:           [Upload Icon]  [Remove Icon]  │
│                      Preview: [icon image]          │
│                                                     │
│                      [Save Changes]                 │
└─────────────────────────────────────────────────────┘
```

## User Experience Flow

### Step 1: Website Builder
```
User opens Strikebot builder
↓
Configures chatbot settings
↓
Selects tier (Starter/Pro/Business/Enterprise)
↓
Goes to Add-Ons section
↓
Enables "Fullscreen Help Page" ← NEW STEP
↓
Downloads plugin
```

### Step 2: WordPress Installation
```
User installs plugin
↓
Activates plugin
↓
Sees "Strikebot > Help Page" menu ← NEW MENU ITEM
↓
Configures help page settings
↓
Selects WordPress page for chatbot
↓
Saves settings
```

### Step 3: End User Experience
```
Visitor goes to the designated page
↓
Sees fullscreen chatbot interface with:
  - Sidebar with chat history
  - Modern messaging interface
  - Dark/Light mode toggle
  - Session persistence
```

## Generated Plugin Structure

### Without Add-On
```
strikebot.zip
└── strikebot/
    ├── strikebot.php
    ├── assets/
    ├── templates/
    ├── uninstall.php
    └── readme.txt
```

### With Add-On
```
strikebot.zip
└── strikebot/
    ├── strikebot.php (enhanced with fullscreen loader)
    ├── assets/
    ├── templates/
    ├── fullscreen/ ← NEW DIRECTORY
    │   ├── fullscreen-chatbot.php
    │   ├── admin-script.js
    │   ├── chatbot-script.js
    │   ├── chatbot-style.css
    │   └── chatbot-template.php
    ├── uninstall.php
    └── readme.txt (updated with add-on info)
```

## Code Changes Summary

### Modified Files
1. ✅ `src/types/chatbot.ts` - Added fullscreen_help_page type and add-on definition
2. ✅ `src/app/api/generate-plugin/route.ts` - Added conditional file inclusion logic
3. ✅ No changes needed to `src/components/AddOnsSelector.tsx` - Works automatically!

### Why AddOnsSelector Didn't Need Changes
The component is already designed to dynamically render all add-ons from the `AVAILABLE_ADDONS` array, so adding the new add-on to the array automatically makes it appear in the UI!

## Testing Checklist

- [ ] Fullscreen Help Page appears in Add-Ons section
- [ ] Selecting the add-on highlights the card
- [ ] Add-on cost appears in the total
- [ ] Generated plugin includes `fullscreen/` directory
- [ ] All 5 fullscreen files are present in the plugin
- [ ] "Help Page" menu appears in WordPress admin (when add-on enabled)
- [ ] "Help Page" menu doesn't appear when add-on is not enabled
- [ ] Settings page loads correctly
- [ ] Can configure API key, model, page selection
- [ ] Can upload and remove logos/icons
- [ ] Selected page displays fullscreen chatbot
- [ ] Chat functionality works on the fullscreen page
- [ ] Dark mode toggle works
- [ ] Chat history is maintained across page reloads

## Key Features to Highlight to Users

### For Your Marketing
- "Add a professional help center to your website with our Fullscreen Help Page add-on"
- "Give customers a dedicated chatbot experience with conversation history"
- "Fully customizable with your branding - upload logos and custom icons"
- "Modern interface with dark mode support"
- "Only $49/month additional - includes sidebar navigation and session management"

### Technical Selling Points
- No coding required - pure configuration
- Works with any WordPress theme
- Responsive design for all devices
- Secure AJAX communication
- Browser-based session persistence
- Easy to set up in minutes

---

## Need Help?

If you encounter any issues:
1. Check the detailed integration document: `FULLSCREEN_HELP_PAGE_INTEGRATION.md`
2. Verify the fullscreen-chatbot-plugin folder contains all 5 files
3. Ensure you're testing with the latest generated plugin
4. Check browser console for JavaScript errors
5. Verify API key is correctly configured in WordPress

The integration is complete and ready to use! 🎉
