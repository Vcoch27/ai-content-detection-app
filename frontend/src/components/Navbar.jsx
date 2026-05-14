import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/85 px-6 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-slate-950">
              HyperID AI Detector
            </span>
            <span className="text-xs font-medium text-slate-500">Deep Learning & CV Suite</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-600 md:flex">
          <a href="#" className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-sm">
            Dashboard
          </a>
          <a href="#" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-blue-700">
            Guide
          </a>
          <a href="#" className="rounded-full px-4 py-2 transition hover:bg-white hover:text-blue-700">
            About
          </a>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800">
          <Zap size={18} className="text-amber-300" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
