# Copyright 2023 @verteramo

import sys, re, json
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service

PATTERN_MATCH_QUESTION = re.compile(r"^(?P<questionText>.+)$")

PATTERN_MATCH_ANSWER = re.compile(r"^(?:[a-z]\.\n)?(?P<answerText>.+)$")

PATTERN_MATCH_RIGHT_ANSWER = re.compile(
    r"^(?:La respuesta correcta es:? |Las respuestas correctas son: )(?P<rightAnswerText>.+)$"
)


def login(
    link: str,
    username_id: str,
    password_id: str,
    button_id: str,
    username: str,
    password: str,
) -> webdriver:
    options = webdriver.ChromeOptions()
    # options.add_experimental_option("excludeSwitches", ["enable-logging"])

    driver = webdriver.Chrome(
        service=Service("drivers/chromedriver.exe"), options=options
    )

    driver.minimize_window()
    driver.get(link)
    driver.find_element(By.ID, username_id).send_keys(username)
    driver.find_element(By.ID, password_id).send_keys(password)
    driver.find_element(By.ID, button_id).click()

    return driver


def extract_test(
    username_id: str,
    password_id: str,
    button_id: str,
    username: str,
    password: str,
    *links: str,
) -> dict:
    test = dict()

    for link in links:
        try:
            driver = login(
                link, username_id, password_id, button_id, username, password
            )

            # Get name of the test
            name = (
                driver.find_elements(By.CLASS_NAME, "breadcrumb-item")[-1]
                .find_element(By.TAG_NAME, "a")
                .text.rstrip(".")
            )

            questions = list()

            for content in driver.find_elements(By.XPATH, "//*[@class='content']"):
                # Get question text
                questionText = (
                    PATTERN_MATCH_QUESTION.search(
                        content.find_element(By.CLASS_NAME, "qtext").text
                    )
                    .group("questionText")
                    .rstrip(":")
                )

                # Get right answer
                try:
                    rightAnswerText = (
                        PATTERN_MATCH_RIGHT_ANSWER.search(
                            content.find_element(By.CLASS_NAME, "rightanswer").text
                        )
                        .group("rightAnswerText")
                        .strip("'")
                        .rstrip(".")
                    )

                    match rightAnswerText:
                        case "V":
                            rightAnswerText = "Verdadero"
                        case "F":
                            rightAnswerText = "Falso"

                except NoSuchElementException:
                    rightAnswerText = None

                # Get answers

                answers = list()

                answerInferred = False

                try:
                    for currentAnswer in content.find_element(
                        By.CLASS_NAME, "answer"
                    ).find_elements(By.XPATH, "div"):
                        currentAnswerText = (
                            PATTERN_MATCH_ANSWER.search(currentAnswer.text)
                            .group("answerText")
                            .rstrip(".")
                        )

                        if rightAnswerText:
                            currentAnswerTruth = currentAnswerText == rightAnswerText
                        else:
                            currentAnswerClasses = currentAnswer.get_attribute(
                                "class"
                            ).split(" ")

                            if "correct" in currentAnswerClasses:
                                answerInferred = True
                                currentAnswerTruth = True
                                rightAnswerText = currentAnswerText
                            elif "incorrect" in currentAnswerClasses:
                                currentAnswerTruth = False
                            else:
                                currentAnswerTruth = None

                        answers.append((currentAnswerText, currentAnswerTruth))

                except NoSuchElementException:
                    try:
                        answerValue = content.find_element(
                            By.CLASS_NAME, "form-control d-inline"
                        ).get_attribute("value")

                        print(f"Warning: {questionText} is a text answer")

                    except NoSuchElementException:
                        answerValue = None

                if answerInferred:
                    for position, (text, truth) in enumerate(answers):
                        answers[position] = (text, truth == True)

                if len(answers) == 2:
                    for text, truth in [
                        (text, truth) for text, truth in answers if truth == True
                    ]:
                        if text == "Verdadero":
                            answerValue = True
                        elif text == "Falso":
                            answerValue = False
                else:
                    answerValue = answers

                questions.append(
                    {
                        "text": questionText,
                        "answer": answerValue,
                    }
                )

            test[name] = questions

        except NoSuchElementException as ex:
            print(f"Error: {ex}")
            pass

        driver.close()

        return test


if __name__ == "__main__":
    with open(sys.argv[1], "w") as dataset:
        with open(sys.argv[2], "r") as links:
            dataset.write(json.dumps(extract_test(*sys.argv[3:8], *links.readlines())))

# python scrapper.py <JSON file> <links file> username password loginbtn <username> <password>
