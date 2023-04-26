import re
from PyPDF2 import PdfReader

reader = PdfReader("Cuestionarios.pdf")

re_questions = r"(?:Se puntúa \d{1,2},\d{2} sobre \d{1,2},\d{2}(?!\n)|(?:La respuesta correcta es:?[^.]*?[.'VF]\n|Las respuestas correctas son: [\S\s]+?\.\n)(?!Pregunta|Actividad|\d{1,2}/\d{1,2}/\d{2}))(?P<question>(?:(?:[^…:?]+)[…:?])+?)\n(?P<answers>[\S\s]+?)(?=La respuesta correcta es|Las respuestas correctas son)"
re_right_answers = r"(?:La respuesta correcta es:? |Las respuestas correctas son: )(?:'?(?P<answer>[\S\s]*?\.?)[\n'])"
PATTERN_ANSWER_CLEAN = re.compile(r"^(?:[a-z]\.)?(?P<answer>.+)$")

PATTERN_ANSWER_SPLIT = re.compile(r"\.\n|\.\uf00c\n|\.\uf00d\n$")

for page in reader.pages:
    text = page.extract_text()
    questions = re.findall(re_questions, text)
    correct_answers = re.findall(re_right_answers, text)
    for question, answers in questions:
        question = str(question).replace("\n\r", " ").rstrip(":")

        answers = [
            answer.group("answer")
            for answer in [
                PATTERN_ANSWER_CLEAN.search(answer.replace("\n", " "))
                for answer in PATTERN_ANSWER_SPLIT.split(answers)
            ]
            if answer is not None
        ]

        print(f"Q: {question}")
        for answer in answers:
            print(answer)
        print()
