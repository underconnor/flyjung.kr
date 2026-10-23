# 787을 참고한 절차적 기체 모델

이미지나 외부 3D 파일 대신 코드로 만든 스타일 모델이다. 787의 긴 동체, 뒤로 쓸린 날개와 수평으로 뻗는 끝단, 두 개의 날개 아래 엔진과 뒤쪽 셰브론, 조종석 창을 참고했다. 제조사 CAD나 정확한 제원 모델로 표시하지 않는다. 항공사 도장·로고는 없다.

## 공유 API

```js
import { createAircraft } from '/aircraft/model.mjs';
const aircraft = createAircraft();
```

- `positions`, `normals`, `colors`: 인덱스 없이 삼각형 세 정점씩 나열한 `Float32Array`. 각 배열은 정점당 XYZ 또는 RGB 세 값이다. RGB는 0–1 범위다.
- `wireSegments`: 선분 양 끝의 XYZ를 여섯 값씩 나열한 `Float32Array`. 표면 삼각형 전체가 아닌 동체 윤곽·단면·날개·엔진·선별한 창을 담아 문자 그래픽에서도 읽히도록 했다.
- `bounds`: `min`, `max`, `center`는 XYZ 배열. `radius`는 경계 상자를 감싸는 구의 반지름이다.
- `parts`: 부품별 `name`, `firstVertex`, `vertexCount`, `firstWire`, `wireCount`. wire의 첫 인덱스와 개수는 선분 단위다.
- `triangleCount`, `name`, `approximation`: 렌더 및 설명용 메타데이터.

좌표는 기수 **+X**, 위 **+Y**, 날개 **±Z**다. 동체 길이는 약 12.4, 날개 폭은 11.86 단위다. 동체 중심축은 원점 근처이며 꼬리날개 때문에 시각적 경계 중심은 조금 높다. 기본 카메라는 +X·+Y·+Z 쪽에서 보면 기수, 엔진 흡입구와 날개를 함께 볼 수 있다.

밝은 은색·라벤더 동체에 인디고 계열 창과 엔진 내부를 적용했다. 밤하늘 색 배경에서 구조가 드러나도록 고른 재료색이다. 동체와 엔진 외피는 매끄러운 법선, 날개와 수직 꼬리는 면 법선을 사용한다. 매우 얇은 날개와 창을 안정적으로 보이려면 면 제거(culling)는 끄고 깊이 검사를 사용한다.

모델 생성은 DOM이나 WebGL에 의존하지 않는다. 같은 3D 점을 WebGL 화면과 문자 그래픽 투영에서 사용할 수 있다. 비공개 원본 PDF·초안·개인 검토 자료는 읽지 않는다.

## 형태 참고

- [Boeing 787 공식 페이지](https://www.boeing.com/commercial/787)의 787-9 길이 62.8m·날개 폭 60.1m 비율을 참고했다.
- [Boeing 787 By Design](https://www.boeing.com/commercial/787/by-design)의 엔진 셰브론 설명을 참고했다.
- 원본 CAD나 실물 표면을 복제한 모델은 아니다. 외부 모델·텍스처 다운로드 없이 수식으로 생성하며, 비행기 모티프의 인터랙션을 비교하는 용도다.
