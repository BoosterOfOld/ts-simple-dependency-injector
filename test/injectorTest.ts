import "jasmine";
import { Container } from "../src/injector";

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
})
