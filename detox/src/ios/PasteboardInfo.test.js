const {PasteboardInfo} = require('./PasteboardInfo')
describe('PasteboardInfo', async () => {
    let pb;
    let e;
    beforeEach(() => {
        e = require('./expect');
    })

    it('PasteboardInfo positive test', async() => {
        e.expect(new PasteboardInfo({pbString : 'test'})).toHaveString('test');
        e.expect(new PasteboardInfo({pbImage : new Image})).toHaveImage();
        e.expect(new PasteboardInfo({pbColor : 'red'})).toHaveColor();
        e.expect(new PasteboardInfo({pbString : 'www.wix.com'})).toHaveURL('www.wix.com');
    });

    it('PasteboardInfo negative test', async() => {
        e.expect(new PasteboardInfo({pbString : 'test'})).toHaveString('negative-test');
        e.expect(new PasteboardInfo({pbString : undefined })).toHaveString('negative-test');
        e.expect(new PasteboardInfo({pbImage : undefined})).toHaveImage();
        e.expect(new PasteboardInfo({pbColor : undefined})).toHaveColor();
        e.expect(new PasteboardInfo({pbString : 'www.negativeTest.com'})).toHaveURL('www.wix.com');
        e.expect(new PasteboardInfo({pbString : undefined})).toHaveURL('www.wix.com');
    });

});  