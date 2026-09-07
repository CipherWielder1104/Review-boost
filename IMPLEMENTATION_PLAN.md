# Restaurant Review AI Flow - Implementation Plan

## 1. Goal

Build a local, free, mobile-first review workflow for a business or community place, starting from a QR code and ending with the user posting a review to Google Maps. The app should help the customer write a better review using AI, but the user must always approve the final text before it is used.

This project is intentionally designed as a consent-based, transparent, and Google-safe flow.

---

## 2. Current project status

The current local prototype is working and has the following behavior:

- QR-style landing screen
- star rating capture
- optional comment box
- AI-generated review using local Ollama
- review preview and manual edit
- consent checkbox before redirect
- copy-to-clipboard behavior
- Google Maps place redirect
- final manual Google review posting by the user

This is the current valid product scope. We are not pretending to auto-post to Google or auto-fill Google’s review form in a standard web app.

---

## 3. Core product principles

### 3.1 AI assists, user approves
AI should only improve wording and structure. It must not invent facts.

### 3.2 User remains in control
The customer must be able to:
- edit the generated review,
- reject it,
- approve a version that reflects their actual experience.

### 3.3 Google-safe behavior
The app should never claim it has automatically posted a Google review.
The final step is a redirect to the Google Maps review page and a manual publish by the user.

### 3.4 Trust and compliance
The review must be:
- truthful,
- grounded in actual experience,
- respectful,
- free of fabricated details,
- clear and concise.

---

## 4. Product flow

1. Land on QR review screen
   - Customer reaches the review flow from a physical QR code or place-specific link.
   - CTA: “Share Feedback”

2. Rate the experience
   - 1 to 5 stars
   - This is the primary sentiment input

3. Add optional feedback
   - Free text comment with details like cleanliness, ambiance, parking, staff, etc.

4. Generate AI review
   - Frontend sends rating + comment to the local backend
   - Backend calls Ollama and requests a draft review
   - Loading state displayed while AI works

5. Review preview
   - Display the generated draft
   - Customer can choose to continue or edit

6. Edit review
   - User can rewrite the draft to match their own actual experience

7. Consent step
   - Required checkbox:
    “I have reviewed this suggestion and confirm that it accurately reflects my experience.”

8. Copy & redirect
   - Final text is copied to clipboard
   - App opens the business or place’s Google Maps review page
   - User is told to click Write a review and paste the copied text

9. Final success screen
   - Review flow is complete
   - User has the approved final text ready for Google post

---

## 5. AI review generation rules

### 5.1 Inputs
The AI receives:
- place name
- star rating
- optional user comment
- locale or phrasing style
- review tone: authentic, concise, helpful

### 5.2 Constraints
The generated review must:
- use only the user’s actual rating and comment as evidence
- avoid fabricated facts or invented service stories
- remain 1–3 sentences
- sound natural and human
- avoid exaggerated claims, spam, or hype
- avoid fake names or fake employee references

### 5.3 Star-based drafting logic

5 stars:
- warm and appreciative
- mention positives clearly
- avoid exaggerated marketing language

4 stars:
- mostly positive
- include one minor concern only if relevant
- balanced and respectful

3 stars:
- neutral or mixed
- include both positive and negative elements fairly

2 stars:
- constructive criticism
- keep tone calm and specific

1 star:
- honest and direct
- focus on real problems
- avoid personal attacks or abusive language

---

## 6. Google review integration strategy

### 6.1 Recommended approach for this project
Do not attempt to automatically post to Google from a normal browser web app.
The valid approach is:
- generate review
- let user approve it
- copy it to clipboard
- open the Google Maps review page
- let the user paste and publish manually

### 6.2 Why this is necessary
Google Maps review fields are not directly controllable from a standard web page. Browser security and Google UI constraints prevent reliable auto-fill and auto-submit from a typical frontend app.

### 6.3 What is allowed now
- open the public Google Maps review page
- let the user log in if required
- allow the user to click Write a review and paste the approved review

### 6.4 What is not allowed in the current scope
- silent Google review posting
- fake Google sign-in flow
- direct automated entry into Google’s review form from a general website

---

## 7. Free and open-source architecture

### 7.1 Frontend
- Vite React app
- free and open-source
- custom UI for the review flow

### 7.2 Backend
- Express server
- lightweight local API
- receives review generation requests from the frontend

### 7.3 AI layer
- Ollama local runtime
- free and open-source
- recommended model: llama3.2
- no paid cloud model required

### 7.4 Cost confirmation
The current stack is free to run locally:
- React + Vite: free
- Express: free
- Node.js: free
- Ollama: free
- Google Maps: free to access and use
- No paid AI API required for this version

The only user-level cost might be the user’s existing Google account, which is free to access.

### 7.5 Windows launcher

`launcher.bat` is the supported Windows startup path for the local prototype. It:

1. Changes the working directory to the folder containing the batch file.
2. Opens a command window running `ollama run llama3.2`.
3. Waits three seconds for Ollama to start.
4. Opens a second command window that runs `npm install && npm run dev`.

The launcher assumes Node.js (`npm.cmd`) and Ollama are available on `PATH`, and that the `llama3.2` model has been pulled. It checks for Node.js and Ollama before opening the service windows. It does not check whether the Ollama model is ready, open the browser, or verify API health; both command windows must remain open while the app is in use.

The manual equivalent is `npm install` followed by `npm run dev`. The backend defaults to port `3001`, the Vite frontend defaults to port `5173`, and `.env` can override the backend settings.

---

## 8. Project folder structure

- src/ — frontend app and UI flow
- server/ — backend API that calls Ollama
- .env — local environment configuration (created from `.env.example`)
- .env.example — environment template
- .gitignore — ignores local and generated files
- launcher.bat — Windows startup script for the local services
- IMPLEMENTATION_PLAN.md — project architecture and workflow plan
- README.md — GitHub-facing project overview
- package.json — scripts and dependencies

---

## 9. GitHub readiness

The project is structured to be committed to GitHub:
- clean project root
- environment variables separated into .env and .env.example
- .gitignore covers node_modules, build output, local env files, and editor files
- README is written for a public-facing repository

---

## 10. Recommended next milestones

### Phase 1: Local prototype validation
- review flow works on a real place URL
- AI review generation works locally
- user approval and consent work correctly
- final Google redirect is functional

### Phase 2: UX refinement
- tune wording for real-world use cases
- improve mobile compatibility
- reduce confusion before Google opens

### Phase 3: Optional helper enhancement
- add a browser extension or local helper for one-click paste into Google review fields when needed
- keep this optional and user-controlled

### Phase 4: Production tailoring
- adapt the app for restaurants, societies, or service businesses
- replace placeholder content with real branding and target places

---

## 11. Final implementation statement

The current version is a free, local, consent-based AI review assistant that helps a customer draft a truthful review and hands off to Google Maps for final posting. It does not force or fake Google actions, and it remains compliant with the practical constraints of a normal browser-based app.

```

### Response body
```json
{
  "review": "The food was delicious and the ambiance was great. The staff were friendly, though the service was a bit slow during peak hours. Overall, it was a very pleasant experience.",
  "status": "success",
  "warnings": []
}
```

### Error responses
- invalid rating
- empty payload
- AI generation failure
- moderation violation
- unsupported locale

---

## 10. Safety and Moderation Rules

Before returning a review draft, the backend should validate:
- rating is between 1 and 5
- text is not empty or abusive
- text is not a spam pattern
- no prohibited content is generated
- no fabricated details are present

If moderation flags are triggered:
- either return a safe fallback review based only on rating,
- or return a rejection message asking the user to rewrite their feedback more clearly.

---

## 11. Data Handling

### We should store
- session ID
- star rating
- optional customer feedback
- generated review draft
- final approved review
- timestamp

### We should avoid storing
- personally identifying information unless absolutely necessary
- raw sensitive customer details
- Google account credentials

---

## 12. Edge Cases to Handle

- rating selected but comment empty
- comment too long
- one-star review with no text
- user edits the draft heavily
- user rejects generated output
- redirect fails due to browser security or blocked tabs
- clipboard access unavailable
- Google review page is not available in browser context

---

## 13. Recommended Implementation Order

### Phase 1: UX and flow
- QR landing screen
- star rating screen
- optional feedback screen
- AI delay/loading screen
- review preview screen
- edit screen
- consent step
- copy + redirect screen

### Phase 2: AI backend integration
- prompt design
- API contract
- model integration
- moderation safeguards
- safety fallback logic

### Phase 3: Google redirect and review publication flow
- open restaurant map/review page
- copy text to clipboard
- success screen

### Phase 4: QA and compliance checks
- test empty comment path
- test all rating levels
- test edit flow
- test consent enforcement
- verify no false autopost claims
- verify redirect works in browser

---

## 14. Deliverables

- frontend flow UI in React
- backend AI review generation API
- consent-based approval flow
- clipboard copy + redirect logic
- Google-safe review publishing flow
- QA checklist for compliance and effectiveness

---

## 15. Final Recommendation

The final implementation should be framed as:
“AI-assisted review drafting for customer-submitted feedback”

Not as:
“AI auto-posting Google reviews”

This distinction is critical for trust, user control, and compliance.
