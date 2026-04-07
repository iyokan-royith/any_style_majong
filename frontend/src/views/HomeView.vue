<template>
  <div class="home">
    <h1>Any Style Mahjong</h1>
    <p>（工事中）</p>
    <RouterLink to="/game">ゲーム</RouterLink>
    <RouterLink to="/debug">デバッグUI</RouterLink>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: monospace;
  background: #1a1a1a;
  color: #eee;
}
h1 { color: #f0c040; }
a { color: #8cf; }
</style>
