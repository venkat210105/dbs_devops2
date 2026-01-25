import { API_BASE } from './utils/apiBase';

export const fetchDashboardData = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard`);
  if (!response.ok) throw new Error("Failed to fetch dashboard data");
  return response.json();
};
