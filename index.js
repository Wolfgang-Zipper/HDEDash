import { CronJob } from 'cron';
import fetch from 'node-fetch';
global.Headers = fetch.Headers;


var job = new CronJob('*/1 * * * *', function () {

let url = "https://omni.cp.ru/"
const token = "==";
let userTickets = {};
let userTicketsGrafana = "";

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

  const users = await reqHde("users", "&group_list=17,18,19,10,37");


  let owner_list = ""


  for (let i = 0; i < users.length; i++) {

    owner_list +=  users[i].id + ","
    let hde_user_status;

    switch (users[i].user_status) {
      case "online":
        hde_user_status = '🟢';
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

    userTickets[users[i].id] =
    {
      name: `${users[i].name} ${users[i].lastname}`,
      user_status: hde_user_status,
      ticketCount: 0,
      open: 0,
      inwork: 0,
      waiting: 0,
      cloudTips: 0,
      cloudKassir: 0,
      cloudPayments: 0,
      otherAppeals: 0
    }
  }

  const tickets = await reqHde("tickets", `&status_list=open,v-processe,6&owner_list=${owner_list}`);



  for (let i = 0; i < tickets.length; i++) {
    for ( let key1 in tickets[i].custom_fields) {
    if (tickets[i].custom_fields[key1] && tickets[i].custom_fields[key1].id===20) {

      for ( let key2 in tickets[i].custom_fields[key1].field_value) {

        switch (tickets[i].custom_fields[key1].field_value[key2].id) {
          
          case 209:
            // console.log( tickets[i])
            // console.log( userTickets[tickets[i].owner_id])
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


 
  userTicketsGrafana += `
# TYPE hde_tickets_info counter`

  //генерируем метрики для отображении тикетов в работе
  for (let key in userTickets) {

    if (userTickets[key]) {
      userTicketsGrafana +=
`
helpdeskeddy_tickets_info{status="Новая", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].open}
helpdeskeddy_tickets_info{status="В работе", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].inwork}
helpdeskeddy_tickets_info{status="В ожидании", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].waiting}
helpdeskeddy_tickets_info{category="CloudTips", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudTips}
helpdeskeddy_tickets_info{category="CloudKassir", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudKassir}
helpdeskeddy_tickets_info{category="CloudPayments", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].cloudPayments}
helpdeskeddy_tickets_info{category="Другие обращения", id="${userTickets[key].name}", online="${userTickets[key].user_status}"} ${userTickets[key].otherAppeals}`;

    }

  }

  userTicketsGrafana += `\n`
  console.log(userTicketsGrafana)

  var requestOptions = {
    method: 'POST',
    body: userTicketsGrafana
  };
  fetch("http://dn-adm-ent-prom-01.node.dtln-nord-ent.consul:9091/metrics/job/hde_ticket_job/instance/dn-app-ent-support-01", requestOptions)
    .then(response => response.text())
    .catch(error => console.log('error', error));

}

main();


}, null, true, 'Europe/Moscow');
job.start();


