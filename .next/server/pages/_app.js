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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AppProvider: () => (/* binding */ AppProvider),\n/* harmony export */   useAppContext: () => (/* binding */ useAppContext)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst initialState = {};\nfunction appReducer(state, action) {\n    switch(action.type){\n        case 'SET_USER':\n            return {\n                ...state,\n                user: action.payload\n            };\n        default:\n            return state;\n    }\n}\nconst AppContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)({\n    state: initialState,\n    dispatch: ()=>undefined\n});\nconst AppProvider = ({ children })=>{\n    const [state, dispatch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useReducer)(appReducer, initialState);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AppContext.Provider, {\n        value: {\n            state,\n            dispatch\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"/Users/seanking/Projects/tradewizard_4.1/src/contexts/AppContext.tsx\",\n        lineNumber: 30,\n        columnNumber: 5\n    }, undefined);\n};\nconst useAppContext = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AppContext);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9jb250ZXh0cy9BcHBDb250ZXh0LnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTBGO0FBUTFGLE1BQU1JLGVBQXlCLENBQUM7QUFJaEMsU0FBU0MsV0FBV0MsS0FBZSxFQUFFQyxNQUFjO0lBQ2pELE9BQVFBLE9BQU9DLElBQUk7UUFDakIsS0FBSztZQUNILE9BQU87Z0JBQUUsR0FBR0YsS0FBSztnQkFBRUcsTUFBTUYsT0FBT0csT0FBTztZQUFDO1FBQzFDO1lBQ0UsT0FBT0o7SUFDWDtBQUNGO0FBRUEsTUFBTUssMkJBQWFWLG9EQUFhQSxDQUc3QjtJQUFFSyxPQUFPRjtJQUFjUSxVQUFVLElBQU1DO0FBQVU7QUFFN0MsTUFBTUMsY0FBYyxDQUFDLEVBQUVDLFFBQVEsRUFBMkI7SUFDL0QsTUFBTSxDQUFDVCxPQUFPTSxTQUFTLEdBQUdWLGlEQUFVQSxDQUFDRyxZQUFZRDtJQUNqRCxxQkFDRSw4REFBQ08sV0FBV0ssUUFBUTtRQUFDQyxPQUFPO1lBQUVYO1lBQU9NO1FBQVM7a0JBQzNDRzs7Ozs7O0FBR1AsRUFBRTtBQUVLLE1BQU1HLGdCQUFnQixJQUFNZixpREFBVUEsQ0FBQ1EsWUFBWSIsInNvdXJjZXMiOlsiL1VzZXJzL3NlYW5raW5nL1Byb2plY3RzL3RyYWRld2l6YXJkXzQuMS9zcmMvY29udGV4dHMvQXBwQ29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZVJlZHVjZXIsIHVzZUNvbnRleHQsIFJlYWN0Tm9kZSwgRGlzcGF0Y2ggfSBmcm9tICdyZWFjdCc7XG5cbi8vIEV4YW1wbGUgZ2xvYmFsIHN0YXRlIHR5cGVcbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhdGUge1xuICB1c2VyPzogc3RyaW5nO1xuICAvLyBBZGQgbW9yZSBnbG9iYWwgc3RhdGUgZmllbGRzIGFzIG5lZWRlZFxufVxuXG5jb25zdCBpbml0aWFsU3RhdGU6IEFwcFN0YXRlID0ge307XG5cbnR5cGUgQWN0aW9uID0geyB0eXBlOiAnU0VUX1VTRVInOyBwYXlsb2FkOiBzdHJpbmcgfTtcblxuZnVuY3Rpb24gYXBwUmVkdWNlcihzdGF0ZTogQXBwU3RhdGUsIGFjdGlvbjogQWN0aW9uKTogQXBwU3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnU0VUX1VTRVInOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHVzZXI6IGFjdGlvbi5wYXlsb2FkIH07XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG5jb25zdCBBcHBDb250ZXh0ID0gY3JlYXRlQ29udGV4dDx7XG4gIHN0YXRlOiBBcHBTdGF0ZTtcbiAgZGlzcGF0Y2g6IERpc3BhdGNoPEFjdGlvbj47XG59Pih7IHN0YXRlOiBpbml0aWFsU3RhdGUsIGRpc3BhdGNoOiAoKSA9PiB1bmRlZmluZWQgfSk7XG5cbmV4cG9ydCBjb25zdCBBcHBQcm92aWRlciA9ICh7IGNoaWxkcmVuIH06IHsgY2hpbGRyZW46IFJlYWN0Tm9kZSB9KSA9PiB7XG4gIGNvbnN0IFtzdGF0ZSwgZGlzcGF0Y2hdID0gdXNlUmVkdWNlcihhcHBSZWR1Y2VyLCBpbml0aWFsU3RhdGUpO1xuICByZXR1cm4gKFxuICAgIDxBcHBDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt7IHN0YXRlLCBkaXNwYXRjaCB9fT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L0FwcENvbnRleHQuUHJvdmlkZXI+XG4gICk7XG59O1xuXG5leHBvcnQgY29uc3QgdXNlQXBwQ29udGV4dCA9ICgpID0+IHVzZUNvbnRleHQoQXBwQ29udGV4dCk7XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJjcmVhdGVDb250ZXh0IiwidXNlUmVkdWNlciIsInVzZUNvbnRleHQiLCJpbml0aWFsU3RhdGUiLCJhcHBSZWR1Y2VyIiwic3RhdGUiLCJhY3Rpb24iLCJ0eXBlIiwidXNlciIsInBheWxvYWQiLCJBcHBDb250ZXh0IiwiZGlzcGF0Y2giLCJ1bmRlZmluZWQiLCJBcHBQcm92aWRlciIsImNoaWxkcmVuIiwiUHJvdmlkZXIiLCJ2YWx1ZSIsInVzZUFwcENvbnRleHQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/contexts/AppContext.tsx\n");

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