import * as Core from "./core.js";
import * as Document from "./document.js";

$(document).ready(function () {
    var current;
    var questions;
    var userAnswers;

    let test;

    let categories = new Document.Select("#select-category");
    let quantity = new Document.Element("#input-text-quantity");
    let darkSwitch = new Document.Element("#dark-switch");
    let nextButton = new Document.Element("#next-button");
    let prevButton = new Document.Element("#prev-button");
    let toast = new Document.Toast("#toast");

    let fields = new Document.ElementGroup(
        "#input-text-quantity",
        "#select-category",
        "#generate-button",
    );

    /**
     * @type {Core.Dataset}
     */
    let dataset;

    darkSwitch.onChange(e => {
        if ($(e.target).is(":checked")) {
            $("html").attr("data-bs-theme", "dark");
        } else {
            $("html").removeAttr("data-bs-theme");
        }
    });

    /**
     * Cambio de fichero
     */
    $("#input-file").change(e => {
        categories.clear();
        if (e.target.files.length) {
            fields.enable();
            dataset = new Core.Dataset(e.target.files, category => categories.add(category));
        }
        else {
            fields.enable(false);
        }
    });

    /**
     * Botón de generar
     */
    $("#generate-button").click(e => {
        test = dataset.generate(categories.value(), quantity.value(),);
        changeQuestion();
    });

    $("#next-button").click(e => {
        test.next();
        changeQuestion();
    });

    $("#prev-button").click(e => {
        test.prev();
        changeQuestion();
    });

    /**
     * Cambio de pregunta
     */
    function changeQuestion() {
        if (test.isFinished()) {
            showResults();
        }
        else {
            nextButton.icon(...(test.isLast()
                ? ["check2", "Finalizar"]
                : ["arrow-right", "Siguiente"]
            ));

            prevButton.enable(!test.isFirst());

            let questionCard = new Document.QuestionCard({
                header: categories.value(),
                title: `Pregunta ${test.current} de ${test.length}`,
                text: test.question.getText(),
            });

            let answer = test.question.getAnswer();

            // Si la respuesta es un string
            if (answer.isString()) {
                questionCard.addTextBox({
                    id: current,
                    text: test.userAnswer,
                    placeholder: "Respuesta",
                    keyup: e => test.userAnswer = e.target.value,
                });
            }

            // Si la respuesta es true/false
            else if (answer.isBoolean()) {
                questionCard.addList("radio", {
                    id: 0,
                    text: "Verdadero",
                    checked: test.userAnswer === true,
                    click: e => test.userAnswer = true,
                }, {
                    id: 1,
                    text: "Falso",
                    checked: test.userAnswer === false,
                    click: e => test.userAnswer = false,
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
                    checked: test.userAnswer === index,
                    click: e => test.userAnswer = index,
                })));
            }

            // Si la respuesta es de selección múltiple
            else {
                questionCard.addList("checkbox", ...answer.getTexts().map((text, index) => ({
                    id: index,
                    text: text,
                    checked: test.userAnswer instanceof Array &&
                        test.userAnswer[index] === true,
                    click: e => {
                        if (!(test.userAnswer instanceof Array)) {
                            test.userAnswer = [];
                            test.userAnswer.length = answer.data.length;
                            test.userAnswer.fill(null);
                        }
                        test.userAnswer[index] = e.target.checked;
                    },
                })));
            }
        }
    }

    /**
     * Botón de copiar
     */
    $("#clipboard-button").click(function () {
        navigator.clipboard.writeText($("#question-card-text").text().trim()).then(() => {
            toast.show("Pregunta copiada al portapapeles.");
        }, () => {
            toast.show("No se ha podido copiar la pregunta al portapapeles.");
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