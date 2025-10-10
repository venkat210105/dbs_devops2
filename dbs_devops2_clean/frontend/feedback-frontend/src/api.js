export const fetchDashboardData = async () => {
  const response = await fetch("http://localhost:8085/api/dashboard");
  if (!response.ok) throw new Error("Failed to fetch dashboard data");
  return response.json();
};
