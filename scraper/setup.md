# Browse AI Scraper Setup

## Overview

Browse AI scrapes Zillow FSBO listings for the target area and outputs to Google Sheets.

## Prerequisites

- Browse AI account ($49/mo starter plan)
- Google account with Sheets access

## Setup Steps

### 1. Create Robot

1. Go to [Browse AI](https://browse.ai)
2. Click "Create Robot"
3. Select "Extract data from a page"

### 2. Configure Target URL

**Zillow FSBO URL pattern:**
```
https://www.zillow.com/morris-county-nj/fsbo/
```

For specific zip codes:
```
https://www.zillow.com/homes/fsbo/{ZIPCODE}_rb/
```

Example for Morris County zips:
- https://www.zillow.com/homes/fsbo/07960_rb/
- https://www.zillow.com/homes/fsbo/07950_rb/
- https://www.zillow.com/homes/fsbo/07940_rb/

### 3. Train the Robot

Select these elements on the page:

| Field | Selector Hint | Notes |
|-------|---------------|-------|
| address | Property card title/address | Full street address |
| city | Part of address or separate | May need parsing |
| zip | Part of address | 5-digit zip |
| price | Price element | Remove $ and commas |
| beds | Beds count | Number only |
| baths | Baths count | Number only |
| sqft | Square feet | Number only |
| phone | Contact/phone element | If visible on listing |
| listing_url | Property link | Full URL to listing |

### 4. Handle Pagination

- Enable "Capture multiple pages"
- Set pagination selector (Next button)
- Limit to reasonable page count (5-10 pages)

### 5. Output to Google Sheets

1. In robot settings → Integrations
2. Add Google Sheets integration
3. Authorize your Google account
4. Select target sheet (from client config)
5. Map fields to columns:

| Browse AI Field | Sheet Column |
|-----------------|--------------|
| address | D (address) |
| city | E (city) |
| zip | G (zip) |
| price | H (price) |
| beds | I (beds) |
| baths | J (baths) |
| sqft | K (sqft) |
| phone | L (phone) |
| listing_url | M (listing_url) |

**Auto-fill these:**
- client_id: Set as constant from config
- date_found: Current timestamp
- source: "zillow_fsbo"
- status: "new"
- state: "NJ" (or from config)

### 6. Schedule

- **Frequency:** Daily
- **Time:** Early morning (6am ET) before calling hours
- **Days:** Every day (leads scraped daily, calls Mon-Sat)

### 7. Deduplication

Configure dedup by address:
- If address already exists in sheet → Skip
- Browse AI may have built-in dedup, or handle in n8n

## Robot Settings

```json
{
  "name": "Zillow FSBO - Morris County",
  "schedule": "0 6 * * *",
  "captureMultiplePages": true,
  "maxPages": 10,
  "outputIntegration": "google_sheets",
  "deduplication": {
    "enabled": true,
    "field": "address"
  }
}
```

## Monitoring

- Check Browse AI dashboard for run history
- Set up failure alerts (email)
- Review captured data quality weekly

## Troubleshooting

### No results
- Zillow may have changed HTML structure
- Check if FSBO listings exist in target area
- Verify selectors still match

### Missing phone numbers
- Some FSBO listings hide phone behind contact form
- May need to click "Contact" to reveal
- Consider skip-trace as backup

### Blocked/rate limited
- Reduce frequency
- Browse AI handles most anti-bot measures
- Contact Browse AI support if persistent

## Notes

- Robot ID stored in `.env` as `BROWSE_AI_ROBOT_ID`
- Each client may need separate robot OR filter by zip in n8n
- Phone number availability varies by listing

## Next Steps

After scraper is running:
1. Verify data appears in Google Sheet
2. Check phone number capture rate
3. Set up n8n trigger on new rows
