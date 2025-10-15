import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type GameState = 'menu' | 'playing' | 'settings' | 'map' | 'inventory' | 'leaderboard';

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [saltPos, setSaltPos] = useState({ x: 8, y: 8 });
  const [health, setHealth] = useState(100);
  const [fear, setFear] = useState(0);
  const [score, setScore] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Фонарь', icon: '🔦' },
    { id: '2', name: 'Ключ', icon: '🔑' }
  ]);
  const [mapProgress, setMapProgress] = useState(15);
  const [volume, setVolume] = useState(50);
  const [screenShake, setScreenShake] = useState(false);
  const [showScreamer, setShowScreamer] = useState(false);
  const { toast } = useToast();

  const gridSize = 10;
  const [exitPos] = useState({ x: gridSize - 2, y: gridSize - 2 });

  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    let newX = playerPos.x;
    let newY = playerPos.y;

    switch (direction) {
      case 'up':
        newY = Math.max(0, playerPos.y - 1);
        break;
      case 'down':
        newY = Math.min(gridSize - 1, playerPos.y + 1);
        break;
      case 'left':
        newX = Math.max(0, playerPos.x - 1);
        break;
      case 'right':
        newX = Math.min(gridSize - 1, playerPos.x + 1);
        break;
    }

    if (newX !== playerPos.x || newY !== playerPos.y) {
      setPlayerPos({ x: newX, y: newY });
      setScore(prev => prev + 10);
      playSound(200, 0.05, 'square');
      
      if (newX === exitPos.x && newY === exitPos.y) {
        playSound(400, 0.5, 'sine');
        toast({
          title: '✅ ПОБЕДА!',
          description: `Лили сбежала! Счёт: ${score + 1000}`,
        });
        setTimeout(() => {
          setGameState('leaderboard');
        }, 1500);
        return;
      }
      
      const distance = Math.abs(newX - saltPos.x) + Math.abs(newY - saltPos.y);
      if (distance < 3) {
        setFear(prev => Math.min(100, prev + 10));
        playSound(100, 0.3, 'sawtooth');
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
        toast({
          title: '⚠️ СОЛЬ БЛИЗКО',
          description: 'Беги к выходу!',
          variant: 'destructive'
        });
      } else if (distance < 5) {
        playSound(150, 0.1, 'triangle');
      }
    }
  };

  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (volume === 0) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume / 200;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'LILY', score: 9999 },
    { rank: 2, name: 'SALT', score: 8888 },
    { rank: 3, name: 'COOKIE', score: 7777 },
    { rank: 4, name: 'YOU', score: score },
    { rank: 5, name: 'GHOST', score: 5555 }
  ].sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, rank: index + 1 }));

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
          movePlayer('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, playerPos, saltPos, toast]);

  useEffect(() => {
    if (gameState !== 'playing' || fear < 50) return;

    const saltMoveInterval = setInterval(() => {
      setSaltPos(prev => {
        const dx = playerPos.x - prev.x;
        const dy = playerPos.y - prev.y;
        
        let newX = prev.x;
        let newY = prev.y;

        if (Math.abs(dx) > Math.abs(dy)) {
          newX = prev.x + Math.sign(dx);
        } else {
          newY = prev.y + Math.sign(dy);
        }

        if (newX === playerPos.x && newY === playerPos.y) {
          setShowScreamer(true);
          playSound(50, 1.5, 'sawtooth');
          setScreenShake(true);
          
          setTimeout(() => {
            setShowScreamer(false);
            setScreenShake(false);
            setGameState('menu');
            toast({
              title: '💀 СОЛЬ ПОЙМАЛА ЛИЛИ',
              description: `Твой счёт: ${score}`,
              variant: 'destructive'
            });
          }, 1500);
        }

        return { x: newX, y: newY };
      });
    }, 1000);

    return () => clearInterval(saltMoveInterval);
  }, [gameState, playerPos, fear, score, toast]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const distance = Math.abs(playerPos.x - saltPos.x) + Math.abs(playerPos.y - saltPos.y);
    if (distance < 3 && distance > 0) {
      const pulseInterval = setInterval(() => {
        playSound(80 + Math.random() * 40, 0.1, 'sine');
      }, 2000 - distance * 500);
      return () => clearInterval(pulseInterval);
    }
  }, [gameState, playerPos, saltPos]);

  const renderGame = () => (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 transition-transform horror-vignette relative ${
      screenShake ? 'animate-shake' : ''
    }`}>
      <div className="fog-overlay"></div>
      <div className="w-full max-w-4xl space-y-4 relative z-10">
        <div className="flex justify-between items-center gap-4 bg-black/60 p-3 border border-muted/30">
          <div className="flex-1">
            <div className="text-xs mb-1 text-red-700">HP: {health}</div>
            <Progress value={health} className="h-3 bg-black border border-red-900" />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1 text-red-600">СТРАХ: {fear}</div>
            <Progress value={fear} className="h-3 bg-black border border-red-900" />
          </div>
          <div className="text-sm text-gray-400">СЧЁТ: {score}</div>
        </div>

        <Card className="p-4 bg-black border-4 border-gray-800 shadow-pixel-lg darkness-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none"></div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              const isPlayer = x === playerPos.x && y === playerPos.y;
              const isSalt = x === saltPos.x && y === saltPos.y;
              const isExit = x === exitPos.x && y === exitPos.y;
              const isWall = (x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1) && 
                            !(x === 1 && y === 1) && !isExit;

              return (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center text-xl border border-gray-900 transition-all relative overflow-hidden ${
                    isPlayer ? 'bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse-glow' :
                    isSalt ? 'bg-black animate-shake border-red-900' :
                    isExit ? 'bg-gradient-to-br from-green-950 to-green-900 border-green-800 animate-pulse-glow' :
                    isWall ? 'bg-gray-950' :
                    'bg-black/80'
                  }`}
                >
                  {isPlayer && (
                    <img 
                      src="https://cdn.poehali.dev/files/6afce6d7-3c24-430b-9d4f-3d2c1b8829a2.png" 
                      alt="Lily"
                      className="w-full h-full object-contain game-container scale-125"
                    />
                  )}
                  {isSalt && (
                    <img 
                      src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
                      alt="Salt"
                      className="w-full h-full object-cover game-container opacity-90 scale-150"
                    />
                  )}
                  {isExit && !isPlayer && (
                    <div className="text-3xl">🚻</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={() => { playSound(220, 0.05, 'square'); setGameState('menu'); }} variant="outline" size="sm">
            <Icon name="Home" className="mr-2 h-4 w-4" />
            МЕНЮ
          </Button>
          <Button onClick={() => { playSound(220, 0.05, 'square'); setGameState('map'); }} variant="outline" size="sm">
            <Icon name="Map" className="mr-2 h-4 w-4" />
            КАРТА
          </Button>
          <Button onClick={() => { playSound(220, 0.05, 'square'); setGameState('inventory'); }} variant="outline" size="sm">
            <Icon name="Backpack" className="mr-2 h-4 w-4" />
            ИНВЕНТАРЬ
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto md:hidden">
          <div></div>
          <Button 
            onClick={() => movePlayer('up')}
            className="bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 h-16"
            size="lg"
          >
            <Icon name="ChevronUp" size={32} />
          </Button>
          <div></div>
          <Button 
            onClick={() => movePlayer('left')}
            className="bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 h-16"
            size="lg"
          >
            <Icon name="ChevronLeft" size={32} />
          </Button>
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-700"></div>
          </div>
          <Button 
            onClick={() => movePlayer('right')}
            className="bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 h-16"
            size="lg"
          >
            <Icon name="ChevronRight" size={32} />
          </Button>
          <div></div>
          <Button 
            onClick={() => movePlayer('down')}
            className="bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 h-16"
            size="lg"
          >
            <Icon name="ChevronDown" size={32} />
          </Button>
          <div></div>
        </div>

        <div className="text-center text-xs text-gray-600">
          <span className="hidden md:inline">Используй WASD или стрелки для движения</span>
          <span className="md:hidden">Используй кнопки для управления</span>
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden horror-vignette">
      <div className="fog-overlay"></div>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-8xl animate-pulse-glow">🏚️</div>
        <img 
          src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
          alt="Salt"
          className="absolute bottom-10 right-10 w-32 h-32 object-contain animate-pulse-glow game-container opacity-50"
        />
        <div className="absolute top-1/2 left-1/4 text-6xl animate-pulse-glow">💀</div>
      </div>

      <Card className="w-full max-w-md p-8 bg-black/90 border-4 border-gray-800 shadow-pixel-lg relative z-10 animate-fade-in backdrop-blur-sm">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl blood-text animate-pulse-glow">COOKIE RUN</h1>
            <h2 className="text-lg text-gray-400">ПОБЕГ ИЗ КАТАКОМБ</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Помоги Лили сбежать от Соли...<br/>
              Доберись до выхода 🚻
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => {
                playSound(300, 0.1, 'square');
                setGameState('playing');
                setHealth(100);
                setFear(0);
                setScore(0);
                setPlayerPos({ x: 1, y: 1 });
                setSaltPos({ x: 8, y: 8 });
              }}
              className="w-full bg-gray-900 text-gray-300 hover:bg-gray-800 shadow-pixel border-2 border-gray-700"
              size="lg"
            >
              НАЧАТЬ ИГРУ
            </Button>

            <Button 
              onClick={() => {
                playSound(250, 0.08, 'square');
                setGameState('settings');
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              НАСТРОЙКИ
            </Button>

            <Button 
              onClick={() => {
                playSound(250, 0.08, 'square');
                setGameState('leaderboard');
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              РЕКОРДЫ
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 horror-vignette relative">
      <div className="fog-overlay"></div>
      <Card className="w-full max-w-md p-8 bg-black/90 border-4 border-gray-800 shadow-pixel animate-fade-in relative z-10">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-gray-400">НАСТРОЙКИ</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-2">Громкость: {volume}%</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm">Управление:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>↑↓←→ или WASD - движение</div>
                <div>ESC - пауза</div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setGameState('menu')}
            variant="outline"
            className="w-full"
          >
            НАЗАД
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderMap = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 horror-vignette relative">
      <div className="fog-overlay"></div>
      <Card className="w-full max-w-md p-8 bg-black/90 border-4 border-gray-800 shadow-pixel animate-fade-in relative z-10">
        <div className="space-y-6">
          <h2 className="text-xl text-center blood-text">КАРТА КАТАКОМБ</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm mb-2">Исследовано: {mapProgress}%</div>
              <Progress value={mapProgress} className="h-4" />
            </div>

            <div className="aspect-square bg-black border-2 border-gray-800 p-4 relative darkness-pulse">
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 p-4">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="border border-muted/50 flex items-center justify-center text-xs relative">
                    {i === 0 && (
                      <img 
                        src="https://cdn.poehali.dev/files/6afce6d7-3c24-430b-9d4f-3d2c1b8829a2.png" 
                        alt="Lily"
                        className="w-full h-full object-contain game-container"
                      />
                    )}
                    {i === 24 && (
                      <img 
                        src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
                        alt="Salt"
                        className="w-full h-full object-cover game-container opacity-80"
                      />
                    )}
                    {i === 12 && <span>🔑</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn.poehali.dev/files/6afce6d7-3c24-430b-9d4f-3d2c1b8829a2.png" 
                  alt="Lily"
                  className="w-6 h-6 object-contain game-container"
                />
                <span>- Твоя позиция (Лили)</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
                  alt="Salt"
                  className="w-6 h-6 object-contain game-container"
                />
                <span>- Соль</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔑</span>
                <span>- Предметы</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setGameState('playing')}
            variant="outline"
            className="w-full"
          >
            НАЗАД
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderInventory = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 horror-vignette relative">
      <div className="fog-overlay"></div>
      <Card className="w-full max-w-md p-8 bg-black/90 border-4 border-gray-800 shadow-pixel animate-fade-in relative z-10">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-gray-400">ИНВЕНТАРЬ</h2>

          <div className="grid grid-cols-4 gap-2">
            {inventory.map((item) => (
              <div 
                key={item.id}
                className="aspect-square border-2 border-gray-700 bg-black/60 flex flex-col items-center justify-center p-2 hover:bg-gray-900 transition-colors cursor-pointer"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="text-[8px] mt-1 text-center">{item.name}</div>
              </div>
            ))}
            {Array.from({ length: 8 - inventory.length }).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="aspect-square border-2 border-gray-800 bg-black/40"
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Собирай предметы в катакомбах
          </div>

          <Button 
            onClick={() => setGameState('playing')}
            variant="outline"
            className="w-full"
          >
            НАЗАД
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 horror-vignette relative">
      <div className="fog-overlay"></div>
      <Card className="w-full max-w-md p-8 bg-black/90 border-4 border-gray-800 shadow-pixel animate-fade-in relative z-10">
        <div className="space-y-6">
          <h2 className="text-xl text-center blood-text">ТАБЛИЦА РЕКОРДОВ</h2>

          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div 
                key={entry.rank}
                className={`flex justify-between items-center p-3 border-2 ${
                  entry.name === 'YOU' ? 'border-gray-700 bg-gray-900' : 'border-gray-800 bg-black/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold w-8">{entry.rank}</div>
                  <div className="text-sm">{entry.name}</div>
                </div>
                <div className="text-sm text-primary">{entry.score}</div>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => setGameState('menu')}
            variant="outline"
            className="w-full"
          >
            НАЗАД
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'settings' && renderSettings()}
      {gameState === 'map' && renderMap()}
      {gameState === 'inventory' && renderInventory()}
      {gameState === 'leaderboard' && renderLeaderboard()}
      
      {showScreamer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black animate-shake">
          <div className="absolute inset-0 bg-red-950 animate-pulse-glow opacity-50"></div>
          <img 
            src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
            alt="Screamer"
            className="w-full h-full object-cover game-container animate-scale-screamer"
            style={{
              animation: 'scale-screamer 1.5s ease-out',
              filter: 'contrast(1.5) brightness(1.2)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-30"></div>
        </div>
      )}
    </>
  );
};

export default Index;