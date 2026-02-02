/**
 * Admin authentication utility functions
 */

// Define types for API responses
interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    email: string;
    name: string;
    roles: string[];
  };
}

/**
 * Check if user is authenticated
 * @returns boolean indicating if user is logged in
 */
export const isAuthenticated = (): boolean => {
  try {
    const adminToken = localStorage.getItem('adminToken');
    return adminToken !== null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Check if user has a specific role
 * @param role - The role to check for (e.g., 'admin', 'bse_manager', 'rbi_manager')
 * @returns boolean
 */
export const hasRole = (role: string): boolean => {
  try {
    const rolesJson = localStorage.getItem('userRoles');
    if (!rolesJson) return false;

    const roles: string[] = JSON.parse(rolesJson);
    return roles.includes('admin') || roles.includes(role);
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
};

/**
 * Get all user roles
 * @returns string[]
 */
export const getUserRoles = (): string[] => {
  try {
    const rolesJson = localStorage.getItem('userRoles');
    return rolesJson ? JSON.parse(rolesJson) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Store user session after successful login
 */
export const storeUserSession = (data: AdminLoginResponse): void => {
  if (data.token) localStorage.setItem('adminToken', data.token);
  if (data.user) {
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userRoles', JSON.stringify(data.user.roles));
    localStorage.setItem('isAdmin', data.user.roles.includes('admin') ? 'true' : 'false');
  }
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
  try {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('isAdmin');

    // Optional: Redirect to login or home
    window.location.href = '/';
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Legacy support for isAdmin (remapping to check 'admin' role)
export const isAdmin = (): boolean => hasRole('admin');
