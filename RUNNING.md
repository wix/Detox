> detox

# Running your detox e2e tests

#### Preliminaries

* make sure you've followed the [installation](INSTALLING.md) instructions first
* make sure your project (where package.json is found) has been installed with `npm install`
* make sure your app binary was built and found where specified in package.json (detox > ios-simulator > app)

#### Step 1: Run a local detox-server

* run `npm run detox run-server`
* you should see `server listening on localhost:8099...`

#### Step 2: Run the e2e test

* open the project folder (where package.json is found)
* run `npm run detox test`
* for verbose mode run `npm run detox test -- -d`
* this action will open a new simulator and run the tests in it, yay
