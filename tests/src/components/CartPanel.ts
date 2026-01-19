import { Page, Locator, expect } from "@playwright/test";

export class CartPanel {
    constructor(private readonly page: Page) { }

    async close() {
        const x = this.page.getByRole("button", { name: "X" });

        // if not open, nothing to do
        if (await x.count() === 0) return;

        await x.first().click();
        await expect(x).toHaveCount(0);
    }

    private closedCountBadge(): Locator {
        return this.page.locator('[title="Products in cart quantity"]');
    }

    private floatingCartButton(): Locator {
        return this.closedCountBadge().locator("xpath=ancestor::button[1]");
    }

    async open() {
        const x = this.page.getByRole("button", { name: "X" });
        if (await x.count()) return;

        await this.floatingCartButton().click();
        await expect(x).toHaveCount(1);
    }

    async expectCountClosed(count: number) {
        // Ensure panel is closed so the closed badge exists
        await this.close();

        // Now the badge should exist and show the total quantity
        await expect(this.closedCountBadge()).toHaveCount(1);
        await expect(this.closedCountBadge()).toHaveText(String(count));
    }
    private cartPanel(): Locator {
        return this.page.locator("div.sc-1h98xa9-4"); // cart panel container when open
    }

    private closeBtn(): Locator {
        return this.cartPanel().getByRole("button", { name: "X" });
    }

    private openCountBadge(): Locator {
        // Open cart header badge next to "Cart" (total quantity)
        return this.page.locator('.sc-1h98xa9-5:has-text("Cart") .VLMSP');
    }

    async expectCountOpen(count: number) {
        await this.open();
        await expect(this.openCountBadge()).toHaveText(String(count));
    }

    async expectTotalItemsOpen(expectedTotal: number) {
        // same as open count (total quantity)
        await this.open();
        await expect
            .poll(async () => Number((await this.openCountBadge().innerText()).trim()), { timeout: 8000 })
            .toBe(expectedTotal);
    }

    private rowByProductAlt(productName: string): Locator {
        return this.page.locator("div.sc-11uohgb-0").filter({
            has: this.page.locator(`img[alt="${productName}"]`),
        });
    }

    private qtyTextInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).locator("p.sc-11uohgb-3");
    }

    private plusBtnInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).getByRole("button", { name: "+" });
    }

    private priceTextInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).locator("div.sc-11uohgb-4 p").first();
    }

    private removeButtons(): Locator {
        return this.page.locator('button[title="remove product from cart"]');
    }

    private subtotalText(): Locator {
        return this.page.locator("p.sc-1h98xa9-9");
    }

    private parseMoney(text: string): number {
        const cleaned = text.replace(/[^0-9.]/g, "");
        return Number(cleaned || "0");
    }

    private parseQty(text: string): number {
        const m = text.match(/Quantity:\s*(\d+)/i);
        return m ? Number(m[1]) : NaN;
    }

    private toCents(n: number): number {
        return Math.round(n * 100);
    }

    async getQuantity(productName: string): Promise<number> {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        const txt = (await this.qtyTextInRow(productName).innerText()).trim();
        return this.parseQty(txt);
    }

    async expectRowQuantity(productName: string, expectedQty: number) {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        await expect
            .poll(async () => await this.getQuantity(productName), { timeout: 8000 })
            .toBe(expectedQty);
    }

    async clickPlus(productName: string, times: number) {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        for (let i = 0; i < times; i++) {
            const plus = this.plusBtnInRow(productName); // re-query each time
            await expect(plus).toBeVisible();
            await plus.click();
        }
    }
    async getUnitPrice(productName: string): Promise<number> {
        await this.open();
        await expect(this.rowByProductAlt(productName)).toHaveCount(1);

        const txt = (await this.priceTextInRow(productName).innerText()).trim();
        return this.parseMoney(txt);
    }

    async getSubtotal(): Promise<number> {
        await this.open();
        const txt = (await this.subtotalText().innerText()).trim();
        return this.parseMoney(txt);
    }
    async expectSubtotalMatchesExpected(expected: number) {
        await this.open();
        await expect
            .poll(async () => this.toCents(await this.getSubtotal()), { timeout: 8000 })
            .toBe(this.toCents(expected));
    }

    async expectSubtotalForTwoItems(
        blueName: string,
        blueQty: number,
        blackName: string,
        blackQty: number
    ) {
        await this.open();

        const bluePrice = await this.getUnitPrice(blueName);
        const blackPrice = await this.getUnitPrice(blackName);

        const expected = bluePrice * blueQty + blackPrice * blackQty;
        await this.expectSubtotalMatchesExpected(expected);
    }
    async clearCart() {
        await this.open();

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
            .poll(async () => {
                const txt = (await this.subtotalText().innerText()).trim();
                return this.toCents(this.parseMoney(txt));
            }, { timeout: 8000 })
            .toBe(0);
    }

    async expectEmptyState() {
        await this.open();

        await expect(this.removeButtons()).toHaveCount(0);

        await this.expectSubtotalIsZero();

        await this.expectCountOpen(0);

        await this.close();
        await this.expectCountClosed(0);
    }
}
