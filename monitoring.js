const axios = require('axios');

// Monitoring configuration
const MONITORING_CONFIG = {
  healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  alertWebhook: process.env.ALERT_WEBHOOK_URL,
  serviceName: 'Notification Server'
};

// Health check function
async function performHealthCheck() {
  try {
    const response = await axios.get(`${process.env.SERVICE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    await sendAlert('Health check failed', error.message);
    return false;
  }
}

// Send alert notification
async function sendAlert(title, message) {
  if (!MONITORING_CONFIG.alertWebhook) {
    console.log('⚠️ Alert webhook not configured');
    return;
  }

  try {
    await axios.post(MONITORING_CONFIG.alertWebhook, {
      title: `${MONITORING_CONFIG.serviceName}: ${title}`,
      message: message,
      timestamp: new Date().toISOString()
    });
    console.log('📢 Alert sent successfully');
  } catch (error) {
    console.error('❌ Failed to send alert:', error.message);
  }
}

// Start monitoring
function startMonitoring() {
  console.log('📊 Starting monitoring...');
  
  setInterval(async () => {
    await performHealthCheck();
  }, MONITORING_CONFIG.healthCheckInterval);
}

module.exports = {
  startMonitoring,
  sendAlert,
  performHealthCheck
}; 