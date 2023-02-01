# Contributing to OCMock

First off, thanks for taking the time to contribute to OCMock!

The following is a set of guidelines for contributing to OCMock. These are just guidelines, not rules. Use your best judgment and feel free to propose changes to this document in a pull request.

This project adheres to the [Contributor Covenant 1.2](http://contributor-covenant.org/version/1/2/0). By participating, you are expected to uphold this code. 


## Submitting issues

* If you have a question about using OCMock, please do not open an issue. Ask the question on StackOverflow using the [ocmock](http://stackoverflow.com/questions/tagged/ocmock) tag.

* If you have encountered an issue or you want to suggest an enhancement, perform a [cursory search](https://github.com/erikdoe/ocmock/issues?q=is%3Aissue) to see if a similar issue has already been submitted.

* When you submit an issue, please try to provide a [minimal, complete, and verifiable example](http://stackoverflow.com/help/mcve), ideally with a failing unit test. The easier it is to understand and reproduce the issue, the more likely it is that we can provide a fix.

* Include the version of OCMock you are using. If applicable include names and versions of other testing frameworks involved.

* Include stacktraces; they are immensely helpful.


## Pull requests

* Create all pull requests from `master`. Do not include other pull requests that have not been merged yet.

* Limit each pull request to one feature. If you have made several changes, please submit multiple pull requests. Do not include seemingly trival changes, e.g. upgrading the Xcode version, in a pull request for a feature or bugfix.

* If you add a new feature provide tests that specify how the feature works.

* If you have to add files, please make sure that the code builds for the OS X framework and the iOS library using Xcode. Also try to make sure that the Cocoapod and Carthage builds work.

* Respect the coding conventions (see below).

* Do not include the number of a related issue in the title of a pull request. Give the pull request a descriptive title and reference any issues from the description.

* Once you have created the pull request, an automated build is kicked off on [Travis CI](https://travis-ci.org/erikdoe/ocmock/pull_requests). Please verify after a few minutes that the build on the server succeeded. Pull requests with failing builds are ignored and will be closed within a few weeks if they are not fixed.

* Please don't post comments like "Ping?" or similar on your own pull requests. I understand that it can be frustrating not to get a response quickly but, unfortunately, I often don't have time to work on OCMock and can't always look at pull requests as they come in. It's difficult for me to predict when I'll get a chance to do so, but rest assured, pull requests are definitely not ignored.


## Coding conventions

Please remember that OCMock has been around for 10+ years. Some of the coding conventions used in OCMock may contradict modern guidelines. However, in the interest of keeping the codebase consistent, please respect the conventions used. In particular:

* Use four spaces for indentation.
* Opening and closing braces always go on a separate line (except with blocks).
* No spaces between keywords like `if` and `for` and the following bracket.
* No underscores for instance variables.
* OCMock itself (framework and library) does not use ARC; retains and releases must be sent manually. The unit tests, however, do use ARC.

The repository contains a `.clang-format` file in the actual source directory. This should get you mostly there. Please apply the formatting defined in the config file only to code you add or modify. Please do not apply the formatting to entire files as there are still some inconsistencies in parts of the codebase and certain cases are not formatted correctly by clang-format.


