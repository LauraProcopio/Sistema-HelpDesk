import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController';
import { TicketController } from '../controllers/TicketController';
import { TicketActionsController } from '../controllers/TicketActionsController';
import { MessageController } from '../controllers/MessageController';
import { login } from '../controllers/AuthController'; // Ajustado para a exportação direta
import { CustomerController } from '../controllers/CustomerController';

const router = Router();

// Autenticação
router.post('/auth/login', login); // Ajustado de AuthController.login para apenas login

// Empresas - CRUD Operacional Completo
router.get('/companies', CompanyController.index);
router.post('/companies', CompanyController.store);
router.put('/companies/:id', CompanyController.update);
router.patch('/companies/:id/status', CompanyController.toggleStatus);

// Gestão de Utilizadores / Perfis de Acesso
router.get('/customers', CustomerController.index);
router.get('/customers/:id', CustomerController.show);
router.put('/customers/:id', CustomerController.update);
router.patch('/customers/:id/status', CustomerController.toggleStatus);
router.post('/customers', CustomerController.store);
router.patch('/customers/:id/password', CustomerController.updatePassword);

// Gestão de Tickets Core
router.get('/tickets', TicketController.index);
router.get('/tickets/:id', TicketController.show);
router.delete('/tickets/:id', TicketController.delete);
router.get('/reports/monthly', TicketController.getMonthlyReport);

// Rota Analítica Financeira
router.get('/finance/metrics', TicketController.getFinanceMetrics);

// Ações Operacionais e Mensageria (WhatsApp/Email)
router.post('/tickets', TicketActionsController.create);
router.patch('/tickets/:id/status', TicketActionsController.updateStatus);
router.post('/tickets/comments', MessageController.createComment);

export default router;