# Karny — Merchant Credit Management App

## 1. Project Overview

**Karny** is a mobile application designed to help shopkeepers manage customer credit and payments in an organized way.

The application allows merchants to create an account, manage their customers, track outstanding balances, record credit and payment transactions, and view a dashboard summarizing their activity.

The main goal of Karny is to replace manual debt tracking with a simple, organized, and accessible digital solution.

## 2. Main Features

- **Authentication:** Register and log in to a merchant account.
- **Customer Management:** Create, view, update, and delete customer records.
- **Credit Tracking:** Record amounts owed by customers.
- **Payment Tracking:** Record customer repayments.
- **Transaction History:** Keep track of credit and payment operations.
- **Dashboard:** Display customer and financial summary information.
- **Data Persistence:** Store application data in a PostgreSQL database.

## 3. Technologies Used

### Backend
- **Node.js** — JavaScript runtime environment.
- **Express.js** — Framework for building the REST API.
- **PostgreSQL** — Relational database management system.
- **node-postgres (`pg`)** — Connects the backend to PostgreSQL.
- **bcryptjs** — Password hashing and verification.
- **jsonwebtoken (JWT)** — Token-based authentication.
- **dotenv** — Loads environment variables.
- **SQL** — Defines database tables, relationships, constraints, and queries.

### Frontend
- **React Native** — Builds the mobile user interface.
- **Expo** — Simplifies mobile application development and testing.
- **Expo Router** — Handles application navigation.
- **TypeScript** — Adds static typing to JavaScript.
- **Expo SecureStore** — Helps securely store authentication tokens on supported platforms.

### Development Tools
- **Git and GitHub** — Version control and source code hosting.
- **DBeaver** — Database inspection and SQL management.
- **npm** — Dependency and script management.

## 4. Project Structure

```text
karny/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── mobile/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── docs/
│   ├── class-diagram.md
│   └── ClassDiagram_UML.png
└── README.md
```

## 5. Database

Karny uses PostgreSQL with the database name `KarnyDb`.

The main tables are:

- **users:** Stores merchant account information.
- **customers:** Stores customer details and outstanding balances.
- **transactions:** Stores credit and payment operations.

The database schema uses primary keys, foreign keys, constraints, and indexes to maintain data integrity.

## 6. Getting Started

### Prerequisites

Install the following tools:

- Node.js and npm
- PostgreSQL
- Git
- Expo Go for testing on a compatible mobile device, or an appropriate emulator

### Step 1 — Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd karny
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual URL of your GitHub repository.

### Step 2 — Configure the Backend

```bash
cd backend
npm install
```

Create your local environment file from the example:

```bash
cp .env.example .env
```

Configure the database connection and authentication secret in `.env`, using the variable names defined in `.env.example`.

Create the PostgreSQL database and apply the database migration according to the project's configuration.

Start the backend using the available npm script in `backend/package.json`.

The backend is configured to use port `3000` by default.

### Step 3 — Configure the Mobile Application

Open a second terminal:

```bash
cd mobile
npm install
```

Configure `EXPO_PUBLIC_API_URL` in the local mobile environment file to point to the backend API address reachable by your device.

Start Expo using the script or command configured for the project.

### Step 4 — Run the Application

Start the backend first, then start the Expo development server. Open the application using Expo Go or a supported emulator.

Make sure the mobile application can reach the backend API over the network.

## 7. API Overview

The backend exposes REST API endpoints for authentication, customers, transactions, and dashboard information.

Main route groups include:

- `/auth` — Registration, login, and authentication-related operations.
- `/customers` — Customer management.
- `/transactions` — Credit and payment operations.
- `/dashboard` — Dashboard summary information.

Refer to the backend route files for the exact endpoints, HTTP methods, request bodies, and responses.

## 8. Testing

Backend tests are located in `backend/tests/`.

To run the tests, open the backend directory and use the test script defined in `backend/package.json`:

```bash
npm test
```

## 9. Security Notes

- Never commit `.env` files or database passwords to GitHub.
- Keep authentication secrets private.
- Store password hashes rather than plain-text passwords.
- Protect private customer data with authentication and ownership checks.
- Configure environment variables separately for each development environment.

## 10. Project Documentation

The `docs/` directory contains the project's UML class diagram and related documentation.

## 11. Project Status

Karny is under active development. Features and implementation details may evolve as the backend, mobile application, testing, and documentation are refined.
