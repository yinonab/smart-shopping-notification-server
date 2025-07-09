const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Jerusalem',
    server: 'Smart Shopping Notification Server'
  });
});

// Manual trigger endpoint for testing
app.post('/trigger-notifications', async (req, res) => {
  try {
    console.log('🔔 Manual notification trigger requested');
    await checkAndSendNotifications();
    res.json({ success: true, message: 'Notifications processed' });
  } catch (error) {
    console.error('❌ Error in manual trigger:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current Israel time
function getIsraelTime() {
  const now = new Date();
  const israelTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));
  return israelTime;
}

// Get current time string in HH:MM format
function getCurrentTimeString() {
  const israelTime = getIsraelTime();
  const currentHour = israelTime.getHours();
  const currentMinute = israelTime.getMinutes();
  return `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
}

// Fetch users with notification settings from Supabase
async function getUsersToNotify() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('📥 Fetching users from Supabase...');

    const response = await axios.get(
      `${supabaseUrl}/rest/v1/notification_settings`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          select: '*',
          fcm_token: 'not.is.null',
          times: 'not.is.null',
          enabled: 'eq.true'
        }
      }
    );

    console.log(`✅ Found ${response.data?.length || 0} users with notification settings`);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }
}

// Send notification via Edge Function
async function sendNotificationToUser(userId, fcmToken, currentTime) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log(`📤 Sending notification to user ${userId} at ${currentTime}`);
    
    const response = await axios.post(
      `${supabaseUrl}/functions/v1/send-daily-notifications`,
      {
        clientTime: new Date().toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log the notification attempt
    await logNotificationAttempt(userId, 200, `Notification sent at ${currentTime}`);
    
    console.log(`✅ Notification sent successfully to user ${userId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending notification to user ${userId}:`, error.message);
    await logNotificationAttempt(userId, 500, `Error: ${error.message}`);
    throw error;
  }
}

// Log notification attempts to Supabase
async function logNotificationAttempt(userId, status, message) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    await axios.post(
      `${supabaseUrl}/rest/v1/notification_logs`,
      {
        user_id: userId,
        status: status,
        message: message
      },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('❌ Error logging notification attempt:', error.message);
  }
}

// Main function to check and send notifications
async function checkAndSendNotifications() {
  try {
    const currentTimeStr = getCurrentTimeString();
    const israelTime = getIsraelTime();
    
    console.log(`⏰ Checking notifications at ${currentTimeStr} (Israel time)`);
    console.log(`📅 Date: ${israelTime.toLocaleDateString('he-IL')}`);
    console.log(`🕐 Time: ${israelTime.toLocaleTimeString('he-IL')}`);

    // Get all users with notification settings
    const users = await getUsersToNotify();

    if (users.length === 0) {
      console.log('ℹ️ No users to notify');
      return;
    }

    // Filter users whose current time matches their notification times
    const usersToNotify = users.filter(user => {
      if (!user.times || !Array.isArray(user.times)) {
        return false;
      }
      
      const userTimes = user.times.map(time => String(time));
      const shouldNotify = userTimes.includes(currentTimeStr);
      
      console.log(`User ${user.user_id}: times=${JSON.stringify(userTimes)}, current=${currentTimeStr}, shouldNotify=${shouldNotify}`);
      
      return shouldNotify;
    });

    console.log(`🎯 Found ${usersToNotify.length} users to notify at ${currentTimeStr}`);

    if (usersToNotify.length === 0) {
      console.log(`ℹ️ No users to notify at ${currentTimeStr}`);
      return;
    }

    // Send notifications to matching users
    const notificationPromises = usersToNotify.map(user => 
      sendNotificationToUser(user.user_id, user.fcm_token, currentTimeStr)
    );

    const results = await Promise.allSettled(notificationPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Notifications sent: ${successful} successful, ${failed} failed`);
    
  } catch (error) {
    console.error('❌ Error in checkAndSendNotifications:', error);
  }
}

// Schedule cron job to run every minute
cron.schedule('* * * * *', async () => {
  console.log('🔄 Cron job triggered');
  await checkAndSendNotifications();
}, {
  timezone: 'Asia/Jerusalem'
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Shopping Notification Server running on port ${PORT}`);
  console.log(`⏰ Cron job scheduled to run every minute`);
  console.log(`🌍 Timezone: Asia/Jerusalem`);
  
  // Initial check on startup
  setTimeout(async () => {
    console.log('🔔 Running initial notification check...');
    await checkAndSendNotifications();
  }, 5000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
}); 