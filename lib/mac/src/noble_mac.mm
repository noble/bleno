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
if(!manager) { \
    THROW("BLEManager has already been cleaned up"); \
}

BlenoMac::BlenoMac(const Napi::CallbackInfo& info) : ObjectWrap(info) {
}

Napi::Value BlenoMac::Init(const Napi::CallbackInfo& info) {
    Napi::Function emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    manager = [[BLEManager alloc] init];
    manager->emit.Wrap(info.This(), emit);
    return Napi::Value();
}

// startScanning(serviceUuids, allowDuplicates)
Napi::Value BlenoMac::Scan(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    NSArray* array = getUuidArray(info[0]);
    // default value NO
    auto duplicates = getBool(info[1], NO);
    [manager scan:array allowDuplicates:duplicates];
    return Napi::Value();
}

// stopScanning()
Napi::Value BlenoMac::StopScan(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    [manager stopScan];
    return Napi::Value();
}

// connect(deviceUuid)
Napi::Value BlenoMac::Connect(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG1(String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    [manager connect:uuid];
    return Napi::Value();
}

// disconnect(deviceUuid)
Napi::Value BlenoMac::Disconnect(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG1(String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    [manager disconnect:uuid];
    return Napi::Value();
}

// updateRssi(deviceUuid)
Napi::Value BlenoMac::UpdateRSSI(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG1(String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    [manager updateRSSI:uuid];
    return Napi::Value();
}

// discoverServices(deviceUuid, uuids)
Napi::Value BlenoMac::DiscoverServices(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG1(String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    NSArray* array = getUuidArray(info[1]);
    [manager discoverServices:uuid serviceUuids:array];
    return Napi::Value();
}

// discoverIncludedServices(deviceUuid, serviceUuid, serviceUuids)
Napi::Value BlenoMac::DiscoverIncludedServices(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG2(String, String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    NSArray* serviceUuids = getUuidArray(info[2]);
    [manager discoverIncludedServices:uuid forService:service services:serviceUuids];
    return Napi::Value();
}

// discoverCharacteristics(deviceUuid, serviceUuid, characteristicUuids)
Napi::Value BlenoMac::DiscoverCharacteristics(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG2(String, String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    NSArray* characteristics = getUuidArray(info[2]);
    [manager discoverCharacteristics:uuid forService:service characteristics:characteristics];
    return Napi::Value();
}

// read(deviceUuid, serviceUuid, characteristicUuid)
Napi::Value BlenoMac::Read(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG3(String, String, String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    [manager read:uuid service:service characteristic:characteristic];
    return Napi::Value();
}

// write(deviceUuid, serviceUuid, characteristicUuid, data, withoutResponse)
Napi::Value BlenoMac::Write(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG5(String, String, String, Buffer, Boolean)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    auto data = napiToData(info[3].As<Napi::Buffer<Byte>>());
    auto withoutResponse = info[4].As<Napi::Boolean>().Value();
    [manager write:uuid service:service characteristic:characteristic data:data withoutResponse:withoutResponse];
    return Napi::Value();
}

// notify(deviceUuid, serviceUuid, characteristicUuid, notify)
Napi::Value BlenoMac::Notify(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG4(String, String, String, Boolean)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    auto on = info[3].As<Napi::Boolean>().Value();
    [manager notify:uuid service:service characteristic:characteristic on:on];
    return Napi::Value();
}

// discoverDescriptors(deviceUuid, serviceUuid, characteristicUuid)
Napi::Value BlenoMac::DiscoverDescriptors(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG3(String, String, String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    [manager discoverDescriptors:uuid service:service characteristic:characteristic];
    return Napi::Value();
}

// readValue(deviceUuid, serviceUuid, characteristicUuid, descriptorUuid)
Napi::Value BlenoMac::ReadValue(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG4(String, String, String, String)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    auto descriptor = napiToUuidString(info[3].As<Napi::String>());
    [manager readValue:uuid service:service characteristic:characteristic descriptor:descriptor];
    return Napi::Value();
}

// writeValue(deviceUuid, serviceUuid, characteristicUuid, descriptorUuid, data)
Napi::Value BlenoMac::WriteValue(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG5(String, String, String, String, Buffer)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto service = napiToUuidString(info[1].As<Napi::String>());
    auto characteristic = napiToUuidString(info[2].As<Napi::String>());
    auto descriptor = napiToUuidString(info[3].As<Napi::String>());
    auto data = napiToData(info[4].As<Napi::Buffer<Byte>>());
    [manager writeValue:uuid service:service characteristic:characteristic descriptor:descriptor data: data];
    return Napi::Value();
}

// readHandle(deviceUuid, handle)
Napi::Value BlenoMac::ReadHandle(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG2(String, Number)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto handle = napiToNumber(info[1].As<Napi::Number>());
    [manager readHandle:uuid handle:handle];
    return Napi::Value();
}

// writeHandle(deviceUuid, handle, data, (unused)withoutResponse)
Napi::Value BlenoMac::WriteHandle(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    ARG3(String, Number, Buffer)
    auto uuid = napiToUuidString(info[0].As<Napi::String>());
    auto handle = napiToNumber(info[1].As<Napi::Number>());
    auto data = napiToData(info[2].As<Napi::Buffer<Byte>>());
    [manager writeHandle:uuid handle:handle data: data];
    return Napi::Value();
}

Napi::Value BlenoMac::CleanUp(const Napi::CallbackInfo& info) {
    CHECK_MANAGER()
    CFRelease((__bridge CFTypeRef)manager);
    manager = nil;
    return Napi::Value();
}

Napi::Function BlenoMac::GetClass(Napi::Env env) {
    return DefineClass(env, "BlenoMac", {
        BlenoMac::InstanceMethod("init", &BlenoMac::Init),
        BlenoMac::InstanceMethod("startScanning", &BlenoMac::Scan),
        BlenoMac::InstanceMethod("stopScanning", &BlenoMac::StopScan),
        BlenoMac::InstanceMethod("connect", &BlenoMac::Connect),
        BlenoMac::InstanceMethod("disconnect", &BlenoMac::Disconnect),
        BlenoMac::InstanceMethod("updateRssi", &BlenoMac::UpdateRSSI),
        BlenoMac::InstanceMethod("discoverServices", &BlenoMac::DiscoverServices),
        BlenoMac::InstanceMethod("discoverIncludedServices", &BlenoMac::DiscoverIncludedServices),
        BlenoMac::InstanceMethod("discoverCharacteristics", &BlenoMac::DiscoverCharacteristics),
        BlenoMac::InstanceMethod("read", &BlenoMac::Read),
        BlenoMac::InstanceMethod("write", &BlenoMac::Write),
        BlenoMac::InstanceMethod("notify", &BlenoMac::Notify),
        BlenoMac::InstanceMethod("discoverDescriptors", &BlenoMac::DiscoverDescriptors),
        BlenoMac::InstanceMethod("readValue", &BlenoMac::ReadValue),
        BlenoMac::InstanceMethod("writeValue", &BlenoMac::WriteValue),
        BlenoMac::InstanceMethod("readHandle", &BlenoMac::ReadValue),
        BlenoMac::InstanceMethod("writeHandle", &BlenoMac::WriteValue),
        BlenoMac::InstanceMethod("cleanUp", &BlenoMac::CleanUp),
    });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::String name = Napi::String::New(env, "BlenoMac");
    exports.Set(name, BlenoMac::GetClass(env));
    return exports;
}

NODE_API_MODULE(addon, Init)
