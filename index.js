const fs = require("fs/promises");
const core = require("@actions/core");
const { context } = require("@actions/github");

const send = require("./slackmessage.js");
const format = require("./formatter.js");

async function run() {
  try {
    // Fetch action env vars
    const workflowName = process.env.GITHUB_WORKFLOW;
    const githubSHA = process.env.GITHUB_SHA;
    // Fetching action inputs
    const changeLogFile = core.getInput("changeLogFile", { required: true });
    const jiraTicketPattern = core.getInput("jiraTicketPattern", {
      required: true,
    });
    const jiraURL = core.getInput("jiraURL", { required: true });
    const githubServer = core.getInput("githubServer", { required: true });
    const prNumberPattern = "#(\\d+)";
    const slackBotToken = core.getInput("slackBotToken", { required: false });
    const slackChannel = core.getInput("slackChannel", { required: false });
    const oldVersion = core.getInput("oldVersion", { required: false });
    const newVersion = core.getInput("newVersion", { required: false });
    const customSubTitle = core.getInput("customSubTitle", { required: false });
    const environment = core.getInput("environment", { required: false });

    // Removing ending slash
    jiraURL.endsWith("/") ? (jiraURL = jiraURL.slice(0, -1)) : jiraURL;
    githubServer.endsWith("/")
      ? (githubServer = githubServer.slice(0, -1))
      : githubServer;

    const { owner: currentOwner, repo: currentRepo } = context.repo;
    const fullRepoURL = `${githubServer}/${currentOwner}/${currentRepo}`;
    const actionLink = `${fullRepoURL}/commit/${githubSHA}/checks`;

    const changeLogText = await fs.readFile(changeLogFile, {
      encoding: "utf8",
    });

    core.info(changeLogText);

    const { changeLogFormatted, changeLogFormattedArr } = await format({
      changeLogText: changeLogText,
      fullRepoURL: fullRepoURL,
      jiraURL: jiraURL,
      jiraTicketPattern: jiraTicketPattern,
      prNumberPattern: prNumberPattern,
    });
    if (slackBotToken !== "none" && slackChannel !== "none") {
      await send({
        messageArr: changeLogFormattedArr,
        channel: slackChannel,
        token: slackBotToken,
        actionLink: actionLink,
        workflowName: workflowName,
        oldVersion: oldVersion,
        newVersion: newVersion,
        customSubTitle: customSubTitle,
        environment: environment,
      });
    }
    core.info("Finish");
    core.setOutput("formattedChangelog", changeLogFormatted);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
