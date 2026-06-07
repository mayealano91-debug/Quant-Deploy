import { Router, type IRouter } from "express";
import healthRouter from "./health";
import alpacaRouter from "./alpaca";

const router: IRouter = Router();

router.use(healthRouter);
router.use(alpacaRouter);

export default router;
