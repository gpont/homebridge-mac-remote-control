import {
  AccessoryPlugin,
  Service,
  CharacteristicSetCallback,
  CharacteristicValue,
  PlatformAccessory,
} from "homebridge";
import robot from "robotjs";
import type { MacOsTvRemoteControlPlatform } from "./mac-os-tv-remote-control-platform";

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
  private readonly name = "MacOS Controller";
  private readonly tvService: Service;
  private readonly speakerService: Service;
  private readonly inputServices: Service[] = [];

  private isMouseControl = false;

  constructor(
    private readonly platform: MacOsTvRemoteControlPlatform,
    private readonly accessory: PlatformAccessory
  ) {
    this.accessory
      .getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.api.hap.Characteristic.Manufacturer,
        "Custom"
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.Model,
        "MacOS Remote Control"
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.SerialNumber,
        "123-456-123"
      );

    this.accessory.category = this.platform.api.hap.Categories.TELEVISION;

    this.tvService = this.accessory.addService(
      this.platform.api.hap.Service.Television,
      this.name
    );
    this.tvService.setCharacteristic(
      this.platform.api.hap.Characteristic.ConfiguredName,
      this.name
    );
    this.tvService.setCharacteristic(
      this.platform.api.hap.Characteristic.SleepDiscoveryMode,
      this.platform.api.hap.Characteristic.SleepDiscoveryMode
        .ALWAYS_DISCOVERABLE
    );

    this.tvService
      .getCharacteristic(this.platform.api.hap.Characteristic.Active)
      .on("set", this.handlePower.bind(this));

    this.tvService
      .getCharacteristic(this.platform.api.hap.Characteristic.RemoteKey)
      .on("set", this.handleRemoteKey.bind(this));

    this.speakerService = this.accessory.addService(
      this.platform.api.hap.Service.TelevisionSpeaker,
      `${this.name} Speaker`,
      `${this.name} Speaker`
    );
    this.speakerService.setCharacteristic(
      this.platform.api.hap.Characteristic.VolumeControlType,
      this.platform.api.hap.Characteristic.VolumeControlType.RELATIVE
    );

    this.tvService.addLinkedService(this.speakerService);

    this.createInputSource("Arrow Left", "left", 1);
    this.createInputSource("Arrow Right", "right", 2);
    this.createInputSource("Arrow Up", "up", 3);
    this.createInputSource("Arrow Down", "down", 4);
    this.createInputSource("Enter", "enter", 5);
    this.createInputSource("Escape", "escape", 6);
    this.createInputSource("Space", "space", 7);
    this.createInputSource("Cmd+Tab", "cmdTab", 8);

    // this.getServices().forEach((service) => {
    //   this.log.debug("Adding service", service.displayName, service.subtype);
    //   accessory.addService(service);
    // });
  }

  getServices(): Service[] {
    // return [this.informationService, this.tvService];
    return [this.tvService];
  }

  private createInputSource(name: string, key: string, id: number) {
    const inputSource = new this.platform.api.hap.Service.InputSource(
      name,
      `InputSource${key}`
    );
    inputSource
      .setCharacteristic(this.platform.api.hap.Characteristic.Identifier, id)
      .setCharacteristic(
        this.platform.api.hap.Characteristic.ConfiguredName,
        name
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.IsConfigured,
        this.platform.api.hap.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.InputSourceType,
        this.platform.api.hap.Characteristic.InputSourceType.OTHER
      );

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
      this.platform.log.warn(`Unhandled remote key: ${value}`);
    }
    callback(null);
  }

  private handlePower(
    value: CharacteristicValue,
    callback: CharacteristicSetCallback
  ) {
    this.platform.log.debug(`Power state set to: ${value}`);
    callback(null);
  }

  private pressKey(key: KeyName) {
    this.platform.log.debug(`Pressing ${key} key`);
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
    this.platform.log.debug(`Pressing Cmd+Tab combination`);
    robot.keyToggle("command", "down");
    robot.keyTap("tab");
    robot.keyToggle("command", "up");
  }

  private switchMouseControl() {
    this.isMouseControl = !this.isMouseControl;
  }
}
