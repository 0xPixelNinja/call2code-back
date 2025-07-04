import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { marketService } from "./services/market";
import { schedulerService } from "./services/scheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "FarmAssist Backend",
  });
});

app.get("/api/market-prices", async (req, res) => {
  try {
    const marketPrices = await marketService.getLatestMarketPrices();
    res.json(marketPrices);
  } catch (error) {
    console.error("Error in market prices endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to fetch market prices",
    });
  }
});

// app.post("/api/market-prices/update", async (req, res) => {
//   try {
//     const result = await schedulerService.triggerUpdate();
//     res.json(result);
//   } catch (error) {
//     console.error("Error in manual update endpoint:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//       message: "Failed to update market prices",
//     });
//   }
// });

app.listen(PORT, () => {
  console.log(`🚀 FarmAssist Backend is running on port http://localhost:${PORT}`);
  schedulerService.init();
});

export default app;
