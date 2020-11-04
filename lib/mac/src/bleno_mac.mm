//
//  bleno_mac.mm
//  bleno-mac-native
//
//  Created by Georg Vienna on 28.08.18.
//
#include "bleno_mac.h"

#include "napi_objc.h"

#define THROW(msg) \
Napi::TypeError::New(info.Env(), msg).ThrowAsJavaScriptException(); \
return Napi::Value();

#define ARG1(type1) \
if (!info[0].Is##type1()) { \
    THROW("There should be one argument: (" #type1 ")") \
}

#define ARG2(type1, type2) \
if (!info[0].Is##type1() || !info[1].Is##type2()) { \
    THROW("There should be 2 arguments: (" #type1 ", " #type2 ")"); \
}

#define ARG3(type1, type2, type3) \
if (!info[0].Is##type1() || !info[1].Is##type2() || !info[2].Is##type3()) { \
    THROW("There should be 3 arguments: (" #type1 ", " #type2 ", " #type3 ")"); \
}

#define ARG4(type1, type2, type3, type4) \
if (!info[0].Is##type1() || !info[1].Is##type2() || !info[2].Is##type3() || !info[3].Is##type4()) { \
    THROW("There should be 4 arguments: (" #type1 ", " #type2 ", " #type3 ", " #type4 ")"); \
}

#define ARG5(type1, type2, type3, type4, type5) \
if (!info[0].Is##type1() || !info[1].Is##type2() || !info[2].Is##type3() || !info[3].Is##type4() || !info[4].Is##type5()) { \
    THROW("There should be 5 arguments: (" #type1 ", " #type2 ", " #type3 ", " #type4 ", " #type5 ")"); \
}

#define CHECK_MANAGER() \
if(!peripheralManager) { \
    THROW("BLEManager has already been cleaned up"); \
}

BlenoMac::BlenoMac(const Napi::CallbackInfo& info) : ObjectWrap(info) {
}

Napi::Value BlenoMac::Init(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::Init");

    Napi::Function emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    peripheralManager = [BLEPeripheralManager new];
    peripheralManager->emit.Wrap(info.This(), emit);
    [peripheralManager start];
    return Napi::Value();
}

Napi::Value BlenoMac::CleanUp(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    CFRelease((__bridge CFTypeRef)peripheralManager);
    peripheralManager = nil;
    return Napi::Value();
}

// startAdvertising(name, undashedServiceUuids)
Napi::Value BlenoMac::StartAdvertising(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::StartAdvertising");

    CHECK_MANAGER();
    ARG2(String, Array);

    auto name = napiToString(info[0].As<Napi::String>());
    NSArray *array = getCBUuidArray(info[1]);

    [peripheralManager startAdvertising:name
                           serviceUUIDs:array];

    return Napi::Value();
}

// startAdvertisingIBeacon(iBeaconData)
Napi::Value BlenoMac::StartAdvertisingIBeacon(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::StartAdvertisingIBeacon");

    return Napi::Value();
}

// startAdvertisingWithEIRData(advertisementData, scanData)
Napi::Value BlenoMac::StartAdvertisingWithEIRData(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::StartAdvertisingWithEIRData");

    return Napi::Value();
}

// stopAdvertising()
Napi::Value BlenoMac::StopAdvertising(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::StopAdvertising");

    return Napi::Value();
}

// setServices(services)
Napi::Value BlenoMac::SetServices(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::SetServices");

    CHECK_MANAGER();
    ARG1(Array);

    auto array = info[0].As<Napi::Array>();

    NSArray<CBMutableService *> *services = napiArrayToCBMutableServices(array);
    [peripheralManager setServices:services];

    auto pairs = napiArrayToUUIDEmitters(array);
    std::map<CBUUID *, EmitCharacteristic> emitters;
    for (auto const& x : pairs) {
        EmitCharacteristic emit = EmitCharacteristic();

        auto obj = x.second;
        auto fn = obj.Get("emit").As<Napi::Function>();
        emit.Wrap(obj, fn);

        CBUUID *uuid = [CBUUID UUIDWithString:napiToUuidString(x.first)];
        emitters[uuid] = emit;
    }

    peripheralManager->emitters = emitters;

    return Napi::Value();
}

// disconnect()
Napi::Value BlenoMac::Disconnect(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::Disconnect");

    return Napi::Value();
}

// updateRssi()
Napi::Value BlenoMac::UpdateRssi(const Napi::CallbackInfo& info) {
    NSLog(@"BlenoMac::UpdateRssi");

    return Napi::Value();
}

Napi::Function BlenoMac::GetClass(Napi::Env env) {
    return DefineClass(env, "BlenoMac", {
        BlenoMac::InstanceMethod("init", &BlenoMac::Init),
        BlenoMac::InstanceMethod("cleanUp", &BlenoMac::CleanUp),

        BlenoMac::InstanceMethod("startAdvertising", &BlenoMac::StartAdvertising),
        BlenoMac::InstanceMethod("startAdvertisingIBeacon", &BlenoMac::StartAdvertisingIBeacon),
        BlenoMac::InstanceMethod("startAdvertisingWithEIRData", &BlenoMac::StartAdvertisingWithEIRData),
        BlenoMac::InstanceMethod("stopAdvertising", &BlenoMac::StopAdvertising),
        BlenoMac::InstanceMethod("setServices", &BlenoMac::SetServices),
        BlenoMac::InstanceMethod("disconnect", &BlenoMac::Disconnect),
        BlenoMac::InstanceMethod("updateRssi", &BlenoMac::UpdateRssi),
   });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::String name = Napi::String::New(env, "BlenoMac");
    exports.Set(name, BlenoMac::GetClass(env));
    return exports;
}

NODE_API_MODULE(addon, Init)
