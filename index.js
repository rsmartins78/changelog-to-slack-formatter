const core = require("@actions/core");
const { context } = require("@actions/github");
const { WebClient } = require("@slack/web-api");

async function run() {
  try {
    const workflowName = process.env.GITHUB_WORKFLOW;
    const githubSHA = process.env.GITHUB_SHA;
    // Fetching values from actions parameters
    const changeLogInput = core.getInput("changeLogInput", { required: true });
    const jiraTicketPattern = core.getInput("jiraTicketPattern", {
      required: true,
    });
    const jiraURL = core.getInput("jiraURL", { required: true });
    const githubServer = core.getInput("githubServer", { required: true });
    const prNumberPattern = "#(\\d+)";
    const slackBotToken = core.getInput("slackBotToken", { required: true });
    const slackChannel = core.getInput("slackChannel", { required: true });

    // Removing ending slash
    jiraURL.endsWith("/") ? (jiraURL = jiraURL.slice(0, -1)) : jiraURL;
    githubServer.endsWith("/")
      ? (githubServer = githubServer.slice(0, -1))
      : githubServer;

    const { owner: currentOwner, repo: currentRepo } = context.repo;
    const fullRepoURL = `${githubServer}/${currentOwner}/${currentRepo}`;

    // Transforming changelog input into an array
    const changeLog = changeLogInput.split("\n");
    let changeLogFormattedArr = [];

    changeLog.forEach((change) => {
      let line = change;
      // Getting the Jira Ticket and creating a slack formated hyperlink for it
      [...line.matchAll(new RegExp(jiraTicketPattern, "g"))].forEach(
        (jiraTicket) => {
          line = line.replace(
            jiraTicket[0],
            `<${jiraURL}/browse/${jiraTicket[0]}|${jiraTicket[0]}>`
          );
        }
      );

      [...line.matchAll(new RegExp(prNumberPattern, "g"))].forEach((pr) => {
        line = line.replace(pr[0], `<${fullRepoURL}/pull/${pr[1]}|${pr[0]}>`);
      });

      // Storing each new formatted line to an array
      changeLogFormattedArr.push(line);
    });
    // Converting array to string
    let changeLogFormatted = changeLogFormattedArr.join("\n");
    const slack = new WebClient(slackBotToken);
    const slackMessage = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `A new tag was released/deployed | <${fullRepoURL}/commit/${githubSHA}/checks|${workflowName}>`,
        },
      },
      {
        type: "divider",
      },
    ];

    /* 
      Terrible workaround to deal with Slack API limitations 
      Every 10 lines per message block, to avoind 3k characters limitation
    */
    let count = 0;
    let tempText;
    await changeLogFormattedArr.forEach((change) => {
      if (count < 7) {
        if (tempText === undefined) {
          tempText = change;
        } else {
          tempText = tempText + "\n" + change;
        }
        count++;
      } else if (count == 7) {
        tempText = tempText + "\n" + change;
        tempTextObj = {
          type: "section",
          text: { type: "mrkdwn", text: tempText },
        };
        slackMessage.push(tempTextObj);
        tempText = "";
        count = 0;
      } else {
        tempText = "";
        count = 0;
      }
    });
    /* End of workaround */

    const sendMessage = await slack.chat.postMessage({
      text: "A new tag was released/deployed...",
      blocks: JSON.stringify(slackMessage),
      channel: slackChannel,
    });
    core.setOutput("formattedChangelog", changeLogFormatted);
    core.info(`Message JSON: \n${JSON.stringify(slackMessage)}`);
    core.info(`Successfully send message ${sendMessage.ts}`);
  } catch (error) {
    core.error(sendMessage);
    core.error(`Message JSON: \n${JSON.stringify(slackMessage)}`);
    core.setFailed(error.message);
  }
}
run();
