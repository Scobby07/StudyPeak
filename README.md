# StudyPeak - Educational Resources Platform

StudyPeak is a content-focused educational platform designed to provide students with access to study materials, previous year questions, important topics, and time management guidance without requiring login or signup.

## Features

- **Previous Year Questions**: Access to categorized exam questions by year and difficulty level
- **Important Topics**: Guides on key topics with recommendations for efficient study
- **Study Resources**: Videos, notes, and e-books on various subjects
- **Time Management**: Study plans and recommendations for effective exam preparation

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Styling**: Custom CSS (no framework)

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or extract the project files
2. Navigate to the project directory
```bash
cd path/to/studypeak
```
3. Install dependencies
```bash
npm install
```
4. Start the server
```bash
npm start
```
5. Open your browser and navigate to `http://localhost:3000`

### Development Mode

To run the server in development mode with auto-restart:
```bash
npm run dev
```

## Project Structure

```
studypeak/
├── public/              # Static files
│   ├── css/             # Stylesheet files
│   ├── images/          # Image files
│   ├── js/              # JavaScript files
│   └── *.html           # HTML pages
├── data/                # JSON data files
│   ├── questions.json   # Questions data
│   ├── topics.json      # Topics data
│   ├── resources.json   # Resources data
│   └── timemanagement.json # Time management data
├── server.js            # Express server
└── package.json         # Project configuration
```

## Pages

1. **Home (index.html)**: Landing page with featured content and quick links
2. **Previous Year Questions (questions.html)**: Repository of exam questions
3. **Important Topics (topics.html)**: Key topics to focus on for exams
4. **Resources (resources.html)**: Study materials including videos, notes, and e-books
5. **Time Management (timemanagement.html)**: Study plans and time allocation guidance
6. **Admin (admin.html)**: Content management interface for administrators

## Data Management

The platform uses JSON files to store content, which can be edited through the Admin interface:

1. Access the admin dashboard at `http://localhost:3000/admin`
2. Use the different tabs to manage questions, topics, resources, and time management data
3. All changes are saved to the corresponding JSON files in the data directory

## Deployment

### Deploying to Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`

**Note**: When deployed on Render.com, the application uses in-memory storage instead of writing to the filesystem, which means data will be reset when the service restarts. For persistent storage in production, consider implementing a database solution.

## Future Enhancements

- AI Study Assistant for personalized recommendations
- Study Groups feature for collaborative learning
- Mobile App for on-the-go access
- User accounts for saving progress and preferences (while maintaining option for anonymous access)
- Persistent database storage for production environments

## License

This project is intended for educational purposes only.
