class Toast {
    #toast;
    #body;

    constructor(id) {
        let [toast] = $(id);
        this.#toast = toast;
        this.#body = $(`${id}-body`);
    }

    show(message) {
        this.#body.text(message);
        new bootstrap.Toast(this.#toast).show();
    }
}

class Element {
    _element;

    constructor(id) {
        this._element = $(id);
    }

    show() {
        this._element.show();
    }

    hide() {
        this._element.hide();
    }

    clear() {
        this._element.empty();
    }

    enable(value = true) {
        this._element.prop("disabled", !value);
    }

    value() {
        return this._element.val();
    }

    icon(name, title) {
        this._element.html($("<i>", {
            class: `bi bi-${name}`,
            title: title,
        }));
    }

    onClick(handler) {
        this._element.click(handler);
    }

    onChange(handler) {
        this._element.change(handler);
    }
}

class ElementGroup {
    _elements;

    constructor(...ids) {
        this._elements = ids.map(id => new Element(id));
    }

    enable(value = true) {
        this._elements.forEach(element => element.enable(value));
    }
}

class Select extends Element {
    add(name) {
        this._element.append($("<option>", {
            value: name,
            text: name
        }));
    }
}

class QuestionCard {
    #card = $("#question-card");
    #header = $("#question-card-header");
    #title = $("#question-card-title");
    #text = $("#question-card-text");
    #answer = $("#question-card-answer");

    constructor({ header, title, text }) {
        this.#header.text(header);
        this.#title.text(title);
        this.#text.text(text);
    }

    show() {
        this.#card.show();
    }

    hide() {
        this.#card.hide();
    }

    clear() {
        this.#answer.empty();
    }

    addTextBox({
        id, text = "", placeholder, keyup,
    }) {
        this.#answer.html($("<div>", {
            class: "form-floating",
        }).append($("<textarea>", {
            id: `textarea-${id}`,
            class: "form-control",
            keyup: keyup,
        }).text(
            text
        )).append($("<label>", {
            for: `textarea-${id}`,
            text: placeholder,
        })));
    }

    addList(type, ...items) {
        this.#answer.html($("<ul>", {
            class: "list-group list-group-flush",
        }).append(items.map(({
            id, text, checked, click
        }) => $("<li>", {
            class: "list-group-item d-flex",
        }).append($("<input>", {
            id: `${type}-${id}`,
            type: type,
            name: type,
            class: "form-check-input me-2 col-2",
            checked: checked,
        })).append($("<label>", {
            for: `${type}-${id}`,
            class: "form-check-label stretched-link",
            text: text,
            click: click,
        })))));
    }

    addSelect(...options) {
        this.#answer.html($("<div>", {
            class: "d-flex flex-column",
        }).append($("<div>", {
            class: "form-group",
        }).append($("<select>", {
            id: "select",
            class: "form-select",
        }).append($("<option>", {
            disabled: true,
            selected: true,
            text: "Selecciona una opción",
        })).append(options.map(({
            id, text, onSelectedHandler
        }) => $("<option>", {
            value: id,
            text: text,
            selected: onSelectedHandler,
        }))))));
    }
}

export {
    Element,
    ElementGroup,
    Select,
    Toast,
    QuestionCard,
};
