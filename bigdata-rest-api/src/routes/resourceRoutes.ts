import { Router } from "express";
import { createPlan,getPlan, deletPlan,getAllPlan, updatePlan} from "../controllers/resourceController";


const router = Router();

router.post('/api/v1/plans', createPlan);
router.get('/api/v1/plans', getAllPlan);  
router.get('/api/v1/plans/:id', getPlan);
router.patch('/api/v1/plans/:id', updatePlan);
router.delete('/api/v1/plans/:id', deletPlan);

export default router;

