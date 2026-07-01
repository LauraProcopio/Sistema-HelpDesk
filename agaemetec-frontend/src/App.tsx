import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { Dashboard } from './pages/admin/Dashboard';
import { CreateTicket } from './pages/admin/CreateTicket';
import { TicketsList } from './pages/admin/TicketsList';
import { TicketDetail } from './pages/admin/TicketDetail';
import { Customers } from './pages/admin/Customers';
import { CreateCustomer } from './pages/admin/CreateCustomer';
import { EditCustomer } from './pages/admin/EditCustomer';
import { Finance } from './pages/admin/Finance';
import { Settings } from './pages/admin/Settings';
import { Companies } from './pages/admin/Companies';
import { Reports } from './pages/admin/Reports';

import { Toaster } from 'sonner'; 

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        closeButton
        theme="dark" 
      />
      
      <Routes>
        {/* Raiz / Login */}
        <Route path="/" element={<LoginPage />} />
        
        {/* 🛠️ ROTAS DO ADMINISTRADOR */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/tickets" element={<TicketsList />} />
        <Route path="/admin/tickets/new" element={<CreateTicket />} />
        <Route path="/admin/tickets/:id" element={<TicketDetail />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/customers" element={<Customers/>}/>
        <Route path="/admin/customers/new" element={<CreateCustomer />} />
        <Route path="/admin/customers/edit/:id" element={<EditCustomer />} />
        <Route path="/admin/finance" element={<Finance />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/settings" element={<Settings />} />

        {/* 👤 ROTAS DO CLIENTE (Adicionadas para o redirecionamento funcionar) */}
        <Route path="/client/tickets" element={<TicketsList />} />
        <Route path="/client/tickets/new" element={<CreateTicket />} />
        <Route path="/client/tickets/:id" element={<TicketDetail />} />
        <Route path="/client/settings" element={<Settings />} />
        
        {/* Rota Coringa (Fallback) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;