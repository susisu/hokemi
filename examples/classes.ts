import type { Component, Mixed } from "@susisu/hokemi";
import { impl, mixer } from "@susisu/hokemi";

// 1. Declare components

export interface Clock {
  getTime(): number;
}
export type ClockComponent = Component<"clock", Clock>;

export interface Random {
  getRandom(): number;
}
export type RandomComponent = Component<"random", Random>;

export interface MyService {
  getTimeAndRandom(): [number, number];
}
export type MyServiceComponent = Component<"myService", MyService>;

// 2. Implement components

class ClockImpl implements Clock {
  getTime(): number {
    return Date.now();
  }
}
export const clockImpl = impl<ClockComponent>("clock", ClockImpl);

class RandomImpl implements Random {
  getRandom(): number {
    return Math.random();
  }
}
export const randomImpl = impl<RandomComponent>("random", RandomImpl);

class MyServiceImpl implements MyService {
  private clock: Clock;
  private random: Random;

  constructor({ clock, random }: Mixed<[ClockComponent, RandomComponent]>) {
    this.clock = clock;
    this.random = random;
  }

  getTimeAndRandom(): [number, number] {
    return [this.clock.getTime(), this.random.getRandom()];
  }
}
export const myServiceImpl = impl<MyServiceComponent, [ClockComponent, RandomComponent]>(
  "myService",
  MyServiceImpl
);

// 3. Mix implementations and create an instance

const app = mixer(myServiceImpl, clockImpl, randomImpl).new();
console.log(app.myService.getTimeAndRandom());
