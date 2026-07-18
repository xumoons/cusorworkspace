#!/usr/bin/env python3
"""PASS3 batch: desloganize priority chapters, trim duplicate tails."""
import re
from pathlib import Path

BASE = Path("/workspace/novels/tuntian-feichai/chapters")
SLOGANS = [
    "可吞可不吞", "可吞亦可不吞", "吞序不吞人", "吞序，不吞人",
    "阵可以换", "不能欠你糊涂", "药线能接", "为大局",
]

# Per-file: keep at most 2 slogan hits total; rewrite excess with cold variants
ALT = {
    "吞序，不吞人": [
        "序可咬，人不作粮",
        "只吞滞与纹，不沾喉",
        "咬规则，不咬同伴",
        "滞断在序里，人不入腹",
    ],
    "吞序不吞人": [
        "序可咬，人不作粮",
        "只吞滞与纹，不沾喉",
    ],
    "阵可以换": [
        "旗断了还能补",
        "损耗在旗上，不在人命上",
        "阵坏了能重布",
    ],
    "不能欠你糊涂": [
        "命可以赊，账不能糊",
        "欠命记清，算计要明",
    ],
    "药线能接": [
        "针线稳伤",
        "缝合皮肉",
        "药香压得住灼",
    ],
    "为大局": [
        "换天下安稳",
        "拿你换九州",
        "大局若要把人写成粮",
    ],
    "可吞可不吞": [
        "脉在嘴边，咽不咽自己定",
        "快在脉心，不许碰",
        "饵在脉尽，拒",
    ],
}


def sc(t):
    return sum(t.count(s) for s in SLOGANS)


def dedupe_paragraphs(text):
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    seen = set()
    out = []
    for p in paras:
        key = re.sub(r"\s+", "", p)
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return "\n\n".join(out) + "\n"


def trim_after_marker(text, marker, keep_marker=True):
    """Keep content through first occurrence of marker (inclusive)."""
    idx = text.find(marker)
    if idx == -1:
        return text
    end = idx + len(marker)
    return text[:end].rstrip() + "\n"


def desloganize(text, keep=2):
    """Replace excess slogan occurrences beyond `keep` total."""
    count = sc(text)
    if count <= keep:
        return text
    to_remove = count - keep
    for slogan in SLOGANS:
        if to_remove <= 0:
            break
        alts = ALT.get(slogan, ["——"])
        while text.count(slogan) > 0 and to_remove > 0:
            alt = alts[to_remove % len(alts)]
            text = text.replace(slogan, alt, 1)
            to_remove -= 1
    return text


# Truncation markers: cut repetitive tails after first clean ending
TRUNC = {
    "第91章-入天门.md": "明日雾起。",
    "第92章-余种.md": "试炼二将启，种已聚，裂已萌。卷四第三章，在雾里等着。",
    "第93章-分裂.md": "两线交，卷四第四章在刃上等着。分裂坐实，两极立，吞道将辨镇与吞。",
    "第94章-试炼一.md": "试炼一回顾尽。卷四第五章，试炼二回顾将启。吞道当前。",
    "第95章-试炼二.md": "试炼二尽。吞道当前。卷四第六章，认主苗头将起。两极对，刃在三尺内，不碰。碰会响。",
    "第96章-认主苗头.md": "认主苗头尽。卷四第七章，焚纹临界将至。异纹近四阶，临界将至。试炼尽吞主当前。",
    "第97章-焚纹临界.md": "焚纹临界尽。卷四第八章，万物皆食，将启。",
    "第124章-第一刀.md": "第一刀章尽。角缺、滞、刃、断税、拒脉心、拒饵、律裂、节点暗、盟、旧部、血账、契根松、围猎退。路长，够修剪网。",
    "第125章-修剪网.md": "修剪网章尽。七律裂、骨架现、可改不必尽灭。反吞试锋将开，路长，够战。",
    "第127章-盟友伤.md": "盟友伤章尽。伤、退、阵不散、盾、药、断税、符影、拒斩、拒饵、不吞人、血账添一笔、契根松、钟鸣、路长。路长够白裁终局，局在下一章。",
    "第71章-围杀令.md": "下一章，白裁升格，精锐至。至之前，围杀令这一章，收在三角东腰漏一线与阿石臂血之间。一线够活，活够继续。",
    "第77章-破东牢.md": "破东牢这一章，收在十族人散入坊与观礼台灯火明之间。之间够活，活够继续。",
    "第78章-摊牌.md": "摊牌这一章，收在「不愿」二字与青玄棋子落石之间。之间够活，活够七十九开战。",
}

PRIORITY = list(TRUNC.keys())

for fname in PRIORITY:
    path = BASE / fname
    text = path.read_text(encoding="utf-8")
    if fname in TRUNC:
        text = trim_after_marker(text, TRUNC[fname])
    text = dedupe_paragraphs(text)
    text = desloganize(text, keep=2)
    path.write_text(text, encoding="utf-8")
    print(f"done {fname}")
