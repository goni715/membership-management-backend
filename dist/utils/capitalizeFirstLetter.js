"use strict";
const capitalizeFirstLetter = (val) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};
module.exports = capitalizeFirstLetter;
