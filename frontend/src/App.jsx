import { Routes, Route, useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard, Search, HelpCircle, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import InventoryList from './pages/InventoryList';
import SlottingConfig from './pages/SlottingConfig';

const DashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center">
        <div className="bg-blue-50 p-6 rounded-3xl mb-6">
            <LayoutDashboard className="w-16 h-16 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-sap-header mb-2">Panel de Métricas en Desarrollo</h2>
        <p className="text-gray-500 max-w-sm text-sm font-medium leading-relaxed">
            Próximamente: Visualización en tiempo real de la ocupación por zonas, efectividad de la IA y alertas de reubicación proactiva.
        </p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  
  const getPageLabel = () => {
    switch(location.pathname) {
      case '/': return 'Maestro de Inventario';
      case '/config': return 'Reglas y Restricciones';
      case '/dashboard': return 'Métricas de Almacén';
      default: return 'Logix AI';
    }
  };

  return (
    <div className="flex h-screen bg-sap-bg font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-sap-shell h-14 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg relative">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <span className="text-white/40 font-light text-xl">|</span>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  {getPageLabel()}
                </h2>
             </div>

             <div className="hidden lg:flex items-center bg-white/10 rounded-lg px-3 py-1.5 w-80 border border-white/10 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400 transition-all group">
                <Search className="w-4 h-4 text-white/40 group-focus-within:text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar en el sistema..." 
                    className="bg-transparent border-none text-xs text-white focus:text-gray-800 focus:ring-0 w-full placeholder:text-white/30 outline-none px-2"
                />
             </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Ayuda">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="relative p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Notificaciones">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-sap-shell"></span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <button className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-lg transition-all group">
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4 text-white" />
               </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-sap-bg">
          <div className="max-w-7xl mx-auto page-transition">
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
