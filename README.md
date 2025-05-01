# Google Sheets Web App

A simple web application that uses Google Sheets as a backend to store and retrieve data.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up Google Sheets API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Sheets API
   - Create credentials (API key)
   - Create a new Google Sheet and note its ID (from the URL)

3. Create a `.env` file in the root directory with the following content:
```
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

4. In your Google Sheet, create a sheet named "Sheet1" with the following columns:
   - Name
   - Email
   - Phone
   - Message

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Features

- Submit data through a form that gets stored in Google Sheets
- View all existing data in a table format
- Real-time updates when new data is added

## API Endpoints

- `GET /api/data` - Retrieve all data from the sheet
- `POST /api/data` - Add new data to the sheet 