"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = __importDefault(require("./xml/file"));
exports.default = (data, options = {}) => {
    const aTestExecution = [{ _attr: { version: '1' } }];
    const testResults = data.testResults.map((result) => { return (0, file_1.default)(result, options.relativePaths, options.projectRoot); });
    return options?.formatForSonar56
        ? { unitTest: aTestExecution.concat(testResults) }
        : { testExecutions: aTestExecution.concat(testResults) };
};
