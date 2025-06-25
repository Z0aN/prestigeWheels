describe('TC-001 — Регистрация нового пользователя', () => {
  // Генерируем уникальные данные для каждого запуска теста
  const timestamp = Date.now();
  const testUser = {
    first_name: 'Иван',
    last_name: 'Тестов',
    email: `test.user.${timestamp}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Иван Тестов'
  };

  beforeEach(() => {
    // Очищаем сессию перед тестом
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('Пользователь регистрируется, выходит и входит с новыми данными', () => {
    // Шаг 1: Переход на страницу регистрации
    cy.visit('/register');
    cy.get('[class*="registerPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Заполнение формы регистрации
    cy.get('[class*="registerCard"]').within(() => {
      // Заполняем имя
      cy.get('input[id="first_name"]')
        .should('be.visible')
        .clear()
        .type(testUser.first_name);

      // Заполняем фамилию
      cy.get('input[id="last_name"]')
        .should('be.visible')
        .clear()
        .type(testUser.last_name);

      // Заполняем email
      cy.get('input[id="email"]')
        .should('be.visible')
        .clear()
        .type(testUser.email);

      // Заполняем пароль
      cy.get('input[id="password"]')
        .should('be.visible')
        .clear()
        .type(testUser.password);

      // Подтверждаем пароль
      cy.get('input[id="password_confirm"]')
        .should('be.visible')
        .clear()
        .type(testUser.password);

      // Принимаем условия использования
      cy.get('input[name="agreeToTerms"]')
        .should('be.visible')
        .check();

      // Нажимаем кнопку регистрации
      cy.get('button[type="submit"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
    });

    // Шаг 3: Проверяем успешную регистрацию
    cy.wait(2000); // Ждем ответа от сервера
    cy.location('pathname', { timeout: 15000 }).should('not.include', '/register');
    
    // Проверяем, что пользователь авторизован
    cy.get('[class*="userProfile"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', testUser.first_name);

    // Шаг 4: Выход из системы
    cy.get('[class*="userProfile"]').click();
    cy.contains('button', 'Выйти').click({ force: true });

    // Проверяем, что пользователь вышел из системы
    cy.get('[class*="authLinks"]', { timeout: 10000 }).should('be.visible');
    cy.get('[class*="userProfile"]').should('not.exist');

    // Шаг 5: Вход в систему с новыми данными
    cy.visit('/login');
    cy.get('[class*="loginPage"]', { timeout: 10000 }).should('be.visible');

    cy.get('[class*="loginCard"]').within(() => {
      // Вводим email
      cy.get('input[id="email"]')
        .should('be.visible')
        .clear()
        .type(testUser.email);

      // Вводим пароль
      cy.get('input[id="password"]')
        .should('be.visible')
        .clear()
        .type(testUser.password);

      // Нажимаем кнопку входа
      cy.get('button[type="submit"]')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
    });

    // Шаг 6: Проверяем успешный вход
    cy.wait(2000); // Ждем ответа от сервера
    cy.location('pathname', { timeout: 15000 }).should('not.include', '/login');
    
    // Проверяем, что пользователь авторизован
    cy.get('[class*="userProfile"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', testUser.first_name);

    // Шаг 7: Проверяем доступ к профилю
    cy.visit('/profile');
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');

    // Проверяем основные элементы профиля
    cy.get('[class*="userInfo"]').should('be.visible');
    cy.get('[class*="profileInfo"]').within(() => {
      cy.contains(testUser.email).should('be.visible');
      cy.contains(testUser.first_name).should('be.visible');
      cy.contains(testUser.last_name).should('be.visible');
    });
  });

  it('Валидация формы регистрации - проверка ошибок', () => {
    cy.visit('/register');
    cy.get('[class*="registerPage"]', { timeout: 10000 }).should('be.visible');

    cy.get('[class*="registerCard"]').within(() => {
      // Пытаемся отправить пустую форму
      cy.get('button[type="submit"]').click();

      // Проверяем, что появились ошибки валидации
      cy.get('[class*="fieldError"]').should('have.length.greaterThan', 0);

      // Проверяем конкретные ошибки
      cy.get('input[id="first_name"]').next('[class*="fieldError"]')
        .should('be.visible')
        .and('contain', 'Введите имя');

      cy.get('input[id="last_name"]').next('[class*="fieldError"]')
        .should('be.visible')
        .and('contain', 'Введите фамилию');

      // Проверяем валидацию паролей
      cy.get('input[id="password"]').type('password123');
      cy.get('input[id="password_confirm"]').type('different123');
      cy.get('button[type="submit"]').click();

      cy.get('input[id="password_confirm"]').next('[class*="fieldError"]')
        .should('be.visible')
        .and('contain', 'Пароли не совпадают');
    });
  });

  it('Проверка корректной работы чекбокса согласия', () => {
    cy.visit('/register');
    cy.get('[class*="registerPage"]', { timeout: 10000 }).should('be.visible');

    cy.get('[class*="registerCard"]').within(() => {
      // Заполняем все поля кроме чекбокса
      cy.get('input[id="first_name"]').type('Тест');
      cy.get('input[id="last_name"]').type('Пользователь');
      cy.get('input[id="email"]').type('test@example.com');
      cy.get('input[id="password"]').type('TestPassword123!');
      cy.get('input[id="password_confirm"]').type('TestPassword123!');

      // Пытаемся отправить без согласия
      cy.get('button[type="submit"]').click();

      // Проверяем, что появилась ошибка о необходимости принять условия
      cy.get('[class*="fieldError"]')
        .should('be.visible')
        .and('contain', 'Необходимо принять условия');
    });
  });
}); 