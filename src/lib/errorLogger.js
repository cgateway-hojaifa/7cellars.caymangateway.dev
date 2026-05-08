import ErrorLog from "@/models/ErrorLog";

export async function logErrorToDB({ error, url, requestData = null }) {
  try {
    const errorDetails = {
      errorMessage: error.message,
      errorStack: error.stack,
      requestUrl: url,
      requestPayload: requestData,
      timestamp: new Date().toISOString(),
    };

    await ErrorLog.create({
      data: errorDetails,
    });

    console.error("Error logged to DB:", errorDetails.errorMessage);
  } catch (dbError) {
    console.error("CRITICAL: Failed to log error to DB:", dbError.message);
    console.error("Original error that was not logged to DB:", error.message);
  }
}
