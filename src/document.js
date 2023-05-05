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

class Card {
    constructor({ card, body }) {
        this._card = $(card);
        this._body = $(body);
    }

    show() {
        this._card.show();
    }

    hide() {
        this._card.hide();
    }

    clear() {
        this._body.empty();
    }
}

class QuestionCard extends Card {
    #header = $("#question-card-header");
    #title = $("#question-card-title");
    #text = $("#question-card-text");

    constructor({ header, title, text }) {
        super({
            card: "#question-card",
            body: "#question-card-body",
        });

        this.#header.text(header);
        this.#title.text(title);
        this.#text.text(text);
    }

    addTextBox({
        id, text = "", placeholder, keyup,
    }) {
        this._body.html($("<div>", {
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
        this._body.html($("<ul>", {
            class: "list-group",
        }).append(items.map(({
            index, text, checked, click
        }) => $("<li>", {
            class: "list-group-item d-flex",
        }).append($("<input>", {
            id: `${type}-${index}`,
            type: type,
            name: type,
            class: "form-check-input me-2 col-2",
            click: click,
            checked: checked,
        })).append($("<label>", {
            for: `${type}-${index}`,
            class: "form-check-label stretched-link",
            text: text,
        })))));
    }

    addSelect(...options) {
        this._body.html($("<div>", {
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
            id, text, selected
        }) => $("<option>", {
            value: id,
            text: text,
            selected: selected,
        }))))));
    }
}

class ResultsCard extends Card {
    #title = $("#results-card-title");

    constructor({ title }) {
        super({
            card: "#results-card",
            body: "#results-card-body",
        });

        this.#title.text(title);
    }

    addCard({
        header, title, text, success = true
    }) {
        this._body.append($("<div>", {
            class: `card text-bg-${success ? "success" : "danger"}-subtle`,
        }).append($("<h6>", {
            class: "card-header",
            text: header,
        })).append($("<div>", {
            class: "card-body",
        }).append($("<h6>", {
            class: "card-title",
            text: title,
        })).append($("<p>", {
            class: "card-text",
            text: text,
        }))));
    }
}

export {
    Element,
    ElementGroup,
    Select,
    Toast,
    QuestionCard,
    ResultsCard,
};
