import {
  API,
  APIEvent,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
} from "homebridge";
import { MacOSControlAccessory } from "./mac-os-control-accessory";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";

export class MacOsTvRemoteControlPlatform {
  private readonly accessories: PlatformAccessory[] = [];
  private readonly platformAccessories: any = [];

  constructor(
    private readonly log: Logging,
    private readonly config: PlatformConfig,
    private readonly api: API
  ) {
    this.log = log;
    this.api = api;

    // TODO parse config

    api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.info(`${PLATFORM_NAME} platform finished initializing!`);

      this.addAccessory("Mac Os Tv Remote");
    });
  }
  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log("Configuring accessory %s", accessory.displayName);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log("%s identified!", accessory.displayName);
    });

    this.accessories.push(accessory);
  }

  addAccessory(name: string) {
    this.log.info("Adding new accessory with name %s", name);

    // uuid must be generated from a unique but not changing data source
    const uuid = this.api.hap.uuid.generate(name);
    const accessory = new this.api.platformAccessory(name, uuid);
    const platformAccessory = new MacOSControlAccessory(
      this.api.hap,
      this.log,
      uuid,
      accessory
    );
    this.platformAccessories.push(platformAccessory);

    this.configureAccessory(accessory);

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      accessory,
    ]);
  }

  removeAccessories() {
    this.log.info("Removing all accessories");

    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.accessories
    );
    this.accessories.splice(0, this.accessories.length);
  }
}
