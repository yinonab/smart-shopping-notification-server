const axios = require('axios');

// Backup strategy for notification server
class BackupStrategy {
  constructor() {
    this.primaryServer = process.env.PRIMARY_SERVER_URL;
    this.backupServer = process.env.BACKUP_SERVER_URL;
    this.isPrimary = process.env.IS_PRIMARY === 'true';
  }

  // Check if this server should be active
  async shouldBeActive() {
    if (this.isPrimary) {
      return true; // Primary server is always active
    }

    // Backup server checks if primary is down
    try {
      const response = await axios.get(`${this.primaryServer}/health`, {
        timeout: 5000
      });
      return false; // Primary is up, backup should be inactive
    } catch (error) {
      console.log('🔄 Primary server is down, activating backup');
      return true; // Primary is down, backup should be active
    }
  }

  // Start backup monitoring
  startBackupMonitoring() {
    if (!this.isPrimary && this.backupServer) {
      console.log('🔄 Starting backup monitoring...');
      
      setInterval(async () => {
        const shouldBeActive = await this.shouldBeActive();
        if (shouldBeActive) {
          console.log('✅ Backup server is active');
        } else {
          console.log('⏸️ Backup server is inactive (primary is up)');
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Get server status
  getServerStatus() {
    return {
      isPrimary: this.isPrimary,
      primaryServer: this.primaryServer,
      backupServer: this.backupServer,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BackupStrategy; 