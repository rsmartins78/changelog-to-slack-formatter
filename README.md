This action receives an unformatted multiline text and create hyperlinks, finding Jira Tickets and Github PRs using RegExp. The created hyperlinks are following Slack's format. It's recomended if your team squash commits from feature branches to main, and the commit message contains a Jira Task ID, like `PROJ-1923`.  
This action doens't send the message to Slack channel, neither generate the log between two tags, just format the message, creating the hyperlinks following the Slack's pattern.

## Inputs

### \*`changeLogInput`

Text you want to format, it is usually a result from another command, like `git log`.

### \*`jiraTicketPattern`

RegExp to find the Jira Ticket in the commit messages. E.g. `'PROJ-\d+'`.

### \*`jiraURL`

Jira URL used to create the Task URL. E.g. `https://jira.company.com`.

### `githubServer`

URL of the Github server, defaults to https://github.com

## Outputs

### `formattedChangelog`

Formatted message, ready to send to Slack.

## Example usage

```yaml
changelog:
  runs-on: ubuntu-20.04
  name: Formatter
  steps:
    - id: gitlog
      env:
        old_version: '1.0.0'
        new_version: '1.2.0'
      run:
        ## Workarround to generate a multiline shell variable in Github Actions
        GITLOG=$(git log ${{ env.old_version }}..${{ env.new_version }} --oneline | cut -f 2- -d ' ')
        echo "GITLOG<<EOF" >> $GITHUB_ENV
        echo "*Old Version: \`${{ env.old_version }}\`*" >> $GITHUB_ENV
        echo "*New version: \`${{ env.new_version }}\`*" >> $GITHUB_ENV
        echo "*Changes:*" >> $GITHUB_ENV
        echo "$GITLOG" >> $GITHUB_ENV
        echo "EOF" >> $GITHUB_ENV

        ## Example of expected output from these commands ##
        # PROJ-2684 Set info log level for Inventory Service. (#2151)
        # PROJ-NONE add BadgeBase component (#2150)
        # PROJ-NONE Extend FieldsControllerInput.tsx with AutoDropdown (#2134)
        # PROJ-2684, PROJ-1234 Fix stuck transaction polling jobs. (#2143)
        # PROJ-NONE Updating Datadog Java Agent Version (#2148)
        # PROJ-NONE Fixing environment validation on tf-deploy (#2147)
        # PROJ-NONE Applying podAntiAffinity on envoy-linkerd
        # PROJ-8347 Revert (Applying podAntiAffinity on envoy-linkerd (#1445)) (#2145)
        # PROJ-2178 add tooltip and fix dropdown bug (#2122)
        # PROJ-2645 create trades review page (#2102)
        # PROJ-2674 Sending changelog between versions to slack (#2144)

        if [[ ! -z $GITLOG ]]; then echo "::set-output name=log::true"; fi
        ## you can use this output to validate if the changelog was generated before following with the workflow
    - uses: rsmartins78/changelog-to-slack-formatter@v1
      id: changelog
      if: steps.gitlog.outputs.log == 'true' ## optional
      with:
        changeLogInput: ${{ env.GITLOG }}
        jiraTicketPattern: 'PROJ-\d+'
        jiraURL: "https://jira.company.com"
    - uses: rtCamp/action-slack-notify@v2.2.0
      if: steps.gitlog.outputs.log == 'true' ## optional
      env:
        SLACK_MESSAGE: ${{ steps.changelog.outputs.formattedChangelog }}
        SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```
