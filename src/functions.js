function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function read(file) {
    return new Promise((resolve, reject) => {
        try {
            let reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsText(file);
        }
        catch (error) {
            reject(error);
        }
    });
}

export {
    read,
    shuffle
};
