import { mapStyleUrl } from './mapStyle'

describe('mapStyleUrl', () => {
  it('uses the MapTiler streets-v2 styles when a key is configured', () => {
    expect(mapStyleUrl('light')).toBe('https://api.maptiler.com/maps/streets-v2/style.json?key=test-key')
    expect(mapStyleUrl('dark')).toBe('https://api.maptiler.com/maps/streets-v2-dark/style.json?key=test-key')
  })
})
