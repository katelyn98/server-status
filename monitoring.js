const axios = require('axios');
const { WebClient } = require('@slack/web-api');

// Read the Slack token from environment variables for security
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const web = new WebClient(SLACK_TOKEN);

const CHANNEL_ID = 'C082YTDA2T0'; 
const WEBSITE_URL = 'https://medsyn.katelyncmorrison.com';

let serverStartTime = null;

const MAX_RUNTIME = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
setTimeout(() => {
  console.log('Exiting script to avoid GitHub Actions timeout.');
  process.exit(0);
}, MAX_RUNTIME);

// Function to check website status
const checkWebsiteStatus = async () => {
  try {
    const response = await axios.get(WEBSITE_URL);

    if (response.status === 200) {
      console.log('Website is reachable.');

      // Start tracking server uptime
      if (!serverStartTime) {
        serverStartTime = new Date(); // Record when the server became reachable
        console.log('Server is now accessible. Monitoring uptime...');
      } else {
        // Calculate uptime duration
        const now = new Date();
        const diffInHours = (now - serverStartTime) / (1000 * 60 * 60);

        if (diffInHours > 2) {
          await sendSlackNotification(
            '⚠️ The server has been running for more than 2 hours. Please check if this is expected. <@U02DP887GDR>'
          );
          serverStartTime = null; // Reset tracking after notification
        }
      }

      // Continue checking every 5 minutes while the server is reachable
      setTimeout(checkWebsiteStatus, 5 * 60 * 1000); // 5 minutes
    }
  } catch (error) {
    console.error('Website is unreachable:', error.message);

    // Notify that the website is unreachable
    if (serverStartTime) {
      serverStartTime = null; // Reset uptime tracking if it becomes unreachable
    }
    // await sendSlackNotification('❌ The server is not currently turned on.');

    // Retry after 30 minutes
    setTimeout(checkWebsiteStatus, 30 * 60 * 1000); // 30 minutes
  }
};

// Function to send Slack notifications
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

// Start the script
checkWebsiteStatus();
