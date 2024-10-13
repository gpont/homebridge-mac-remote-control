import type { API } from "homebridge";

import { MacOsTvRemoteControlPlatform } from "./mac-os-tv-remote-control-platform";
import { PLATFORM_NAME } from "./settings";

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, MacOsTvRemoteControlPlatform);
};
