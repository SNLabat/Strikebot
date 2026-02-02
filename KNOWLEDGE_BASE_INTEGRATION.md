# Knowledge Base Integration: Fullscreen & Widget Chatbots

## Overview
The fullscreen help page chatbot now shares the same knowledge base as the main Strikebot widget. This means you only need to train your chatbot once, and both interfaces will have access to the same information.

## What Changed

### Before Integration ❌
- **Widget Chatbot**: Had access to knowledge base (sitemaps, URLs, files, text, Q&A)
- **Fullscreen Chatbot**: Used only basic system prompt, no knowledge base access
- **Problem**: Two separate systems, had to train twice

### After Integration ✅
- **Widget Chatbot**: Still has full knowledge base access
- **Fullscreen Chatbot**: Now shares the same knowledge base!
- **Benefit**: Train once, both chatbots benefit

---

## How It Works

### Knowledge Base Location
Both chatbots now read from the same WordPress database table:
```
wp_strikebot_knowledge
```

This table contains all the training data you add via:
- **Strikebot → Knowledge Base**
  - Text snippets
  - Q&A pairs
  - Uploaded files
  - Website URLs
  - Sitemap crawls

### Technical Implementation

#### 1. Get Knowledge Context
When a user sends a message to the fullscreen chatbot, it now:
```php
private function get_knowledge_context($query) {
    global $wpdb;
    $table = $wpdb->prefix . 'strikebot_knowledge';

    // Check if table exists
    // Retrieve all knowledge items
    // Format and prioritize by type
    // Build context string

    return $context;
}
```

#### 2. Build Enhanced System Prompt
The knowledge context is integrated into the system prompt:
```php
private function build_system_prompt($base_prompt, $knowledge_context) {
    $prompt = $base_prompt;

    if (!empty($knowledge_context)) {
        $prompt .= "\n\nYou have access to the following knowledge base...";
        $prompt .= $knowledge_context;
    }

    return $prompt;
}
```

#### 3. Process Messages
```php
public function handle_chatbot_message() {
    // Get user message
    // Get knowledge context
    // Build enhanced system prompt
    // Send to OpenAI API with context
}
```

---

## Knowledge Base Priority

Both chatbots use the same priority order for knowledge items:

| Priority | Type | Max Per Item | Use Case |
|----------|------|--------------|----------|
| 1️⃣ Highest | Q&A | 5,000 chars | Direct questions & answers |
| 2️⃣ High | Text | 5,000 chars | General information snippets |
| 3️⃣ Medium | File | 20,000 chars | Uploaded documents |
| 4️⃣ Low | URL | 3,000 chars | Crawled web pages |

**Total Context Limit**: 100,000 characters (shared across all items)

---

## Benefits

### For Site Administrators
- ✅ **Train once, use everywhere**: Add knowledge in one place
- ✅ **Consistent answers**: Both chatbots give the same information
- ✅ **Single source of truth**: No duplicate knowledge bases
- ✅ **Easier maintenance**: Update knowledge in one location

### For End Users
- ✅ **Consistent experience**: Same answers on widget or fullscreen
- ✅ **More helpful**: Fullscreen chatbot now knows your business
- ✅ **Better accuracy**: Access to full knowledge base

### For Performance
- ✅ **Shared database**: No duplicate storage
- ✅ **Efficient queries**: Same optimized query structure
- ✅ **Smart prioritization**: Q&A first, URLs last

---

## Usage Example

### Scenario: Adding Product Information

**Step 1: Add Knowledge**
```
Go to: Strikebot → Knowledge Base
Add Text: "Our business hours are Monday-Friday 9am-5pm EST"
Save
```

**Step 2: Test Widget**
```
User: "What are your hours?"
Widget Bot: "Our business hours are Monday-Friday 9am-5pm EST"
✅ Works!
```

**Step 3: Test Fullscreen**
```
User: "What are your hours?"
Fullscreen Bot: "Our business hours are Monday-Friday 9am-5pm EST"
✅ Also works!
```

---

## Compatibility Check

The fullscreen chatbot gracefully handles cases where Strikebot might not be installed:

```php
// Check if table exists
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table;
if (!$table_exists) {
    return ''; // No knowledge base, use basic prompt only
}
```

**This means**:
- ✅ Fullscreen chatbot works standalone (without Strikebot)
- ✅ When Strikebot is installed, it shares knowledge automatically
- ✅ No errors if knowledge base is empty

---

## Testing the Integration

### Test 1: Add Knowledge Base Item
1. Go to **Strikebot → Knowledge Base**
2. Add a text snippet: "Our return policy is 30 days"
3. Save

### Test 2: Test Widget Chatbot
1. Open your website with the widget
2. Ask: "What's your return policy?"
3. Verify: Should mention "30 days"

### Test 3: Test Fullscreen Chatbot
1. Open the fullscreen chatbot page
2. Ask: "What's your return policy?"
3. Verify: Should also mention "30 days"

### Test 4: Update Knowledge
1. Go back to **Strikebot → Knowledge Base**
2. Update the text to: "Our return policy is 60 days"
3. Save

### Test 5: Verify Both Updated
1. Ask both chatbots again
2. Both should now say "60 days"
3. ✅ Confirms they're sharing the same knowledge base!

---

## Knowledge Base Types Supported

Both chatbots now support all knowledge base types:

### 1. Text Snippets
```
Type: text
Example: "Company info: Founded in 2020..."
Use: General information
```

### 2. Q&A Pairs
```
Type: qa
Example: Q: "Do you ship internationally?" A: "Yes, worldwide!"
Use: Frequently asked questions
```

### 3. File Uploads
```
Type: file
Example: product_catalog.pdf
Use: Documents, PDFs, text files
```

### 4. Website URLs
```
Type: url
Example: https://yoursite.com/about
Use: Existing web pages
```

### 5. Sitemap Crawls
```
Type: url (with sitemap metadata)
Example: All pages from sitemap.xml
Use: Bulk website content
```

---

## Context Building

### How Context is Built
1. **Retrieve all items** from knowledge base
2. **Sort by priority** (Q&A first, URLs last)
3. **Format with labels** (e.g., "[Q&A]", "[From webpage: ...]")
4. **Truncate if needed** (respects per-item limits)
5. **Build single string** (up to 100,000 chars)
6. **Include in prompt** ("You have access to the following knowledge base...")

### Example Context Structure
```
---
[Q&A]
Q: Do you ship internationally?
A: Yes, we ship worldwide!

---
[Information: Company Hours]
Our business hours are Monday-Friday 9am-5pm EST

---
[From webpage: https://example.com/about]
We are a family-owned business founded in 2020...

---
[From document: product_catalog.pdf]
Product 1: Widget Pro - $99.99
Features: Fast, reliable, easy to use...
```

---

## Performance Considerations

### Database Query
- Single query retrieves all items
- Sorted in database for efficiency
- Uses indexed columns (type, created_at)

### Context Size
- Maximum 100,000 characters total
- Prevents token limit issues with API
- Prioritizes most relevant content

### Caching
- Knowledge is fetched fresh each request
- Ensures up-to-date answers
- No stale data

---

## Troubleshooting

### Knowledge Base Not Working?

**Issue**: Chatbot doesn't use knowledge base

**Check**:
1. ✅ Strikebot plugin activated?
2. ✅ Knowledge base has items?
3. ✅ Items have content (not empty)?
4. ✅ Database table exists?

**Debug**:
```php
// Check WordPress debug.log for this message:
Fullscreen Chatbot: Built context with X items, Y characters
```

### Different Answers from Widget vs Fullscreen?

**Possible Causes**:
1. Different system prompts configured
2. Different API keys (pointing to different models)
3. Browser cache (try hard refresh)

**Solution**:
1. Check both chatbot settings
2. Verify API keys match
3. Test in incognito mode

### Empty Responses?

**Possible Causes**:
1. Knowledge base empty
2. API key not configured
3. Model not accessible

**Solution**:
1. Add at least one knowledge item
2. Verify API key in settings
3. Check API key has access to selected model

---

## Future Enhancements

Consider these potential improvements:

1. **Semantic Search**: Rank knowledge items by relevance to query
2. **Caching**: Cache knowledge context for better performance
3. **Analytics**: Track which knowledge items are most useful
4. **Selective Sharing**: Choose which items to share with fullscreen
5. **Knowledge Preview**: Show what the chatbot "knows" in admin
6. **Auto-Update**: Webhook to refresh knowledge automatically

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Knowledge Base | Widget only | Widget + Fullscreen ✅ |
| Training Required | Twice | Once ✅ |
| Answer Consistency | Different | Same ✅ |
| Maintenance | Two systems | One system ✅ |
| Performance | Good | Same ✅ |

**Status**: ✅ Fully Integrated
**Files Changed**: `fullscreen-chatbot.php` (added 2 methods)
**Database**: Shared `wp_strikebot_knowledge` table
**Testing**: Recommended after each knowledge update

---

The integration is complete and both chatbots now work as a unified system while maintaining their unique interfaces! 🎉
