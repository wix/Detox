---
authors:
  - noomorph
tags: [major-release, genymotion]
---

:::caution

This is a draft post about a future release.
Congrats if you found it earlier than we announced it.

:::

# Detox 20 is out

Today we're proud to announce the new major release, **Detox 20.**
The main highlights are:

* improved integration with test runners,
* official support for Genymotion SaaS,
* configurable logging subsystem,
* a few convenience features (`headless` for iOS, `reversePorts` for Android),
* and more optimizations to land in the next minor versions.

## Integration with test runners

TODO: Integration with test runners

## Genymotion SaaS

TODO: Genymotion SaaS

## Configurable logger

TODO: Configurable logger

## Minor features

TODO: Minor features

## Afterword

Over the last year and a half, we have been establishing a centralized configuration system for more than 50 projects using Detox at Wix. While it never seemed to be a cakewalk, the entire experience of troubleshooting over a hundred issues across the organization did not leave us the same.

We clearly see there are numerous things to improve in Detox, but most of them boil down to the same thing – **scaling**. Surprisingly, "scaling" makes an excellent umbrella term for nearly every challenge we've been encountering lately:

* _scaling up the users count_ requires us to improve the onboarding and troubleshooting experience;
* _scaling up the projects count_ forces us to centralize scattered configs into flexible organization presets;
* _scaling up the tests count_ prompts us to optimize the codebase and incline it towards cloud and remote execution.

Our core team has been challenged with human resource constraints and scaling needs for a long time already, and, in many ways, that has shaped a specific mindset within our core team, where every feature is evaluated via asking a simple question: _is it going to save us and other people time to focus on more important things?_ Teaching how to fish is better than giving a fish, and our success at preventing support issues is more valuable than our success at solving them ourselves.

This is why the upcoming releases will be aimed at...
