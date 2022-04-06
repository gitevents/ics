'use strict'

import t from 'tap'
const test = t.test
import { fetchIssues as fn } from '../src/fetch-issues.js'
import ics from 'ics'

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
            body: "### Event Description\n\nLet's meet for coffee and chat about tech, coding, Cyprus and the newly formed CDC (Cyprus Developer Community).\n\n### Location\n\n[Caffe Nero Finikoudes, Larnaka](https://goo.gl/maps/Bzjxdeat3BSdsUSVA)\n\n### Date\n\n11.03.2022\n\n### Time\n\n16:00\n\n### Duration\n\n2h\n\n### Code of Conduct\n\n- [X] I agree to follow this project's [Code of Conduct](https://berlincodeofconduct.org)",
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
  const { error, value } = ics.createEvents(actual)
  const lines = value.split(/\n/g)
  t.deepEqual(actual[0].start, [2022, 3, 11, 14, 0])
  t.equal(lines[10].replace(/[\n\r]/g, ''), 'DTSTART:20220311T120000Z')
  t.ok(actual)
  t.ok(value)
  t.notOk(error)
})
