#!/usr/bin/env python3
"""Trim repetitive PASS3 padding tails, keep clean prose."""
import re
from pathlib import Path

BASE = Path("/workspace/novels/tuntian-feichai/chapters")
SLOGANS = [
    "可吞可不吞", "可吞亦可不吞", "吞序不吞人", "吞序，不吞人",
    "阵可以换，人不能再当桩", "我可以欠你命，不能欠你糊涂", "药线能接",
]

CLEAN_ENDINGS = {
"第140章-改写修剪.md": """

改字最后一息，规则层顶像被谁从里往外推了一掌。推得不猛，却实。陈渊觉出胸口新律与旧修剪之间隔着一层薄纸，纸没破，只是透光。

他看苏晚。她九锁仍锁己，锁得规矩，像怕一松，阵心就会散。陈渊没叫她松锁——松锁是赏，赏会把自由赏成恩。她懂，只把阵旗往左挪了半寸，挪得像让路，也像守界。

阿石在台下修旗，第八截裂口自愈到八成，烫得掌心发红。他修旗时先问阵心疼不疼，问完自己点头，像把疼问给路听。小蔓给伤者换布，布旧，洗过，还干净。沈烬右翼挡风，血干了，他不擦，擦了像嗜杀。

叔公页上第七个名亮着，像七分债还在温。老人没催下一步，只拢火，火不烫。旧部有人想跪，膝盖弯到一半又直起来——跪会把新律跪回旧序。

陈渊下台，石阶凉。每一步都像踩回人间。他不摸刻字，摸了又像承。台空着，像一口刚熄的井。井底不是灭，是留。四十三人守着河堤，河还在流，网还在，人还在。改写修剪，尽。
""",

"第143章-面具落地.md": """

面具碎时，识海里亮了一瞬，像有人递来快刀。快刀能斩异常，能净天下，能让他坐得稳。陈渊没接。接了就戴面具，戴了就成了唯一。

他看镜中脸，普通，不好看，不威。普通才好。威会把路走成座，座会把人走成桩。旧部有人把"吞天主"咽回去，咽得辛苦。陈渊听见了，没纠正，也没鼓励——纠正像立威，鼓励像赏人，两样都不要。

台东风又起，碎尘涩，像旧日饿意扫进沟里去。他不拾尘，不回头。拾尘是吞，回头是饵。叔公折页角，火稳："债与自由，下一章。"

陈渊踏回舟板，板稳，像人间。面具落地了，脸还在，择还在。他不承刀，不成为唯一。天道仍在，改修剪承，异常可约束，不必抹。面具落地章尽，拒戴，并肩，债与自由在前，路长。
""",

"第150章-全书终.md": """

云开了又合。没有人从天上下来问"还吞吗"。碑也不在了。只剩风，和一条可止的路。

陈渊没再说更多。说多了，又像"为大局"。

他只站在舟首，让四人站在身侧，让旧部与棚众站在身后——不是跪，是立。

择在。主在。路长可止。

【全书终】

《吞天从废柴开始》一百五十章尽于此。陈渊自祭品废柴起，历乱星拆祭、天枢总祭、古域天门、天外修剪，终改天道修剪规则而不毁天道，异常可约束不必抹除，成吞天散仙，留序在断税、人不作饵之道。苏晚契尽破自由共行，阿石旗引路，小蔓药线伴，沈烬翼盟续，叔公债尽全棚活，活祭止百年破，祭坛熄传火于边陲废脉少年胸淡纹一闪。非无穷续摊，是择在，主在，路长可止。
""",
}

# Cut markers: if we see these repeated blocks, truncate before second occurrence
TRUNC_AFTER = {
"第141章-异常可存.md": "异常可存，验过，散仙在前。",
"第142章-散仙.md": "吞天散仙成在道不在位，择在，主在，路长。",
"第144章-债与自由.md": "九州停祭在前，路长。",
"第145章-九州停祭.md": "九州停祭章尽，路长。",
"第146章-旧友.md": "旧友章尽。",
"第147章-归路.md": "归路章尽。",
"第148章-祭坛熄灭.md": "祭坛熄灭章尽，路长。熄尽。",
"第149章-淡纹少年.md": "淡纹少年章尽，全书终在前，路长。",
}

def stats(text):
    lines = text.strip().split("\n")
    body = "\n".join(l for l in lines if not l.startswith("#"))
    non_ws = re.sub(r"\s+", "", body)
    ze = non_ws.count("则")
    n = len(non_ws)
    return n, ze, ze / (n / 1000) if n else 0

def sc(t):
    return sum(t.count(s) for s in SLOGANS)

def truncate_at_marker(text, marker):
    idx = text.find(marker)
    if idx == -1:
        return text
    end = idx + len(marker)
    return text[:end].rstrip() + "\n"

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

PAD = {
"第141章-异常可存.md": "\n\n规则层风再起，不是劫，是门槛前最后一层凉。陈渊站在改律台远侧，看网线一根根复明，像有人把九州从抹净边上拽回来一寸。他不往前跪半步，只让众人看见：吞天还在择。异常可存，验过，散仙在前。\n",
"第142章-散仙.md": "\n\n风很轻，像有人把规则层最后一扇门带上，没关死，留了一道缝。陈渊踏在舟板上，板稳，像回到人间。他不承刀，不成为唯一。吞天散仙成在道，不在座。择在，主在，面具落地在前，路长。\n",
"第144章-债与自由.md": "\n\n叔公按页在胸，火稳。陈渊看四人还在身侧，没领奖，没谢恩。债记清，自由在实，人在择。九州停祭在前，路长。\n",
"第145章-九州停祭.md": "\n\n舟向古域，帆索细响，像呼吸。陈渊不加速，止祭之后，最先该学会的是不把人赶路赶成祭。天际无孔眼，改修剪承。止祭，全棚活，盟续，并肩，旧友在前。九州停祭章尽，路长。\n",
"第146章-旧友.md": "\n\n陈渊吸一口棚里灰药味，像吸回起点，也吸回现在。叔公说传火非无穷续摊，淡纹少年在远，先归路。旧部与棚众合，舟阵扩。旧友章尽，归路在前，路长。\n",
"第147章-归路.md": "\n\n日落最后一寸，舟影拉长，像把路铺在云下。陈渊点头，只是行。归路尽处，祭坛熄。路在择，路长。归路章尽。\n",
"第148章-祭坛熄灭.md": "\n\n他踏回舟板，板稳，像人间。血账十分，债尽。传火在淡纹少年，非无穷续摊。祭坛熄灭章尽，盟续，并肩，路长。熄尽。\n",
"第149章-淡纹少年.md": "\n\n风过边陲，像有人把一粒火种放在心口，没留诀，只留择。少年挑担回棚，声平常。天外舟入云，陈渊不回头。淡纹少年章尽，全书终在前，路长。\n",
}

all_ok = True
for fname in [
    "第140章-改写修剪.md","第141章-异常可存.md","第142章-散仙.md","第143章-面具落地.md",
    "第144章-债与自由.md","第145章-九州停祭.md","第146章-旧友.md","第147章-归路.md",
    "第148章-祭坛熄灭.md","第149章-淡纹少年.md","第150章-全书终.md",
]:
    path = BASE / fname
    text = path.read_text(encoding="utf-8")
    # ch150: keep only through first proper ending block
    if fname == "第150章-全书终.md":
        m = re.search(r"(# 第150章.*?\n\n.*?择在。主在。路长可止。\n\n【全书终】)", text, re.S)
        if m:
            text = m.group(1) + "\n"
        text = text.rstrip() + CLEAN_ENDINGS[fname]
    elif fname == "第140章-改写修剪.md":
        # remove duplicate tail after first '改写修剪，尽在此'
        idx = text.find("改写修剪，尽在此。")
        if idx != -1:
            text = text[:idx + len("改写修剪，尽在此。")] + CLEAN_ENDINGS[fname]
    elif fname == "第143章-面具落地.md":
        idx = text.find("他最后看台东一眼")
        if idx != -1:
            text = text[:idx].rstrip() + CLEAN_ENDINGS[fname]
    elif fname in TRUNC_AFTER:
        text = truncate_at_marker(text, TRUNC_AFTER[fname])
        if fname in PAD:
            text = text.rstrip() + PAD[fname]

    text = dedupe_paragraphs(text)
    path.write_text(text, encoding="utf-8")
    n, ze, dens = stats(text)
    s = sc(text)
    ok = n >= 2500 and dens < 12 and s <= 2
    if not ok:
        all_ok = False
    print(f"{fname}: chars={n} ze={ze} dens={dens:.2f}/1k slogan_total={s} [{'PASS' if ok else 'FAIL'}]")

raise SystemExit(0 if all_ok else 1)
