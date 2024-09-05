import github from '@actions/github'
import { createIcs } from '../src/create-ics.js'
import { fetchIssues } from '../src/fetch-issues.js'

async function run() {
  const repoToken = process.env.GH_TOKEN
  const locationsFile = 'locations.json'
  const timeZone = 'America/Denver'

  const octokit = github.getOctokit(repoToken)

  const events = await fetchIssues(octokit, locationsFile, timeZone)

  await createIcs(events)
}

run()
