const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "Konnesor: force fmt-compatible pods to C++17 for Xcode 26";

const PATCH = `    # ${MARKER}
    installer.pods_project.targets.each do |target|
      if ['fmt', 'RCT-Folly'].include?(target.name)
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

function patchPodfile(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const postInstall = /post_install do \|installer\|\r?\n/;
  if (postInstall.test(contents)) {
    return contents.replace(postInstall, (match) => `${match}${PATCH}`);
  }

  return `${contents}

post_install do |installer|
${PATCH}end
`;
}

module.exports = function withFmtCxx17(config) {
  return withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, "Podfile");
      const contents = fs.readFileSync(podfilePath, "utf8");
      fs.writeFileSync(podfilePath, patchPodfile(contents));
      return modConfig;
    },
  ]);
};

module.exports.patchPodfile = patchPodfile;
