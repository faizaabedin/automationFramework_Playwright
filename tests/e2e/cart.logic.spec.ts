import { test, expect } from "@playwright/test";
import { StorePage } from "../src/pages/StorePage";

test("Shopping Cart Logic & Validation (full scenario)", async ({ page }) => {
    // optional but recommended: ensure clean state every run
    await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    const app = new StorePage(page);

    // 1) go to webpage
    await app.goto();

    // 2) filter sizes
    await app.filters.setSizesExactly(["XS", "ML"]);
    await app.grid.waitForGridStable();

    // 3) count check (capture filtered count)
    const filteredCount = await app.grid.visibleProductCount();

    // NOW clear filters
    await app.filters.setSizesExactly([]);
    await app.grid.waitForGridStable();

    // NOW confirm the count changed (grid repopulated)
    await expect
        .poll(async () => await app.grid.visibleProductCount(), { timeout: 15000 })
        .not.toBe(filteredCount);

    // cart starts empty (closed badge)
    await app.cart.close(); // ensure cart is closed before checking closed badge
    await app.cart.expectCountClosed(0);

    // 4) add items
    await app.grid.addToCartByName("Blue T-Shirt");
    await app.cart.close(); // ✅ call it
    await app.cart.expectCountClosed(1);

    await app.grid.addToCartByName("Black T-shirt with white stripes");
    await app.cart.close(); // ✅ call it
    await app.cart.expectCountClosed(2);

    // Open cart + Step 7: increase Blue qty to 3
    await app.cart.open();
    await app.cart.expectRowQuantity("Blue T-Shirt", 1);
    await app.cart.clickPlus("Blue T-Shirt", 2);
    await app.cart.expectRowQuantity("Blue T-Shirt", 3);

    // Step 8: total items (total quantity) updated correctly:
    // Blue=3, Black=1 => total=4
    await app.cart.expectTotalItemsOpen(4);

    // Step 9: pricing logic (UI prices * quantities)
    await app.cart.expectSubtotalForTwoItems(
        "Blue T-Shirt", 3,
        "Black T-shirt with white stripes", 1
    );

    // 10) Clear the Cart
    await app.cart.clearCart();

    // 11) Verify Empty
    await app.cart.expectEmptyState();
    await app.cart.expectCountOpen(0);

    await app.cart.close();
    await app.cart.expectCountClosed(0);
});
