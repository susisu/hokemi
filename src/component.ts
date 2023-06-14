import type { Extend, IsFiniteString, IsSingleton } from "./utils";

// const componentType = Symbol("hokemi.type.Component");
declare const componentType: unique symbol;

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

export type Mixed<Cs extends AbstractComponent[]> = _Mixed<Cs, {}>;
// prettier-ignore
type _Mixed<Cs extends AbstractComponent[], M extends {}> =
    Cs extends [] ? M
  : Cs extends [
      infer X extends AbstractComponent,
      ...infer Xs extends AbstractComponent[]
    ] ? _Mixed<Xs, Extend<M, Instance<X>>>
  : never;
