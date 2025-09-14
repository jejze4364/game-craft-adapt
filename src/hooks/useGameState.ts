import { useState, useEffect, useCallback } from "react";

interface Position {
  x: number;
  y: number;
}

interface GameStats {
  lives: number;
  score: number;
  completedTasks: number;
  accuracy: number;
  sessionTime: string;
}

interface KPIData {
  disponibilidade: number;
  aceitacao: number;
  tempoEntrega: number;
  avaliacao: number;
}

interface GameSettings {
  sound: boolean;
  animations: boolean;
  speed: number;
}

interface CheckpointData {
  id: number;
  x: number;
  y: number;
  video: string;
  context: string;
  situation: string;
  options: string[];
  correct: number | string;
  hint: string;
  type?: "text" | "multiple";
  completed: boolean;
}

interface GameState {
  // User & Session
  currentUser: string | null;
  sessionStartTime: number;
  
  // Player
  playerPosition: Position;
  
  // Game Stats
  stats: GameStats;
  kpis: KPIData;
  settings: GameSettings;
  
  // Game Content
  checkpoints: CheckpointData[];
  correctAnswers: number;
  totalQuestions: number;
}

const INITIAL_CHECKPOINTS: Omit<CheckpointData, 'completed'>[] = [
  // Checkpoint 1: Gestão de Tempo e Disponibilidade
  { 
    id: 0, x: 3, y: 2, 
    video: "Gestão de Tempo e Disponibilidade", 
    context: "Você precisa abrir a loja na plataforma. A disponibilidade é crucial para o sucesso do parceiro.", 
    situation: "A abertura e fechamento da loja na plataforma é feita de que forma?", 
    options: ["Automático por agendamento", "Manual pelo botão verde", "Automático por horário cadastrado", "Feito pelo chat suporte"], 
    correct: 1, 
    hint: "Sempre use o botão verde de abrir/fechar loja.", 
    type: "multiple" 
  },

  // Checkpoint 2: Taxa de Disponibilidade
  { 
    id: 1, x: 6, y: 3, 
    video: "Taxa de Disponibilidade", 
    context: "A taxa de disponibilidade é um dos KPIs mais importantes para parceiros.", 
    situation: "Taxa de disponibilidade mede qual aspecto da operação?", 
    options: ["Pedidos aceitos/recebidos", "Tempo aberto vs horário cadastrado", "Tempo médio de entrega", "Quantidade de itens ativos"], 
    correct: 1, 
    hint: "Disponibilidade = tempo que a loja ficou aberta.", 
    type: "multiple" 
  },

  // Checkpoint 3: Portfólio de Produtos
  { 
    id: 2, x: 9, y: 2, 
    video: "Portfólio Ideal", 
    context: "Um cliente não encontrou o produto desejado. O portfólio é fundamental para satisfação.", 
    situation: "Qual é a definição de portfólio ideal no Zé Delivery?", 
    options: ["Apenas cervejas premium", "% de itens recomendados ativos e disponíveis", "Apenas itens com nota 5", "Produtos sem marca própria"], 
    correct: 1, 
    hint: "Mantenha itens recomendados sempre ativos e prontos.", 
    type: "multiple" 
  },

  // Checkpoint 4: Taxa de Aceitação
  { 
    id: 3, x: 13, y: 3, 
    video: "Taxa de Aceitação", 
    context: "Chegam vários pedidos simultaneamente. A gestão da aceitação impacta diretamente nos resultados.", 
    situation: "O que mais prejudica a taxa de aceitação?", 
    options: ["Pedidos expirados/rejeitados/cancelados", "Abrir loja mais cedo", "Ter mais entregadores", "Portfólio diversificado"], 
    correct: 0, 
    hint: "Aceite pedidos em até 3 minutos para evitar expiração.", 
    type: "multiple" 
  },

  // Checkpoint 5: Rastreamento GPS
  { 
    id: 4, x: 2, y: 5, 
    video: "Sistema de Rastreamento", 
    context: "Cliente quer acompanhar seu pedido em tempo real. O rastreamento é essencial para transparência.", 
    situation: "Para garantir boa taxa de rastreamento, o que é necessário?", 
    options: ["GPS habilitado + finalizar no cliente", "Apenas conexão Wi-Fi", "Não usar app do entregador", "Desativar dados móveis"], 
    correct: 0, 
    hint: "App do entregador + GPS sempre ativo.", 
    type: "multiple" 
  },

  // Checkpoint 6: Otimização de Rotas
  { 
    id: 5, x: 5, y: 5, 
    video: "Otimização de Entregas", 
    context: "Você tem múltiplas entregas para fazer. A rota escolhida impacta o tempo de entrega.", 
    situation: "Qual é a melhor estratégia para otimizar rotas de entrega?", 
    options: ["Entregar por ordem de chegada", "Agrupar por proximidade geográfica", "Priorizar pedidos maiores", "Usar apenas uma rota fixa"], 
    correct: 1, 
    hint: "Agrupe entregas por região para economizar tempo.", 
    type: "multiple" 
  },

  // Checkpoint 7: Atendimento ao Cliente
  { 
    id: 6, x: 8, y: 4, 
    video: "Excelência no Atendimento", 
    context: "Um cliente reclama de um produto com defeito. O atendimento define a experiência.", 
    situation: "Como deve ser a abordagem ideal no atendimento ao cliente?", 
    options: ["Negar responsabilidade", "Ouvir, entender e solucionar rapidamente", "Transferir para o suporte", "Oferecer desconto sempre"], 
    correct: 1, 
    hint: "Empatia e solução rápida geram satisfação.", 
    type: "multiple" 
  },

  // Checkpoint 8: Gestão de Estoque
  { 
    id: 7, x: 11, y: 4, 
    video: "Controle de Estoque", 
    context: "Seu estoque está baixo e pedidos continuam chegando. A gestão preventiva é crucial.", 
    situation: "Qual é a frequência ideal para atualizar o estoque na plataforma?", 
    options: ["Uma vez por semana", "Diariamente no início do dia", "Em tempo real conforme vendas", "Apenas quando acabar"], 
    correct: 2, 
    hint: "Atualize em tempo real para evitar vendas de produtos indisponíveis.", 
    type: "multiple" 
  },

  // Checkpoint 9: Prevenção de Avarias
  { 
    id: 8, x: 14, y: 5, 
    video: "Cuidado com Produtos", 
    context: "Produtos frágeis precisam de cuidado especial no transporte e armazenamento.", 
    situation: "Como prevenir avarias em produtos sensíveis?", 
    options: ["Embalar adequadamente + manter temperatura", "Transportar rapidamente", "Usar apenas sacolas plásticas", "Evitar produtos frágeis"], 
    correct: 0, 
    hint: "Embalagem correta e controle de temperatura são essenciais.", 
    type: "multiple" 
  },

  // Checkpoint 10: Protocolos de Segurança
  { 
    id: 9, x: 4, y: 7, 
    video: "Segurança Operacional", 
    context: "Durante as entregas, a segurança deve ser sempre prioridade para você e seus clientes.", 
    situation: "Qual protocolo de segurança é fundamental para entregadores?", 
    options: ["Correr para entregar rápido", "Usar equipamentos de proteção + seguir trânsito", "Economizar combustível", "Trabalhar apenas de dia"], 
    correct: 1, 
    hint: "EPIs e respeito às leis de trânsito salvam vidas.", 
    type: "multiple" 
  },

  // Checkpoint 11: Marketing e Promoções
  { 
    id: 10, x: 7, y: 6, 
    video: "Estratégias de Marketing", 
    context: "As vendas estão baixas e você quer aumentar a visibilidade da sua loja.", 
    situation: "Qual estratégia de marketing é mais eficaz para parceiros?", 
    options: ["Apenas preços baixos", "Participar de campanhas + produtos em destaque", "Não fazer promoções", "Copiar concorrentes"], 
    correct: 1, 
    hint: "Campanhas da plataforma + destaque de produtos aumentam vendas.", 
    type: "multiple" 
  },

  // Checkpoint 12: Gestão Financeira
  { 
    id: 11, x: 10, y: 6, 
    video: "Controle Financeiro", 
    context: "É essencial acompanhar custos, receitas e margem de lucro para manter o negócio saudável.", 
    situation: "Qual é o principal indicador financeiro que um parceiro deve acompanhar?", 
    options: ["Apenas faturamento bruto", "Margem líquida por produto vendido", "Número total de pedidos", "Velocidade de entrega"], 
    correct: 1, 
    hint: "Margem líquida mostra a real lucratividade do negócio.", 
    type: "multiple" 
  },

  // Checkpoint 13: Relacionamento com Fornecedores
  { 
    id: 12, x: 3, y: 8, 
    video: "Parcerias Estratégicas", 
    context: "Bons fornecedores são essenciais para manter qualidade e preços competitivos.", 
    situation: "Como construir relacionamentos sólidos com fornecedores?", 
    options: ["Sempre escolher o mais barato", "Negociar prazos + manter pagamentos em dia", "Trocar constantemente", "Pagar apenas à vista"], 
    correct: 1, 
    hint: "Confiança mútua e pontualidade fortalecem parcerias.", 
    type: "multiple" 
  },

  // Checkpoint 14: Sustentabilidade
  { 
    id: 13, x: 6, y: 8, 
    video: "Práticas Sustentáveis", 
    context: "Consumidores valorizam empresas que se preocupam com o meio ambiente.", 
    situation: "Qual prática sustentável pode ser implementada facilmente?", 
    options: ["Ignorar embalagens", "Usar sacolas reutilizáveis + reduzir desperdício", "Aumentar entregas", "Usar apenas descartáveis"], 
    correct: 1, 
    hint: "Pequenas ações sustentáveis fazem grande diferença.", 
    type: "multiple" 
  },

  // Checkpoint 15: Análise de Dados
  { 
    id: 14, x: 9, y: 8, 
    video: "Inteligência de Dados", 
    context: "Os dados do app fornecem insights valiosos para melhorar sua operação continuamente.", 
    situation: "Qual métrica é mais importante para acompanhar diariamente?", 
    options: ["Apenas número de pedidos", "KPIs combinados + tendências de vendas", "Somente reclamações", "Tempo online apenas"], 
    correct: 1, 
    hint: "Visão integrada dos KPIs revela oportunidades de melhoria.", 
    type: "multiple" 
  }
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentUser: null,
    sessionStartTime: 0,
    playerPosition: { x: 2, y: 6 }, // Store position
    stats: {
      lives: 3,
      score: 0,
      completedTasks: 0,
      accuracy: 0,
      sessionTime: "00:00"
    },
    kpis: {
      disponibilidade: 70,
      aceitacao: 70,
      tempoEntrega: 70,
      avaliacao: 70
    },
    settings: {
      sound: true,
      animations: true,
      speed: 1
    },
    checkpoints: INITIAL_CHECKPOINTS.map(cp => ({ ...cp, completed: false })),
    correctAnswers: 0,
    totalQuestions: 0
  });

  // Session timer
  useEffect(() => {
    if (!gameState.sessionStartTime) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - gameState.sessionStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setGameState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          sessionTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.sessionStartTime]);

  // Calculate accuracy
  useEffect(() => {
    const accuracy = gameState.totalQuestions > 0 
      ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)
      : 0;
    
    setGameState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        accuracy
      }
    }));
  }, [gameState.correctAnswers, gameState.totalQuestions]);

  const startGame = useCallback((userEmail: string) => {
    setGameState(prev => ({
      ...prev,
      currentUser: userEmail,
      sessionStartTime: Date.now(),
    }));
  }, []);

  const movePlayer = useCallback((newPosition: Position) => {
    setGameState(prev => ({
      ...prev,
      playerPosition: newPosition
    }));
  }, []);

  const answerCheckpoint = useCallback((checkpointId: number, isCorrect: boolean) => {
    setGameState(prev => {
      const newCheckpoints = prev.checkpoints.map(cp =>
        cp.id === checkpointId ? { ...cp, completed: true } : cp
      );

      const newStats = {
        ...prev.stats,
        completedTasks: newCheckpoints.filter(cp => cp.completed).length,
        score: prev.stats.score + (isCorrect ? 100 : 0),
        lives: isCorrect ? prev.stats.lives : Math.max(0, prev.stats.lives - 1)
      };

      // Update KPIs based on answer
      const kpiBonus = isCorrect ? 5 : -3;
      const newKpis = {
        disponibilidade: Math.max(0, Math.min(100, prev.kpis.disponibilidade + kpiBonus)),
        aceitacao: Math.max(0, Math.min(100, prev.kpis.aceitacao + kpiBonus)),
        tempoEntrega: Math.max(0, Math.min(100, prev.kpis.tempoEntrega + kpiBonus)),
        avaliacao: Math.max(0, Math.min(100, prev.kpis.avaliacao + kpiBonus)),
      };

      return {
        ...prev,
        checkpoints: newCheckpoints,
        stats: newStats,
        kpis: newKpis,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1
      };
    });
  }, []);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setGameState(prev => ({
      ...prev,
      settings: newSettings
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerPosition: { x: 2, y: 6 },
      stats: {
        lives: 3,
        score: 0,
        completedTasks: 0,
        accuracy: 0,
        sessionTime: "00:00"
      },
      kpis: {
        disponibilidade: 70,
        aceitacao: 70,
        tempoEntrega: 70,
        avaliacao: 70
      },
      checkpoints: INITIAL_CHECKPOINTS.map(cp => ({ ...cp, completed: false })),
      correctAnswers: 0,
      totalQuestions: 0,
      sessionStartTime: Date.now()
    }));
  }, []);

  return {
    gameState,
    actions: {
      startGame,
      movePlayer,
      answerCheckpoint,
      updateSettings,
      resetGame
    }
  };
};