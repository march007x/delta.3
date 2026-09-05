#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <MPU6050_tockn.h>
#include <addons/RTDBHelper.h>

// ==========================================================
// ตั้งค่า (แก้ไขส่วนนี้ให้เป็นของโปรเจกต์ใหม่)
// ==========================================================
#define WIFI_SSID "ID-DIN Design_2.4G"
#define WIFI_PASSWORD "19051978"
#define FIREBASE_URL "https://smartvibee-22adf-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define DATABASE_SECRET "xklHJU9JVwMXWDlrk10AVjulJ7OUkIXDhZeA80VE" // <--- เอามาจาก Service Accounts > Database Secrets

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ตัวแปรเซ็นเซอร์
MPU6050 mpu1(Wire); MPU6050 mpu2(Wire); MPU6050 mpu3(Wire);

void tcaselect(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(0x70);
  Wire.write(1 << channel);
  Wire.endTransmission();
}

// ควบคุมจังหวะ (50Hz)
unsigned long lastSampleTime = 0;
const int sampleInterval = 20; 
FirebaseJson batchJson;
int sampleCount = 0;
const int batchSize = 10;

void setup() {
  Serial.begin(115200);
  Wire.begin(32, 33);

  // ตั้งค่าเซ็นเซอร์
  tcaselect(0); mpu1.begin(); mpu1.calcGyroOffsets(true);
  tcaselect(1); mpu2.begin(); mpu2.calcGyroOffsets(true);
  tcaselect(2); mpu3.begin(); mpu3.calcGyroOffsets(true);

  // เชื่อมต่อ WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\n✅ WiFi Connected!");

  // ตั้งค่า Firebase (Legacy Token)
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("✅ Firebase Ready!");
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastSampleTime >= sampleInterval) {
    lastSampleTime = currentTime;

    // อ่านค่า MPU ทั้ง 3
    float data[3][3]; 
    for (int i = 0; i < 3; i++) {
      tcaselect(i);
      if (i == 0) { mpu1.update(); data[0][0]=mpu1.getAccX(); data[0][1]=mpu1.getAccY(); data[0][2]=mpu1.getAccZ(); }
      else if (i == 1) { mpu2.update(); data[1][0]=mpu2.getAccX(); data[1][1]=mpu2.getAccY(); data[1][2]=mpu2.getAccZ(); }
      else if (i == 2) { mpu3.update(); data[2][0]=mpu3.getAccX(); data[2][1]=mpu3.getAccY(); data[2][2]=mpu3.getAccZ(); }
    }

    // รวมข้อมูล
    FirebaseJson record;
    for (int i = 0; i < 3; i++) {
      record.set("X" + String(i), data[i][0]);
      record.set("Y" + String(i), data[i][1]);
      record.set("Z" + String(i), data[i][2]);
    }

    batchJson.set(String(currentTime), record);
    sampleCount++;

    // ส่งเมื่อครบ 10 ชุด
    if (sampleCount >= batchSize) {
      if (Firebase.RTDB.updateNode(&fbdo, "/SmartVibe/History3F", &batchJson)) {
        Serial.println("🚀 Sent!");
      } else {
        Serial.println("❌ Error: " + fbdo.errorReason());
      }
      batchJson.clear();
      sampleCount = 0;
    }
  }
}