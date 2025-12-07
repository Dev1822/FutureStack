# FutureStack 🚀

> Build Your Future, One Opportunity at a Time
> Your all-in-one opportunity tracker for internships, hackathons, and career growth

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg)](https://futurestack.venkatkolasani.xyz/)
[![Docs on Devin](https://img.shields.io/badge/Docs-Devin-6C63FF.svg)](https://app.devin.ai/wiki/Venkat-Kolasani/FutureStack)

## 📋 Table of Contents

- [Overview](#overview)
- [Demonstration Videos](#demonstration-videos)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Documentation](#-documentation)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Demonstration Video](#demonstration-video)

## 🎯 Overview

FutureStack is a modern, full-featured web application designed to help students and professionals track their career opportunities. Whether you're applying for internships, participating in hackathons, or managing multiple job applications, FutureStack provides an intuitive interface to organize, track, and manage all your opportunities in one place.

### Why FutureStack?

- **Centralized Tracking**: Keep all your opportunities in one organized dashboard
- **Visual Management**: Kanban-style status board for easy progress tracking
- **Deadline Management**: Never miss an important deadline with calendar integration
- **Comprehensive Reports**: Export detailed PDF reports for your records
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Demonstration Videos

- [Website Demonstration Video](https://drive.google.com/file/d/1qL-gTfaE4hcs98NN6SgJ33D8HyKBz06t/view?usp=drive_link) – walk through the UI, navigation, and primary flows.
- [Code Demonstration Video](https://drive.google.com/file/d/1aIHa0MnmIom3yrpk1rDdPfCrVDMuheT7/view?usp=sharing) – review the repository layout, component architecture, and deployment steps.

## ✨ Features

### Core Features

- **📊 Dashboard**: Real-time statistics and upcoming deadline tracking
- **➕ CRUD Operations**: Create, read, update, and delete opportunities
- **🔍 Search & Filter**: Quickly find opportunities by title, status, or category
- **📅 Calendar View**: Visual representation of all deadlines
- **📋 Status Board**: Kanban-style board with drag-and-drop status updates
- **📄 PDF Export**: Generate professional reports with multiple export options
- **🎨 Modern UI**: Clean, dark-themed interface with smooth animations
- **📱 Responsive**: Fully responsive design for all screen sizes

### Technical Features

- **Real-time Updates**: Instant feedback with toast notifications
- **Form Validation**: Client-side validation for data integrity
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Smooth loading indicators for better UX
- **Confirmation Modals**: Prevent accidental deletions
- **RESTful API**: Clean API architecture with Axios

## 🛠 Tech Stack

### Frontend

- **React 19.2.0** - Modern UI library with hooks
- **React Router DOM 7.9.6** - Client-side routing
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **React Icons 5.5.0** - Icon library
- **React Toastify 11.0.5** - Toast notifications
- **React Calendar 6.0.0** - Calendar component
- **jsPDF 3.0.3** - PDF generation

### Backend (Development)

- **JSON Server 1.0.0-beta.3** - Mock REST API
- **Axios 1.13.2** - HTTP client

### Development Tools

- **React Scripts 5.0.1** - Build tooling
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.22** - CSS vendor prefixing

## 📚 Documentation

- [Devin Wiki](https://app.devin.ai/wiki/Venkat-Kolasani/FutureStack) – canonical, always-current runbook with high-level decisions, architecture diagrams, and demo notes.
- Local references: `docs/ARCHITECTURE.md`, `docs/DOCUMENTATION.md`, `docs/INTEGRATION_TEST_RESULTS.md`, and `docs/PROJECT_SUMMARY.md` provide offline deep dives, test evidence, and executive summaries.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/futurestack.git
   cd futurestack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the JSON Server (Backend)**
   ```bash
   npm run server
   ```
   The API will be available at `http://localhost:3001`

4. **Start the React App (Frontend)**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

## 📁 Project Structure

```
futurestack/
├── public/                 # Static files
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/       # Common UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Navbar.jsx
│   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── DeadlineWidget.jsx
│   │   │   └── StatsCard.jsx
│   │   └── opportunities/ # Opportunity-related components
│   │       └── OpportunityForm.jsx
│   ├── pages/            # Page components (routes)
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── InternshipList.jsx
│   │   ├── HackathonList.jsx
│   │   ├── AddOpportunity.jsx
│   │   ├── EditOpportunity.jsx
│   │   ├── StatusBoard.jsx
│   │   ├── Calendar.jsx
│   │   └── Reports.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── utils/            # Utility functions
│   │   ├── dateHelpers.js
│   │   └── pdfExport.js
│   ├── App.js            # Main app component
│   ├── App.css           # Global styles
│   └── index.js          # Entry point
├── db.json               # JSON Server database
├── tailwind.config.js    # Tailwind configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## 📜 Available Scripts

### `npm start`
Runs the React app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run server`
Starts the JSON Server API at [http://localhost:3001](http://localhost:3001)

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner in interactive watch mode

## 🔌 API Documentation

### Base URL
```
http://localhost:3001
```

### Endpoints

#### Get All Opportunities
```http
GET /opportunities
```

#### Get Single Opportunity
```http
GET /opportunities/:id
```

#### Create Opportunity
```http
POST /opportunities
Content-Type: application/json

{
  "title": "Software Engineer Intern",
  "description": "Full-stack development role",
  "link": "https://example.com/apply",
  "deadline": "2025-12-31",
  "category": "internship",
  "status": "applied",
  "notes": "Prepare portfolio"
}
```

#### Update Opportunity
```http
PATCH /opportunities/:id
Content-Type: application/json

{
  "status": "shortlisted"
}
```

#### Delete Opportunity
```http
DELETE /opportunities/:id
```

## 📸 Screenshots

### Landing Page
Clean, modern landing page with animated hero section
![alt text](docs/readme-images/image.png)

### Dashboard
Real-time statistics with color-coded cards:
- **Internships** (Blue)
- **Hackathons** (Orange)
- **Shortlisted** (Yellow)
- **Selected** (Green)
![alt text](docs/readme-images/image-1.png)

### Status Board
Kanban-style board with 5 columns for visual progress tracking
![alt text](docs/readme-images/image-2.png)

### Calendar View
Interactive calendar with deadline visualization
![alt text](docs/readme-images/image-3.png)

### Reports
Flexible PDF export with multiple options
![alt text](docs/readme-images/image-4.png)

## 🎨 Design System

### Color Palette

- **Primary**: Blue (#3B82F6) - Internships, Primary actions
- **Secondary**: Orange (#F97316) - Hackathons
- **Success**: Green (#10B981) - Selected status
- **Warning**: Yellow (#F59E0B) - Shortlisted status
- **Danger**: Red (#EF4444) - Rejected status, Errors
- **Background**: Gray-900 (#111827) - Dark theme

### Typography

- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: Bold, 2xl-3xl
- **Body**: Regular, sm-base
- **Labels**: Medium, sm

## Demonstration Video

You can watch both the live website demo and an annotated code walkthrough below:

- [Website Demonstration Video](https://drive.google.com/file/d/1qL-gTfaE4hcs98NN6SgJ33D8HyKBz06t/view?usp=drive_link) – end-to-end tour of the FutureStack UI, navigation, and feature flows.
- [Code Demonstration Video](https://drive.google.com/file/d/1aIHa0MnmIom3yrpk1rDdPfCrVDMuheT7/view?usp=sharing) – explanation of the source structure, key components, and build/deployment steps.


---

