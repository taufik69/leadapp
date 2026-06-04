import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import SendPage from './pages/SendPage';
import SendListPage from './pages/SendListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/send-list" element={<SendListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
