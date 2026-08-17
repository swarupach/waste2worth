# Waste2Worth ♻️

Waste2Worth is a smart waste management web application that helps users identify waste, understand how to dispose of it correctly, find recycling centers, request waste pickup, and report waste-related issues.

## Features

- User Login and Registration
- AI Waste Identification
- Live Camera Scanning
- Upload Waste Images
- Waste Categorization
- Disposal Instructions
- Recycling Center Information
- Waste Pickup Requests
- Waste Reporting
- Environmental Impact Tracking
- Admin Dashboard

## Technologies Used

- React.js
- JavaScript
- Tailwind CSS
- Python
- FastAPI
- MongoDB

## How to Run

### 1. Start the Backend

Open a terminal in the project folder:

```bash
cd backend

Activate the virtual environment:

.venv\Scripts\activate

Install the required packages:

pip install -r requirements.txt

Start the backend:

uvicorn server:app --host 0.0.0.0 --port 8001 --reload

2. Start the Frontend

Open a new terminal:

cd frontend

Install dependencies:

npm install

Start the frontend:

npm start

The application will open at:

http://localhost:3000

```

## 🔄 How Waste2Worth Works

```text
                USER
                  |
                  v
          Open Waste2Worth
                  |
                  v
        Scan / Upload Waste Image
                  |
                  v
          Waste Identification
                  |
                  v
           Waste Category
                  |
                  v
       Disposal Recommendation
                  |
        +---------+---------+
        |         |         |
        v         v         v
    Recycling   Pickup    Impact
     Center     Request   Tracking
        |
        v
 Proper Waste Disposal
```
## System Archittecture
```
Waste2Worth
                         |
             +-----------+-----------+
             |                       |
             v                       v
         Frontend                 Backend
             |                       |
             v                       v
        React.js                 Python
                              FastAPI
             |                       |
             +-----------+-----------+
                         |
                         v
                  Waste Processing
                         |
                         v
                Waste Identification
                         |
                         v
              Disposal Recommendation
```

🏠 Application Modules
    User Pages
    Home
    Scan
    Disposal
    Pickup
    Impact
    Profile
    Report
    Admin Pages
    Dashboard
    Users
    Pickups
    Centers
    Reports
    Analytics
    Smart Bins
    
🗂️ Project Structure
```
Waste2Worth/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── pytest.ini
│   └── tests/
│       └── backend_test.py
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── Centers.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Pickups.jsx
│   │   │   │   ├── Reports.jsx
│   │   │   │   ├── SmartBins.jsx
│   │   │   │   └── Users.jsx
│   │   │   │
│   │   │   └── user/
│   │   │       ├── Disposal.jsx
│   │   │       ├── Home.jsx
│   │   │       ├── Impact.jsx
│   │   │       ├── Pickup.jsx
│   │   │       ├── Profile.jsx
│   │   │       ├── Report.jsx
│   │   │       └── Scan.jsx
│   │   │
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   └── index.js
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── craco.config.js
│   └── tailwind.config.js
│
├── tests/
├── test_reports/
├── memory/
├── design_guidelines.json
├── image_testing.md
├── test_result.md
├── README.md
└── .gitignore

```

Project Goal

 Waste2Worth aims to make waste segregation and responsible disposal easier by using technology to promote recycling and environmental sustainability.
