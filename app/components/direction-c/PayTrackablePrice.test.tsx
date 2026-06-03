import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PayTrackablePrice } from "~/components/direction-c/PayTrackablePrice";

describe("PayTrackablePrice", () => {
  it("renders sale amount with đ suffix for Meta-readable DOM", () => {
    render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        valueVnd={299_000}
        size="confirm"
      />,
    );
    const group = screen.getByRole("group", { name: "Giá 299.000 đ" });
    expect(group.textContent?.replace(/\s+/g, " ").trim()).toContain("299.000 đ");
    expect(screen.getByText("299000")).toBeTruthy();
    expect(
      document.querySelector("[data-meta-event-setup-value='299000']"),
    ).toBeTruthy();
    expect(document.getElementById("meta-event-setup-value")).toBeNull();
  });

  it("picker mode: id on price area with integer text", () => {
    const { container } = render(
      <PayTrackablePrice
        priceLabel="299.000₫"
        valueVnd={299_000}
        size="confirm"
        metaEventSetupId="meta-purchase-value"
      />,
    );
    expect(document.getElementById("meta-purchase-value")?.textContent).toBe(
      "299000",
    );
    expect(container.textContent?.replace(/\s+/g, " ").trim()).toContain(
      "299.000 đ",
    );
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
    const group = screen.getByRole("group", { name: "Giá 499.000 đ" });
    expect(group.textContent?.replace(/\s+/g, " ").trim()).toContain("499.000 đ");
  });
});
