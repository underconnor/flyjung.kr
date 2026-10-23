# 787-9 형태 연구 · 두 번째 모델

기존 `aircraft/model.mjs`를 유지하면서 새 절충 시안에서 사용할 별도 모델이다.
Boeing의 787-9 공식 치수 도면을 기준으로 비율과 실루엣을 다듬었다.
제조사 CAD나 정확한 공학 모델이 아닌, 원본 코드로 생성하는 형태 연구다.
외부 이미지·모델·텍스처·항공사 도장은 사용하지 않는다.

## 기존 모델에서 조정한 부분

- 원통형 객실 구간을 앞으로 늘리고 기수 단면을 촘촘히 배치했다. 길고
  뾰족한 원뿔처럼 보이던 코를 짧고 둥근 레이돔 형태로 바꿨다.
- 주날개를 앞쪽으로 옮기고 뿌리와 중간 부분의 시위를 줄였다. 안쪽 후연의
  비교적 곧은 구간, 바깥쪽으로 좁아지는 날개, 뒤로 뻗는 얇은 끝단을 구분했다.
- 날개 끝 높이를 약 0.79에서 0.425로 낮췄다. 수직 윙렛 없이 완만한
  위쪽 휨을 가지며, 큰 부메랑처럼 휘어지는 과장을 줄였다.
- 수평 꼬리날개 폭을 약 4.7에서 3.91로 줄이고, 수직 꼬리의 뿌리와
  후연 위치를 실제 측면 비율에 가깝게 옮겼다.
- 두 엔진을 앞쪽으로 옮기고 나셀 길이와 파일런을 조정했다. 앞쪽 흡입구,
  팬·스피너, 뒤쪽 셰브론은 실제 삼각형으로 유지했다.
- 더 둥근 기수 위에 조종석 창을 다시 배치했다. 객실 창은 작고 촘촘하게
  배치하되 ASCII용 선에는 일부만 포함해 윤곽을 가리지 않게 했다.

## API

```js
import { createAircraft } from '/aircraft-v2/model.mjs';
const aircraft = createAircraft();
```

기존 모델과 동일한 API이며 DOM이나 렌더러에 의존하지 않는다.

- `positions`, `normals`, `colors`: 인덱스 없는 삼각형 정점의 `Float32Array`.
  XYZ 또는 RGB 세 값씩이며, 색상은 0–1 범위다.
- `wireSegments`: 선분 양 끝의 XYZ 여섯 값씩 담은 `Float32Array`.
  동체 윤곽·선별한 단면·날개 외곽·패널 선·엔진·일부 창을 담는다.
- `bounds`: XYZ 배열인 `min`, `max`, `center`와 경계 구의 `radius`.
- `parts`: `name`, `firstVertex`, `vertexCount`, `firstWire`, `wireCount`.
  wire의 인덱스와 개수는 선분 단위다.
- `name`, `approximation`, `triangleCount`: 메타데이터.

기수는 **+X**, 위는 **+Y**, 날개는 **±Z**다. 길이 12.4, 주날개 폭 11.86,
동체 폭 약 1.136이다. 단면 높이는 폭보다 약 3% 크다. 꼬리 높이 때문에
경계 중심은 원점보다 높으므로 화면 맞춤에는 `bounds.center`를 사용한다.
날개 끝과 창 같은 얇은 부분은 깊이 검사를 켜고 양면으로 렌더하면 안정적이다.

모션·회전·카메라·사용자 입력은 뷰어에서 처리한다. 이 모듈은 같은 입력 없이
호출할 때 항상 같은 정적 기체 좌표를 반환하므로 WebGL과 ASCII에서 공용한다.

## 형태 참고

- [Boeing 787 공식 제원](https://www.boeing.com/commercial/787): 787-9 길이
  62.8m, 날개 폭 60.1m.
- [Boeing 787 Airplane Characteristics for Airport Planning, Rev P](https://www.boeing.com/content/dam/boeing/v2/airports/acaps/787_Rev_P.pdf):
  2.2.2, 인쇄 페이지 2-6 / PDF 21쪽의 787-9 평면·측면·정면도를 확인했다.
  도면의 전체 비율, 주날개 뿌리·끝단, 엔진 위치, 꼬리날개 폭을 참고했다.
- [Boeing 787 By Design](https://www.boeing.com/commercial/787/by-design):
  엔진 뒤쪽 셰브론 형태 설명.

공식 도면은 형태 판단에만 사용하며 파일·이미지를 사이트에 포함하지 않는다.
