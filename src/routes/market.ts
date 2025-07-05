import { Router } from "express";
import { marketService } from "../services/market";
import schedulerService from "../lib/scheduler";

const router = Router();


router.get("/prices", async (req, res) => {
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


router.post("/prices/update", async (req, res) => {
  try {
    const result = await schedulerService.triggerUpdate();
    res.json(result);
  } catch (error) {
    console.error("Error in manual update endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to update market prices",
    });
  }
});

export default router; 