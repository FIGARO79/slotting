import { Routes, Route, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
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
