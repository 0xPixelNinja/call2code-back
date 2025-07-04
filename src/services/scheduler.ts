import * as cron from "node-cron";
import { marketService } from "./market";

class SchedulerService {
  private isInitialized = false;

  /**
   * Initialize the scheduler
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    cron.schedule("0 * * * *", async () => {
      try {
        await marketService.fetchAndSaveMarketPrices();
      } catch (error) {
        console.error("❌ Scheduled market price update failed:", error);
      }
    });

    this.runInitialFetch();
    this.isInitialized = true;
    console.log("✅ Market price scheduler initialized");
  }

  /**
   * Run initial market price fetch on startup
   */
  private async runInitialFetch() {
    try {
      await marketService.fetchAndSaveMarketPrices();
    } catch (error) {
      console.error("❌ Initial market price fetch failed:", error);
    }
  }

  /**
   * Manually trigger market price update
   */
  async triggerUpdate() {
    try {
      const result = await marketService.fetchAndSaveMarketPrices();
      console.log(`✅ Manual update completed: ${result.totalItems} items`);
      return result;
    } catch (error) {
      console.error("❌ Manual market price update failed:", error);
      throw error;
    }
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
