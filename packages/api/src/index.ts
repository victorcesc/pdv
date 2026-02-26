import express from "express";
import { createRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { authMiddleware } from "./middleware/auth.js";
import { env } from "./config/env.js";

const app = express();

app.use(express.json());
app.use(authMiddleware);
app.use(createRouter());
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[pdv-cloud-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
