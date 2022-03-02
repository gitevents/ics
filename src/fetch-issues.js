import matter from 'gray-matter'
import moment from 'moment'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function fetchIssues(octokit, locationsFile) {
  let locations = []
  if (locationsFile) {
    const file = await readFile(join(process.cwd(), locationsFile), 'utf8')
    locations = JSON.parse(file)
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
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
                  name
                  url
                }
              }
              reactions(first: 100, content: THUMBS_UP) {
                edges {
                  node {
                    user {
                      name
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
    const { content, data } = matter(issue.body)

    if (!data) {
      return { error: 'no event data found' }
    }

    const startDate = data.startDate.split('.').reverse()
    const startTime = parseFloat(data.startTime)
      .toFixed(2)
      .toString()
      .split('.')
    const duration = moment.duration(
      `PT${data.duration.replace(/\s/g, '').toUpperCase()}`
    )

    const event = {
      productId: 'gitevents/ics',
      start: startDate.concat(startTime).map((n) => parseInt(n)),
      duration: {
        hours: duration.get('hours'),
        minutes: duration.get('minutes')
      },
      title: issue.title,
      description: content,
      url: issue.url,
      categories: issue.labels.nodes.map((l) => l.name),
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: issue.author.name },
      attendees: issue.reactions.edges.map((r) => {
        return {
          name: r.node.user.name,
          rsvp: true,
          partstat: 'ACCEPTED',
          dir: r.node.user.url
        }
      })
    }

    if (locations && locations.length > 0) {
      const location = locations.find((l) => l.id === data.location)
      event.location = location.name
      if (location.geo) {
        const [lat, lon] = location.geo
        event.geo = { lat, lon }
      }
    } else {
      event.location = data.location
    }

    events.push(event)
  }

  return events
}
