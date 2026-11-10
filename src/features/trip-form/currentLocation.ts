import type { Place } from '@/api/types'

/** Resolve the device position as a Place. Rejects with a readable message. */
export function getCurrentPlace(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device cannot share its location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ label: 'Current location', name: 'Current location', region: '', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("Couldn't get your location. Allow location access or type a place.")),
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  })
}
