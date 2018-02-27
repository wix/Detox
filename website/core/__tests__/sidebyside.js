import React from "react";
import SideBySide, { SideBySideOption } from "../SideBySide";
import renderer from "react-test-renderer";

describe("SideBySide", () => {
  it("should throw without children", () => {
    expect(<SideBySide />).toThrowErrorMatchingSnapshot();
  });

  it("should render first option if none is selected", () => {
    expect(
      renderer
        .create(
          <SideBySide>
            <SideBySideOption name="ios">iOS Content</SideBySideOption>
            <SideBySideOption name="android">Android Content</SideBySideOption>
          </SideBySide>
        )
        .toJSON()
    ).toMatchSnapshot();
  });

  it("should render the option that was selected", () => {
    const element = renderer.create(
      <SideBySide>
        <SideBySideOption name="ios">iOS Content</SideBySideOption>
        <SideBySideOption name="android">Android Content</SideBySideOption>
      </SideBySide>
    );
    element.getInstance().selectOption("android");
    expect(element.toJSON()).toMatchSnapshot();
  });
});
