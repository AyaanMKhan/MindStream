import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

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
    try {
      const chunks = [{ start: 0.0, end: 100.0, text: inputText }];
      const response = await fetch('http://localhost:8000/generate-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      const newNodes = result.nodes.map((node, i) => ({
        id: node.id,
        data: { label: node.text },
        position: node.position || { x: 100 + (i % 3) * 200, y: 100 + Math.floor(i / 3) * 100 },
        type: node.node_type === 'input'
          ? 'input'
          : node.node_type === 'output'
          ? 'output'
          : 'default'
      }));
      const newEdges = result.nodes
        .filter((n) => n.parent)
        .map((n) => ({ id: `e${n.parent}-${n.id}`, source: n.parent, target: n.id }));
      setNodes(newNodes);
      setEdges(newEdges);
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
  };

  return (
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

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

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
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                fitViewOptions={{
                  padding: 0.2,
                  includeHiddenNodes: false,
                }}
                style={{ backgroundColor: '#1a1e23' }}
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
  );
}
