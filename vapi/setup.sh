#!/bin/bash

# Lead Velocity - Vapi Assistant Setup
# Run this script to create the Vapi assistant for a client

# Check for API key
if [ -z "$VAPI_API_KEY" ]; then
  echo "Error: VAPI_API_KEY environment variable not set"
  echo "Usage: VAPI_API_KEY=your_key ./setup.sh"
  exit 1
fi

# Client config (Rosalyn Mero)
AGENT_NAME="Rosalyn Mero"
AGENT_FIRST_NAME="Rosalyn"
AGENT_PHONE="862-246-1327"
BROKERAGE="X Realty Corp"
REGION="Morris County, NJ"

# Availability prompt
AVAILABILITY="Days: Monday, Tuesday, Thursday, Friday, Saturday
NOT available: Wednesday, Sunday
Hours: 10:00 AM to 7:00 PM Eastern
Only book phone calls (property visits come after initial call)"

# Create assistant
echo "Creating Vapi assistant for $AGENT_NAME..."

RESPONSE=$(curl -s -X POST "https://api.vapi.ai/assistant" \
  -H "Authorization: Bearer $VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "name": "FSBO Lead Qualifier - ${AGENT_NAME}",
  "firstMessage": "Hi, is this the owner of the property on {{address}}?",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "messages": [
      {
        "role": "system",
        "content": "You are an AI assistant making outbound calls on behalf of ${AGENT_NAME}, a real estate agent with ${BROKERAGE} in ${REGION}.\n\nYour goal is to:\n1. Confirm you're speaking with the property owner\n2. Identify yourself as an AI assistant (be honest if asked)\n3. Qualify the lead based on timeline and openness to working with an agent\n4. If qualified, book a phone call with ${AGENT_FIRST_NAME}\n5. Handle objections professionally and empathetically\n\nKey behaviors:\n- Be conversational and warm, not scripted or robotic\n- Listen actively and respond to what they actually say\n- Don't be pushy - respect 'no' but explore objections gently\n- If they request to not be contacted, respect it immediately\n- Keep the call under 5 minutes unless they want to chat longer\n- Use '${AGENT_FIRST_NAME}' not 'the agent' when referring to her\n\nAgent availability:\n${AVAILABILITY}\n\nProperty context (passed as variables):\n- Address: {{address}}\n- Asking price: {{price}}\n- Beds/Baths: {{beds}}/{{baths}}\n- Square feet: {{sqft}}\n\nQualification criteria:\n- Timeline: '30 days' or '90 days' = qualified\n- Open to agent: 'Yes' or 'Maybe' = qualified\n- Both must be true to book an appointment\n\nIf NOT qualified:\n- Thank them politely\n- Mention ${AGENT_FIRST_NAME}'s phone number (${AGENT_PHONE}) in case they change their mind\n- End call gracefully\n\nData to capture:\n- timeline: 30_days | 90_days | flexible | not_selling\n- reason_selling: why they're selling FSBO\n- open_to_agent: yes | no | maybe\n- objections: any concerns raised\n- appointment_datetime: if booking (ISO format)\n\nAlways end calls politely regardless of outcome."
      }
    ]
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  },
  "silenceTimeoutSeconds": 10,
  "maxDurationSeconds": 300,
  "backgroundSound": "off",
  "backchannelingEnabled": true,
  "endCallFunctionEnabled": true,
  "voicemailMessage": "Hi, this is a message on behalf of ${AGENT_NAME} with ${BROKERAGE}. We noticed your property listing and ${AGENT_FIRST_NAME} would love to connect with you about it. You can reach her directly at ${AGENT_PHONE}. Thanks, and have a great day.",
  "endCallMessage": "Thank you for your time. Have a great day!",
  "analysisPlan": {
    "summaryPrompt": "Summarize this call in 2-3 sentences. Include: whether owner was reached, their timeline, openness to agent help, any objections, and if an appointment was booked.",
    "structuredDataPrompt": "Extract the following from the call:\n- owner_confirmed (boolean): Was the property owner reached?\n- timeline (string): 30_days, 90_days, flexible, not_selling, or unknown\n- reason_selling (string): Why they chose FSBO\n- open_to_agent (string): yes, no, maybe, or unknown\n- objections (string): Any objections raised, comma-separated\n- qualified (boolean): Timeline is 30/90 days AND open_to_agent is yes/maybe\n- appointment_booked (boolean): Was an appointment scheduled?\n- appointment_datetime (string): ISO datetime if booked, null otherwise\n- dnc_requested (boolean): Did they ask to not be contacted?\n- callback_requested (boolean): Did they ask to be called back later?\n- callback_datetime (string): When to call back, if requested",
    "structuredDataSchema": {
      "type": "object",
      "properties": {
        "owner_confirmed": { "type": "boolean" },
        "timeline": { "type": "string", "enum": ["30_days", "90_days", "flexible", "not_selling", "unknown"] },
        "reason_selling": { "type": "string" },
        "open_to_agent": { "type": "string", "enum": ["yes", "no", "maybe", "unknown"] },
        "objections": { "type": "string" },
        "qualified": { "type": "boolean" },
        "appointment_booked": { "type": "boolean" },
        "appointment_datetime": { "type": "string" },
        "dnc_requested": { "type": "boolean" },
        "callback_requested": { "type": "boolean" },
        "callback_datetime": { "type": "string" }
      },
      "required": ["owner_confirmed", "timeline", "open_to_agent", "qualified", "appointment_booked", "dnc_requested"]
    }
  }
}
EOF
)

# Extract assistant ID
ASSISTANT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ASSISTANT_ID" ]; then
  echo "Error creating assistant:"
  echo $RESPONSE | python3 -m json.tool 2>/dev/null || echo $RESPONSE
  exit 1
fi

echo ""
echo "Success! Assistant created."
echo ""
echo "Assistant ID: $ASSISTANT_ID"
echo ""
echo "Add this to clients/rosalyn-mero.json:"
echo ""
echo '  "vapi": {'
echo "    \"assistant_id\": \"$ASSISTANT_ID\""
echo '  }'
echo ""
