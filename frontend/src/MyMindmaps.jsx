import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function MyMindMaps() {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/mindmap")
      .then((res) => res.json())
      .then((data) => {
        setMaps(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching mindmaps:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-[#283139] px-10 py-3">
        <h2 className="text-lg font-bold">MindStream</h2>
        <Link to="/" className="text-sm font-medium hover:text-[#0b80ee]">Home</Link>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 px-10 py-16">
        <h1 className="text-4xl font-bold mb-6">My Mind Maps</h1>
        {loading ? (
          <p className="text-[#9cabba]">Loading mind maps...</p>
        ) : maps.length === 0 ? (
          <p className="text-[#9cabba]">No maps found.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 w-full max-w-5xl">
            {maps.map((map, i) => (
              <Link to={`/mindmap/${map._id}`} key={map._id}>
                <div className="bg-[#1a1f24] border border-[#283139] rounded-xl h-40 flex items-center justify-center text-xl font-semibold text-[#0b80ee] hover:bg-[#22272e] transition">
                  {map.title || `Mind Map #${i + 1}`}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
