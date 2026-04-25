import React from 'react';
import { NavLink } from 'react-router-dom';
import * as Icons from './Icons';

const Sidebar = () => {
    return (
        <div className="w-64 bg-zinc-900 min-h-screen text-white p-6 flex flex-col gap-8">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Icons.InfoIcon className="text-white h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">LOGIX WMS</h1>
            </div>
            
            <nav className="flex flex-col gap-2">
                <NavLink 
                    to="/" 
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                >
                    <Icons.SearchIcon className="h-5 w-5" />
                    <span>Inventario (250)</span>
                </NavLink>
                
                <NavLink 
                    to="/config" 
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                >
                    <Icons.UploadIcon className="h-5 w-5" />
                    <span>Configuración</span>
                </NavLink>
            </nav>

            <div className="mt-auto pt-6 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center">v1.0.0 Refactored</p>
            </div>
        </div>
    );
};

export default Sidebar;
