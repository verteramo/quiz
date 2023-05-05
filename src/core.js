import { shuffle } from "./functions.js";

class File {
    #file;

    constructor(file) {
        this.#file = file;
    }

    read() {
        return new Promise((resolve, reject) => {
            try {
                let reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsText(this.#file);
            }
            catch (error) {
                reject(error);
            }
        });
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

    get current() {
        return this.#current + 1;
    }

    get length() {
        return this.#questions.length;
    }

    get question() {
        return this.#questions[this.#current];
    }

    get answer() {
        return this.#questions[this.#current].getAnswer();
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

class Dataset {
    #data;

    constructor(files, onLoaded) {
        this.#data = {};
        (async () => {
            for (let file of files) {
                this.#data = {
                    ...this.#data,
                    ...JSON.parse(await new File(file).read())
                };
            }

            Object.keys(this.#data).forEach(onLoaded);
        })();
    }

    generate(category, quantity) {
        return new Test(shuffle(this.#data[category]).slice(0, quantity).map(([text, answer]) =>
            new Question(text, answer instanceof Array ? shuffle(answer) : answer)
        ));
    }
}

class Question {
    /** @type {string} */
    test;

    /** @type {Answer} */
    answer;

    constructor(text, answer) {
        this.text = text;
        this.answer = new Answer(answer);
    }
}

class Answer {
    #data;

    constructor(data) {
        this.#data = data;
    }

    get length() {
        return this.#data instanceof Array ? this.#data.length : undefined;
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

    getTexts() {
        return this.#data.map(([text]) => text);
    }

    getOptions() {
        return this.#data.map(([, option]) => option).sort();
    }

    check(userAnswer) {
        // Si es un string o un booleano, se compara directamente
        if (this.isSingle() || this.isBoolean()) {
            return this.#data === userAnswer;
        }

        // Si es un matching
        // Suponiendo que el valor de la respuesta es:  [1, 2, 3, 4]
        // Y el valor de la respuesta del usuario es:   [2, 1, 4, 3]
        // Se compara cada elemento de la respuesta con el elemento
        // de la respuesta del usuario que se encuentra en la misma posición
        else if (this.isMatching()) {
            return this.#data.every(([, answer, truth], index) => truth && answer === userAnswer[index]);
        }

        // Si es una respuesta de tipo singular
        else if (this.isSingle()) {
            return this.#data.find(([, truth]) => truth)[0] === userAnswer;
        }

        // Si es una respuesta de tipo múltiple
        return this.#data.every(([answer, truth]) => truth && userAnswer.includes(answer));
    }

    getRight() {
        if (this.isString() || this.isBoolean()) {
            return this.#data;
        }
        else if (this.isMatching()) {
            return this.#data.map(([answer, truth]) => `${answer} -> ${truth}.`).join(", ");
        }
        else if (this.isSingle()) {
            return this.#data.find(([, truth]) => truth)[0];
        }
        return this.#data.filter(([, truth]) => truth).map(([truth]) => `${truth}.`).join(", ");
    }
}

export {
    Dataset,
    Question,
    Answer
};
