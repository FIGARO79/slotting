import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Cpu,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'inventory', label: 'Maestro Items', icon: Package, path: '/' },
    { id: 'config', label: 'Reglas de Slotting', icon: Settings, path: '/config' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sap-shell text-white z-10 shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight tracking-tight">Logix<span className="text-blue-400 font-light">AI</span></h1>
          <p className="text-[9px] text-blue-200/60 uppercase tracking-[0.2em] font-bold">Slotting Optimizer</p>
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-4 mt-2">Navegación</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
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
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-white/40'}`} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 bg-black/10">
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              AD
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Fabio G.</p>
              <p className="text-[10px] text-white/40 font-medium tracking-tight">Administrador</p>
            </div>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white" title="Cerrar Sesión">
             <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
