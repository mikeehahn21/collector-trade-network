module.exports = {
  "*.{js,jsx,ts,tsx,mjs,cjs,json,md,yml,yaml}": ["prettier --write"],
  "*.{js,jsx,ts,tsx,mjs,cjs}": ["eslint --fix"]
};
