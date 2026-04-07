const SKIP_MAINTENANCE_KEY = "skipMaintenance";

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();
  if (config.public.maintenance) {
    if (
      to.query.skipMaintenance ||
      (import.meta.client &&
        typeof localStorage !== "undefined" &&
        localStorage.getItem(SKIP_MAINTENANCE_KEY))
    ) {
      if (import.meta.client && to.query.skipMaintenance) {
        localStorage.setItem(SKIP_MAINTENANCE_KEY, "1");
      }
      return;
    }
    if (to.path !== "/maintenance") {
      return navigateTo("/maintenance", { replace: true });
    }
    return;
  }
  if (to.path === "/maintenance") {
    return navigateTo("/", { replace: true });
  }
});
