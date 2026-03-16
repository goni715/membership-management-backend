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
exports.update_terms = exports.terms = exports.update_privacy_policy = exports.privacy_policy = void 0;
const db_1 = __importDefault(require("../db"));
const privacy_policy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const policy = yield db_1.default.LegalModel.findOne({ type: "privacy_policy" }, { __v: 0 });
        if (!policy) {
            res.status(404).json({ message: "Privacy Policy not found" });
            return;
        }
        res.json(policy);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.privacy_policy = privacy_policy;
const update_privacy_policy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const updatedTerms = yield db_1.default.LegalModel.findOneAndUpdate({ type: "privacy_policy" }, { content, updatedAt: Date.now() }, { new: true, upsert: true });
        res.status(200).json({ message: "Privacy Policy updated", updatedTerms });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.update_privacy_policy = update_privacy_policy;
const terms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const terms = yield db_1.default.LegalModel.findOne({ type: "terms_conditions" }, { __v: 0 });
        if (!terms) {
            res.status(404).json({ message: "Terms & Conditions not found" });
            return;
        }
        res.json(terms);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.terms = terms;
const update_terms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const updatedTerms = yield db_1.default.LegalModel.findOneAndUpdate({ type: "terms_conditions" }, { content, updatedAt: Date.now() }, { new: true, upsert: true });
        res.json({ message: "Terms & Conditions updated", updatedTerms });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});
exports.update_terms = update_terms;
