// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test
describe('My First Test', () => {
    it('clicking "type" navigates to a new url', () => {
        cy.visit('https://example.cypress.io');
        cy.contains('type').click();
        // Should be on a new URL which includes '/commands/actions'
        cy.url().should('include', '/commands/actions');
    });
});
export {};
//# sourceMappingURL=test.spec.js.map