describe('TC-004 — Просмотр профиля', () => {
  beforeEach(() => {
    cy.login('shulga@mail.ru', 'vfrcbv123');
    cy.visit('/profile');
    // Ждем загрузки страницы профиля с учетом анимаций
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');
  });

  it('Пользователь видит корректные данные в личном кабинете', () => {
    // Проверяем, что блок с информацией о пользователе появился (с учетом анимаций)
    cy.get('[class*="userInfo"]', { timeout: 10000 }).should('be.visible');

    // Проверяем имя пользователя в шапке профиля
    cy.get('[class*="userInfo"] h1')
      .should('be.visible')
      .and('contain', 'Максим Иванов');

    // Проверяем email пользователя в шапке профиля
    cy.get('[class*="userInfo"] p')
      .should('be.visible')
      .and('contain', 'shulga@mail.ru');

    // Проверяем, что отображается дата регистрации (может быть с анимацией)
    cy.get('[class*="memberSince"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.empty');

    // Проверяем детальную информацию в карточке профиля
    cy.get('[class*="profileInfo"]').within(() => {
      // Проверяем email
      cy.get('[class*="infoRow"]').eq(0)
        .find('[class*="infoLabel"]').should('contain', 'Email:')
        .next().should('contain', 'shulga@mail.ru');

      // Проверяем имя
      cy.get('[class*="infoRow"]').eq(1)
        .find('[class*="infoLabel"]').should('contain', 'Имя:')
        .next().should('contain', 'Максим');

      // Проверяем фамилию
      cy.get('[class*="infoRow"]').eq(2)
        .find('[class*="infoLabel"]').should('contain', 'Фамилия:')
        .next().should('contain', 'Иванов');

      // Проверяем имя пользователя
      cy.get('[class*="infoRow"]').eq(3)
        .find('[class*="infoLabel"]').should('contain', 'Имя пользователя:')
        .next().should('contain', 'shulga');
    });
  });
});

describe('TC-005 — Редактирование профиля', () => {
  const newFirstName = 'Александр';
  const newLastName = 'Петров';
  const originalFirstName = 'Максим';
  const originalLastName = 'Иванов';

  beforeEach(() => {
    cy.login('shulga@mail.ru', 'vfrcbv123');
    cy.visit('/profile');
    // Ждем загрузки страницы профиля с учетом анимаций
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');
  });

  afterEach(() => {
    // Восстанавливаем оригинальные данные после каждого теста
    cy.get('body').then($body => {
      if ($body.find('[class*="editButton"]').length > 0) {
        // Если не в режиме редактирования, нажимаем кнопку редактирования
        cy.get('[class*="editButton"]').click();
        cy.get('[class*="editForm"]').should('be.visible');
        
        // Восстанавливаем оригинальные данные
        cy.get('[class*="editForm"] [class*="inputGroup"]').eq(0)
          .find('input').clear().type(originalFirstName);
        cy.get('[class*="editForm"] [class*="inputGroup"]').eq(1)
          .find('input').clear().type(originalLastName);
        
        // Сохраняем изменения
        cy.get('[class*="saveButton"]').click();
        
        // Ждем завершения сохранения
        cy.get('[class*="editForm"]').should('not.exist');
      }
    });
  });

  it('Пользователь редактирует имя и фамилию в профиле и видит обновленные данные', () => {
    // Нажимаем кнопку редактирования
    cy.get('[class*="editButton"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Проверяем, что форма редактирования появилась (с учетом анимаций)
    cy.get('[class*="editForm"]', { timeout: 10000 }).should('be.visible');

    // Изменяем имя
    cy.get('[class*="editForm"] [class*="inputGroup"]').eq(0).within(() => {
      cy.get('input')
        .should('be.visible')
        .clear()
        .type(newFirstName);
    });

    // Изменяем фамилию
    cy.get('[class*="editForm"] [class*="inputGroup"]').eq(1).within(() => {
      cy.get('input')
        .should('be.visible')
        .clear()
        .type(newLastName);
    });

    // Сохраняем изменения
    cy.get('[class*="saveButton"]')
      .should('be.visible')
      .click();

    // Ждем завершения сохранения и исчезновения формы редактирования
    cy.get('[class*="editForm"]').should('not.exist');

    // Проверяем, что данные обновились в шапке профиля
    cy.get('[class*="userInfo"] h1', { timeout: 10000 })
      .should('be.visible')
      .and('contain', `${newFirstName} ${newLastName}`);

    // Проверяем, что данные обновились в детальной информации профиля
    cy.get('[class*="profileInfo"]').within(() => {
      // Проверяем обновленное имя
      cy.get('[class*="infoRow"]').eq(1)
        .find('[class*="infoLabel"]').should('contain', 'Имя:')
        .next().should('contain', newFirstName);

      // Проверяем обновленную фамилию
      cy.get('[class*="infoRow"]').eq(2)
        .find('[class*="infoLabel"]').should('contain', 'Фамилия:')
        .next().should('contain', newLastName);
    });

    // Проверяем, что кнопка редактирования снова доступна
    cy.get('[class*="editButton"]').should('be.visible');
  });

  it('Пользователь может отменить редактирование профиля', () => {
    // Нажимаем кнопку редактирования
    cy.get('[class*="editButton"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Проверяем, что форма редактирования появилась
    cy.get('[class*="editForm"]', { timeout: 10000 }).should('be.visible');

    // Изменяем имя (но не сохраняем)
    cy.get('[class*="editForm"] [class*="inputGroup"]').eq(0).within(() => {
      cy.get('input')
        .should('be.visible')
        .clear()
        .type('ТестовоеИмя');
    });

    // Нажимаем кнопку отмены
    cy.get('[class*="cancelButton"]')
      .should('be.visible')
      .click();

    // Проверяем, что форма редактирования исчезла
    cy.get('[class*="editForm"]').should('not.exist');

    // Проверяем, что данные остались прежними
    cy.get('[class*="userInfo"] h1')
      .should('be.visible')
      .and('contain', `${originalFirstName} ${originalLastName}`);

    // Проверяем в детальной информации
    cy.get('[class*="profileInfo"]').within(() => {
      cy.get('[class*="infoRow"]').eq(1)
        .find('[class*="infoLabel"]').should('contain', 'Имя:')
        .next().should('contain', originalFirstName);
    });
  });
});

describe('TC-006 — Смена пароля', () => {
  const currentPassword = 'vfrcbv123';
  const newPassword = 'newTestPassword456';
  const email = 'shulga@mail.ru';

  beforeEach(() => {
    cy.login(email, currentPassword);
    cy.visit('/profile');
    // Ждем загрузки страницы профиля с учетом анимаций
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');
  });

  it('Пользователь меняет пароль, выходит и заходит с новым паролем', () => {
    // Прокручиваем к форме смены пароля
    cy.get('[class*="passwordCard"]', { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView();

    // Заполняем форму смены пароля
    cy.get('[class*="passwordCard"]').within(() => {
      // Вводим текущий пароль
      cy.get('input[type="password"]').eq(0)
        .should('be.visible')
        .clear()
        .type(currentPassword);

      // Вводим новый пароль
      cy.get('input[type="password"]').eq(1)
        .should('be.visible')
        .clear()
        .type(newPassword);

      // Подтверждаем новый пароль
      cy.get('input[type="password"]').eq(2)
        .should('be.visible')
        .clear()
        .type(newPassword);

      // Нажимаем кнопку смены пароля
      cy.get('button[type="submit"]')
        .should('be.visible')
        .click();
    });

    // Ждем и проверяем появление сообщения об успехе
    cy.contains('Пароль успешно изменен', { timeout: 15000 })
      .should('be.visible');
    
    // Дополнительно ждем, чтобы убедиться что операция завершилась
    cy.wait(2000);

    // Проверяем, что поля очистились
    cy.get('[class*="passwordCard"]').within(() => {
      cy.get('input[type="password"]').eq(0).should('have.value', '');
      cy.get('input[type="password"]').eq(1).should('have.value', '');
      cy.get('input[type="password"]').eq(2).should('have.value', '');
    });

    // Выходим из системы через меню пользователя
    cy.get('[class*="userProfile"]').trigger('mouseover');
    cy.get('[class*="dropdownContent"]', { timeout: 5000 }).should('be.visible');
    
    cy.get('[class*="dropdownContent"]').within(() => {
      cy.contains('button', 'Выход').click();
    });

    // Проверяем, что мы перешли на главную страницу и не авторизованы
    cy.url().should('include', '/');
    cy.get('[class*="authLinks"]', { timeout: 10000 }).should('be.visible');

    // Пытаемся войти со старым паролем (должно не получиться)
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(currentPassword);
    cy.get('button[type="submit"]').click();

    // Проверяем, что остались на странице входа (ошибка входа)
    cy.url().should('include', '/login');

    // Очищаем поле пароля и вводим новый пароль
    cy.get('input[type="password"]').clear().type(newPassword);
    cy.get('button[type="submit"]').click();

    // Проверяем успешный вход с новым паролем
    cy.location('pathname').should('not.include', '/login');
    cy.get('[class*="userProfile"]', { timeout: 10000 }).should('be.visible');

    // Проверяем, что мы можем попасть в профиль
    cy.visit('/profile');
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');
    cy.get('[class*="userInfo"] h1').should('contain', 'Максим Иванов');

    // ВОССТАНАВЛИВАЕМ ПАРОЛЬ ОБРАТНО
    // Меняем пароль обратно на оригинальный
    cy.get('[class*="passwordCard"]', { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView();
    
    cy.get('[class*="passwordCard"]').within(() => {
      // Вводим новый пароль как текущий
      cy.get('input[type="password"]').eq(0).clear().type(newPassword);
      // Вводим оригинальный пароль как новый
      cy.get('input[type="password"]').eq(1).clear().type(currentPassword);
      // Подтверждаем оригинальный пароль
      cy.get('input[type="password"]').eq(2).clear().type(currentPassword);
      // Нажимаем кнопку смены пароля
      cy.get('button[type="submit"]').click();
    });

    // Ждем сообщения об успехе
    cy.contains('Пароль успешно изменен', { timeout: 15000 }).should('be.visible');
  });

  it('Пользователь получает ошибку при неверном текущем пароле', () => {
    // Прокручиваем к форме смены пароля
    cy.get('[class*="passwordCard"]', { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView();

    // Заполняем форму с неверным текущим паролем
    cy.get('[class*="passwordCard"]').within(() => {
      // Вводим неверный текущий пароль
      cy.get('input[type="password"]').eq(0)
        .should('be.visible')
        .clear()
        .type('wrongPassword123');

      // Вводим новый пароль
      cy.get('input[type="password"]').eq(1)
        .should('be.visible')
        .clear()
        .type(newPassword);

      // Подтверждаем новый пароль
      cy.get('input[type="password"]').eq(2)
        .should('be.visible')
        .clear()
        .type(newPassword);

      // Нажимаем кнопку смены пароля
      cy.get('button[type="submit"]')
        .should('be.visible')
        .click();
    });

    // Проверяем появление сообщения об ошибке
    cy.get('[class*="errorMessage"]', { timeout: 10000 })
      .should('be.visible');
  });
});

describe('TC-007 — Сложная навигация по профилю', () => {
  beforeEach(() => {
    cy.login('shulga@mail.ru', 'vfrcbv123');
    cy.visit('/profile');
    cy.get('[class*="profilePage"]', { timeout: 10000 }).should('be.visible');
  });

  it('Глубокая проверка всех элементов профиля с большой вложенностью', () => {
    // Уровень 1: Проверка основной структуры страницы
    cy.get('[class*="profilePage"]').within(() => {
      
      // Уровень 2: Проверка контейнера
      cy.get('[class*="container"]').within(() => {
        
        // Уровень 3: Проверка шапки профиля
        cy.get('[class*="header"]').within(() => {
          
          // Уровень 4: Проверка карточки пользователя
          cy.get('[class*="userCard"]').within(() => {
            
            // Уровень 5: Проверка аватара
            cy.get('[class*="userAvatar"]').within(() => {
              cy.should('be.visible')
                .and('contain.text', 'М'); // Первая буква имени Максим
            });
            
            // Уровень 5: Проверка информации о пользователе
            cy.get('[class*="userInfo"]').within(() => {
              
              // Уровень 6: Проверка имени
              cy.get('h1').within(() => {
                cy.should('be.visible')
                  .and('contain', 'Максим')
                  .and('contain', 'Иванов');
              });
              
              // Уровень 6: Проверка email
              cy.get('p').within(() => {
                cy.should('be.visible')
                  .and('contain', 'shulga@mail.ru');
              });
              
              // Уровень 6: Проверка даты регистрации
              cy.get('[class*="memberSince"]').within(() => {
                cy.should('be.visible')
                  .and('not.be.empty');
              });
            });
          });
        });
        
        // Уровень 3: Проверка вкладок
        cy.get('[class*="tabs"]').within(() => {
          
          // Уровень 4: Проверка вкладки профиля
          cy.get('[class*="tab"]').first().within(() => {
            cy.should('be.visible')
              .and('contain', 'Профиль')
              .and('have.class', styles.tabActive || ''); // Проверяем активную вкладку
          });
          
          // Уровень 4: Проверка вкладки бронирований
          cy.get('[class*="tab"]').last().within(() => {
            cy.should('be.visible')
              .and('contain', 'Бронирования');
          });
        });
        
        // Уровень 3: Проверка контента профиля
        cy.get('[class*="content"]').within(() => {
          
          // Уровень 4: Проверка содержимого профиля
          cy.get('[class*="profileContent"]').within(() => {
            
            // Уровень 5: Проверка карточки профиля
            cy.get('[class*="profileCard"]').within(() => {
              
              // Уровень 6: Проверка заголовка карточки
              cy.get('[class*="cardHeader"]').within(() => {
                
                // Уровень 7: Проверка заголовка
                cy.get('h2').within(() => {
                  cy.should('be.visible')
                    .and('contain', 'Личная информация');
                });
                
                // Уровень 7: Проверка кнопки редактирования
                cy.get('[class*="editButton"]').within(() => {
                  cy.should('be.visible')
                    .and('contain', 'Редактировать');
                });
              });
              
              // Уровень 6: Проверка информации профиля
              cy.get('[class*="profileInfo"]').within(() => {
                
                // Уровень 7: Проверка строки с email
                cy.get('[class*="infoRow"]').eq(0).within(() => {
                  
                  // Уровень 8: Проверка метки
                  cy.get('[class*="infoLabel"]').within(() => {
                    cy.should('contain', 'Email:');
                  });
                  
                  // Уровень 8: Проверка значения
                  cy.get('[class*="infoValue"]').within(() => {
                    cy.should('contain', 'shulga@mail.ru');
                  });
                });
                
                // Уровень 7: Проверка строки с именем
                cy.get('[class*="infoRow"]').eq(1).within(() => {
                  
                  // Уровень 8: Проверка метки
                  cy.get('[class*="infoLabel"]').within(() => {
                    cy.should('contain', 'Имя:');
                  });
                  
                  // Уровень 8: Проверка значения
                  cy.get('[class*="infoValue"]').within(() => {
                    cy.should('contain', 'Максим');
                  });
                });
                
                // Уровень 7: Проверка строки с фамилией
                cy.get('[class*="infoRow"]').eq(2).within(() => {
                  
                  // Уровень 8: Проверка метки
                  cy.get('[class*="infoLabel"]').within(() => {
                    cy.should('contain', 'Фамилия:');
                  });
                  
                  // Уровень 8: Проверка значения
                  cy.get('[class*="infoValue"]').within(() => {
                    cy.should('contain', 'Иванов');
                  });
                });
                
                // Уровень 7: Проверка строки с именем пользователя
                cy.get('[class*="infoRow"]').eq(3).within(() => {
                  
                  // Уровень 8: Проверка метки
                  cy.get('[class*="infoLabel"]').within(() => {
                    cy.should('contain', 'Имя пользователя:');
                  });
                  
                  // Уровень 8: Проверка значения
                  cy.get('[class*="infoValue"]').within(() => {
                    cy.should('contain', 'shulga');
                  });
                });
              });
            });
            
            // Уровень 5: Проверка карточки смены пароля
            cy.get('[class*="passwordCard"]').within(() => {
              
              // Уровень 6: Проверка заголовка
              cy.contains('Изменить пароль').within(() => {
                cy.should('be.visible');
              });
              
              // Уровень 6: Проверка формы смены пароля
              cy.get('form').within(() => {
                
                // Уровень 7: Проверка полей ввода пароля
                cy.get('input[type="password"]').each(($input, index) => {
                  
                  // Уровень 8: Проверка каждого поля
                  cy.wrap($input).within(() => {
                    cy.should('be.visible')
                      .and('have.attr', 'type', 'password');
                  });
                });
                
                // Уровень 7: Проверка кнопки отправки
                cy.get('button[type="submit"]').within(() => {
                  cy.should('be.visible')
                    .and('contain', 'Изменить пароль');
                });
              });
            });
          });
        });
      });
    });
  });
  
  it('Переключение между вкладками с глубокой проверкой', () => {
    // Проверяем, что по умолчанию активна вкладка Профиль
    cy.get('[class*="tabs"]').within(() => {
      cy.get('[class*="tab"]').first().should('have.class', 'tabActive');
      cy.get('[class*="profileContent"]').should('be.visible');
    });
    
    // Переключаемся на вкладку Бронирования
    cy.get('[class*="tabs"]').within(() => {
      cy.get('[class*="tab"]').last().click();
    });
    
    // Глубокая проверка содержимого вкладки Бронирования
    cy.get('[class*="content"]').within(() => {
      cy.get('[class*="bookingsContent"]').within(() => {
        
        // Проверяем либо пустое состояние, либо список бронирований
        cy.get('body').then($body => {
          if ($body.find('[class*="emptyState"]').length > 0) {
            
            // Если бронирований нет - проверяем пустое состояние
            cy.get('[class*="emptyState"]').within(() => {
              cy.get('[class*="emptyIcon"]').should('be.visible');
              cy.get('h3').should('contain', 'бронирований');
              cy.get('p').should('be.visible');
              cy.get('[class*="browseCarsButton"]').should('be.visible');
            });
            
          } else {
            
            // Если есть бронирования - проверяем их структуру
            cy.get('[class*="bookingsHeader"]').within(() => {
              
              cy.get('[class*="bookingsStats"]').within(() => {
                cy.get('[class*="stat"]').should('have.length', 4);
                
                cy.get('[class*="stat"]').each($stat => {
                  cy.wrap($stat).within(() => {
                    cy.get('[class*="statNumber"]').should('be.visible');
                    cy.get('[class*="statLabel"]').should('be.visible');
                  });
                });
              });
              
              cy.get('[class*="bookingsFilters"]').within(() => {
                cy.get('button').should('have.length.greaterThan', 0);
              });
            });
          }
        });
      });
    });
    
    // Возвращаемся обратно на вкладку Профиль
    cy.get('[class*="tabs"]').within(() => {
      cy.get('[class*="tab"]').first().click();
    });
    
    // Проверяем, что контент профиля снова видимый
    cy.get('[class*="profileContent"]').should('be.visible');
  });
}); 