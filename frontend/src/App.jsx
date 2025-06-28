import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MindMap from './MindMap.jsx'
import LandingPage from './LandingPage.jsx'
import GraphPage from './GraphPage.jsx'


function MindMapApp() {
  const [assemblyAIJson, setAssemblyAIJson] = useState('')
  const [mindMapData, setMindMapData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerateMap = async () => {
    if (!assemblyAIJson.trim()) {
      setError('Please enter AssemblyAI JSON data')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Parse the JSON input
      const transcriptData = JSON.parse(assemblyAIJson)
      
      // Send to backend
      const response = await fetch('http://localhost:8000/generate-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setMindMapData(result)
    } catch (err) {
      setError(`Error: ${err.message}`)
      console.error('Error generating mind map:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setAssemblyAIJson('')
    setMindMapData(null)
    setError('')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MindStream</h1>
          <p className="text-lg text-gray-600 mb-6">
            Paste AssemblyAI JSON transcript to generate a mind map
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="assemblyAIInput" className="block text-sm font-medium text-gray-700 mb-2">
                AssemblyAI Transcript JSON:
              </label>
              <textarea
                id="assemblyAIInput"
                value={assemblyAIJson}
                onChange={(e) => setAssemblyAIJson(e.target.value)}
                placeholder="Paste your AssemblyAI transcript JSON here..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleGenerateMap}
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                {isLoading ? 'Generating...' : 'Generate Mind Map'}
              </button>
              
              <button
                onClick={handleClear}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Clear
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {mindMapData && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ✅ Mind map generated successfully! Scroll down to view.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50">
        {mindMapData ? (
          <MindMap data={mindMapData} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-xl text-gray-500">Your mind map will appear here after generation</p>
              <p className="text-sm text-gray-400 mt-2">Paste AssemblyAI JSON and click "Generate Mind Map"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mindmap" element={<MindMapApp />} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </Router>
  )
}

export default App;