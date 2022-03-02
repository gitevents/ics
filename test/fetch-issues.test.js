'use strict'

import t from 'tap'
const test = t.test
import { fetchIssues as fn } from '../src/fetch-issues.js'
// import response from './fixtures/repo-issues.json' assert { type: 'json' }
const response = {
  repository: {
    issues: {
      edges: [
        {
          node: {
            id: 'I_kwDOG7tNxM5E9yP8',
            url: 'https://github.com/gitevents/ics-test/issues/1',
            title: 'testing events',
            body: '---\r\nstartDate: 20.03.2022\r\nstartTime: 18.00\r\nduration: 1h\r\nlocation: idea\r\n\r\n---\r\n\r\nThis is a demo event to test the new module.\r\n',
            createdAt: '2022-03-02T11:13:46Z',
            updatedAt: '2022-03-02T11:14:04Z',
            labels: {
              nodes: [
                {
                  name: 'nicosia'
                },
                {
                  name: 'events'
                },
                {
                  name: 'Approved :white_check_mark:'
                }
              ]
            },
            author: {
              name: 'Patrick Heneise',
              url: 'https://github.com/PatrickHeneise'
            },
            reactions: {
              edges: [
                {
                  node: {
                    id: 'REA_lAHOG7tNxM5E9yP8zgkRAYs',
                    user: {
                      name: 'Patrick Heneise',
                      url: 'https://github.com/PatrickHeneise'
                    }
                  }
                }
              ]
            }
          }
        }
      ],
      totalCount: 1
    }
  }
}

test('fetchIssues() returns parsed issues/events', async (t) => {
  const octokit = {
    graphql: function () {
      return response
    }
  }

  const actual = await fn(octokit)
  t.ok(actual)
})
