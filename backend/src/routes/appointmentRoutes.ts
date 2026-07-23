import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { 
  listAppointments, 
  createAppointment, 
  updateAppointmentStatus 
} from '../controllers/appointmentController';

const router = Router();

// GET /api/appointments/list
router.get('/list', authenticateJWT, listAppointments);

// POST /api/appointments/create
router.post('/create', authenticateJWT, createAppointment);

// POST /api/appointments/update-status
router.post('/update-status', authenticateJWT, updateAppointmentStatus);

export default router;
