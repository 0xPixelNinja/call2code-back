import { Router } from "express";
import { agriculturalService } from "../services/agricultural";

const router = Router();


router.get("/advisory", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const advisory = await agriculturalService.getCropAdvisory(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(advisory);
  } catch (error) {
    console.error("Error in farm advisory endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to generate farm advisory"
    });
  }
});


router.get("/frost-alert", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const frostAlert = await agriculturalService.getFrostAlert(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(frostAlert);
  } catch (error) {
    console.error("Error in frost alert endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to generate frost alert"
    });
  }
});


router.get("/irrigation-advice", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: "Missing coordinates",
        message: "Please provide lat and lon parameters"
      });
    }

    const irrigationAdvice = await agriculturalService.getIrrigationAdvice(
      parseFloat(lat as string), 
      parseFloat(lon as string)
    );
    
    res.json(irrigationAdvice);
  } catch (error) {
    console.error("Error in irrigation advice endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to generate irrigation advice"
    });
  }
});

export default router; 