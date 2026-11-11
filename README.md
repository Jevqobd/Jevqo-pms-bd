# Jevqo PMS BD

A custom cloud ERP platform for sportswear manufacturing operations. The application is designed to support multi-factory workflows across Head Office, Print Factory, Sewing Factory, Supply Chain, Accounting, HR/Payroll, Customer Management, and operational reporting.

This project is built with React + Vite + TypeScript and integrates Firebase services for authentication, Firestore data persistence, and AI-powered workplace assistance through Gemini.

## Overview

Jevqo PMS BD centralizes the operational workflow for a sportswear business, helping teams manage:

- Production and order lifecycle tracking
- Inventory and stock visibility
- Purchase and supplier management
- Customer and B2B client operations
- Accounting and financial reporting
- HR and payroll workflows
- Shortage and exception management
- Documents and SOP access
- AI-based assistant support for day-to-day operational decisions

## Key Features

- Multi-module ERP dashboard
- Order management and production coordination
- Inventory and shortage ticket tracking
- Customer, vendor, and employee management
- HR and payroll module
- Accounting and financial insights
- Head office and factory-specific views
- AI assistant integration via Gemini
- Firebase-backed authentication and data layer
- Progressive Web App (PWA) support

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication + Firestore
- Google Gemini API
- PWA / service worker support

## Project Structure

```bash
.
├── public/                      # Static assets, icons, manifest, service worker
├── src/
│   ├── components/             # ERP modules and UI screens
│   ├── firebase/               # Firebase config and auth utilities
│   ├── services/               # ERP storage, seed data, AI service integration
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Utility helpers
│   ├── App.tsx                 # Main application shell
│   ├── main.tsx                # Application entry
│   └── index.css               # Global styling
├── .env.example                # Sample environment variables
├── .gitignore
├── firebase-blueprint.json      # Firebase blueprint artefact
├── firestore.rules             # Firestore security rules
├── index.html                  # Vite HTML entry
├── metadata.json               # Repository metadata
├── package.json                # Project scripts and dependencies
├── server.ts                  # Backend/server entry
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── bun.lock                    # Bun lockfile
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or Bun package manager
- Firebase project access
- Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Jevqobd/Jevqo-pms-bd.git
cd Jevqo-pms-bd
```

2. Install dependencies:

```bash
npm install
```

or:

```bash
bun install
```

3. Set up environment variables:

Copy the sample file and configure your secrets:

```bash
cp .env.example .env
```

Update the values for:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `APP_URL`: The application URL for the deployed or local environment

4. Configure Firebase:

This app expects a Firebase config file in the project root or configured environment as required by the app runtime. Create the required Firebase app config file used by the app (`firebase-applet-config.json`), matching your Firebase project settings.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Environment Notes

The project includes a `.env.example` with the expected keys for AI configuration and app URL. The app also integrates with Firebase using a project-specific config and Firestore database configuration.

## Deployment

This repository is configured as a Vite-based web application and can be deployed to a static hosting or app runtime environment that supports the necessary Firebase and Gemini dependencies. The app also includes PWA-related assets and service worker support.

## License

This project is provided as-is for internal or custom deployment use. Please check the repository license and project ownership before production deployment or redistribution.

## Notes

This repo represents a highly customized ERP system for sportswear manufacturing and may require environment-specific configuration and business logic adaptation before use in a live production environment.

## Contributing

Contributions are welcome if you are working within the project ownership and deployment constraints of the repository. For enterprise or production usage, it is recommended to validate the configuration, security rules, and Firebase permissions before releasing changes to end users.
