const core = require("@actions/core");
const { context } = require("@actions/github");

const send = require("./slackmessage");
const format = require("./formatter");

async function run() {
  try {
    // Fetch action env vars
    const workflowName = process.env.GITHUB_WORKFLOW;
    const githubSHA = process.env.GITHUB_SHA;
    // Fetching action inputs
    const changeLogInput = core.getInput("changeLogInput", { required: true });
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

    // Removing ending slash
    jiraURL.endsWith("/") ? (jiraURL = jiraURL.slice(0, -1)) : jiraURL;
    githubServer.endsWith("/")
      ? (githubServer = githubServer.slice(0, -1))
      : githubServer;

    const { owner: currentOwner, repo: currentRepo } = context.repo;
    const fullRepoURL = `${githubServer}/${currentOwner}/${currentRepo}`;
    const actionLink = `${fullRepoURL}/commit/${githubSHA}/checks`;

    const { changeLogFormatted, changeLogFormattedArr } = await format({
      changeLogInput: changeLogInput,
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
      });
    }

    core.info("Message:");
    core.info(changeLogFormatted);
    core.setOutput("formattedChangelog", changeLogFormatted);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
