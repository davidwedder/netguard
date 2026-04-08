
#define BLYNK_TEMPLATE_ID "TMPLF6s_03Lz"
#define BLYNK_DEVICE_NAME "David House"
#define BLYNK_AUTH_TOKEN "AjA3irKeEr3r9W5BYg5GrqhJ61wXHEY1"

#define DHTTYPE DHT11   
#define DHTPIN 4
#define BLYNK_PRINT Serial 
#include "DHT.h"
#include "WiFi.h"
#include "WiFiClient.h"
#include "BlynkSimpleEsp32.h"

DHT dht(DHTPIN, DHTTYPE);

char auth[] = BLYNK_AUTH_TOKEN;

char ssid[] = "David";
char pass[] = "david1735";

int rele1 = 15;
int rele2 = 5;
int rele3 = 18;
int rele4 = 19;


void sendSensor(){  
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Blynk.virtualWrite(V6,h);
  Blynk.virtualWrite(V7,t);
  delay(2000);
}


BLYNK_WRITE(V0){
  int value = param.asInt();
  digitalWrite(rele1,value);
}

BLYNK_WRITE(V1){
  int value = param.asInt();
  digitalWrite(rele2,value);
}

BLYNK_WRITE(V2){
  int value = param.asInt();
  digitalWrite(rele3,value);
}

BLYNK_WRITE(V3){
  int value = param.asInt();
  digitalWrite(rele4,value);
}



void setup() {
 Serial.begin(115200);
 Serial.println(F("DHTxx test!"));
 dht.begin();
 pinMode(rele1,OUTPUT);
 pinMode(rele2,OUTPUT);
 pinMode(rele3,OUTPUT);
 pinMode(rele4,OUTPUT);

 Blynk.begin(auth,ssid,pass);
 
 
 
}

void loop() {
  Blynk.run();
  sendSensor();  
}
