const JSONLStringer = require('./JSONLStringer');

describe('JSONLStringer', () => {
  it('should serialize to JSONL', (resolve) => {
    expect.hasAssertions();

    let output = '';
    const stringer = JSONLStringer.serializeJSONL()
      .on('data', (chunk) => { output += chunk; })
      .on('end', () => {
        expect(output).toEqual('{"a":1}\n{"b":2}');
        resolve();
      });

    stringer.write({ a: 1 });
    stringer.write({ b: 2 });
    stringer.end();
  });

  it('should serialize to JSON', (resolve) => {
    expect.hasAssertions();

    let output = '';
    const stringer = JSONLStringer.serializeJSON()
      .on('data', (chunk) => { output += chunk; })
      .on('end', () => {
        expect(output).toEqual('[\n\t{"a":1},\n\t{"b":2}\n]\n');
        resolve();
      });

    stringer.write({ a: 1 });
    stringer.write({ b: 2 });
    stringer.end();
  });
});
