import { CronJob } from 'cron';
import fetch from 'node-fetch';



var job = new CronJob('*/1 * * * *', function() {



    let url = ""
    const token = "";

    
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
        "previous_hour": `${fixNum(d.getHours())}:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`,
        "previous_minute": `${fixNum(d.getHours())}:${fixNum(d.getMinutes() - 1)}:${fixNum(d.getSeconds())}`,
        "current_date": `${fixNum(d.getHours())}:${fixNum(d.getMinutes())}:${fixNum(d.getSeconds())}`
    
      }
      return dates;
    }
    
    function fixNum(num) {
      let number = (num < 10) ? `0${num}` : num;
      return number;
    };
    let date = getDates();
    let date_previous_min = date.today + " " + `${date.previous_minute}`;
    
    async function mainactivity() {
    
      const tickets_update_previous_min = await reqHde("tickets", `&search=Отдел технической поддержки&from_date_updated=${date_previous_min}&owner_list=30245&status_list=open,v-processe`); //запрос на полученин тикетов
       
     
      
      for (let i = 0; i < tickets_update_previous_min.length; i++) {
        let chargeBack = false;
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
        if(!chargeBack) {
    
            // Исходная строка с датой и временем
    var dateString = tickets_update_previous_min[i].sla_date;
    
    // Разделите строку по пробелу, чтобы получить отдельно дату и время
    var parts = dateString.split(' ');
    
    // Разделите дату по точкам, чтобы получить отдельно день, месяц и год
    var dateParts = parts[0].split('.');
    var day = parseInt(dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1; // Месяцы в JavaScript начинаются с 0
    var year = parseInt(dateParts[2], 10);
    
    // Разделите время по двоеточию, чтобы получить отдельно часы и минуты
    var timeParts = parts[1].split(':');
    var hours = parseInt(timeParts[0], 10);
    var minutes = parseInt(timeParts[1], 10);
    
    // Создайте новый объект Date, используя полученные значения
    var sla_date = new Date(year, month, day, hours, minutes);
    
    
            let current_date = new Date();
            let sla = (sla_date - current_date)
    
            // Вычисляем разницу между датами в миллисекундах 
            var difference = sla_date.getTime() - current_date.getTime();
           // Проверьте, если разница отрицательна (т.е. целевая дата уже прошла)
    if (difference < 0) {
        console.log('Целевая дата уже прошла.');
      } else {
        // Разделите разницу на соответствующие единицы времени
        var days = Math.floor(difference / (1000 * 60 * 60 * 24));
        difference -= days * (1000 * 60 * 60 * 24);
      
        var hours = Math.floor(difference / (1000 * 60 * 60));
        difference -= hours * (1000 * 60 * 60);
      
        var minutes = Math.floor(difference / (1000 * 60));
        difference -= minutes * (1000 * 60);
      
        var seconds = Math.floor(difference / 1000);
      
        // Выведите оставшееся время
      }
            fetch(encodeURI(`https://api.telegram.org/__:__/sendMessage?chat_id=__&text= 
    Тикет: https://__/ru/ticket/list/filter/id/1/ticket/${tickets_update_previous_min[i].id}
    
    Клиент: ${tickets_update_previous_min[i].user_name } ${tickets_update_previous_min[i].user_lastname }
    
    Тема: ${tickets_update_previous_min[i].title}
    
    SLA: ${days + ' д ' + hours + ' ч ' + minutes + ' м ' + seconds + ' с '} `))
                                .then(res => res.text())
                                .catch(error => console.log('error', error));
            
         
        }
    
    
    
    
    
    
    
    
    }
    }
    
    mainactivity(reqHde)
              
}, null, true, 'Europe/Moscow');
job.start();

              
          
           



       
           












