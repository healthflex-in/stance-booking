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
  'devhyfit': {
    id: '680a022b4016433614c80d73',
    name: 'devHyFit',
    slug: 'devhyfit',
    defaultCenterId: '693ba0c1e21301823761c77d',
  },
    'hyfit': {
    id: '680a021e4016433614c80d6b',
    name: 'HyFit',
    slug: 'hyfit',
    defaultCenterId: '6948e9e3d2c4d4de0979ce93',
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
 * Get token package ID by center ID
 * Used for token payment (₹100) package creation
 * @deprecated Use getTokenPackageIdByServiceId instead
 */
export function getTokenPackageIdByCenterId(centerId: string): string | null {
  // All three centers are in Stance Health organization
  const centerPackageMap: Record<string, string | undefined> = {
    // Development center IDs
    '67fe36545e42152fb5185a6c': process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID, // Stance Health - Indiranagar (dev)
    '693ba0c1e21301823761c77d': process.env.NEXT_PUBLIC_WHITEFIELD_PACKAGE_ID,  // Stance Health - Whitefield (dev)
    '6948e9e3d2c4d4de0979ce93': process.env.NEXT_PUBLIC_HSR_PACKAGE_ID,         // Stance Health - HSR (dev)
    
    // Production center IDs
    '688092ed7110183bb855bbb7': process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID, // Stance Health - Indiranagar (prod)
    '68468dd74aa11d735edd5d64': process.env.NEXT_PUBLIC_WHITEFIELD_PACKAGE_ID,  // Stance Health - Whitefield (prod)
    '6825aaa0d6f864397d730519': process.env.NEXT_PUBLIC_HSR_PACKAGE_ID,         // Stance Health - HSR (prod)
  };
  
  return centerPackageMap[centerId] || null;
}

/**
 * Get token package ID by service ID and center ID
 * Used for token payment package creation
 * Packages are specific to both service AND center
 */
export function getTokenPackageIdByServiceAndCenter(serviceId: string, centerId: string): string | null {
  // Map (service + center) to their corresponding token packages
  // Format: 'serviceId:centerId': 'packageId'
  const servicePackageMap: Record<string, string | undefined> = {
    // Stance Circle Day Assessment (6996db75122ea6953b7b3012) - ₹100 token packages
    '6996db75122ea6953b7b3012:6825aaa0d6f864397d730519': '6996e2048b99b818f6a65f21', // HSR - ₹100
    '6996db75122ea6953b7b3012:68468dd74aa11d735edd5d64': '6996e2888b99b818f6a66076', // Whitefield - ₹100
    '6996db75122ea6953b7b3012:688092ed7110183bb855bbb7': '6996e2ec8b99b818f6a66113', // Indiranagar - ₹100
    
    // Insider Day service (6960a532c64acf3d3279ab52)
    '6960a532c64acf3d3279ab52:6825aaa0d6f864397d730519': '6997f76f8b99b818f6a79674', // HSR - ₹100
    
    // Referral - First Assessment (69ae80ea6242fdf87cb8ecd4) - ₹100 token, ₹400 balance
    '69ae80ea6242fdf87cb8ecd4:688092ed7110183bb855bbb7': '69ae82154a33d641136d2213', // Indiranagar - ₹100
    '69ae80ea6242fdf87cb8ecd4:6825aaa0d6f864397d730519': '69ae82154a33d641136d2213', // HSR - ₹100
    '69ae80ea6242fdf87cb8ecd4:68468dd74aa11d735edd5d64': '69ae82154a33d641136d2213', // Whitefield - ₹100
    
    // TODO: Add more service+center to package mappings here
  };
  
  const key = `${serviceId}:${centerId}`;
  return servicePackageMap[key] || null;
}

/**
 * Get token package ID by service ID
 * Used for token payment (₹100) package creation
 * @deprecated Use getTokenPackageIdByServiceAndCenter instead for better accuracy
 */
export function getTokenPackageIdByServiceId(serviceId: string): string | null {
  // Map service IDs to their corresponding token packages
  // The package's "services" array in DB contains the service IDs it's valid for
  const servicePackageMap: Record<string, string | undefined> = {
    // Insider Day Balance - HSR package (6997f76f8b99b818f6a79674)
    // Valid for service: 6960a532c64acf3d3279ab52
    '6960a532c64acf3d3279ab52': '6997f76f8b99b818f6a79674',
    
    // Stance Circle Day Assessment - defaults to HSR package
    '6996db75122ea6953b7b3012': '6997f76f8b99b818f6a79674',
    
    // TODO: Add more service-to-package mappings here
    // Format: 'service-id': 'package-id'
    // The package should have this service ID in its "services" array in the database
  };
  
  return servicePackageMap[serviceId] || null;
}

/**
 * Get API key from environment
 */
export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}

