"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterUrl = exports.formatDateTime = exports.formatError = exports.generateId = exports.round2 = exports.toSlug = exports.formatNumberWithDecimal = void 0;
exports.formUrlQuery = formUrlQuery;
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatNumber = formatNumber;
exports.calculateFutureDate = calculateFutureDate;
exports.getMonthName = getMonthName;
exports.calculatePastDate = calculatePastDate;
exports.timeUntilMidnight = timeUntilMidnight;
exports.formatId = formatId;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
var query_string_1 = require("query-string");
function formUrlQuery(_a) {
    var params = _a.params, key = _a.key, value = _a.value;
    var currentUrl = query_string_1.default.parse(params);
    currentUrl[key] = value;
    return query_string_1.default.stringifyUrl({
        url: window.location.pathname,
        query: currentUrl,
    }, { skipNull: true });
}
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
var formatNumberWithDecimal = function (num) {
    var _a = num.toString().split('.'), int = _a[0], decimal = _a[1];
    return decimal ? "".concat(int, ".").concat(decimal.padEnd(2, '0')) : int;
};
exports.formatNumberWithDecimal = formatNumberWithDecimal;
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word,
// non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens
var toSlug = function (text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
};
exports.toSlug = toSlug;
var CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 2,
});
function formatCurrency(amount) {
    return CURRENCY_FORMATTER.format(amount);
}
var NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
function formatNumber(number) {
    return NUMBER_FORMATTER.format(number);
}
var round2 = function (num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};
exports.round2 = round2;
var generateId = function () {
    return Array.from({ length: 24 }, function () { return Math.floor(Math.random() * 10); }).join('');
};
exports.generateId = generateId;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var formatError = function (error) {
    if (error.name === 'ZodError') {
        var fieldErrors = Object.keys(error.errors).map(function (field) {
            var errorMessage = error.errors[field].message;
            return "".concat(error.errors[field].path, ": ").concat(errorMessage); // field: errorMessage
        });
        return fieldErrors.join('. ');
    }
    else if (error.name === 'ValidationError') {
        var fieldErrors = Object.keys(error.errors).map(function (field) {
            var errorMessage = error.errors[field].message;
            return errorMessage;
        });
        return fieldErrors.join('. ');
    }
    else if (error.code === 11000) {
        var duplicateField = Object.keys(error.keyValue)[0];
        return "".concat(duplicateField, " already exists");
    }
    else {
        // return 'Something went wrong. please try again'
        return typeof error.message === 'string'
            ? error.message
            : JSON.stringify(error.message);
    }
};
exports.formatError = formatError;
function calculateFutureDate(days) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);
    return currentDate;
}
function getMonthName(yearMonth) {
    var _a = yearMonth.split('-').map(Number), year = _a[0], month = _a[1];
    var date = new Date(year, month - 1);
    var monthName = date.toLocaleString('default', { month: 'long' });
    var now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
        return "".concat(monthName, " Ongoing");
    }
    return monthName;
}
function calculatePastDate(days) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - days);
    return currentDate;
}
function timeUntilMidnight() {
    var now = new Date();
    var midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Set to 12:00 AM (next day)
    var diff = midnight.getTime() - now.getTime(); // Difference in milliseconds
    var hours = Math.floor(diff / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours: hours, minutes: minutes };
}
var formatDateTime = function (dateString) {
    var dateTimeOptions = {
        month: 'short', // abbreviated month name (e.g., 'Oct')
        year: 'numeric', // abbreviated month name (e.g., 'Oct')
        day: 'numeric', // numeric day of the month (e.g., '25')
        hour: 'numeric', // numeric hour (e.g., '8')
        minute: 'numeric', // numeric minute (e.g., '30')
        hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    };
    var dateOptions = {
        // weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
        month: 'short', // abbreviated month name (e.g., 'Oct')
        year: 'numeric', // numeric year (e.g., '2023')
        day: 'numeric', // numeric day of the month (e.g., '25')
    };
    var timeOptions = {
        hour: 'numeric', // numeric hour (e.g., '8')
        minute: 'numeric', // numeric minute (e.g., '30')
        hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    };
    var formattedDateTime = new Date(dateString).toLocaleString('en-US', dateTimeOptions);
    var formattedDate = new Date(dateString).toLocaleString('en-US', dateOptions);
    var formattedTime = new Date(dateString).toLocaleString('en-US', timeOptions);
    return {
        dateTime: formattedDateTime,
        dateOnly: formattedDate,
        timeOnly: formattedTime,
    };
};
exports.formatDateTime = formatDateTime;
function formatId(id) {
    return "..".concat(id.substring(id.length - 6));
}
var getFilterUrl = function (_a) {
    var params = _a.params, category = _a.category, tag = _a.tag, sort = _a.sort, price = _a.price, rating = _a.rating, page = _a.page;
    var newParams = __assign({}, params);
    if (category)
        newParams.category = category;
    if (tag)
        newParams.tag = (0, exports.toSlug)(tag);
    if (price)
        newParams.price = price;
    if (rating)
        newParams.rating = rating;
    if (page)
        newParams.page = page;
    if (sort)
        newParams.sort = sort;
    return "/search?".concat(new URLSearchParams(newParams).toString());
};
exports.getFilterUrl = getFilterUrl;
