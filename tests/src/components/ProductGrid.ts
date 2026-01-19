import { Page, Locator, expect } from "@playwright/test";

export class ProductGrid {
    constructor(private readonly page: Page) { }

    private productsFoundLabel(): Locator {
        return this.page.getByText(/Product\(s\) found/i);
    }

    private productCards(): Locator {
        return this.page.locator('div[tabindex="1"]').filter({
            has: this.page.getByRole("button", { name: /add to cart/i }),
        });
    }

    async visibleProductCount(): Promise<number> {
        return await this.productCards().count();
    }

    async expectProductsFoundMatchesGrid() {
        await expect(this.productsFoundLabel()).toBeVisible();

        const labelText = await this.productsFoundLabel().innerText();
        const match = labelText.match(/(\d+)/);
        const foundCount = match ? Number(match[1]) : NaN;

        expect(foundCount, `Could not parse count from: "${labelText}"`).not.toBeNaN();

        const gridCount = await this.visibleProductCount();
        expect(gridCount).toBe(foundCount);
    }

    /** Short + stable: label count must equal grid count twice in a row */
    async waitForGridStable(timeoutMs = 15000) {
        const label = this.productsFoundLabel();
        await expect(label).toBeVisible({ timeout: timeoutMs });

        let lastSig = "";
        let stableHits = 0;

        await expect
            .poll(async () => {
                const text = (await label.innerText()).trim();
                const m = text.match(/(\d+)\s*Product\(s\)\s*found/i);
                if (!m) {
                    stableHits = 0;
                    lastSig = "";
                    return false;
                }

                const found = Number(m[1]);
                const grid = await this.visibleProductCount();

                if (found !== grid) {
                    stableHits = 0;
                    lastSig = "";
                    return false;
                }

                const sig = `${found}|${grid}`;
                if (sig === lastSig) stableHits++;
                else {
                    stableHits = 1;
                    lastSig = sig;
                }

                return stableHits >= 2;
            }, { timeout: timeoutMs })
            .toBe(true);
    }

    private cardByAlt(productName: string): Locator {
        return this.page.locator('div[tabindex="1"]').filter({
            has: this.page.locator(`div[alt="${productName}"]`),
        });
    }

    async waitForProductVisible(productName: string) {
        await expect
            .poll(async () => await this.cardByAlt(productName).count(), {
                timeout: 15000,
                message: `Product "${productName}" did not appear in the grid (likely filtered out)`,
            })
            .toBe(1);

        await expect(this.cardByAlt(productName)).toBeVisible();
    }

    async addToCartByName(productName: string) {
        await this.waitForGridStable();
        await this.waitForProductVisible(productName);

        for (let attempt = 1; attempt <= 6; attempt++) {
            const card = this.cardByAlt(productName);
            const addBtn = card.getByRole("button", { name: /^Add to cart$/i });

            try {
                await addBtn.scrollIntoViewIfNeeded();
                await expect(addBtn).toBeVisible();
                await addBtn.click({ timeout: 3000 });
                return;
            } catch (e: any) {
                const msg = String(e?.message ?? e);
                const retryable = /detached|not attached|Execution context was destroyed/i.test(msg);

                if (!retryable || attempt === 6) throw e;
                await this.page.waitForTimeout(150);
            }
        }
    }
}
