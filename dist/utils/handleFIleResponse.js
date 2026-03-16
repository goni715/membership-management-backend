"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleFileResponse = (files) => {
    return files.map(({ _doc }) => (Object.assign(Object.assign({}, _doc), { url: `${process.env.BASE_URL}/tools/access-file/${_doc._id}` })));
};
exports.default = handleFileResponse;
