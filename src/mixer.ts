import type {
  AbstractProvider,
  ProviderDependencies,
  ProviderName,
  MixedProvidedInstance,
} from "./provider";
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
> = MixedProvidedInstance<Ps> extends ProviderDependencies<P>
  ? never
  : OrElse<
      MissingDependenciesError<P, Ps> | IncompatibleDependenciesError<P, Ps>,
      UnknownError<{
        reason: "provider has an unknown dependency error (this is likely a bug; please file an issue)";
        providerName: ProviderName<P>;
      }>
    >;

// const unknownError = Symbol("hokemi.error.Unknown");
declare const unknownError: unique symbol;

type UnknownError<E extends unknown> = {
  [unknownError]: E;
};

// const missingDependenciesError = Symbol("hokemi.error.MissingDependencies");
declare const missingDependenciesError: unique symbol;

type MissingDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = MissingDependencies<P, Ps> extends never
  ? never
  : {
      [missingDependenciesError]: {
        reason: "provider has missing dependencies";
        providerName: ProviderName<P>;
        dependencies: MissingDependencies<P, Ps>;
      };
    };
type MissingDependencies<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _MissingDependencies<ProviderDependencies<P>, MixedProvidedInstance<Ps>>;
type _MissingDependencies<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<
      {
        [N in keyof D]: N extends keyof I
          ? never
          : {
              name: N;
              expectedType: D[N];
            };
      }[keyof D]
    >
  : never;

// const incompatibleDependenciesError = Symbol("hokemi.error.IncompatibleDependencies");
declare const incompatibleDependenciesError: unique symbol;

type IncompatibleDependenciesError<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = IncompatibleDependencies<P, Ps> extends never
  ? never
  : {
      [incompatibleDependenciesError]: {
        reason: "provider has incompatible dependencies";
        providerName: ProviderName<P>;
        dependencies: IncompatibleDependencies<P, Ps>;
      };
    };
type IncompatibleDependencies<
  P extends AbstractProvider,
  Ps extends AbstractProvider[]
> = _IncompatibleDependencies<ProviderDependencies<P>, MixedProvidedInstance<Ps>>;
type _IncompatibleDependencies<D extends unknown, I extends unknown> = D extends unknown
  ? Wrap<
      {
        [N in keyof D & keyof I]: I[N] extends D[N]
          ? never
          : {
              name: N;
              expectedType: D[N];
              actualType: I[N];
            };
      }[keyof D & keyof I]
    >
  : never;

export function mixer<Ps extends AbstractProvider[]>(...providers: Ps): Mixer<Ps> {
  const mix: MixerMix<Ps> = (...otherProviders) => mixer(...providers, ...otherProviders);

  // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
  const make: MixerMake<Ps> = (() => {
    const app = {};
    const instances = new Map<string, unknown>();
    let ready: boolean = false;

    for (const provider of providers) {
      const name = provider.name;
      Object.defineProperty(app, name, {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        get: (): unknown => {
          if (!ready) {
            throw new Error(`you cannot use '${name}' during initialization`);
          }
          // assert(instances.has(name));
          return instances.get(name);
        },
        configurable: true,
        enumerable: true,
      });
    }

    for (const provider of providers) {
      const name = provider.name;
      // eslint-disable-next-line @susisu/safe-typescript/no-type-assertion
      const value = provider.factory(app as never);
      instances.set(name, value);
    }

    ready = true;

    return app;
  }) as MixerMake<Ps>;

  return { mix, make };
}
