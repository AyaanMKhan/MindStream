import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="relative flex w-full min-h-screen flex-col bg-[#111518] text-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <header className="flex items-center justify-between border-b border-solid border-[#283139] px-10 py-3">
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
          <Link to="/" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Home</Link>
          <Link to="/graph" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Graph</Link>
          <Link to="/mindmap" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Mind Map</Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-10 py-16">
        <div className="max-w-4xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-[#0b80ee] to-[#0ea5e9] bg-clip-text text-transparent">
              About MindStream
            </h1>
            <p className="text-xl text-[#9cabba] leading-relaxed max-w-3xl mx-auto">
              Transforming the way we visualize ideas, concepts, and knowledge through 
              intelligent mind mapping powered by cutting-edge AI technology.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <div className="bg-[#1a1e23] border border-[#283139] rounded-xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-[#9cabba] leading-relaxed text-center max-w-3xl mx-auto">
                We believe that complex ideas should be simple to understand and share. 
                MindStream empowers individuals, teams, and organizations to break down 
                complicated concepts into clear, interactive visual representations that 
                enhance learning, collaboration, and decision-making.
              </p>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose MindStream?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "🧠",
                  title: "AI-Powered Intelligence",
                  description: "Advanced machine learning algorithms analyze your content and automatically create meaningful connections and hierarchies."
                },
                {
                  icon: "⚡",
                  title: "Lightning Fast",
                  description: "Generate comprehensive mind maps in seconds, not hours. Our optimized processing ensures rapid results."
                },
                {
                  icon: "🎨",
                  title: "Beautiful Visualizations",
                  description: "Clean, modern designs with customizable styling that makes your ideas shine and easy to understand."
                },
                {
                  icon: "🔄",
                  title: "Interactive Experience",
                  description: "Drag, drop, edit, and connect nodes in real-time. Your mind maps are living documents that evolve with your thinking."
                },
                {
                  icon: "🎯",
                  title: "Smart Layouts",
                  description: "Automatic tree layouts using advanced algorithms ensure your mind maps are always well-organized and readable."
                },
                {
                  icon: "🚀",
                  title: "Continuous Innovation",
                  description: "Regular updates with new features, improved AI models, and enhanced user experience based on community feedback."
                }
              ].map((feature, index) => (
                <div key={index} className="bg-[#1a1e23] border border-[#283139] rounded-xl p-6 hover:border-[#0b80ee] transition-colors">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-[#9cabba] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Technology Section */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-[#0b80ee]/10 to-[#0ea5e9]/10 border border-[#0b80ee]/20 rounded-xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Powered by Advanced Technology</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-[#0b80ee]">AI & Machine Learning</h3>
                  <ul className="space-y-2 text-[#9cabba]">
                    <li>• Google's Gemini AI for natural language processing</li>
                    <li>• LangChain integration for advanced reasoning</li>
                    <li>• Intelligent content analysis and categorization</li>
                    <li>• Automatic relationship detection</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-[#0b80ee]">Modern Web Technologies</h3>
                  <ul className="space-y-2 text-[#9cabba]">
                    <li>• React.js for responsive user interfaces</li>
                    <li>• ReactFlow for interactive graph visualizations</li>
                    <li>• FastAPI backend for high-performance processing</li>
                    <li>• Real-time audio processing capabilities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Built with Passion</h2>
            <div className="bg-[#1a1e23] border border-[#283139] rounded-xl p-8 text-center">
              <p className="text-lg text-[#9cabba] leading-relaxed max-w-3xl mx-auto mb-6">
                MindStream is crafted by a dedicated team of developers, designers, and AI researchers 
                who are passionate about making knowledge visualization accessible to everyone. 
                We combine technical excellence with user-centered design to create tools that 
                truly make a difference in how people think and work.
              </p>
              <div className="flex justify-center items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0b80ee] to-[#0ea5e9] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">MS</span>
                </div>
                <div>
                  <p className="font-semibold">The MindStream Team</p>
                  <p className="text-sm text-[#9cabba]">Innovating the future of visual thinking</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sources Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Research & Sources</h2>
            <div className="bg-[#1a1e23] border border-[#283139] rounded-xl p-8">
              <p className="text-lg text-[#9cabba] leading-relaxed mb-6 text-center">
                The present study showed that metacognitive training using Mind Maps improves the ability to inhibit the response in children with ADHD
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-[#0b80ee] pl-6">
                  <h3 className="text-xl font-semibold mb-2">The Influence of Metacognitive Strategies on the Improvement of Reaction Inhibition Processes in Children with ADHD
                  </h3>
                  <p className="text-[#9cabba] mb-3">
                    Research shows that visual representations and mind mapping significantly enhance 
                    learning outcomes, memory retention, and knowledge organization.
                  </p>
                  <a 
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7908166/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#0b80ee] hover:text-[#0ea5e9] transition-colors font-medium"
                  >
                    <span>View Research Paper</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <div className="bg-gradient-to-r from-[#0b80ee] to-[#0ea5e9] rounded-xl p-8">
              <h2 className="text-3xl font-bold mb-4 text-white">Ready to Transform Your Ideas?</h2>
              <p className="text-white/90 mb-6 text-lg">
                Join thousands of users who are already visualizing their thoughts with MindStream.
              </p>
              <div className="flex justify-center gap-4">
                <Link 
                  to="/graph" 
                  className="bg-white text-[#0b80ee] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Try Graph Generator
                </Link>
                <Link 
                  to="/mindmap" 
                  className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Explore Mind Maps
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="flex justify-center bg-[#111518] py-10 border-t border-[#283139]">
        <div className="flex w-full max-w-[960px] flex-col items-center gap-6 text-[#9cabba]">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((link) => (
              <a key={link} href="#" className="text-base font-normal hover:text-white transition-colors">
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