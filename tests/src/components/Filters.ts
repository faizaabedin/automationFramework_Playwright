import { Page, Locator, expect } from "@playwright/test";

export class Filters {
  constructor(private readonly page: Page) {}

  private inputByValue(value: string): Locator {
    return this.page.locator(
      `input[type="checkbox"][data-testid="checkbox"][value="${value}"]`
    );
  }

  private labelByValue(value: string): Locator {
    return this.page.locator(
      `label:has(input[type="checkbox"][data-testid="checkbox"][value="${value}"])`
    );
  }

  private allInputs(): Locator {
    return this.page.locator('input[type="checkbox"][data-testid="checkbox"]');
  }

  /** Returns currently checked size values, e.g. ["XS","ML"] */
  async getCheckedValues(): Promise<string[]> {
    const inputs = this.allInputs();
    await expect(inputs.first()).toBeVisible();

    const checked = await inputs.evaluateAll((els) =>
      els
        .filter((e) => (e as HTMLInputElement).checked)
        .map((e) => (e as HTMLInputElement).value)
    );

    return checked as string[];
  }

  /** Toggle a size to a target checked state, with retries for detach/re-render. */
  private async setOne(value: string, shouldBeChecked: boolean) {
    const input = this.inputByValue(value);
    await expect(input, `Size "${value}" checkbox not found`).toHaveCount(1);

    // already correct
    if ((await input.isChecked()) === shouldBeChecked) return;

    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const label = this.labelByValue(value);
        await label.scrollIntoViewIfNeeded();
        await label.click({ timeout: 3000 });

        await expect
          .poll(async () => await input.isChecked(), { timeout: 5000 })
          .toBe(shouldBeChecked);

        return;
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        const retryable =
          /detached|not attached|Execution context was destroyed|intercepts pointer events/i.test(
            msg
          );

        if (!retryable || attempt === 6) throw e;
        await this.page.waitForTimeout(150);
      }
    }
  }

  /** Strongest API: set sizes to exactly this list (checks missing, unchecks extras). */
  async setSizesExactly(desired: string[]) {
    const desiredSet = new Set(desired);
    const current = await this.getCheckedValues();

    // uncheck extras
    for (const v of current) {
      if (!desiredSet.has(v)) {
        await this.setOne(v, false);
      }
    }

    // check missing
    for (const v of desired) {
      await this.setOne(v, true);
    }
  }

  async clearAllSizes() {
    await this.setSizesExactly([]);
  }
}
