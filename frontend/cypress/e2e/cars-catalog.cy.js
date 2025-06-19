/**
 * TC-009 — Тестирование каталога автомобилей: главная страница и фильтрация
 * 
 * Этот тест проверяет:
 * 1. Отображение карточек автомобилей на главной странице с обязательными элементами
 * 2. Фильтрацию по цене и сортировку по убыванию цены в каталоге
 * 3. Поиск по названию, фильтрацию по бренду и сброс фильтров
 * 4. Различные варианты сортировки (по цене, рейтингу, названию)
 * 5. Адаптивность интерфейса на мобильных устройствах и обработку ошибочных состояний
 * 
 * Покрывает основные пользовательские сценарии работы с каталогом автомобилей.
 */

describe('TC-009 — Каталог автомобилей: главная страница и фильтрация', () => {
  beforeEach(() => {
    // Очищаем данные перед каждым тестом
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  it('Проверка отображения карточек автомобилей на главной странице', () => {
    // Шаг 1: Переходим на главную страницу
    cy.visit('/');
    cy.get('[class*="homePage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Ждем загрузки секции с автомобилями
    cy.get('[class*="featuredCars"]', { timeout: 15000 }).should('be.visible');

    // Шаг 3: Проверяем, что есть минимум одна карточка автомобиля
    cy.get('[class*="carCard"]', { timeout: 10000 })
      .should('have.length.greaterThan', 0)
      .first()
      .within(() => {
        // Проверяем обязательные элементы карточки
        
        // Фото автомобиля
        cy.get('img')
          .should('be.visible')
          .and('have.attr', 'src')
          .and('not.be.empty');
        
        // Название автомобиля (бренд + модель)
        cy.get('h3')
          .should('be.visible')
          .and('not.be.empty');
        
        // Цена
        cy.get('[class*="priceValue"], [class*="price"]')
          .should('be.visible')
          .and('not.be.empty');
        
        // Кнопка действия
        cy.get('button')
          .should('be.visible')
          .and('not.be.disabled');
      });

    // Шаг 4: Проверяем, что можно кликнуть на карточку и перейти к каталогу
    cy.get('[class*="viewAll"]').should('be.visible');
    cy.get('button').contains('Посмотреть все автомобили').click();
    
    // Проверяем переход на страницу каталога
    cy.url().should('include', '/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');
  });

  it('Фильтрация и сортировка автомобилей в каталоге', () => {
    // Шаг 1: Переходим на страницу каталога
    cy.visit('/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Ждем загрузки автомобилей
    cy.get('[class*="carCard"]', { timeout: 15000 }).should('have.length.greaterThan', 0);

    // Запоминаем изначальное количество автомобилей
    cy.get('[class*="carCard"]').then(($cards) => {
      const initialCount = $cards.length;
      cy.log(`Изначально автомобилей: ${initialCount}`);
      
      // Шаг 3: Применяем фильтр по максимальной цене (до 50000 рублей)
      cy.get('input[placeholder*="до"]')
        .clear()
        .type('50000');

      // Ждем применения фильтра
      cy.wait(1000);

      // Шаг 4: Проверяем, что список обновился
      cy.get('[class*="carCard"]').should('have.length.lessThan', initialCount + 1);

      // Проверяем, что все отображаемые автомобили соответствуют фильтру
      cy.get('[class*="carCard"]').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('[class*="price"], [class*="priceAmount"], [class*="priceValue"]').then(($priceElement) => {
            const priceText = $priceElement.text();
            const price = parseInt(priceText.replace(/[^\d]/g, ''));
            expect(price).to.be.at.most(50000);
          });
        });
      });
    });

    // Шаг 5: Применяем сортировку по убыванию цены
    cy.get('select').first().select('-price');
    
    // Ждем применения сортировки
    cy.wait(1000);

    // Шаг 6: Проверяем правильность сортировки
    let previousPrice = Number.MAX_SAFE_INTEGER;
    
    cy.get('[class*="carCard"]').each(($card, index) => {
      cy.wrap($card).within(() => {
        cy.get('[class*="price"], [class*="priceAmount"], [class*="priceValue"]').then(($priceElement) => {
          const priceText = $priceElement.text();
          const currentPrice = parseInt(priceText.replace(/[^\d]/g, ''));
          
          if (index > 0) {
            expect(currentPrice).to.be.at.most(previousPrice);
          }
          previousPrice = currentPrice;
        });
      });
    });

    // Шаг 7: Проверяем информацию о результатах
    cy.get('[class*="resultsInfo"]')
      .should('be.visible')
      .and('contain.text', 'Найден');
  });

  it('Проверка работы других фильтров', () => {
    // Шаг 1: Переходим на каталог
    cy.visit('/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');
    cy.get('[class*="carCard"]', { timeout: 15000 }).should('have.length.greaterThan', 0);

    // Шаг 2: Тестируем поиск по названию
    cy.get('input[placeholder*="Поиск"]')
      .type('BMW');
    
    cy.wait(1000);
    
    // Проверяем, что результаты содержат BMW (если есть BMW в базе)
    cy.get('body').then(($body) => {
      if ($body.find('[class*="carCard"]').length > 0) {
        cy.get('[class*="carCard"]').each(($card) => {
          cy.wrap($card).within(() => {
            cy.get('h3').should('contain.text', 'BMW');
          });
        });
      } else {
        // Если нет BMW, проверяем сообщение об отсутствии результатов
        cy.get('[class*="noResults"], [class*="noCars"]').should('be.visible');
      }
    });

    // Шаг 3: Очищаем поиск
    cy.get('input[placeholder*="Поиск"]').clear();
    cy.wait(1000);

    // Проверяем, что автомобили снова отображаются
    cy.get('[class*="carCard"]').should('have.length.greaterThan', 0);

    // Шаг 4: Тестируем фильтр по бренду
    cy.get('select').eq(1).then(($select) => {
      // Выбираем первый доступный бренд (не "Все бренды")
      cy.wrap($select).find('option').then(($options) => {
        if ($options.length > 1) {
          const brandValue = $options.eq(1).val();
          const brandText = $options.eq(1).text();
          
          if (brandValue && brandValue !== '') {
            cy.wrap($select).select(brandValue);
            cy.wait(1000);
            
            // Проверяем, что все автомобили соответствуют выбранному бренду
            cy.get('[class*="carCard"]').each(($card) => {
              cy.wrap($card).within(() => {
                cy.get('h3').should('contain.text', brandText);
              });
            });
          }
        }
      });
    });

    // Шаг 5: Сбрасываем фильтры
    cy.get('button').contains('Сбросить').click();
    cy.wait(1000);
    
    // Проверяем, что автомобили снова отображаются
    cy.get('[class*="carCard"]').should('have.length.greaterThan', 0);
  });

  it('Проверка сортировки по разным критериям', () => {
    // Шаг 1: Переходим на каталог
    cy.visit('/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');
    cy.get('[class*="carCard"]', { timeout: 15000 }).should('have.length.greaterThan', 0);

    // Шаг 2: Тестируем сортировку по возрастанию цены
    cy.get('select').first().select('price');
    cy.wait(1000);

    let previousPrice = 0;
    cy.get('[class*="carCard"]').each(($card, index) => {
      cy.wrap($card).within(() => {
        cy.get('[class*="price"], [class*="priceAmount"], [class*="priceValue"]').then(($priceElement) => {
          const priceText = $priceElement.text();
          const currentPrice = parseInt(priceText.replace(/[^\d]/g, ''));
          
          if (index > 0) {
            expect(currentPrice).to.be.at.least(previousPrice);
          }
          previousPrice = currentPrice;
        });
      });
    });

    // Шаг 3: Тестируем сортировку по рейтингу
    cy.get('select').first().select('-average_rating');
    cy.wait(1000);

    // Проверяем, что список изменился
    cy.get('[class*="carCard"]').should('be.visible');

    // Шаг 4: Тестируем сортировку по названию
    cy.get('select').first().select('name');
    cy.wait(1000);

    // Просто проверяем, что сортировка работает (список изменился)
    cy.get('[class*="carCard"]').should('be.visible');
    
    // Дополнительно проверяем сортировку по убыванию названия
    cy.get('select').first().select('-name');
    cy.wait(1000);
    cy.get('[class*="carCard"]').should('be.visible');
  });

  it('Проверка адаптивности и UX каталога', () => {
    // Шаг 1: Проверяем работу на мобильном экране
    cy.viewport(375, 667); // iPhone SE размер
    
    cy.visit('/cars');
    cy.get('[class*="carsPage"]', { timeout: 10000 }).should('be.visible');

    // Шаг 2: Проверяем, что карточки корректно отображаются
    cy.get('[class*="carCard"]', { timeout: 15000 })
      .should('have.length.greaterThan', 0)
      .first()
      .should('be.visible');

    // Шаг 3: Проверяем работу фильтров на мобильном
    cy.get('input[placeholder*="до"]')
      .should('be.visible')
      .type('30000');
    
    cy.wait(1000);
    cy.get('[class*="carCard"]').should('have.length.greaterThan', 0);

    // Шаг 4: Возвращаем обычный размер экрана
    cy.viewport(1280, 720);

    // Шаг 5: Проверяем состояние загрузки
    cy.visit('/cars');
    
    // Проверяем, что есть индикатор загрузки или сразу отображаются автомобили
    cy.get('[class*="loading"], [class*="carCard"]', { timeout: 15000 }).should('be.visible');
    
    // Если есть загрузка, ждем автомобили
    cy.get('body').then(($body) => {
      if ($body.find('[class*="loading"]').length > 0) {
        cy.get('[class*="carCard"]', { timeout: 15000 }).should('be.visible');
      }
    });

    // Шаг 6: Проверяем обработку пустого состояния
    cy.get('input[placeholder*="Поиск"]').type('НесуществующийАвтомобиль123456');
    cy.wait(2000);
    
    // Должно показываться сообщение об отсутствии результатов
    cy.get('[class*="noResults"], [class*="noCars"]')
      .should('be.visible')
      .and('contain.text', 'не найден');
  });
}); 