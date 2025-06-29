import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/gallery')
      .then(res => res.json())
      .then(data => {
        setGalleryItems(data);
        setLoading(false);
      })
      .catch(err => {
        setGalleryItems([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-[#283139] px-10 py-3">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 flex-shrink-0 text-white">
            <img 
              src="/src/MindStream.png"
              alt="MindStream logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-bold tracking-tight">MindStream</h2>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-medium">Home</Link>
          <Link to="/graph" className="h-10 rounded-full bg-[#0b80ee] px-4 text-sm font-bold flex items-center">Try It Now</Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 px-10 py-16">
        <h1 className="text-4xl font-bold mb-4 text-center">Explore Our Mind Map Gallery</h1>
        <p className="text-[#9cabba] mb-12 max-w-xl text-center">Click on any mind map to explore it interactively.</p>
        {loading ? (
          <div className="text-[#9cabba] text-lg">Loading gallery...</div>
        ) : galleryItems.length === 0 ? (
          <div className="text-[#9cabba] text-lg">No mind maps found in the gallery.</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3 w-full max-w-6xl">
            {galleryItems.map((item, i) => (
              <Link to={`/mindmap/${item._id}`} key={item._id} className="group hover:scale-[1.02] transition-transform">
                <div className="bg-[#1a1f24] rounded-xl overflow-hidden shadow-md h-48 flex flex-col justify-center items-center p-6">
                  <h3 className="text-lg font-semibold mb-2">{`Mind Map #${i + 1}`}</h3>
                  {item.description && <p className="text-sm text-[#9cabba] mt-1">{item.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="flex justify-center bg-[#111518] py-10">
        <div className="flex w-full max-w-[960px] flex-col items-center gap-6 text-[#9cabba]">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((link) => (
              <a key={link} href="#" className="text-base font-normal">
                {link}
              </a>
            ))}
          </div>
          <p className="text-base">© 2024 MindStream. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
