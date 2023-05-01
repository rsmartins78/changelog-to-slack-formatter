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
  customTitle,
  customSubTitle,
  environment,
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
        text: `:tada::tada: *<${actionLink}|${workflowName.capitalize()}>* | ${
          customTitle !== "none"
            ? customTitle.capitalize() + " :tada::tada:"
            : "A new tag was released/deployed :tada::tada:"
        }`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Changelog ${
          environment !== "none" ? " - " + environment.capitalize() : ""
        }*`,
      },
    },
  ];

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
  let messageText = messageArr.join("\r\n");
  const maxLength = 3000;
  if (messageText.length > maxLength) {
    const chunks = messageText.match(new RegExp(`.{1,${maxLength}}`, "g"));
    chunks.forEach((chunk) => {
      const tempTextObj = {
        type: "section",
        text: { type: "mrkdwn", text: chunk },
      };
      blocks.push(tempTextObj);
    });
  } else {
    const tempTextObj = {
      type: "section",
      text: { type: "mrkdwn", text: messageText },
    };
    blocks.push(tempTextObj);
  }

  core.debug(
    `BlockKit Definition: ${util.inspect(blocks, { maxArrayLength: null })}`
  );

  const sendMessage = await slack.chat.postMessage({
    text: `${
      customTitle !== "none"
        ? customTitle.capitalize() + " :tada::tada:"
        : "A new tag was released/deployed :tada::tada:"
    }`,
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
