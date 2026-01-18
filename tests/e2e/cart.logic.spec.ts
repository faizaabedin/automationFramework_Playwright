import { test, expect } from "@playwright/test";
import { StorePage } from "../src/pages/StorePage";
import { PRODUCTS } from "../src/data/products";
import { ProductGrid } from "../src/components/ProductGrid";

test("Shopping Cart Logic & Validation (full scenario)", async ({ page }) => {
    const app = new StorePage(page);

    // 1) Navigate
    await app.goto();

    // 2) Filter by size
    await app.filters.selectSizes(["XS", "ML"]);

    const filteredCount = await app.grid.visibleProductCount();

    await app.filters.unselectSizes(["XS", "ML"]);

    // wait for grid count to change (re-render)
    await expect.poll(async () => app.grid.visibleProductCount()).not.toBe(filteredCount);

    // now the product should be back
    // const cartQty = page.locator('[title="Products in cart quantity"]');

    // await expect(cartQty).toHaveText("0"); 
    // await app.grid.waitForProductVisible("Blue T-Shirt");

    // await expect(cartQty).toHaveText("1");
    // await app.grid.addToCartByName("Black T-shirt with white stripes");
    // await expect(cartQty).toHaveText("2");

    // Capture unit prices for subtotal calculation
    // const bluePrice = await app.grid.getUnitPrice(PRODUCTS.BLUE_TSHIRT);
    // const blackPrice = await app.grid.getUnitPrice(PRODUCTS.BLACK_STRIPES);
    //await app.filters.unselectSizes(["XS", "ML"]);

    // await app.grid.expectProductsFoundMatchesGrid();

    // 4) Add items to cart
    // await app.grid.waitForProductVisible("Blue T-Shirt");
    //await app.grid.addToCart(PRODUCTS.BLUE_TSHIRT);
    // await app.grid.addToCart(PRODUCTS.BLACK_STRIPES);

    // 5) Open cart
    //await app.cart.open();

    // // 6) Verify initial cart state (distinct items)
    // await expect.poll(async () => app.cart.distinctItemsCount()).toBe(2);

    // // 7) Update quantity: Blue +2 => 3 total
    // await app.cart.incrementQuantity(PRODUCTS.BLUE_TSHIRT, 2);
    // await expect.poll(async () => app.cart.itemQuantity(PRODUCTS.BLUE_TSHIRT)).toBe(3);

    // // 8) Verify updated state: total items = 3 + 1 = 4
    // await expect.poll(async () => app.cart.totalItemsCount()).toBe(4);

    // // 9) Validate pricing logic: subtotal == (blue * 3) + (black * 1)
    // const expectedSubtotal = bluePrice * 3 + blackPrice * 1;
    // await app.cart.expectSubtotalEquals(expectedSubtotal);

    // // 10) Clear cart
    // await app.cart.removeAllItems();

    // // 11) Verify empty state
    // await app.cart.expectEmptyState();
});
