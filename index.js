let fetch = require('node-fetch');
global.Headers = fetch.Headers;

let url = "https://ratingcp.helpdeskeddy.com/"
const token = "";
let requests = 0;
let response_objects = []; // массив для подсчета объектов ответа API
async function reqHde(offset, endpoint, param) {

  try {
    await fetch(`${url}api/v2/${endpoint}/?page=${offset}${param}`, { // запрос к API с параметрами
      method: "GET",
      headers: {
        "Authorization": `Basic ${token}`,
      }
    })
      .then(response => response.json()) // получаем ответ в формате JSON
      .then((r) => {

        for (let key in r.data) {
          response_objects.push(r.data[key]); // заносим каждый массив в объект

        }

        if (r.pagination.total_pages > offset) { // решение страниц пока все страницы не будут обработаны
          return reqHde(offset + 1, endpoint, param);
        } else {
          console.log(response_objects); // вывод всех объектов на экран
        }
      });
  } catch (err) {
    console.log(err); // вывод ошибки, если запрос не выполнится успешно
  }
}

reqHde(1, "tickets", "&search=John") // вызов функции с определенными параметрами
