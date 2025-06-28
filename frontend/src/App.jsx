import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MindMap from './MindMap.jsx'
import LandingPage from './LandingPage.jsx'
import GraphPage from './GraphPage.jsx'
import GalleryPage from './Gallery.jsx'
import AboutPage from './AboutPage.jsx'
import MyMindMaps from './MyMindmaps.jsx'
import MindMapView from './MindMapView.jsx'
function MindMapApp() {
  const [assemblyAIJson, setAssemblyAIJson] = useState('')
  const [mindMapData, setMindMapData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Audio upload states
  const [audioFile, setAudioFile] = useState(null)
  const [transcriptId, setTranscriptId] = useState(null)
  const [transcriptionStatus, setTranscriptionStatus] = useState('idle') // idle, uploading, processing, completed, error
  const [transcriptData, setTranscriptData] = useState(null)

  const handleAudioUpload = async (file) => {
    if (!file) return
    
    setAudioFile(file)
    setTranscriptionStatus('uploading')
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('http://localhost:8000/upload-audio', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setTranscriptId(result.transcript_id)
      setTranscriptData(result.chunks)
      setTranscriptionStatus('completed')
      
      console.log('✅ Audio transcribed successfully:', result)
      
    } catch (err) {
      setError(`Transcription error: ${err.message}`)
      setTranscriptionStatus('error')
      console.error('Error transcribing audio:', err)
    }
  }

  const handleGenerateMapFromTranscript = async () => {
    if (!transcriptId) {
      setError('No transcript available')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`http://localhost:8000/generate-map-from-transcript/${transcriptId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({
          session_id: `session_${Date.now()}`
        }),
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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
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
    setAudioFile(null)
    setTranscriptId(null)
    setTranscriptionStatus('idle')
    setTranscriptData(null)
  }

  const getStatusMessage = () => {
    switch (transcriptionStatus) {
      case 'uploading':
        return '📤 Uploading audio file...'
      case 'processing':
        return '🔄 Processing audio with AssemblyAI...'
      case 'completed':
        return '✅ Audio transcribed successfully! Ready to generate mind map.'
      case 'error':
        return '❌ Transcription failed. Please try again.'
      default:
        return ''
    }
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
            Upload audio or paste AssemblyAI JSON to generate a mind map
          </p>
          
          <div className="space-y-6">
            {/* Audio Upload Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎤 Audio Upload</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Audio File:
                  </label>
                  <input
                    type="file"
                    id="audioFile"
                    accept="audio/*"
                    onChange={(e) => handleAudioUpload(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                {transcriptionStatus !== 'idle' && (
                  <div className={`p-3 rounded-md ${
                    transcriptionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    transcriptionStatus === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {getStatusMessage()}
                  </div>
                )}
                
                {transcriptData && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-gray-900 mb-2">📝 Transcript Preview:</h4>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {transcriptData.map((chunk, index) => (
                        <div key={index} className="mb-1">
                          <span className="font-medium">Speaker {chunk.speaker}:</span> {chunk.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {transcriptionStatus === 'completed' && (
                  <button
                    onClick={handleGenerateMapFromTranscript}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
                  >
                    {isLoading ? 'Generating...' : 'Generate Mind Map from Audio'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Manual JSON Input Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📄 Manual JSON Input</h3>
              
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
                
                <button
                  onClick={handleGenerateMap}
                  disabled={isLoading}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  {isLoading ? 'Generating...' : 'Generate Mind Map from JSON'}
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleClear}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Clear All
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
              <p className="text-sm text-gray-400 mt-2">Upload audio or paste AssemblyAI JSON to get started</p>
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
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/mymindmaps" element={<MyMindMaps />}/>
        <Route path="/mindmap/:id" element={<MindMapView />}/>
      </Routes>
    </Router>
  )
}

export default App;