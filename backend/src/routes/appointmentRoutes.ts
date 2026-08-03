import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { 
  listAppointments, 
  createAppointment, 
  updateAppointmentStatus,
  getProcessStages,
  updateAppointmentStage,
  backfillExistingAppointments,
  getClientProcesses,
  diagnoseMusteriSurecleri
} from '../controllers/appointmentController';

const router = Router();

// GET /api/appointments/list
router.get('/list', authenticateJWT, listAppointments);

// GET /api/appointments/process-stages
router.get('/process-stages', authenticateJWT, getProcessStages);

// GET /api/appointments/diagnose (veritabanı durumunu teşhis et)
router.get('/diagnose', authenticateJWT, diagnoseMusteriSurecleri);

// GET /api/appointments/client-processes (MusteriSurecleri tablosundan tüm süreç kayıtları)
router.get('/client-processes', authenticateJWT, getClientProcesses);

// POST /api/appointments/update-stage
router.post('/update-stage', authenticateJWT, updateAppointmentStage);

// POST /api/appointments/backfill-stages (Mevcut randevuları MusteriSurecleri'ne ekle)
router.post('/backfill-stages', authenticateJWT, backfillExistingAppointments);

// POST /api/appointments/create
router.post('/create', authenticateJWT, createAppointment);

// POST /api/appointments/update-status
router.post('/update-status', authenticateJWT, updateAppointmentStatus);

export default router;
