import dotenv from "dotenv";


dotenv.config();

import express from "express";
import cors from "cors";


import farmRoutes from "./routes/farm";
import weatherRoutes from "./routes/weather"; 
import marketRoutes from "./routes/market";

const app = express();
const PORT = process.env.PORT || 3000;


console.log('🔑 API Key loaded:', process.env.OPEN_WEATHER_KEY ? 'YES' : 'NO');


app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "FarmAssist Backend",
  });
});


app.use("/api/farm", farmRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/market", marketRoutes);


app.get("/api/market-prices", async (req, res) => {
  res.redirect("/api/market/prices");
});


app.listen(PORT, () => {
  console.log(`🚀 FarmAssist Backend is running on port http://localhost:${PORT}`);
});

export default app;
