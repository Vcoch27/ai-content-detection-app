import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="w-full bg-white/80 backdrop-blur-sm shadow-sm py-4 px-10 flex justify-between items-center sticky top-0 z-50 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                    <ShieldCheck size={24} />
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-950 font-extrabold text-xl tracking-tight">AI Content<span className="text-blue-600">Verifier</span></span>
                    <span className="text-gray-400 text-xs -mt-1 font-medium">Deep Learning & CV Suite</span>
                </div>
            </div>

            <div className="flex gap-1 items-center bg-gray-50 border border-gray-100 rounded-full p-1 shadow-inner">
                <a href="#" className="py-2 px-6 bg-blue-600 text-white rounded-full text-sm font-semibold shadow">Bảng điều khiển</a>
                <a href="#" className="py-2 px-6 text-gray-700 hover:text-blue-600 rounded-full text-sm font-semibold transition">Hướng dẫn</a>
                <a href="#" className="py-2 px-6 text-gray-700 hover:text-blue-600 rounded-full text-sm font-semibold transition">Về dự án</a>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-500">MSSV: 220xxxxx</div>
                <button className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition shadow">
                    <Zap size={20} className="text-yellow-400" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;