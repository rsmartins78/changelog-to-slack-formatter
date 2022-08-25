const { WebClient } = require("@slack/web-api");

export const send = async function ({
  messageArr,
  channel,
  token,
  actionLink,
  workflowName,
}) {
  const slack = new WebClient(token);
  const attachments = [(blocks = [])];
  const header_blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `A new tag was released/deployed | <${actionLink}|${workflowName}>`,
      },
    },
  ];

  /* 
      Terrible workaround to deal with Slack API limitations 
      Every 10 lines per message block, to avoind 3k characters limitation
    */
  //   let count = 0;
  //   let tempText;
  await messageArr.forEach((change) => {
    // if (count < 7) {
    //   if (tempText === undefined) {
    //     tempText = change;
    //   } else {
    //     tempText = tempText + "\n" + change;
    //   }
    //   count++;
    // } else if (count == 7) {
    tempText = tempText + "\n" + change;
    // tempTextObj = {
    //   type: "section",
    //   text: { type: "mrkdwn", text: tempText },
    // };
    // blocks.push(tempTextObj);
    // tempText = "";
    // count = 0;
    // } else {
    //   tempText = "";
    //   count = 0;
    // }
  });
  tempTextObj = {
    type: "section",
    text: { type: "mrkdwn", text: tempText },
  };
  attachments.blocks.push(tempTextObj);

  /* End of workaround */
  const sendMessage = await slack.chat.postMessage({
    text: "A new tag was released/deployed...",
    blocks: header_blocks,
    attachments: attachments,
    channel: slackChannel,
  });

  core.info(`Successfully send message to ${channel}`);
  return sendMessage;
};
