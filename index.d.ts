export = bleno;
export as namespace bleno;

declare namespace bleno {
  class Characteristic {
      public uuid: any;
      public properties: any;
      public secure: any;
      public value: any;
      public descriptors: any;

      constructor(options: any);
      onIndicate(): void;
      onNotify(): void;
      onReadRequest(offset: any, callback: any): void;
      onSubscribe(maxValueSize: any, updateValueCallback: any): void;
      onUnsubscribe(): void;
      onWriteRequest(data: any, offset: any, withoutResponse: any, callback: any): void;
      toString(): any;
      static RESULT_ATTR_NOT_LONG: number;
      static RESULT_INVALID_ATTRIBUTE_LENGTH: number;
      static RESULT_INVALID_OFFSET: number;
      static RESULT_SUCCESS: number;
      static RESULT_UNLIKELY_ERROR: number;
  }

  class Descriptor {
      public uuid: any;
      public value: any;

      constructor(options: any);
      toString(): any;
  }

  class PrimaryService {
      public uuid: any;
      public characteristics: any;

      constructor(options: any);
      toString(): any;
  }

  let platform: any;
  let state: any;
  let address: any;
  let rssi: number;
  let mtu: number;

  function on(event: string, callback: any): any;
  function startAdvertising(name: string, serviceUuids: any[], callback?: any): any;
  function startAdvertisingIBeacon(uuid: string, major: number, minor: number, measuredPower: number, callback?: any): any;
  function startAdvertisingWithEIRData(advertisementData: any, scanData?: any, callback?: any): any;
  function stopAdvertising(callback?: any);
  function setServices(services: any, callback?: any): any;
  function disconnect(): any;
  function updateRssi(callback?: any): any;
}
