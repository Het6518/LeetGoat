import { useEffect, useState } from "react";
import { PLAN_META_KEY, refreshPlanMeta, type PlanMetaCache } from "../lib/plans";
import { useStorageValue } from "./useStorage";

export function usePlanMeta(canRefresh: boolean) {
  const meta = useStorageValue<PlanMetaCache | null>(PLAN_META_KEY, null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = (force: boolean) => {
    setRefreshing(true);
    refreshPlanMeta(force)
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (canRefresh) void refreshPlanMeta(false).catch(() => undefined);
  }, [canRefresh]);

  return { meta, refreshing, refresh };
}
