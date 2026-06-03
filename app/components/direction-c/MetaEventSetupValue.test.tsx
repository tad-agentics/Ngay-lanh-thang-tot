/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetaEventSetupValue } from "~/components/direction-c/MetaEventSetupValue";

describe("MetaEventSetupValue", () => {
  it("picker mode: visible overlay + transparent integer with id", () => {
    const { container } = render(
      <MetaEventSetupValue valueVnd={799_000} id="meta-purchase-value">
        799.000 đ
      </MetaEventSetupValue>,
    );
    expect(document.getElementById("meta-purchase-value")?.textContent).toBe(
      "799000",
    );
    expect(container.textContent?.replace(/\s+/g, " ").trim()).toContain(
      "799.000 đ",
    );
  });

  it("list mode: clipped integer without id", () => {
    const { container } = render(
      <MetaEventSetupValue valueVnd={299_000}>
        299.000 đ
      </MetaEventSetupValue>,
    );
    const clipped = container.querySelector(
      "[data-meta-event-setup-value='299000']",
    );
    expect(clipped).toBeTruthy();
    expect(clipped?.id).toBe("");
    expect(container.querySelector(".inline-grid")).toBeNull();
  });
});
