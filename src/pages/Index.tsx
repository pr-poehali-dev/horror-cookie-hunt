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
  const { toast } = useToast();

  const gridSize = 10;

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
      let newX = playerPos.x;
      let newY = playerPos.y;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          newY = Math.max(0, playerPos.y - 1);
          break;
        case 'ArrowDown':
        case 's':
          newY = Math.min(gridSize - 1, playerPos.y + 1);
          break;
        case 'ArrowLeft':
        case 'a':
          newX = Math.max(0, playerPos.x - 1);
          break;
        case 'ArrowRight':
        case 'd':
          newX = Math.min(gridSize - 1, playerPos.x + 1);
          break;
      }

      if (newX !== playerPos.x || newY !== playerPos.y) {
        setPlayerPos({ x: newX, y: newY });
        setScore(prev => prev + 10);
        
        const distance = Math.abs(newX - saltPos.x) + Math.abs(newY - saltPos.y);
        if (distance < 3) {
          setFear(prev => Math.min(100, prev + 10));
          toast({
            title: '⚠️ СОЛЬ БЛИЗКО',
            description: 'Беги, Лили!',
            variant: 'destructive'
          });
        }
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
          setHealth(h => {
            const newHealth = h - 20;
            if (newHealth <= 0) {
              setGameState('menu');
              toast({
                title: '💀 КОНЕЦ ИГРЫ',
                description: `Твой счёт: ${score}`,
                variant: 'destructive'
              });
            }
            return Math.max(0, newHealth);
          });
        }

        return { x: newX, y: newY };
      });
    }, 1000);

    return () => clearInterval(saltMoveInterval);
  }, [gameState, playerPos, fear, score, toast]);

  const renderGame = () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <div className="text-xs mb-1 text-primary">HP: {health}</div>
            <Progress value={health} className="h-3 bg-muted" />
          </div>
          <div className="flex-1">
            <div className="text-xs mb-1 text-destructive">СТРАХ: {fear}</div>
            <Progress value={fear} className="h-3 bg-muted" />
          </div>
          <div className="text-sm">СЧЁТ: {score}</div>
        </div>

        <Card className="p-4 bg-card border-4 border-primary shadow-pixel">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              const isPlayer = x === playerPos.x && y === playerPos.y;
              const isSalt = x === saltPos.x && y === saltPos.y;
              const isWall = (x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1) && 
                            !(x === 1 && y === 1) && !(x === gridSize - 2 && y === gridSize - 2);

              return (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center text-xl border border-muted/30 transition-all relative overflow-hidden ${
                    isPlayer ? 'bg-secondary animate-pulse-glow' :
                    isSalt ? 'bg-black/90 animate-shake' :
                    isWall ? 'bg-muted' :
                    'bg-background/50'
                  }`}
                >
                  {isPlayer && <span className="text-2xl">🌸</span>}
                  {isSalt && (
                    <img 
                      src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
                      alt="Salt"
                      className="w-full h-full object-cover game-container opacity-90 scale-150"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={() => setGameState('menu')} variant="outline" size="sm">
            <Icon name="Home" className="mr-2 h-4 w-4" />
            МЕНЮ
          </Button>
          <Button onClick={() => setGameState('map')} variant="outline" size="sm">
            <Icon name="Map" className="mr-2 h-4 w-4" />
            КАРТА
          </Button>
          <Button onClick={() => setGameState('inventory')} variant="outline" size="sm">
            <Icon name="Backpack" className="mr-2 h-4 w-4" />
            ИНВЕНТАРЬ
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Используй WASD или стрелки для движения
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-8xl animate-pulse-glow">🏚️</div>
        <img 
          src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
          alt="Salt"
          className="absolute bottom-10 right-10 w-32 h-32 object-contain animate-pulse-glow game-container"
        />
        <div className="absolute top-1/2 left-1/4 text-6xl animate-pulse-glow">💀</div>
      </div>

      <Card className="w-full max-w-md p-8 bg-card border-4 border-primary shadow-pixel-lg relative z-10 animate-fade-in">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl text-primary animate-pulse-glow">COOKIE RUN</h1>
            <h2 className="text-lg text-foreground">Катакомбы Тишины</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Соль преследует Лили в катакомбах...
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => {
                setGameState('playing');
                setHealth(100);
                setFear(0);
                setScore(0);
                setPlayerPos({ x: 1, y: 1 });
                setSaltPos({ x: 8, y: 8 });
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-pixel"
              size="lg"
            >
              НАЧАТЬ ИГРУ
            </Button>

            <Button 
              onClick={() => setGameState('settings')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              НАСТРОЙКИ
            </Button>

            <Button 
              onClick={() => setGameState('leaderboard')}
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-4 border-primary shadow-pixel animate-fade-in">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-primary">НАСТРОЙКИ</h2>

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-4 border-primary shadow-pixel animate-fade-in">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-primary">КАРТА КАТАКОМБ</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm mb-2">Исследовано: {mapProgress}%</div>
              <Progress value={mapProgress} className="h-4" />
            </div>

            <div className="aspect-square bg-muted/30 border-2 border-primary p-4 relative">
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 p-4">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="border border-muted/50 flex items-center justify-center text-xs relative">
                    {i === 0 && <span>🌸</span>}
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
                <span>🌸</span>
                <span>- Твоя позиция</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="https://cdn.poehali.dev/files/8bd237bd-0198-4104-a514-04564efdd62b.png" 
                  alt="Salt"
                  className="w-4 h-4 object-contain game-container"
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-4 border-primary shadow-pixel animate-fade-in">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-primary">ИНВЕНТАРЬ</h2>

          <div className="grid grid-cols-4 gap-2">
            {inventory.map((item) => (
              <div 
                key={item.id}
                className="aspect-square border-2 border-primary bg-muted/30 flex flex-col items-center justify-center p-2 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="text-[8px] mt-1 text-center">{item.name}</div>
              </div>
            ))}
            {Array.from({ length: 8 - inventory.length }).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="aspect-square border-2 border-muted bg-background/50"
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card border-4 border-primary shadow-pixel animate-fade-in">
        <div className="space-y-6">
          <h2 className="text-xl text-center text-primary">ТАБЛИЦА РЕКОРДОВ</h2>

          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div 
                key={entry.rank}
                className={`flex justify-between items-center p-3 border-2 ${
                  entry.name === 'YOU' ? 'border-primary bg-primary/10' : 'border-muted bg-muted/20'
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
    </>
  );
};

export default Index;