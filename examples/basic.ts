import type { Component } from "@susisu/hokemi";
import { impl, mixer } from "@susisu/hokemi";

// 1. Declare components

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

// 2. Implement components

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
  })
);

// 3. Mix implementations and create an instance

const app = mixer(myServiceImpl, clockImpl, randomImpl).new();
console.log(app.myService.getTimeAndRandom());
