# Google Sheets Schema

## Overview

Each client gets their own Google Sheet. The Sheet ID is stored in `clients/{client-id}.json`.

## Sheet: Leads

Main sheet containing all lead data.

### Columns

| Column | Header | Type | Source | Description |
|--------|--------|------|--------|-------------|
| A | id | String | Auto | Unique ID (format: `LD-{timestamp}-{random}`) |
| B | client_id | String | Config | Client identifier (e.g., `rosalyn-mero`) |
| C | date_found | DateTime | Scraper | When lead was scraped |
| D | address | String | Scraper | Full property address |
| E | city | String | Scraper | City |
| F | state | String | Scraper | State (2-letter) |
| G | zip | String | Scraper | Zip code |
| H | price | Number | Scraper | Asking price |
| I | beds | Number | Scraper | Bedrooms |
| J | baths | Number | Scraper | Bathrooms |
| K | sqft | Number | Scraper | Square footage |
| L | phone | String | Scraper | Owner phone number |
| M | listing_url | URL | Scraper | Zillow listing URL |
| N | source | String | Scraper | Lead source (e.g., `zillow_fsbo`) |
| O | status | String | Workflow | Lead status (see values below) |
| P | call_attempts | Number | Workflow | Number of call attempts |
| Q | last_call_date | DateTime | Workflow | Last call attempt timestamp |
| R | call_duration | Number | Vapi | Call duration in seconds |
| S | owner_confirmed | Boolean | Vapi | Was property owner reached? |
| T | qualified | Boolean | Vapi | Meets qualification criteria? |
| U | timeline | String | Vapi | Selling timeline |
| V | reason_selling | String | Vapi | Why selling FSBO |
| W | open_to_agent | String | Vapi | Open to agent help? |
| X | objections | String | Vapi | Objections raised |
| Y | call_summary | String | Vapi | AI-generated call summary |
| Z | appointment_booked | Boolean | Vapi | Was appointment scheduled? |
| AA | appointment_date | DateTime | Vapi | Scheduled appointment time |
| AB | appointment_type | String | Vapi | phone / in_person |
| AC | callback_requested | Boolean | Vapi | Asked to be called back? |
| AD | callback_date | DateTime | Vapi | Requested callback time |
| AE | do_not_contact | Boolean | Vapi/Manual | On DNC list? |
| AF | dnc_reason | String | Vapi/Manual | Reason for DNC |
| AG | dnc_date | DateTime | Vapi/Manual | When added to DNC |
| AH | lead_score | Number | Workflow | Calculated priority score (1-100) |
| AI | listing_status | String | Scraper | Active/Pending/Sold/Removed |
| AJ | last_verified | DateTime | Scraper | Last verification date |
| AK | recording_url | URL | Vapi | Call recording link |
| AL | vapi_call_id | String | Vapi | Vapi call identifier |
| AM | notes | String | Manual | Misc notes |
| AN | created_at | DateTime | Auto | Row creation timestamp |
| AO | updated_at | DateTime | Auto | Last update timestamp |

### Status Values

| Status | Description |
|--------|-------------|
| `new` | Just scraped, not yet called |
| `queued` | In queue for calling |
| `calling` | Call in progress |
| `connected` | Call connected, processing results |
| `no_answer` | No answer, will retry |
| `voicemail` | Voicemail left |
| `qualified` | Qualified, appointment booked or pending |
| `not_interested` | Not interested in agent help |
| `bad_number` | Invalid phone number |
| `dnc` | Do not contact |
| `max_attempts` | Max retry attempts reached |
| `archived` | Old/stale lead |

### Timeline Values

| Value | Description |
|-------|-------------|
| `30_days` | Selling within 30 days |
| `90_days` | Selling within 90 days |
| `flexible` | No specific timeline |
| `not_selling` | Not actively selling |
| `unknown` | Could not determine |

### Open to Agent Values

| Value | Description |
|-------|-------------|
| `yes` | Open to working with agent |
| `no` | Not open to agent |
| `maybe` | Considering it |
| `unknown` | Could not determine |

---

## Sheet: Call Log

Optional - detailed call history (one row per call attempt).

| Column | Header | Type | Description |
|--------|--------|------|-------------|
| A | call_id | String | Unique call ID |
| B | lead_id | String | Reference to Leads sheet |
| C | call_date | DateTime | When call was made |
| D | duration | Number | Duration in seconds |
| E | outcome | String | connected/no_answer/voicemail/failed |
| F | recording_url | URL | Call recording |
| G | transcript | String | Full transcript (if stored) |
| H | summary | String | AI summary |
| I | vapi_call_id | String | Vapi identifier |

---

## Sheet: Appointments

Optional - separate tracking of booked appointments.

| Column | Header | Type | Description |
|--------|--------|------|-------------|
| A | appointment_id | String | Unique ID |
| B | lead_id | String | Reference to Leads sheet |
| C | scheduled_date | DateTime | Appointment date/time |
| D | type | String | phone/in_person |
| E | status | String | scheduled/completed/cancelled/no_show |
| F | calendar_event_id | String | Google Calendar event ID |
| G | outcome | String | Result of appointment |
| H | notes | String | Notes from agent |

---

## Data Validation Rules

### Phone Number (Column L)
- Format: 10 digits or formatted (xxx-xxx-xxxx)
- Validation: `=REGEXMATCH(L2, "^\d{10}$|^\d{3}-\d{3}-\d{4}$")`

### Status (Column O)
- Dropdown: new, queued, calling, connected, no_answer, voicemail, qualified, not_interested, bad_number, dnc, max_attempts, archived

### Boolean Columns (S, T, Z, AC, AE)
- Dropdown: TRUE, FALSE

### Price (Column H)
- Number >= 0
- Format: Currency

---

## Formulas

### Lead Score (Column AH)
```
=50
+ IF(H2>=500000, 20, IF(H2>=300000, 10, 0))
+ IF(I2>=4, 10, 0)
+ IF(K2>=2000, 10, 0)
+ IF(DAYS(TODAY(), C2)<=7, 10, IF(DAYS(TODAY(), C2)<=14, 5, 0))
```

### Updated At (Column AO)
Set via n8n workflow on every update.

---

## Initial Setup

1. Create new Google Sheet
2. Rename first sheet to "Leads"
3. Add header row with all column names
4. Apply data validation rules
5. Freeze header row
6. Add conditional formatting:
   - Green: status = "qualified"
   - Yellow: status = "no_answer" or "voicemail"
   - Red: status = "dnc" or "bad_number"
7. Copy Sheet ID to `clients/{client-id}.json`

---

## Sheet ID Location

After creating the sheet, the ID is in the URL:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
```

Copy `{SHEET_ID}` to client config:
```json
{
  "google": {
    "sheets_id": "{SHEET_ID}",
    "calendar_id": ""
  }
}
```
