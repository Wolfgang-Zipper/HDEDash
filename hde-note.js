import { CronJob } from 'cron';
import fetch from 'node-fetch';
global.Headers = fetch.Headers;


var job = new CronJob('*/1 * * * *', function () { //шедулер, для выполнения кода каждую секунду

let url = "https://"

const token = "==";


async function reqHde(endpoint, param, offset = 1) { //универсальный запрос
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
      throw new Error(`Ошибка запроса. Ответ сервера: ${response.status}`); //обработка ошибки

    }
  } catch (err) {
    console.log(err);
  }
}

function getDates() { //получаем время

    let weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let weekAgoMonth = weekAgo.getMonth() + 1;
    weekAgo = weekAgo.getDate();
  
    let d = new Date();
    let curr_date = d.getDate();
    let curr_month = d.getMonth() + 1;
    let curr_year = d.getFullYear();
    let f = new Date(); f.setFullYear(curr_year, curr_month, 1);
    let l = new Date(); l.setFullYear(curr_year, curr_month, 0);
  
    let dates = {
        "first": `${curr_year}-${fixNum(curr_month)}-${fixNum(f.getDate())}`,
        "last": `${curr_year}-${fixNum(curr_month)}-${fixNum(l.getDate())}`,
        "week": `${curr_year}-${fixNum(weekAgoMonth)}-${fixNum(weekAgo)}`,
        "today": `${curr_year}-${fixNum(curr_month)}-${fixNum(curr_date)}`,
        "previous_hour": `${fixNum(d.getHours()-1) }:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`,
        "previous_minute": `${fixNum(d.getHours()) }:${fixNum(d.getMinutes()-1)}:${fixNum(d.getSeconds())}`
  
    }
    return dates;
  }

  function fixNum(num) {
    let number = (num < 10) ? `0${num}` : num;
    return number;
  };
  let date = getDates();
  let date_previous_minute = date.today + " " + `${date.previous_minute}`;

async function main() { // выполняем запрос, сортируем все тикеты, шлем тикеты в телеграмм

    const tickets_update_previous_minute = await reqHde("tickets", `&search=Отдел технической поддержки&status_list=open,v-processe,6&from_date_updated=${date_previous_minute}`); //запрос на полученин тикетов

  for (let key in tickets_update_previous_minute) { //сортировка в цикле

    if (tickets_update_previous_minute[key]) {

      //шлем в телеграмм

       fetch(encodeURI(`https://api.telegram.org/__/sendMessage?chat_id=__&text=Тикет: https://__/ru/ticket/list/filter/id/1/ticket/${tickets_update_previous_minute[key].id} 
        Клиент: ${tickets_update_previous_minute[key].user_name}
        Тема: ${tickets_update_previous_minute[key].title} 
        Текст комментария: ${tickets_update_previous_minute[key].owner_name} `))
       .then(res => res.text())
       .catch(error => console.log('error', error));


    }
  }

}

main();


}, null, true, 'Europe/Moscow');
job.start();


