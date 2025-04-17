/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./src/contexts/AppContext.tsx":
/*!*************************************!*\
  !*** ./src/contexts/AppContext.tsx ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AppProvider: () => (/* binding */ AppProvider),\n/* harmony export */   useAppContext: () => (/* binding */ useAppContext)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst initialState = {};\nfunction appReducer(state, action) {\n    switch(action.type){\n        case 'SET_USER':\n            return {\n                ...state,\n                user: action.payload\n            };\n        case 'UPDATE_ASSESSMENT_ID':\n            return {\n                ...state,\n                user: state.user ? {\n                    ...state.user,\n                    assessmentId: action.payload\n                } : undefined\n            };\n        case 'SET_EXTRACTED_INFO':\n            return {\n                ...state,\n                extractedInfo: action.payload\n            };\n        default:\n            return state;\n    }\n}\nconst AppContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)({\n    state: initialState,\n    dispatch: ()=>undefined\n});\nconst AppProvider = ({ children })=>{\n    const [state, dispatch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useReducer)(appReducer, initialState);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AppContext.Provider, {\n        value: {\n            state,\n            dispatch\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"/Users/seanking/Projects/tradewizard_4.1/src/contexts/AppContext.tsx\",\n        lineNumber: 43,\n        columnNumber: 5\n    }, undefined);\n};\nconst useAppContext = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AppContext);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9jb250ZXh0cy9BcHBDb250ZXh0LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTBGO0FBYzFGLE1BQU1JLGVBQXlCLENBQUM7QUFPaEMsU0FBU0MsV0FBV0MsS0FBZSxFQUFFQyxNQUFjO0lBQ2pELE9BQVFBLE9BQU9DLElBQUk7UUFDakIsS0FBSztZQUNILE9BQU87Z0JBQUUsR0FBR0YsS0FBSztnQkFBRUcsTUFBTUYsT0FBT0csT0FBTztZQUFDO1FBQzFDLEtBQUs7WUFDSCxPQUFPO2dCQUFFLEdBQUdKLEtBQUs7Z0JBQUVHLE1BQU1ILE1BQU1HLElBQUksR0FBRztvQkFBRSxHQUFHSCxNQUFNRyxJQUFJO29CQUFFRSxjQUFjSixPQUFPRyxPQUFPO2dCQUFDLElBQUlFO1lBQVU7UUFDcEcsS0FBSztZQUNILE9BQU87Z0JBQUUsR0FBR04sS0FBSztnQkFBRU8sZUFBZU4sT0FBT0csT0FBTztZQUFDO1FBQ25EO1lBQ0UsT0FBT0o7SUFDWDtBQUNGO0FBRUEsTUFBTVEsMkJBQWFiLG9EQUFhQSxDQUc3QjtJQUFFSyxPQUFPRjtJQUFjVyxVQUFVLElBQU1IO0FBQVU7QUFFN0MsTUFBTUksY0FBYyxDQUFDLEVBQUVDLFFBQVEsRUFBMkI7SUFDL0QsTUFBTSxDQUFDWCxPQUFPUyxTQUFTLEdBQUdiLGlEQUFVQSxDQUFDRyxZQUFZRDtJQUNqRCxxQkFDRSw4REFBQ1UsV0FBV0ksUUFBUTtRQUFDQyxPQUFPO1lBQUViO1lBQU9TO1FBQVM7a0JBQzNDRTs7Ozs7O0FBR1AsRUFBRTtBQUVLLE1BQU1HLGdCQUFnQixJQUFNakIsaURBQVVBLENBQUNXLFlBQVkiLCJzb3VyY2VzIjpbIi9Vc2Vycy9zZWFua2luZy9Qcm9qZWN0cy90cmFkZXdpemFyZF80LjEvc3JjL2NvbnRleHRzL0FwcENvbnRleHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBjcmVhdGVDb250ZXh0LCB1c2VSZWR1Y2VyLCB1c2VDb250ZXh0LCBSZWFjdE5vZGUsIERpc3BhdGNoIH0gZnJvbSAncmVhY3QnO1xuXG4vLyBFeGFtcGxlIGdsb2JhbCBzdGF0ZSB0eXBlXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YXRlIHtcbiAgdXNlcj86IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW1haWw6IHN0cmluZztcbiAgICB1cmw6IHN0cmluZztcbiAgICBhc3Nlc3NtZW50SWQ/OiBzdHJpbmc7XG4gIH07XG4gIGV4dHJhY3RlZEluZm8/OiBhbnk7XG4gIC8vIEFkZCBtb3JlIGdsb2JhbCBzdGF0ZSBmaWVsZHMgYXMgbmVlZGVkXG59XG5cbmNvbnN0IGluaXRpYWxTdGF0ZTogQXBwU3RhdGUgPSB7fTtcblxudHlwZSBBY3Rpb24gPVxuICB8IHsgdHlwZTogJ1NFVF9VU0VSJzsgcGF5bG9hZDogeyBuYW1lOiBzdHJpbmc7IGVtYWlsOiBzdHJpbmc7IHVybDogc3RyaW5nOyBhc3Nlc3NtZW50SWQ/OiBzdHJpbmcgfSB9XG4gIHwgeyB0eXBlOiAnVVBEQVRFX0FTU0VTU01FTlRfSUQnOyBwYXlsb2FkOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ1NFVF9FWFRSQUNURURfSU5GTyc7IHBheWxvYWQ6IGFueSB9O1xuXG5mdW5jdGlvbiBhcHBSZWR1Y2VyKHN0YXRlOiBBcHBTdGF0ZSwgYWN0aW9uOiBBY3Rpb24pOiBBcHBTdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdTRVRfVVNFUic6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdXNlcjogYWN0aW9uLnBheWxvYWQgfTtcbiAgICBjYXNlICdVUERBVEVfQVNTRVNTTUVOVF9JRCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdXNlcjogc3RhdGUudXNlciA/IHsgLi4uc3RhdGUudXNlciwgYXNzZXNzbWVudElkOiBhY3Rpb24ucGF5bG9hZCB9IDogdW5kZWZpbmVkIH07XG4gICAgY2FzZSAnU0VUX0VYVFJBQ1RFRF9JTkZPJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBleHRyYWN0ZWRJbmZvOiBhY3Rpb24ucGF5bG9hZCB9O1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuY29uc3QgQXBwQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8e1xuICBzdGF0ZTogQXBwU3RhdGU7XG4gIGRpc3BhdGNoOiBEaXNwYXRjaDxBY3Rpb24+O1xufT4oeyBzdGF0ZTogaW5pdGlhbFN0YXRlLCBkaXNwYXRjaDogKCkgPT4gdW5kZWZpbmVkIH0pO1xuXG5leHBvcnQgY29uc3QgQXBwUHJvdmlkZXIgPSAoeyBjaGlsZHJlbiB9OiB7IGNoaWxkcmVuOiBSZWFjdE5vZGUgfSkgPT4ge1xuICBjb25zdCBbc3RhdGUsIGRpc3BhdGNoXSA9IHVzZVJlZHVjZXIoYXBwUmVkdWNlciwgaW5pdGlhbFN0YXRlKTtcbiAgcmV0dXJuIChcbiAgICA8QXBwQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyBzdGF0ZSwgZGlzcGF0Y2ggfX0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9BcHBDb250ZXh0LlByb3ZpZGVyPlxuICApO1xufTtcblxuZXhwb3J0IGNvbnN0IHVzZUFwcENvbnRleHQgPSAoKSA9PiB1c2VDb250ZXh0KEFwcENvbnRleHQpO1xuIl0sIm5hbWVzIjpbIlJlYWN0IiwiY3JlYXRlQ29udGV4dCIsInVzZVJlZHVjZXIiLCJ1c2VDb250ZXh0IiwiaW5pdGlhbFN0YXRlIiwiYXBwUmVkdWNlciIsInN0YXRlIiwiYWN0aW9uIiwidHlwZSIsInVzZXIiLCJwYXlsb2FkIiwiYXNzZXNzbWVudElkIiwidW5kZWZpbmVkIiwiZXh0cmFjdGVkSW5mbyIsIkFwcENvbnRleHQiLCJkaXNwYXRjaCIsIkFwcFByb3ZpZGVyIiwiY2hpbGRyZW4iLCJQcm92aWRlciIsInZhbHVlIiwidXNlQXBwQ29udGV4dCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/contexts/AppContext.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _contexts_AppContext__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../contexts/AppContext */ \"(pages-dir-node)/./src/contexts/AppContext.tsx\");\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_contexts_AppContext__WEBPACK_IMPORTED_MODULE_3__.AppProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/Users/seanking/Projects/tradewizard_4.1/src/pages/_app.tsx\",\n            lineNumber: 9,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/seanking/Projects/tradewizard_4.1/src/pages/_app.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBMEI7QUFDSztBQUVzQjtBQUVyRCxTQUFTRSxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFZO0lBQy9DLHFCQUNFLDhEQUFDSCw2REFBV0E7a0JBQ1YsNEVBQUNFO1lBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7QUFHOUI7QUFFQSxpRUFBZUYsS0FBS0EsRUFBQyIsInNvdXJjZXMiOlsiL1VzZXJzL3NlYW5raW5nL1Byb2plY3RzL3RyYWRld2l6YXJkXzQuMS9zcmMvcGFnZXMvX2FwcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tICduZXh0L2FwcCc7XG5pbXBvcnQgeyBBcHBQcm92aWRlciB9IGZyb20gJy4uL2NvbnRleHRzL0FwcENvbnRleHQnO1xuXG5mdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPEFwcFByb3ZpZGVyPlxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxuICAgIDwvQXBwUHJvdmlkZXI+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15QXBwO1xuIl0sIm5hbWVzIjpbIlJlYWN0IiwiQXBwUHJvdmlkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_app.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(pages-dir-node)/./src/pages/_app.tsx"));
module.exports = __webpack_exports__;

})();