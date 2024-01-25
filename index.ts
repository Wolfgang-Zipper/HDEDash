import { CronJob } from 'cron';
import fetch from 'node-fetch';

const url: string = "https:///";
const token: string = "==";
let userTickets: { [key: string]: any } = {};
let userTicketsGrafana: string = "";
let userTicketsGrafanaCategory: string = "";
let userTicketsGrafanaactivity: string = "";
let ticket_count_1h_user_off: number = 0;
let ticket_count_1h_user_offGrafana: string = "";
let userTicketsGrafanaonline: string = "";
let hde_online: number = 0;

interface DateObject {
  first: string;
  last: string;
  week: string;
  today: string;
  curr_hour: string;
}

function getDates(): DateObject {
  let weekAgo: any = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let weekAgoMonth: number = weekAgo.getMonth() + 1;
  weekAgo = weekAgo.getDate();

  let d: Date = new Date();
  let curr_date: number = d.getDate();
  let curr_month: number = d.getMonth() + 1;
  let curr_year: number = d.getFullYear();
  let f: Date = new Date(); f.setFullYear(curr_year, curr_month, 1);
  let l: Date = new Date(); l.setFullYear(curr_year, curr_month, 0);

  let dates: DateObject = {
    "first": `${curr_year}-${fixNum(curr_month)}-${fixNum(f.getDate())}`,
    "last": `${curr_year}-${fixNum(curr_month)}-${fixNum(l.getDate())}`,
    "week": `${curr_year}-${fixNum(weekAgoMonth)}-${fixNum(weekAgo)}`,
    "today": `${curr_year}-${fixNum(curr_month)}-${fixNum(curr_date)}`,
    "curr_hour": `${d.getUTCHours()-1 }:${d.getUTCMinutes()}:${d.getUTCSeconds()}`
  }
  return dates;
}

function fixNum(num: number): string {
  let number: string = (num < 10) ? `0${num}` : num.toString();
  return number;
};

async function reqHde(endpoint: string, param: string, offset: number = 1): Promise<any> {
  try {
    const response_objects: any[] = [];
    const response = await fetch(`${url}api/v2/${endpoint}/?page=${offset}${param}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${token}`,
      }
    });
    
    if (response.ok) { // Проверяем, был ли запрос успешным
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

async function sendMetricsProm(metrics: string): Promise<void> {
  var requestOptions = {
    method: 'POST',
    body: metrics
  };
  fetch("http://metrics", requestOptions)
    .then(response => response.text())
    .catch(error => console.log('error', error));
}

function translit(word: string): string {
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

async function main(): Promise<void> {

  const users: any[] = await reqHde("users", "&group_list=17,18,19,10,37");

  let owner_list: string = ""

  for (let i = 0; i < users.length; i++) {
    owner_list +=  users[i].id + ","
    let hde_user_status: string = '';

    switch (users[i].user_status) {
      case "online":
        hde_user_status = '🟢';
        hde_online += 1;
        break;
      case "on-hold":
        hde_user_status = '🟡';
        break;
      case "offline":
        hde_user_status = '';
        break;
      case "vremenno-o":
        hde_user_status = '🔴';
        break;
    }

    userTickets[users[i].id] = {
      name: `${users[i].name} ${users[i].lastname}`,
      user_status: hde_user_status,
      ticketCount: 0,
      open: 0,
      inwork: 0,
      waiting: 0,
      cloudTips: 0,
      cloudKassir: 0,
      cloudPayments: 0,
      otherAppeals: 0,
      sla_false: 0,
      tickets_end_work: 0
    }
  }

  const tickets: any[] = await reqHde("tickets", `&status_list=open,v-processe,6&owner_list=${owner_list}`);
  let d: Date = new Date();
  let curr_date: number = d.getDate();
  for (let i = 0; i < tickets.length; i++) {
    let last_updated_ats: Date = new Date(new Date(tickets[i].date_updated).getTime() + 1000 * 60 * 60 * 3);
    let curr_dates: Date = new Date(new Date(curr_date).getTime() + 1000 * 60 * 60 * 3);
    if (last_updated_ats < curr_dates ) {
      for (let n = 0; n < users.length; n++) {
        if (tickets[i].owner_id == users[n].id && users[n].user_status != "online"  ) {
          ticket_count_1h_user_off += 1;
        }
      }
    }
    let chargeBack: boolean = false;
    for ( let key1 in tickets[i].custom_fields) {
      if (tickets[i].custom_fields[key1] && tickets[i].custom_fields[key1].id===20) {
        for ( let key2 in tickets[i].custom_fields[key1].field_value) {
          switch (tickets[i].custom_fields[key1].field_value[key2].id) {
            case 214: //"Претензионная работа (ответы мерчантов))"
              chargeBack = true;
              break;     
            case 213: //Входящая претензия
              chargeBack = true;
              break;           
            case 209:
              userTickets[tickets[i].owner_id].otherAppeals += 1
              break;           
            case 96:
              userTickets[tickets[i].owner_id].cloudPayments += 1
              break;
            case 158:
              userTickets[tickets[i].owner_id].cloudKassir += 1
              break;
            case 184:
              userTickets[tickets[i].owner_id].cloudTips += 1
              break;
          }
        }
      }
    }
    var last_updated_atDate: Date = new Date(tickets[i].date_updated);
    let day_of_week_last_updated_atDate: number = last_updated_atDate.getDay();
    let last_updated_at: string = tickets[i].date_updated; 
    if (last_updated_at >= last_updated_at && chargeBack == true || day_of_week_last_updated_atDate == 6 && chargeBack == true || day_of_week_last_updated_atDate == 7 && chargeBack == true ) {  
      userTickets[tickets[i].owner_id].tickets_end_work += 1;    //получаем список незакрытых тикетов, которые изменены после 18:30 до 21:00, либо изменены в субботу у воске
    }
    if (tickets[i].sla_flag ==1){
      userTickets[tickets[i].owner_id].sla_false += 1
    }
    if (userTickets[tickets[i].owner_id] && userTickets[tickets[i].owner_id].open || userTickets[tickets[i].owner_id] && userTickets[tickets[i].owner_id].inwork || userTickets[tickets[i].owner_id] && userTickets[tickets[i].owner_id].waiting) {
      userTickets[tickets[i].owner_id].ticketCount += 1
      switch (tickets[i].status_id) {
        case "open":
          userTickets[tickets[i].owner_id].open += 1
          break;
        case "v-processe":
          userTickets[tickets[i].owner_id].inwork += 1
          break;
        case "6":
          userTickets[tickets[i].owner_id].waiting += 1
          break;
      }
    } else {
      if (userTickets[tickets[i].owner_id]) {
        userTickets[tickets[i].owner_id].ticketCount = 1
        switch (tickets[i].status_id) {
          case "open":
            userTickets[tickets[i].owner_id].open = 1
            break;
          case "v-processe":
            userTickets[tickets[i].owner_id].inwork = 1
            break;
          case "6":
            userTickets[tickets[i].owner_id].waiting = 1
            break;
        }
      }
    }
  }
  userTicketsGrafanaonline += `
  # TYPE helpdeskeddy_users_online counter
helpdeskeddy_users_online ${hde_online}\n`;
  sendMetricsProm(userTicketsGrafanaonline)
  userTicketsGrafana += `
# TYPE helpdeskeddy_tickets_info counter`
  userTicketsGrafanaCategory += `
# TYPE helpdeskeddy_tickets_category counter`
  //генерируем метрики для отображении тикетов в работе
  for (let key in userTickets) {
    if (userTickets[key]) {
      userTicketsGrafana +=
`
helpdeskeddy_tickets_info{status="Новая", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].open}
helpdeskeddy_tickets_info{status="В работе", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].inwork}
helpdeskeddy_tickets_info{status="В ожидании", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].waiting}
helpdeskeddy_tickets_info{status="sla_false", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].sla_false}
helpdeskeddy_tickets_info{status="tickets_end_work", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].tickets_end_work}`;
      userTicketsGrafanaCategory +=
`
helpdeskeddy_tickets_category{category="CloudTips", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudTips}
helpdeskeddy_tickets_category{category="CloudKassir", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudKassir}
helpdeskeddy_tickets_category{category="CloudPayments", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudPayments}
helpdeskeddy_tickets_category{category="Другие обращения", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].otherAppeals}`;
    }
  }
  userTicketsGrafana += `\n`
  userTicketsGrafanaCategory += `\n`
  sendMetricsProm(userTicketsGrafana)
  sendMetricsProm(userTicketsGrafanaCategory)
  ticket_count_1h_user_offGrafana += `
  # TYPE helpdeskeddy_ticket_count_1h_user_off counter
  helpdeskeddy_ticket_count_1h_user_off ${ticket_count_1h_user_off}\n`;
  sendMetricsProm(ticket_count_1h_user_offGrafana)
}

const job1: CronJob = new CronJob('*/1 * * * *', function () {
  let date: DateObject = getDates();
  let curr_date: string = date.today + " " + `${date.curr_hour}`;
  let created_after: string = date.today + " " + "00:00";
  let date_end_work5x2: any = date.today + " " + "15:30";
  let date_end_work2x2: any = date.today + " " + "18:00";
  main();
}, null, true, 'Europe/Moscow');
job1.start();

const job2: CronJob = new CronJob('30 59 * * * *', function() {
  let date: DateObject = getDates();
  let date_previous_hour: string = date.today + " " + `${date}`;
  async function mainactivity(): Promise<void> {
    const users: any[] = await reqHde("users", "&group_list=17,18,19,10,37");
    let owner_list: string = ""
    let tickets_users: any[] = [];
    for (let i = 0; i < users.length; i++) {
      owner_list +=  users[i].id + ","
    }
    const tickets_update_previous_hour: any[] = await reqHde("tickets", `&search=Отдел технической поддержки&status_list=open,v-processe,6&from_date_updated=${date_previous_hour}`); 
    for (let i = 0; i < tickets_update_previous_hour.length; i++) {
      tickets_users.push(tickets_update_previous_hour[i].owner_id)
    }
    let tickets_users_count: Set<any> = new Set(tickets_users);
    let activity_average: number = tickets_users_count.size != 0 ? tickets_update_previous_hour.length/tickets_users_count.size : 0
    userTicketsGrafanaactivity += `
      # TYPE helpdeskeddy_tickets_activity counter
helpdeskeddy_tickets_activity{activity="all"} ${tickets_update_previous_hour.length}
helpdeskeddy_tickets_activity{activity="average"} ${activity_average}\n`;
    sendMetricsProm(userTicketsGrafanaactivity)
  }
}, null, true, 'Europe/Moscow');
job2.start();