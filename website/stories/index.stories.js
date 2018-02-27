import React from "react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";

import SideBySide, { SideBySideOption } from "../core/SideBySide";

storiesOf("SideBySide", module).add("With all content filled", () => (
  <SideBySide>
    <SideBySideOption name="iOS">
      These are the instructions for iOS
    </SideBySideOption>
    <SideBySideOption name="Android">
      These are the instructions for Android
    </SideBySideOption>
  </SideBySide>
));
