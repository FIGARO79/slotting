import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InventoryList from './pages/InventoryList';
import SlottingConfig from './pages/SlottingConfig';
import Dashboard from './pages/Dashboard';
import SlottingAnalysis from './pages/SlottingAnalysis';

function App() {
  const location = useLocation();
  
  const getPageLabel = () => {
    switch(location.pathname) {
      case '/': return 'MAESTRO DE INVENTARIO';
      case '/config': return 'ESTRATEGIA DE SLOTTING';
      case '/dashboard': return 'PANEL OPERATIVO';
      case '/analysis': return 'ANÁLISIS DE SLOTTING';
      default: return 'LOGIX AI CORE';
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfcfc] font-sans overflow-hidden antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-[48px] flex items-center justify-between px-6 shrink-0 z-20 border-b border-zinc-200">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <span className="text-black/10 font-light text-xl">|</span>
                <h2 className="text-[13px] font-normal text-black tracking-[0.2em] uppercase">
                  {getPageLabel()}
                </h2>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-[11px] font-normal text-black uppercase tracking-widest bg-zinc-100 px-3 py-1 border border-zinc-200 rounded">
                v2.0.4-stable
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#fcfcfc]">
          <div className="w-full h-full page-transition">
            <Routes>
              <Route path="/" element={<InventoryList />} />
              <Route path="/config" element={<SlottingConfig />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analysis" element={<SlottingAnalysis />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
