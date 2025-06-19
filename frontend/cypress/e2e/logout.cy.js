describe('Выход из аккаунта', () => {
  it('Пользователь выходит, происходит редирект на главную, и кнопки профиля недоступны', () => {
    // Данные существующего пользователя
    const email = 'shulga@mail.ru';
    const password = 'vfrcbv123';
    const firstName = 'Саша';

    // Логин
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('match', /\/$/);
    cy.get('header').should('contain', firstName);

    // Открываем дропдаун по универсальному селектору
    cy.get('[class*="userProfile"]').trigger('mouseover');
    cy.wait(300);

    // Кликаем по кнопке «Выйти»
    cy.get('button').contains('Выйти').click();

    // Проверяем редирект на главную
    cy.url().should('match', /\/$/);

    // Проверяем, что пользователь вышел: [class*="userName"] отсутствует, [class*="registerBtn"] и ссылка на вход присутствуют
    cy.get('[class*="userName"]').should('not.exist');
    cy.get('[class*="registerBtn"]').should('exist');
    cy.get('a[href="/login"]').should('exist');

    // Проверяем, что кнопки профиля недоступны (например, нет имени пользователя и/или кнопки "Профиль")
    cy.get('header').should('not.contain', firstName);
    cy.get('header').should('not.contain', /профиль|profile/i);
  });
}); 
