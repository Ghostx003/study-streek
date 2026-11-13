<div align="center">

# ⚡ STUDY STREAK
### *Relentless Consistency. Zero Excuses. Absolute Focus.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Tailscale](https://img.shields.io/badge/Tailscale-Integrated-000000?style=for-the-badge&logo=tailscale&logoColor=white)](https://tailscale.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>A hardcore, high-precision study tracking engine built for individuals who prioritize output over vanity metrics.</b><br/>
  No gamified fluff. No pseudo-motivational quotes. No convoluted graphs. Just raw, verifiable execution.
</p>

</div>

---

## 🎯 The Philosophy

Most productivity trackers drown you in visual noise, meaningless reward badges, and fabricated graphs that make you *feel* productive without actually holding you accountable.

**Study Streak is engineered differently:**
- **Binary Discipline:** You either hit your daily target or you failed it. There are no participation trophies.
- **Strict Accountability:** Completed days earn a crisp green tick (`✓`). Missed days get marked with an uncompromising red cross (`✕`).
- **Zero Graph Policy:** Complicated charts distort reality. Pure, unadulterated numbers never lie.
- **Self-Explanatory & Minimal:** Built with sleek obsidian aesthetics, razor-sharp typography, and instant feedback.

---

## ⚡ Key Capabilities

### 1. Daily Study Target & Dynamic Adaptation
- **Every Day is Day One:** Fresh target establishment prompt each calendar day (`YYYY-MM-DD` in your local timezone).
- **Fractional Precision:** Set targets in standard presets (4h, 6h, 8h, 10h) or custom decimals (e.g., 4.5h, 7.25h).
- **Mid-Day Adjustments with Zero Progress Loss:** Increase or decrease your target at any time without destroying completed sessions or losing historical fidelity.

### 2. Dual Tracking Engines
- **Mode A: Hour-Wise Execution**
  - Automates 1-hour session distribution with precision-calculated fractional final intervals.
- **Mode B: Pomodoro Protocol**
  - Choose between 25m, 35m, 45m, or custom session lengths.
  - Generates exact session lists with auto-balanced final blocks to match targets to the minute.
  - **No Forced Countdown Anxiety:** Built as a session completion tracker where you execute autonomously and log completed intervals.

### 3. Smart Session List & State Transitions
- **Interactive Completion:** One click marks the session as finished.
- **Instant Visual Downgrade:** Struck-through text, muted opacity, and exact completion timestamp (e.g. `Completed at 10:45 AM`).
- **Auto-Sorting Pipeline:** Completed sessions automatically glide to the bottom into the **Completed Sessions** drawer, keeping pending targets front and center.

### 4. Precision Calendar & Historical Audit
- **Compact & High-Density:** Designed to take minimal vertical space below the active study cockpit.
- **Status Indicators:**
  - `✓` (Emerald Green): Target 100% achieved.
  - `✕` (Crimson Red): Incomplete or missed past day.
  - `•` (Neutral): Current day in progress.
- **Deep Historical Inspection:** Click any calendar date to summon full audited session breakdowns, timestamps, original targets, and mode configurations.

### 5. Pure Numerical Consistency Analytics (Strictly No Graphs)
Tracks **19 dynamically computed mathematical metrics**:
- Current Streak & All-Time Longest Streak
- Overall Consistency Rate: `(Successful Days / Eligible Tracked Days) × 100`
- Total Accumulated Study Hours & Daily Averages
- Average Duration on Successful Days
- Completed vs. Missed Sessions Ratio
- Zero-Study Days & Partial-Completion Days
- Real-Time Periodic Metrics: Week, Month, and Year consistency breakdowns

### 6. Seamless Cross-Device Sync (Instant QR Code Pairing)
- **Zero-Friction Desktop ↔ Mobile Sync:** Connect laptop and phone in seconds.
- **Desktop Host:** Displays a high-res SVG QR code and a 6-digit cryptographic pairing code with live polling.
- **Mobile Camera Scanner:** Uses hardware-accelerated rear camera scanning (`html5-qrcode`) with instant image snapshot and manual code fallbacks.
- **Conflict Resolution Engine:** Deterministic **"Most Recently Updated Device Wins"** algorithm using reliable server-side metadata and atomic disk storage.
- **Tailscale & LAN Native:** Zero-config accessibility over Tailscale VPN networks.

---

## 🛠️ Architecture & Tech Stack

```
studystreek/
├── src/
│   ├── components/          # Modular functional components
│   │   ├── Header.jsx       # Branding, theme toggle & sync action
│   │   ├── DailyTargetSetup.jsx # Clean daily goal onboarding
│   │   ├── Dashboard.jsx    # Primary metrics summary cockpit
│   │   ├── SessionList.jsx  # Active vs completed sessions
│   │   ├── SessionCard.jsx  # Strikethrough & timestamp checkbox card
│   │   ├── CalendarSection.jsx # Compact month grid with ticks/crosses
│   │   ├── HistoryDayModal.jsx # Granular historical day inspector
│   │   ├── StatisticsSection.jsx # Pure numerical performance cards
│   │   ├── SyncModal.jsx    # Desktop QR generator & mobile scanner
│   │   └── TargetEditModal.jsx # Non-destructive target recalculator
│   ├── hooks/
│   │   └── useStudyStreak.js # Core reactive state machine & sync engine
│   ├── utils/
│   │   ├── dateUtils.js     # Timezone-aware local calendar calculations
│   │   ├── sessionGenerator.js # Hourly & Pomodoro math generators
│   │   ├── statsCalculator.js # 19 mathematical consistency metrics
│   │   ├── deviceDetector.js # User-agent & touch detection
│   │   └── storage.js       # Atomic LocalStorage persistence
│   └── styles/
│       └── index.css        # Responsive CSS architecture (320px to 1440px+)
├── server/
│   ├── server.js            # Express 5 backend with persistence & sync API
│   └── networkUtils.js      # Automatic Tailscale / LAN interface detector
├── public/
│   ├── manifest.json        # Progressive Web App manifest
│   ├── sw.js                # Offline caching service worker
│   └── favicon.svg          # Minimalist vector icon
└── data/
    └── store.json           # Atomic persistent backend database
```

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### 1. Clone & Install
```bash
git clone https://github.com/Ghostx003/study-streek.git
cd study-streek
npm install
```

### 2. Start the Backend Sync Server
```bash
npm run server
```
*Listens on `http://0.0.0.0:3001` (accessible via localhost, LAN, and Tailscale).*

### 3. Start the Frontend Development Server
```bash
npm run dev
```
*Frontend runs on `http://localhost:5180` and proxies `/api` requests seamlessly.*

### 4. Build for Production
```bash
npm run build
```
*Production files are bundled into `dist/` and served directly by the Express backend.*

---

## 📱 Accessing from Mobile via Tailscale

1. Make sure **Tailscale** is running on your host machine and mobile phone.
2. Open your phone's browser and navigate to:
   ```
   http://<YOUR_TAILSCALE_IP>:5180
   ```
   *(e.g., `http://100.83.20.17:5180`)*
3. **Install as PWA:** Tap your browser menu (`...` or Share) and select **"Add to Home Screen"** for a full-screen, native-app experience.
4. **Pair Devices:** Tap **Scan / Connect** on desktop, scan the QR code with your phone (or enter the 6-digit code), and watch your study targets synchronize in real-time.

---

## 🛡️ License

Released under the **MIT License**. Build, study, and execute without limits.
