const axios = require('axios');
const { WebClient } = require('@slack/web-api');

// Slack Bot Token and Channel ID
const SLACK_TOKEN = 'xoxb-1003827034820-8100769762054-wt1UfEPXY2Jg6NqC6DwTR2j4';
const CHANNEL_ID = 'C082YTDA2T0';

const web = new WebClient(SLACK_TOKEN);

const WEBSITE_URL = 'https://medsyn.katelyncmorrison.com';
let serverStartTime = null;
let unreachableStartTime = null; // Track when the website becomes unreachable

const checkWebsiteStatus = async () => {
  try {
    const response = await axios.get(WEBSITE_URL);

    if (response.status === 200) {
      console.log('Website is reachable.');
      
      // Reset unreachable tracking
      unreachableStartTime = null;

      // Track uptime
      if (!serverStartTime) {
        serverStartTime = new Date(); // Start tracking time
      } else {
        const now = new Date();
        const diffInHours = (now - serverStartTime) / (1000 * 60 * 60);
        if (diffInHours > 2) {
          await sendSlackNotification(
            '⚠️ The server has been running for more than 2 hours. Please check its status.'
          );
          serverStartTime = null; // Reset start time after notification
        }
      }
    }
  } catch (error) {
    console.error('Website is unreachable:', error.message);

    // Track when the website became unreachable
    if (!unreachableStartTime) {
      unreachableStartTime = new Date();
    }

    const now = new Date();
    const diffInMinutes = (now - unreachableStartTime) / (1000 * 60); // Unreachable time in minutes

    if (diffInMinutes > 5) { // Send notification if unreachable for more than 5 minutes
      await sendSlackNotification(
        '❌ The server has been unreachable for more than 5 minutes. Please investigate.'
      );
      unreachableStartTime = null; // Reset after notification
    }
  }
};

const sendSlackNotification = async (message) => {
  try {
    await web.chat.postMessage({
      channel: CHANNEL_ID,
      text: message,
    });
    console.log('Slack notification sent:', message);
  } catch (error) {
    console.error('Error sending Slack message:', error.message);
  }
};

// Run the status check every 30 minutes
setInterval(checkWebsiteStatus, 30 * 60 * 1000); // 30 minutes
