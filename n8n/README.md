# n8n Workflows

## Overview

Two workflows handle the lead calling automation:

1. **01-new-lead-caller.json** - Triggers on new leads, initiates Vapi calls
2. **02-call-results-handler.json** - Handles Vapi callbacks, updates Sheet + Calendar

## Prerequisites

Before importing, set up these credentials in n8n:

### Required Credentials

| Credential Type | Name | Used For |
|-----------------|------|----------|
| Google Sheets OAuth2 | google-sheets | Read/write leads |
| Google Calendar OAuth2 | google-calendar | Create appointments |
| HTTP Header Auth | vapi-auth | Vapi API calls |
| SMTP | email-smtp | Send notifications |

### Environment Variables

Set these in n8n Settings → Variables:

```
GOOGLE_SHEETS_ID=1aaKMddkHJ4IQ3ZGbjYON6Q4AFzsu0oAXtWWSspk_ANbtjn-LkwhImb7I
GOOGLE_CALENDAR_ID=your-calendar-id
VAPI_API_KEY=your-vapi-api-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER_ID=your-vapi-phone-id
EMAIL_FROM=noreply@yourdomain.com
NOTIFICATION_EMAIL=rosalyn@example.com
```

## Import Workflows

### Option 1: Import via n8n UI

1. Open n8n dashboard
2. Click "Add Workflow" → "Import from File"
3. Select `01-new-lead-caller.json`
4. Repeat for `02-call-results-handler.json`

### Option 2: Import via CLI

```bash
n8n import:workflow --input=workflows/01-new-lead-caller.json
n8n import:workflow --input=workflows/02-call-results-handler.json
```

## Configure After Import

### Workflow 1: New Lead Caller

1. Open workflow in n8n
2. Click "Google Sheets Trigger" node → Select your credentials
3. Verify Sheet ID matches your client's sheet
4. Click "HTTP Request" (Vapi call) → Verify API key is set
5. Activate workflow

### Workflow 2: Call Results Handler

1. Open workflow in n8n
2. Click "Webhook" node → Copy the webhook URL
3. Add this URL to your Vapi assistant's `serverUrl` setting:
   ```
   https://your-n8n-domain.com/webhook/vapi-callback
   ```
4. Configure Google Sheets credentials
5. Configure Google Calendar credentials
6. Configure Email credentials
7. Activate workflow

## Workflow Diagrams

### Workflow 1: New Lead Caller

```
[New Row in Sheet]
       ↓
[Validate Lead] ──(invalid)──→ [Skip]
       ↓ (valid)
[Check Calling Hours]
       ↓
[Within Hours?] ──(no)──→ [Queue for Later]
       ↓ (yes)
[Update Status: "calling"]
       ↓
[Call Vapi API]
       ↓
[Save Vapi Call ID]
```

### Workflow 2: Call Results Handler

```
[Vapi Webhook]
       ↓
[Parse Results]
       ↓
[Update Sheet]
       ↓
[Appointment Booked?] ──(no)──→ [Callback Requested?] ──(no)──→ [Done]
       ↓ (yes)                          ↓ (yes)
[Get Lead Details]              [Schedule Callback]
       ↓                               ↓
[Create Calendar Event]              [Done]
       ↓
[Send Email]
       ↓
[Done]
```

## Vapi Webhook Setup

After activating Workflow 2, configure Vapi to send results:

1. Go to Vapi Dashboard → Assistants
2. Select your assistant
3. Under "Server URL", add your webhook:
   ```
   https://your-n8n-domain.com/webhook/vapi-callback
   ```
4. Save

Alternatively, update via API:
```bash
curl -X PATCH "https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID" \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serverUrl": "https://your-n8n-domain.com/webhook/vapi-callback"}'
```

## Testing

### Test Workflow 1 (New Lead Caller)

1. Add a test row to your Google Sheet with:
   - Valid phone number (your phone)
   - status = "new"
   - do_not_contact = FALSE
2. Wait for trigger (polls every minute) or manually execute
3. You should receive a call from Vapi

### Test Workflow 2 (Call Results)

1. Manually trigger with test webhook payload:
```bash
curl -X POST "https://your-n8n-domain.com/webhook/vapi-callback" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-call-123",
    "duration": 120,
    "endedReason": "completed",
    "metadata": {"lead_id": "LD-xxx", "client_id": "rosalyn-mero"},
    "analysis": {
      "summary": "Spoke with owner, interested in 30-day timeline",
      "structuredData": {
        "owner_confirmed": true,
        "qualified": true,
        "timeline": "30_days",
        "open_to_agent": "yes",
        "appointment_booked": true,
        "appointment_datetime": "2024-01-15T14:00:00Z"
      }
    }
  }'
```
2. Check Sheet for updated lead
3. Check Calendar for new event
4. Check email for notification

## Troubleshooting

### Workflow not triggering

- Check workflow is activated (toggle in top right)
- Verify Google Sheets credentials are valid
- Check n8n execution history for errors

### Vapi call failing

- Verify VAPI_API_KEY is correct
- Check VAPI_PHONE_NUMBER_ID exists
- Look at HTTP Request node response in execution

### Calendar event not created

- Verify Google Calendar credentials
- Check calendar ID is correct
- Ensure appointment_date is valid ISO format

### Email not sending

- Verify SMTP credentials
- Check EMAIL_FROM is authorized sender
- Look at execution logs for SMTP errors
