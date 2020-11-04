//
//  callbacks.cc
//  bleno-mac-native
//
//  Created by Georg Vienna on 30.08.18.
//
#include "callbacks.h"

#include <napi-thread-safe-callback.hpp>

#include "napi_objc.h"

#define _s(val) Napi::String::New(env, val)
#define _b(val) Napi::Boolean::New(env, val)
#define _n(val) Napi::Number::New(env, val)
#define _u(str) toUuid(env, str)

Napi::Buffer<uint8_t> toBufferFromNSData(Napi::Env& env, const NSData *nsdata) {
    auto data = Data();
    const UInt8* bytes = (UInt8 *)[nsdata bytes];
    data.assign(bytes, bytes + [nsdata length]);
    return toBuffer(env, data);
}

Napi::Buffer<uint8_t> toBuffer(Napi::Env& env, const Data& data) {
    if (data.empty()) {
        return Napi::Buffer<uint8_t>::New(env, 0);
    }
    return Napi::Buffer<uint8_t>::Copy(env, &data[0], data.size());
}

void Emit::Wrap(const Napi::Value& receiver, const Napi::Function& callback) {
    mCallback = std::make_shared<ThreadSafeCallback>(receiver, callback);
}

void Emit::AdvertisingStart() {
    mCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
        // emit('advertisingStart', error)
        args = { _s("advertisingStart") };
    });
}

void Emit::ServicesSet() {
    mCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
        // emit('servicesSet',  this._setServicesError)
        args = { _s("servicesSet") };
    });
}

void Emit::StateChange(const std::string& state) {
    mCallback->call([state](Napi::Env env, std::vector<napi_value>& args) {
        // emit('stateChange', state);
        args = { _s("stateChange"), _s(state) };
    });
}

void EmitCharacteristic::Wrap(const Napi::Value& receiver, const Napi::Function& callback) {
    mCallback = std::make_shared<ThreadSafeCallback>(receiver, callback);
}

void EmitCharacteristic::ReadRequest(int offset, std::function<void (int, NSData *)> completion) {
    mCallback->call([offset, completion](Napi::Env env, std::vector<napi_value>& args) {
        // callback(result, data)
        auto callable = [completion](const Napi::CallbackInfo& info){
            completion(info[0].As<Napi::Number>().Int32Value(),
                       napiToData(info[1].As<Napi::Buffer<Byte>>()));
        };
        Napi::Function cb = Napi::Function::New(env, callable);

        // emit('readRequest', offset, callback);
        args = { _s("readRequest"), _n(offset), cb };
    });
}

void EmitCharacteristic::WriteRequest(NSData *data, int offset, bool ignoreResponse, std::function<void (int)> completion) {
    mCallback->call([data, offset, ignoreResponse, completion](Napi::Env env, std::vector<napi_value>& args) {
        // callback(result)
        auto callable = [completion](const Napi::CallbackInfo& info){
            completion(info[0].As<Napi::Number>().Int32Value());
        };
        Napi::Function cb = Napi::Function::New(env, callable);

        // emit('writeRequest', data, offset, ignoreResponse, callback)
        args = { _s("writeRequest"), toBufferFromNSData(env, data), _n(offset), _b(ignoreResponse), cb };
    });
}

void EmitCharacteristic::Subscribe(int maxValueSize, std::function<void (NSData *)> completion) {
    mCallback->call([maxValueSize, completion](Napi::Env env, std::vector<napi_value>& args) {
        // callback(data)
        auto callable = [completion](const Napi::CallbackInfo& info){
            completion(napiToData(info[0].As<Napi::Buffer<Byte>>()));
        };
        Napi::Function cb = Napi::Function::New(env, callable);

        // emit('subscribe', maxValueSize, callback)
        args = { _s("subscribe"), _n(maxValueSize), cb };
    });
}

void EmitCharacteristic::Unsubscribe() {
    mCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
        // emit('unsubscribe')
        args = { _s("unsubscribe") };
    });
}

void EmitCharacteristic::Notify() {
    mCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
        // emit('notify')
        args = { _s("notify") };
    });
}

void EmitCharacteristic::Indicate() {
    mCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
        // emit('indicate')
        args = { _s("indicate") };
    });
}


// emit('notify');
// emit('indicate');
