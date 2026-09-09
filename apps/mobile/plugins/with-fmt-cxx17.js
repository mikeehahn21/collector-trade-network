const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "Konnesor: force fmt pod away from Xcode 26 consteval path";

const PATCH = `    # ${MARKER}
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_CONSTEVAL=0'

          flags = config.build_settings['OTHER_CPLUSPLUSFLAGS']
          if flags.is_a?(Array)
            config.build_settings['OTHER_CPLUSPLUSFLAGS'] = flags.reject { |flag| flag.to_s.start_with?('-std=') }
          elsif flags.is_a?(String)
            config.build_settings['OTHER_CPLUSPLUSFLAGS'] = flags.split.reject { |flag| flag.start_with?('-std=') }
          end
        end
      end
    end
`;

function findPostInstallEnd(contents, postInstallStart) {
  const lines = contents.slice(postInstallStart).split(/\r?\n/);
  let depth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/#.*$/, "");
    const opens = line.match(/\b(do|if|unless|case|begin|def|class|module)\b/g)?.length ?? 0;
    const closes = line.match(/^\s*end\b/g)?.length ?? 0;
    depth += opens;
    depth -= closes;

    if (depth === 0 && index > 0) {
      const before = lines.slice(0, index).join("\n");
      return postInstallStart + before.length + (before.length > 0 ? 1 : 0);
    }
  }

  return -1;
}

function patchPodfile(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const postInstall = /post_install do \|installer\|/;
  const postInstallMatch = postInstall.exec(contents);
  if (postInstallMatch?.index !== undefined) {
    const patchIndex = findPostInstallEnd(contents, postInstallMatch.index);
    if (patchIndex !== -1) {
      return `${contents.slice(0, patchIndex)}${PATCH}${contents.slice(patchIndex)}`;
    }
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
module.exports.findPostInstallEnd = findPostInstallEnd;
