/**
 * Returns the external (patient-facing) name of a service.
 * Falls back to internal name if externalName is not set.
 */
export function getServiceName(service: { name?: string; externalName?: string } | null | undefined): string {
  if (!service) return ''
  return service.externalName || service.name || ''
}
