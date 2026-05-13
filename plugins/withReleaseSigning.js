const { withAppBuildGradle } = require("@expo/config-plugins");

const RELEASE_SIGNING_CONFIG_BLOCK = `
        if (project.hasProperty('TIWAGOLD_RELEASE_STORE_FILE')) {
            release {
                storeFile file(TIWAGOLD_RELEASE_STORE_FILE)
                storePassword TIWAGOLD_RELEASE_STORE_PASSWORD
                keyAlias TIWAGOLD_RELEASE_KEY_ALIAS
                keyPassword TIWAGOLD_RELEASE_KEY_PASSWORD
            }
        }
`;

const DEBUG_BLOCK_CLOSE = "keyPassword 'android'\n        }";
const DEFAULT_RELEASE_SIGNING_LINE = "signingConfig signingConfigs.debug\n            def enableShrinkResources";
const CONDITIONAL_RELEASE_SIGNING_LINE =
  "signingConfig project.hasProperty('TIWAGOLD_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug\n            def enableShrinkResources";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (src.includes("TIWAGOLD_RELEASE_STORE_FILE")) {
      return cfg;
    }

    if (!src.includes(DEBUG_BLOCK_CLOSE)) {
      throw new Error(
        "withReleaseSigning: could not find debug signing block close marker. " +
          "The android/app/build.gradle template may have changed.",
      );
    }
    src = src.replace(
      DEBUG_BLOCK_CLOSE,
      DEBUG_BLOCK_CLOSE + RELEASE_SIGNING_CONFIG_BLOCK,
    );

    if (!src.includes(DEFAULT_RELEASE_SIGNING_LINE)) {
      throw new Error(
        "withReleaseSigning: could not find default release signingConfig line. " +
          "The android/app/build.gradle template may have changed.",
      );
    }
    src = src.replace(
      DEFAULT_RELEASE_SIGNING_LINE,
      CONDITIONAL_RELEASE_SIGNING_LINE,
    );

    cfg.modResults.contents = src;
    return cfg;
  });
};
