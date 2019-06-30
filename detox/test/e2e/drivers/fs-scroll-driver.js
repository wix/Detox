const scrollViewDriver = {
  byId: () => by.id('FSScrollActions.scrollView'),
  element: () => element(scrollViewDriver.byId()),
  listItem: (index) => element(by.text(`Text${index}`)),
  firstItem: () => scrollViewDriver.listItem(1),
  secondItem: () => scrollViewDriver.listItem(2),
  secondPageItemIndex: () => 16,
  secondPageItem: () => scrollViewDriver.listItem(scrollViewDriver.secondPageItemIndex()),
  lastItem: () => scrollViewDriver.listItem(20),
  fakeItem: () => scrollViewDriver.listItem(1000),
  scrollBy: (amount) => scrollViewDriver.element().scroll(Math.abs(amount), (amount > 0 ? 'down' : 'up')),
};

module.exports = {
  scrollViewDriver
};
