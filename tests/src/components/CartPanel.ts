//reusable UI sections(filters, grid, cart panel)
import { Page, Locator, expect } from "@playwright/test";

export class CartPanel {
  constructor(private readonly page: Page) {}

  cartToggle(): Locator {
    return this.page.getByRole("button", { name: /cart/i });
  }

  panel(): Locator {
    return this.page.locator('[data-testid="cart-panel"], .cart-panel');
  }

  async open() {
    await this.cartToggle().click();
    await expect(this.panel()).toBeVisible();
  }

  cartItem(name: string): Locator {
    return this.panel().getByRole("listitem").filter({ hasText: name });
  }

  incrementBtn(name: string): Locator {
    return this.cartItem(name).getByRole("button", { name: "+" });
  }

  removeBtn(name: string): Locator {
    return this.cartItem(name).getByRole("button", { name: /remove|x/i });
  }

  subtotal(): Locator {
    return this.panel().getByText(/subtotal/i).locator(".."); // adjust once you see markup
  }

  emptyState(): Locator {
    return this.panel().getByText(/cart is empty/i);
  }
}
