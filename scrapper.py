# @verteramo

import io, argparse, re, json
from selenium import webdriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service

# Ordered answers extraction
# Example: "a. Texto de la respuesta." -> "Texto de la respuesta."
PATTERN_MATCH_ANSWER = re.compile(r"^(?:[a-z]\.\s)?(?P<answer>.+)$")

# Right answers extraction
# Example: "Las respuestas correctas son: Respuesta 1., Respuesta 2." -> "Respuesta 1., Respuesta 2."
PATTERN_MATCH_RIGHT_ANSWER = re.compile(
    r"^(?:(?:La respuesta correcta es:?|Las respuestas correctas son:)\s)(?P<rightanswer>.+)$"
)


# Questions' root element has "content" class
class Question:
    def __init__(self, element: WebElement) -> None:
        self.__element = element

    def get_text(self) -> str:
        try:
            return self.__element.find_element(By.CLASS_NAME, "qtext").text.rstrip(":")
        
        # GVA v3.9.12
        except NoSuchElementException:
            return self.__element.find_element(
                By.XPATH, "//*[@class='qtext']/p"
            ).text.rstrip(":")

    def __get_rightanswer(self) -> list[str] | str | None:
        try:
            rightanswer_list = list(
                map(
                    lambda rightanswer: rightanswer.strip("'").rstrip("."),
                    (
                        PATTERN_MATCH_RIGHT_ANSWER.search(
                            self.__element.find_element(
                                By.CLASS_NAME, "rightanswer"
                            ).text
                        )
                        .group("rightanswer")
                        .strip("'")
                        .rstrip(".")
                        .split("., ")
                    ),
                )
            )

            return (
                rightanswer_list[0] if len(rightanswer_list) == 1 else rightanswer_list
            )
        
        # GVA v3.9.12
        except AttributeError:
            return None

        # No feedback
        except NoSuchElementException:
            return None

    # Text answers (input)
    def __get_text_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> str | None:
        text = element.find_element(By.TAG_NAME, "input").get_attribute("value")

        if rightanswer:
            if isinstance(rightanswer, list) and text.casefold() in map(
                str.casefold, rightanswer
            ):
                return text
            elif text.casefold() == rightanswer.casefold():
                return text

        # Inference
        elif "fa-check" in element.find_element(By.TAG_NAME, "i").get_attribute(
            "class"
        ):
            return text

        return None

    # Multiple answers (checkbox and radio)
    def __get_multiple_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> list[tuple[str, bool]]:
        answers = []

        # V3.9.12 not working with By.TAG_NAME, it works with By.XPATH
        for answer in element.find_elements(By.XPATH, "div"):
            try:
                # v3.9.12 answers are wrapped in a div
                text = answer.find_element(By.TAG_NAME, "div").text
            except NoSuchElementException:
                # v3.7.7 answers are wrapped in a label
                text = answer.find_element(By.TAG_NAME, "label").text

            text = PATTERN_MATCH_ANSWER.search(text).group("answer").rstrip(".")

            if isinstance(rightanswer, list):
                answers.append((text, text in rightanswer))

            elif isinstance(rightanswer, str):
                answers.append((text, text == rightanswer))

            # Inference
            else:
                classes = answer.get_attribute("class").split(" ")

                if "correct" in classes:
                    answers.append((text, True))

                elif "incorrect" in classes:
                    answers.append((text, False))

                else:
                    answers.append((text, None))

        single = (
            element.find_element(By.TAG_NAME, "input").get_attribute("type") == "radio"
        )

        # If it is a single answer and there is one correct answer, the rest are incorrect
        if single and len([answer for answer, truth in answers if truth]) == 1:
            answers = [
                (answer, False if truth is None else truth) for answer, truth in answers
            ]

        return answers

    # Matching answers (select)
    def __get_matching_answer(
        self, element: WebElement, rightanswer: list[str] | str | None
    ) -> list[tuple[str, str, bool]]:
        answers = []
        for row in element.find_elements(By.TAG_NAME, "tr"):
            text = row.find_element(By.CLASS_NAME, "text").text

            rightanswer_dict = dict()
            if isinstance(rightanswer, list):
                for answer in rightanswer:
                    key, value = list(map(str.strip, answer.split(" → ")))
                    rightanswer_dict[key] = (value, True)

            elif isinstance(rightanswer, str):
                key, value = list(map(str.strip, rightanswer.split(" → ")))
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
        try:
            answer = self.__element.find_element(By.CLASS_NAME, "answer")
        
        # GVA v3.9.12
        except NoSuchElementException:
            answer = self.__element.find_element(By.XPATH, "//*[@class='answer']")

        match answer.tag_name:
            case "span":  # Text answers (input)
                return self.__get_text_answer(answer, rightanswer)
            case "div":  # Multiple answers (checkbox and radio)
                return self.__get_multiple_answer(answer, rightanswer)
            case "table":  # Matching answers (select)
                return self.__get_matching_answer(answer, rightanswer)
        return None


class Test:
    def __init__(self, driver: webdriver) -> None:
        self.__driver = driver

    def get_name(self) -> str:
        try:
            return (
                self.__driver.find_elements(By.CLASS_NAME, "breadcrumb-item")[-1]
                .find_element(By.TAG_NAME, "a")
                .text.rstrip(".")
            )
        
        # GVA v3.9.12
        except IndexError:
            return self.__driver.find_elements(
                By.XPATH, "//ol[contains(@class, 'breadcrumb')]/li/span/a/span"
            )[-1].text.rstrip(".")

    def get_questions(self) -> list[Question]:
        for element in self.__driver.find_elements(By.XPATH, "//*[@class='content']"):
            yield Question(element)


class Platform:
    def __init__(self, driver: webdriver) -> None:
        parser = argparse.ArgumentParser(description="Scraps tests")
        parser.add_argument("-uid", "--username_id", type=str, default="username")
        parser.add_argument("-pid", "--password_id", type=str, default="password")
        parser.add_argument("-bid", "--loginbtn_id", type=str, default="loginbtn")
        parser.add_argument("-l", "--links", type=str, default="links.txt")
        parser.add_argument("-u", "--username", type=str)
        parser.add_argument("-p", "--password", type=str)
        self.__args = parser.parse_args()
        self.__driver = driver

    def __get_links(self) -> list[str]:
        with open(self.__args.links, "r") as links:
            for link in links.readlines():
                yield link

    def __get_connections(self) -> list:
        for link in self.__get_links():
            self.__driver.get(link)
            try:
                self.__driver.find_element(By.ID, self.__args.username_id).send_keys(
                    self.__args.username
                )
                self.__driver.find_element(By.ID, self.__args.password_id).send_keys(
                    self.__args.password
                )
                self.__driver.find_element(By.ID, self.__args.loginbtn_id).click()
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
            questions.append((question.get_text(), question.get_answer()))

        try:
            tests[test.get_name()] += questions
        except KeyError:
            tests[test.get_name()] = questions

    with open("test.json", "w") as file:
        json.dump(tests, file, indent=4)


if __name__ == "__main__":
    main()
