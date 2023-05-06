import * as Core from "./core.js";
import { Toast, Group, QuestionCard, ResultsCard } from "./document.js";

$(document).ready(function () {

    let questionCard = new QuestionCard();
    let resultsCard = new ResultsCard();

    let html = $("html");
    let toast = new Toast("#toast");

    let darkSwitch = $("#dark-switch");
    let nextButton = $("#next-button");
    let prevButton = $("#prev-button");
    let duckButton = $("#duck-button");
    let bingButton = $("#bing-button");
    let googleButton = $("#google-button");
    let clipboardButton = $("#clipboard-button");

    let inputFile = $("#input-file");
    let quantity = $("#input-quantity");
    let categories = $("#select-category");
    let generateButton = $("#generate-button");

    let fields = new Group(
        "#input-quantity",
        "#select-category",
        "#generate-button",
    );

    let test;
    let dataset;

    questionCard.hide();
    resultsCard.hide();

    darkSwitch.change(e => {
        if (e.target.checked) {
            html.attr("data-bs-theme", "dark");
        } else {
            html.removeAttr("data-bs-theme");
        }
    });

    inputFile.change(e => {
        categories.empty();
        if (e.target.files.length) {
            fields.enable();
            dataset = new Core.Dataset(e.target.files, category => categories.append($("<option>", {
                value: category,
                text: category,
            })));
        }
        else {
            fields.enable(false);
        }
    });

    generateButton.click(e => {
        test = dataset.generate(categories.val(), quantity.val(),);
        changeQuestion();
    });

    nextButton.click(e => {
        test.next();
        changeQuestion();
    });

    prevButton.click(e => {
        test.prev();
        changeQuestion();
    });

    duckButton.click(e => {
        window.open(`https://duckduckgo.com/?q=${test.question.text.trim()}`, "_blank");
    });

    bingButton.click(e => {
        window.open(`https://www.bing.com/search?q=${test.question.text.trim()}`, "_blank");
    });

    googleButton.click(e => {
        window.open(`https://www.google.com/search?q=${test.question.text.trim()}`, "_blank");
    });

    clipboardButton.click(e => {
        navigator.clipboard.writeText(test.question.text.trim()).then(() => {
            toast.show("Pregunta copiada al portapapeles.");
        }, () => {
            toast.show("No se ha podido copiar la pregunta al portapapeles.");
        });
    });

    function changeQuestion() {
        if (test.isFinished()) {
            showResults();
        }
        else {

            nextButton.html($("<i>", {
                title: test.isLast() ? "Finalizar" : "Siguiente",
                class: `bi bi-${test.isLast() ? "check2" : "arrow-right"}`,
            }));

            prevButton.prop("disabled", test.isFirst());

            questionCard.header = categories.val();
            questionCard.title = `Pregunta ${test.current} de ${test.length}`;
            questionCard.text = test.question.text;
            questionCard.show();
            resultsCard.hide();

            let answer = test.question.answer;

            // Si la respuesta es un string
            if (answer.isString()) {
                questionCard.addTextBox({
                    text: test.userAnswer,
                    placeholder: "Respuesta",
                    keyup: e => test.userAnswer = e.target.value,
                });
            }

            // Si la respuesta es true/false
            // Actualmente no se extraen de esta forma
            else if (answer.isBoolean()) {
                questionCard.addRadioList({
                    text: "Verdadero",
                    checked: test.userAnswer === true,
                    click: e => {
                        test.userAnswer = true;
                    },
                }, {
                    text: "Falso",
                    checked: test.userAnswer === false,
                    click: e => {
                        test.userAnswer = false;
                    },
                });
            }

            // Si la respuesta es de emparejamiento
            else if (answer.isMatching()) {
                questionCard.addSelectList(...answer.texts.map((text, index) => ({
                    text: text,
                    change: e => {
                        if (!(test.userAnswer instanceof Array)) {
                            test.userAnswer = new Array(answer.length).fill(null);
                        }

                        test.userAnswer[index] = e.target.value;
                    },
                    options: answer.options.map(option => ({
                        text: option,
                        selected:
                            test.userAnswer instanceof Array &&
                            test.userAnswer[index] === option,
                    })),
                })));
            }

            // Si la respuesta es de selección única
            else if (answer.isSingle()) {
                questionCard.addRadioList(...answer.texts.map((text, index) => ({
                    text: text,
                    checked: test.userAnswer === index,
                    click: e => test.userAnswer = index,
                })));
            }

            // Si la respuesta es de selección múltiple
            else {
                questionCard.addCheckList(...answer.texts.map((text, index) => ({
                    text: text,
                    checked: test.userAnswer instanceof Array &&
                        test.userAnswer[index] === true,
                    click: e => {
                        if (!(test.userAnswer instanceof Array)) {
                            test.userAnswer = new Array(answer.length).fill(false);
                        }
                        test.userAnswer[index] = e.target.checked;
                    },
                })));
            }
        }
    }

    function showResults() {
        questionCard.hide();
        resultsCard.clear();

        let score = 0;

        for (let { current, text, answer, success, userAnswer } of test) {
            resultsCard.addCard({
                title: `Pregunta ${current} de ${test.length}`,
                text: text,
                answer: answer,
                success: success,
                userAnswer: userAnswer,
            });

            if (success) {
                score++;
            }
        }

        resultsCard.title = `Puntuación: ${score} de ${test.length}`;
        resultsCard.show();
    }
});
