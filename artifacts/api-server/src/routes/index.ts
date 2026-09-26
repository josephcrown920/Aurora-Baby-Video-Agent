import modelarkDirectorRouter from "./modelark-director";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import comfyRouter from "./comfy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(modelarkDirectorRouter);
router.use(agentRouter);
router.use(comfyRouter);

export default router;
