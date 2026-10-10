try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignore error if .env file is not present
}

import app from "./app.js";
import { initDatabase } from "./config/initDb.js";

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  await initDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
