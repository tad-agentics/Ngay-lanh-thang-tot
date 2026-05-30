import { QueryClient } from "@tanstack/react-query";

/** Mặc định: dữ liệu coi là “fresh” 60 phút — ít refetch khi đổi màn / remount. Query đặc biệt có thể override. */
export const APP_QUERY_STALE_TIME_MS = 60 * 60 * 1000;

/** Giữ cache sau khi không còn observer — ≥ staleTime để quay lại app trong cửa sổ đó vẫn có bản RAM. */
export const APP_QUERY_GC_TIME_MS = 2 * 60 * 60 * 1000;

/**
 * Defaults: ít refetch khi focus tab; cache lâu để quay lại màn vẫn có data.
 * Đơn lẻ query có thể override (vd. site_banner bật refetchOnWindowFocus).
 *
 * Màn đổi filter trong cùng route: cân nhắc `placeholderData` / `keepPreviousData`
 * (TanStack Query) để không flash trống khi queryKey đổi.
 */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: APP_QUERY_STALE_TIME_MS,
        gcTime: APP_QUERY_GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
