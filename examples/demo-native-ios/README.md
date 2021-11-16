## Pure Native iOS Demo Project

### Environment

#### Fundamentals

**IMPORTANT:** Get your environment properly set up, as explained in our [contribution guide](../../docs/Guide.Contributing.md).

#### Step 1: Build the Demo Project

* Build the demo project

    ```sh
    detox build --configuration ios.sim.release
    ```

#### Step 2: Run the E2E Tests

* Run tests on the demo project

    ```sh
    detox test --configuration ios.sim.release
    ```

This action will open a new simulator and run the tests on it.
