//
//  ble_peripheral_manager.h
//  bleno-mac-native
//
//  Created by Georg Vienna on 28.08.18.
//

#pragma once

#import <CoreBluetooth/CoreBluetooth.h>

#import "callbacks.h"

#import <map>

@interface BLEPeripheralManager : NSObject {
    @public Emit emit;
    @public std::map<CBUUID *, EmitCharacteristic> emitters;
}

- (nonnull instancetype)init NS_DESIGNATED_INITIALIZER;

- (void)start;
- (void)startAdvertising:(nonnull NSString *)name serviceUUIDs:(nonnull NSArray<CBUUID *> *)serviceUUIDs;
- (void)startAdvertisingIBeacon:(NSData *)data;
- (void)startAdvertisingWithEIRData:(NSData *)data;
- (void)stopAdvertising;
- (void)setServices:(nonnull NSArray<CBMutableService *> *)services;
- (void)disconnect;
- (void)updateRssi;

@end
