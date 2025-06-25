describe('Выход из аккаунта', () => {
  beforeEach(() => {
    // Очищаем все данные авторизации
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // Авторизуемся перед каждым тестом
    cy.visit('/login');
    cy.get('input[id="email"]')
      .should('be.visible')
      .type('shulga@mail.ru');

    cy.get('input[id="password"]')
      .should('be.visible')
      .type('vfrcbv123');

    cy.get('button[type="submit"]')
      .should('be.visible')
      .click();

    // Проверяем успешный вход
    cy.get('[class*="userProfile"]', { timeout: 10000 }).should('be.visible');
  });

  it('Пользователь выходит, происходит редирект на главную, и кнопки профиля недоступны', () => {
    // Шаг 1: Открываем меню профиля
    cy.get('[class*="userProfile"]').click();
    
    // Шаг 2: Нажимаем кнопку выхода
    cy.contains('button', 'Выйти').click({ force: true });

    // Шаг 3: Проверяем, что произошел редирект на главную
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Шаг 4: Проверяем, что пользователь разлогинен
    cy.get('[class*="authLinks"]').should('be.visible');
    cy.get('[class*="userProfile"]').should('not.exist');

    // Шаг 5: Проверяем, что защищенные страницы недоступны
    cy.visit('/profile', { failOnStatusCode: false });
    cy.url().should('include', '/login');
  });
}); 
