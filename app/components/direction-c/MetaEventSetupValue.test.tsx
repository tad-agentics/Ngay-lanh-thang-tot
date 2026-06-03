/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetaEventSetupValue } from "~/components/direction-c/MetaEventSetupValue";

describe("MetaEventSetupValue", () => {
  it("picker mode: id span text is digits-only for Meta Event Setup", () => {
    render(
      <MetaEventSetupValue
        valueVnd={799_000}
        id="meta-purchase-value"
        formattedDisplay="799.000 đ"
      />,
    );
    const node = document.getElementById("meta-purchase-value");
    expect(node?.textContent).toBe("799000");
    expect(node?.getAttribute("title")).toBe("799.000 đ");
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
    expect(container.querySelector("#meta-purchase-value")).toBeNull();
  });
});
