import { Page, Locator, expect } from "@playwright/test";

export class ProductGrid {
  constructor(private readonly page: Page) {}

  private productsFoundLabel(): Locator {
    return this.page.getByText(/Product\(s\) found/i);
  }

  /**
   * Finds the product name <p> inside the grid cards.
   * Using exact match helps avoid accidental matches.
   */
  private productNameP(productName: string): Locator {
    return this.page.locator('div[tabindex="1"] p', { hasText: productName }).filter({
      hasText: productName,
    });
  }

  /**
   * Product card:
   * Find the product name <p> then go up to the nearest ancestor div[tabindex="1"].
   */
  private cardByName(productName: string): Locator {
    return this.productNameP(productName)
      .first()
      .locator("xpath=ancestor::div[@tabindex='1'][1]");
  }

  /** All product cards: div[tabindex="1"] that has an "Add to cart" button */
  private productCards(): Locator {
    return this.page
      .locator('div[tabindex="1"]')
      .filter({ has: this.page.getByRole("button", { name: /add to cart/i }) });
  }

  async visibleProductCount(): Promise<number> {
    return await this.productCards().count();
  }

  async expectProductsFoundMatchesGrid() {
    await expect(this.productsFoundLabel()).toBeVisible();

    const labelText = await this.productsFoundLabel().innerText();
    const match = labelText.match(/\d+/);
    const foundCount = match ? Number(match[0]) : NaN;

    expect(foundCount, `Could not parse count from: "${labelText}"`).not.toBeNaN();

    const gridCount = await this.visibleProductCount();
    expect(gridCount).toBe(foundCount);
  }

  async waitForProductVisible(productName: string) {
    const nameP = this.productNameP(productName);

    await expect
      .poll(async () => await nameP.count(), {
        timeout: 15000,
        message: `Product "${productName}" did not appear in the grid`,
      })
      .toBeGreaterThan(0);
  }

    async addToCartByName(name: string) {
        const card = this.cardByName(name);
        await expect(card, `Product card not found: ${name}`).toHaveCount(1);

        const addBtn = card.getByRole("button", { name: /add to cart/i });
        await expect(addBtn, `Add to cart button missing for: ${name}`).toBeVisible();

        await addBtn.click();
    }
}
