import { useEffect, useState } from "react";
import { getListingsV2 } from "@/services/api"; // however you call your API

export function useBestDeals(limit = 7) {
  const [bestDeals, setBestDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBestDeals() {
      try {
        setLoading(true);

        const result = await getListingsV2({ limit: limit });

        if (!cancelled) {
          setBestDeals(result.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load best deals");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBestDeals();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { bestDeals, loading, error };
}
