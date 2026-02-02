# Duplicate Detection Debugging Guide

## New Features Added

To help you understand exactly WHICH URLs are being marked as duplicates and WHY, I've added comprehensive debugging and reporting features.

---

## ✅ Features Implemented

### 1. **Copyable Completion Report**
Instead of a simple alert, you now get a modal with a copyable text report.

**What's Included**:
- Summary statistics (saved, skipped, failed, total)
- Complete list of duplicate URLs with details
- Complete list of errors
- Timestamp of the crawl

**How to Use**:
1. Complete a sitemap crawl
2. Modal appears with full report
3. Click **"Copy to Clipboard"** button
4. Paste into email, text file, or support ticket

### 2. **Detailed Duplicate Information**
Each duplicate now shows:
- The attempted URL
- What it normalized to
- Which existing URL it conflicts with
- The ID of the existing entry

**Example Output**:
```
DUPLICATE URLs (47):
1. https://www.example.com/page/
  → Normalized to: https://example.com/page
  → Conflicts with: https://example.com/page (ID: 123)

2. https://example.com/contact?utm_source=google
  → Normalized to: https://example.com/contact
  → Conflicts with: https://example.com/contact (ID: 456)
```

### 3. **Enhanced Console Logging**
The browser console now shows detailed information during the crawl:

**Pre-Crawl Detection**:
```
🔍 Pre-crawl Duplicate Detection
   Found 15 duplicate URLs in sitemap:
   1. https://www.example.com/page/
      Normalized: https://example.com/page
      Conflicts with: https://example.com/page
   ...
```

**Crawl Progress**:
```
📋 URLs to Crawl (53 total)
1. https://example.com/page → https://example.com/page
2. https://example.com/about → https://example.com/about
...

🔄 Crawling URL 1/53: https://example.com/page
✓ Successfully saved: https://example.com/page

🔄 Crawling URL 2/53: https://example.com/about
❌ DUPLICATE: https://example.com/about
   Debug info: {...}
```

---

## How to Debug Duplicate Issues

### Step 1: Check Pre-Crawl Detection

**Look for the yellow warning box** when sitemap loads:
```
✨ Note: Found 47 duplicate URLs in sitemap (already filtered out).
   Showing 53 unique URLs.
```

This means 47 URLs were **already filtered** before crawling started. These are legitimate duplicates from the sitemap itself.

### Step 2: Open Browser Console

1. Press **F12** (or Cmd+Option+I on Mac)
2. Click **Console** tab
3. Look for the groups:
   - 🔍 Pre-crawl Duplicate Detection
   - 📋 URLs to Crawl

**Verify**:
- Are the URLs actually the same after normalization?
- Do they SHOULD be considered duplicates?

### Step 3: Watch Crawl Progress

As URLs are crawled, watch for:
- ✓ Successfully saved (good)
- ❌ DUPLICATE (needs investigation)

### Step 4: Review Final Report

When crawl completes:
1. Modal appears with full report
2. Click **"Copy to Clipboard"**
3. Paste into text editor
4. Review the DUPLICATE URLs section

**Look for**:
- Which URLs are being marked as duplicates
- What they normalize to
- Which existing URL they conflict with

---

## Common Scenarios

### Scenario 1: Sitemap Contains Actual Duplicates

**Example**:
```
Sitemap URLs:
- https://example.com/page
- https://www.example.com/page
- https://example.com/page/
```

**Normalization**:
All three normalize to: `https://example.com/page`

**Result**: ✅ **Correct behavior** - Only first URL is crawled

**Fix**: Clean up your sitemap to remove duplicates

---

### Scenario 2: Query Parameters Being Ignored

**Example**:
```
Sitemap URLs:
- https://example.com/page?lang=en
- https://example.com/page?lang=fr
- https://example.com/page?lang=es
```

**Normalization**:
All three normalize to: `https://example.com/page`

**Result**: ⚠️ **Expected behavior** - Query params are ignored by default

**Why**: Query parameters often don't create unique content (tracking codes, session IDs, etc.)

**If you need these as separate pages**:
You'll need to modify the normalization to include query parameters (see Customization section below)

---

### Scenario 3: Case Sensitivity

**Example**:
```
Sitemap URLs:
- https://example.com/Products
- https://example.com/products
- https://example.com/PRODUCTS
```

**Normalization**:
All three normalize to: `https://example.com/products`

**Result**: ✅ **Correct behavior** - URLs are case-insensitive

**Fix**: Ensure your sitemap uses consistent capitalization

---

### Scenario 4: False Positives (Actually Different Pages)

**Example**:
```
Sitemap URLs:
- https://example.com/page
- https://example.com/page2
```

**Normalization**:
- `https://example.com/page`
- `https://example.com/page2`

**Result**: ✅ **These should NOT be duplicates**

**If they ARE being marked as duplicates**:
This is a bug! Use the copyable report and console logs to investigate.

---

## Using the Console Logs

### Finding Specific URL Information

**Search in Console**:
1. Open Console (F12)
2. Use Ctrl+F (Cmd+F on Mac) to search
3. Search for the specific URL you're investigating

**Example Search**:
```
Search: "/contact"
```

You'll see all console entries for URLs containing "/contact"

### Export Console Logs

**Method 1: Right-click → Save as...**
1. Right-click in console
2. Select "Save as..."
3. Saves all console output to file

**Method 2: Copy/paste**
1. Right-click in console
2. Select "Select all"
3. Copy (Ctrl+C)
4. Paste into text editor

---

## Interpreting the Report

### Understanding the Report Sections

#### SUMMARY Section
```
SUMMARY:
  Saved: 53
  Skipped (duplicates): 47
  Failed: 0
  Total: 100
```

**Questions to Ask**:
- Does `Saved + Skipped + Failed = Total`?
- Is the number of duplicates reasonable?
- Are there any failures?

#### DUPLICATE URLs Section
```
DUPLICATE URLs (47):
1. https://www.example.com/page/
  → Normalized to: https://example.com/page
  → Conflicts with: https://example.com/page (ID: 123)
```

**What This Means**:
- Attempted URL: `https://www.example.com/page/`
- After normalization: `https://example.com/page`
- Already exists in database: Entry #123 with URL `https://example.com/page`

**Action**:
- ✅ If they're truly the same page → This is correct
- ❌ If they're different pages → Investigation needed

---

## Troubleshooting

### Problem: Half of URLs Marked as Duplicates

**Check**:
1. Open Console logs
2. Look at "📋 URLs to Crawl" section
3. Are many URLs normalizing to the same value?

**Example Issue**:
```
1. https://example.com/page → https://example.com/page
2. https://www.example.com/page → https://example.com/page  ← Same!
3. https://example.com/page/ → https://example.com/page    ← Same!
```

**Solution**: Your sitemap contains many variations of the same URLs

**How to Fix**:
- Clean up sitemap generation
- Use canonical URLs only
- Remove www/non-www duplicates
- Remove trailing slashes
- Remove unnecessary query parameters

### Problem: Legitimately Different Pages Marked as Duplicates

**Check Console**:
```
❌ DUPLICATE: https://example.com/page-special
   Normalized: https://example.com/page
   Conflicts with: https://example.com/page
```

**If these ARE different pages**, there's a normalization bug.

**Debug Steps**:
1. Copy the full report
2. Find the duplicate entry
3. Check what both URLs normalize to
4. Verify they should be different

**Contact Support With**:
- The specific URLs
- The copyable report
- Console logs
- Screenshots

---

## Customization

If you need to change how URLs are normalized (e.g., to include query parameters):

### Modify JavaScript Normalization

**File**: `src/lib/plugin-template/assets/js/admin.js`

**Function**: `normalizeUrl(url)`

**Example - Include Query Parameters**:
```javascript
function normalizeUrl(url) {
    if (!url) return '';

    try {
        const urlObj = new URL(url);
        let host = urlObj.hostname.toLowerCase();
        if (host.startsWith('www.')) {
            host = host.substring(4);
        }
        let path = urlObj.pathname;
        if (path.endsWith('/') && path.length > 1) {
            path = path.slice(0, -1);
        }

        // CHANGE: Include query parameters
        let query = urlObj.search;  // Add this line

        const normalized = urlObj.protocol + '//' + host + path + query; // Add query here
        return normalized.toLowerCase();
    } catch (e) {
        return url.toLowerCase().replace(/\/$/, '').replace(/^www\./, '');
    }
}
```

### Modify PHP Normalization

**File**: `src/lib/plugin-template/strikebot.php`

**Function**: `normalize_url($url)`

**Make the SAME changes** to keep JavaScript and PHP in sync!

---

## Best Practices

### Before Crawling
1. ✅ Check sitemap quality
2. ✅ Open browser console
3. ✅ Review pre-crawl duplicate detection
4. ✅ Verify URLs look correct

### During Crawling
1. ✅ Watch console for duplicates
2. ✅ Look for patterns in duplicate URLs
3. ✅ Stop crawl if issues detected

### After Crawling
1. ✅ Copy the completion report
2. ✅ Save for documentation
3. ✅ Review duplicate list
4. ✅ Investigate any unexpected duplicates

---

## Example: Full Debug Session

### Step 1: Load Sitemap
```
Sitemap URL: https://example.com/sitemap.xml
```

**Result**:
```
✨ Note: Found 47 duplicate URLs in sitemap (already filtered out).
   Showing 53 unique URLs.
```

### Step 2: Check Console
```
🔍 Pre-crawl Duplicate Detection
Found 47 duplicate URLs in sitemap:
1. https://www.example.com/about/
   Normalized: https://example.com/about
   Conflicts with: https://example.com/about
...
```

**Analysis**: Sitemap has www + trailing slash duplicates

### Step 3: Start Crawl
```
📋 URLs to Crawl (53 total)
1. https://example.com/about → https://example.com/about
2. https://example.com/contact → https://example.com/contact
...
```

### Step 4: Monitor Progress
```
🔄 Crawling URL 1/53: https://example.com/about
✓ Successfully saved: https://example.com/about

🔄 Crawling URL 2/53: https://example.com/contact
✓ Successfully saved: https://example.com/contact
```

### Step 5: Review Report
```
CRAWL COMPLETE REPORT
============================================================

SUMMARY:
  Saved: 53
  Skipped (duplicates): 0
  Failed: 0
  Total: 53
```

**Result**: ✅ **Perfect!** All unique URLs saved, no duplicates during crawl

---

## Support Information

If you're still seeing unexpected duplicates after reviewing:

**Provide**:
1. ✅ Copyable completion report
2. ✅ Console logs (save as file)
3. ✅ Example URLs that are incorrectly marked as duplicates
4. ✅ What you expected vs. what happened

**Where to Send**:
- Use the "Copy to Clipboard" button in the report modal
- Save console logs to file
- Paste into support email/ticket

---

## Summary

✅ **New Debugging Features**:
- Copyable completion report modal
- Detailed duplicate information
- Enhanced console logging
- Pre-crawl duplicate detection
- URL normalization preview

✅ **How to Use**:
1. Open browser console (F12)
2. Watch for duplicate detection messages
3. Review completion report
4. Copy report for analysis
5. Investigate any unexpected duplicates

✅ **What to Look For**:
- Are duplicates legitimate? (www, trailing slashes, query params)
- Are different pages being incorrectly marked as duplicates?
- What do URLs normalize to?

The enhanced debugging features should help you identify exactly what's happening with your sitemap crawl!

---

**Implementation Date**: February 2, 2026
**Version**: Strikebot v1.7.1
**Feature Status**: ✅ Complete
