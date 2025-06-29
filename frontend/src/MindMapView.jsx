import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

// Custom circular node (copied from GraphPage.jsx)
const CircularNode = ({ data }) => {
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
      className="hover:scale-110 hover:shadow-2xl"
    >
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
      <div style={{ 
        padding: '16px', 
        wordBreak: 'break-word', 
        lineHeight: '1.4',
        position: 'relative',
        zIndex: 2,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        {data.label}
      </div>
    </div>
  );
};
const nodeTypes = { circular: CircularNode };

export default function MindMapView() {
  const { id } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/mindmap/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // Convert nodes to circular type for consistency
        const newNodes = (data.nodes || []).map(node => ({
          ...node,
          type: 'circular',
          data: { label: node.data?.label || node.text || node.label || '' }
        }));
        setNodes(newNodes);
        setEdges((data.edges || []).map(edge => ({
          ...edge,
          type: 'default',
          animated: true,
          style: { stroke: '#667eea', strokeWidth: 3 },
        })));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch mindmap:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="w-full h-screen bg-[#111518] text-white" style={{ fontFamily: 'Inter, \"Noto Sans\", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-[#283139] px-10 py-3">
        <h2 className="text-lg font-bold">MindStream</h2>
        <Link
          to="/my-mindmaps"
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-sm font-medium backdrop-blur-sm ml-4"
        >
          My Mindmaps
        </Link>
      </header>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#111518] text-white"
        minZoom={0.0001}
        maxZoom={10}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#667eea', strokeWidth: 3 },
        }}
      >
        <Background color="#667eea" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
