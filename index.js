import fetch from 'node-fetch';
global.Headers = fetch.Headers;
let url = "https://omni.cp.ru/"
const token = "==";
let userTickets = {};
let tickets = {};
let userTicketsGrafana = {};

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
      if (r.pagination && r.pagination.total_pages > offset) {
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

function translit(word) {
  var answer = '';
  var converter = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya', '': 'i',

    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd',
    'Е': 'e', 'Ё': 'e', 'Ж': 'zh', 'З': 'z', 'И': 'i',
    'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n',
    'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't',
    'У': 'u', 'Ф': 'f', 'Х': 'h', 'Ц': 'c', 'Ч': 'ch',
    'Ш': 'sh', 'Щ': 'sch', 'Ь': '', 'Ы': 'y', 'Ъ': '',
    'Э': 'e', 'Ю': 'yu', 'Я': 'ya', ' ': '_'
  }
  for (var i = 0; i < word.length; ++i) {
    if (converter[word[i]] == undefined) {
      answer += word[i];
    } else {
      answer += converter[word[i]];
    }
  }

  return answer.replace(/\u0301/g, "");
}





async function main() {

  const users = await reqHde("users", "&group_list=17,18,19,10,2,");

  const tickets = await reqHde("tickets", "&search=Отдел технической поддержки&status_list=open,v-processe,6");

  for (let i = 0; i < users.length; i++) {
    userTickets[users[i].id] =
    {
      name: `${users[i].name} ${users[i].lastname}`,
      user_status: `${users[i].user_status}`,
      ticketCount: 0
    }
  }

  for (let i = 0; i < tickets.length; i++) {

    if (userTickets[tickets[i].owner_id]) {

      if (userTickets[tickets[i].owner_id].ticketCount) {

        userTickets[tickets[i].owner_id].ticketCount += 1

      } else {

        userTickets[tickets[i].owner_id].ticketCount = 1

      }

    }

  }

  for (let key in userTickets) {

    if (userTickets[key]) {
      userTicketsGrafana +=
        `
# TYPE hde_${translit(userTickets[key].name)}_tik_in_work gauge
hde_${translit(userTickets[key].name)}_tik_in_work ${userTickets[key].ticketCount}`;
    }

  }
  console.log(userTicketsGrafana)


}

main();