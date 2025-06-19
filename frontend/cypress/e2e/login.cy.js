describe('Вход в аккаунт', () => {
  it('Пользователь входит с корректными email и паролем, происходит редирект и отображается имя', () => {
    // Данные существующего пользователя
    const email = 'shulga@mail.ru'; // Замените на реально существующий email
    const password = 'vfrcbv123';        // и пароль
    const firstName = 'Саша';             // Имя, которое должно отображаться в шапке

    cy.visit('/login');

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Проверяем, что редирект на главную
    cy.url().should('match', /\/$/);

    // Проверяем, что имя пользователя отображается в [class*="userName"]
    cy.get('[class*="userName"]').should('contain', firstName);
  });
}); 