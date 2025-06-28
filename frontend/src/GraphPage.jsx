import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// Custom circular node component with enhanced styling
const CircularNode = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
    data.label = label;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div 
      style={{
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '3px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        fontWeight: '700',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onDoubleClick={handleDoubleClick}
      className="hover:scale-110 hover:shadow-2xl"
    >
      {/* Animated background gradient */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          animation: 'shimmer 2s infinite',
          borderRadius: '50%'
        }}
      />
      
      <Handle type="target" position={Position.Top} style={{ background: '#667eea', border: '2px solid white' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#667eea', border: '2px solid white' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#667eea', border: '2px solid white' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#667eea', border: '2px solid white' }} />
      
      {isEditing ? (
        <form onSubmit={handleSubmit} style={{ width: '100%', padding: '16px', position: 'relative', zIndex: 2 }}>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />
        </form>
      ) : (
        <div style={{ 
          padding: '16px', 
          wordBreak: 'break-word', 
          lineHeight: '1.4',
          position: 'relative',
          zIndex: 2,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

// Define custom node types
const nodeTypes = {
  circular: CircularNode,
};

// Dagre layout function
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 250, nodesep: 200 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 160, height: 160 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 80,
        y: nodeWithPosition.y - 80,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const initialNodes = [];
const initialEdges = [];

export default function GraphPage() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [agentMode, setAgentMode] = useState('fast');
  const [modeUsed, setModeUsed] = useState('');
  const [toolLog, setToolLog] = useState([]);
  const [mcpToolCalls, setMcpToolCalls] = useState([]);
  const [transcriptionStatus, setTranscriptionStatus] = useState('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // initialize recorder once
  useEffect(() => {
    async function initRecorder() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
  
      recorder.ondataavailable = (e) => {
        console.log('➤ ondataavailable chunk:', e.data, 'size:', e.data.size);
        audioChunksRef.current.push(e.data);
        console.log('  → total chunks now:', audioChunksRef.current.length);
      };
  
      recorder.onstop = async () => {
        console.log('➤ recorder stopped, chunks:', audioChunksRef.current.length);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('  → final blob size:', blob.size, 'bytes');
        await uploadAudio(blob);
      };
  
      setMediaRecorder(recorder);
    }
    initRecorder();
  }, []);

  const uploadAudio = async (audioBlob) => {
    const form = new FormData();
    form.append('audio', audioBlob);

    setTranscriptionStatus('processing');
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: form
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTranscribedText(data.text || '');
      setTranscriptionStatus('completed');
      
      await generateMindMapFromTranscription(data.chunks);
      
    } catch (err) {
      console.error('Transcribe error:', err);
      setError(`Transcription error: ${err.message}`);
      setTranscriptionStatus('error');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    setUploadedFile(file);
    setTranscriptionStatus('processing');
    setError('');

    try {
      const form = new FormData();
      form.append('audio', file);

      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: form
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTranscribedText(data.text || '');
      setTranscriptionStatus('completed');
      
      await generateMindMapFromTranscription(data.chunks);
      
    } catch (err) {
      console.error('File upload error:', err);
      setError(`Upload error: ${err.message}`);
      setTranscriptionStatus('error');
    }
  };

  const generateMindMapFromTranscription = async (chunks) => {
    if (!chunks || chunks.length === 0) {
      setError('No transcription data available');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setModeUsed('');
    setToolLog([]);
    setMcpToolCalls([]);
    
    try {
      const session_id = 'demo-session';
      const payload = { session_id, chunks };
      const endpoint =
        agentMode === 'langchain'
          ? 'http://localhost:8000/generate-map/langchain'
          : 'http://localhost:8000/generate-map';
          
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.tool_log && Array.isArray(result.tool_log)) {
        setToolLog(result.tool_log);
      } else {
        setToolLog(agentMode === 'langchain'
          ? ['extract_structure', 'merge_maps']
          : ['extract_structure', 'merge_maps']);
      }

      if (result.mcp_tool_calls && Array.isArray(result.mcp_tool_calls)) {
        setMcpToolCalls(result.mcp_tool_calls);
      }

      let newNodes = [];
      let newEdges = [];
      if (agentMode === 'langchain') {
        let nodesData = [];
        console.log('Agentic AI result:', result.result);
        console.log('Result type:', typeof result.result);

        if (typeof result.result === 'string') {
          const jsonMatches = result.result.match(/\{[\s\S]*\}/g);
          if (jsonMatches && jsonMatches.length > 0) {
            for (let i = jsonMatches.length - 1; i >= 0; i--) {
              try {
                const obj = JSON.parse(jsonMatches[i]);
                if (obj.nodes && Array.isArray(obj.nodes)) {
                  nodesData = obj.nodes;
                  break;
                }
              } catch (_) {
                continue;
              }
            }
          }
        } else if (Array.isArray(result.result)) {
          nodesData = result.result;
        }

        console.log('Final nodesData:', nodesData);

        if (nodesData.length > 0) {
          const cleanedNodesData = nodesData.map(node => ({
            id: node.id,
            text: node.text,
            parent: node.parent === 'None' || node.parent === null ? null : node.parent
          }));
          
          newNodes = cleanedNodesData.map((node) => ({
            id: node.id,
            type: 'circular',
            data: { label: node.text },
            position: { x: 0, y: 0 },
          }));
          newEdges = cleanedNodesData
            .filter((n) => n.parent && n.parent !== 'None' && n.parent !== null)
            .map((n) => ({
              id: `e${n.parent}-${n.id}`,
              source: n.parent,
              target: n.id,
              type: 'default',
              animated: true,
              style: { stroke: '#667eea', strokeWidth: 3 },
            }));
          
          console.log('Created nodes:', newNodes);
          console.log('Created edges:', newEdges);
        }

        setModeUsed('Agentic AI (MCP)');
      } else {
        const cleanedNodes = result.nodes.map(node => ({
          id: node.id,
          text: node.text,
          parent: node.parent === 'None' || node.parent === null ? null : node.parent
        }));
        
        newNodes = cleanedNodes.map((node) => ({
          id: node.id,
          type: 'circular',
          data: { label: node.text },
          position: { x: 0, y: 0 },
        }));
        newEdges = cleanedNodes
          .filter((n) => n.parent && n.parent !== 'None' && n.parent !== null)
          .map((n) => ({
            id: `e${n.parent}-${n.id}`,
            source: n.parent,
            target: n.id,
            type: 'default',
            animated: true,
            style: { stroke: '#667eea', strokeWidth: 3 },
          }));
        setModeUsed('Classic LLM');
      }
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      await fetch('http://localhost:8000/api/save-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'MindMap', // Optional: small title
          modeUsed,
          nodes: layoutedNodes,
          edges: layoutedEdges,
          timestamp: new Date().toISOString(),
        })
      });
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setToolLog([]);
      setMcpToolCalls([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const handleClear = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setError('');
    setModeUsed('');
    setTranscriptionStatus('idle');
    setTranscribedText('');
    setUploadedFile(null);
    setToolLog([]);
    setMcpToolCalls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
          40%, 43% { transform: translateY(-8px); }
          70% { transform: translateY(-4px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
        }
        
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-bounce { animation: bounce 1s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-[#181c24] via-[#23243a] to-[#181c24] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Header */}
        <header className="relative z-10 glass-effect border-b border-white/10 bg-gradient-to-br from-[#181c24] via-[#23243a] to-[#181c24]">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                  <img src="src/MindStream.png" alt="MindStream Logo" className="w-15 h-15" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">MindStream</h1>
                  <p className="text-sm text-gray-300">AI-Powered Mind Mapping</p>
                </div>
              </div>
              <Link to="/" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-sm font-medium backdrop-blur-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-6 gradient-text">
              Graph Generator
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Transform your audio into beautiful, interactive mind maps using cutting-edge AI technology
            </p>
          </div>

          {/* Control Panel */}
          <div className="glass-effect rounded-2xl p-8 mb-8 shadow-2xl max-w-4xl mx-auto bg-[#23243a]/80 border border-[#2d2f4a]">
            <div className="space-y-8">
              {/* Audio Input Section */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-200 mb-6">Audio Input</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {/* File Upload */}
                  <div className="glass-effect rounded-xl p-6 bg-[#23243a] border border-[#2d2f4a]">
                    <div className="text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Audio File
                      </label>
                      <p className="text-sm text-gray-400 mt-2">MP3, WAV, or other audio formats</p>
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                        <p className="text-sm text-green-300">
                          File: {uploadedFile.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Voice Recording */}
                  <div className="glass-effect rounded-xl p-6 bg-[#23243a] border border-[#2d2f4a]">
                    <div className="text-center">
                      <span className="text-sm font-semibold text-gray-200 block mb-4">Voice Recording</span>
                      <button
                        onClick={() => {
                          if (!mediaRecorder) return;
                          if (!isRecording) {
                            audioChunksRef.current = [];
                            mediaRecorder.start();
                            setIsRecording(true);
                          } else {
                            mediaRecorder.stop();
                            setIsRecording(false);
                          }
                        }}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        }`}
                      >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    </div>
                    
                    {transcriptionStatus !== 'idle' && (
                      <div className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${
                        transcriptionStatus === 'processing' 
                          ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                          : transcriptionStatus === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : transcriptionStatus === 'error'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {transcriptionStatus === 'processing' && 'Transcribing...'}
                        {transcriptionStatus === 'completed' && 'Transcribed'}
                        {transcriptionStatus === 'error' && 'Error'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-4">
                  <label className="text-sm font-semibold text-gray-200">AI Mode:</label>
                  <select
                    value={agentMode}
                    onChange={e => setAgentMode(e.target.value)}
                    className="glass-effect rounded-lg px-4 py-2 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="fast">Classic LLM (Fast)</option>
                    <option value="langchain">Agentic AI (MCP)</option>
                  </select>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-4 max-w-2xl mx-auto">
                {transcribedText && (
                  <div className="glass-effect rounded-xl p-6 bg-[#23243a] border border-[#2d2f4a]">
                    <h4 className="font-semibold text-gray-200 mb-3 text-center">Transcribed Text</h4>
                    <div className="bg-black/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {transcribedText}
                      </p>
                    </div>
                  </div>
                )}

                {modeUsed && (
                  <div className="glass-effect border border-blue-500/30 text-blue-300 px-6 py-4 rounded-xl text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="font-semibold">Mode Used: {modeUsed}</span>
                    </div>
                  </div>
                )}

                {agentMode === 'langchain' && mcpToolCalls.length > 0 && (
                  <div className="glass-effect border border-purple-500/30 text-purple-300 px-6 py-4 rounded-xl">
                    <div className="font-semibold mb-3 text-center">
                      <span className="text-purple-400 mr-2">Tools</span>
                      Agentic AI Tool Execution:
                    </div>
                    <div className="space-y-2">
                      {mcpToolCalls.map((toolCall, index) => (
                        <div key={index} className="flex items-center justify-center text-sm">
                          <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-purple-200 font-medium">{toolCall.tool}</span>
                          {toolCall.args && (
                            <span className="text-purple-400 ml-2 text-xs">
                              ({Object.keys(toolCall.args).join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agentMode === 'langchain' && toolLog.length > 0 && !mcpToolCalls.length && (
                  <div className="glass-effect border border-blue-500/30 text-blue-300 px-6 py-4 rounded-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-blue-400 mr-2">Agent</span>
                      <span>
                        used {toolLog.join(' ➝ ')} to form this mind map.
                      </span>
                    </div>
                  </div>
                )}

                {agentMode === 'langchain' && mcpToolCalls.length > 0 && (
                  <div className="glass-effect border border-blue-500/30 text-blue-300 px-6 py-4 rounded-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-blue-400 mr-2">Agent</span>
                      <span>
                        used {mcpToolCalls.map(tc => tc.tool).join(' ➝ ')} to form this mind map.
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="glass-effect border border-red-500/30 text-red-300 px-6 py-4 rounded-xl text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-red-400 mr-2">Error</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="text-center">
                <button
                  onClick={handleClear}
                  className="px-8 py-4 glass-effect hover:bg-white/20 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Graph Section */}
          <div className="flex justify-center items-center" style={{ minHeight: '90vh' }}>
            <div className="glass-effect rounded-2xl shadow-2xl overflow-hidden bg-[#23243a] border border-[#2d2f4a] w-full max-w-6xl" style={{ height: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="flex-1 flex flex-col justify-center">
                <div className="h-full" style={{ minHeight: '70vh' }}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    fitViewOptions={{
                      padding: 0.3,
                      includeHiddenNodes: false,
                      minZoom: 0.4,
                      maxZoom: 1.2,
                    }}
                    style={{ backgroundColor: 'transparent', height: '100%' }}
                    defaultEdgeOptions={{
                      type: 'smoothstep',
                      animated: true,
                      style: { stroke: '#667eea', strokeWidth: 3 },
                    }}
                  >
                    <Background color="#667eea" gap={20} size={1} />
                    <Controls className="glass-effect" />
                  </ReactFlow>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 glass-effect border-t border-[#2d2f4a] mt-12 bg-[#181c24]">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center">
            <p className="text-gray-400">
              Powered by cutting-edge AI technology • Transform your ideas into visual brilliance
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}