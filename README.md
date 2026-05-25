# KoinX - Tax Loss Harvesting & Reconciliation Dashboard

A fully integrated, production-grade application comprising:
1. **Tax Loss Harvesting Interface**: A premium React dashboard featuring real-time capital gains updates, custom hover tooltips, and modular components.
2. **Transaction Reconciliation Engine (MVC)**: A Node.js + Express backend that parses CSV files, runs a 1-to-1 matching engine, auto-seeds collections on boot, and exposes REST APIs.

---

## Project Structure

### Backend (MVC Folder Structure)
```text
backend/
├── config/
│   └── db.js                        # Database connection (MongoDB + fallback JSON Collection)
├── models/
│   ├── Holding.js                   # Schema for position balances & buy prices
│   ├── CapitalGain.js               # Schema for pre-harvesting gains
│   ├── Transaction.js               # Schema for user/exchange transaction rows
│   ├── ReconciliationRun.js         # Schema for run execution metadata
│   └── ReconciliationReportItem.js  # Schema for reconciliation reports
├── controllers/
│   ├── taxHarvestingController.js   # Fetches holdings and pre-harvesting gains
│   └── reconciliationController.js  # Triggers matching runs and generates JSON/CSV reports
├── routes/
│   ├── taxHarvestingRoutes.js       # Mounts tax harvesting endpoints
│   └── reconciliationRoutes.js      # Mounts matching engine endpoints
├── utils/
│   ├── ingestion.js                 # Parses and validates CSV data quality
│   └── matchingEngine.js            # Performs proximity tolerance-based pairings
├── .data/                           # Zero-dependency local JSON storage (fallback)
├── user_transactions.csv            # Messy transaction import
├── exchange_transactions.csv        # Exchange transaction export
├── index.js                         # Boots Express app & seeds DB collections
├── package.json
└── .env                             # Backend configuration variables
```

### Frontend (Modular Component Structure)
```text
frontend/
├── src/
│   ├── components/
│   │   ├── TaxLossHarvesting/       # Subcomponents for harvesting
│   │   │   ├── DisclaimerBanner.tsx # Collapsible banner + CSS-based hover tooltip
│   │   │   ├── HarvestingCards.tsx  # Pre/Post comparative gains cards
│   │   │   └── HoldingsTable.tsx    # Holdings list grid (sortable, searchable)
│   │   └── Reconciliation/
│   │       └── ReconciliationPanel.tsx # Runs selector, metric widgets, detailed reports
│   ├── App.tsx                      # Layout coordinator & tab switcher
│   ├── index.css                    # Tailored dark theme stylesheets
│   └── main.tsx
├── .env                             # Newly created: defines VITE_API_URL
├── vite.config.ts                   # Vite config with API proxy
└── package.json
```

---

## Setup & Running Locally

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Step 1: Run the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (runs on port 5000):
   ```bash
   npm start
   ```
   *Note: If nodemon is preferred for development, run `npm run dev`.*

On boot, the backend automatically performs database seeding:
* Seeds **holdings** and **capital gains** collections.
* Auto-seeds the raw **CSV transactions** into your MongoDB collections, executing the default reconciliation matching algorithm under `RUN-DEFAULT`.

### Step 2: Run the Frontend App
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (already created for you) in the frontend root containing:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the Vite development server (runs on port 5173):
   ```bash
   npm run dev
   ```

Open your browser to `http://localhost:5173/` to view the full application.

---

## Technical Decisions & Assumptions

* **Zero-Dependency DB Fallback**: Connecting to MongoDB Atlas or local services is fully supported. If the connection fails or times out, the backend automatically falls back to local JSON-based storage file collections in the `.data/` directory, maintaining the exact same API behavior and database queries.
* **Auto-Seeding**: Transactions are auto-parsed and matched on the first server start, pre-populating your database (such as MongoDB browser collections) with report items.
* **Figma-Compliant Hover Tooltips**: Moving the cursor over the info icon `ⓘ` displays the exact disclaimer details in a centered floating speech-bubble tooltip box.
* **Loose vs Tight tolerances**: Matches are determined via strict tolerances (`±300s` and `±0.01%`). Proximity-based conflicts are identified within a wider `1-hour` window, highlighting precise discrepancies.
