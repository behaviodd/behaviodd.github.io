import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 빌드 결과물은 Jekyll(GitHub Pages)이 그대로 서빙하는 저장소 루트의
// /work-hours/ 폴더로 내보낸다. base를 상대경로로 두어 어떤 하위 경로에
// 배포되어도 에셋이 깨지지 않게 한다.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../work-hours",
    emptyOutDir: true,
  },
});
