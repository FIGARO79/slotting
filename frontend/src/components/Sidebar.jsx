import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', path: '/dashboard' },
    { id: 'inventory', label: 'Maestro Items', path: '/' },
    { id: 'config', label: 'Reglas de Slotting', path: '/config' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sap-shell text-white z-10 shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight tracking-tight">Logix<span className="text-blue-400 font-light">AI</span></h1>
          <p className="text-[9px] text-blue-200/60 uppercase tracking-[0.2em] font-bold">Slotting Optimizer</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-4 mt-2">Navegación</p>
        {menuItems.map((item) => {
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                isActive 
                  ? 'bg-white/10 text-white shadow-inner border border-white/5' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      

    </aside>
  );
};

export default Sidebar;
