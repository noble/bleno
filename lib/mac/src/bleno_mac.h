#pragma once

#include <napi.h>

#include "ble_peripheral_manager.h"

class BlenoMac : public Napi::ObjectWrap<BlenoMac>
{
public:
    BlenoMac(const Napi::CallbackInfo&);
    Napi::Value Init(const Napi::CallbackInfo&);
    Napi::Value CleanUp(const Napi::CallbackInfo&);

    Napi::Value StartAdvertising(const Napi::CallbackInfo&);
    Napi::Value StartAdvertisingIBeacon(const Napi::CallbackInfo&);
    Napi::Value StartAdvertisingWithEIRData(const Napi::CallbackInfo&);
    Napi::Value StopAdvertising(const Napi::CallbackInfo&);
    Napi::Value SetServices(const Napi::CallbackInfo&);
    Napi::Value Disconnect(const Napi::CallbackInfo&);
    Napi::Value UpdateRssi(const Napi::CallbackInfo&);

    static Napi::Function GetClass(Napi::Env);

private:
    BLEPeripheralManager *peripheralManager;
};
