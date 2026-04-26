import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio / Panel', path: '/dashboard' },
    { id: 'inventory', label: 'Maestro Items', path: '/' },
    { id: 'analysis', label: 'Análisis Masivo', path: '/analysis' },
    { id: 'config', label: 'Reglas Slotting', path: '/config' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white text-black z-10 border-r border-zinc-200 antialiased">
      <div className="p-6 border-b border-zinc-100">
        <div className="flex flex-col">
          <h1 className="text-xl font-normal text-black leading-tight tracking-tight uppercase">LOGIX<span className="text-zinc-400 ml-1">AI</span></h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-normal leading-none mt-1">Slotting Optimizer</p>
        </div>
      </div>
      
      <nav className="flex-1 py-6 space-y-0.5 overflow-y-auto">
        <p className="px-6 text-[11px] font-normal text-zinc-400 uppercase tracking-[0.2em] mb-4">Módulos del Sistema</p>
        {menuItems.map((item) => {
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `w-full flex items-center px-6 py-2.5 transition-all border-l-[4px] text-[13px] uppercase tracking-wider font-normal ${
                isActive 
                  ? 'bg-zinc-50 border-black text-black' 
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-black border-transparent'
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-zinc-100">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-mono">Engine: Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
