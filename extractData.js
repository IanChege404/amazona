"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var data_js_1 = require("./lib/data.js");
var OUTPUT_DIR = './static-data';
if (!fs_1.default.existsSync(OUTPUT_DIR)) {
    fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("\uD83D\uDCC1 Created ".concat(OUTPUT_DIR));
}
// Debug: Check what we're actually getting
console.log('\n🔍 Data Debug:');
console.log("  Users: ".concat((_a = data_js_1.default.users) === null || _a === void 0 ? void 0 : _a.length));
console.log("  Products: ".concat((_b = data_js_1.default.products) === null || _b === void 0 ? void 0 : _b.length));
console.log("  Reviews: ".concat((_c = data_js_1.default.reviews) === null || _c === void 0 ? void 0 : _c.length));
console.log("  Pages: ".concat((_d = data_js_1.default.webPages) === null || _d === void 0 ? void 0 : _d.length));
console.log("  Carousels: ".concat((_e = data_js_1.default.carousels) === null || _e === void 0 ? void 0 : _e.length));
console.log("  Menus: ".concat((_f = data_js_1.default.headerMenus) === null || _f === void 0 ? void 0 : _f.length));
console.log("  Settings: ".concat((_g = data_js_1.default.settings) === null || _g === void 0 ? void 0 : _g.length));
var collections = {
    users: data_js_1.default.users,
    products: data_js_1.default.products,
    reviews: data_js_1.default.reviews,
    pages: data_js_1.default.webPages,
    carousels: data_js_1.default.carousels,
    menus: data_js_1.default.headerMenus,
    settings: data_js_1.default.settings,
};
var totalRecords = 0;
for (var _i = 0, _q = Object.entries(collections); _i < _q.length; _i++) {
    var _r = _q[_i], name_1 = _r[0], items = _r[1];
    if (items && (Array.isArray(items) || typeof items === 'object')) {
        var filePath = path_1.default.join(OUTPUT_DIR, "".concat(name_1, ".json"));
        fs_1.default.writeFileSync(filePath, JSON.stringify(items, null, 2));
        var count = Array.isArray(items) ? items.length : 1;
        totalRecords += count;
        console.log("\u2705 ".concat(name_1, ".json (").concat(count, " records)"));
    }
    else {
        console.warn("\u26A0\uFE0F ".concat(name_1, " not found or empty"));
    }
}
var completePath = path_1.default.join(OUTPUT_DIR, 'all-data.json');
fs_1.default.writeFileSync(completePath, JSON.stringify(data_js_1.default, null, 2));
console.log("\u2705 all-data.json (complete export)");
var summary = {
    exportDate: new Date().toISOString(),
    totalRecords: totalRecords,
    collections: {
        users: ((_h = data_js_1.default.users) === null || _h === void 0 ? void 0 : _h.length) || 0,
        products: ((_j = data_js_1.default.products) === null || _j === void 0 ? void 0 : _j.length) || 0,
        reviews: ((_k = data_js_1.default.reviews) === null || _k === void 0 ? void 0 : _k.length) || 0,
        pages: ((_l = data_js_1.default.webPages) === null || _l === void 0 ? void 0 : _l.length) || 0,
        carousels: ((_m = data_js_1.default.carousels) === null || _m === void 0 ? void 0 : _m.length) || 0,
        menus: ((_o = data_js_1.default.headerMenus) === null || _o === void 0 ? void 0 : _o.length) || 0,
        settings: ((_p = data_js_1.default.settings) === null || _p === void 0 ? void 0 : _p.length) || 0,
    },
    location: OUTPUT_DIR,
    files: Object.keys(collections).map(function (name) { return "".concat(name, ".json"); }),
};
fs_1.default.writeFileSync(path_1.default.join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log("\n\u2728 Done! All data saved to: ".concat(OUTPUT_DIR));
console.log(JSON.stringify(summary, null, 2));
