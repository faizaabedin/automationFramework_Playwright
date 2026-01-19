// CartPanel.ts
import { Page, Locator, expect } from "@playwright/test";

export class CartPanel {
    constructor(private readonly page: Page) { }

    // --------- OPEN / CLOSE ---------

    private floatingCartButton(): Locator {
        // round button bottom-right (always present)
        return this.page.locator('div.sc-1h98xa9-1 button.sc-1h98xa9-0');
    }

    private closeButton(): Locator {
        // only present when panel open
        return this.page.getByRole("button", { name: "X" });
    }

    async open() {
        if (await this.closeButton().count()) return; // already open
        await this.floatingCartButton().click();
        await expect(this.closeButton()).toBeVisible();
    }

    async close() {
        if (!(await this.closeButton().count())) return; // already closed
        await this.closeButton().click();
        await expect(this.closeButton()).toHaveCount(0);
    }

    // --------- COUNT (CLOSED) ---------
    // Badge on floating cart button has: title="Products in cart quantity"
    private closedCountBadge(): Locator {
        return this.page.locator('[title="Products in cart quantity"]');
    }

    async getCountClosed(): Promise<number> {
        await expect(this.closedCountBadge()).toHaveCount(1);
        const txt = (await this.closedCountBadge().innerText()).trim();
        return Number(txt);
    }

    async expectCountClosed(count: number) {
        await expect(this.closedCountBadge()).toHaveCount(1);
        await expect(this.closedCountBadge()).toHaveText(String(count));
    }

    // --------- COUNT (OPEN) ---------
    // In panel header, badge uses class VLMSP near the "Cart" label
    private openHeaderCountBadge(): Locator {
        return this.page.locator('.sc-1h98xa9-5:has-text("Cart") .VLMSP');
    }

    async getCountOpen(): Promise<number> {
        // only valid when panel is open; if missing, consider it 0
        if (await this.openHeaderCountBadge().count() === 0) return 0;
        const txt = (await this.openHeaderCountBadge().innerText()).trim();
        return Number(txt || "0");
    }

    async expectCountOpen(count: number) {
        // ensure panel is open, otherwise this locator won't exist
        await this.open();
        // same note: UI might hide badge at 0 (depends on implementation)
        if (count === 0) {
            await expect(this.openHeaderCountBadge()).toHaveCount(0);
            return;
        }
        await expect(this.openHeaderCountBadge()).toHaveText(String(count));
    }
}
