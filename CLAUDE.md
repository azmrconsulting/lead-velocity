# Lead Velocity - Project Context

## What This Is

Automated FSBO (For Sale By Owner) lead qualification system. Scrapes listings, calls owners via AI voice, qualifies them, and books appointments with real estate agents.

## Architecture

```
Browse AI (Scraper) → Google Sheet (DB) → n8n (Orchestrator) → Vapi (AI Calls) → Calendar + Notifications
```

## Folder Structure

```
lead-velocity/
├── CLAUDE.md                   # This file - project context
├── .env.example                # Required environment variables
├── .gitignore                  # Git ignore rules
│
├── clients/                    # Per-client configurations
│   ├── _template.json          # Template for new clients
│   └── rosalyn-mero.json       # Rosalyn's config
│
├── docs/                       # Documentation
│   └── PRD-lead-velocity       # Product requirements
│
├── sheets/                     # Google Sheets schema & setup
│   ├── schema.md               # Column definitions & validation
│   ├── headers.csv             # Import-ready column headers
│   └── apps-script.js          # Auto ID/timestamp script
│
├── scraper/                    # Browse AI configuration
│   └── setup.md                # Scraper setup instructions
│
├── vapi/                       # Vapi AI voice agent
│   ├── assistant-config.json   # Vapi config template ({{variables}})
│   └── conversation-script.md  # Full conversation flow
│
└── n8n/                        # n8n workflow definitions
    └── workflows/              # Exported workflow JSON files
```

## Key Files

| File | Purpose |
|------|---------|
| `clients/{id}.json` | All client-specific settings (agent, availability, targeting) |
| `vapi/assistant-config.json` | Vapi template with `{{variables}}` for client substitution |
| `sheets/schema.md` | Google Sheet column definitions and validation rules |
| `docs/PRD-lead-velocity` | Full requirements, failure handling, metrics |

## Multi-Client Setup

Each client gets:
- Their own `clients/{client-id}.json` config
- Their own Google Sheet (ID stored in config)
- Their own Google Calendar (ID stored in config)
- Their own Vapi Assistant (ID stored in config after creation)

## Current Client

**Rosalyn Mero** - `clients/rosalyn-mero.json`
- Brokerage: X Realty Corp
- Region: Morris County, NJ
- Phone: 862-246-1327
- Availability: Mon, Tue, Thu, Fri, Sat 10am-7pm

## Tech Stack

- **Scraper**: Browse AI (Zillow FSBO)
- **Database**: Google Sheets
- **Orchestration**: n8n (self-hosted on VPS)
- **AI Voice**: Vapi with GPT-4 + ElevenLabs
- **Calendar**: Google Calendar
- **Notifications**: Email + SMS (Twilio)

## Common Tasks

### Add a new client
1. Copy `clients/_template.json` to `clients/{new-id}.json`
2. Fill in agent details, availability, targeting
3. Create Google Sheet from schema
4. Create Google Calendar
5. Create Vapi assistant using template
6. Update config with Sheet ID, Calendar ID, Vapi Assistant ID

### Modify conversation script
1. Edit `vapi/conversation-script.md` for documentation
2. Update `vapi/assistant-config.json` systemPrompt
3. Update Vapi assistant via API or dashboard

### Add new lead source
1. Document scraper setup in `scraper/`
2. Ensure output matches Google Sheet schema
3. Update n8n workflow to handle new source

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `VAPI_API_KEY` - Vapi authentication
- `GOOGLE_*` - Google OAuth credentials
- `BROWSE_AI_*` - Scraper credentials
- `TWILIO_*` - SMS notifications
