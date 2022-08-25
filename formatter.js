const core = require("@actions/core");

const format = async function ({
  changeLogInput,
  jiraTicketPattern,
  prNumberPattern,
  jiraURL,
  fullRepoURL,
}) {
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
  core.debug(changeLogFormatted);
  return { changeLogFormatted, changeLogFormattedArr };
};

module.exports = format;
