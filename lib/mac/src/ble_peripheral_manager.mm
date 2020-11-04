//
//  ble_peripheral_manager.mm
//  bleno-mac-native
//
//  Created by Georg Vienna on 28.08.18.
//
#include "ble_peripheral_manager.h"

#include <dispatch/dispatch.h>

#include "objc_cpp.h"

@interface BLEPeripheralManager () <CBPeripheralManagerDelegate>

@property (nonatomic, strong) __attribute__((NSObject)) dispatch_queue_t queue;
@property (nonatomic, strong) CBPeripheralManager *peripheralManager;

@end

@implementation BLEPeripheralManager

- (instancetype)init {
    if (self = [super init]) {
        NSLog(@"-[BLEPeripheralManager init]");

        self.queue = dispatch_queue_create("CBqueue", 0);
    }
    return self;
}

#pragma mark - API

- (void)start {
    self.peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self
                                                                    queue:self.queue];
}

- (void)startAdvertising:(nonnull NSString *)name serviceUUIDs:(nonnull NSArray<CBUUID *> *)serviceUUIDs {
    NSLog(@"startAdvertising:%@ serviceUUIDs:%@", name, serviceUUIDs);
    if (self.peripheralManager.isAdvertising) {
        return;
    }

    [self.peripheralManager startAdvertising:@{
                                               CBAdvertisementDataLocalNameKey: name,
                                               CBAdvertisementDataServiceUUIDsKey: serviceUUIDs,
                                               }];
}

- (void)startAdvertisingIBeacon:(NSData *)data {
    NSLog(@"startAdvertisingIBeacon:%@", data);
}

- (void)startAdvertisingWithEIRData:(NSData *)data {
    NSLog(@"startAdvertisingWithEIRData:%@", data);

    if (self.peripheralManager.isAdvertising) {
        return;
    }
}

- (void)stopAdvertising {
    NSLog(@"stopAdvertising");

    [self.peripheralManager stopAdvertising];
}

- (void)setServices:(NSArray<CBMutableService *> *)services {
    for (CBMutableService *service in services) {
        [self.peripheralManager addService:service];
    }
}

- (void)disconnect {
    NSLog(@"disconnect");

    // throw new Error('disconnect is not supported on OS X!');
}

- (void)updateRssi {
    NSLog(@"updateRssi");
}

#pragma mark - CBPeripheralManagerDelegate

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral {
    NSString *string = @"Unknown state";

    switch(peripheral.state) {
        case CBManagerStatePoweredOff:
            string = @"CoreBluetooth BLE hardware is powered off.";
            break;

        case CBManagerStatePoweredOn:
            string = @"CoreBluetooth BLE hardware is powered on and ready.";
            break;

        case CBManagerStateUnauthorized:
            string = @"CoreBluetooth BLE state is unauthorized.";
            break;

        case CBManagerStateUnknown:
            string = @"CoreBluetooth BLE state is unknown.";
            break;

        case CBManagerStateUnsupported:
            string = @"CoreBluetooth BLE hardware is unsupported on this platform.";
            break;

        default:
            break;
    }

    NSLog(@"%@", string);

    auto state = StringFromCBPeripheralState(peripheral.state);
    emit.StateChange(state);
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral willRestoreState:(NSDictionary<NSString *, id> *)dict {
    NSLog(@"willRestoreState");
}

- (void)peripheralManagerDidStartAdvertising:(CBPeripheralManager *)peripheral error:(nullable NSError *)error {
    NSLog(@"peripheralManagerDidStartAdvertising: %@", peripheral.description);
    if (error) {
        NSLog(@"Error advertising: %@", [error localizedDescription]);
    }

    emit.AdvertisingStart();
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didAddService:(CBService *)service error:(nullable NSError *)error {
    NSLog(@"peripheralManagerDidAddService: %@ %@", service, error);
    if (error) {
        NSLog(@"Error publishing service: %@", [error localizedDescription]);
    }

    emit.ServicesSet();
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral central:(CBCentral *)central didSubscribeToCharacteristic:(CBMutableCharacteristic *)characteristic {
    NSLog(@"didSubscribeToCharacteristic");

    CBUUID *uuid = characteristic.UUID;

    for (auto it = emitters.begin(); it != emitters.end(); ++it) {
        if ([it->first isEqual:uuid]) {
            auto cb = [peripheral, central, characteristic](NSData *data) {
                NSLog(@"subscription note: %@ %@", data, NSStringFromClass(characteristic.class));

                [peripheral updateValue:data
                      forCharacteristic:characteristic
                   onSubscribedCentrals:@[central]];
            };

            it->second.Subscribe(central.maximumUpdateValueLength, cb);

            if ((characteristic.properties & CBCharacteristicPropertyNotify) == CBCharacteristicPropertyNotify) {

            }
        }
    }
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral central:(CBCentral *)central didUnsubscribeFromCharacteristic:(CBCharacteristic *)characteristic {
    NSLog(@"didUnsubscribeFromCharacteristic");

    CBUUID *uuid = characteristic.UUID;

    for (auto it = emitters.begin(); it != emitters.end(); ++it) {
        if ([it->first isEqual:uuid]) {
            it->second.Unsubscribe();
        }
    }
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didReceiveReadRequest:(CBATTRequest *)request {
    NSLog(@"didReceiveReadRequest: %@ %@", request.central, request.characteristic.UUID);

    CBCharacteristic *characteristic = request.characteristic;
    CBUUID *uuid = characteristic.UUID;

    for (auto it = emitters.begin(); it != emitters.end(); ++it) {
        if ([it->first isEqual:uuid]) {
            auto cb = [peripheral, request](int result, NSData *data) {
                request.value = data;

                [peripheral respondToRequest:request
                                  withResult:(CBATTError)result];
            };

            it->second.ReadRequest(request.offset, cb);
        }
    }
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didReceiveWriteRequests:(NSArray<CBATTRequest *> *)requests {
    for (CBATTRequest *request in requests) {
        NSLog(@"didReceiveWriteRequest: %@ %@", request.central, request.characteristic.UUID);

        CBCharacteristic *characteristic = request.characteristic;
        CBUUID *uuid = characteristic.UUID;

        for (auto it = emitters.begin(); it != emitters.end(); ++it) {
            if ([it->first isEqual:uuid]) {
                bool sendResponse = (request.characteristic.properties & CBCharacteristicPropertyWrite) == CBCharacteristicPropertyWrite;

                auto cb = [peripheral, request, sendResponse](int result) {
                    if (sendResponse) {
                        [peripheral respondToRequest:request
                                          withResult:(CBATTError)result];
                    }
                };

                it->second.WriteRequest(request.value,
                                        request.offset,
                                        !sendResponse,
                                        cb);
            }
        }
    }
}

- (void)peripheralManagerIsReadyToUpdateSubscribers:(CBPeripheralManager *)peripheral {
    NSLog(@"peripheralManagerIsReadyToUpdateSubscribers");
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didPublishL2CAPChannel:(CBL2CAPPSM)PSM error:(nullable NSError *)error {
    NSLog(@"didPublishL2CAPChannel");
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didUnpublishL2CAPChannel:(CBL2CAPPSM)PSM error:(nullable NSError *)error {
    NSLog(@"didUnpublishL2CAPChannel");
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didOpenL2CAPChannel:(nullable CBL2CAPChannel *)channel error:(nullable NSError *)error {
    NSLog(@"didOpenL2CAPChannel");
}

@end
