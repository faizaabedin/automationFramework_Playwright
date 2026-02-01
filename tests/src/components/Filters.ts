import { Page, Locator, expect } from "@playwright/test";
import { TIMEOUTS } from "../utils/constants";

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

  /** Toggle a size checkbox to a target checked state, resilient to re-render/detach. */
  private async setOne(value: string, shouldBeChecked: boolean) {
    const stateText = shouldBeChecked ? "check" : "uncheck";

    //standard 6 tries methos so avoid flaky re render/ detach errors when components reload
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        // before each attempt the locators are re-resolved to avoid stale states
        const input = this.inputByValue(value);
        const label = this.labelByValue(value);

        await expect(input, `Size "${value}" checkbox not found`).toHaveCount(1);

        //in correct state
        if ((await input.isChecked()) === shouldBeChecked) return;

        //avoid not in view error
        await label.scrollIntoViewIfNeeded();
        // Click label (bigger hit target than the checkbox).
        await label.click({ timeout: TIMEOUTS.CLICK });

        // Assert final state with Playwright's built-in auto-wait.
        if (shouldBeChecked) {
          await expect(input).toBeChecked({ timeout: TIMEOUTS.POLL_SHORT });
        } else {
          await expect(input).not.toBeChecked({ timeout: TIMEOUTS.POLL_SHORT });
        }

        return;
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        const retryable =
          /detached|not attached|Execution context was destroyed|intercepts pointer events|target closed/i.test(
            msg
          );

        if (!retryable || attempt === 6) {
          throw new Error(
            `Failed to ${stateText} size "${value}" after ${attempt} attempt(s): ${msg}`
          );
        }

        // Small backoff before retry; avoids hammering during animations/re-render.
        await this.page.waitForTimeout(TIMEOUTS.SHORT);
      }
    }
  }

  /** Set the selected sizes to exactly this list (checks missing, unchecks extras). */
  async setSizesExactly(desired: string[]) {
    // faster lookup in set O(N)=
    const desiredSet = new Set(desired);

    // 1) Uncheck anything not desired, read all checked if anything not required, uncheck
    const current = await this.getCheckedValues();
    for (const v of current) {
      if (!desiredSet.has(v)) await this.setOne(v, false);
    }

    // 2) Check anything missing
    for (const v of desired) {
      await this.setOne(v, true);
    }

    // re read checked values
    const final = (await this.getCheckedValues()).sort();
    const expected = [...desiredSet].sort();
    await expect(final, `Final selected sizes mismatch`).toEqual(expected);
  }

  async clearAllSizes() {
    await this.setSizesExactly([]);
  }
}
