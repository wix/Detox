import React from "react";
import Footer from "../Footer";
import renderer from "react-test-renderer";

describe("Footer", () => {
  it("renders with icon", () => {
    const config = {
      baseUrl: "http://unicorns",
      title: "detox is awesome",
      repoUrl: "https://github.com/wix/detox/",
      footerIcon: "/img/footer.png"
    };
    const component = renderer.create(<Footer config={config} />).toJSON();
    expect(component).toMatchSnapshot();
  });

  it("renders without icon", () => {
    const config = {
      baseUrl: "http://unicorns",
      title: "detox is awesome",
      repoUrl: "https://github.com/wix/detox/"
    };
    const component = renderer.create(<Footer config={config} />).toJSON();
    expect(component).toMatchSnapshot();
  });
});
