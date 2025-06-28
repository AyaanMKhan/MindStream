import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'

const MindMap = ({ data }) => {
  // Convert backend data format to react-flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = data.nodes.map(node => ({
      id: node.id,
      type: 'default',
      position: node.position || { x: 0, y: 0 },
      data: { label: node.text },
      style: {
        background: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        minWidth: '120px',
        textAlign: 'center',
      },
    }))

    // Create edges from parent-child relationships
    const edges = data.nodes
      .filter(node => node.parent)
      .map(node => ({
        id: `e${node.parent}-${node.id}`,
        source: node.parent,
        target: node.id,
        type: 'smoothstep',
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 3,
          strokeDasharray: 'none',
        },
      }))

    return { nodes, edges }
  }, [data])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  return (
    <div style={{ width: '100%', height: '70vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
      >
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background 
          variant="dots" 
          gap={20} 
          size={1} 
          color="#d1d5db"
        />
      </ReactFlow>
    </div>
  )
}

export default MindMap 