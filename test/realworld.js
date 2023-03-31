import github from '@actions/github'
import { fetchIssues, fetchIssues as fn } from '../src/fetch-issues.js'

const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
const locationsFile = ''
const timeZone = 'Europe/Athens'
const events = await fetchIssues(octokit, locationsFile, timeZone)
console.log(JSON.stringify(events, null, 2))
