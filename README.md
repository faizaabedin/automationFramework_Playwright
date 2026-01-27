# automationFramework_Playwright
This project contains end-to-end tests written using Playwright.

Advantages of Playwright

- comes with more "out-of-the-box" stability since it has auto-waits, plus assertions retry.
- Therefore can be faster to build E2E tests since overall lower code. 
- Lesser chance of flaky test with UI components
- Tests less likely to fail in CI and pass locally cause of incosistance wait time needed. - Automated test for UIs with dynamic rendering, animations, side panels are more reliable/less flaky
- Trace viewer offers quite good debugging artifacts like videos/logs/pictures.
- Built-in test runner supports fixtures, projects (multi-browser), parallelism, retries.

Disadvantages:

- WebdriverIO (WDIO) has “Selenium-style” cross-browser/grid compatibility
- WebdriverIO very flexible, lots of ecosystem options (Mocha/Jasmine/Cucumber), good for BDD shops
- Playwright can integrate with cloud providers too, but WDIO is historically “native” to that ecosystem.

Work Around suggestions:


Project structure

/playwright.config.ts
/package.json

/tests
  /e2e
    cart.logic.spec.ts
    cart.edges.spec.ts

/src
  /pages
    StorePage.ts
    CartPanel.ts
  /components
    ProductGrid.ts
    Filters.ts
  /utils
    money.ts          // parse "$10.00" -> 10.00, safe math
    assertions.ts     // reusable expects like expectSubtotal(...)
  /data
    products.ts       // "Blue T-Shirt", "Black T-Shirt with white stripes"

Major Reportings 
- Filter toggle wnen selected and deselected quickly can leave product grid incorrect after clearing filters. Potential cause:(race/debounce).

- Another flaky behaviour in cart with actionable components such as +/- button. Potential cause: component does not re-render to correct stage all the time. 

- Cart panel does not display "Empty Cart" message explicitely when no products are added

Additional testcases: 

- As a stoWhen products are added to the cart and webpage is refreshed the cart items should not disappear 

- Cart open/close doesn’t break interactions with grid.

- Very large quantity update should remain consistent (e.g., add +10 quickly).

- minus button boundaries 

- Add same product multiple times and similar name 