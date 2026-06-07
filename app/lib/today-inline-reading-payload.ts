/** Stable bat-tu payload for home inline NLTT — wait for `day-luan-context` before invoking Edge. */
export function resolveInlineReadingPayload(opts: {
  fetchEnabled: boolean;
  luanPending: boolean;
  luanData: unknown | null | undefined;
  detailData: unknown | null | undefined;
  homNayData: unknown | null | undefined;
}): { payload: unknown | null; pending: boolean } {
  if (!opts.fetchEnabled) {
    return { payload: null, pending: false };
  }
  if (opts.luanPending) {
    return { payload: null, pending: true };
  }
  return {
    payload: opts.luanData ?? opts.detailData ?? opts.homNayData ?? null,
    pending: false,
  };
}
