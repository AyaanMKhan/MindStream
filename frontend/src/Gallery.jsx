import React from 'react';
import { Link } from 'react-router-dom';

const galleryItems = [
  {
    id: 'mindmap1',
    title: 'Brainstorm Session',
    description: 'A mind map for brainstorming creative ideas.',
    image: 'https://via.placeholder.com/300x180?text=Mind+Map+1',
  },
  {
    id: 'mindmap2',
    title: 'Project Roadmap',
    description: 'Visual layout of a project timeline and goals.',
    image: 'https://via.placeholder.com/300x180?text=Mind+Map+2',
  },
  {
    id: 'mindmap3',
    title: 'Startup Strategy',
    description: 'Planning out the key aspects of a startup idea.',
    image: 'https://via.placeholder.com/300x180?text=Mind+Map+3',
  },
];

export default function GalleryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-[#283139] px-10 py-3">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 text-white">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-lg font-bold tracking-tight">MindStream</h2>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/" className="text-sm font-medium">Home</Link>
          <Link to="/graph" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Graph</Link>
          <Link to="/mindmap" className="h-10 rounded-full bg-[#0b80ee] px-4 text-sm font-bold flex items-center">Try It Now</Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 px-10 py-16">
        <h1 className="text-4xl font-bold mb-4 text-center">Explore Our Mind Map Gallery</h1>
        <p className="text-[#9cabba] mb-12 max-w-xl text-center">Click on any mind map to explore it interactively.</p>
        
        <div className="grid gap-8 md:grid-cols-3 w-full max-w-6xl">
          {galleryItems.map((item) => (
            <Link to={`/mindmap/${item.id}`} key={item.id} className="group hover:scale-[1.02] transition-transform">
              <div className="bg-[#1a1f24] rounded-xl overflow-hidden shadow-md">
                <div
                  className="aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-[#9cabba] mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
