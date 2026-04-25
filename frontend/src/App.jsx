import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InventoryList from './pages/InventoryList';
import SlottingConfig from './pages/SlottingConfig';

function App() {
  return (
    <div className="flex bg-[#f4f4f5] min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<InventoryList />} />
          <Route path="/config" element={<SlottingConfig />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
