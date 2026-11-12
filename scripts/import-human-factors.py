import json
import re
from pathlib import Path

import pymupdf

root = Path(__file__).resolve().parent.parent
text = (root / '人为因素与航空法规重点题库.md').read_text(encoding='utf-8')
pdf = pymupdf.open(r'C:\Users\29603\Desktop\人为因素和航空法规-学习笔记3.0.pdf')
sections = [text.split('## 一、选择题\n')[1].split('## 二、填空题')[0],
            text.split('## 二、填空题\n')[1].split('## 三、简答题')[0],
            text.split('## 三、简答题\n')[1].split('---')[0]]
answers = [text.split('### 一、选择题答案\n')[1].split('### 二、填空题答案')[0],
           text.split('### 二、填空题答案\n')[1].split('### 三、简答题参考答案')[0],
           text.split('### 三、简答题参考答案\n')[1].split('## PDF 原文索引')[0]]
topics = {
    'murphy': ('2', '墨菲定律（P18）', '2.★海恩法则'),
    'heinrich': ('2', '海恩法则（差错冰山理论）', '3.★事故链理论'),
    'chain': ('2', '事故链理论（P19）', '4.★圆盘漏洞理论'),
    'disc': ('2-3', '圆盘漏洞理论（P20）', '5.“英国航空5390号”'),
    'case': ('4', '（1）圆盘1-人', '分析总结：'),
    'error': ('5', '8.人为差错的形式', '违规——'),
    'violation': ('5', '违规——', '10.★违规行为类型'),
    'violations': ('5-6', '10.★违规行为类型', '11.维修事故等级划分'),
    'violation_habit': ('5', '习惯性违规工作者', '处境违规由于'),
    'violation_situation': ('5', '处境违规由于', '乐观性违规为了'),
    'violation_optimism': ('5-6', '乐观性违规为了', '特例违规由于'),
    'violation_exception': ('6', '特例违规由于', '11.维修事故等级划分'),
    'maintenance': ('6', '12.维修差错类型', '13.MEDA事件模型'),
    'shel': ('7', '模型中居于中心位置的是生命件/人', '15.★REASON模型'),
    'shel_letters': ('7', 'S代表软件；', '中间方块与其他方块'),
    'reason_def': ('7', '15.★REASON模型', 'S代表软件；'),
    'reason_failure': ('8', '工作性质的原因', None),
    'reason_insight': ('9', 'Reason模型的启示:', '16.蝴蝶结模型'),
    'models': ('9', '17.几个模型的总结', None),
    'colour': ('10', '4.色觉障碍包括2类', '5.在以下情况下'),
    'memory': ('11', '13.记忆力的三种类型', '短期记忆允许'),
    'habit': ('12', '15.★习惯动作', '16.★情境意识'),
    'situation': ('12', '16.★情境意识', '17.★幽闭恐惧症'),
    'claustro': ('12', '17.★幽闭恐惧症', '18．★如何应对'),
    'claustro_help': ('12', '18．★如何应对', None),
    'alcohol': ('13', '4.★酒精', '5.★药物'),
    'medicine': ('13', '5.★药物', '6.物理环境因素'),
    'alcohol_medicine': ('13', '4.★酒精', '6.物理环境因素'),
    'arousal': ('13', '7.★觉醒水平', '8.★生物节律'),
    'arousal_effect': ('13', '觉醒主要缘于', None),
    'workload': ('13', '2.工作负荷对工作表现的影响', '3.睡眠规律'),
    'rhythm': ('13', '8.★生物节律', '觉醒主要缘于'),
    'rhythm_effect': ('14', '相当数量的与人为差错有关', '9.★马斯洛层次需求理论'),
    'maslow': ('14-15', '9.★马斯洛层次需求理论', '动机的定义。'),
    'twelve': ('17', '2.★人为因素十二陷阱', '第六章法规框架'),
    'ccar': ('17', 'CCAR:', '1.国际民用航空组织'),
    'airworthiness': ('18', '1.适航管理的定义', '5.民用航空器的国籍管理规定'),
    'directive': ('18', '2.维修管理指令', '第九章民用航空器维修单位'),
    'principle': ('18', '1.维修单位合格审定过程中的', '145部《民用航空器维修单位'),
}
mapping = [
    ['heinrich']*3 + ['chain']*2 + ['disc']*3 + ['error']*3 + ['violation'] + ['violation_habit','violation_situation','violation_optimism','violation_exception'] + ['maintenance']*2 + ['shel']*2 + ['shel_letters'] + ['reason_def','reason_failure','reason_failure'] + ['models']*2 + ['colour','memory','situation','claustro','claustro_help','alcohol','medicine','arousal','workload','maslow','twelve','ccar','ccar','airworthiness','airworthiness','principle'],
    ['murphy','heinrich','disc','error','error','violations','maintenance','shel_letters','shel','reason_def','reason_failure','reason_insight','colour','memory','habit','situation','alcohol_medicine','arousal','maslow','twelve','ccar','ccar','airworthiness','airworthiness','principle'],
    ['heinrich','chain','disc','case','error','violation','violations','maintenance','shel+shel_letters','reason_def+reason_failure+reason_insight','models','habit+situation','claustro_help','arousal+arousal_effect','rhythm+rhythm_effect','maslow','twelve','airworthiness','ccar','directive+principle'],
]

def excerpt(topic):
    page, start, end = topics[topic]
    first, *last = map(int, page.split('-'))
    final = last[0] if last else first
    # Remove PDF line wrapping and page numbers, preserving source characters.
    content = ''.join(re.sub(r'\s+', '', re.sub(r'^\d+\s*\n', '', pdf[n-1].get_text())) for n in range(first, final + 1))
    start_pos = content.index(re.sub(r'\s+', '', start))
    end_pos = content.index(re.sub(r'\s+', '', end), start_pos) if end else len(content)
    value = content[start_pos:end_pos].strip()
    value = re.sub(r'(?<!^)（([1-5])）', r'\n（\1）', value)
    value = re.sub(r'(?<!^)([①②③④⑤⑥⑦])', r'\n\1', value)
    return page, value

questions = []
for group, (section, answer_section) in enumerate(zip(sections, answers)):
    items = re.split(r'(?m)^\d+\. ', section.strip())[1:]
    keys = re.split(r'(?m)^\d+\. ', answer_section.strip())[1:]
    assert len(items) == len(keys) == len(mapping[group])
    for i, (item, key, topic_names) in enumerate(zip(items, keys, mapping[group])):
        lines = item.strip().splitlines()
        stem = lines[0].strip()
        options = []
        if group == 0:
            stem = stem.removeprefix('根据笔记，')
            options = re.split(r'\s*[A-D]\.\s*', lines[1].strip())[1:]
            answer = re.match(r'[A-D]', key.strip()).group()
            assert len(options) == 4
        else:
            answer = key.strip().removesuffix('。')
        extracts = [excerpt(name) for name in topic_names.split('+')]
        page = '、'.join(dict.fromkeys(p for p, _ in extracts))
        source = '\n\n'.join(value for _, value in extracts)
        questions.append(dict(id=f'hf-{group + 1}-{i + 1}', type=['single', 'fill-blank', 'short-answer'][group],
                              stem=stem, options=options, answer=answer, explanation='', chapter='', score=5,
                              sourceText=source, sourcePage=page))

(root / 'src/data/human-factors-exam.json').write_text(json.dumps(questions, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Imported {len(questions)} questions')
