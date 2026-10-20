# GLITCH//VECTOR

Arena twin-stick shooter con estética synthwave, 100% generativo y sin assets externos.
Phaser 3.70.0 se carga por CDN; todas las texturas, la música y los efectos se generan por código.

## Controles

| Acción | Tecla |
|---|---|
| Mover | `WASD` o flechas |
| Apuntar | Ratón |
| Disparar | Click izquierdo o `Space` |
| Pausa | `P` o `Esc` |
| Silenciar | `M` |
| Reiniciar | Click o `Space` en Game Over |

## Reglas rápidas

- Tienes 3 escudos y 1.5 s de invulnerabilidad tras recibir daño.
- Solo puedes tener 3 balas activas; rebotan en paredes y en el cubo central.
- El HUD muestra 3 formas objetivo. Destrúyelas en orden para subir el multiplicador hasta x8.
- Cada 5 oleadas aparece un jefe. Los jefes están exentos de la secuencia.
- Cada cierto tiempo ocurre un Glitch de 8 s: inversión, sobrecarga o desorientación.

## Comandos

```bash
npm install       # instala esbuild y Terser
npm run dev       # servidor local en http://localhost:8080
npm run check     # valida sintaxis
npm test          # tests unitarios de reglas
npm run build     # genera dist/index.html y aplica el límite de 50 KB
npm run verify    # check + test + build
```

## Estructura

```
src/
  main.js          configuración de Phaser
  config.js        constantes, paleta y definiciones de enemigos
  rules.js         reglas puras y RNG determinista
  textures.js      texturas procedurales
  audio.js         scheduler Web Audio, música y SFX
  player.js        movimiento, escudos y disparo
  bullets.js       pool de balas del jugador
  enemyBullets.js  pool de proyectiles enemigos
  enemies.js       IA de los 5 enemigos, minis y jefe
  waves.js         Target Sequence y composición de oleadas
  glitch.js        temporizador y efectos Glitch
  fx.js            grilla, partículas, shake y textos
  ui.js            HUD y overlays
  scenes.js        Boot, Menu, Game y UI
```

## Restricciones

- Código propio minificado: menos de 50 000 bytes (`npm run build` lo verifica).
- 0 imágenes, fuentes o audios externos.
- Sin backend, sin telemetría y sin dependencias de runtime además de Phaser.
- Desktop: Chrome, Firefox y Edge. Sin controles táctiles.

## Smoke test

- `?autostart=1` arranca la partida sin pasar por el menú.
- `?seed=42` fija la semilla del RNG para reproducir oleadas.
- La instancia de Phaser queda expuesta en `window.__GV_GAME__` para inspección desde la consola del navegador.
