const {PasteboardInfo} = require('./PasteboardInfo')
describe('PasteboardInfo', async () => {
    let pb;
    let e;
    beforeEach(() => {
        e = require('./expect');
    })

    it('PasteboardInfo test', async() => {
        e.expect(new PasteboardInfo({pbString : 'test'})).toHaveString('test');
        e.expect(new PasteboardInfo({pbImage : new Image})).toHaveImage();
        e.expect(new PasteboardInfo({pbColor : 'red'})).toHaveColor();
        e.expect(new PasteboardInfo({pbString : 'www.wix.com'})).toHaveURL('www.wix.com');
    })

});  