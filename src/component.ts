import type { Extend, IsFiniteString } from "./utils";

/**
 * `Component<N, T>` represents a component.
 * @param N The name of the component.
 * @param T The type of the component instance.
 */
export type Component<N extends string, T extends unknown> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: "hokemi.type.Component";
  name: N;
  type: T;
};

/**
 * The upper bound of component types.
 */
export type AbstractComponent = Component<string, unknown>;

/**
 * Returns the instance type of a component.
 * @param C A component.
 */
export type Instance<C extends AbstractComponent> = C extends Component<infer N, infer T>
  ? _Instance<N, T>
  : never;
type _Instance<N extends string, T extends unknown> = IsFiniteString<N> extends true
  ? N extends unknown
    ? { readonly [N0 in N]: T }
    : never
  : never;

/**
 * Returns the mixed instance type of components.
 * @param Cs Components.
 */
export type Mixed<Cs extends AbstractComponent[]> = _Mixed<Cs, {}>;
// prettier-ignore
type _Mixed<Cs extends AbstractComponent[], M extends {}> =
    Cs extends [] ? M
  : Cs extends [
      infer X extends AbstractComponent,
      ...infer Xs extends AbstractComponent[]
    ] ? _Mixed<Xs, Extend<M, Instance<X>>>
  : never;
