import { readFile } from 'fs/promises'
import { join } from 'path'
import bodyParser from '@zentered/issue-forms-body-parser'
import { zonedTimeToUtc } from 'date-fns-tz'

export async function fetchIssues(
  octokit,
  locationsFile,
  timeZone = 'Europe/Nicosia'
) {
  let locations = []
  if (locationsFile) {
    const file = await readFile(join(process.cwd(), locationsFile), 'utf8')
    locations = JSON.parse(file)
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
  // const [owner, repo] = ['cyprus-developer-community', 'events']

  const response = await octokit.graphql(
    `
    query lastIssues($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(
          filterBy: {labels: "Approved :white_check_mark:"}
          orderBy: {field: CREATED_AT, direction: ASC}
          first: 100
        ) {
          edges {
            node {
              id
              state
              url
              title
              body
              createdAt
              updatedAt
              labels(first:10) {
                nodes {
                  name
                }
              }
              author {
                ... on User {
                  login
                  name
                  url
                }
              }
              reactions(first: 100, content: THUMBS_UP) {
                edges {
                  node {
                    user {
                      name
                      login
                      url
                    }
                  }
                }
              }
            }
          }
          totalCount
        }
      }
    }
  `,
    {
      owner: owner,
      repo: repo
    }
  )
  // console.log(JSON.stringify(response, null, 2))

  const events = []
  for (const edge of response.repository.issues.edges) {
    const issue = edge.node
    const parsedBody = await bodyParser(issue.body)

    if (process.env.DEBUG === 'true') {
      console.log('issue', issue)
      console.log('parsedBody', parsedBody)
    }

    if (parsedBody && Object.keys(parsedBody).length > 0) {
      const startTime = parsedBody.time
      const startDate = parsedBody.date
      const duration = parsedBody.duration?.duration
      const content = parsedBody['event-description']
      const location = parsedBody.location

      if (startDate && startDate.date && startTime.time) {
        const zonedDateTime = `${startDate.date}T${startTime.time}`

        const utcDate = zonedTimeToUtc(zonedDateTime, timeZone)
          .toJSON()
          .split(/[-,T,:,.]+/)
          .splice(0, 5)
          .map((i) => parseInt(i))

        const organizer =
          issue.author.name && issue.author.name.length > 0
            ? issue.author.name
            : issue.author?.login

        const event = {
          productId: 'gitevents/ics',
          start: utcDate,
          duration: duration,
          title: issue.title,
          description: content.text,
          url: issue.url,
          categories: issue.labels.nodes.map((l) => l.name),
          busyStatus: 'BUSY',
          status: 'CONFIRMED',
          organizer: { name: organizer },
          attendees: issue.reactions.edges.map((r) => {
            return {
              name:
                r.node.user.name?.length > 0
                  ? r.node.user.name
                  : r.node.user.login,
              rsvp: true,
              partstat: 'ACCEPTED',
              dir: r.node.user.url
            }
          })
        }

        // TODO: check if the event is in the future
        if (zonedTimeToUtc(zonedDateTime) > new Date()) {
          if (issue.state === 'CLOSED') {
            event.status = 'CANCELLED'
          }
        }

        if (location) {
          if (locations && locations.length > 0) {
            const locationLookup = locations.find((l) => l.id === location.id)
            if (!locationLookup) {
              event.location = location.text
            } else {
              event.location = locationLookup.name
              if (locationLookup.geo) {
                const [lat, lon] = locationLookup.geo
                event.geo = { lat, lon }
              }
            }
          } else {
            event.location = location.text ? location.text : ''
          }
        } else {
          event.location = ''
        }

        events.push(event)
      }
    } else {
      console.log('there was an error parsing date and time')
    }
  }

  return events
}
