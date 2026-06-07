import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getAppQueryClient } from "~/lib/query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getAppQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
