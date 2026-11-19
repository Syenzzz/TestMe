import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1]).read_text(encoding='utf-8-sig')
sections = re.split(r'(?m)^## (\d+)号\s*$', source)
assert len(sections) == 13, 'expected six numbered tests'
questions = []
for group, body in zip(sections[1::2], sections[2::2]):
    kind = None
    number = None
    stem = ''
    options = []
    answer = ''
    answer_label = ''
    original = []
    def append_question():
        if number is None:
            return
        assert kind and stem and options and answer and original, (group, number)
        assert len(answer) == len(set(answer)) and all('A' <= c < chr(65 + len(options)) for c in answer), (group, number, answer)
        questions.append({'id': f'health-v2-{group}-{number}', 'type': kind, 'stem': stem, 'options': options, 'answer': answer, 'answerLabel': answer_label, 'explanation': '', 'sourceText': '\n\n'.join(original), 'sourceLabel': '题库原文', 'chapter': f'{group}号', 'score': 5})
    for line in body.splitlines():
        line = line.strip()
        heading = re.match(r'^### [一二三]、(单选题|多选题|判断题)$', line)
        if heading:
            kind = {'单选题': 'single', '多选题': 'multiple', '判断题': 'true-false'}[heading.group(1)]
            continue
        heading = re.match(r'^#### (\d+)\\?\.\s*(.*)$', line)
        if heading:
            append_question()
            number, stem = heading.groups()
            options, answer, answer_label, original = [], '', '', []
            continue
        option = re.match(r'^\* ([A-D])\.\s*(.*)$', line)
        if option:
            assert ord(option.group(1)) == ord('A') + len(options), (group, number, line)
            options.append(option.group(2).replace('\\~', '~'))
            continue
        answer_match = re.match(r'^\*\*(正确答案|参考答案)：(.*?)\*\*$', line)
        if answer_match:
            answer_label = '参考答案' if answer_match.group(1) == '参考答案' else '标准答案'
            raw = answer_match.group(2)
            answer = re.search(r'[A-D]+', raw).group()
            continue
        if line.startswith(('说明：', '解析：', '原页面解析：', '注：')):
            original.append(line.replace('\\~', '~'))
    append_question()
assert len(questions) == 37, len(questions)
Path('src/data/health-monitoring-exam.json').write_text(json.dumps(questions, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('已导入', len(questions), '题')
