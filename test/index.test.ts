import * as chai from 'chai';
const expect = chai.expect;

const { getDates } = require('./path-to-your-module');

describe('Тестирование генератора дат', () => {
  it('Должен верно генерировать даты', () => {
    const dates = getDates();

    // Проверяем, что возвращаемые значения не пусты
    expect(dates).to.be.an('object').that.is.not.empty;

    // Проверяю на соответствие форматам даты
    expect(dates.today).to.match(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates.previous_minute).to.match(/^\d{2}:\d{2}:\d{2}$/);

  });
});