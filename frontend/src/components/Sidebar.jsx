import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Box
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'inventory', label: 'Inventario', icon: Package, path: '/' },
    { id: 'config', label: 'Config. Slotting', icon: Settings, path: '/config' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-10">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Box className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Slotting<span className="text-indigo-600">Pro</span></h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Warehouse AI</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 mt-2">Menú Principal</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            AD
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">Admin Almacén</p>
            <p className="text-xs text-gray-500">admin@slotting.app</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
