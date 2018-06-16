const {PasteboardInfo, errors} = require('./PasteboardInfo')
describe('PasteboardInfo', async () => {
    let pb;
    let e;
    beforeEach(() => {
        e = require('./expect');
    })

    it('PasteboardInfo positive test', async() => {
        await e.expect(new PasteboardInfo({pbString : 'test'})).toHaveString('test');
        await e.expect(new PasteboardInfo({pbImage : 'new Image'})).toHaveImage();
        await e.expect(new PasteboardInfo({pbColor : 'red'})).toHaveColor();
        await e.expect(new PasteboardInfo({pbString : 'www.wix.com'})).toHaveURL('www.wix.com');
    });

    it('PasteboardInfo negative test', async() => {
        await expectToThrow(() => e.expect(new PasteboardInfo({pbString : ''})).toHaveString('negative-test'), errors.EMPTY_STRING);
        await expectToThrow(() => e.expect(new PasteboardInfo({pbString : 'test'})).toHaveString('negative-test'), errors.STRING_NOT_EQUAL);
        await expectToThrow(() => e.expect(new PasteboardInfo({pbImage : undefined})).toHaveImage(), errors.EMPTY_IMAGE);
        await expectToThrow(() => e.expect(new PasteboardInfo({pbColor : undefined})).toHaveColor(), errors.EMPTY_COLOR);
        await expectToThrow(() => e.expect(new PasteboardInfo({pbString : 'www.negativeTest.com'})).toHaveURL('www.wix.com'), errors.URL_NOT_EQUAL);
        await expectToThrow(() => e.expect(new PasteboardInfo({pbString : undefined})).toHaveURL('www.wix.com'), errors.EMPTY_URL);
    });
});  

async function expectToThrow(func, errorMessage) {
    try {
      await func();
    } catch (ex) {
      expect(ex).toEqual(new Error(errorMessage));
    }
  }