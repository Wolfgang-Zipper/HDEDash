let fetch = require('node-fetch');
global.Headers = fetch.Headers;
let url = "https://ratingcp.helpdeskeddy.com/"
const token = "cy56ZWxlbnNraXlAY2xvdWRwYXltZW50cy5ydTpiMzQ0YzJjZC03ZmJlLTRmOTItYTJhZi04ZGU3MDA1Y2U2Njg=";
let requests = 0;


async function reqHde(endpoint, param, offset = 1) {
  try {
    const response_objects = [];
    const response = await fetch(`${url}api/v2/${endpoint}/?page=${offset}${param}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${token}`,
      }
    });
    if (response.ok) { // Проверяем, был ли запрос успешным
      const r = await response.json();
      for (let key in r.data) {
        response_objects.push(r.data[key]);
      }
      if (r.pagination.total_pages > offset) {
        return response_objects.concat(await reqHde(endpoint, param, offset + 1));
      } else {
        return response_objects;
      }
    }

    else {
      throw new Error(`Ошибка запроса. Ответ сервера: ${response.status}`);

    }
  } catch (err) {
    console.log(err);
  }
}


reqHde("tickets", "&status_list=open,closed")
  .then(response => console.log(response.length))
  .catch(error => console.error(error));

reqHde("users")
  .then(response => console.log(response))
  .catch(error => console.error(error));

