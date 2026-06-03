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
    expect(screen.getByText("299.000đ")).toBeTruthy();
    expect(screen.getByText("299.000đ").getAttribute("data-track-price-vnd")).toBe(
      "299000",
    );
  });

  it("formats catalog label when valueVnd is omitted", () => {
    render(<PayTrackablePrice priceLabel="499.000₫" size="tier" />);
    expect(screen.getByText("499.000đ")).toBeTruthy();
  });
});
