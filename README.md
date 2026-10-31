# 내 포트폴리오 — 시작

1주 금요일에 받아서, **매주 금요일에 카드 한 칸**을 더합니다. 9주가 끝나면 링크 하나로 9주가 보입니다.

## 한 칸 더하기

`portfolio.json` 의 `cards` 에 이 모양으로 하나를 넣습니다.

```json
{"week": 1, "title": "감을 잡자!", "line": "서울에 눈이 얼마나 오는지 다섯 문항으로 맞혀 보는 퀴즈. 폰에서 풀 수 있습니다",
 "judgment": "내가 내린 판단 — 눈 온 날을 하루 1cm 이상으로 정하고 그 기준을 문항 문장에 넣었다. 정답 하나는 엑셀로 직접 세어 맞췄다",
 "ai": ["Claude Code", "v0", "Perplexity"], "url": "https://gam-test-one.vercel.app/", "img": "img/w1.jpg"}
```

- **`judgment` 가 가장 중요합니다.** 무엇을 만들었는지보다 **무엇을 정했는지**가 남에게 보여줄 것입니다
- 화면 캡처를 `img/` 에 넣고 `img` 에 경로를 적습니다 (없으면 비워 둡니다)
- 9주차에 `proposal` 을 채웁니다 — 제안 1건

## 올리기

Vercel → Import → Application Preset: Other → Deploy. 한 번 올리면 이후에는 `git push` 할 때마다 다시 올라갑니다.
