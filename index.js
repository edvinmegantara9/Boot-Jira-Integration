require('dotenv').config();
const request = require('request');
const http = require('http');

/**
 * function form create jira issue
 * hit endpoint rest/api/3/issue, documentation => https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 * @param {*} summary 
 * @param {*} description 
 * @param {*} assignee 
 * @param {*} emailSubject 
 * @param {*} emailBody 
 */
const createJiraIssue = (summary, description, assignee, emailSubject, emailBody) => {
  const issueData = {
    fields: {
      project:
        { 
          key: process.env.JIRA_PROJECT_KEY
        },
      summary: summary,
      description: {
        content: [
          {
            content: [
              {
                text: description,
                type: "text"
              }
            ],
            type: "paragraph"
          }
        ],
        type: "doc",
        version: 1
      },
      issuetype: {
        id: process.env.JIRA_ISSUE_TYPE
      },
    }
  };

  const options = {
    url: `${process.env.JIRA_URL}/rest/api/3/issue`,
    auth: {
      username: process.env.JIRA_USER_EMAIL,
      password: process.env.JIRA_API_TOKEN,
    },
    json: true,
    body: issueData
  };

  request.post(options, (error, response, body) => {
    if (!error && response.statusCode === 201) {
      console.log(`Issue created with key: ${body.key}`);
      sendEmailNotification(assignee, emailSubject, emailBody);
    } else {
      console.error(`Error creating issue: ${body.errorMessages}`);
    }
  });
};

/**
 * function form send email notification to user jira, 
 * hit endpoint /rest/api/2/issue/{issueType}/notify, documentation => https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-notify-post
 * @param {*} to 
 * @param {*} subject 
 * @param {*} body 
 */
const sendEmailNotification = (to, subject, body) => {
  const bodyData = {
    subject: subject,
    textBody: body,
    to: {
      users: [
        {
          accountId: process.env.JIRA_ACCOUNT_ID,
        }
      ],
    }
  };

  const options = {
    url: `${process.env.JIRA_URL}/rest/api/2/issue/${process.env.JIRA_ISSUE_TYPE}/notify`,
    auth: {
      username: process.env.JIRA_USER_EMAIL,
      password: process.env.JIRA_API_TOKEN,
    },
    json: true,
    body: bodyData
  };

  request.post(options, (error, response, body) => {
    if (!error && response.statusCode === 204) {
      console.log(`Notification sent to ${to}`);
    } else {
      console.error(`Error sending notification to ${to}: ${body.errorMessages}`);
    }
  });
};

/**
 * Event when the error occurred
 */
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    createJiraIssue('New task', `A new task has been assigned to you. error : ${error}`, 'edvinmegantara', 'New task assigned', `A new task has been assigned to you. error: ${error}`);
});

/**
 * test run function
 */
// createJiraIssue('New task', 'A new task has been assigned to you.', 'edvinmegantara', 'New task assigned', 'A new task has been assigned to you.');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
});
  
server.listen(PORT, () => {
    console.log(`Bot Started, Server running on port ${PORT}`);
});

