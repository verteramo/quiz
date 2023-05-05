import * as Core from "./core.js";
import * as Document from "./document.js";

$(document).ready(function () {
    var data;
    var current;
    var questions;
    var userAnswers;

    /**
     * @type {Core.Dataset}
     */
    let dataset;

    let categories = new Document.CategorySelect();

    /**
     * Cambio de fichero
     */
    $("#file").change(e => {
        if (e.target.files.length) {
            Document.enableForm();
            dataset = new Core.Dataset(e.target.files, category => categories.add(category));
        }
        else {
            Document.disableForm();
        }
    });

    /**
     * Botón de generar
     */
    $("#generateButton").click(function () {
        current = 0;
        userAnswers = [];

        questions = dataset.generate(
            categories.selected(),
            $("#quantity").val()
        );

        $("#question-card-header").text($("#categories").val());

        changeQuestion();
    });

    /**
     * Cambio de pregunta
     */
    function changeQuestion() {
        if (current >= questions.length) {
            showResults();
        }
        else {
            if (current === questions.length - 1) {
                Document.setNextButtonIcon("mortarboard", "Finalizar");
            }
            else {
                Document.setNextButtonIcon("arrow-right", "Siguiente");
            }

            Document.enablePrevButton(current === 0);

            //let [question, answer] = questions[current];

            `Pregunta ${current + 1} de ${questions.length}`

            let questionCard = new Document.QestionCard(questions[current]);
            questionCard.clearAnswers();

            let answer = questions[current].getAnswer();

            // Si la respuesta es un string
            if (answer.isString()) {
                questionCard.addTextBox({
                    id: current,
                    text: userAnswers[current],
                    placeholder: "Respuesta",
                    keyup: e => userAnswers[current] = e.target.value,
                });
            }

            // Si la respuesta es true/false
            else if (answer.isBoolean()) {
                questionCard.addList("radio", {
                    id: 0,
                    text: "Verdadero",
                    checked: userAnswers[current] === true,
                    click: e => userAnswers[current] = true,
                }, {
                    id: 1,
                    text: "Falso",
                    checked: userAnswers[current] === false,
                    click: e => userAnswers[current] = false,
                });
            }

            // Si la respuesta es de emparejamiento
            else if (answer.isMatching()) {
                questionCard.addSelect(...answer.getMatchings((match, index) => ({
                    id: index,
                    text: match,
                    options: answer.getOptions(),
                })));
            }

            // Si la respuesta es de selección única
            else if (answer.isSingle()) {
                questionCard.addList("radio", ...answer.getTexts().map((text, index) => ({
                    id: index,
                    text: text,
                    checked: userAnswers[current] === index,
                    click: e => userAnswers[current] = index,
                })));
            }

            // Si la respuesta es de selección múltiple
            else {
                questionCard.addList("checkbox", ...answer.getTexts().map((text, index) => ({
                    id: index,
                    text: text,
                    checked: userAnswers[current] instanceof Array &&
                        userAnswers[current][index] === true,
                    click: e => {
                        if (!(userAnswers[current] instanceof Array)) {
                            userAnswers[current] = [];
                            userAnswers[current].length = answer.data.length;
                            userAnswers[current].fill(null);
                        }
                        userAnswers[current][index] = e.target.checked;
                    },
                })));
            }
        }
    }

    /**
     * Switch dark mode
     */
    $("#dark-switch").change(function () {
        if ($(this).is(":checked")) {
            $("html").attr("data-bs-theme", "dark");
        } else {
            $("html").removeAttr("data-bs-theme");
        }
    });

    /**
     * Siguiente pregunta
     */
    $("#next-button").click(function () {
        current++;
        changeQuestion();
    });

    /**
     * Anterior pregunta
     */
    $("#prev-button").click(function () {
        current--;
        changeQuestion();
    });

    /**
     * Botón de copiar
     */
    $("#clipboard-button").click(function () {
        navigator.clipboard.writeText($("#question-card-text").text().trim()).then(() => {
            showToast("Pregunta copiada al portapapeles.");
        }, () => {
            showToast("No se ha podido copiar la pregunta al portapapeles.");
        });
    });

    /**
     * Buscar en DuckDuckGo
     */
    $("#duck-button").click(function () {
        window.open(`https://duckduckgo.com/?q=${$("#question-card-text").text().trim()}`, "_blank");
    });

    /**
     * Buscar en Google
     */
    $("#google-button").click(function () {
        window.open(`https://www.google.com/search?q=${$("#question-card-text").text().trim()}`, "_blank");
    });

    /**
     * Buscar en Bing
     */
    $("#bing-button").click(function () {
        window.open(`https://www.bing.com/search?q=${$("#question-card-text").text().trim()}`, "_blank");
    });

    function getCard({
        index, text, success = true
    }) {
        return $("<div>", {
            class: `card text-bg-${success ? "success" : "danger"}-subtle`,
        }).append($("<h6>", {
            class: "card-header",
            text: `Pregunta ${index + 1} de ${questions.length}`,
        })).append($("<div>", {
            class: "card-body",
        }).append($("<h6>", {
            class: "card-title",
            text: text,
        })).append($("<p>", {
            class: "card-text",
            text: a,
        })));
    }

    function showResults() {
        let correctAnswers = 0;

        $("#results-card-cards").empty();

        questions.forEach((question, index) => {
            var answer = question.getAnswer();
            var userAnswer = userAnswers[index];

            if (answer.isString() || answer.isBoolean()) {
                let value = answer.data;
                if (answer.isString()) {
                    value = value.toLowerCase();
                }

                if (userAnswer === value) {
                    correctAnswers++;
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                    }));
                }
                else {
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                        success: false,
                    }));
                }
            }

            else if (answer.isMatching()) {
                var correct = true;
                answer.data.forEach(([answer, option]) => {
                    if (userAnswer[answer] !== option) {
                        correct = false;
                    }
                });
                if (correct) {
                    correctAnswers++;
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                    }));
                }
                else {
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                        success: false,
                    }));
                }
            }

            else if (answer.isSingle()) {
                let rightIndex = answer.data.findIndex(([, truth]) => truth);

                if (userAnswer === rightIndex) {
                    correctAnswers++;
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                    }));
                }
                else {
                    $("#results-card-cards").append(getCard({
                        index: index,
                        question: question.getText(),
                        success: false,
                    }));
                }
            }
            else {

            }
        });

        $("#results-card-title").text(`Resultado: ${correctAnswers}/${questions.length}`);
        $("#question-card").hide();
        $("#results-card").show();
    }
});