describe('Вход в аккаунт', () => {
  beforeEach(() => {
    // Очищаем все данные авторизации
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('Пользователь входит с корректными email и паролем, происходит редирект и отображается имя', () => {
    // Шаг 1: Переходим на страницу входа
    cy.visit('/login');
    cy.get('[class*="loginPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Заполняем форму
    cy.get('input[id="email"]')
      .should('be.visible')
      .type('shulga@mail.ru');

    cy.get('input[id="password"]')
      .should('be.visible')
      .type('vfrcbv123');

    // Шаг 3: Отправляем форму
    cy.get('button[type="submit"]')
      .should('be.visible')
      .click();

    // Шаг 4: Проверяем успешный вход
    cy.get('[class*="userProfile"]', { timeout: 10000 }).should('be.visible');

    // Шаг 5: Проверяем редирект
    cy.url().should('not.include', '/login');

    // Шаг 6: Проверяем, что меню профиля работает
    cy.get('[class*="userProfile"]').click();
    cy.contains('button', 'Выйти').should('exist');
  });
}); 