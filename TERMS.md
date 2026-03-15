# Terms and Conditions

**Personal Health Assistant — Epic FHIR Integration**
_Last updated: March 2026_

## 1. Purpose

This application connects to your Epic MyChart health record to help you view and understand your personal health data, including lab results, medications, appointments, care team information, and treatment history. It is designed to support patients managing complex health conditions such as cancer treatment, CAR-T therapy, stem cell transplant, chemotherapy, and radiation.

## 2. Data Access

By authorizing this application, you allow it to read the following data from your Epic MyChart record:

- Demographics and emergency contacts
- Active conditions and diagnoses
- Allergies and adverse reactions
- Medications and prescriptions
- Laboratory results and trends
- Upcoming and past appointments
- Care team members and contact information
- Clinical notes and visit summaries
- Procedures and treatment history

This application requests **read-only** access. It cannot modify, delete, or write any data to your health record.

## 3. Data Storage

- Your health data is accessed in real time from Epic and is not stored permanently on any external server.
- OAuth access tokens are stored locally on your own device in a file accessible only to you (`~/.epic-mcp-tokens.json`), with restricted file permissions.
- No personally identifiable health information is transmitted to or stored on any third-party cloud service.

## 4. AI-Generated Suggestions

This application may use an AI model (Claude by Anthropic) to help interpret your health data and provide informational suggestions. These suggestions:

- Are for **informational purposes only**
- Are **not a substitute for professional medical advice**, diagnosis, or treatment
- Should always be discussed with your licensed healthcare provider before acting on them

## 5. No Warranties

This application is provided as-is for personal and research use. It is not an FDA-regulated medical device. The developer makes no guarantees regarding the accuracy, completeness, or timeliness of information retrieved from Epic.

## 6. Your Rights

You may revoke this application's access to your health record at any time through your MyChart account settings under **Authorized Apps**.

## 7. Contact

For questions or concerns, please open an issue at:
https://github.com/RachelGreen-ai/health-assistant/issues
