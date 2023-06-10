import type { AbstractComponent, Component, MixedInstance } from "./component";

const providerType = Symbol("hokemi.type.Provider");

export type Provider<N extends string, T extends unknown, D extends unknown> = Readonly<{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __type: typeof providerType;
  name: N;
  factory: (deps: D) => T;
}>;

export type AbstractProvider = Provider<string, unknown, never>;

export type Dependencies<P extends AbstractProvider> = P extends Provider<string, unknown, infer D>
  ? D
  : never;

export type ReconstructComponent<P extends AbstractProvider> = P extends Provider<
  infer N,
  infer T,
  never
>
  ? Component<N, T>
  : never;

export type MixedProvidedInstance<Ps extends AbstractProvider[]> = MixedInstance<{
  [K in keyof Ps]: ReconstructComponent<Ps[K]>;
}>;

export type Impl<
  C extends AbstractComponent,
  Ds extends AbstractComponent[] = []
> = C extends Component<infer N, infer T> ? Provider<N, T, MixedInstance<Ds>> : never;

export type ImplArgs<C extends AbstractComponent, Ds extends AbstractComponent[] = []> = _ImplArgs<
  Impl<C, Ds>
>;
type _ImplArgs<P extends AbstractProvider> = P extends Provider<infer N, infer T, infer D>
  ? [name: N, factory: (deps: D) => T]
  : never;

export function impl<C extends AbstractComponent, Ds extends AbstractComponent[] = []>(
  ...[name, factory]: ImplArgs<C, Ds>
): Impl<C, Ds> {
  const provider: AbstractProvider = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __type: providerType,
    name,
    factory,
  };
  // ImplArgs<C, Ds> and Impl<C, Ds> always have the same shape, so it's safe to cast.
  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  return provider as Impl<C, Ds>;
}
