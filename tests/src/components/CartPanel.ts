import { Page, Locator, expect } from "@playwright/test";
import { parseMoney,toCents } from "../utils/money";
import { TIMEOUTS } from "../utils/constants";

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
        //here tittle is the most table selector
        return this.page.locator('[title="Products in cart quantity"]');
    }

    private floatingCartButton(): Locator {
        // using xpath beacuse actual tittle is not clickable actual button in the neasrest ancestor button
        return this.closedCountBadge().locator("xpath=ancestor::button[1]");
    }

    async open() {
        //check to see cart is already open by checking for 'x'
        const x = this.page.getByRole("button", { name: "X" });
        if (await x.count()) return;

        await this.floatingCartButton().click();
        await expect(x).toHaveCount(1);
    }

    async expectCountClosed(count: number) {
        // Ensure panel is closed so the closed badge exists
        await this.close();

        // Now the badge should exist and show the total quantity, UI assertions, correct num shown
        await expect(this.closedCountBadge()).toHaveText(String(count));
    }

    private openCountBadge(): Locator {
        //get badge number by anchoring on the text "Cart". 1st get span 'Cart', 2nd go to parent and 3rd get badge inside.
        return this.page
            .locator('span:has-text("Cart")')
            .locator("..")                 // parent = sc-1h98xa9-5 container
            .locator("div.VLMSP");         // badge inside
    }    

    async expectCountOpen(count: number) {
        await this.open();
        await expect(this.openCountBadge()).toHaveCount(1);
        await expect(this.openCountBadge()).toHaveText(String(count));
    }

    async expectTotalItemsOpen(expectedTotal: number) {
        // same as open count (total quantity)
        await this.open();
        // Polling waits until UI updates after clicks (state updates, animations).
        await expect(this.openCountBadge()).toHaveText(String(expectedTotal), {
            timeout: TIMEOUTS.POLL_MEDIUM,
        });
    }
            

    private rowByProductAlt(productName: string): Locator {
        // anchor on the unique product image alt, then climb to the row container
        const img = this.page.locator(`img[alt="${productName}"]`);
        return img.locator('xpath=ancestor::div[.//button[@title="remove product from cart"]][1]');
    }

    private qtyTextInRow(productName: string): Locator {
        //goes row of product gets to <p> looks for Quantity and then gets first 
        return this.rowByProductAlt(productName)
            .locator("p")
            .filter({ hasText: /Quantity:\s*\d+/i })
            .first();
    }

    private plusBtnInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).getByRole("button", { name: "+" });
    }

    private priceTextInRow(productName: string): Locator {
        return this.rowByProductAlt(productName).locator('p:has-text("$")').first();
    }

    private removeButtons(): Locator {
        return this.page.locator('button[title="remove product from cart"]');
    }

    private subtotalText(): Locator {
        return this.page
            .locator(':text-matches("Subtotal", "i")')
            .locator('xpath=ancestor::*[1]')
            .locator('p:has-text("$")')
            .first();
    }

    private parseQty(text: string): number {
        const match = /Quantity:\s*(\d+)/i.exec(text);
        if (!match) {
            throw new Error(`Could not find quantity in text: "${text}"`);
        }
        return Number(match[1]);
    }

    async getQuantity(productName: string): Promise<number> {
        //open cart if not open
        await this.open();
        
        //check for product
        await expect(this.rowByProductAlt(productName), `Product "${productName}" not found in cart`).toHaveCount(1);

        const txt = (await this.qtyTextInRow(productName).innerText()).trim();
        const qty = this.parseQty(txt);
        if (Number.isNaN(qty)) {
            throw new Error(`Could not parse quantity from text: "${txt}" for product "${productName}"`);
        }
        return qty;
    }

    //assertions for getQuantity
    async expectRowQuantity(productName: string, expectedQty: number) {
        await expect.poll(() => this.getQuantity(productName), {
            timeout: TIMEOUTS.POLL_MEDIUM,
        }).toBe(expectedQty);
    }

    async clickPlus(productName: string, times: number) {
        await this.open();
        await expect(this.rowByProductAlt(productName), `Product "${productName}" not found in cart`).toHaveCount(1);

        for (let i = 0; i < times; i++) {
            const row = this.rowByProductAlt(productName);
            await expect(row, `Product "${productName}" not found in cart`).toHaveCount(1);

            const plus = this.plusBtnInRow(productName); // re-query each time
            await expect(plus, `Plus button for "${productName}" not visible`).toBeVisible();
            
            await plus.click({ timeout: TIMEOUTS.CLICK });
        }
    }
    async getUnitPrice(productName: string): Promise<number> {
        await this.open();
        await expect(this.rowByProductAlt(productName), `Product "${productName}" not found in cart`).toHaveCount(1);

        const txt = (await this.priceTextInRow(productName).innerText()).trim();
        return parseMoney(txt);
    }

    async getSubtotal(): Promise<number> {
        await this.open();
        const txt = (await this.subtotalText().innerText()).trim();
        return parseMoney(txt);
    }

    async expectSubtotalMatchesExpected(expected: number) {
        const expectedCents = toCents(expected);

        await expect(async () => {
            const actualCents = toCents(await this.getSubtotal()); // calls open()
            expect(actualCents).toBe(expectedCents);
        }).toPass({
            timeout: TIMEOUTS.POLL_MEDIUM,
        });
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

    async removeProduct(productName: string) {
        await this.open();
        await expect(this.rowByProductAlt(productName), `Product "${productName}" not found in cart`).toHaveCount(1);
        
        const removeBtn = this.rowByProductAlt(productName).getByRole("button", { name: /remove/i });
        await expect(removeBtn, `Remove button for "${productName}" not found`).toBeVisible();
        await removeBtn.click({ timeout: TIMEOUTS.CLICK });
    }

    async clearCart() {
        await this.open();

        await expect
            .poll(async () => {
                const count = await this.removeButtons().count();
                if (count === 0) return 0;

                await this.removeButtons().first().click();
                return await this.removeButtons().count();
            }, { 
                timeout: TIMEOUTS.POLL_LONG,
                message: "Failed to clear cart - items still remain after timeout"
            })
            .toBe(0);
    }

    async expectSubtotalIsZero() {
        await this.open();
        await expect
            .poll(async () => {
                const txt = (await this.subtotalText().innerText()).trim();
                return toCents(parseMoney(txt));
            }, { 
                timeout: TIMEOUTS.POLL_MEDIUM,
                message: "Expected subtotal to be $0.00 but it didn't update in time"
            })
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
