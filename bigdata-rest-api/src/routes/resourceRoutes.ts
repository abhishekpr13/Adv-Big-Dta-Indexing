import { Router } from "express";
import { createPlan,getPlan, deletPlan,getAllPlan, updatePlan} from "../controllers/resourceController";
import { verifyToken } from "../middleware/auth";


const router = Router();

router.post('/api/v1/plans', verifyToken,createPlan);
router.get('/api/v1/plans', getAllPlan);  
router.get('/api/v1/plans/:id', getPlan);
router.patch('/api/v1/plans/:id', verifyToken,updatePlan);
router.delete('/api/v1/plans/:id', verifyToken,deletPlan);


router.get('/api/v1/test-auth', verifyToken, (req, res) => {
    res.json({
        message: 'Authentication working!',
        user: req.user
    });
});

export default router;

