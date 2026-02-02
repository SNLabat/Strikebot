# Fullscreen Help Page Integration

## Overview
The Fullscreen Help Page functionality has been successfully integrated into your Strikebot website builder as an optional add-on. Users can now select whether to include this feature when building their chatbot plugin.

## What Was Changed

### 1. Type Definitions (`src/types/chatbot.ts`)
- **Added new add-on type**: Extended the `AddOn` type to include `'fullscreen_help_page'` as a valid type
- **Added to available add-ons**: Added the Fullscreen Help Page as an available add-on with:
  - ID: `fullscreen-help-page`
  - Name: `Fullscreen Help Page`
  - Description: `Add a dedicated fullscreen chatbot help page with sidebar and chat history`
  - Price: `$49/month`
  - Type: `fullscreen_help_page`

### 2. Plugin Generation (`src/app/api/generate-plugin/route.ts`)
Made several key modifications:

#### a. Conditional File Inclusion
- Added logic to check if the Fullscreen Help Page add-on is selected
- If selected, includes all fullscreen chatbot files from `fullscreen-chatbot-plugin/` folder:
  - `fullscreen-chatbot.php` (main plugin file)
  - `admin-script.js` (admin interface scripts)
  - `chatbot-script.js` (frontend chatbot functionality)
  - `chatbot-style.css` (fullscreen chatbot styling)
  - `chatbot-template.php` (page template)

These files are packaged into the `strikebot/fullscreen/` directory within the generated plugin.

#### b. Main Plugin Class Updates
- **Added property**: `private $fullscreen_chatbot = null;` to store the fullscreen chatbot instance
- **Added initialization logic**: Checks if the add-on is enabled and loads the fullscreen chatbot class
- **Added helper method**: `is_fullscreen_help_page_enabled()` to check add-on status
- **Updated admin menu**: Conditionally adds a "Help Page" submenu under Strikebot when the add-on is active
- **Updated script enqueuing**: Ensures admin scripts load on the fullscreen chatbot settings page

#### c. README Generation
- Updated `generateReadme()` to dynamically include information about active add-ons
- Mentions fullscreen help page in features and installation instructions when enabled

## How It Works

### For Website Builders (Your Users)
1. **Select the Add-on**: In the Strikebot website builder, navigate to the "Add-Ons" section
2. **Enable Fullscreen Help Page**: Click on the "Fullscreen Help Page" add-on card to select it
3. **Configure & Generate**: Complete the rest of the chatbot configuration and generate the plugin
4. **Download & Install**: The generated plugin will include all fullscreen help page functionality

### For WordPress Site Administrators
1. **Install the Plugin**: Upload and activate the generated Strikebot plugin
2. **Configure Main Chatbot**: Set up the widget chatbot through Strikebot > Dashboard
3. **Configure Help Page**: If the add-on was enabled, a new menu item appears: "Strikebot > Help Page"
4. **Help Page Settings**:
   - Set OpenAI API Key (same as main chatbot or different)
   - Choose AI Model (GPT-4o, GPT-3.5 Turbo, etc.)
   - Select which WordPress page should display the fullscreen chatbot
   - Customize system prompt
   - Upload header logo
   - Upload chat icon
5. **Access the Help Page**: Visit the selected WordPress page to see the fullscreen chatbot interface

## File Structure in Generated Plugin

```
strikebot/
├── strikebot.php (main plugin file with conditional loading)
├── assets/
│   ├── css/
│   │   ├── admin.css
│   │   └── widget.css
│   └── js/
│       ├── admin.js
│       └── widget.js
├── templates/
│   ├── admin/
│   │   ├── dashboard.php
│   │   ├── knowledge.php
│   │   ├── appearance.php
│   │   └── settings.php
│   └── widget.php
├── fullscreen/ (only if add-on enabled)
│   ├── fullscreen-chatbot.php
│   ├── admin-script.js
│   ├── chatbot-script.js
│   ├── chatbot-style.css
│   └── chatbot-template.php
├── uninstall.php
└── readme.txt
```

## Features of the Fullscreen Help Page

### User Interface
- **Fullscreen Layout**: Dedicated page with modern, clean design
- **Sidebar Navigation**:
  - New chat button
  - Chat history with previous conversations
  - Conversation management (rename, delete)
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Functionality
- **Chat History**: Maintains conversation history per session
- **Session Management**: Each conversation is stored separately
- **Persistent Settings**: User preferences saved in WordPress database
- **Custom Branding**: Upload custom logos and icons
- **Model Selection**: Choose from various OpenAI models
- **System Prompt Customization**: Define AI personality and behavior

### Technical Details
- Uses WordPress AJAX for real-time communication
- Integrates with OpenAI API
- Stores settings in WordPress options table
- Uses localStorage for client-side session management
- Nonce-based security for all AJAX requests

## Testing the Integration

To verify the integration works correctly:

1. **Build a Plugin with Add-on**:
   - In your Strikebot builder, select the Fullscreen Help Page add-on
   - Generate and download the plugin

2. **Install in WordPress**:
   - Upload the plugin to a test WordPress site
   - Activate the plugin

3. **Verify Files**:
   - Check that `wp-content/plugins/strikebot/fullscreen/` directory exists
   - Confirm all 5 fullscreen files are present

4. **Check Admin Menu**:
   - Navigate to WordPress admin
   - Verify "Strikebot > Help Page" menu item appears

5. **Configure & Test**:
   - Configure the help page settings
   - Select a page for the chatbot
   - Visit that page and test the fullscreen chatbot

## Pricing Recommendation

The add-on is currently set at **$49/month**. Consider this pricing based on:
- Additional development value (dedicated page, chat history, UI enhancements)
- Increased server load (separate page, additional API calls)
- Enhanced user experience (sidebar, dark mode, session management)

You can adjust the price in `src/types/chatbot.ts` by modifying the `AVAILABLE_ADDONS` array.

## Future Enhancements

Potential improvements to consider:
1. **Chat Export**: Allow users to export chat history as PDF or CSV
2. **Multi-language Support**: Internationalization for different languages
3. **Advanced Analytics**: Track usage statistics for the help page
4. **Chat Tags/Categories**: Organize conversations by topics
5. **Search History**: Search through previous conversations
6. **Integration Options**: Connect with ticketing systems or CRM tools
7. **Voice Input**: Add speech-to-text functionality
8. **File Uploads**: Allow users to upload images or documents in chat

## Support & Maintenance

The integration is designed to be maintainable:
- All fullscreen files remain in the separate `fullscreen-chatbot-plugin` folder
- No modifications to core Strikebot functionality
- Easy to update fullscreen features independently
- Clear separation of concerns between widget and fullscreen chatbot

## Troubleshooting

Common issues and solutions:

**Issue**: "Help Page" menu doesn't appear
- **Solution**: Verify the add-on was selected during plugin generation, check that fullscreen files exist in the plugin

**Issue**: Fullscreen page shows regular WordPress theme
- **Solution**: Ensure a page is selected in Help Page settings, verify the template file exists

**Issue**: Chat doesn't work on fullscreen page
- **Solution**: Check API key configuration, verify AJAX URL in browser console, ensure nonce is valid

---

## Summary

The Fullscreen Help Page is now fully integrated as an optional add-on in your Strikebot website builder. Users can choose to include this enhanced chatbot experience when building their plugins, and it will be seamlessly integrated into their WordPress admin interface with dedicated configuration options.

The implementation maintains clean separation between the core Strikebot functionality and the fullscreen add-on, making it easy to maintain and enhance both features independently.
