#pragma once

#include <napi.h>
#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#include <map>

NSArray* getUuidArray(const Napi::Value& value);
NSArray* getCBUuidArray(const Napi::Value& value);
BOOL getBool(const Napi::Value& value, BOOL def);
NSArray* napiToCBUuidArray(Napi::Array array);
CBUUID* napiToCBUuidString(Napi::String string);
NSArray<CBMutableService *> *napiArrayToCBMutableServices(Napi::Array array);
CBMutableService *napiToCBMutableService(Napi::Object obj);
NSArray<CBMutableCharacteristic *> *napiArrayToCBMutableCharacteristics(Napi::Array array);
CBMutableCharacteristic *napiToCBMutableCharacteristic(Napi::Object obj);
CBCharacteristicProperties napiToCBCharacteristicProperties(Napi::Array properties, Napi::Array secure);
CBAttributePermissions napiToCBAttributePermissions(Napi::Array properties, Napi::Array secure);
NSArray<CBDescriptor *> *napiArrayToCBDescriptors(Napi::Array array);
CBDescriptor *napiToCBDescriptor(Napi::Object obj);
NSArray<NSString *> *napiToStringArray(Napi::Array array);

std::map<Napi::String, Napi::Object> napiArrayToUUIDEmitters(Napi::Array services);

NSString *napiToString(Napi::String string);
NSString* napiToUuidString(Napi::String string);
NSArray* napiToUuidArray(Napi::Array array);
NSData* napiToData(Napi::Buffer<Byte> buffer);
NSNumber* napiToNumber(Napi::Number number);
NSArray<NSString *> *napiToStringArray(Napi::Array array);
