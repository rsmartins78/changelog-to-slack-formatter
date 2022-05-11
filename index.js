const core = require("@actions/core");
const { context } = require("@actions/github");

async function run() {
  try {
    // Fetching values from actions parameters
    const changeLogInput = core.getInput("changeLogInput", { required: true });
    const jiraTicketPattern = core.getInput("jiraTicketPattern", {
      required: true,
    });
    const jiraURL = core.getInput("jiraURL", { required: true });
    const githubServer = core.getInput("githubServer", { required: true });
    const prNumberPattern = /#(\d+)/gm;

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

      [...line.matchAll(prNumberPattern)].forEach((pr) => {
        line = line.replace(pr[0], `<${fullRepoURL}/pull/${pr[1]}|${pr[0]}>`);
      });

      // Storing each new formatted line to an array
      changeLogFormattedArr.push(line);
    });
    // Converting array to string
    let changeLogFormatted = changeLogFormattedArr.join("\n");
    core.setOutput("formattedChangelog", changeLogFormatted);
    core.info("Result: ");
    core.info(changeLogFormatted);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
