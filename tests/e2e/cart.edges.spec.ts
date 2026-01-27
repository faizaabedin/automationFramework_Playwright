import { test, expect } from "@playwright/test";
import { StorePage } from "../src/pages/StorePage";
import { PRODUCTS } from "../src/data/products";
import { SIZES } from "../src/data/sizes";

test.describe("Cart Edge Cases", () => {
    test("Cart persists after page refresh", async ({ page }) => {
        // Ensure clean state
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Add items to cart
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.grid.addToCartByName(PRODUCTS.BLACK_STRIPES);
        
        // Verify items are in cart
        await app.cart.open();
        await app.cart.expectRowQuantity(PRODUCTS.BLUE_TSHIRT, 1);
        await app.cart.expectRowQuantity(PRODUCTS.BLACK_STRIPES, 1);
        await app.cart.expectTotalItemsOpen(2);
        await app.cart.close();

        // Refresh the page
        await page.reload();
        await app.grid.waitForGridStable();

        // Verify cart still has items after refresh
        await app.cart.expectCountClosed(2);
        await app.cart.open();
        await app.cart.expectRowQuantity(PRODUCTS.BLUE_TSHIRT, 1);
        await app.cart.expectRowQuantity(PRODUCTS.BLACK_STRIPES, 1);
        await app.cart.expectTotalItemsOpen(2);
    });

    test("Empty cart state displays correctly", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Verify empty cart state
        await app.cart.open();
        await app.cart.expectEmptyState();
    });

    test("Rapid filter toggle does not break grid", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Rapidly toggle filters
        await app.filters.setSizesExactly([SIZES[0]]); // XS
        await app.filters.setSizesExactly([SIZES[1]]); // S
        await app.filters.setSizesExactly([SIZES[2]]); // M
        await app.filters.setSizesExactly([SIZES[0], SIZES[2]]); // XS, M
        await app.filters.setSizesExactly([]); // Clear

        // Verify grid stabilizes correctly
        await app.grid.waitForGridStable();
        await app.grid.expectProductsFoundMatchesGrid();
    });

    test("Rapid quantity changes via +/- buttons", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Add item
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.cart.open();

        // Rapidly click plus multiple times
        await app.cart.clickPlus(PRODUCTS.BLUE_TSHIRT, 5);
        
        // Verify final quantity is correct
        await app.cart.expectRowQuantity(PRODUCTS.BLUE_TSHIRT, 6); // 1 initial + 5 clicks

        // Verify total items updated
        await app.cart.expectTotalItemsOpen(6);
    });

    test("Adding same product multiple times increments quantity", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Add same product 3 times
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);

        // Verify quantity is 3
        await app.cart.open();
        await app.cart.expectRowQuantity(PRODUCTS.BLUE_TSHIRT, 3);
        await app.cart.expectTotalItemsOpen(3);
    });

    test("Subtotal calculation accuracy with multiple items and quantities", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Add items
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.grid.addToCartByName(PRODUCTS.BLACK_STRIPES);
        
        await app.cart.open();
        
        // Increase quantities
        await app.cart.clickPlus(PRODUCTS.BLUE_TSHIRT, 2); // Blue = 3
        await app.cart.clickPlus(PRODUCTS.BLACK_STRIPES, 1); // Black = 2

        // Verify subtotal matches expected calculation
        await app.cart.expectSubtotalForTwoItems(
            PRODUCTS.BLUE_TSHIRT, 3,
            PRODUCTS.BLACK_STRIPES, 2
        );
    });

    test("Cart badge updates correctly when items removed", async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        const app = new StorePage(page);
        await app.goto();

        // Add multiple items
        await app.grid.addToCartByName(PRODUCTS.BLUE_TSHIRT);
        await app.grid.addToCartByName(PRODUCTS.BLACK_STRIPES);
        
        await app.cart.expectCountClosed(2);

        // Remove one item
        await app.cart.removeProduct(PRODUCTS.BLACK_STRIPES);
        
        // Verify badge updated
        await app.cart.expectCountClosed(1);
        await app.cart.open();
        await app.cart.expectTotalItemsOpen(1);
        await app.cart.expectRowQuantity(PRODUCTS.BLUE_TSHIRT, 1);
    });
});
