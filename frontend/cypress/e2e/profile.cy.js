describe('TC-004 — Просмотр и редактирование профиля', () => {
  beforeEach(() => {
    // Очищаем все данные авторизации перед каждым тестом
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });

    // Авторизуемся перед каждым тестом
    cy.visit('/login');
    cy.get('input[id="email"]', { timeout: 10000 })
      .should('be.visible')
      .type('shulga@mail.ru');

    cy.get('input[id="password"]', { timeout: 10000 })
      .should('be.visible')
      .type('vfrcbv123');

    cy.get('button[type="submit"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Ждем загрузки профиля и переходим на страницу профиля
    cy.get('body').then($body => {
      // Проверяем наличие элемента userProfile
      const hasUserProfile = $body.find('[class*="userProfile"]').length > 0;
      
      if (hasUserProfile) {
        cy.log('Успешная авторизация с первой попытки');
        cy.visit('/profile');
        cy.get('[class*="profilePage"]', { timeout: 20000 }).should('be.visible');
      } else {
        cy.log('Первая попытка авторизации не удалась, пробуем еще раз');
        // Если не удалось войти, пробуем еще раз
        cy.visit('/login');
        cy.get('input[id="email"]', { timeout: 10000 })
          .should('be.visible')
          .type('shulga@mail.ru');

        cy.get('input[id="password"]', { timeout: 10000 })
          .should('be.visible')
          .type('vfrcbv123');

        cy.get('button[type="submit"]', { timeout: 10000 })
          .should('be.visible')
          .click();

        // Ждем появления элемента userProfile с увеличенным таймаутом
        cy.get('[class*="userProfile"]', { timeout: 30000 }).should('be.visible');
        cy.visit('/profile');
        cy.get('[class*="profilePage"]', { timeout: 20000 }).should('be.visible');
      }
    });
  });

  it('Проверка основной структуры страницы профиля', () => {
    // Проверяем наличие основных элементов
    cy.get('[class*="profilePage"]').within(() => {
      cy.get('[class*="header"]').should('exist');
      cy.get('[class*="userCard"]').should('exist');
      cy.get('[class*="tabs"]').should('exist');
      cy.get('[class*="content"]').should('exist');
    });

    // Проверяем информацию пользователя
    cy.get('[class*="userCard"]').within(() => {
      cy.get('[class*="userAvatar"]').should('exist');
      cy.get('[class*="userInfo"]').within(() => {
        cy.get('h1').should('exist');
        cy.get('p').should('contain', 'shulga@mail.ru');
      });
    });

    // Проверяем вкладки
    cy.get('[class*="tabs"]').within(() => {
      cy.get('[class*="tab"]').should('have.length', 2);
      // Проверяем наличие вкладок без привязки к конкретному тексту
      cy.get('[class*="tab"]').first().should('exist');
      cy.get('[class*="tab"]').last().should('exist');
    });
  });

  it('Редактирование личной информации', () => {
    const newFirstName = 'Новое Имя';
    const newLastName = 'Новая Фамилия';

    // Сохраняем исходные данные
    let originalName;
    cy.get('[class*="userCard"]').within(() => {
      cy.get('[class*="userInfo"] h1').invoke('text').then(text => {
        originalName = text;
      });
    });

    // Нажимаем кнопку редактирования
    cy.get('[class*="editButton"]').click();

    // Редактируем данные
    cy.get('[class*="editForm"]').within(() => {
      cy.get('[class*="formRow"]').first().within(() => {
        cy.get('input').first().clear().type(newFirstName);
        cy.get('input').last().clear().type(newLastName);
      });
      cy.get('button[type="submit"]').click();
    });

    // Проверяем обновленные данные
    cy.get('[class*="userCard"]').within(() => {
      cy.get('[class*="userInfo"] h1').should('contain', `${newFirstName} ${newLastName}`);
    });

    // Возвращаем исходные данные
    cy.get('[class*="editButton"]').click();
    cy.get('[class*="editForm"]').within(() => {
      cy.get('[class*="formRow"]').first().within(() => {
        cy.get('input').first().clear().type('Максим');
        cy.get('input').last().clear().type('Иванов');
      });
      cy.get('button[type="submit"]').click();
    });
  });

  it('Отмена редактирования профиля', () => {
    // Сохраняем исходные данные
    let originalName;
    cy.get('[class*="userCard"]').within(() => {
      cy.get('[class*="userInfo"] h1').invoke('text').then(text => {
        originalName = text;
      });
    });

    // Нажимаем кнопку редактирования
    cy.get('[class*="editButton"]').click();

    // Вводим новые данные
    cy.get('[class*="editForm"]').within(() => {
      cy.get('[class*="formRow"]').first().within(() => {
        cy.get('input').first().clear().type('Временное Имя');
        cy.get('input').last().clear().type('Временная Фамилия');
      });
      cy.get('[class*="cancelButton"]').click();
    });

    // Проверяем, что данные не изменились
    cy.get('[class*="userCard"]').within(() => {
      cy.get('[class*="userInfo"] h1').should('contain', originalName);
    });
  });

  it('Смена пароля', () => {
    const newPassword = 'NewTestPass123!';
    
    // Переходим к форме смены пароля
    cy.get('[class*="passwordCard"]').within(() => {
      // Вводим пароли
      cy.get('input[type="password"]').first().type('vfrcbv123');
      cy.get('input[type="password"]').eq(1).type(newPassword);
      cy.get('input[type="password"]').eq(2).type(newPassword);
      cy.get('button[type="submit"]').click();
    });

    // Ждем сообщение об успехе
    cy.get('[class*="successMessage"]', { timeout: 10000 }).should('be.visible');

    // Выходим из системы
    cy.get('[class*="userProfile"]').click();
    cy.contains('button', /[Вв]ыйти/i).click({ force: true });

    // Входим с новым паролем
    cy.visit('/login');
    cy.get('input[id="email"]').type('shulga@mail.ru');
    cy.get('input[id="password"]').type(newPassword);
    cy.get('button[type="submit"]').click();

    // Проверяем успешный вход
    cy.get('[class*="userProfile"]', { timeout: 15000 }).should('be.visible');

    // Возвращаем старый пароль
    cy.visit('/profile');
    cy.get('[class*="passwordCard"]').within(() => {
      cy.get('input[type="password"]').first().type(newPassword);
      cy.get('input[type="password"]').eq(1).type('vfrcbv123');
      cy.get('input[type="password"]').eq(2).type('vfrcbv123');
      cy.get('button[type="submit"]').click();
    });
  });

  it('Проверка вкладки бронирований', () => {
    // Переключаемся на вкладку бронирований
    cy.get('[class*="tabs"]').within(() => {
      cy.get('[class*="tab"]').last().click();
    });
    
    cy.get('[class*="bookingsContent"]').should('be.visible');

    // Проверяем содержимое
    cy.get('body').then($body => {
      if ($body.find('[class*="bookingCard"]').length > 0) {
        // Есть бронирования
        cy.get('[class*="bookingCard"]').first().within(() => {
          cy.get('[class*="bookingImage"]').should('exist');
          cy.get('[class*="bookingStatus"]').should('exist');
          cy.get('[class*="bookingDates"]').should('exist');
          cy.get('[class*="bookingPrice"]').should('exist');
        });

        // Проверяем статистику
        cy.get('[class*="bookingsStats"]').within(() => {
          cy.get('[class*="stat"]').should('have.length', 4);
        });

        // Проверяем фильтры
        cy.get('[class*="bookingsFilters"]').within(() => {
          cy.get('[class*="filterButton"]').should('have.length', 4);
        });
      } else {
        // Нет бронирований
        cy.get('[class*="emptyState"]').should('be.visible');
        cy.get('[class*="browseCarsButton"]').should('be.visible');
      }
    });
  });
}); 