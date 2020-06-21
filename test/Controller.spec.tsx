import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { JSDOM } from "jsdom";
import { act } from "react-dom/test-utils";
import assert from "assert";
import { Controller, View, Model, on, arg } from "../lib";
import { DOMListener } from "../lib/DOMListener";

describe("Controller", () => {
    const dom = new JSDOM("<!DOCTYPE html><body></body>");
    global.document = dom.window.document;
    (global as any).window = dom.window;

    let container!: HTMLDivElement;

    beforeEach(() => {
        // подготавливаем DOM-элемент, куда будем рендерить
        container = document.createElement("div");
        document.body.appendChild(container);
    });
    
    afterEach(() => {
        // подчищаем после завершения
        unmountComponentAtNode(container);
        container.remove();
        (container as any) = null;
    });

    it("listen click on button", () => {
        class MyModel extends Model {
            counter: number = 0;
        }

        class MyController extends Controller<MyModel> {
            @on("click", ".button")
            onClickButton() {
                this.model.set({
                    counter: this.model.counter + 1
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div>
                    <div className="counter">{model.counter}</div>
                    <button className="button"></button>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const buttonEl = document.querySelector(".button") as HTMLButtonElement;
        const counterEl = document.querySelector(".counter") as HTMLDivElement;

        const clickEvent = new window.Event("click", {bubbles: true});
        buttonEl.dispatchEvent(clickEvent);

        assert.strictEqual(counterEl.textContent, "1");
    });

    it("listen model change", () => {
        class MyModel extends Model {
            a: number = 0;
            b: number = 0;
            c: number = 0;
        }

        class MyController extends Controller<MyModel> {
            @on("change", "model")
            onChangeModel(changes: MyModel) {
                this.model.set({
                    c: this.model.a + this.model.b
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div>
                    <div className="a">{model.a}</div>
                    <div className="b">{model.b}</div>
                    <div className="c">{model.c}</div>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const aEl = document.querySelector(".a") as HTMLDivElement;
        const bEl = document.querySelector(".b") as HTMLDivElement;
        const cEl = document.querySelector(".c") as HTMLDivElement;

        testModel.set({
            a: 1,
            b: 2
        });

        assert.strictEqual(aEl.textContent, "1");
        assert.strictEqual(bEl.textContent, "2");
        assert.strictEqual(cEl.textContent, "3");
    });

    it("listen model change without view", () => {
        class MyModel extends Model {
            a: number = 0;
            b: number = 0;
            c: number = 0;
        }

        class MyController extends Controller<MyModel> {
            @on("change", "model")
            onChangeModel(changes: MyModel) {
                this.model.set({
                    c: this.model.a + this.model.b
                });
            }
        }

        const model = new MyModel();
        const controller = new MyController(model);

        model.set({
            a: 10,
            b: 15
        });

        assert.strictEqual(model.c, 25);
    });

    it("listen input change and get input value from event.target", () => {
        class MyModel extends Model {
            name: string | undefined;
        }

        class MyController extends Controller<MyModel> {
            @on("change", ".input")
            onChangeInput(@arg("target", "value") inputValue: string) {
                this.model.set({
                    name: inputValue
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div>
                    <div className="input" defaultValue=""/>
                    <div className="name">{model.name}</div>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const inputEl = document.querySelector(".input") as HTMLInputElement;
        const nameEl = document.querySelector(".name") as HTMLDivElement;

        const changeEvent = new window.Event("change", {bubbles: true});
        inputEl.value = "hello";
        inputEl.dispatchEvent(changeEvent);

        assert.strictEqual(nameEl.textContent, "hello");
    });

    it("get child model from event", () => {
        class UserModel extends Model {
            id: number;
            name: string;

            constructor(id: number, name: string) {
                super();

                this.id = id;
                this.name = name;
            }
        }

        class UsersCollection extends Model {
            users: UserModel[];
            clicked: UserModel | undefined;

            constructor(users: UserModel[]) {
                super();
                this.users = users;
            }

            getClickedUser() {
                const clicked = this.clicked as UserModel;
                return {
                    id: clicked.id,
                    name: clicked.name
                };
            }
        }

        class UserView extends View<UserModel> {
            template(user: UserModel) {
                return <div className="User">#{user.id} {user.name}</div>;
            }
        }

        class MyController extends Controller<UsersCollection> {
            @on("click", ".User")
            onClickUser(@arg(UserModel) user: UserModel) {
                this.model.set({
                    clicked: user
                });
            }
        }

        class UsersCollectionView extends View<UsersCollection> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(collection: UsersCollection) {
                return <div>{collection.users.map(user =>
                    <UserView model={user}/>
                )}</div>;
            }
        }

        const bob = new UserModel(1, "Bob");
        const oliver = new UserModel(2, "Oliver");
        const usersCollection = new UsersCollection([
            bob,
            oliver
        ]);

        act(() => {
            render(<UsersCollectionView model={usersCollection}/>, container);
        });

        const usersEls = document.querySelectorAll(".User");
        const bobEl = usersEls[0] as HTMLDivElement;
        const oliverEl = usersEls[1] as HTMLDivElement;


        const bobClickEvent = new window.Event("click", {bubbles: true});
        bobEl.dispatchEvent(bobClickEvent);
        assert.deepStrictEqual(usersCollection.getClickedUser(), {
            id: 1,
            name: "Bob"
        });

        const oliverClickEvent = new window.Event("click", {bubbles: true});
        oliverEl.dispatchEvent(oliverClickEvent);
        assert.deepStrictEqual(usersCollection.getClickedUser(), {
            id: 2,
            name: "Oliver"
        });

    });

    it("using two args of event", () => {
        class MyModel extends Model {
            x: number = 0;
            y: number = 0;
        }

        class MyController extends Controller<MyModel> {
            @on("mousemove", ".area")
            onChangeInput(
                @arg("clientX") x: number,
                @arg("clientY") y: number
            ) {
                this.model.set({
                    x,
                    y
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div className="area">
                    <div className="x">{model.x}</div>
                    <div className="y">{model.y}</div>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const areaEl = document.querySelector(".area") as HTMLDivElement;
        const xEl = document.querySelector(".x") as HTMLDivElement;
        const yEl = document.querySelector(".y") as HTMLDivElement;

        const mouseMoveEvent = new window.Event("mousemove", {bubbles: true});
        (mouseMoveEvent as any).clientX = 100;
        (mouseMoveEvent as any).clientY = 100;
        areaEl.dispatchEvent(mouseMoveEvent);

        assert.strictEqual(xEl.textContent, "100");
        assert.strictEqual(yEl.textContent, "100");
    });

    it("using controller without events", () => {
        class MyModel extends Model {
            value: number = 0;
        }

        class MyController extends Controller<MyModel> {
            constructor(model: MyModel) {
                super(model);
                
                model.set({
                    value: 30
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div className="value">{model.value}</div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const valueEl = document.querySelector(".value") as HTMLDivElement;

        assert.strictEqual(valueEl.textContent, "30");
    });

    it("listen two events", () => {
        class MyModel extends Model {
            clicks: number = 0;
        }

        class MyController extends Controller<MyModel> {
            @on("click", ".left-button")
            onClickLeftButton() {
                this.bumpClicks();
            }

            @on("click", ".right-button")
            onClickRightButton() {
                this.bumpClicks();
            }

            bumpClicks() {
                this.model.set({
                    clicks: this.model.clicks + 1
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div className="area">
                    <div className="clicks">{model.clicks}</div>
                    <button className="left-button"></button>
                    <button className="right-button"></button>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const clicksEl = document.querySelector(".clicks") as HTMLDivElement;
        const leftButtonEl = document.querySelector(".left-button") as HTMLDivElement;
        const rightButtonEl = document.querySelector(".right-button") as HTMLDivElement;

        const clickLeftEvent = new window.Event("click", {bubbles: true});
        leftButtonEl.dispatchEvent(clickLeftEvent);

        assert.strictEqual(clicksEl.textContent, "1");

        const clickRightEvent = new window.Event("click", {bubbles: true});
        rightButtonEl.dispatchEvent(clickRightEvent);

        assert.strictEqual(clicksEl.textContent, "2");
    });

    it("using @arg() with long property path", () => {
        class MyModel extends Model {
            parentClassName: string = "";
        }

        class MyController extends Controller<MyModel> {
            @on("click", ".btn")
            onChangeInput(
                @arg("target", "parentNode", "className") 
                parentClassName: string
            ) {
                this.model.set({
                    parentClassName
                });
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div>
                    <div className="parentClassName">{model.parentClassName}</div>
                    <div className="left">
                        <div className="btn"></div>
                    </div>
                    <div className="right">
                        <div className="btn"></div>
                    </div>
                </div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const parentClassEl = document.querySelector(".parentClassName") as HTMLDivElement;
        const leftButtonEl = document.querySelector(".left .btn") as HTMLDivElement;
        const rightButtonEl = document.querySelector(".right .btn") as HTMLDivElement;

        const leftClickEvent = new window.Event("click", {bubbles: true});
        leftButtonEl.dispatchEvent(leftClickEvent);

        assert.strictEqual(parentClassEl.textContent, "left");

        const rightClickEvent = new window.Event("click", {bubbles: true});
        rightButtonEl.dispatchEvent(rightClickEvent);

        assert.strictEqual(parentClassEl.textContent, "right");
    });


    it("cannot find model of event", () => {
        class MyModel extends Model {}
        class UnknownModel extends Model {}

        let hasCall = false;
        class MyController extends Controller<MyModel> {
            /* istanbul ignore next */
            @on("click", ".some")
            onClickButton(@arg(UnknownModel) model: UnknownModel) {
                hasCall = true;
            }
        }

        class MyView extends View<MyModel> {
            controllers() {
                return [
                    MyController
                ];
            }

            template(model: MyModel) {
                return <div className="some"></div>
            }
        }

        const testModel = new MyModel();
        act(() => {
            render(<MyView model={testModel}/>, container);
        });

        const someEl = document.querySelector(".some") as HTMLDivElement;

        let err: any = new Error("default error");
        window.onerror = (_err) => {
            err = _err;
        };

        const clickEvent = new window.Event("click", {bubbles: true});
        someEl.dispatchEvent(clickEvent);

        assert.strictEqual(hasCall, false);
    });

    it("stop listen dom events after destroy component", () => {
        let controllerCallsCount = 0;
        let domCallsCount = 0;

        const original = (DOMListener as any).prototype.onDOMEvent;
        (DOMListener as any).prototype.onDOMEvent = function(...args: any[]) {
            domCallsCount++;
            original.call(this, ...args);
        };

        class ChildModel extends Model {}
        class ParentModel extends Model {
            renderElement: boolean = true;
            child: ChildModel = new ChildModel();
        }

        class ChildController extends Controller<ChildModel> {
            @on("click", ".button")
            onClickButton() {
                controllerCallsCount++;
            }
        }

        class ChildView extends View<ChildModel> {
            controllers() {
                return [
                    ChildController
                ];
            }

            template(model: ChildModel) {
                return <div>
                    <button className="button"></button>
                </div>
            }
        }

        class ParentView extends View<ParentModel> {
            template(model: ParentModel) {
                if ( model.renderElement ) {
                    return <ChildView model={model.child}></ChildView>
                }
                else {
                    return <div></div>
                }
            }
        }

        const testModel = new ParentModel();
        act(() => {
            render(<ParentView model={testModel}/>, container);
        });

        const buttonEl = document.querySelector(".button") as HTMLButtonElement;

        const clickEvent1 = new window.Event("click", {bubbles: true});
        buttonEl.dispatchEvent(clickEvent1);

        assert.strictEqual(controllerCallsCount, 1, "first controller call");
        assert.strictEqual(domCallsCount, 1, "first dom call");

        testModel.set({
            renderElement: false
        });

        const clickEvent2 = new window.Event("click", {bubbles: true});
        buttonEl.dispatchEvent(clickEvent2);

        assert.strictEqual(controllerCallsCount, 1, "second controller call");
        assert.strictEqual(domCallsCount, 1, "second dom call");

        (DOMListener as any).prototype.onDOMEvent = original;
    });

    it("stop listen model events after destroy component", () => {
        let controllerCallsCount = 0;

        class ChildModel extends Model {
            value: number = 0;
        }

        class ParentModel extends Model {
            renderElement: boolean = true;
            child: ChildModel = new ChildModel();
        }

        class ChildController extends Controller<ChildModel> {
            @on("change", "model")
            onClickButton() {
                controllerCallsCount++;
            }
        }

        class ChildView extends View<ChildModel> {
            controllers() {
                return [
                    ChildController
                ];
            }

            template(model: ChildModel) {
                return <div></div>
            }
        }

        class ParentView extends View<ParentModel> {
            template(model: ParentModel) {
                if ( model.renderElement ) {
                    return <ChildView model={model.child}></ChildView>
                }
                else {
                    return <div></div>
                }
            }
        }

        const testModel = new ParentModel();
        act(() => {
            render(<ParentView model={testModel}/>, container);
        });

        testModel.child.set({
            value: 1
        });

        assert.strictEqual(controllerCallsCount, 1, "first model change");

        testModel.set({
            renderElement: false
        });

        testModel.child.set({
            value: 2
        });

        assert.strictEqual(controllerCallsCount, 1, "second model change");
    });


    it("selector should be simple className selector or model", () => {
        class MyModel extends Model {}

        assert.throws(() => {
            class MyController extends Controller<MyModel> {
                @on("click", ".button some")
                onClickButton() {
                    // 
                }
            }
        }, err =>
            err.message === `invalid selector ".button some", selector should be just ".some-class" or "model"`
        );


        assert.throws(() => {
            class MyController extends Controller<MyModel> {
                @on("click", ".button>some")
                onClickButton() {
                    // 
                }
            }
        }, err =>
            err.message === `invalid selector ".button>some", selector should be just ".some-class" or "model"`
        );

        assert.throws(() => {
            class MyController extends Controller<MyModel> {
                @on("click", ".button,.x")
                onClickButton() {
                    // 
                }
            }
        }, err =>
            err.message === `invalid selector ".button,.x", selector should be just ".some-class" or "model"`
        );
    });


});