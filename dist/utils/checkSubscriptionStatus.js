"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const db_1 = __importDefault(require("../db"));
function default_1(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield db_1.default.UserModel.findById(userId);
        if ((user === null || user === void 0 ? void 0 : user.isSubscribed) &&
            (user === null || user === void 0 ? void 0 : user.subscriptionExpiry) &&
            new Date() > (user === null || user === void 0 ? void 0 : user.subscriptionExpiry)) {
            yield db_1.default.UserModel.findByIdAndUpdate(user === null || user === void 0 ? void 0 : user._id, {
                isSubscribed: false,
            });
            return;
        }
    });
}
