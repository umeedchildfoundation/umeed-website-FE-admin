/**
 * Central API re-export
 *
 * Import individual service modules directly for new code.
 * This file only keeps narrow exports still needed by existing pages.
 */
export { default as apiClient } from "./apiClient";

// authService alias used by VolunteersPage / ApplicationsPage
export { authApi as authService } from "../services/authApi";

export const isDemoMode = false;
