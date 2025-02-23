export async function verifyPassword(password: string): Promise<boolean> {
  // For development and testing, you can set a default password in .env.local
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === adminPassword;
}

// Function to check if admin password exists
export function hasAdminPassword(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

// Export constant for use in client components
export const AUTH_ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Invalid password',
  PASSWORD_REQUIRED: 'Password is required',
  GENERIC_ERROR: 'An error occurred while verifying credentials'
} as const;
