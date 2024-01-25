import { CronJob } from 'cron';
import fetch from 'node-fetch';

const job: CronJob = new CronJob('*/1 * * * *', function () {

  const url: string = "";
  const token: string = "";

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
        const r: any = await response.json();
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
    let weekAgoMonth: any = weekAgo.getMonth() + 1;
    weekAgo = weekAgo.getDate();

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
      "previous_hour": `${fixNum(d.getHours())}:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`,
      "previous_minute": `${fixNum(d.getHours())}:${fixNum(d.getMinutes() - 1)}:${fixNum(d.getSeconds())}`,
      "current_date": `${fixNum(d.getHours())}:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`
    }
    return dates;
  }

  function fixNum(num: number): string {
    let number: string = (num < 10) ? `0${num}` : num.toString();
    return number;
  };

  let date: any = getDates();
  let date_previous_min: string = date.today + " " + `${date.previous_minute}`;

  async function mainactivity(): Promise<void> {
    const tickets_update_previous_min: any[] = await reqHde("tickets", `&search=Отдел технической поддержки&from_date_updated=${date_previous_min}&owner_list=30245&status_list=open,v-processe`);

    for (let i = 0; i < tickets_update_previous_min.length; i++) {
      let chargeBack: boolean = false;
      for (let key1 in tickets_update_previous_min[i].custom_fields) {
        if (tickets_update_previous_min[i].custom_fields[key1] && tickets_update_previous_min[i].custom_fields[key1].id === 20) {
          for (let key2 in tickets_update_previous_min[i].custom_fields[key1].field_value) {
            switch (tickets_update_previous_min[i].custom_fields[key1].field_value[key2].id) {
              case 214: //"Претензионная работа (ответы мерчантов))"
                chargeBack = true;
                break;
              case 213: //Входящая претензия
                chargeBack = true;
                break;
            }
          }
        }
      }
      if (!chargeBack) {
        var dateString: string = tickets_update_previous_min[i].sla_date;
        var parts: string[] = dateString.split(' ');
        var dateParts: string[] = parts[0].split('.');
        var day: number = parseInt(dateParts[0], 10);
        var month: number = parseInt(dateParts[1], 10) - 1;
        var year: number = parseInt(dateParts[2], 10);
        var timeParts: string[] = parts[1].split(':');
        var hours: number = parseInt(timeParts[0], 10);
        var minutes: number = parseInt(timeParts[1], 10);
        var sla_date: any = new Date(year, month, day, hours, minutes);

        let current_date: any = new Date();
        let sla: number = (sla_date - current_date)

        var difference: number = sla_date.getTime() - current_date.getTime();

        var days: number = Math.floor(difference / (1000 * 60 * 60 * 24));
        var seconds: number = Math.floor(difference / 1000);
        var minutes: number = Math.floor(difference / (1000 * 60));
        var hours: number = Math.floor(difference / (1000 * 60 * 60));

        if (difference < 0) {
          console.log('Целевая дата уже прошла.');
        } else {
          difference -= days * (1000 * 60 * 60 * 24);
          difference -= hours * (1000 * 60 * 60);
          difference -= minutes * (1000 * 60);
        }

        fetch(encodeURI(`https://api.telegram.org/__:__/sendMessage?chat_id=__&text= 
    Тикет: https://__/ru/ticket/list/filter/id/1/ticket/${tickets_update_previous_min[i].id}
    
    Клиент: ${tickets_update_previous_min[i].user_name} ${tickets_update_previous_min[i].user_lastname}
    
    Тема: ${tickets_update_previous_min[i].title}
    
    SLA: ${days + ' д ' + hours + ' ч ' + minutes + ' м ' + seconds + ' с '} `))
          .then(res => res.text())
          .catch(error => console.log('error', error));
      }
    }
  }

  mainactivity();

}, null, true, 'Europe/Moscow');
job.start();