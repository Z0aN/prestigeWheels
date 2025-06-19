// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Ждем редиректа и загрузки данных
    cy.location('pathname').should('not.include', '/login');
    
    // Проверяем успешный вход по наличию профиля
    cy.get('[class*="userInfo"]').should('exist');
  });
});

// Команда для проверки элементов профиля
Cypress.Commands.add('checkProfileElements', () => {
  cy.get('[class*="userInfo"]').should('be.visible');
  cy.get('[class*="userAvatar"]').should('be.visible');
  cy.get('[class*="tabs"]').should('be.visible');
});

// Команда для переключения на вкладку бронирований
Cypress.Commands.add('switchToBookingsTab', () => {
  cy.contains('button', 'Бронирования').click();
  cy.get('[class*="bookingsContent"]').should('exist');
});

// Команда для проверки статистики бронирований
Cypress.Commands.add('checkBookingStats', () => {
  cy.get('[class*="bookingsStats"]').within(() => {
    cy.get('[class*="stat"]').should('have.length', 4);
  });
});

// Команда для ожидания загрузки профиля
Cypress.Commands.add('waitForProfile', () => {
  cy.get('[class*="profilePage"]').should('be.visible');
  cy.get('[class*="loading"]').should('not.exist');
}); 