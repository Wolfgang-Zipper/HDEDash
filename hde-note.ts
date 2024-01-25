import { CronJob } from 'cron';
import fetch, { Headers } from 'node-fetch';

const job = new CronJob('*/1 * * * *', function () {
  const url: string = "https://";
  const token: string = "==";

  async function reqHde(endpoint: string, param: string, offset: number = 1): Promise<any> {
    try {
      const response_objects: any[] = [];
      const response = await fetch(`${url}api/v2/${endpoint}/?page=${offset}${param}`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${token}`,
        }
      });
      if (response.ok) {
        const r:any = await response.json();
        for (let key in r.data) {
          response_objects.push(r.data[key]);
        }
        if (r.pagination && r.pagination.total_pages > offset) {
          return response_objects.concat(await reqHde(endpoint, param, offset + 1));
        } else {
          return response_objects;
        }
      } else {
        throw new Error(`Ошибка запроса. Ответ сервера: ${response.status}`);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function getDates(): any {
    let weekAgo: any = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let weekAgoMonth: number = weekAgo.getMonth() + 1;

    let d: Date = new Date();
    let curr_date: number = d.getDate();
    let curr_month: number = d.getMonth() + 1;
    let curr_year: number = d.getFullYear();
    let f: Date = new Date(); f.setFullYear(curr_year, curr_month, 1);
    let l: Date = new Date(); l.setFullYear(curr_year, curr_month, 0);

    let dates: any = {
      "first": `${curr_year}-${fixNum(curr_month)}-${fixNum(f.getDate())}`,
      "last": `${curr_year}-${fixNum(curr_month)}-${fixNum(l.getDate())}`,
      "week": `${curr_year}-${fixNum(weekAgoMonth)}-${fixNum(weekAgo)}`,
      "today": `${curr_year}-${fixNum(curr_month)}-${fixNum(curr_date)}`,
      "previous_hour": `${fixNum(d.getHours() - 1)}:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`,
      "previous_minute": `${fixNum(d.getHours())}:${fixNum(d.getMinutes() - 1)}:${fixNum(d.getSeconds())}`
    }
    return dates;
  }

  function fixNum(num: number): string {
    let number: string = (num < 10) ? `0${num}` : num.toString();
    return number;
  };

  let date: any = getDates();
  let date_previous_minute: string = date.today + " " + `${date.previous_minute}`;

  async function main(): Promise<void> {
    const tickets_update_previous_minute: any[] = await reqHde("tickets", `&search=Отдел технической поддержки&status_list=open,v-processe,6&from_date_updated=${date_previous_minute}`);

    for (let key in tickets_update_previous_minute) {
      if (tickets_update_previous_minute[key]) {
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