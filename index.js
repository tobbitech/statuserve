var http = require('http');
var url = require('url');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mqtt = require('mqtt')

const MQTT_TOPICS = { // topic: name
    "trollslottet/dock/temperature1_C" :"Badetemperatur",
    "trollslottet/temperature2_C": "Temperatur på terrassen",
    "trollslottet/terrace/waterLevel1_L": "Vanntank 1",
    "trollslottet/terrace/waterLevel2_L": "Vanntank 2",
    "trollslottet/SOC": "Batteri",
    "trollslottet/solarPower_W": "Lading",
    "trollslottet/powerConsumptionCalc_W": "Forbruk"
}

var values_from_mqtt = { // topic: value
    "trollslottet/dock/temperature1_C" :"",
    "trollslottet/temperature2_C": "",
    "trollslottet/terrace/waterLevel1_L": "",
    "trollslottet/terrace/waterLevel2_L": "",
    "trollslottet/SOC": "",
    "trollslottet/solarPower_W": "",
    "trollslottet/powerConsumptionCalc_W": ""
}

var units = { // topic: unit
    "trollslottet/dock/temperature1_C" :"℃",
    "trollslottet/temperature2_C": "℃",
    "trollslottet/terrace/waterLevel1_L": "L",
    "trollslottet/terrace/waterLevel2_L": "L",
    "trollslottet/SOC": "%",
    "trollslottet/solarPower_W": "W",
    "trollslottet/powerConsumptionCalc_W": "W"
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
  })


// public_dir = path.join(__dirname, 'public')

var SERVER_PORT = 1279



// --- Express init ----

const app = express();
// app.use(express.static( path.join(__dirname, '/public')));

app.get('/time', (req, res, next) => {
    // date = strftime('%Y-%m-%ST%H:%M:%SZ', new Date(Date.UTC()));
    date = new Date().toISOString()
    console.log(date);
    res.write(date);
	return res.end('\n');
});


app.get('/status', (req, res, next) => {
    console.log("Shows some values from MQTT")
    for (const [topic, value] of Object.entries(values_from_mqtt)) {
        var name = MQTT_TOPICS[topic]
        var unit = units[topic]
        var message = `${name}: ${value} ${unit}`
        res.write(`${message}\n`);
        console.log(`\t${message}`); 
    }
    return res.end()
});



app.listen(SERVER_PORT);