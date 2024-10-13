import {
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  PlatformConfig,
  StaticPlatformPlugin,
} from "homebridge";
import { MacOSControlAccessory } from "./mac-accessory";

const PLATFORM_NAME = "MacOsTvRemoteControlPlatform";

let hap: HAP;

export = (api: API) => {
  hap = api.hap;

  api.registerPlatform(PLATFORM_NAME, MacOsTvRemoteControlPlatform);
};

class MacOsTvRemoteControlPlatform implements StaticPlatformPlugin {
  private readonly log: Logging;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;

    // TODO parse config

    log.info(`${PLATFORM_NAME} platform finished initializing!`);
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([new MacOSControlAccessory(hap, this.log)]);
  }
}
