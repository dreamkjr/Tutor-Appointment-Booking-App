/**
 * Debugging utilities for API and environment issues
 */

import { getEnvironmentConfig, getHealthCheckUrl } from './environment';

export interface DebugInfo {
  environment: ReturnType<typeof getEnvironmentConfig>;
  location: {
    href: string;
    hostname: string;
    port: string;
    protocol: string;
  };
  userAgent: string;
  timestamp: string;
}

export interface ApiDebugTest {
  name: string;
  url: string;
  method: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

/**
 * Collects comprehensive debug information
 */
export function getDebugInfo(): DebugInfo {
  return {
    environment: getEnvironmentConfig(),
    location: {
      href: window.location.href,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
    },
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Tests API connectivity and reports results
 */
export async function runApiDiagnostics(): Promise<ApiDebugTest[]> {
  const config = getEnvironmentConfig();
  const tests: ApiDebugTest[] = [];

  // Test 1: Health check
  const healthTest: ApiDebugTest = {
    name: 'Health Check',
    url: getHealthCheckUrl(),
    method: 'GET',
    status: 'pending',
  };
  tests.push(healthTest);

  try {
    const start = Date.now();
    const response = await fetch(healthTest.url, {
      method: 'GET',
      credentials: config.isCloudWorkstation ? 'include' : 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    });

    healthTest.duration = Date.now() - start;
    healthTest.response = await response.json();
    healthTest.status = response.ok ? 'success' : 'error';
  } catch (error) {
    healthTest.status = 'error';
    healthTest.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Test 2: Students API
  const studentsTest: ApiDebugTest = {
    name: 'Students API',
    url: `${config.apiUrl}/students`,
    method: 'GET',
    status: 'pending',
  };
  tests.push(studentsTest);

  try {
    const start = Date.now();
    const response = await fetch(studentsTest.url, {
      method: 'GET',
      credentials: config.isCloudWorkstation ? 'include' : 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    studentsTest.duration = Date.now() - start;
    studentsTest.response = await response.json();
    studentsTest.status = response.ok ? 'success' : 'error';
  } catch (error) {
    studentsTest.status = 'error';
    studentsTest.error =
      error instanceof Error ? error.message : 'Unknown error';
  }

  return tests;
}

/**
 * Logs comprehensive debug information to console
 */
export function logDebugInfo(): void {
  const info = getDebugInfo();

  console.group('🔍 Debug Information');
  console.log('📍 Location:', info.location);
  console.log('🌍 Environment:', info.environment);
  console.log('🖥️ User Agent:', info.userAgent);
  console.log('⏰ Timestamp:', info.timestamp);
  console.groupEnd();
}

/**
 * Runs and logs API diagnostics
 */
export async function runAndLogDiagnostics(): Promise<void> {
  console.group('🏥 API Diagnostics');

  const tests = await runApiDiagnostics();

  tests.forEach((test) => {
    const icon =
      test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⏳';

    console.group(`${icon} ${test.name}`);
    console.log('URL:', test.url);
    console.log('Method:', test.method);
    console.log('Status:', test.status);

    if (test.duration) {
      console.log('Duration:', `${test.duration}ms`);
    }

    if (test.response) {
      console.log('Response:', test.response);
    }

    if (test.error) {
      console.error('Error:', test.error);
    }

    console.groupEnd();
  });

  console.groupEnd();
}
