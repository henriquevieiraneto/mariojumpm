// ===== ELEMENTOS DO DOM =====
const mario = document.querySelector('.mario');
const pipe = document.querySelector('.pipe');
const gameboard = document.querySelector('.gameboard');
const dayBg = document.querySelector('.day-bg');
const clouds = document.querySelector('.clouds');
const sol = document.querySelector('.sol');
const lua = document.querySelector('.lua');
const rain = document.querySelector('.rain');
const gameOverImg = document.querySelector('.game-over');
const startScreen = document.querySelector('.start-screen');
const startButton = document.getElementById('startButton');
const highScoreDisplayStart = document.querySelector('.start-screen .high-score');
const pauseMenu = document.querySelector('.pause-menu');
const resumeButton = document.getElementById('resumeButton');
const restartButtonPause = document.getElementById('restartButtonPause');
const quitButton = document.getElementById('quitButton');

// ===== VARIÁVEIS DO JOGO =====
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;
let isJumping = false;
let isRaining = false;
let isPaused = false;
let timeOfDay = 'day';
let hasScoredForCurrentPipe = false;
let pipeHorizontalPosition = 0;
const baseSpeed = 800;
let pixelsPerSecond = baseSpeed;
let gameLoopRequestId;
let lastTime = 0;

// ===== INICIALIZAÇÃO =====
// Criar elementos dinâmicos
const nightBg = document.createElement('div');
nightBg.className = 'background night-bg';
gameboard.insertBefore(nightBg, dayBg);

const scoreDisplay = document.createElement('div');
scoreDisplay.className = 'score-display';
gameboard.appendChild(scoreDisplay);

// Criar botão de pausa
const pauseButton = document.createElement('button');
pauseButton.className = 'pause-button';
pauseButton.innerHTML = '⏸';
gameboard.appendChild(pauseButton);

// Configurar valores iniciais
scoreDisplay.textContent = `Score: ${score}`;
highScoreDisplayStart.textContent = `Recorde: ${highScore}`;

// ===== FUNÇÕES DO JOGO =====
/**
 * Inicia o jogo
 */
function startGame() {
    console.log('startGame function called');
    // Resetar estado do jogo
    score = 0;
    isRaining = false;
    isPaused = false;
    gameboard.classList.remove('raining');
    scoreDisplay.textContent = `Score: ${score}`;
    gameOver = false;
    isJumping = false;
    hasScoredForCurrentPipe = false;
    pixelsPerSecond = baseSpeed;

    // Posicionar elementos
    pipeHorizontalPosition = gameboard.offsetWidth + Math.random() * 200 + 100;
    pipe.style.left = `${pipeHorizontalPosition}px`;

    // Resetar personagem
    mario.style.display = 'block';
    gameOverImg.style.display = 'none';
    mario.src = './images/mario.gif';
    mario.style.width = '100px';
    mario.style.bottom = '0px';
    mario.style.left = '40px';
    mario.style.marginLeft = '0';
    mario.classList.remove('jump');

    // Configurar cenário
    clouds.style.animation = 'clouds-animation 25s infinite linear';
    timeOfDay = 'day';
    gameboard.classList.remove('night');
    pauseMenu.style.display = 'none';
    pauseButton.innerHTML = '⏸';

    // Resetar chuva
    rain.src = './images/chuva.gif?' + new Date().getTime();

    // Remover tela de reinício se existir
    const existingRestartScreen = gameboard.querySelector('.restart-screen');
    if (existingRestartScreen) {
        gameboard.removeChild(existingRestartScreen);
    }

    // Iniciar jogo
    gameboard.classList.add('game-started');
    startScreen.style.display = 'none';

    // Iniciar loop do jogo
    lastTime = 0;
    cancelAnimationFrame(gameLoopRequestId); // Cancelar qualquer loop anterior
    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

/**
 * Faz o Mário pular
 */
function jump(event) {
    // Prevenir comportamento padrão em eventos de toque
    if (event && (event.type === 'touchstart' || event.type === 'click')) {
        event.preventDefault();
    }

    if (gameboard.classList.contains('game-started') && !isJumping && !gameOver && !isPaused) {
        isJumping = true;
        mario.classList.add('jump');

        setTimeout(() => {
            mario.classList.remove('jump');
            isJumping = false;
        }, 500);
    }
}

/**
 * Pausa/despausa o jogo
 */
function togglePause() {
    console.log('togglePause function called');
    if (gameOver) return;

    isPaused = !isPaused;

    if (isPaused) {
        pauseMenu.style.display = 'block';
        cancelAnimationFrame(gameLoopRequestId);
        pauseButton.innerHTML = '▶';
        clouds.style.animationPlayState = 'paused';
    } else {
        pauseMenu.style.display = 'none';
        lastTime = performance.now(); // Resetar o tempo para evitar saltos
        gameLoopRequestId = requestAnimationFrame(gameLoop);
        pauseButton.innerHTML = '⏸';
        clouds.style.animationPlayState = 'running';
    }
}

/**
 * Verifica colisão entre Mário e cano
 */
function checkCollision() {
    const pipeRect = pipe.getBoundingClientRect();
    const marioRect = mario.getBoundingClientRect();

    return (
        pipeRect.left < marioRect.right - 30 &&
        pipeRect.right > marioRect.left + 30 &&
        pipeRect.top < marioRect.bottom - 5
    );
}

/**
 * Atualiza a pontuação
 */
function updateScore() {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    hasScoredForCurrentPipe = true;

    // Mudar dia/noite a cada 10 pontos
    if (score % 10 === 0) {
        toggleDayNight();
    }

    // Ativar/desativar chuva a cada 25 pontos
    if (score % 25 === 0) {
        isRaining = !isRaining;
        gameboard.classList.toggle('raining', isRaining);
        pixelsPerSecond = isRaining ? baseSpeed * 0.7 : baseSpeed;

        // Resetar animação da chuva
        if (isRaining) {
            rain.src = './images/chuva.gif?' + new Date().getTime();
        }
    }
}

/**
 * Alterna entre dia e noite
 */
function toggleDayNight() {
    if (timeOfDay === 'day') {
        gameboard.classList.add('night');
        timeOfDay = 'night';
        scoreDisplay.classList.add('night-mode');
    } else {
        gameboard.classList.remove('night');
        timeOfDay = 'day';
        scoreDisplay.classList.remove('night-mode');
    }
}

/**
 * Finaliza o jogo
 */
function endGame() {
    gameOver = true;
    cancelAnimationFrame(gameLoopRequestId);

    // Pausar animações
    clouds.style.animationPlayState = 'paused';

    // Congelar posições no momento da colisão
    const pipePositionOnCollision = pipe.offsetLeft;
    pipe.style.left = `${pipePositionOnCollision}px`;

    const marioBottom = parseFloat(window.getComputedStyle(mario).bottom);
    mario.style.bottom = `${marioBottom}px`;

    // Mostrar imagem de game over
    mario.style.display = 'none';
    gameOverImg.style.display = 'block';
    gameOverImg.style.bottom = `${marioBottom}px`;

    // Esconder menu de pausa se estiver visível
    pauseMenu.style.display = 'none';
    pauseButton.style.display = 'none';

    // Atualizar recorde se necessário
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }

    // Mostrar tela de reinício após breve delay
    setTimeout(() => {
        showRestartScreen();
    }, 500);
}

/**
 * Mostra a tela de reinício
 */
function showRestartScreen() {
    const restartScreen = document.createElement('div');
    restartScreen.className = 'restart-screen';
    restartScreen.innerHTML = `
        <div class="score">Pontuação: ${score}</div>
        <div class="high-score">Recorde: ${highScore}</div>
        <button id="restartButton">Jogar Novamente</button>
    `;
    gameboard.appendChild(restartScreen);

    // Configurar botão de reinício
    const restartButtonGameOver = document.getElementById('restartButton');
    restartButtonGameOver.addEventListener('click', () => {
        console.log('Restart button (Game Over) clicked');
        window.location.reload();
    });
    console.log('Restart button (Game Over) event listener added');

    // Focar no botão para melhor acessibilidade
    restartButtonGameOver.focus();
}

/**
 * Loop principal do jogo
 */
function gameLoop(timestamp) {
    if (gameOver || isPaused) return;

    // Inicializar lastTime no primeiro frame
    if (lastTime === 0) {
        lastTime = timestamp;
        gameLoopRequestId = requestAnimationFrame(gameLoop);
        return;
    }

    // Calcular delta time para movimento independente de FPS
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Mover cano
    const pipeMovement = pixelsPerSecond * deltaTime;
    pipeHorizontalPosition -= pipeMovement;
    pipe.style.left = `${pipeHorizontalPosition}px`;

    const pipeRightEdge = pipeHorizontalPosition + pipe.offsetWidth;
    const marioLeftEdge = mario.offsetLeft;

    // Reposicionar cano quando sair da tela
    if (pipeRightEdge < 0) {
        pipeHorizontalPosition = gameboard.offsetWidth + Math.random() * 200 + 100;
        pipe.style.left = `${pipeHorizontalPosition}px`;
        hasScoredForCurrentPipe = false;
    }
    // Atualizar pontuação quando passar pelo cano
    else if (pipeRightEdge < marioLeftEdge && !hasScoredForCurrentPipe) {
        updateScore();
    }

    // Verificar colisão
    if (pipeHorizontalPosition < mario.offsetLeft + mario.offsetWidth && pipeRightEdge > mario.offsetLeft) {
        if (checkCollision()) {
            endGame();
            return;
        }
    }

    // Continuar o loop
    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

// ===== EVENT LISTENERS =====
// Botão de iniciar
startButton.addEventListener('click', startGame);
startButton.addEventListener('touchstart', startGame);
console.log('Start button event listeners added');

// Controles de teclado
document.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump(e);
    } else if (e.code === 'Escape') {
        togglePause();
    }
});

// Controles de toque - área do jogo inteira
gameboard.addEventListener('touchstart', jump);
gameboard.addEventListener('click', jump);

// Botão de pausa
pauseButton.addEventListener('click', togglePause);
console.log('Pause button event listener added');

// Menu de pausa
resumeButton.addEventListener('click', togglePause);
console.log('Resume button event listener added');

restartButtonPause.addEventListener('click', () => {
    console.log('Restart button (Pause Menu) clicked');
    window.location.reload();
});
console.log('Restart button (Pause Menu) event listener added');

quitButton.addEventListener('click', () => {
    console.log('Quit button clicked');
    gameboard.classList.remove('game-started');
    startScreen.style.display = 'flex';
    pauseMenu.style.display = 'none';
    cancelAnimationFrame(gameLoopRequestId);
});
console.log('Quit button event listener added');

// Atualizar exibição do recorde
highScoreDisplayStart.textContent = `Recorde: ${localStorage.getItem('highScore') || 0}`;

// ===== OTIMIZAÇÕES PARA GITHUB PAGES =====
// Garantir que os recursos estejam carregados
window.addEventListener('load', function() {
    console.log('Recursos do jogo carregados');

    // Forçar recarregamento das imagens dinâmicas se necessário
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            img.src = img.src + '?' + new Date().getTime();
        }
    });
});

// Redimensionamento responsivo
window.addEventListener('resize', function() {
    if (gameboard.classList.contains('game-started') && !isPaused && !gameOver) {
        // Ajustar posição do cano se o jogo estiver em andamento
        const currentLeft = parseFloat(pipe.style.left);
        if (!isNaN(currentLeft)) {
            const ratio = currentLeft / gameboard.offsetWidth;
            pipe.style.left = `${ratio * gameboard.offsetWidth}px`;
        }
    }
});