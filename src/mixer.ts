import type { AbstractProvider, Dependencies, MixedProvidedInstance } from "./provider";
import type { OrElse, Wrap } from "./utils";

export type Mixer<Ps extends AbstractProvider[]> = Readonly<{
  mix: MixerMix<Ps>;
  make: MixerMake<Ps>;
}>;

type MixerMix<Ps extends AbstractProvider[]> = <Qs extends AbstractProvider[]>(
  ...providers: Qs
) => Mixer<[...Ps, ...Qs]>;

type MixerMake<Ps extends AbstractProvider[]> = MixerError<Ps> extends never
  ? () => MixedProvidedInstance<Ps>
  : MixerError<Ps>;

type MixerError<Ps extends AbstractProvider[]> = {
  [K in keyof Ps]: PerProviderError<Ps[K], Ps>;
}[number];

type PerProviderError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MixedProvidedInstance<Ps> extends Dependencies<P>
  ? never
  : OrElse<
      MissingDependenciesError<P, Ps> | IncompatibleDependenciesError<P, Ps>,
      UnknownError<{
        reason: "dependency error (details unknown; please report an issue)";
        providerName: P["name"];
      }>
    >;

const unknownError = Symbol("hokemi.error.Unknown");

type UnknownError<E extends unknown> = {
  [unknownError]: E;
};

const missingDependenciesError = Symbol("hokemi.error.MissingDependencies");

type MissingDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MissingDependencyNames<P, Ps> extends never
  ? never
  : {
      [missingDependenciesError]: {
        reason: "some dependencies are missing";
        providerName: P["name"];
        dependencyNames: MissingDependencyNames<P, Ps>;
      };
    };
type MissingDependencyNames<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _MissingDependencyNames<Dependencies<P>, MixedProvidedInstance<Ps>>;
type _MissingDependencyNames<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<Exclude<keyof D, keyof I>>
  : never;

const incompatibleDependenciesError = Symbol("hokemi.error.IncompatibleDependencies");

type IncompatibleDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = IncompatibleDependencyNames<P, Ps> extends never
  ? never
  : {
      [incompatibleDependenciesError]: {
        reason: "some dependencies are incompatible";
        providerName: P["name"];
        dependencyNames: IncompatibleDependencyNames<P, Ps>;
      };
    };
type IncompatibleDependencyNames<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _IncompatibleDependencyNames<Dependencies<P>, MixedProvidedInstance<Ps>>;
type _IncompatibleDependencyNames<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<{ [K in keyof D & keyof I]: I[K] extends D[K] ? never : K }[keyof D & keyof I]>
  : never;

export function mixer<Ps extends AbstractProvider[]>(...providers: Ps): Mixer<Ps> {
  const mix: MixerMix<Ps> = (...otherProviders) => mixer(...providers, ...otherProviders);

  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  const make: MixerMake<Ps> = (() => {
    const app = {};
    const components: Array<Readonly<{ name: string; value: unknown }>> = [];
    for (const provider of providers) {
      components.push({
        name: provider.name,
        // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
        value: provider.factory(app as never),
      });
    }
    for (const component of components) {
      Object.defineProperty(app, component.name, {
        value: component.value,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
    return app;
  }) as MixerMake<Ps>;

  return { mix, make };
}
