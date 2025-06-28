# MindStream

Transform AssemblyAI transcript JSON into structured, interactive mind maps using AI-powered analysis.

## Features

- 📝 **JSON Input**: Paste AssemblyAI transcript JSON directly
- 🧠 **AI Analysis**: Uses Google Gemini to extract hierarchical structure
- 🗺️ **Mind Map Generation**: Automatically creates visual mind maps
- 🎨 **Interactive Visualization**: Explore and interact with mind maps using React Flow
- ⚡ **Real-time Processing**: Instant mind map generation from transcript data

## Project Structure

```
MindStream/
├── backend/
│   ├── main.py             # FastAPI app with Gemini integration
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html      # Single HTML entrypoint
│   ├── src/
│   │   ├── App.jsx         # React component with JSON input
│   │   ├── index.jsx       # React entrypoint
│   │   └── MindMap.jsx     # React Flow mind map visualization
│   ├── package.json        # React + Vite dependencies + scripts
│   ├── vite.config.js      # Minimal Vite setup
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── postcss.config.js   # PostCSS configuration
│
├── sample-assemblyai.json  # Sample JSON for testing
├── start.sh                # Startup script for macOS/Linux
├── start.bat               # Startup script for Windows
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- Google API key (for Gemini)

## Quick Start

### Option 1: Using the Startup Scripts (Recommended)

#### macOS/Linux
```bash
# Make the script executable (first time only)
chmod +x start.sh

# Start both servers
./start.sh
```

#### Windows
```cmd
# Double-click start.bat or run from command prompt
start.bat
```

The startup scripts will:
- ✅ Check prerequisites (Python, Node.js, npm)
- 📦 Create virtual environments and install dependencies automatically
- 🚀 Start both backend and frontend servers
- 🔍 Verify servers are running correctly
- 🛑 Provide clean shutdown with Ctrl+C (macOS/Linux)

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   export GOOGLE_API_KEY="your-google-api-key"
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Using Startup Scripts

Simply run the appropriate startup script for your platform:

- **macOS/Linux**: `./start.sh`
- **Windows**: `start.bat`

### Manual Start

#### Start the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment (if not already activated):
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000`

#### Start the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Copy the sample JSON from `sample-assemblyai.json` or paste your own AssemblyAI transcript JSON
3. Click "Generate Mind Map" to process the transcript
4. View the interactive mind map visualization below

## API Endpoints

- `POST /generate-map` - Generate mind map from AssemblyAI transcript JSON
- `GET /health` - Health check endpoint

## Input Format

The application expects AssemblyAI transcript JSON in this format:

```json
[
  {
    "start": 0.0,
    "end": 8.5,
    "text": "Let's kick off the meeting by setting goals."
  },
  {
    "start": 8.6,
    "end": 20.3,
    "text": "We want to build a mobile-first UI."
  }
]
```

## Output Format

The backend returns a mind map structure:

```json
{
  "nodes": [
    {
      "id": "1",
      "text": "Project Planning",
      "parent": null,
      "position": {"x": 0, "y": 0}
    },
    {
      "id": "2", 
      "text": "UI Development",
      "parent": "1",
      "position": {"x": -200, "y": 100}
    }
  ]
}
```

## Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Google Gemini**: AI-powered mind map generation
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server

### Frontend
- **React**: UI library for building user interfaces
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Flow**: Interactive node-based editor for mind maps

## Development

### Backend Development

The backend uses FastAPI with automatic API documentation. Visit `http://localhost:8000/docs` to see the interactive API documentation.

### Frontend Development

The frontend uses Vite for fast development with hot module replacement and Tailwind CSS for styling. Any changes to the code will automatically reload in the browser.

## Troubleshooting

### Common Issues

1. **Port already in use**: The startup scripts will warn you if ports 8000 or 3000 are already in use. Stop any existing servers first.

2. **API key not set**: Set your environment variable:
   ```bash
   export GOOGLE_API_KEY="your-google-api-key"
   ```

3. **Dependencies not installed**: The startup scripts will automatically install dependencies, but you can also run them manually:
   ```bash
   # Backend
   cd backend && pip install -r requirements.txt
   
   # Frontend
   cd frontend && npm install
   ```

4. **Permission denied on startup script**: Make the script executable:
   ```bash
   chmod +x start.sh
   ```

5. **Invalid JSON format**: Make sure your AssemblyAI JSON follows the expected format. Use the sample file as a reference.

### Logs

If something goes wrong, check the log files created by the startup scripts:
- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 