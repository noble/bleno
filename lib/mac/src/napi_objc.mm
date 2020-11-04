//
//  napi_objc.mm
//  bleno-mac-native
//
//  Created by Georg Vienna on 30.08.18.
//
#include "napi_objc.h"

NSString *napiToString(Napi::String string) {
    std::string str = string.Utf8Value();
    return [NSString stringWithUTF8String:str.c_str()];
}

NSString* napiToUuidString(Napi::String string) {
    std::string str = string.Utf8Value();
    NSMutableString * uuid = [[NSMutableString alloc] initWithCString:str.c_str() encoding:NSASCIIStringEncoding];
    if([uuid length] == 32) {
        [uuid insertString: @"-" atIndex: 8];
        [uuid insertString: @"-" atIndex: 13];
        [uuid insertString: @"-" atIndex: 18];
        [uuid insertString: @"-" atIndex: 23];
    }
    return [uuid uppercaseString];
}

NSArray* napiToUuidArray(Napi::Array array) {
    NSMutableArray* serviceUuids = [NSMutableArray arrayWithCapacity:array.Length()];
    for(size_t i = 0;  i < array.Length(); i++) {
        Napi::Value val = array[i];
        [serviceUuids addObject:napiToUuidString(val.As<Napi::String>())];
    }
    return serviceUuids;
}

NSData* napiToData(Napi::Buffer<Byte> buffer) {
    return [NSData dataWithBytes:buffer.Data() length:buffer.Length()];
}

NSNumber* napiToNumber(Napi::Number number) {
    return [NSNumber numberWithInt:number.Int64Value()];
}

NSArray<CBMutableService *> *napiArrayToCBMutableServices(Napi::Array array) {
    NSLog(@"napiArrayToCBMutableServices");

    NSMutableArray *services = [NSMutableArray array];

    for (size_t i = 0;  i < array.Length(); i++) {
        Napi::Value v = array[i];
        Napi::Object obj = v.As<Napi::Object>();

        [services addObject:napiToCBMutableService(obj)];
    }

    return [services copy];
}

CBMutableService *napiToCBMutableService(Napi::Object obj) {
    NSLog(@"napiToCBMutableService");

    NSString *uuid = napiToUuidString(obj.Get("uuid").ToString());

    NSLog(@"napiArrayToCBMutableService: uuid:%@", uuid);

    CBMutableService *service = [[CBMutableService alloc] initWithType:[CBUUID UUIDWithString:uuid]
                                                               primary:YES];

    service.characteristics = napiArrayToCBMutableCharacteristics(obj.Get("characteristics").As<Napi::Array>());

    return service;
}



NSArray<CBMutableCharacteristic *> *napiArrayToCBMutableCharacteristics(Napi::Array array) {
    NSLog(@"napiArrayToCBMutableCharacteristics");

    NSMutableArray *characteristics = [NSMutableArray array];

    for (size_t i = 0; i < array.Length(); i++) {
        Napi::Value v = array[i];
        Napi::Object obj = v.As<Napi::Object>();

        [characteristics addObject:napiToCBMutableCharacteristic(obj)];
    }

    return [characteristics copy];
}

CBMutableCharacteristic *napiToCBMutableCharacteristic(Napi::Object obj) {
    NSLog(@"napiToCBMutableCharacteristic");

    NSString *uuid = napiToUuidString(obj.Get("uuid").ToString());
    NSLog(@"napiToCBMutableCharacteristic: cUUID:%@", uuid);

    NSData *value = obj.Get("value").IsBuffer() ? napiToData(obj.Get("value").As<Napi::Buffer<Byte>>()) : nil;
    NSLog(@"napiToCBMutableCharacteristic: value:%@", value);

    auto properties = obj.Get("properties").As<Napi::Array>();
    auto secure = obj.Get("secure").As<Napi::Array>();

    auto descriptors = obj.Get("descriptors").As<Napi::Array>();

    CBMutableCharacteristic *characteristic = [[CBMutableCharacteristic alloc] initWithType:[CBUUID UUIDWithString:uuid]
                                                                                 properties:napiToCBCharacteristicProperties(properties, secure)
                                                                                      value:value
                                                                                permissions:napiToCBAttributePermissions(properties, secure)];

    characteristic.descriptors = napiArrayToCBDescriptors(descriptors);

    return characteristic;
}

CBCharacteristicProperties napiToCBCharacteristicProperties(Napi::Array properties, Napi::Array secure) {
    NSLog(@"napiToCBCharacteristicProperties");

    NSArray<NSString *> *p = napiToStringArray(properties);
    NSArray<NSString *> *s = napiToStringArray(secure);

    CBCharacteristicProperties ret = 0;

    if ([p containsObject:@"read"]) {
        ret |= CBCharacteristicPropertyRead;
    }

    if ([p containsObject:@"write"]) {
        ret |= CBCharacteristicPropertyWrite;
    }

    if ([p containsObject:@"writeWithoutResponse"]) {
        ret |= CBCharacteristicPropertyWriteWithoutResponse;
    }

    if ([p containsObject:@"notify"]) {
        if ([s containsObject:@"notify"]) {
            ret |= CBCharacteristicPropertyNotifyEncryptionRequired;
        } else {
            ret |= CBCharacteristicPropertyNotify;
        }
    }

    if ([p containsObject:@"indicate"]) {
        if ([s containsObject:@"indicate"]) {
            ret |= CBCharacteristicPropertyIndicateEncryptionRequired;
        } else {
            ret |= CBCharacteristicPropertyIndicate;
        }
    }

    return ret;
}

CBAttributePermissions napiToCBAttributePermissions(Napi::Array properties, Napi::Array secure) {
    NSLog(@"napiToCBAttributePermissions");

    NSArray<NSString *> *p = napiToStringArray(properties);
    NSArray<NSString *> *s = napiToStringArray(secure);

    CBAttributePermissions ret = 0;

    if ([p containsObject:@"read"]) {
        if ([s containsObject:@"read"]) {
            ret |= CBAttributePermissionsReadEncryptionRequired;
        } else {
            ret |= CBAttributePermissionsReadable;
        }
    }

    if ([p containsObject:@"write"]) {
        if ([s containsObject:@"write"]) {
            ret |= CBAttributePermissionsWriteEncryptionRequired;
        } else {
            ret |= CBAttributePermissionsWriteable;
        }
    }

    if ([p containsObject:@"writeWithoutResponse"]) {
        if ([s containsObject:@"writeWithoutResponse"]) {
            ret |= CBAttributePermissionsWriteEncryptionRequired;
        } else {
            ret |= CBAttributePermissionsWriteable;
        }
    }

    return ret;
}

NSArray<CBDescriptor *> *napiArrayToCBDescriptors(Napi::Array array) {
    NSLog(@"napiArrayToCBDescriptors");

    NSMutableArray *descriptors = [NSMutableArray array];

    for (size_t i = 0; i < array.Length(); i++) {
        Napi::Value v = array[i];
        Napi::Object obj = v.As<Napi::Object>();

        [descriptors addObject:napiToCBDescriptor(obj)];
    }

    return [descriptors copy];
}

CBDescriptor *napiToCBDescriptor(Napi::Object obj) {
    NSString *uuid = napiToUuidString(obj.Get("uuid").ToString());
    NSString *value = napiToString(obj.Get("value").ToString());

    NSLog(@"napiToCBDescriptor uuid:%@ value:%@", uuid, value);

    return [[CBMutableDescriptor alloc] initWithType:[CBUUID UUIDWithString:uuid]
                                               value:value];
}

NSArray<NSString *> *napiToStringArray(Napi::Array array) {
    NSMutableArray *ret = [NSMutableArray arrayWithCapacity:array.Length()];

    for (size_t i = 0; i < array.Length(); i++) {
        Napi::Value v = array[i];
        Napi::String str = v.ToString();

        [ret addObject:napiToString(str)];
    }

    return [ret copy];
}

std::map<Napi::String, Napi::Object> napiArrayToUUIDEmitters(Napi::Array services) {
    NSLog(@"napiArrayToUUIDEmitters");

    std::map<Napi::String, Napi::Object> map;

    for (size_t i = 0;  i < services.Length(); i++) {
        Napi::Value vS = services[i];
        Napi::Object objS = vS.As<Napi::Object>();

        Napi::String uuidS = objS.Get("uuid").ToString();

        map[uuidS] = objS;

        Napi::Array characteristics = objS.Get("characteristics").As<Napi::Array>();
        for (size_t j = 0;  j < characteristics.Length(); j++) {
            Napi::Value vC = characteristics[j];
            Napi::Object objC = vC.As<Napi::Object>();

            Napi::String uuidC = objC.Get("uuid").ToString();

            map[uuidC] = objC;
        }
    }

    return map;
}

NSArray* getUuidArray(const Napi::Value& value) {
    if (value.IsArray()) {
        return napiToUuidArray(value.As<Napi::Array>());
    }
    return nil;
}

BOOL getBool(const Napi::Value& value, BOOL def) {
    if (value.IsBoolean()) {
        return value.As<Napi::Boolean>().Value();
    }
    return def;
}

NSArray* napiToCBUuidArray(Napi::Array array) {
    NSMutableArray* serviceUuids = [NSMutableArray arrayWithCapacity:array.Length()];
    for(size_t i = 0;  i < array.Length(); i++) {
        Napi::Value val = array[i];
        [serviceUuids addObject:napiToCBUuidString(val.As<Napi::String>())];
    }
    return serviceUuids;
}

CBUUID* napiToCBUuidString(Napi::String string) {
    NSString* uuidString = napiToUuidString(string);
    return [CBUUID UUIDWithString:uuidString];
}

NSArray* getCBUuidArray(const Napi::Value& value) {
    if (value.IsArray()) {
        return napiToCBUuidArray(value.As<Napi::Array>());
    }
    return nil;
}
