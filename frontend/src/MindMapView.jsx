import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export default function MindMapView() {
  const { id } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/mindmap/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch mindmap:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="w-full h-screen bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-[#283139] px-10 py-3">
        <h2 className="text-lg font-bold">MindStream</h2>
      </header>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-[#111518] text-white"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
