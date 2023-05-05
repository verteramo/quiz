/**
 * Habilita el formulario
 */
function enableForm() {
    $("#quantity").removeAttr("disabled");
    $("#categories").removeAttr("disabled");
    $("#generateButton").removeAttr("disabled");
}

/**
 * Deshabilita el formulario
 */
function disableForm() {
    $("#categories").empty();
    $("#quantity").attr("disabled", "disabled");
    $("#categories").attr("disabled", "disabled");
    $("#generateButton").attr("disabled", "disabled");
}

function showQuestionCard() {
    if ($("#question-card").is(":hidden")) {
        $("#question-card").show();
    }

    if ($("#results-card").is(":visible")) {
        $("#results-card").hide();
    }
}

function setNextButtonIcon(name, title) {
    $("#next-button").html($("<i>", {
        class: `bi bi-${name}`,
        title: title,
    }));
}

function enablePrevButton(enabled = true) {
    $("#prev-button").prop("disabled", enabled);
}

function showToast(message) {
    $("#toast-body").text(message);
    (new bootstrap.Toast($("#toast")[0])).show();
}

class CategorySelect {
    constructor() {
        this.categories = $("#categories");
    }

    clear() {
        this.categories.empty();
    }

    add(name) {
        this.categories.append($("<option>", {
            value: name,
            text: name
        }));
    }

    selected() {
        return this.categories.val();
    }
}

class QuestionCard {
    #setHeader(header) {
        $("#question-card-header").text(header);
    }

    #setTitle(title) {
        $("#question-card-title").text(title);
    }

    #setText(text) {
        $("#question-card-text").text(text);
    }

    constructor({ category, title, question: text }) {
        this.#setHeader(category);
        this.#setTitle(title);
        this.#setText(text);
    }

    show() {
        $("#question-card").show();
    }

    hide() {
        $("#question-card").hide();
    }

    clear() {
        $("#question-card-answer").empty();
    }

    addTextBox({
        id, text = "", placeholder, keyup,
    }) {
        $("#question-card-answer").append($("<div>", {
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
        $("#question-card-answer").append($("<ul>", {
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
        $("#question-card-answer").append($("<div>", {
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
    CategorySelect,
    QuestionCard,
    enableForm,
    disableForm,
    showToast,
    showQuestionCard,
    setNextButtonIcon,
    enablePrevButton,
};
