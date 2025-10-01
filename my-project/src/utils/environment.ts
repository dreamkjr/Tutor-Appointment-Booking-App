/**
 * Environment detection and URL configuration utilities
 * Handles both localhost and Google Cloud Workstations deployments
 */

export interface EnvironmentConfig {
  apiUrl: string;
  isCloudWorkstation: boolean;
  frontendUrl: string;
  backendUrl: string;
}

/**
 * Detects if we're running in Google Cloud Workstations
 */
export function isGoogleCloudWorkstation(): boolean {
  return window.location.hostname.includes('cloudworkstations.dev');
}

/**
 * Extracts the base domain from Google Cloud Workstations URL
 * Example: "3000-firebase-tutor-appointment-1759320408308.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev"
 * Returns: "firebase-tutor-appointment-1759320408308.cluster-yylgzpipxrar4v4a72liastuqy.cloudworkstations.dev"
 */
function getCloudWorkstationBaseDomain(): string {
  const hostname = window.location.hostname;
  // Remove the port prefix (e.g., "3000-" or "5000-")
  const withoutPortPrefix = hostname.replace(/^\d+-/, '');
  return withoutPortPrefix;
}

/**
 * Gets the current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isCloud = isGoogleCloudWorkstation();

  if (isCloud) {
    const baseDomain = getCloudWorkstationBaseDomain();
    const backendUrl = `https://5000-${baseDomain}`;
    const frontendUrl = `https://3000-${baseDomain}`;

    return {
      apiUrl: `${backendUrl}/api/v1`,
      isCloudWorkstation: true,
      frontendUrl,
      backendUrl,
    };
  } else {
    // Local development
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const frontendUrl = `${window.location.protocol}//${window.location.host}`;

    return {
      apiUrl: `${backendUrl}/api/v1`,
      isCloudWorkstation: false,
      frontendUrl,
      backendUrl,
    };
  }
}

/**
 * Gets the health check URL for the backend
 */
export function getHealthCheckUrl(): string {
  const config = getEnvironmentConfig();
  return `${config.backendUrl}/health`;
}

/**
 * Logs the current environment configuration for debugging
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironmentConfig();
  console.log('🌍 Environment Configuration:', {
    ...config,
    location: window.location.href,
    userAgent: navigator.userAgent,
  });
}
