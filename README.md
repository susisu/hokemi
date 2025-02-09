# hokemi

[![CI](https://github.com/susisu/hokemi/workflows/CI/badge.svg)](https://github.com/susisu/hokemi/actions?query=workflow%3ACI)

Minimal type-safe dependency injection framework for TypeScript, inspired by Cake Pattern in Scala.

## Installation

``` shell
# npm
npm i --save @susisu/hokemi
# yarn
yarn add @susisu/hokemi
# pnpm
pnpm add @susisu/hokemi
```

## Usage

First, declare *components* of your application.

``` ts
import type { Component } from "@susisu/hokemi";

export type Clock = {
  getTime: () => number;
};
export type ClockComponent = Component<"clock", Clock>;

export type Random = {
  getRandom: () => number;
};
export type RandomComponent = Component<"random", Random>;

export type MyService = {
  getTimeAndRandom: () => [number, number];
};
export type MyServiceComponent = Component<"myService", MyService>;
```

Each component has a name (e.g. `"clock"` for `ClockComponent`), which is used later to reference its instance.

Next, provide *implementations* for the components.

``` ts
import { impl } from "@susisu/hokemi";

export const clockImpl = impl<ClockComponent>("clock", () => ({
  getTime: () => Date.now(),
}));

export const randomImpl = impl<RandomComponent>("random", () => ({
  getRandom: () => Math.random(),
}));

export const myServiceImpl = impl<MyServiceComponent, [ClockComponent, RandomComponent]>(
  "myService",
  ({ clock, random }) => ({
    getTimeAndRandom: () => [clock.getTime(), random.getRandom()],
  }),
);
```

The `impl` function is a utility function to create an implementation of a component. It takes the component name and a factory function that creates an instance of the component.

`impl` also takes an optional second type argument (e.g. `[ClockComponent, RandomComponent]` for `myServiceImpl`), which specifies the dependencies of the implementation. Dependencies are passed to the factory function when the implementation is instantiated.

Finally, *mix* your implementations and create an instance of the application.

``` ts
import { mixer } from "@susisu/hokemi";

const app = mixer(myServiceImpl, clockImpl, randomImpl).new();
console.log(app.myService.getTimeAndRandom()); // => [<time>, <random>]
```

You can reference each component instance by its name (e.g. `app.myService`).

If you forget to provide some dependencies, or provide mismatched dependencies, it will be detected at compile time with neat error messages.

``` ts
const app = mixer(myServiceImpl, clockImpl).new();
//                                          ~~~
// TS2349: This expression is not callable.
//   Type '{ __missingDependenciesError?: { reason: "some dependencies are missing"; providerName: "myService"; dependencies: [{ name: "random"; expectedType: Random; }]; } | undefined; }' has no call signatures.
```

### API

#### `Component<Name, Type>`

Declares a component.

#### `impl<Component, Dependencies = []>(name, factory)`

Creates an implementation of a component.

`factory` can be either a function or a class that creates an instance of the component.

#### `mixer(...implementations)`

Creates a *mixer* object, which has the following methods:

- `.with(...implementations)`: extends the mixer with more implementations.
- `.new()`: creates a mixed instance.

## Troubleshooting

### Cannot export a mixer (TS7056) / type inference for a mixer is too slow

Adding a type annotation will solve the problem.

``` typescript
import { Mixer, mixer } from "@susisu/hokemi";

// Don't forget `as const`!
const impls = [myServiceImpl, clockImpl, randomImpl] as const;

export const myMixer: Mixer<[...typeof impls]> = mixer(...impls);
```

## License

[MIT License](http://opensource.org/licenses/mit-license.php)

## Author

Susisu ([GitHub](https://github.com/susisu), [Twitter](https://twitter.com/susisu2413))
