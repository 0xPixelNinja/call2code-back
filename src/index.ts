import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { marketService } from "./services/market";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FarmAssist Backend is running" });
});

app.get("/api/market-prices", async (req, res) => {
  try {
    const marketPrices = await marketService.getFormattedMarketPrices();
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

app.listen(PORT, () => {
  console.log(`🚀 FarmAssist Backend is running on port ${PORT}`);
  console.log(
    `📈 Market prices API: http://localhost:${PORT}/api/market-prices`
  );
});

export default app;
