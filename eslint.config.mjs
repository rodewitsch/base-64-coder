import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"], languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.serviceworker,
        copyToClipboard: true,
        pasteFromClipboard: true,
        getBase64: true,
        base64UrlEncode: true,
        base64UrlDecode: true,
        isJWT: true,
        isBase64: true,
        isJSON: true,
        saveAs: true,
        parseJwt: true,
        getDataUrlSize: true,
        initI18n: true,
        setLanguage: true,
        _getMessage: true,
        trimQuotes: true,
        autoDetectEncoding: true,
        decodeBase64WithEncoding: true,
        prettyJSON: true,
        minifyJSON: true,
      }, sourceType: "script"
    }
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
];