import { Page, Locator, expect } from "@playwright/test";

export class CartPanel {
    constructor(private readonly page: Page) { }

    // --- selectors (from your DOM) ---
    private closeBtn(): Locator {
        return this.page.getByRole("button", { name: "X" });
    }

    private floatingCartBtn(): Locator {
        return this.page.locator('[title="Products in cart quantity"]');
    }

    async open() {
        if (await this.closeBtn().count()) return;
        await this.floatingCartBtn().click();
        await expect(this.closeBtn()).toBeVisible();
    }
    async close() {
        if (await this.closeBtn().count() === 0) return; // already closed
        await this.closeBtn().click();
        await expect(this.closeBtn()).toHaveCount(0); // confirm panel closed
    }

    private rowByProductAlt(productName: string): Locator {
        return this.page.locator("div.sc-11uohgb-0").filter({
            has: this.page.locator(`img[alt="${productName}"]`),
        });
    }

    private qtyTextInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).locator("p.sc-11uohgb-3");
    }

    private priceTextInRow(productName: string): Locator {
        // inside: <div class="sc-11uohgb-4 ..."><p>$  9.00</p> ...
        return this.rowByProductAlt(productName).locator("div.sc-11uohgb-4 p").first();
    }

    private subtotalText(): Locator {
        // <p class="sc-1h98xa9-9 ...">$ 72.00</p>
        return this.page.locator("p.sc-1h98xa9-9");
    }

    // --- parsing helpers ---
    private parseMoney(text: string): number {
        // handles "$  72.00" etc.
        const cleaned = text.replace(/[^0-9.]/g, "");
        return Number(cleaned);
    }

    private parseQty(text: string): number {
        const m = text.match(/Quantity:\s*(\d+)/i);
        return m ? Number(m[1]) : NaN;
    }

    private toCents(n: number): number {
        return Math.round(n * 100);
    }

    // --- public API ---
    async getUnitPrice(productName: string): Promise<number> {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        const txt = (await this.priceTextInRow(productName).innerText()).trim();
        return this.parseMoney(txt);
    }

    async getQuantity(productName: string): Promise<number> {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        const txt = (await this.qtyTextInRow(productName).innerText()).trim();
        return this.parseQty(txt);
    }

    async getSubtotal(): Promise<number> {
        await this.open();
        const txt = (await this.subtotalText().innerText()).trim();
        return this.parseMoney(txt);
    }

    async expectSubtotalMatchesExpected(expected: number) {
        await this.open();

        // Poll because subtotal updates after UI re-render
        await expect
            .poll(async () => this.toCents(await this.getSubtotal()), { timeout: 8000 })
            .toBe(this.toCents(expected));
    }
    
    // closed badge (always present on the floating cart button)
    private closedCountBadge(): Locator {
        return this.page.locator('[title="Products in cart quantity"]');
    }

    async expectCountClosed(count: number) {
        await expect(this.closedCountBadge()).toHaveCount(1);
        await expect(this.closedCountBadge()).toHaveText(String(count));
    }

    // open badge (in the cart panel header near "Cart")
    private openCountBadge(): Locator {
        return this.page.locator('.sc-1h98xa9-5:has-text("Cart") .VLMSP');
    }

    async expectCountOpen(count: number) {
        await this.open();
        await expect(this.openCountBadge()).toHaveText(String(count));
    }
    // --- selectors ---
    private removeButtons(): Locator {
        return this.page.locator('button[title="remove product from cart"]');
    }

    private emptyMessage(): Locator {
        // We don't know the exact text, so match common variants.
        return this.page.getByText(/cart is empty|empty cart|no items in cart/i);
    }

    // --- actions/assertions ---
    async clearCart() {
        await this.open();

        // Click remove buttons until none left.
        // IMPORTANT: re-query each time because the list re-renders.
        await expect
            .poll(async () => {
                const count = await this.removeButtons().count();
                if (count === 0) return 0;

                await this.removeButtons().first().click();
                return await this.removeButtons().count();
            }, { timeout: 15000 })
            .toBe(0);
    }

    async expectSubtotalIsZero() {
        await this.open();
        await expect
            .poll(async () => this.toCents(this.parseMoney((await this.subtotalText().innerText()).trim())), {
                timeout: 8000,
            })
            .toBe(0);
    }

    async expectEmptyState() {
        await this.open();

        // 1) no items
        await expect(this.removeButtons()).toHaveCount(0);

        // 2) subtotal is 0
        await this.expectSubtotalIsZero();

        // 3) quantity badge is 0 (open header badge)
        await this.expectCountOpen(0);

        // Optional: only check empty message if it exists (never fail if missing)
        if (await this.emptyMessage().count()) {
            await expect(this.emptyMessage()).toBeVisible();
        }
    }


}