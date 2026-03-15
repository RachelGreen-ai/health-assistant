# epic-fhir-mcp

An MCP (Model Context Protocol) server that connects Claude to Epic MyChart via SMART-on-FHIR OAuth 2.0.
Purpose-built for cancer and complex care patients — tracking labs, treatments, medications, and appointments.

---

## Tools exposed

| Tool | What it does |
|------|-------------|
| `authorize` | Opens Epic login in the browser. Must be called first. |
| `get_oncology_summary` | **Start here.** One-call snapshot: diagnosis, chemo protocol, recent labs, next appointment. |
| `get_patient_summary` | Demographics, active conditions (ICD codes), allergies, emergency contacts. |
| `get_lab_trends` | CBC, CMP, or tumor marker time-series with interpretation flags. Great for tracking ANC during chemo. |
| `get_medication_regimen` | Active meds grouped by category: chemo agents, supportive care, prophylaxis, PRN. |
| `get_upcoming_appointments` | Scheduled appointments with a travel-distance flag ("consider calling to reschedule"). |
| `get_care_team` | Attending, oncologist, on-call contacts with phone/email. |
| `get_clinical_notes` | Recent visit summaries and discharge notes (HTML stripped). |
| `get_treatment_history` | Past procedures: surgeries, chemo cycles, CAR-T/transplant, radiation. |
| `get_allergy_profile` | Allergies grouped by drug / food / environmental with reaction severity. |

---

## Step 1 — Get Epic sandbox credentials

1. Go to **[open.epic.com](https://open.epic.com)** → **Developer** → **Apps** → **Create App**
2. Fill in:
   - **Application Type:** Patient-Facing App
   - **Application Audience:** Patients
   - **Redirect URI:** `http://localhost`
     _(Epic's sandbox accepts any `localhost` port when you register just the base URI)_
3. Copy the **Client ID** shown after creation (it looks like a UUID).
4. You do **not** need a client secret — this is a public PKCE app.

---

## Step 2 — Configure the server

```bash
cp .env.example .env
```

Edit `.env` and set your `EPIC_CLIENT_ID`:

```dotenv
EPIC_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

All other values default to Epic's public sandbox and can be left as-is for testing.

---

## Step 3 — Build

```bash
npm install
npm run build
```

---

## Step 4 — Wire into Claude Code

Add the server to your Claude Code MCP config. Create or edit `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "epic-fhir": {
      "command": "node",
      "args": ["/absolute/path/to/personal-health-assistant/dist/index.js"],
      "env": {
        "EPIC_CLIENT_ID": "your-client-id-here"
      }
    }
  }
}
```

Restart Claude Code. You should see the Epic FHIR tools available.

---

## Step 5 — Test with Epic sandbox

Epic's sandbox has pre-loaded test patients. The easiest one to use:

- **Patient:** Camila Lopez
- **Username:** `fhircamila`
- **Password:** `epicepic1`

When you call `authorize`, a browser window will open. Log in with those credentials.
Epic will redirect back to the local callback server and save your tokens to `~/.epic-mcp-tokens.json`.

Then try:

```
get_oncology_summary
```

---

## Using it with real Stanford Health Care / MyChart

Stanford Health Care runs Epic. To use this with a real patient account:

1. Stanford must approve your app in their production Epic environment (requires Epic App Orchard review for production).
2. Change the URLs in `.env` to Stanford's FHIR endpoints:
   ```dotenv
   EPIC_BASE_URL=https://epicproxy.stanfordhealthcare.org/FHIRproxy/api/FHIR/R4
   EPIC_AUTH_URL=https://epicproxy.stanfordhealthcare.org/FHIRproxy/oauth2/authorize
   EPIC_TOKEN_URL=https://epicproxy.stanfordhealthcare.org/FHIRproxy/oauth2/token
   ```
3. The patient logs in with their **MyChart** credentials.

Sutter Health and Santa Clara Valley Health also run Epic — same process, different base URLs.

---

## Token storage

Tokens are saved to `~/.epic-mcp-tokens.json` with `0600` permissions (owner read/write only).
The access token refreshes automatically when it expires. Run `authorize` again if refresh fails.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EPIC_CLIENT_ID` | _(required)_ | Your app's client ID from open.epic.com |
| `EPIC_BASE_URL` | Epic sandbox FHIR R4 | FHIR base URL |
| `EPIC_AUTH_URL` | Epic sandbox OAuth | Authorization endpoint |
| `EPIC_TOKEN_URL` | Epic sandbox OAuth | Token endpoint |
| `TOKEN_FILE_PATH` | `~/.epic-mcp-tokens.json` | Where tokens are persisted |
| `PATIENT_DISTANCE_THRESHOLD_MILES` | `30` | Appointments beyond this distance get a "consider phone call" flag |
