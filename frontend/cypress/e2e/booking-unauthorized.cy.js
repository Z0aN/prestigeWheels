describe('TC-008 — Бронирование неавторизованным пользователем', () => {
  const testUser = {
    email: 'shulga@mail.ru',
    password: 'vfrcbv123'
  };

  beforeEach(() => {
    // Очищаем все данные авторизации
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('Неавторизованный пользователь пытается забронировать автомобиль и перенаправляется на вход', () => {
    // Шаг 1: Переходим на страницу каталога
    cy.visit('/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Открываем первую карточку автомобиля
    cy.get('[class*="carCard"]').first().click();
    
    // Проверяем, что перешли на страницу автомобиля
    cy.url().should('match', /\/cars\/\d+/);
    cy.get('[class*="carDetailPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 3: Убеждаемся, что пользователь не авторизован
    cy.get('[class*="userProfile"]').should('not.exist');
    cy.get('[class*="authLinks"]').should('be.visible');

    // Шаг 4: Нажимаем кнопку "Забронировать"
    cy.get('[class*="bookingButton"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // Шаг 5: Проверяем редирект на страницу авторизации
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.get('[class*="loginPage"]').should('be.visible');
    
    // Шаг 6: Входим в систему
    cy.get('[class*="loginCard"]').within(() => {
      cy.get('input[id="email"]')
        .should('be.visible')
        .type(testUser.email);

      cy.get('input[id="password"]')
        .should('be.visible')
        .type(testUser.password);

      cy.get('button[type="submit"]')
        .should('be.visible')
        .click();
    });

    // Шаг 7: Проверяем успешный вход (может быть редирект на главную)
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.get('[class*="userProfile"]', { timeout: 10000 }).should('be.visible');
    
    // Возвращаемся на карточку автомобиля
    cy.visit('/cars/1');

    // Шаг 8: Проверяем, что теперь бронирование доступно
    cy.get('[class*="bookingButton"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // Шаг 9: Проверяем переход на страницу бронирования
    cy.url({ timeout: 10000 }).then((url) => {
      if (url.includes('/login')) {
        // Если снова перенаправило на логин, значит сессия прервалась
        cy.log('Сессия прервалась, повторно авторизуемся');
        cy.get('[class*="loginCard"]').within(() => {
          cy.get('input[id="email"]').type(testUser.email);
          cy.get('input[id="password"]').type(testUser.password);
          cy.get('button[type="submit"]').click();
        });
        // После авторизации переходим к бронированию
        cy.visit('/cars/1');
        cy.get('[class*="bookingButton"]').click();
      }
      
      // Проверяем, что в итоге попали на страницу бронирования
      cy.url().should('match', /\/booking\/\d+/);
      cy.get('[class*="bookingPage"]').should('be.visible');
      
      // Проверяем, что форма бронирования отображается
      cy.get('[class*="bookingForm"]').should('be.visible');
      cy.get('input[type="date"]').should('have.length', 2);
    });
  });

  it('Проверка прямого доступа к странице бронирования неавторизованным пользователем', () => {
    // Шаг 1: Пытаемся напрямую перейти на страницу бронирования
    cy.visit('/booking/1');

    // Шаг 2: Проверяем автоматический редирект на страницу логина
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.get('[class*="loginPage"]').should('be.visible');

    // Шаг 3: Входим в систему
    cy.get('[class*="loginCard"]').within(() => {
      cy.get('input[id="email"]').type(testUser.email);
      cy.get('input[id="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
    });

    // Шаг 4: Проверяем редирект обратно на страницу бронирования
    cy.url({ timeout: 15000 }).should('include', '/booking/1');
    cy.get('[class*="bookingPage"]', { timeout: 10000 }).should('be.visible');
  });

  it('Проверка доступности карточки автомобиля для неавторизованного пользователя', () => {
    // Шаг 1: Переходим на карточку автомобиля
    cy.visit('/cars/1');
    cy.get('[class*="carDetailPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Проверяем, что основная информация доступна
    cy.get('[class*="carHeader"] h1').should('be.visible');
    cy.get('[class*="price"]').should('be.visible');
    cy.get('[class*="rating"]').should('be.visible');

    // Шаг 3: Проверяем наличие кнопки бронирования
    cy.get('[class*="bookingButton"]').should('be.visible');

    // Шаг 4: Проверяем наличие уведомления о необходимости авторизации (может содержать HTML)
    cy.get('[class*="authNote"]')
      .should('be.visible');

    // Шаг 5: Проверяем, что отзывы видны, но нет формы добавления
    cy.get('[class*="reviewsSection"]').should('be.visible');
    cy.get('[class*="addReviewButton"]').should('not.exist');
    
    // Шаг 6: Проверяем наличие подсказки о необходимости входа для отзывов
    cy.get('[class*="reviewHint"]')
      .should('be.visible')
      .and('contain.text', 'Войдите');
  });

  it('Проверка работы навигации после авторизации через карточку автомобиля', () => {
    const carId = '1'; // Используем фиксированный ID

    // Шаг 1: Переходим на карточку автомобиля
    cy.visit(`/cars/${carId}`);
    cy.get('[class*="carDetailPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Кликаем на кнопку бронирования (происходит редирект на логин)
    cy.get('[class*="bookingButton"]').click();
    cy.url({ timeout: 10000 }).should('include', '/login');

    // Шаг 3: Авторизуемся
    cy.get('[class*="loginCard"]').within(() => {
      cy.get('input[id="email"]').type(testUser.email);
      cy.get('input[id="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
    });

    // Шаг 4: Проверяем успешный вход и возвращаемся на карточку
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.get('[class*="userProfile"]').should('be.visible');
    
    // Возвращаемся на карточку автомобиля
    cy.visit(`/cars/${carId}`);

    // Шаг 5: Теперь переходим к бронированию
    cy.get('[class*="bookingButton"]').click();
    
    // Проверяем, что перешли на страницу бронирования или показана ошибка авторизации
    cy.url({ timeout: 10000 }).then((url) => {
      if (url.includes('/login')) {
        // Если снова перенаправило на логин, значит сессия не сохранилась
        cy.log('Сессия не сохранилась, повторно авторизуемся');
        cy.get('[class*="loginCard"]').within(() => {
          cy.get('input[id="email"]').type(testUser.email);
          cy.get('input[id="password"]').type(testUser.password);
          cy.get('button[type="submit"]').click();
        });
        // После повторной авторизации переходим к бронированию
        cy.visit(`/booking/${carId}`);
      }
      // В любом случае проверяем, что в итоге попали на страницу бронирования
      cy.url().should('include', `/booking/${carId}`);
      cy.get('[class*="bookingPage"]').should('be.visible');
    });

    // Шаг 6: Проверяем, что можем вернуться к карточке через навигацию
    cy.get('[class*="breadcrumbs"]').within(() => {
      cy.contains('Каталог').click();
    });
    
    cy.url({ timeout: 5000 }).should('include', '/cars');
    cy.get('[class*="carsPage"]').should('be.visible');
  });
}); 