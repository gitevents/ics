import core from '@actions/core'
import github from '@actions/github'
import { createIcs } from './create-ics.js'
import { fetchIssues } from './fetch-issues.js'

async function run() {
  core.info('Starting GitEvents ICS ...')
  const repoToken = core.getInput('repo-token')
  // const timezoneId = core.getInput('default-timezone')
  const locationsFile = core.getInput('locations')

  const octokit = github.getOctokit(repoToken)

  const events = await fetchIssues(octokit, locationsFile)
  await createIcs(events)
}

run()
