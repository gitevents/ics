import ics from 'ics'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function createIcs(events) {
  const { error, value } = ics.createEvents(events)
  if (error || !value || value.length <= 0) {
    console.error(error)
    return
  } else {
    return writeFile(join(process.cwd(), 'events.ics'), value, {
      encoding: 'utf8'
    })
  }
}
