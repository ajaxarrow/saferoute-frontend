import { RISK, RISK_ORDER, riskFromInt } from './risk'

describe('risk style module', () => {
  it('maps backend ints to levels', () => {
    expect(riskFromInt(0)).toBe('LOW')
    expect(riskFromInt(4)).toBe('NO_TRAVEL')
  })

  it('orders levels with strictly increasing rank', () => {
    const ranks = RISK_ORDER.map((l) => RISK[l].rank)
    expect(ranks).toEqual([0, 1, 2, 3, 4])
  })

  it('never relies on colour alone: every level has a distinct colour, icon and label', () => {
    const levels = Object.values(RISK)
    expect(new Set(levels.map((l) => l.color)).size).toBe(5)
    expect(new Set(levels.map((l) => l.icon)).size).toBe(5)
    expect(new Set(levels.map((l) => l.label)).size).toBe(5)
  })
})
