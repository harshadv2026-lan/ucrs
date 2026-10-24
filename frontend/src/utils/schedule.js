// Schedule parsing & conflict utility for Timetable & Course Registration

const TIME_REGEX = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/

const DAY_MAP = {
  MON: 'Mon', MONDAY: 'Mon', M: 'Mon',
  TUE: 'Tue', TUESDAY: 'Tue', T: 'Tue',
  WED: 'Wed', WEDNESDAY: 'Wed', W: 'Wed',
  THU: 'Thu', THURSDAY: 'Thu', TH: 'Thu', R: 'Thu',
  FRI: 'Fri', FRIDAY: 'Fri', F: 'Fri',
  SAT: 'Sat', SATURDAY: 'Sat', S: 'Sat'
}

export function parseSchedule(scheduleStr) {
  if (!scheduleStr || scheduleStr.trim() === '' || scheduleStr.toUpperCase() === 'TBA') {
    return null
  }

  const match = scheduleStr.match(TIME_REGEX)
  if (!match) return null

  const startHour = parseInt(match[1], 10)
  const startMin = parseInt(match[2], 10)
  const endHour = parseInt(match[3], 10)
  const endMin = parseInt(match[4], 10)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const dayPart = scheduleStr.substring(0, match.index).trim()
  const rawDays = dayPart.split(/[/,\s]+/)
  const days = []

  rawDays.forEach(r => {
    const cleaned = r.toUpperCase().replace(/[^A-Z]/g, '')
    if (DAY_MAP[cleaned] && !days.includes(DAY_MAP[cleaned])) {
      days.push(DAY_MAP[cleaned])
    }
  })

  if (days.length === 0) return null

  return {
    days,
    startMinutes,
    endMinutes,
    startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
    endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
  }
}

/**
 * Checks whether two schedule strings overlap on at least one day and time.
 */
export function hasScheduleConflict(schedA, schedB) {
  const pA = parseSchedule(schedA)
  const pB = parseSchedule(schedB)
  if (!pA || !pB) return false

  const commonDays = pA.days.filter(d => pB.days.includes(d))
  if (commonDays.length === 0) return false

  // Overlap: startA < endB && endA > startB
  const timeOverlap = pA.startMinutes < pB.endMinutes && pA.endMinutes > pB.startMinutes
  return timeOverlap
}

/**
 * Checks candidate schedule against a list of active registrations.
 * Returns the conflicting registration object or null.
 */
export function findConflictingRegistration(candidateSchedule, activeRegistrations) {
  if (!candidateSchedule || !activeRegistrations || activeRegistrations.length === 0) {
    return null
  }
  for (const reg of activeRegistrations) {
    const sched = reg.schedule || reg.offering?.schedule
    if (sched && hasScheduleConflict(candidateSchedule, sched)) {
      return reg
    }
  }
  return null
}
