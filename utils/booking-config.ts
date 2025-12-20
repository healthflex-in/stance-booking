/**
 * Booking Configuration Service
 * 
 * SIMPLIFIED: Only stores org ID and default center ID for user creation.
 * Everything else (centers list, services, slots) is fetched dynamically from backend APIs.
 */

export interface OrganizationConfig {
  id: string;
  name: string;
  slug: string;
  defaultCenterId: string; // Used for initial user creation only
}

/**
 * Organization Configuration
 * Add new organizations here as needed
 * 
 * NOTE: Centers, services, and slots are fetched dynamically from backend.
 * We only need org ID and default center ID for patient creation.
 */
const ORGANIZATIONS: Record<string, OrganizationConfig> = {
  'stance-health': {
    id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '67fe35f25e42152fb5185a5e',
    name: 'Stance Health',
    slug: 'stance-health',
    defaultCenterId: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c',
  },
  'hyfit': {
    id: '680a022b4016433614c80d73',
    name: 'HyFit',
    slug: 'hyfit',
    defaultCenterId: '693ba0c1e21301823761c77d',
  },
  // Add more organizations here as needed:
  // 'partner-clinic': {
  //   id: 'partner-org-id-here',
  //   name: 'Partner Clinic',
  //   slug: 'partner-clinic',
  //   defaultCenterId: 'partner-default-center-id-here',
  // },
};

/**
 * Get organization configuration by slug
 */
export function getOrganizationBySlug(slug: string): OrganizationConfig | null {
  return ORGANIZATIONS[slug] || null;
}

/**
 * Get organization configuration by ID
 */
export function getOrganizationById(id: string): OrganizationConfig | null {
  return Object.values(ORGANIZATIONS).find((org) => org.id === id) || null;
}

/**
 * Get default organization (first in list or from env)
 */
export function getDefaultOrganization(): OrganizationConfig {
  // Try to get from env first
  const defaultOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
  if (defaultOrgId) {
    const org = getOrganizationById(defaultOrgId);
    if (org) return org;
  }
  
  // Fallback to first organization
  return Object.values(ORGANIZATIONS)[0];
}

/**
 * Get all organizations
 */
export function getAllOrganizations(): OrganizationConfig[] {
  return Object.values(ORGANIZATIONS);
}

/**
 * Validate if an organization slug exists
 */
export function isValidOrganizationSlug(slug: string): boolean {
  return slug in ORGANIZATIONS;
}

/**
 * Get default center ID for an organization
 * Used only for initial patient creation
 */
export function getDefaultCenterId(orgSlug: string): string | null {
  const org = ORGANIZATIONS[orgSlug];
  return org?.defaultCenterId || null;
}

/**
 * Get API key from environment
 */
export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}

