#!/usr/bin/env python3
"""Проверка, что ссылки и видео из data.js живы.

Мёртвой считается ссылка с ответом 404 или 410 и видео, которого нет на YouTube — это код выхода 1.
Остальные ответы (403 от защиты от ботов, 429, таймауты) печатаются как предупреждения:
их стоит открыть руками, но сборку они не роняют.

Запуск: python3 scripts/check_links.py
"""
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from roadmap import load, subs

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OEMBED = "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v="
DEAD = {404, 410}


def status(url, tries=3):
    last = "нет ответа"
    for attempt in range(tries):
        if attempt:
            time.sleep(3 * attempt)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ru,en"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if e.code in DEAD:
                return e.code
            last = e.code
        except Exception as e:  # таймаут, DNS, TLS
            last = type(e).__name__
    return last


def main():
    D = load()["D"]
    links, videos = {}, {}
    for key, _, _, u in subs(D):
        for f in "adp":
            for m in u.get(f) or []:
                links.setdefault(m[1], []).append(key)
        for v in u.get("v") or []:
            videos.setdefault(v[0], []).append(key)

    with ThreadPoolExecutor(6) as ex:
        link_res = dict(zip(links, ex.map(status, links)))
        video_res = dict(zip(videos, ex.map(lambda v: status(OEMBED + v), videos)))

    dead, soft = [], []
    for url, code in link_res.items():
        if code in DEAD:
            dead.append(f"{code} {url} ({', '.join(links[url])})")
        elif code != 200:
            soft.append(f"{code} {url}")
    for vid, code in video_res.items():
        where = f"https://youtu.be/{vid} ({', '.join(videos[vid])})"
        if code in DEAD:
            dead.append(f"{code} видео удалено: {where}")
        elif code == 401:
            soft.append(f"401 видео нельзя встроить на сайт: {where}")
        elif code != 200:
            soft.append(f"{code} {where}")

    print(f"Ссылок: {len(links)}, видео: {len(videos)}")
    for s in sorted(soft):
        print("проверь руками:", s)
    for d in sorted(dead):
        print("МЁРТВАЯ:", d)
    print(f"Мёртвых: {len(dead)}, требуют ручной проверки: {len(soft)}")
    return 1 if dead else 0


if __name__ == "__main__":
    sys.exit(main())
