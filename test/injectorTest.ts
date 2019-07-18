import "jasmine";
import { Container } from "../src";

let container: Container;
let resolve: typeof container.resolve;

class CascadingClass1 {
    public readonly Field = "1";
    constructor(
        public cc2 = resolve(CascadingClass2),
        public cc3 = resolve(CascadingClass3),
    ) {

    }
}

class CascadingClass2 {
    public readonly Field = "2";
    constructor(
        public cc4 = resolve(CascadingClass4),
    ) {

    }
}

class CascadingClass3 {
    public readonly Field = "3";
    constructor(
        public cc5 = resolve(CascadingClass5),
    ) {

    }
}

class CascadingClass4 {
    public readonly Field = "4";
}

class CascadingClass5 {
    public readonly Field = "5";
}

abstract class PureAbstractClass {
    public abstract get Cc1(): CascadingClass1;
}

class PureAbstractClassImplementation implements PureAbstractClass {
    constructor(
        private cc1 = resolve(CascadingClass1),
    ) {

    }
    public get Cc1() {
        return this.cc1;
    }
}

class MyObject {
    public MyValue: string;
}

abstract class ObjectWithNumValue {
    public abstract MyValue: number;
}

abstract class IMyTuple {
    public abstract Cc5: CascadingClass5;
    public abstract get Tuple(): [string, number];
}

class MyTuple implements IMyTuple {
    constructor(
        private String: string,
        private Number: number,
        public Cc5 = resolve(CascadingClass5),
    ) { }

    public get Tuple(): [string, number] {
        return [this.String, this.Number];
    }
}

class MyTransientObject implements ObjectWithNumValue {
    static Counter = 0;
    public MyValue: number;

    constructor() {
        this.MyValue = MyTransientObject.Counter++;
    }
}

describe("Injector", () => {
    beforeEach(() => {
        container = new Container();
        resolve = container.getResolver();
    })

    it("should register the composition tree and resolve types from the root", () => {
        container.register(CascadingClass4, CascadingClass4, "permanent");
        container.register(CascadingClass5, CascadingClass5, "permanent");

        container.register(CascadingClass2, CascadingClass2, "permanent");
        container.register(CascadingClass3, CascadingClass3, "permanent");

        container.register(CascadingClass1, CascadingClass1, "permanent");

        container.register(PureAbstractClass, PureAbstractClassImplementation, "permanent");

        let x = resolve(PureAbstractClass);

        expect(x.Cc1.Field).toBe("1");
        expect(x.Cc1.cc2.Field).toBe("2");
        expect(x.Cc1.cc3.Field).toBe("3");
        expect(x.Cc1.cc2.cc4.Field).toBe("4");
        expect(x.Cc1.cc3.cc5.Field).toBe("5");
    })

    it("should fail to compose and resolve is a composition tree node is missing", () => {
        container.register(CascadingClass4, CascadingClass4, "permanent");
        // container.register(CascadingClass5, CascadingClass5, "permanent");

        container.register(CascadingClass2, CascadingClass2, "permanent");

        expect(() => container.register(CascadingClass3, CascadingClass3, "permanent")).toThrow(new Error("Cannot resolve type CascadingClass5."));
        expect(() => container.register(CascadingClass1, CascadingClass1, "permanent")).toThrow(new Error("Cannot resolve type CascadingClass3."));

        expect(() => container.register(PureAbstractClass, PureAbstractClassImplementation, "permanent")).toThrow(new Error("Cannot resolve type CascadingClass1."));

        let x: PureAbstractClass | undefined;

        expect(() => x = resolve(PureAbstractClass)).toThrow(new Error("Cannot resolve type PureAbstractClass."));

        expect(x).toBe(undefined);
    })

    it("should register and resolve values (string keying)", () => {
        container.registerValue("my number", 5);

        const x = resolve<number>("my number");

        expect(x).toBe(5);
    })

    it("should register and resolve values (type keying)", () => {
        container.registerValue(MyObject, { MyValue: "value" });

        const x = resolve(MyObject);

        expect(x.MyValue).toBe("value");
    })

    it("should register and resolve transient types", () => {
        container.register(ObjectWithNumValue, MyTransientObject, "transient");

        const x = resolve(ObjectWithNumValue);
        const y = resolve(ObjectWithNumValue);

        expect(x.MyValue).not.toBe(y.MyValue);
    })

    it("should register and resolve permanent types", () => {
        container.register(ObjectWithNumValue, MyTransientObject, "permanent");

        const x = resolve(ObjectWithNumValue);
        const y = resolve(ObjectWithNumValue);

        expect(x.MyValue).toBe(y.MyValue);
    })

    it("should register and resolve with constructor parameters (permanent)", () => {
        container.register(CascadingClass5, CascadingClass5, "permanent");

        // The type of the third parameter here is [string, number, Class5?].
        // Class5 is resolved from the container.
        container.register(IMyTuple, MyTuple, "permanent", ["Str", 6]);

        const x = resolve(IMyTuple);

        expect(x.Tuple[0]).toBe("Str");
        expect(x.Tuple[1]).toBe(6);
        expect(x.Cc5.Field).toBe("5");
    })

    it("should register and resolve with constructor parameters (transient)", () => {
        container.register(CascadingClass5, CascadingClass5, "transient");
        container.register(IMyTuple, MyTuple, "transient", ["Str", 6]);

        const x = resolve(IMyTuple);

        expect(x.Tuple[0]).toBe("Str");
        expect(x.Tuple[1]).toBe(6);
        expect(x.Cc5.Field).toBe("5");
    })
})
