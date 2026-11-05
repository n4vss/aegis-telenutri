# Aegis Telenutri

**Tele-nutrition Gateway & Digital Health Platform (MVP)**
Nutrition Fundamentals Finals Project
**By:** Bancruz, Liboon, Navales, & Solis | **Section:** BSCS - 3

---

## 1. About the Project

Aegis Telenutri is a simple web platform that connects patients (consumers) with dietitians (providers) for virtual nutrition consultations. A consumer can log their meals and book an appointment. A provider can review the meal logs, write charting notes, and start a secure video session.

The project integrates all modules into one flow:

**Consumer login → Meal logging → Provider charting → Virtual session**

### Features
- **Role-based login:** Consumer (Patient) or Provider (Dietitian).
- **Meal logging:** meal type, food description, and calories.
- **Appointment scheduling:** pick a date, time, and dietitian. Double-booking the same slot is blocked.
- **Provider charting:** patient list, meal log review, and saved notes that the consumer can read.
- **Secure video consultation:** embedded Jitsi Meet (WebRTC) room. Each appointment gets a unique, hard-to-guess room name.
- **Responsive design:** card layout that works on desktop and mobile.

### Tech Stack
- HTML, CSS, and JavaScript only (no frameworks, no build tools)
- Jitsi Meet IFrame API (WebRTC) for video
- `localStorage` for demo data (no backend)
- GitHub Pages for deployment

### Color Scheme
| Role | Color | Hex |
|---|---|---|
| Primary | Fresh green | `#2E8B57` |
| Secondary | Deep teal | `#1F5F5B` |
| Accent | Warm orange | `#F4A259` |
| Background | Soft cream | `#F7FAF5` |
| Text | Charcoal | `#2B2B2B` |

---

## 2. Project Structure

```
tele-nutrition/
├── index.html      Login page (role selection) + project info
├── consumer.html   Meal logging, booking, join session, dietitian notes
├── provider.html   Patient list, meal review, charting, start session
├── session.html    Jitsi video room
├── style.css       Shared styles
├── app.js          Shared logic (storage, auth, navbar, footer)
├── consumer.js     Consumer page logic
├── provider.js     Provider page logic
├── session.js      Jitsi embed logic
└── README.md
```

---

## 3. How to Run the Project

No installation is needed. You only need a modern browser (Chrome, Edge, or Firefox) and an internet connection (for the Jitsi video).

### Option A: Open directly
1. Download and unzip the project.
2. Double-click `index.html` to open it in your browser.

### Option B: Run a local server (recommended)
Camera and microphone work reliably on `localhost` or HTTPS, so a local server is better for testing video.

1. Open a terminal inside the project folder.
2. Start a server (use either one):
   - Python: `python -m http.server 8000`
   - Node.js: `npx serve`
3. Open `http://localhost:8000` in your browser.

### Option C: Use the live site
Open the GitHub Pages link of the deployed project (see Section 5).

---

## 4. How to Use the Platform

### As a Consumer
1. On the login page, enter your name, select **Consumer (Patient)**, and click **Log in**.
2. Under **Log a Meal**, choose the meal type, enter the food and calories, and click **Save meal**.
3. Under **Book a Consultation**, choose a date, time, and dietitian, then click **Book appointment**.
4. Your appointment appears under **My Appointments** with a **Join Session** button.
5. Notes from your dietitian appear under **Notes from my dietitian**.

### As a Provider
1. Log out, then log in with a name and select **Provider (Dietitian)**.
2. Click a patient in **Patients** to see their meal log.
3. Write a note in **Charting note** and click **Save note**.
4. Under **Upcoming Sessions**, click **Start Session** to open the video room.

### In the Video Session
- Allow camera and microphone when the browser asks.
- Click **Copy invite link** and send it to the other person so they join the same room.
- Use **Open in new tab** if the embedded video does not load.

### Quick Demo on One Computer
Because data is saved per browser, do the full flow in one browser: log in as Consumer, log a meal and book, click **Logout**, log in as Provider, chart the patient, then start the session.

---

## 5. Deployment (GitHub Pages)

1. Create a new GitHub repository and upload all project files to the **root** of the repo.
2. Go to **Settings → Pages**.
3. Under **Source**, choose the `main` branch and the `/ (root)` folder, then click **Save**.
4. After a minute, the site is live at `https://<username>.github.io/<repository-name>/`.

GitHub Pages uses HTTPS, which is required for camera and microphone access.

---

## 6. End-to-End Test Checklist

| # | Step | Expected result | Pass/Fail |
|---|---|---|---|
| 1 | Consumer login | Redirects to `consumer.html` | |
| 2 | Meal logging | Meal appears under My Meals | |
| 3 | Book appointment | Appears with a Join Session button | |
| 4 | Double-book same slot | "Slot already taken" alert | |
| 5 | Provider login | Redirects to `provider.html`, patient is listed | |
| 6 | Review meal log | Patient's meals are shown | |
| 7 | Provider charting | Note saved, then visible in consumer view | |
| 8 | Start session | Jitsi room opens with a camera/mic prompt | |
| 9 | Two-party session | Both users see each other via the invite link | |
| 10 | Role guard | Consumer cannot open `provider.html` | |
| 11 | Mobile layout | Pages are usable at phone width | |

---

## 7. Notes and Limitations

- **Demo data:** users, meals, notes, and appointments are stored in the browser's `localStorage`. They are not shared between different browsers or devices, and there is no real password login.
- **Video server:** the free public `meet.jit.si` server is meant for testing. Embedded rooms may be limited (about 5 minutes) and may ask the first person to log in. For longer sessions, use a self-hosted Jitsi server or 8x8 JaaS, and change `JITSI_DOMAIN` in `session.js` and the script URL in `session.html`.
- **Not for real medical use:** this is a school MVP and does not meet health-data privacy requirements.

---

## 8. Credits

**Aegis Telenutri** is a Nutrition Fundamentals Finals Project by **Bancruz, Liboon, Navales, & Solis** (BSCS - 3).
