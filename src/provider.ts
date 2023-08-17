import type { AbstractComponent, Component, Mixed } from "./component";

/**
 * `Provider<N, T, D>` represents a component provider.
 * @param N The name of the component.
 * @param T The type of the provided instance.
 * @param D The type of the dependencies.
 */
export type Provider<N extends string, T extends unknown, D extends unknown> = Readonly<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: "hokemi.type.Provider";
  name: N;
  factory: Factory<T, D>;
}>;

export type Factory<T extends unknown, D extends unknown> =
  | FactoryFunction<T, D>
  | FactoryClass<T, D>;
export type FactoryFunction<T extends unknown, D extends unknown> = (deps: D) => T;
export type FactoryClass<T extends unknown, D extends unknown> = new (deps: D) => T;

export function execFactory<T extends unknown, D extends unknown>(
  factory: Factory<T, D>,
  deps: D
): T {
  // check if the factory is a class (this is not a perfect check though)
  const desc = Object.getOwnPropertyDescriptor(factory, "prototype");
  if (desc && !desc.writable) {
    // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
    return new (factory as FactoryClass<T, D>)(deps);
  } else {
    // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
    return (factory as FactoryFunction<T, D>)(deps);
  }
}

/**
 * The upper bound of provider types.
 */
export type AbstractProvider = Provider<string, unknown, never>;

export type ProviderName<P extends AbstractProvider> = P extends Provider<infer N, unknown, never>
  ? N
  : never;

export type ProviderDependencies<P extends AbstractProvider> = (
  P extends Provider<string, unknown, infer D> ? (deps: D) => unknown : never
) extends (deps: infer I) => unknown
  ? I
  : never;

export type ReconstructComponent<P extends AbstractProvider> = P extends Provider<
  infer N,
  infer T,
  never
>
  ? Component<N, T>
  : never;

export type MixedProvidedInstance<Ps extends AbstractProvider[]> = Mixed<{
  [K in keyof Ps]: ReconstructComponent<Ps[K]>;
}>;

/**
 * Returns the provider type that implements a component.
 * @param C A component.
 * @param Ds A list of dependencies.
 */
export type Impl<
  C extends AbstractComponent,
  Ds extends AbstractComponent[] = [],
> = C extends Component<infer N, infer T> ? Provider<N, T, Mixed<Ds>> : never;

export type ImplArgs<C extends AbstractComponent, Ds extends AbstractComponent[] = []> = _ImplArgs<
  Impl<C, Ds>
>;
type _ImplArgs<P extends AbstractProvider> = P extends Provider<infer N, infer T, infer D>
  ? [name: N, factory: Factory<T, D>]
  : never;

/**
 * Creates an implementation of a component.
 * @param name The name of the component.
 * @param factory A factory function or class that creates an instance of the component.
 * @returns An implementation (provider) of the component.
 */
export function impl<C extends AbstractComponent, Ds extends AbstractComponent[] = []>(
  ...[name, factory]: ImplArgs<C, Ds>
): Impl<C, Ds> {
  const provider: AbstractProvider = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __type: "hokemi.type.Provider",
    name,
    factory,
  };
  // ImplArgs<C, Ds> and Impl<C, Ds> always have the same shape, so it's safe to cast.
  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  return provider as Impl<C, Ds>;
}
