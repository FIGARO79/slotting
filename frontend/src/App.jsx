import { Routes, Route, useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard } from 'lucide-react';
import Sidebar from './components/Sidebar';
import InventoryList from './pages/InventoryList';
import SlottingConfig from './pages/SlottingConfig';

const DashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
    <LayoutDashboard className="w-16 h-16 text-gray-300 mb-4" />
    <h2 className="text-xl font-bold text-gray-700 mb-2">Dashboard en Construcción</h2>
    <p className="text-gray-500 max-w-md">Aquí se mostrarán métricas clave de la ocupación del almacén, eficiencia del slotting actual y alertas de inventario.</p>
  </div>
);

function App() {
  const location = useLocation();
  
  // Mapeo de rutas a etiquetas para el Header
  const getPageLabel = () => {
    switch(location.pathname) {
      case '/': return 'Inventario';
      case '/config': return 'Config. Slotting';
      case '/dashboard': return 'Dashboard';
      default: return 'SlottingPro';
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-0 shadow-sm">
          <div className="flex items-center gap-4">
             {/* Mobile Menu Toggle */}
             <button className="md:hidden text-gray-500 hover:text-gray-700">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
               {getPageLabel()}
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:flex">
               <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<InventoryList />} />
              <Route path="/config" element={<SlottingConfig />} />
              <Route path="/dashboard" element={<DashboardPlaceholder />} />
            </Routes>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App
