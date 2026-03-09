interface GameInfo {
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  url: string;
  color: string;
  players: string;
}

const games: GameInfo[] = [
  {
    name: '花砖物语',
    subtitle: 'Azul',
    description:
      '从工厂展示区中挑选精美的瓷砖，装饰你的宫殿墙壁。策略性地选择和放置瓷砖，获得最高分数！',
    icon: '🏛️',
    url: 'http://localhost:3000',
    color: '#2563eb',
    players: '2-4 人',
  },
  {
    name: '璀璨宝石·对决',
    subtitle: 'Splendor Duel',
    description:
      '在宝石市场中与对手展开激烈角逐，收集宝石、购买发展卡、赢得贵族青睐，成为最富有的珠宝商！',
    icon: '💎',
    url: 'http://localhost:3002',
    color: '#9333ea',
    players: '2 人',
  },
  {
    name: '失落的城市',
    subtitle: 'Lost Cities',
    description:
      '踏上五条探险之路，合理出牌以获得最高探险收益。每条路线一旦开启就必须承担风险，谨慎决策！',
    icon: '🏔️',
    url: 'http://localhost:3004',
    color: '#dc2626',
    players: '2 人',
  },
];

function App() {
  return (
    <div className="portal">
      <header className="portal-header">
        <h1>
          <span className="header-icon">🎲</span>
          Tabletopia
        </h1>
        <p className="header-subtitle">桌游合集 · 在线多人对战平台</p>
      </header>

      <main className="game-grid">
        {games.map((game) => (
          <a
            key={game.name}
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="game-card"
            style={{ '--card-color': game.color } as React.CSSProperties}
          >
            <div className="card-icon">{game.icon}</div>
            <div className="card-content">
              <h2>{game.name}</h2>
              <span className="card-subtitle">{game.subtitle}</span>
              <p className="card-description">{game.description}</p>
              <div className="card-footer">
                <span className="card-players">👥 {game.players}</span>
                <span className="card-action">开始游戏 →</span>
              </div>
            </div>
          </a>
        ))}
      </main>

      <footer className="portal-footer">
        <p>选择一款游戏，邀请好友一起玩吧！</p>
      </footer>
    </div>
  );
}

export default App;
