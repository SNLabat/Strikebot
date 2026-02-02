# Hide Widget Feature

## Overview
Added a "Temporarily Hide Widget" option in the Appearance settings that allows WordPress admins to hide the chat widget from their website without deactivating the plugin.

## Use Cases
- **Maintenance**: Hide the widget during site maintenance
- **Testing**: Test site functionality without the widget visible
- **Temporary Disable**: Quick on/off toggle without losing configuration
- **Seasonal Control**: Hide during specific events or time periods
- **Gradual Rollout**: Keep plugin active but widget hidden during setup

## How It Works

### User Interface
Located in: **WordPress Admin → Strikebot → Appearance → Widget Settings**

A checkbox appears below the Widget Position selector:
```
☐ Temporarily hide chat widget from website
   Check this to hide the chat widget without deactivating the plugin.
   Useful for maintenance or testing.
```

### Backend Behavior
When the checkbox is checked:
1. Setting is saved to `strikebot_settings['widget']['hideWidget'] = '1'`
2. Widget scripts (CSS/JS) are NOT enqueued on frontend
3. Widget HTML is NOT rendered on frontend
4. All other plugin functionality remains active:
   - Admin dashboard accessible
   - Knowledge base intact
   - Settings preserved
   - AJAX handlers still registered (but won't be called)

### Code Changes

#### 1. Template Update (`templates/admin/appearance.php`)
Added checkbox in the Widget Settings section:
```php
<div class="strikebot-form-group">
    <label>
        <input type="checkbox" name="widget[hideWidget]" value="1" <?php checked(!empty($widget['hideWidget'])); ?>>
        <span style="font-weight: normal;">Temporarily hide chat widget from website</span>
    </label>
    <p class="description" style="margin-left: 24px;">...</p>
</div>
```

#### 2. Save Settings Handler
Updated `save_settings()` method:
```php
if (isset($_POST['widget'])) {
    $widget_settings = $_POST['widget'];
    // Handle hideWidget checkbox specially since it won't be in POST if unchecked
    $widget_settings['hideWidget'] = isset($widget_settings['hideWidget']) ? '1' : '0';
    $settings['widget'] = array_map('sanitize_text_field', $widget_settings);
}
```

**Important**: Checkboxes don't send a value when unchecked, so we explicitly set it to '0' when not present.

#### 3. Frontend Scripts
Updated `frontend_scripts()` method:
```php
public function frontend_scripts() {
    $settings = get_option('strikebot_settings');
    $widget = $settings['widget'] ?? array();

    // Don't load scripts if widget is hidden
    if (!empty($widget['hideWidget']) && $widget['hideWidget'] === '1') {
        return;
    }

    wp_enqueue_style('strikebot-widget', ...);
    wp_enqueue_script('strikebot-widget', ...);
    // ...
}
```

#### 4. Widget Rendering
Updated `render_widget()` method:
```php
public function render_widget() {
    $settings = get_option('strikebot_settings');
    $widget = $settings['widget'] ?? array();

    // Don't render widget if it's hidden
    if (!empty($widget['hideWidget']) && $widget['hideWidget'] === '1') {
        return;
    }

    include STRIKEBOT_PLUGIN_DIR . 'templates/widget.php';
}
```

## Testing Checklist

### Test 1: Hide Widget
- [ ] Go to Strikebot → Appearance
- [ ] Check "Temporarily hide chat widget"
- [ ] Click "Save Changes"
- [ ] Visit frontend - widget should NOT appear
- [ ] Check page source - no widget HTML or scripts

### Test 2: Show Widget Again
- [ ] Go to Strikebot → Appearance
- [ ] Uncheck "Temporarily hide chat widget"
- [ ] Click "Save Changes"
- [ ] Visit frontend - widget should appear normally
- [ ] Test widget functionality - should work as expected

### Test 3: Setting Persistence
- [ ] Hide the widget and save
- [ ] Refresh the Appearance page
- [ ] Checkbox should still be checked
- [ ] Show the widget and save
- [ ] Refresh the Appearance page
- [ ] Checkbox should be unchecked

### Test 4: Other Settings Unaffected
- [ ] Hide the widget
- [ ] Change widget position (left/right)
- [ ] Change colors
- [ ] Change messages
- [ ] Save and show widget again
- [ ] All other settings should be preserved

### Test 5: Admin Access
- [ ] Hide the widget
- [ ] Verify admin dashboard still accessible
- [ ] Verify knowledge base still works
- [ ] Verify all settings pages load
- [ ] Verify analytics still track (if any frontend events occurred)

## User Documentation

### For Your Users (WordPress Admins)

**To Hide the Chat Widget:**
1. Log in to WordPress admin
2. Go to **Strikebot → Appearance**
3. Scroll to **Widget Settings**
4. Check the box: "Temporarily hide chat widget from website"
5. Click **Save Changes**
6. The widget will no longer appear on your website

**To Show the Widget Again:**
1. Go to **Strikebot → Appearance**
2. Uncheck the box: "Temporarily hide chat widget from website"
3. Click **Save Changes**
4. The widget will reappear on your website

**Note**: Hiding the widget does not delete any data or settings. All your configuration, knowledge base, and chat history remain intact.

## Benefits

### For Site Administrators
- **Quick Toggle**: Enable/disable widget instantly
- **No Data Loss**: All settings and data remain intact
- **No Reactivation**: Avoid deactivation/reactivation hassle
- **Flexible Control**: Show/hide based on needs

### For Site Performance
- **Zero Overhead When Hidden**: No scripts or styles loaded
- **Clean Source Code**: No HTML bloat when hidden
- **Reduced HTTP Requests**: Fewer assets loaded
- **Better Page Speed**: Slight improvement when hidden

### For Development/Testing
- **Easy Testing**: Toggle widget during development
- **Debug Mode**: Hide widget to test other features
- **Client Review**: Show site without widget if needed
- **Staging Sites**: Keep widget hidden on staging

## Technical Notes

### Setting Storage
Stored in WordPress options table:
```php
wp_options
├── option_name: strikebot_settings
└── option_value: [serialized array]
    └── widget
        └── hideWidget: '0' or '1'
```

### Default Value
If not set, widget is shown (default behavior):
```php
// Widget is visible by default
if (!empty($widget['hideWidget']) && $widget['hideWidget'] === '1') {
    // Only hidden if explicitly set to '1'
}
```

### Performance Impact
When widget is hidden:
- **Saves ~2-3 HTTP requests** (CSS and JS files)
- **Saves ~20-50 KB** (stylesheet + script size)
- **Reduces DOM nodes** (no widget HTML)
- **No AJAX calls** (widget not initialized)

### Compatibility
- **WordPress**: 5.0+
- **PHP**: 7.4+
- **Themes**: Compatible with all themes
- **Plugins**: No known conflicts

## Future Enhancements

Potential improvements:
1. **Schedule Hide/Show**: Use WP-Cron to auto-hide/show at specific times
2. **Conditional Display**: Hide on specific pages/posts
3. **User Role Visibility**: Show only to certain user roles
4. **Device Targeting**: Hide on mobile, show on desktop (or vice versa)
5. **Visual Indicator**: Show admin bar notice when widget is hidden
6. **Quick Toggle**: Add admin bar quick toggle button
7. **Hide History**: Log when widget was hidden/shown
8. **Notification**: Email admin when widget hidden for X days

## Admin Bar Notification (Optional Enhancement)

Consider adding a visual indicator in the WordPress admin bar when the widget is hidden:

```php
add_action('admin_bar_menu', 'strikebot_admin_bar_notice', 999);

function strikebot_admin_bar_notice($wp_admin_bar) {
    if (!current_user_can('manage_options')) return;

    $settings = get_option('strikebot_settings');
    $widget = $settings['widget'] ?? array();

    if (!empty($widget['hideWidget']) && $widget['hideWidget'] === '1') {
        $wp_admin_bar->add_node(array(
            'id' => 'strikebot-hidden-notice',
            'title' => '<span style="color: #ff9800;">⚠ Strikebot Widget Hidden</span>',
            'href' => admin_url('admin.php?page=strikebot-appearance'),
            'meta' => array(
                'title' => 'Click to show widget',
                'class' => 'strikebot-hidden-notice'
            )
        ));
    }
}
```

This would show a warning icon in the admin bar when the widget is hidden, reminding admins that visitors can't see it.

## Summary

The "Hide Widget" feature provides a simple, safe way for WordPress admins to temporarily disable the chat widget without affecting the rest of the plugin. It's perfect for maintenance, testing, or any situation where the widget needs to be temporarily invisible.

The implementation is clean, performant, and follows WordPress best practices:
- ✅ Proper sanitization
- ✅ Setting persistence
- ✅ No data loss
- ✅ Zero overhead when hidden
- ✅ Easy to use
- ✅ Backward compatible

---

**Status**: ✅ Implemented and ready to use
**Version**: 1.0.0
**Location**: Strikebot → Appearance → Widget Settings
