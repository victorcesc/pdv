import express from "express";
import { createRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { authMiddleware } from "./middleware/auth.js";
import { env } from "./config/env.js";

const app = express();

// CORS - Permitir requisições do frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key");
  
  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Middleware de log para requisições
app.use((req, _res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use(express.json());
app.use(authMiddleware);
app.use(createRouter());
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[SERVER] ========================================`);
  console.log(`[SERVER] 🚀 pdv-cloud-api iniciado com sucesso!`);
  console.log(`[SERVER] 📍 URL: http://localhost:${env.PORT}`);
  console.log(`[SERVER] 🌍 Ambiente: ${env.NODE_ENV}`);
  if (env.API_KEY) {
    console.log(`[SERVER] 🔐 API_KEY configurada: ${env.API_KEY.substring(0, 5)}...`);
  } else {
    console.log(`[SERVER] ⚠️  API_KEY não configurada - modo desenvolvimento (sem autenticação)`);
  }
  console.log(`[SERVER] ========================================`);
});
