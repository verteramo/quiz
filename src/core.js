import { shuffle } from "./functions.js";

class File {
    constructor(file) {
        this.file = file;
    }

    read() {
        return new Promise((resolve, reject) => {
            try {
                let reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsText(this.file);
            }
            catch (error) {
                reject(error);
            }
        });
    }
}

class Dataset {

    constructor(files, onLoaded) {
        this.data = {};
        (async () => {
            for (let file of files) {
                this.data = {
                    ...this.data,
                    ...JSON.parse(await new File(file).read())
                };
            }

            Object.keys(this.data).forEach(onLoaded);
        })();
    }

    generate(category, quantity) {
        return shuffle(this.data[category]).
            slice(0, quantity).
            map(([text, answer]) =>
                new Question(text, answer instanceof Array ? shuffle(answer) : answer)
            );
    }
}

class Question {
    /**
     * @param {string} text
     * @param {Answer} answer
     */
    constructor(text, answer) {
        this.text = text;
        this.answer = new Answer(answer);
    }

    /**
     * @returns {string}
     */
    getText() {
        return this.text;
    }

    /**
     * @returns {Answer}
     */
    getAnswer() {
        return this.answer;
    }
}

class Answer {
    /**
     * @param {string|boolean|Array} data
     */
    constructor(data) {
        this.data = data;
    }

    /**
     * @returns {boolean}
     */
    isString() {
        return typeof this.data === "string";
    }

    /**
     * @returns {boolean}
     */
    isBoolean() {
        return typeof this.data === "boolean";
    }

    /**
     * @returns {boolean}
     */
    isMatching() {
        return this.data instanceof Array &&
            this.data.some(answer => answer.length === 3);
    }

    getTexts() {
        return this.data.map(([text]) => text);
    }

    /**
     * @returns {Array}
     */
    getOptions() {
        return this.data.map(([, option]) => option).sort();
    }

    /**
     * @returns {boolean}
     */
    isSingle() {
        return this.data instanceof Array &&
            this.data.filter(([, truth]) => truth).length === 1;
    }

    check(userAnswer) {
        // Si es un string o un booleano, se compara directamente
        if (this.isSingle() || this.isBoolean()) {
            return this.data === userAnswer;
        }

        // Si es un matching
        // Suponiendo que el valor de la respuesta es:  [1, 2, 3, 4]
        // Y el valor de la respuesta del usuario es:   [2, 1, 4, 3]
        // Se compara cada elemento de la respuesta con el elemento
        // de la respuesta del usuario que se encuentra en la misma posición
        else if (this.isMatching()) {
            return this.data.every(([, answer, truth], index) => truth && answer === userAnswer[index]);
        }

        // Si es una respuesta de tipo singular
        else if (this.isSingle()) {
            return this.data.find(([, truth]) => truth)[0] === userAnswer;
        }

        // Si es una respuesta de tipo múltiple
        return this.data.every(([answer, truth]) => truth && userAnswer.includes(answer));
    }

    getRight() {
        if (this.isString() || this.isBoolean()) {
            return this.data;
        }
        else if (this.isMatching()) {
            return this.data.map(([answer, truth]) => `${answer} -> ${truth}.`).join(", ");
        }
        else if (this.isSingle()) {
            return this.data.find(([, truth]) => truth)[0];
        }
        return this.data.filter(([, truth]) => truth).map(([truth]) => `${truth}.`).join(", ");
    }
}

export {
    Dataset,
    Question,
    Answer
};
