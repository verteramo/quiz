import * as Core from "./core.js";
import * as Document from "./document.js";

$(document).ready(function () {
    let questionCard = new Document.QuestionCard();
    let resultsCard = new Document.ResultsCard();

    let html = $("html");
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

    let test;
    let dataset;

    questionCard.hide();
    resultsCard.hide();

    darkSwitch.onChange(e => {
        if (e.target.checked) {
            html.attr("data-bs-theme", "dark");
        } else {
            html.removeAttr("data-bs-theme");
        }
    });

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

            questionCard.header = categories.value();
            questionCard.title = `Pregunta ${test.current} de ${test.length}`;
            questionCard.text = test.question.text;
            questionCard.show();
            resultsCard.hide();

            let answer = test.question.answer;

            // Si la respuesta es un string
            if (answer.isString()) {
                questionCard.addTextBox({
                    id: test.current,
                    text: test.userAnswer,
                    placeholder: "Respuesta",
                    keyup: e => test.userAnswer = e.target.value,
                });
            }

            // Si la respuesta es true/false
            // Actualmente no se extraen de esta forma
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
                questionCard.addRadioList(...answer.getTexts().map((text, index) => ({
                    id: index,
                    text: text,
                    checked: test.userAnswer === index,
                    click: e => test.userAnswer = index,
                })));
            }

            // Si la respuesta es de selección múltiple
            else {
                questionCard.addCheckList(...answer.getTexts().map((text, index) => ({
                    id: index,
                    text: text,
                    checked: test.userAnswer instanceof Array &&
                        test.userAnswer[index] === true,
                    click: e => {
                        if (!(test.userAnswer instanceof Array)) {
                            test.userAnswer = new Array(answer.length).fill(null);
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
    $("#clipboard-button").click(e => {
        navigator.clipboard.writeText(test.question.text.trim()).then(() => {
            toast.show("Pregunta copiada al portapapeles.");
        }, () => {
            toast.show("No se ha podido copiar la pregunta al portapapeles.");
        });
    });

    /**
     * Buscar en DuckDuckGo
     */
    $("#duck-button").click(e => {
        window.open(`https://duckduckgo.com/?q=${test.question.text.trim()}`, "_blank");
    });

    /**
     * Buscar en Google
     */
    $("#google-button").click(e => {
        window.open(`https://www.google.com/search?q=${test.question.text.trim()}`, "_blank");
    });

    /**
     * Buscar en Bing
     */
    $("#bing-button").click(e => {
        window.open(`https://www.bing.com/search?q=${test.question.text.trim()}`, "_blank");
    });

    function showResults() {
        questionCard.hide();
        resultsCard.show();
        for (let [question, userAnswer] of test) {
        }
    }
});
