var http = require('http');
var url = require('url');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt')

const MQTT_TOPICS = { // topic: name
    "trollslottet/dock/temperature1_C" :"Badetemperatur",
    "trollslottet/temperature2_C": "Temperatur på terrassen",
    "trollslottet/temperature1_C": "Temperatur inne i hytte",
    "trollslottet/terrace/waterLevel1_L": "Vanntank 1",
    "trollslottet/terrace/waterLevel2_L": "Vanntank 2",
    "trollslottet/SOC": "Batteri",
    "trollslottet/solarPower_W": "Lading",
    "trollslottet/powerConsumptionCalc_W": "Forbruk"
}

var values_from_mqtt = {}
var last_update = {}

// var values_from_mqtt = { // topic: value
//     "trollslottet/dock/temperature1_C" :"",
//     "trollslottet/temperature2_C": "",
//     "trollslottet/terrace/waterLevel1_L": "",
//     "trollslottet/terrace/waterLevel2_L": "",
//     "trollslottet/SOC": "",
//     "trollslottet/solarPower_W": "",
//     "trollslottet/powerConsumptionCalc_W": ""
// }

var units = { // topic: unit
    "trollslottet/dock/temperature1_C" :"℃",
    "trollslottet/temperature2_C": "℃",
    "trollslottet/temperature1_C": "℃",
    "trollslottet/terrace/waterLevel1_L": "L",
    "trollslottet/terrace/waterLevel2_L": "L",
    "trollslottet/SOC": "%",
    "trollslottet/solarPower_W": "W",
    "trollslottet/powerConsumptionCalc_W": "W"
}

function millisecondsToStr (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    var ago = " siden"

    function numberEnding (number) {
        return (number > 1) ? 'er' : '';
    }

    function numberEndingTimer (number) {
        return (number > 1) ? 'r' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' år' + ago;
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' dag' + numberEnding(days) + ago;
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' time' + numberEndingTimer(hours) + ago;
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minutt' + numberEnding(minutes) + ago;
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' sekund' + numberEnding(seconds) + ago;
    }
    return 'akkurat nå'; //'just now' //or other string you like;
}

// --- MQTT init ---

const protocol = 'mqtt'
const host = 'localhost'
const port = '1883'
const clientId = `statuserve_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: '',
    password: '',
    reconnectPeriod: 1000,
  })
  
  client.on('connect', () => {
    console.log(`Connected to ${connectUrl} as ${clientId}`)
    for (const [topic, name] of Object.entries(MQTT_TOPICS)) {
        client.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}': ${name}`)
        })
    }
  })

  client.on('message', (topic, payload) => {
    console.log('Received Message:', topic, payload.toString())
    values_from_mqtt[topic] = payload.toString()
    last_update[topic] = new Date().getTime();
  })


public_dir = path.join(__dirname, 'public')

var SERVER_PORT = 1279



// --- Express init ----

const app = express();
app.use(express.static( path.join(__dirname, '/public')));
app.set('view engine', 'pug')

app.get('/pugtest', (req, res) => {
    res.render('pugtest', { title: 'Hey', message: 'Hello there!' })
  });



app.get('/time', (req, res, next) => {
    // date = strftime('%Y-%m-%ST%H:%M:%SZ', new Date(Date.UTC()));
    date = new Date().toISOString()
    console.log(date);
    res.write(date);
	return res.end('\n');
});


app.get('/status', (req, res, next) => {
    console.log("Shows some values from MQTT")
    var updated = {}
    for (const [topic, value] of Object.entries(values_from_mqtt)) {
        var name = MQTT_TOPICS[topic]
        var unit = units[topic]
        var time_since_update = millisecondsToStr(new Date().getTime() - last_update[topic])
        updated[topic] = time_since_update
        var message = `${name}: ${value} ${unit} updated ${time_since_update} ago`
        // res.write(`${message}\n`);
        console.log(`\t${message}`); 
    }
    // return res.end()
    res.render('status', { "names": MQTT_TOPICS, "values":values_from_mqtt, "units": units, "updated": updated})
});



app.listen(SERVER_PORT);