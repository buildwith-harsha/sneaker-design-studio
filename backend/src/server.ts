try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignore error if .env file is not present
}

import app from "./app.js";
import { initDatabase } from "./config/initDb.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function bootstrap() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
