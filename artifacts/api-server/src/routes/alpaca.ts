import { Router, type Request, type Response } from "express";

const router = Router();

const PYTHON_BACKEND =
  `http://localhost:${process.env["PYTHON_BACKEND_PORT"] ?? "8001"}`;

/**
 * Proxy all /alpaca/* requests to the Python FastAPI broker backend.
 * Strips the /alpaca prefix before forwarding.
 */
async function proxyToPython(req: Request, res: Response): Promise<void> {
  // Strip leading /alpaca from the path
  const subPath = req.path.replace(/^\/alpaca/, "") || "/";
  const qs      = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const target  = `${PYTHON_BACKEND}${subPath}${qs}`;

  try {
    const init: RequestInit = {
      method:  req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(target, init);
    const body     = await upstream.text();

    res
      .status(upstream.status)
      .set("Content-Type", upstream.headers.get("content-type") ?? "application/json")
      .send(body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({
      error:   "Python broker backend unavailable",
      detail:  message,
      hint:    "Start it with: cd artifacts/finxquant/src/python_backend && uvicorn main:app --port 8001",
    });
  }
}

// Express 5 / path-to-regexp v8: wildcards must be named
router.all(/^\/alpaca(\/.*)?$/, proxyToPython);

export default router;
