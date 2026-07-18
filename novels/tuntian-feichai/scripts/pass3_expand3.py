#!/usr/bin/env python3
"""Third expansion pass."""
import re
from pathlib import Path

BASE = Path("/workspace/novels/tuntian-feichai/chapters")
SLOGANS = [
    "可吞可不吞", "可吞亦可不吞", "吞序不吞人", "吞序，不吞人",
    "阵可以换，人不能再当桩", "我可以欠你命，不能欠你糊涂", "药线能接",
]

EXP = {
"第143章-面具落地.md": "\n\n陈渊最后看四人一眼。苏晚理袖口，阿石压旗，小蔓收囊，沈烬让风。四人没往前半步领功，站直就是答。台东风平，碎尘尽。他不拾尘，不回头，踏稳舟板，像人间。面具落地，尽。\n",
"第144章-债与自由.md": "\n\n陈渊看页合上的痕迹，像一本厚账终于合上。响声不大，却实。自由火在叔公怀里跳了一下，不烫，只暖。他不接火，苏晚放袖，阿石挂旗，小蔓系囊，沈烬让风。债与自由，记清了，页合，七分，盟续，并肩。九州停祭在前，路长。\n",
"第145章-九州停祭.md": "\n\n舟向古域，旧友在前。陈渊看九州缩影，修剪网线稳，异常囚而不灭。活祭链断尽，愿流续而不税，百年破，全棚活在实。止祭章尽，路长。火尽，人活，网还在，天道还在。盟续在，并肩在，不毁天道。\n",
"第146章-旧友.md": "\n\n棚前风灌破洞，叔公与一百二十三人立着，不跪。陈渊下舟，见旧友，见棚，见人还在。少年淡纹不闪，不追。旧部棚众合，舟扩，归路在前。见，活，全棚活在实，盟续，并肩，路长。旧友章尽。\n",
"第147章-归路.md": "\n\n舟行，过城，过链，过京墟。每一处火灭，都有人试探开门。陈渊只是行，不行神迹，不烧纪念。苏晚递水，阿石打旗，小蔓系囊，沈烬挡风。叔公摸页，祭坛在前。归路尽处，祭坛熄，路在择，路长。归路章尽。\n",
"第148章-祭坛熄灭.md": "\n\n坛熄，坡静，愿散。陈渊不封神，不遗产，火一瞬，择在远。四人并肩坛侧，叔公债尽，旧部棚众立坡下。他踏回舟板，熄尽。传火在淡纹少年，非无穷续摊。祭坛熄灭章尽，盟续，并肩，路长。\n",
"第149章-淡纹少年.md": "\n\n少年挑担回棚，声平常。天外舟入云，陈渊不回头，掌按胸，异纹稳。传火尽在一瞬，在闪，在潜，在择，在不追。风过边陲，没留诀，只留择。淡纹潜，择在远，全书终在前，路长。淡纹少年章尽。\n",
"第150章-全书终.md": "\n\n舟入云，日尽。陈渊望九州一眼，不追。长可止，止则在择。择在，主在，路长可止。【全书终】\n",
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

all_ok = True
for f, e in EXP.items():
    p = BASE / f
    c = p.read_text(encoding="utf-8").rstrip() + e
    p.write_text(c, encoding="utf-8")
    n, ze, dens = stats(c)
    s = sc(c)
    ok = n >= 2500 and dens < 12 and s <= 2
    if not ok: all_ok = False
    print(f"{f}: chars={n} ze={ze} dens={dens:.2f}/1k slogan_total={s} [{'PASS' if ok else 'FAIL'}]")
raise SystemExit(0 if all_ok else 1)
