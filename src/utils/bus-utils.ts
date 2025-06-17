import type { BranchHistory } from "../store/branch-history-store"

function rule(it: BranchHistory): number {
  const { lastSwitchTime, frequency } = it
  const lastHour = 36001000
  const lastDay = 86400000
  const lastWeek = 604800000
  const duration = Date.now() - lastSwitchTime
  if (duration <= lastHour) {
    return frequency * 4
  }
  if (duration <= lastDay) {
    return frequency * 2
  }
  if (duration <= lastWeek) {
    return frequency / 2
  }
  return frequency / 4
}

export { rule }
