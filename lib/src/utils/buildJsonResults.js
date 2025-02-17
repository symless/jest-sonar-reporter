"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const constants_1 = __importDefault(require("../constants"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const toTemplateTag = function (varName) {
    return "{" + varName + "}";
};
const replaceVars = function (strOrFunc, variables) {
    if (typeof strOrFunc === 'string') {
        let str = strOrFunc;
        Object.keys(variables).forEach((varName) => {
            str = str.replace(toTemplateTag(varName), variables[varName]);
        });
        return str;
    }
    else {
        const func = strOrFunc;
        const resolvedStr = func(variables);
        if (typeof resolvedStr !== 'string') {
            throw new Error('Template function should return a string');
        }
        return resolvedStr;
    }
};
const executionTime = function (startTime, endTime) {
    return (endTime - startTime) / 1000;
};
const addErrorTestResult = function (suite) {
    suite.testResults.push({
        "ancestorTitles": [],
        "duration": 0,
        "failureMessages": [
            suite.failureMessage
        ],
        "numPassingAsserts": 0,
        "status": "error"
    });
};
exports.default = (report, appDirectory, options) => {
    const junitSuitePropertiesFilePath = path.join(process.cwd(), options.testSuitePropertiesFile);
    const ignoreSuitePropertiesCheck = !fs.existsSync(junitSuitePropertiesFilePath);
    if (options.usePathForSuiteName === 'true' &&
        options.suiteNameTemplate === toTemplateTag(constants_1.default.TITLE_VAR)) {
        options.suiteNameTemplate = toTemplateTag(constants_1.default.FILEPATH_VAR);
    }
    const jsonResults = {
        'testsuites': [{
                '_attr': {
                    'name': options.suiteName,
                    'tests': 0,
                    'failures': 0,
                    'errors': 0,
                    'skipped': 0,
                    'time': executionTime(report.startTime, Date.now())
                }
            }]
    };
    report.testResults.forEach((suite) => {
        const noResults = suite.testResults.length === 0;
        if (noResults && options.reportTestSuiteErrors === 'false') {
            return;
        }
        const noResultOptions = noResults ? {
            suiteNameTemplate: toTemplateTag(constants_1.default.FILEPATH_VAR),
            titleTemplate: toTemplateTag(constants_1.default.FILEPATH_VAR),
            classNameTemplate: `Test suite failed to run`
        } : {};
        const suiteOptions = Object.assign({}, options, noResultOptions);
        if (noResults) {
            addErrorTestResult(suite);
        }
        const filepath = path.relative(appDirectory, suite.testFilePath);
        const filename = path.basename(filepath);
        const suiteTitle = suite.testResults[0].ancestorTitles[0];
        const displayName = typeof suite.displayName === 'object'
            ? suite.displayName.name
            : suite.displayName;
        const suiteNameVariables = {};
        suiteNameVariables[constants_1.default.FILEPATH_VAR] = filepath;
        suiteNameVariables[constants_1.default.FILENAME_VAR] = filename;
        suiteNameVariables[constants_1.default.TITLE_VAR] = suiteTitle;
        suiteNameVariables[constants_1.default.DISPLAY_NAME_VAR] = displayName;
        const suiteNumTests = suite.numFailingTests + suite.numPassingTests + suite.numPendingTests;
        const suiteExecutionTime = executionTime(suite.perfStats.start, suite.perfStats.end);
        const suiteErrors = noResults ? 1 : 0;
        const testSuite = {
            testsuite: [{
                    _attr: {
                        name: replaceVars(suiteOptions.suiteNameTemplate, suiteNameVariables),
                        errors: suiteErrors,
                        failures: suite.numFailingTests,
                        skipped: suite.numPendingTests,
                        timestamp: (new Date(suite.perfStats.start)).toISOString().slice(0, -5),
                        time: suiteExecutionTime,
                        tests: suiteNumTests
                    }
                }]
        };
        jsonResults.testsuites[0]._attr.failures += suite.numFailingTests;
        jsonResults.testsuites[0]._attr.skipped += suite.numPendingTests;
        jsonResults.testsuites[0]._attr.errors += suiteErrors;
        jsonResults.testsuites[0]._attr.tests += suiteNumTests;
        if (!ignoreSuitePropertiesCheck) {
            const junitSuiteProperties = require(junitSuitePropertiesFilePath)(suite);
            const testSuitePropertyMain = {
                properties: []
            };
            Object.keys(junitSuiteProperties).forEach((p) => {
                const testSuiteProperty = {
                    property: {
                        _attr: {
                            name: p,
                            value: replaceVars(junitSuiteProperties[p], suiteNameVariables)
                        }
                    }
                };
                testSuitePropertyMain.properties.push(testSuiteProperty);
            });
            testSuite.testsuite.push(testSuitePropertyMain);
        }
        suite.testResults.forEach((tc) => {
            const classname = tc.ancestorTitles.join(suiteOptions.ancestorSeparator);
            const testTitle = tc.title;
            const testVariables = {};
            testVariables[constants_1.default.FILEPATH_VAR] = filepath;
            testVariables[constants_1.default.FILENAME_VAR] = filename;
            testVariables[constants_1.default.SUITENAME_VAR] = suiteTitle;
            testVariables[constants_1.default.CLASSNAME_VAR] = classname;
            testVariables[constants_1.default.TITLE_VAR] = testTitle;
            testVariables[constants_1.default.DISPLAY_NAME_VAR] = displayName;
            const testCase = {
                'testcase': [{
                        _attr: {
                            classname: replaceVars(suiteOptions.classNameTemplate, testVariables),
                            name: replaceVars(suiteOptions.titleTemplate, testVariables),
                            time: tc.duration / 1000,
                            file: '',
                        },
                    }]
            };
            if (suiteOptions.addFileAttribute === 'true') {
                testCase.testcase[0]._attr.file = filepath;
            }
            if (tc.status === 'failed' || tc.status === 'error') {
                const failureMessages = options.noStackTrace === 'true' && tc.failureDetails ?
                    tc.failureDetails.map((detail) => detail.message) : tc.failureMessages;
                failureMessages.forEach((failure) => {
                    const tagName = tc.status === 'failed' ? 'failure' : 'error';
                    testCase.testcase.push({
                        [tagName]: (0, strip_ansi_1.default)(failure)
                    });
                });
            }
            if (tc.status === 'pending') {
                testCase.testcase.push({
                    skipped: {}
                });
            }
            testSuite.testsuite.push(testCase);
        });
        if (suiteOptions.includeConsoleOutput === 'true' && suite.console && suite.console.length) {
            const testSuiteConsole = {
                'system-out': {
                    _cdata: JSON.stringify(suite.console, null, 2)
                }
            };
            testSuite.testsuite.push(testSuiteConsole);
        }
        if (suiteOptions.includeShortConsoleOutput === 'true' && suite.console && suite.console.length) {
            const testSuiteConsole = {
                'system-out': {
                    _cdata: JSON.stringify(suite.console.map((item) => item.message), null, 2)
                }
            };
            testSuite.testsuite.push(testSuiteConsole);
        }
        jsonResults.testsuites.push(testSuite);
    });
    return jsonResults;
};
