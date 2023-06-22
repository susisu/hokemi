import type { AsString, IsFiniteString, Merge, Prod } from "./utils";

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
type _Instance<N extends string, T extends unknown> = N extends unknown
  ? IsFiniteString<N> extends true
    ? { readonly [N0 in N]: T }
    : { readonly [N0 in N]?: T }
  : never;

/**
 * Returns the mixed instance type of components.
 * @param Cs Components.
 */
export type Mixed<Cs extends AbstractComponent[]> = Merge<Prod<FilteredInstances<Cs, [], never>>>;
// prettier-ignore
type FilteredInstances<
  Cs extends AbstractComponent[],
  Is extends Array<{}>,
  K extends string
> = Cs extends [] ? Is
  : Cs extends [
      ...infer Xs extends AbstractComponent[],
      infer X extends AbstractComponent,
    ] ? _FilteredInstances<Xs, Is, Instance<X>, K>
  : [];
// prettier-ignore
type _FilteredInstances<
  Cs extends AbstractComponent[],
  Is extends Array<{}>,
  I extends {},
  K extends string
> = I extends unknown
  ? keyof I extends K
    ? FilteredInstances<Cs, Is, K>
    : IsFiniteString<AsString<keyof I>> extends true
      ? FilteredInstances<Cs, [I, ...Is], K | AsString<keyof I>>
      : FilteredInstances<Cs, Is, K | AsString<keyof I>>
  : never;
