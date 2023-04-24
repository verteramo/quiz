# Copyright 2023 @verteramo

import io, argparse, re, json
from selenium import webdriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service

PATTERN_MATCH_ANSWER = re.compile(r"^(?:[a-z]\.\s)?(?P<answer>.+)$")

PATTERN_MATCH_RIGHT_ANSWER = re.compile(
    r"^(?:(?:La respuesta correcta es:?|Las respuestas correctas son:)\s)(?P<rightanswer>.+)$"
)


# Cada pregunta tiene como elemento raíz un elemento de clase "content"
class Question:
    def __init__(self, element: WebElement) -> None:
        self.__element = element

    # Obtiene el texto de la pregunta
    def get_text(self) -> str:
        return self.__element.find_element(By.CLASS_NAME, "qtext").text.rstrip(":")

    # Obtiene la respuesta o las respuestas correctas
    def __get_rightanswer(self) -> list[str] | str | None:
        try:
            # Se obtiene la retroalimentación y se divide en una lista
            rightanswer_list = (
                PATTERN_MATCH_RIGHT_ANSWER.search(
                    self.__element.find_element(By.CLASS_NAME, "rightanswer").text
                )
                .group("rightanswer")
                .strip("'")
                .rstrip(".")
                .split("., ")
            )

            # Se eliminan las comillas y los puntos de cada respuesta
            for position in range(len(rightanswer_list)):
                rightanswer_list[position] = (
                    rightanswer_list[position].strip("'").rstrip(".")
                )

            # Si la lista tiene una sola respuesta se devuelve la respuesta
            if len(rightanswer_list) == 1:
                return rightanswer_list[0]

            # En caso contrario se devuelve la lista de respuestas
            return rightanswer_list

        # Si no hay retroalimentación se devuelve None
        except NoSuchElementException:
            return None

    # Respuestas de tipo texto
    def __get_text_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> str | None:
        text = element.find_element(By.TAG_NAME, "input").get_attribute("value")

        # Si hay retroalimentación
        if rightanswer:
            # Si es una lista y el texto está en la lista
            if isinstance(rightanswer, list) and text.casefold() in map(
                str.casefold, rightanswer
            ):
                return text
            # Si es un string y el texto es igual al string
            elif text.casefold() == rightanswer.casefold():
                return text
        # Si no hay retroalimentación se intenta inferir de la corrección
        elif "fa-check" in element.find_element(By.TAG_NAME, "i").get_attribute(
            "class"
        ):
            return text
        # Si no hay retroalimentación y no hay corrección se devuelve None
        return None

    # Respuestas de tipo checkbox o radio
    def __get_multiple_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> list[tuple[str, bool]]:
        answers = []
        for answer in element.find_elements(By.TAG_NAME, "div"):
            try:
                # En v3.9.12 las respuestas están envueltas en un div
                text = answer.find_element(By.TAG_NAME, "div").text
            except NoSuchElementException:
                # En v3.7.7 las respuestas están envueltas en un label
                text = answer.find_element(By.TAG_NAME, "label").text

            text = PATTERN_MATCH_ANSWER.search(text).group("answer").rstrip(".")

            # Si hay respuesta correcta debe ser correcta o incorrecta
            # Si la respuesta está entre las respuestas correctas
            if isinstance(rightanswer, list):
                answers.append((text, text in rightanswer))
            # Si es la respuesta correcta
            elif isinstance(rightanswer, str):
                answers.append((text, text == rightanswer))

            # Si no hay respuesta correcta se intenta inferir de la corrección
            else:
                classes = answer.get_attribute("class").split(" ")
                # Si está marcada como correcta
                if "correct" in classes:
                    answers.append((text, True))
                # Si está marcada como incorrecta
                elif "incorrect" in classes:
                    answers.append((text, False))
                # No hay retroalimentación
                else:
                    answers.append((text, None))

        return answers

    # Respuestas de tipo emparejamiento
    def __get_matching_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> list[tuple[str, str]]:
        answers = []
        for row in element.find_elements(By.TAG_NAME, "tr"):
            text = row.find_element(By.CLASS_NAME, "text").text

            # print(f"Debug({__name__}): {rightanswer}")

            rightanswer_dict = dict()
            if isinstance(rightanswer, list):
                for answer in rightanswer:
                    key, value = answer.split(" → ")
                    key = key.strip()
                    value = value.strip()
                    rightanswer_dict[key] = (value, True)
            elif isinstance(rightanswer, str):
                key, value = rightanswer.split(" → ")
                key = key.strip()
                value = value.strip()
                rightanswer_dict[key] = (value, True)
            else:
                for option in row.find_elements(By.TAG_NAME, "option"):
                    if option.get_attribute("selected"):
                        value = option.text
                        break

                classes = (
                    row.find_element(By.CLASS_NAME, "control")
                    .get_attribute("class")
                    .split(" ")
                )

                rightanswer_dict[text] = (value, "correct" in classes)

            answers.append((text, *rightanswer_dict[text]))

        return answers

    def get_answer(self):
        rightanswer = self.__get_rightanswer()
        answer_element = self.__element.find_element(By.CLASS_NAME, "answer")

        match answer_element.tag_name:
            case "span":  # Respuestas de tipo texto (input text)
                return self.__get_text_answer(answer_element, rightanswer)
            case "div":  # Respuestas de selección múltiple (checkbox o radio)
                return self.__get_multiple_answer(answer_element, rightanswer)
            case "table":  # Respuestas de emparejamiento (select)
                return self.__get_matching_answer(answer_element, rightanswer)
        return None


class Test:
    def __init__(self, driver: webdriver) -> None:
        self.__driver = driver

    def get_name(self) -> str:
        return (
            self.__driver.find_elements(By.CLASS_NAME, "breadcrumb-item")[-1]
            .find_element(By.TAG_NAME, "a")
            .text.rstrip(".")
        )

    def get_questions(self) -> list[Question]:
        for element in self.__driver.find_elements(By.XPATH, "//*[@class='content']"):
            yield Question(element)


class Platform:
    def __init__(self, driver: webdriver) -> None:
        parser = argparse.ArgumentParser(description="Scraps tests")
        parser.add_argument("--uid", type=str, default="username")
        parser.add_argument("--pid", type=str, default="password")
        parser.add_argument("--bid", type=str, default="loginbtn")
        parser.add_argument("--u", type=str)
        parser.add_argument("--p", type=str)
        parser.add_argument("--l", type=str)
        self.__args = parser.parse_args()
        self.__driver = driver

    def __get_links(self) -> list[str]:
        with open(self.__args.l, "r") as links:
            for link in links.readlines():
                yield link

    def __get_connections(self) -> list:
        for link in self.__get_links():
            self.__driver.get(link)
            try:
                self.__driver.find_element(By.ID, self.__args.uid).send_keys(
                    self.__args.u
                )
                self.__driver.find_element(By.ID, self.__args.pid).send_keys(
                    self.__args.p
                )
                self.__driver.find_element(By.ID, self.__args.bid).click()
            except:
                pass
            yield self.__driver

    def get_tests(self) -> list[Test]:
        for connection in self.__get_connections():
            yield Test(connection)


def get_driver() -> webdriver:
    options = webdriver.ChromeOptions()
    options.add_experimental_option("excludeSwitches", ["enable-logging"])

    driver = webdriver.Edge(
        service=Service("drivers/chromedriver.exe"), options=options
    )

    # driver.minimize_window()

    return driver


def main():
    tests = dict()
    for test in Platform(get_driver()).get_tests():
        questions = []
        for question in test.get_questions():
            answer = question.get_answer()
            if isinstance(answer, list):
                answers = []
                for a, *t in answer:
                    answers.append((a, t))
            else:
                answers = answer

            questions.append((question.get_text(), answers))

        try:
            tests[test.get_name()] += questions
        except KeyError:
            tests[test.get_name()] = questions

    with open("test.json", "w") as file:
        json.dump(tests, file, indent=4)


if __name__ == "__main__":
    main()
