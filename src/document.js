class Toast {
    #toast;
    #body;

    constructor(id) {
        this.#toast = $(id);
        this.#body = $(`${id}-body`);
    }

    show(message) {
        this.#body.text(message);
        new bootstrap.Toast(this.#toast).show();
    }
}

class Group {
    #elements;

    constructor(...ids) {
        this.#elements = ids.map(id => $(id));
    }

    enable(value = true) {
        this.#elements.forEach(e => e.prop("disabled", !value));
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

    constructor() {
        super({
            card: "#question-card",
            body: "#question-card-body",
        });
    }

    set header(value) {
        this.#header.text(value);
    }

    set title(value) {
        this.#title.text(value);
    }

    set text(value) {
        this.#text.text(value);
    }

    addTextBox({
        text = "", placeholder, keyup,
    }) {
        this._body.html($("<div>", {
            class: "form-floating",
        }).append($("<textarea>", {
            id: "textarea",
            class: "form-control",
            keyup: keyup,
        }).text(
            text
        )).append($("<label>", {
            for: "textarea",
            text: placeholder,
        })));
    }

    #addList(type, ...items) {
        this._body.html($("<ul>", {
            class: "list-group",
        }).append(items.map(({
            text, checked, click
        }, index) => $("<li>", {
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

    addRadioList(...items) {
        this.#addList("radio", ...items);
    }

    addCheckList(...items) {
        this.#addList("checkbox", ...items);
    }

    addSelectList(...items) {
        this._body.html(items.map(({
            text, options, change
        }, index) => {
            return $("<div>", {
                class: "form-group mt-3",
            }).append($("<label>", {
                for: `select-${index}`,
                text: text,
                class: "form-label text-muted small",
            })).append($("<select>", {
                id: `select-${index}`,
                class: "form-select",
                change: change,
            }).append($("<option>", {
                selected: true,
                text: "Selecciona una opción",
            })).append(options.map(({
                text, selected
            }, index) => $("<option>", {
                id: `option-${index}`,
                text: text,
                value: text,
                selected: selected,
            }))));
        }));
    }
}

class ResultsCard extends Card {
    #title = $("#results-card-title");

    constructor() {
        super({
            card: "#results-card",
            body: "#results-card-body",
        });
    }

    set title(value) {
        this.#title.text(value);
    }

    addCard({
        title, text, answer, success, userAnswer
    }) {
        let body = $("<div>", {
            class: "card-body",
        });

        let card = $("<div>", {
            class: `card mt-3 bg-${success ? "success" : "danger"}-subtle`,
        }).append(body.append($("<h6>", {
            class: "card-title",
            text: title,
        })).append($("<p>", {
            class: "card-text",
            text: text,
        })).append($("<p>", {
            class: "card-text text-success small",
            text: answer,
        })));

        if (!success) {
            body.append($("<p>", {
                class: "card-text text-danger small",
                text: userAnswer ? `Tu respuesta: ${userAnswer}` : "Sin respuesta",
            }));
        }

        this._body.append(card.append(body));
    }
}

export {
    Group,
    Toast,
    QuestionCard,
    ResultsCard,
};
