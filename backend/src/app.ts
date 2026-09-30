import express from "express";
import cors from "cors";

import designRoutes from "./routes/designRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/designs", designRoutes);

export default app;
