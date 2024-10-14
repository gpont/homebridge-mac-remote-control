import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
  UnknownContext,
} from "homebridge";
import { MacOSControlAccessory } from "./mac-os-control-accessory";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";

const ACCESSORY_NAME = "Mac Os Tv Remote";

export class MacOsTvRemoteControlPlatform implements DynamicPlatformPlugin {
  private readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    // TODO parse config

    api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      const uuid = api.hap.uuid.generate(ACCESSORY_NAME);

      const existingAccessory = this.accessories.find(
        (accessory) => accessory.UUID === uuid
      );
      if (existingAccessory) {
        this.addAccessory(existingAccessory, ACCESSORY_NAME);
      } else {
        const accessory = new this.api.platformAccessory(ACCESSORY_NAME, uuid);
        this.addAccessory(accessory, ACCESSORY_NAME);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
      this.log.info(`${PLATFORM_NAME} platform finished initializing!`);
    });
  }
  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.debug("Configuring accessory %s", accessory.displayName);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log.debug("%s identified!", accessory.displayName);
    });

    this.accessories.push(accessory);
  }

  addAccessory(accessory: PlatformAccessory<UnknownContext>, name: string) {
    this.log.debug("Adding new accessory with name %s", name);

    new MacOSControlAccessory(this, accessory);

    this.configureAccessory(accessory);
  }

  removeAccessories() {
    this.log.debug("Removing all accessories");

    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.accessories
    );
    this.accessories.splice(0, this.accessories.length);
  }
}
