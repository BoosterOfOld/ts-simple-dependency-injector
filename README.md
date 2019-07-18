# ts-simple-dependency-injector
Simple TypeScript Dependency Injection Usable with React Components.

## Constructor Injection Mechanism
The mechanism of injecting dependencies into the constructor takes advantage of TS/ES6 default parameter assignment. No annotations, no metadata, and no reflection. We just let the engine do all the work, and it does a really good job.

    import { resolve } from "../MyDependencyHelper.ts";

    class Class1 {
        constructor(
            public c2 = resolve(Class2),
            public c3 = resolve(Class3),
        ) { }
    }

    class Class2 {
        constructor(
            public c4 = resolve(Class4),
        ) { }
    }

    class Class3 {
        constructor(
            public c5 = resolve(Class5),
        ) { }
    }

    class Class4 { } // Terminal node.
    class Class5 { } // Terminal node.

## Container Creation & Type Registration
The container is capable of registering types that exist during runtime (abstract class, class) to their corresponding implementations:

    import { Container } from "ts-simple-dependency-injector";

    abstract class PureAbstractClass {
        public abstract get C1(): Class1;
    }

    // Pure abstract classes can be implemented like interfaces in TS.
    class PureAbstractClassImplementation implements PureAbstractClass {
        constructor(private c1 = resolve(Class1)) {}
        public get C1() {
            return this.c1;
        }
    }

    // Container creation
    const container = new Container();
    const resolve = container.getResolver(); // Resolve function bound to our container to be passed around.
                                             // You can export this function from your dependency helper.

    // Dependency setup

    // Bottom-up composition tree construction.
    container.register(Class4, Class4, "permanent");
    container.register(Class5, Class5, "permanent");

    // Class2 already resolves Class4 during its construction here, so Class4 must be registered at this point.
    // Circular dependencies are not possible (which is good from the architectural point of view).
    container.register(Class2, Class2, "permanent");
    container.register(Class3, Class3, "permanent");
    container.register(Class1, Class1, "permanent");

    // Composition root
    container.register(PureAbstractClass, PureAbstractClassImplementation, "permanent");

## Implicitly-typed Resolving
The container is capable of implicitly-typed resolving.

    const impl = resolve(PureAbstractClass);
    // "Impl" will contain fully initialized PureAbstractClassImplementation will all its dependencies
    // and it will be of type PureAbstractClass. No need to declare the type explicitly.

## React Dependency Injection
The injector makes it very simple to inject dependencies (such as stores) to React components.

    export class MyComponent extends React.Component<Props, State> {
        constructor(
            props: any,
            context: any,
            private myStore = resolve(IMyStore),
            private myOtherStore = resolve(IMyOtherStore),
        ) {
            super(props, context);
        }
        // ...
    }

## Registering Values
The container makes it possible to register values as well.

    class MyObject {
        public MyValue: string;
    }

    container.registerValue(MyObject, { MyValue: "value" });
    const x = resolve(MyObject);
    expect(x.MyValue).toBe("value");

## Registering with a String Key
It's also possible to register anything with a string key instead of a type key. Although in this case, there's no implicit typing.

    container.registerValue("my number", 5);
    const x = resolve<number>("my number"); // Explicit typing.
    expect(x).toBe(5);

## Registration Scopes
There are two registration scopes -- "permanent" and "transient". The permanent scope will create and keep one instance, whereas the transient scope will create a new instance everytime you resolve. The new instances will have all their dependencies correctly injected, so it is possible to mix and match lifetime scopes as you wish.

    abstract class ObjectWithNumValue {
        public abstract MyValue: number;
    }

    class MyTransientObject implements ObjectWithNumValue {
        static Counter = 0;
        public MyValue: number;

        constructor() {
            this.MyValue = MyTransientObject.Counter++;
        }
    }

    container.register(ObjectWithNumValue, MyTransientObject, "transient");

    const x = resolve(ObjectWithNumValue);
    const y = resolve(ObjectWithNumValue);

    expect(x.MyValue).not.toBe(y.MyValue);

## Implicitly typed Constructor Parameters
If you need to provide constructor parameters when registering a type, you can do so using the third parameter of the "register" function, which implicitly infers the type from the provided implementation, so you can never mistakenly provide incorrect parameters.

    abstract class IMyTuple {
        public abstract C5: Class5;
        public abstract get Tuple(): [string, number];
    }

    class MyTuple implements IMyTuple {
        constructor(
            private String: string,
            private Number: number,
            public C5 = resolve(Class5),
        ) { }

        public get Tuple(): [string, number] {
            return [this.String, this.Number];
        }
    }

    container.register(Class5, Class5, "permanent");
    container.register(IMyTuple, MyTuple, "permanent", ["Str", 6]);

    const x = resolve(IMyTuple);

    expect(x.Tuple[0]).toBe("Str");
    expect(x.Tuple[1]).toBe(6);
    expect(x.C5.Field).toBe("5");

## Simple Mocking and Testing
Leveraging default parameters in the constructor makes it very easy to shut off the injection mechanism in tests and simply provide the constructor with your own mock implementation.

    class Class5Mock extends Class5 {};

    new Class3(new Class5Mock()); // The default parameter assignment that calls "resolve" is overriden by the provided mock.
