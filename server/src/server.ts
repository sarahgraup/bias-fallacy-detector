import app from 'api/app';
import { createLogger } from "@utils/logger";
import dotenv from "dotenv";


// Load environment variables
dotenv.config();



const logger = createLogger("Server");
const PORT = process.env.PORT || 3000;


/**
 * Start the Express server
 */
function startServer() {
  app.listen(PORT, () => {
    logger.success(`🚀 Bias Detector API running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`📖 API Docs: http://localhost:${PORT}/api`);
    console.log();
  });
}

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

export default app;