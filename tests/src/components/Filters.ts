import { Page, Locator, expect } from "@playwright/test";
import type { Size } from "../data/sizes";

export class Filters {
    constructor(private readonly page: Page) { }

    private checkboxByValue(value: string): Locator {
        return this.page.locator(`input[data-testid="checkbox"][value="${value}"]`);
    }

    private labelForCheckbox(input: Locator): Locator {
        return this.page.locator("label", { has: input });
    }

    // Optional fallback if a version shows label text "M/L"
    private checkboxByLabelText(labelText: string): Locator {
        return this.page
            .locator("label", { hasText: labelText })
            .locator('input[type="checkbox"][data-testid="checkbox"]');
    }

    async selectSizes(sizes: readonly Size[]) {
        for (const size of sizes) {
            await this.setSize(size, true);
        }
    }

    async unselectSizes(sizes: readonly Size[]) {
        for (const size of sizes) {
            await this.setSize(size, false);
        }
    }

    async clearAllSizes() {
        const inputs = this.page.locator('input[data-testid="checkbox"]');
        const n = await inputs.count();

        for (let i = 0; i < n; i++) {
            const cb = inputs.nth(i);
            if (await cb.isChecked()) {
                await this.labelForCheckbox(cb).click();
                await expect(cb).not.toBeChecked();
            }
        }
    }

    /**
     * Core toggle logic: click the LABEL (never input.check/uncheck)
     * because the styled span.checkmark intercepts pointer events.
     */
    private async setSize(size: Size, shouldBeChecked: boolean) {
        // Primary checkbox locator
        let cb = this.checkboxByValue(size);

        // Fallback for ML if value="ML" isn't present
        if (size === "ML" && (await cb.count()) === 0) {
            cb = this.checkboxByLabelText("M/L");
        }

        await expect(cb, `Size checkbox "${size}" not found`).toHaveCount(1);

        const isChecked = await cb.isChecked();
        if (shouldBeChecked === isChecked) return; // already correct

        await this.labelForCheckbox(cb).click();

        if (shouldBeChecked) {
            await expect(cb).toBeChecked();
        } else {
            await expect(cb).not.toBeChecked();
        }
    }
}
