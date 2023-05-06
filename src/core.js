import { read, shuffle } from "./functions.js";

class Dataset {
    #data;

    constructor(files, keysHandler) {
        this.#data = {};
        (async () => {
            for (let file of files) {
                this.#data = { ...this.#data, ...JSON.parse(await read(file)) };
            }

            // Eliminar preguntas con respuestas vacías (null, undefined, "")
            for (let key in this.#data) {
                let priorCount = this.#data[key].length;

                this.#data[key] = this.#data[key].filter(([, answer]) => answer);

                let postCount = this.#data[key].length;

                if (priorCount !== postCount) {
                    console.warn(`Se eliminaron ${priorCount - postCount} preguntas con respuestas vacías de la categoría ${key}`);
                }
            }

            Object.keys(this.#data).forEach(keysHandler);
        })();
    }

    generate(key, quantity) {
        return new Test(shuffle(this.#data[key]).slice(0, quantity).map(([text, answer]) =>
            new Question(text, answer instanceof Array ? shuffle(answer) : answer)
        ));
    }
}

class Question {
    #text;
    #answer;

    constructor(text, answer) {
        this.#text = text;
        this.#answer = new Answer(answer);
    }

    get text() {
        return this.#text;
    }

    get answer() {
        return this.#answer;
    }
}

class Answer {
    #data;

    constructor(data) {
        this.#data = data;
    }

    get length() {
        return this.#data instanceof Array
            ? this.#data.length
            : undefined;
    }

    get texts() {
        return this.#data instanceof Array
            ? this.#data.map(([text]) => text)
            : undefined;
    }

    get options() {
        return this.#data instanceof Array
            ? this.#data.map(([, option]) => option).sort()
            : undefined;
    }

    isString() {
        return typeof this.#data === "string";
    }

    isBoolean() {
        return typeof this.#data === "boolean";
    }

    isMatching() {
        return this.#data instanceof Array &&
            this.#data.some(answer => answer.length === 3);
    }

    isSingle() {
        return this.#data instanceof Array &&
            this.#data.filter(([, truth]) => truth).length === 1;
    }

    check(userAnswer) {

        // Si es un string la comparación es case insensitive
        if (this.isString()) {
            return typeof userAnswer === "string" &&
                this.#data.toLowerCase() === userAnswer.toLowerCase();
        }

        // Si es un booleano la comparación es directa
        else if (this.isBoolean()) {
            return this.#data === userAnswer;
        }

        // Si es un matching
        // Suponiendo que la respuesta correcta es:     ["A", "B", "C", "D"]
        // Y el valor de la respuesta del usuario es:   ["D", "B", "A", "C"]
        // Se comparan ambos arrays posición por posición
        else if (this.isMatching()) {
            return userAnswer instanceof Array &&
                this.#data.every(([, answer], index) => answer === userAnswer[index]);
        }

        // Si es una selección única
        // Se obtiene y compara el índice
        else if (this.isSingle()) {
            return Number.isInteger(userAnswer) &&
                this.#data.findIndex(([, truth]) => truth) === userAnswer;
        }

        // Si es una selección múltiple
        return userAnswer instanceof Array &&
            this.#data.every(([, truth], index) => truth === userAnswer[index]);
    }

    getValue(userAnswer) {
        if (typeof userAnswer === "string") {
            return String(userAnswer);
        }

        else if (typeof userAnswer === "boolean") {
            return userAnswer ? "Verdadero" : "Falso";
        }

        else if (Number.isInteger(userAnswer)) {
            return this.#data[userAnswer][0];
        }

        else if (userAnswer instanceof Array) {
            if (this.isMatching()) {
                return userAnswer.map((answer, index) => `${this.#data[index][0]} -> ${answer}`).join("., ");
            }

            return userAnswer.map((answer, index) => answer ? this.#data[index][0] : null).filter(answer => answer).join("., ");
        }

        return null;
    }

    get rightAnswer() {
        if (this.isString() || this.isBoolean()) {
            return String(this.#data);
        }

        else if (this.isMatching()) {
            return this.#data.map(([answer, option]) => `${answer} -> ${option}`).join("., ");
        }

        else if (this.isSingle()) {
            return this.#data.find(([, truth]) => truth)[0];
        }

        return this.#data.filter(([, truth]) => truth).map(([answer]) => answer).join("., ");
    }
}

class Test {
    #current = 0;
    #questions;
    #userAnswers;

    constructor(questions) {
        this.#questions = questions;
        this.#userAnswers = new Array(questions.length).fill(null);
    }

    *[Symbol.iterator]() {
        for (let current = 0; current < this.#questions.length; current++) {
            let answer = this.#questions[current].answer;

            yield {
                current: current + 1,
                text: this.#questions[current].text,
                answer: answer.rightAnswer,
                success: answer.check(this.#userAnswers[current]),
                userAnswer: answer.getValue(this.#userAnswers[current]),
            };
        }
    }

    get current() {
        return this.#current + 1;
    }

    get length() {
        return this.#questions.length;
    }

    get question() {
        return this.#questions[this.#current];
    }

    get userAnswer() {
        return this.#userAnswers[this.#current];
    }

    set userAnswer(value) {
        this.#userAnswers[this.#current] = value;
    }

    next() {
        this.#current++;
    }

    prev() {
        this.#current--;
    }

    isFirst() {
        return this.#current === 0;
    }

    isLast() {
        return this.#current === this.#questions.length - 1;
    }

    isFinished() {
        return this.#current === this.#questions.length;
    }
}

export {
    Dataset,
    Question,
    Answer
};
