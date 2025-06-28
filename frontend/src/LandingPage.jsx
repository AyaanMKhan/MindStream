import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
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
          <Link to="/about" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">About</Link>
          <Link to="/graph" className="text-sm font-medium hover:text-[#0b80ee] transition-colors">Graph</Link>
          <Link to="/mindmap" className="h-10 rounded-full bg-[#0b80ee] px-4 text-sm font-bold flex items-center">
            Try It Now
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-40 py-5">
        <section className="flex w-full max-w-[960px] flex-col gap-6">
          <div className="flex flex-col items-center justify-center gap-4 bg-cover bg-center p-4" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAjWFd73SpnKfsJDhVDD3UqxgSDb-R6cnMUSNg_oqNLBxQRbOKUVKIT3bnZq8uSthrP_vj7jnyUB6t-6oUEe7Xa_L2inFtBFTFki9G51498ABn3yUJ1o2tJmrabEhuTBPqCwzmxxz37wlGsxIqawqOTpJF-tLCgNZQE47rbGOUNWee1Ia--F0ioxTa1aaXW3SEdJRBLF494aHx351cijGmZvbeSp5SZoRp2lAmMZk1nLdVN-S10fZnTZ_gPjwmisbtohFjZmfTUu_dl')`
          }}>
            <h1 className="text-4xl font-black text-center leading-tight">
              Visualize Your Ideas with MindStream
            </h1>
            <p className="text-base text-center leading-normal max-w-[720px]">
              Transform complex ideas into clear, interactive mind maps. Explore
              relationships, identify patterns, and gain insights with our powerful
              visualization tools.
            </p>
            <Link to="/mindmap" className="mt-4 h-10 rounded-full bg-[#0b80ee] px-4 text-sm font-bold flex items-center justify-center">
              Try It Now
            </Link>
          </div>

          <section className="flex flex-col gap-10 pt-10">
            <div className="flex flex-col gap-4">
              <h2 className="text-[32px] font-bold leading-tight">Key Features</h2>
              <p className="text-base leading-normal max-w-[720px]">
                Explore the powerful features that make MindStream the leading
                choice for idea visualization.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  title: 'Interactive Mind Maps',
                  desc: 'Engage with your ideas through dynamic, interactive mind maps that respond to your input.',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX_a_EL58ejt0nXFcVygvPnqVIoX5zLZh8Bxah0eC-_5U07Cwv70XbyoUsfm1wNi37T4CPXWLPFOU9ukL_gunNiq_lVkofBDMMos43UssLxZbHA1eDxJD5h1jfYToTLy_8sZep8zdtybLLmwopyna-EHuz_Gq6DSWWZbOvA1QLDGSg-lbAjakgfWensQBk_xAdZDRzoDdW2q40hpTk7zcjfmowE_KUyrONUixGO52yIDOKGFVIJuGVc6zcEBlDIYWh00sRqQ6NdIgk'
                },
                {
                  title: 'Customizable Designs',
                  desc: 'Tailor your visualizations to match your brand and style with extensive customization options.',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFrFkgYvkukZYqycLJNw-V98Myer2P2wglrgEyOHV-y2yN5vRVAqSh484cDEBSFuQ-iQxodVzc7iDtIJYYxqPRSjn3M4USdJg_uknycZbaq3eRObP-e0mDKPRQjYpF5KvUKQL3KjH3jI5SBMi-OX_H1b50sOd8NYdG3lgBdYQmYn1CFcMXxJ-Aa47OHTz8LjeDdU_hmwap-au9ZP_RNtW_FFv7ZjnbaKAG4Vuf6R5SwkSgrLYtcWq8X_PeH5R4TvY8iubQhOTmV9PJ'
                },
                {
                  title: 'Collaborative Workspaces',
                  desc: 'Work together with your team on shared projects, ensuring seamless collaboration and efficient workflows.',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBov49GFam5Y-M3gY4Wi2NpELUDhxPJxb509r8kUi-VvSfKOiY9BYiG8yWdS2Gz1z4HjJpqmyD6PuIUNvTeBWnFFq_vwXDpk7URph1rBaMuKnmh2LGNUjFoxRusOEbGm40AquTsEq0tupSBQaU27aRwMG1c1-T242L6XoI8Uc5fRuMtTQ2h-FaH-oWkvB0ooyst0H_C3CXKUZI9Y1P_Zva5Hj7baN426D0qpTjnS2IUb8hm3FrwWNW71O6OTpPe27I-lM4kA1K501jT'
                }
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-3 pb-3">
                  <div className="aspect-video w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${item.img}')` }} />
                  <div>
                    <h3 className="text-base font-medium">{item.title}</h3>
                    <p className="text-sm text-[#9cabba] leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
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