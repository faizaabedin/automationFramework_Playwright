import type { Page } from "@playwright/test";
import { Filters } from "../components/Filters";
import { ProductGrid } from "../components/ProductGrid";
import { CartPanel } from "../components/CartPanel";

export class StorePage {
    readonly filters: Filters;
    readonly grid: ProductGrid;
    readonly cart: CartPanel;

    constructor(public readonly page: Page) {
        this.filters = new Filters(page);
        this.grid = new ProductGrid(page);
        this.cart = new CartPanel(page);
    }

    async goto() {
        await this.page.goto("https://automation-interview.vercel.app/");
    }
}
