import { mapStyleUrl } from './mapStyle'

describe('mapStyleUrl', () => {
  it('uses the MapTiler streets styles when a key is configured', () => {
    expect(mapStyleUrl('light')).toBe('https://api.maptiler.com/maps/streets-v4/style.json?key=test-key')
    expect(mapStyleUrl('dark')).toBe('https://api.maptiler.com/maps/streets-v4-dark/style.json?key=test-key')
  })
})
