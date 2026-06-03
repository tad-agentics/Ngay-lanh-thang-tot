import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PayTrackablePrice } from "~/components/direction-c/PayTrackablePrice";

function normVnd(s: string): string {
  return s.replace(/\u00a0/g, " ");
}

function groupNamed(label: string) {
  return (_: string, el: Element) =>
    normVnd(el.getAttribute("aria-label") ?? "") === normVnd(label);
}

describe("PayTrackablePrice", () => {
  it("renders sale amount with Intl ₫ for Meta-readable DOM", () => {
    render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        valueVnd={299_000}
        size="confirm"
      />,
    );
    const group = screen.getByRole("group", { name: groupNamed("Giá 299.000 ₫") });
    expect(normVnd(group.textContent ?? "")).toContain("299.000 ₫");
    expect(screen.getByText("299000")).toBeTruthy();
    expect(
      document.querySelector("[data-meta-event-setup-value='299000']"),
    ).toBeTruthy();
    expect(document.getElementById("meta-event-setup-value")).toBeNull();
  });

  it("picker mode: id on digits-only node (Meta Event Setup)", () => {
    render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        valueVnd={299_000}
        size="confirm"
        metaEventSetupId="meta-purchase-value"
      />,
    );
    const node = document.getElementById("meta-purchase-value");
    expect(node?.textContent).toBe("299000");
    expect(normVnd(node?.getAttribute("title") ?? "")).toBe("299.000 ₫");
  });

  it("omits Meta node when metaEventSetup is false", () => {
    const { container } = render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        valueVnd={299_000}
        size="confirm"
        metaEventSetup={false}
      />,
    );
    expect(
      container.querySelector("[data-meta-event-setup-value]"),
    ).toBeNull();
  });

  it("formats catalog label when valueVnd is omitted", () => {
    render(<PayTrackablePrice priceLabel="499.000₫" size="tier" />);
    const group = screen.getByRole("group", { name: groupNamed("Giá 499.000 ₫") });
    expect(normVnd(group.textContent ?? "")).toContain("499.000 ₫");
  });

  it("aria-label matches visible sale digits when displayPrice and valueVnd align", () => {
    render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        displayPrice="269.100"
        valueVnd={269_100}
        size="confirm"
      />,
    );
    expect(
      screen.getByRole("group", { name: groupNamed("Giá 269.100 ₫") }),
    ).toBeTruthy();
  });

  it("aria-label follows valueVnd when it overrides displayPrice for visible amount", () => {
    const { container } = render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        displayPrice="269.100"
        valueVnd={299_000}
        size="confirm"
      />,
    );
    const group = container.querySelector('[role="group"]');
    expect(normVnd(group?.getAttribute("aria-label") ?? "")).toBe("Giá 299.000 ₫");
    expect(normVnd(group?.textContent ?? "")).toContain("299.000 ₫");
  });
});
