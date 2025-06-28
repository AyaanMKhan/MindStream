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

// Custom circular node component with white styling
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
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: 'white',
        border: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#111518',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
      onDoubleClick={handleDoubleClick}
      className="hover:scale-105 hover:shadow-lg"
    >
      <Handle type="target" position={Position.Top} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#9ca3af' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#9ca3af' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#9ca3af' }} />
      
      {isEditing ? (
        <form onSubmit={handleSubmit} style={{ width: '100%', padding: '12px' }}>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{
              width: '100%',
              background: '#f9fafb',
              color: '#111518',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px',
              fontSize: '14px',
              textAlign: 'center'
            }}
          />
        </form>
      ) : (
        <div style={{ padding: '12px', wordBreak: 'break-word', lineHeight: '1.3' }}>
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
  dagreGraph.setGraph({ rankdir: direction, ranksep: 200, nodesep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 140 });
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
        x: nodeWithPosition.x - 70, // Center the node
        y: nodeWithPosition.y - 70,
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
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [agentMode, setAgentMode] = useState('fast'); // 'fast' or 'langchain'
  const [modeUsed, setModeUsed] = useState('');
  const audioChunksRef = useRef([]);

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

      recorder.onstop = () => {
        console.log('➤ recorder stopped, chunks:', audioChunksRef.current.length);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('  → final blob size:', blob.size, 'bytes');
        const form = new FormData();
        form.append('audio', blob);
        fetch('/transcribe', { method: 'POST', body: form });
      };

      setMediaRecorder(recorder);
    }
    initRecorder();
  }, []);

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

  const handleGenerateGraph = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to generate a graph');
      return;
    }
    setIsLoading(true);
    setError('');
    setModeUsed('');
    try {
      const chunks = [{ start: 0.0, end: 100.0, text: inputText }];
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
        body: JSON.stringify({ chunks }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      let newNodes = [];
      let newEdges = [];
      if (agentMode === 'langchain') {
        // Expecting result.result to be a list of nodes
        if (Array.isArray(result.result)) {
          newNodes = result.result.map((node) => ({
            id: node.id,
            type: 'circular',
            data: { label: node.text },
            position: { x: 0, y: 0 },
          }));
          newEdges = result.result
            .filter((n) => n.parent)
            .map((n) => ({
              id: `e${n.parent}-${n.id}`,
              source: n.parent,
              target: n.id,
              type: 'default',
              animated: true,
              style: { stroke: '#6b7280', strokeWidth: 2 },
            }));
        }
        setModeUsed('LangChain Agent');
      } else {
        // Classic fast mode
        newNodes = result.nodes.map((node) => ({
          id: node.id,
          type: 'circular',
          data: { label: node.text },
          position: { x: 0, y: 0 },
        }));
        newEdges = result.nodes
          .filter((n) => n.parent)
          .map((n) => ({
            id: `e${n.parent}-${n.id}`,
            source: n.parent,
            target: n.id,
            type: 'default',
            animated: true,
            style: { stroke: '#6b7280', strokeWidth: 2 },
          }));
        setModeUsed('Classic Fallback');
      }
      // Apply Dagre layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setError('');
    setModeUsed('');
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-8px);
          }
          70% {
            transform: translateY(-4px);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
      
    <div className="relative flex w-full min-h-screen flex-col bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-solid border-[#283139] px-10 py-3">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 flex-shrink-0 text-white">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">MindStream</h2>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Home</Link>
          <Link to="/mindmap" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Mind Map</Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-10 py-5">
        <div className="max-w-4xl mx-auto w-full mb-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-[#0b80ee] to-[#0ea5e9] bg-clip-text text-transparent">
              Graph Generator
            </h1>
            <p className="text-lg text-[#9cabba] mb-6">
              Enter text below and generate an interactive mind map using AI
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="textInput" className="block text-sm font-medium text-[#9cabba] mb-2">
                Enter your text to analyze:
              </label>
              <textarea
                id="textInput"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter any text, ideas, or concepts you want to visualize as a mind map..."
                className="w-full h-32 px-4 py-3 bg-[#283139] border border-[#3a4549] rounded-lg text-white placeholder-[#9cabba] focus:outline-none focus:ring-2 focus:ring-[#0b80ee] focus:border-[#0b80ee] resize-none"
              />
            </div>

            {/* Mode toggle dropdown */}
            <div className="flex items-center gap-4">
              <label htmlFor="agentMode" className="text-sm font-medium text-[#9cabba]">Mode:</label>
              <select
                id="agentMode"
                value={agentMode}
                onChange={e => setAgentMode(e.target.value)}
                className="bg-[#283139] border border-[#3a4549] rounded-lg px-3 py-2 text-white"
              >
                <option value="fast">⚡ Fast Mode (classic)</option>
                <option value="langchain">🧠 Smart Agent (LangChain)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
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
                className="px-4 py-2 bg-[#0b80ee] rounded-lg font-medium"
              >
                {isRecording ? 'Stop' : 'Mic'}
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleGenerateGraph}
                disabled={isLoading}
                className="bg-[#0b80ee] hover:bg-[#0969da] disabled:bg-[#283139] disabled:text-[#9cabba] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {isLoading ? 'Generating Graph...' : 'Generate Graph'}
              </button>

              <button
                onClick={handleClear}
                className="bg-[#283139] hover:bg-[#3a4549] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Clear
              </button>
            </div>

            {modeUsed && (
              <div className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg">
                Used: {modeUsed}
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Graph Section */}
        <div className="flex-1 max-w-6xl mx-auto w-full">
          <div
            style={{
              width: '100%',
              height: '70vh',
              border: '2px solid #283139',
              borderRadius: '12px',
              backgroundColor: '#1a1e23',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40px',
                backgroundColor: '#283139',
                borderBottom: '1px solid #3a4549',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#9cabba',
                zIndex: 10
              }}
            >
              Interactive Graph Editor
            </div>
            
            {/* Loading Overlay */}
            {isLoading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(26, 30, 35, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20
                }}
              >
                <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Spinning loader */}
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      border: '4px solid #283139',
                      borderTop: '4px solid #0b80ee',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '24px'
                    }}
                  ></div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Generating Mind Map
                  </h3>
                  <p className="text-[#9cabba] mb-4">
                    {agentMode === 'langchain' ? 'Using Smart Agent (LangChain)...' : 'Using Fast Mode...'}
                  </p>
                  
                  {/* Animated dots */}
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-[#0b80ee] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#0b80ee] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#0b80ee] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  
                  <p className="text-sm text-[#9cabba] mt-4">
                    AI is analyzing your text and creating connections...
                  </p>
                </div>
              </div>
            )}
            
            <div
              style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                marginTop: '40px'
              }}
            >
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
                style={{ backgroundColor: '#1a1e23' }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#6b7280', strokeWidth: 2 },
                }}
              >
                <Background color="#283139" />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex justify-center bg-[#111518] py-6 border-t border-[#283139]">
        <div className="flex w-full max-w-[960px] flex-col items-center gap-4 text-[#9cabba]">
          <p className="text-sm">Graph Page - AI-Powered Mind Map Generator</p>
        </div>
      </footer>
    </div>
    </>
  );
}