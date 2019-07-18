interface Instantiable<T, P extends Array<any>> { new(...args: P): T; }
type Abstract<T> = Function & { prototype: T };
type Class<T> = Instantiable<T, any> | Abstract<T>;

export type LifetimeScope = "permanent" | "transient";

interface Resolvable<T> {
    implementation?: Instantiable<T, any>;
    lifetimeScope: LifetimeScope;
    constructorParameters?: any[] | undefined;
}

export class Container {
    private readonly resolvables = new Map<string | Class<any>, Resolvable<any>>();
    private readonly values = new Map<string | Class<any>, any>();

    public register<T, P extends Array<any>>(
        type: Class<T> | string,
        implementedBy: Instantiable<T, P>,
        lifetimeScope: LifetimeScope,
        constructorParameters?: P,
    ) {
        const resolvable: Resolvable<T> = {
            implementation: implementedBy,
            lifetimeScope,
            constructorParameters,
        };
        this.resolvables.set(type, resolvable);

        if (lifetimeScope === "permanent") {
            this.values.set(type, this.resolveTransient(resolvable));
        }
    }

    public registerValue<T>(
        key: Class<T> | string,
        value: T
    ) {
        const resolvable: Resolvable<T> = { lifetimeScope: "permanent" };
        this.resolvables.set(key, resolvable);
        this.values.set(key, value);
    }

    public resolve<T>(
        key: Class<T> | string
    ): T {
        const resolvedResolvable = this.resolvables.get(key);

        if (resolvedResolvable === undefined) {
            throw new Error(`Cannot resolve type ${this.getKeyName(key)}.`);
        }

        switch (resolvedResolvable.lifetimeScope) {
            case "transient":
                return this.resolveTransient(resolvedResolvable);
            case "permanent":
                return this.resolvePermanent(key);
            default:
                throw new Error("Unknown lifetime scope.");
        }
    }

    public getResolver(): <T>(key: Class<T> | string) => T {
        return this.resolve.bind(this);
    }

    private resolveTransient<T>(
        resolvable: Resolvable<T>
    ): T {
        return new (resolvable.implementation!)(...(resolvable.constructorParameters || []));
    }

    private resolvePermanent<T>(
        type: Class<T> | string
    ): T {
        const resolvedInstance = this.values.get(type);

        if (resolvedInstance === undefined) {
            throw new Error(`Cannot resolve type ${this.getKeyName(type)}.`);
        }

        return resolvedInstance;
    }

    private getKeyName<T>(key: Class<T> | string) {
        if (typeof (key) === "string") {
            return key;
        }
        return key.name;
    }
}

export const globalContainer = new Container();
export const globalResolve = globalContainer.getResolver();
