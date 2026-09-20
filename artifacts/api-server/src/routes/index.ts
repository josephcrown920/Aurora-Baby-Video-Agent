import modelarkDirectorRouter from "./modelark-director";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(modelarkDirectorRouter);
router.use(agentRouter);

export default router;
