import type { IsFiniteString, IsSingleton } from "./utils";

const componentType = Symbol("hokemi.type.Component");

export type Component<N extends string, T extends unknown> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof componentType;
  name: N;
  type: T;
};

export type AbstractComponent = Component<string, unknown>;

export type Instance<C extends AbstractComponent> = C extends Component<infer N, infer T>
  ? _Instance<N, T>
  : never;
type _Instance<N extends string, T extends unknown> = IsFiniteString<N> extends true
  ? IsSingleton<N> extends true
    ? { readonly [N0 in N]: T }
    : {}
  : {};

export type MixedInstance<Cs extends AbstractComponent[]> = Cs extends unknown
  ? {
      [K in keyof Cs]: (x: Instance<Cs[K]>) => unknown;
    }[number] extends (x: infer A) => unknown
    ? A
    : never
  : never;
