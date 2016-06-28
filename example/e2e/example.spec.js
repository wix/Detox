describe('Example', function () {

  it('should show Click Me on start', function () {
    expect(element(by.label('Click Me'))).toBeVisible();
  });

  it('should show Yay after click', function () {
    element(by.label('Click Me')).tap();
    expect(element(by.label('Yay'))).toBeVisible();
  });

  it('should show Yay', function () {
    expect(element(by.label('Yay'))).toBeVisible();
  });

  /*
  it('should fail when looking for Mitzi', function () {
    expect(element(by.label('Mitzi'))).toBeVisible();
  });
  */

});
