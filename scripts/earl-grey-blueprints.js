#!/usr/bin/env node
const fs = require('fs');
const objectiveCParser = require('objective-c-parser');
const t = require('babel-types');
const generate = require('babel-generator').default;

const files = {
    './detox/ios/EarlGrey/EarlGrey/Action/GREYPickerAction.h': './demo.js',
};

Object.entries(files).forEach(([inputFile, outputFile]) => {
    const input = fs.readFileSync(inputFile, 'utf8');
    const json = objectiveCParser(input);
    const ast = createClass(json);
    const output = generate(ast);

    fs.writeFileSync(outputFile, output.code, 'utf8');

});

function createClass(json) {
    return t.classDeclaration(t.identifier(json.name), null, t.classBody([]), []);
}