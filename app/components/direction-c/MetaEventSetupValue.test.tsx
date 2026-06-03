/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetaEventSetupValue } from "~/components/direction-c/MetaEventSetupValue";

function normVnd(s: string): string {
  return s.replace(/\u00a0/g, " ");
}

describe("MetaEventSetupValue", () => {
  it("picker mode: digits-only id + visible Intl ₫", () => {
    const { container } = render(
      <MetaEventSetupValue
        valueVnd={799_000}
        id="meta-purchase-value"
        formattedDisplay="799.000 ₫"
      />,
    );
    const node = document.getElementById("meta-purchase-value");
    expect(node?.textContent).toBe("799000");
    expect(normVnd(container.textContent ?? "")).toContain("799.000 ₫");
  });

  it("list mode: clipped integer without id", () => {
    const { container } = render(
      <MetaEventSetupValue valueVnd={299_000}>299.000 ₫</MetaEventSetupValue>,
    );
    const clipped = container.querySelector(
      "[data-meta-event-setup-value='299000']",
    );
    expect(clipped).toBeTruthy();
    expect(clipped?.id).toBe("");
    expect(container.querySelector("#meta-purchase-value")).toBeNull();
  });
});
