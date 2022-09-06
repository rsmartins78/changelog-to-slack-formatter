const core = require("@actions/core");
const util = require("util");
const { WebClient } = require("@slack/web-api");

Object.defineProperty(String.prototype, "capitalize", {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

const send = async function ({
  messageArr,
  channel,
  token,
  actionLink,
  workflowName,
  oldVersion,
  newVersion,
  customSubTitle,
}) {
  const slack = new WebClient(token);
  const blocks = [
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:tada::tada: *<${actionLink}|${workflowName.capitalize()}>* | A new tag was released/deployed :tada::tada:`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Changelog*`,
      },
    },
  ];
  /* 
      Terrible workaround to deal with Slack API limitations 
      Every 10 lines per message block, to avoind 3k characters limitation
    */
  let count = 0;
  let tempText;

  if (customSubTitle !== "none") {
    let subTitle = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: customSubTitle,
      },
    };
    blocks.push(subTitle);
  }

  if (oldVersion !== "none" && newVersion !== "none") {
    let versions = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Old Version: \`${oldVersion}\`\nNew Version: \`${newVersion}\``,
      },
    };
    blocks.push(versions);
  }

  await messageArr.forEach((change) => {
    if (count < 7) {
      if (tempText === undefined) {
        tempText = change;
      } else {
        tempText = tempText + "\n" + change;
      }
      count++;
    } else if (count == 7) {
      tempText = tempText + "\n" + change;
      let tempTextObj = {
        type: "section",
        text: { type: "mrkdwn", text: tempText },
      };
      blocks.push(tempTextObj);
      tempText = "";
      count = 0;
    } else {
      tempText = "";
      count = 0;
    }
  });
  /* End of workaround */
  core.debug(
    `BlockKit Definition: ${util.inspect(blocks, { maxArrayLength: null })}`
  );
  const sendMessage = await slack.chat.postMessage({
    text: "A new tag was released/deployed...",
    blocks: blocks,
    channel: channel,
  });
  core.debug(
    `Slack API Response ${util.inspect(sendMessage, { maxArrayLength: null })}`
  );
  core.info(`Successfully send message to ${channel}`);
  return sendMessage;
};

module.exports = send;
