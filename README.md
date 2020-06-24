# MVC-TSX  (alpha version)
![CI status](https://circleci.com/gh/eprincev-egor/mvc-tsx.svg?style=shield)

With MVC-TSX you can write imperative code for creating reactive applications.

```tsx
import React from "react";
import * as ReactDOM from "react-dom";
import {Model, View, Controller, on, arg} from "mvc-tsx";

// define Model
class LoginModel extends Model {
    login: string = "";
    password: string = "";
}

// define Controller
class LoginController extends Controller<LoginModel> {

    @on("change", ".Login--loginInput")
    onChangeLogin( @arg("target", "value") inputValue ) {
        this.model.set({
            login: inputValue
        });
    }

    @on("change", ".Login--passInput")
    onChangePassword( @arg("target", "value") inputValue ) {
        this.model.set({
            password: inputValue
        });
    }

    @on("click", ".User--loginBtn")
    onClickLogin() {
        const {login, password} = this.model;
        // do login ...
    }
}

// define View
class LoginView extends View<LoginModel> {
    
    // list of Controllers
    controllers() {
        return [
            LoginController
        ];
    }

    template(loginModel: LoginModel>) {
        return (<div className="Login">
            <input className="Login--loginInput"/>
            <input className="Login--passInput"/>
        </div>);
    }

}

// and render
const loginModel = new LoginModel();

ReactDOM.render(
    <LoginView model={loginModel}/>,
    document.getElementById("root")
);

```

# Downloads

[minify + React + EventEmitter + MVC](https://raw.githubusercontent.com/eprincev-egor/mvc-tsx/master/bundle/mvc-and-deps.min.js)  

[React + EventEmitter + MVC](https://raw.githubusercontent.com/eprincev-egor/mvc-tsx/master/bundle/mvc-and-deps.full.js)  

[minify + MVC](https://raw.githubusercontent.com/eprincev-egor/mvc-tsx/master/bundle/only-mvc.min.js)  

[MVC](https://raw.githubusercontent.com/eprincev-egor/mvc-tsx/master/bundle/only-mvc.full.js)  

# Examples
[clock](https://github.com/eprincev-egor/mvc-tsx/tree/master/examples/clock)  
[counter](https://github.com/eprincev-egor/mvc-tsx/tree/master/examples/counter)  
[cart](https://github.com/eprincev-egor/mvc-tsx/tree/master/examples/cart)  
[TodoMVC](https://github.com/eprincev-egor/mvc-tsx/tree/master/examples/TodoMVC)  
