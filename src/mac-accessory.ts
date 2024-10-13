import {
  AccessoryPlugin,
  Logging,
  Service,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
} from "homebridge";
import robot from "robotjs";

type KeyName = "up" | "down" | "left" | "right" | "enter" | "escape" | "space";

const MOUSE_MOVE_DELTA = 25;
const SWITCH_MOUSE_KEY = 15;
const KEYS_MAP: Record<number, KeyName> = {
  4: "up",
  5: "down",
  6: "left",
  7: "right",
  8: "enter",
  9: "escape",
  11: "space",
};

export class MacOSControlAccessory implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly name: string;
  private readonly informationService: Service;
  private readonly tvService: Service;
  private readonly speakerService: Service;
  private readonly inputServices: Service[] = [];

  private isMouseControl = false;

  constructor(hap: HAP, log: Logging) {
    this.log = log;
    this.name = "MacOS Controller";

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom")
      .setCharacteristic(hap.Characteristic.Model, "MacOS Remote Control")
      .setCharacteristic(hap.Characteristic.SerialNumber, "123-456-787");

    this.tvService = new hap.Service.Television(this.name, "Television")
      .setCharacteristic(hap.Characteristic.ConfiguredName, this.name)
      .setCharacteristic(
        hap.Characteristic.SleepDiscoveryMode,
        hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

    this.tvService
      .getCharacteristic(hap.Characteristic.Active)
      .on("set", this.handlePower.bind(this));

    this.tvService
      .getCharacteristic(hap.Characteristic.RemoteKey)
      .on("set", this.handleRemoteKey.bind(this));

    this.speakerService = new hap.Service.TelevisionSpeaker(
      `${this.name} Speaker`
    ).setCharacteristic(
      hap.Characteristic.VolumeControlType,
      hap.Characteristic.VolumeControlType.RELATIVE
    );

    this.tvService.addLinkedService(this.speakerService);

    this.createInputSource(hap, "Arrow Left", "left", 1);
    this.createInputSource(hap, "Arrow Right", "right", 2);
    this.createInputSource(hap, "Arrow Up", "up", 3);
    this.createInputSource(hap, "Arrow Down", "down", 4);
    this.createInputSource(hap, "Enter", "enter", 5);
    this.createInputSource(hap, "Escape", "escape", 6);
    this.createInputSource(hap, "Space", "space", 7);
    this.createInputSource(hap, "Cmd+Tab", "cmdTab", 8);
  }

  getServices(): Service[] {
    return [this.informationService, this.tvService];
  }

  private createInputSource(hap: HAP, name: string, key: string, id: number) {
    const inputSource = new hap.Service.InputSource(name, `InputSource${key}`);
    inputSource
      .setCharacteristic(hap.Characteristic.Identifier, id)
      .setCharacteristic(hap.Characteristic.ConfiguredName, name)
      .setCharacteristic(
        hap.Characteristic.IsConfigured,
        hap.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        hap.Characteristic.InputSourceType,
        hap.Characteristic.InputSourceType.OTHER
      );

    inputSource.getCharacteristic(hap.Characteristic.ConfiguredName);
    this.tvService.addLinkedService(inputSource);
    this.inputServices.push(inputSource);
  }

  private handleRemoteKey(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback
  ) {
    const keys = Object.keys(KEYS_MAP).map((key) => parseInt(key, 10));
    const valueNum = parseInt(`${value}`, 10);
    if (keys.includes(valueNum)) {
      this.pressKey(KEYS_MAP[valueNum]);
    } else if (valueNum === SWITCH_MOUSE_KEY) {
      this.switchMouseControl();
      // this.pressCmdTab();
    } else {
      this.log(`Unhandled remote key: ${value}`);
    }
    callback(null);
  }

  private handlePower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback
  ) {
    this.log(`Power state set to: ${value}`);
    callback(null);
  }

  private pressKey(key: KeyName) {
    this.log(`Pressing ${key} key`);
    if (
      this.isMouseControl &&
      ["up", "down", "left", "right", "enter"].includes(key)
    ) {
      this.handleMouse(key);
    } else {
      robot.keyTap(key);
    }
  }

  private handleMouse(key: KeyName) {
    let deltaX = 0;
    let deltaY = 0;

    switch (key) {
      case "up":
        deltaY = -MOUSE_MOVE_DELTA;
        break;
      case "down":
        deltaY = MOUSE_MOVE_DELTA;
        break;
      case "left":
        deltaX = -MOUSE_MOVE_DELTA;
        break;
      case "right":
        deltaX = MOUSE_MOVE_DELTA;
        break;
      case "enter":
        robot.mouseClick();
        break;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      robot.moveMouseSmooth(
        robot.getMousePos().x + deltaX,
        robot.getMousePos().y + deltaY
      );
    }
  }

  private pressCmdTab() {
    this.log(`Pressing Cmd+Tab combination`);
    robot.keyToggle("command", "down");
    robot.keyTap("tab");
    robot.keyToggle("command", "up");
  }

  private switchMouseControl() {
    this.isMouseControl = !this.isMouseControl;
  }
}
