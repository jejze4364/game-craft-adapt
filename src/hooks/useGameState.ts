import { useState, useEffect, useCallback } from 'react';

interface Position { x: number; y: number }
interface GameStats { lives: number; score: number; completedTasks: number; accuracy: number; sessionTime: string }
interface KPIData { disponibilidade: number; aceitacao: number; tempoEntrega: number; avaliacao: number }
interface GameSettings { sound: boolean; animations: boolean; speed: number }

// Unificação: locked/current (sequencial) + pending/completed/failed
export type CheckpointStatus = 'locked' | 'current' | 'pending' | 'completed' | 'failed';

export interface CheckpointData {
  id: number; x: number; y: number; video: string; context: string; situation: string;
  options: string[]; correct: number | string; hint: string; type?: 'text' | 'multiple';
  completed: boolean; status: CheckpointStatus;
}

interface GameState {
  currentUser: string | null;
  sessionStartTime: number;
  playerPosition: Position;
  stats: GameStats;
  kpis: KPIData;
  settings: GameSettings;
  checkpoints: CheckpointData[];
  correctAnswers: number;
  totalQuestions: number;
}

const INITIAL_CHECKPOINTS: Omit<CheckpointData, 'completed' | 'status'>[] = [
  { id: 0, x: 3, y: 2, video: 'gestao-tempo', context: 'Você precisa abrir a loja na plataforma. A disponibilidade é crucial para o sucesso do parceiro.', situation: 'A abertura e fechamento da loja na plataforma é feita de que forma?', options: ['Automático por agendamento','Manual pelo botão verde','Automático por horário cadastrado','Feito pelo chat suporte'], correct: 1, hint: 'Sempre use o botão verde de abrir/fechar loja.', type: 'multiple' },
  { id: 1, x: 6, y: 3, video: 'disponibilidade', context: 'A taxa de disponibilidade é um dos KPIs mais importantes para parceiros.', situation: 'Taxa de disponibilidade mede qual aspecto da operação?', options: ['Pedidos aceitos/recebidos','Tempo aberto vs horário cadastrado','Tempo médio de entrega','Quantidade de itens ativos'], correct: 1, hint: 'Disponibilidade = tempo que a loja ficou aberta.', type: 'multiple' },
  { id: 2, x: 9, y: 2, video: 'portfolio', context: 'Um cliente não encontrou o produto desejado. O portfólio é fundamental para satisfação.', situation: 'Qual é a definição de portfólio ideal no Zé Delivery?', options: ['Apenas cervejas premium','% de itens recomendados ativos e disponíveis','Apenas itens com nota 5','Produtos sem marca própria'], correct: 1, hint: 'Mantenha itens recomendados sempre ativos e prontos.', type: 'multiple' },
  { id: 3, x: 13, y: 3, video: 'aceitacao', context: 'Chegam vários pedidos simultaneamente. A gestão da aceitação impacta diretamente nos resultados.', situation: 'O que mais prejudica a taxa de aceitação?', options: ['Pedidos expirados/rejeitados/cancelados','Abrir loja mais cedo','Ter mais entregadores','Portfólio diversificado'], correct: 0, hint: 'Aceite pedidos em até 3 minutos para evitar expiração.', type: 'multiple' },
  { id: 4, x: 2, y: 5, video: 'rastreamento', context: 'Cliente quer acompanhar seu pedido em tempo real. O rastreamento é essencial para transparência.', situation: 'Para garantir boa taxa de rastreamento, o que é necessário?', options: ['GPS habilitado + finalizar no cliente','Apenas conexão Wi-Fi','Não usar app do entregador','Desativar dados móveis'], correct: 0, hint: 'App do entregador + GPS sempre ativo.', type: 'multiple' },
  { id: 5, x: 5, y: 5, video: 'otimizacao-rotas', context: 'Você tem múltiplas entregas para fazer. A rota escolhida impacta o tempo de entrega.', situation: 'Qual é a melhor estratégia para otimizar rotas de entrega?', options: ['Entregar por ordem de chegada','Agrupar por proximidade geográfica','Priorizar pedidos maiores','Usar apenas uma rota fixa'], correct: 1, hint: 'Agrupe entregas por região para economizar tempo.', type: 'multiple' },
  { id: 6, x: 8, y: 4, video: 'atendimento-cliente', context: 'Um cliente reclama de um produto com defeito. O atendimento define a experiência.', situation: 'Como deve ser a abordagem ideal no atendimento ao cliente?', options: ['Negar responsabilidade','Ouvir, entender e solucionar rapidamente','Transferir para o suporte','Oferecer desconto sempre'], correct: 1, hint: 'Empatia e solução rápida geram satisfação.', type: 'multiple' },
  { id: 7, x: 11, y: 4, video: 'gestao-estoque', context: 'Seu estoque está baixo e pedidos continuam chegando. A gestão preventiva é crucial.', situation: 'Qual é a frequência ideal para atualizar o estoque na plataforma?', options: ['Uma vez por semana','Diariamente no início do dia','Em tempo real conforme vendas','Apenas quando acabar'], correct: 2, hint: 'Atualize em tempo real para evitar vendas de produtos indisponíveis.', type: 'multiple' },
  { id: 8, x: 14, y: 5, video: 'prevencao-avarias', context: 'Produtos frágeis precisam de cuidado especial no transporte e armazenamento.', situation: 'Como prevenir avarias em produtos sensíveis?', options: ['Embalar adequadamente + manter temperatura','Transportar rapidamente','Usar apenas sacolas plásticas','Evitar produtos frágeis'], correct: 0, hint: 'Embalagem correta e controle de temperatura são essenciais.', type: 'multiple' },
  { id: 9, x: 4, y: 7, video: 'protocolos-seguranca', context: 'Durante as entregas, a segurança deve ser sempre prioridade para você e seus clientes.', situation: 'Qual protocolo de segurança é fundamental para entregadores?', options: ['Correr para entregar rápido','Usar equipamentos de proteção + seguir trânsito','Economizar combustível','Trabalhar apenas de dia'], correct: 1, hint: 'EPIs e respeito às leis de trânsito salvam vidas.', type: 'multiple' },
  { id: 10, x: 7, y: 6, video: 'marketing-promocoes', context: 'As vendas estão baixas e você quer aumentar a visibilidade da sua loja.', situation: 'Qual estratégia de marketing é mais eficaz para parceiros?', options: ['Apenas preços baixos','Participar de campanhas + produtos em destaque','Não fazer promoções','Copiar concorrentes'], correct: 1, hint: 'Campanhas da plataforma + destaque de produtos aumentam vendas.', type: 'multiple' },
  { id: 11, x: 10, y: 6, video: 'gestao-financeira', context: 'É essencial acompanhar custos, receitas e margem de lucro para manter o negócio saudável.', situation: 'Qual é o principal indicador financeiro que um parceiro deve acompanhar?', options: ['Apenas faturamento bruto','Margem líquida por produto vendido','Número total de pedidos','Velocidade de entrega'], correct: 1, hint: 'Margem líquida mostra a real lucratividade do negócio.', type: 'multiple' },
  { id: 12, x: 3, y: 8, video: 'relacionamento-fornecedores', context: 'Bons fornecedores são essenciais para manter qualidade e preços competitivos.', situation: 'Como construir relacionamentos sólidos com fornecedores?', options: ['Sempre escolher o mais barato','Negociar prazos + manter pagamentos em dia','Trocar constantemente','Pagar apenas à vista'], correct: 1, hint: 'Confiança mútua e pontualidade fortalecem parcerias.', type: 'multiple' },
  { id: 13, x: 6, y: 8, video: 'sustentabilidade', context: 'Consumidores valorizam empresas que se preocupam com o meio ambiente.', situation: 'Qual prática sustentável pode ser implementada facilmente?', options: ['Ignorar embalagens','Usar sacolas reutilizáveis + reduzir desperdício','Aumentar entregas','Usar apenas descartáveis'], correct: 1, hint: 'Pequenas ações sustentáveis fazem grande diferença.', type: 'multiple' },
  { id: 14, x: 9, y: 8, video: 'analise-dados', context: 'Os dados do app fornecem insights valiosos para melhorar sua operação continuamente.', situation: 'Qual métrica é mais importante para acompanhar diariamente?', options: ['Apenas número de pedidos','KPIs combinados + tendências de vendas','Somente reclamações','Tempo online apenas'], correct: 1, hint: 'Visão integrada dos KPIs revela oportunidades de melhoria.', type: 'multiple' },
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentUser: null,
    sessionStartTime: 0,
    playerPosition: { x: 2, y: 6 },
    stats: { lives: 3, score: 0, completedTasks: 0, accuracy: 0, sessionTime: '00:00' },
    kpis: { disponibilidade: 0, aceitacao: 0, tempoEntrega: 0, avaliacao: 0 },
    settings: { sound: true, animations: true, speed: 1 },
    // Melhor dos dois mundos: inicia sequencial (primeiro current, demais locked)
    checkpoints: INITIAL_CHECKPOINTS.map((cp, i) => ({ ...cp, completed: false, status: i === 0 ? 'current' : 'locked' })),
    correctAnswers: 0,
    totalQuestions: 0,
  });

  // Timer de sessão
  useEffect(() => {
    if (!gameState.sessionStartTime) return;
    const t = setInterval(() => {
      const elapsed = Date.now() - gameState.sessionStartTime;
      const m = Math.floor(elapsed / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      setGameState(prev => ({ ...prev, stats: { ...prev.stats, sessionTime: `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` } }));
    }, 1000);
    return () => clearInterval(t);
  }, [gameState.sessionStartTime]);

  // Accuracy
  useEffect(() => {
    const accuracy = gameState.totalQuestions > 0 ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) : 0;
    setGameState(prev => ({ ...prev, stats: { ...prev.stats, accuracy } }));
  }, [gameState.correctAnswers, gameState.totalQuestions]);

  const startGame = useCallback((playerName: string) => {
    setGameState(prev => ({ ...prev, currentUser: playerName, sessionStartTime: Date.now() }));
  }, []);

  const movePlayer = useCallback((newPosition: Position) => {
    setGameState(prev => ({ ...prev, playerPosition: newPosition }));
  }, []);

  const answerCheckpoint = useCallback((checkpointId: number, isCorrect: boolean) => {
    setGameState(prev => {
      const idx = prev.checkpoints.findIndex(cp => cp.id === checkpointId);
      if (idx === -1) return prev;

      const next = prev.checkpoints.map(cp => cp.id !== checkpointId ? cp : ({ ...cp, completed: isCorrect, status: isCorrect ? 'completed' as const : 'failed' as const }));

      // Desbloqueio sequencial (quando acertar, o próximo "locked" vira "current")
      if (isCorrect) {
        const n = idx + 1;
        if (n < next.length && next[n].status === 'locked') {
          next[n] = { ...next[n], status: 'current' };
        }
      }

      const completedCount = next.filter(cp => cp.status === 'completed').length;
      const newStats: GameStats = {
        ...prev.stats,
        completedTasks: completedCount,
        score: prev.stats.score + (isCorrect ? 100 : 0),
        lives: isCorrect ? prev.stats.lives : Math.max(0, prev.stats.lives - 1),
      };

      const kpiBonus = isCorrect ? 5 : -3;
      const clamp = (v: number) => Math.max(0, Math.min(100, v));
      const newKpis: KPIData = {
        disponibilidade: clamp(prev.kpis.disponibilidade + kpiBonus),
        aceitacao: clamp(prev.kpis.aceitacao + kpiBonus),
        tempoEntrega: clamp(prev.kpis.tempoEntrega + kpiBonus),
        avaliacao: clamp(prev.kpis.avaliacao + kpiBonus),
      };

      return {
        ...prev,
        checkpoints: next,
        stats: newStats,
        kpis: newKpis,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1,
      };
    });
  }, []);

  const updateSettings = useCallback((newSettings: GameSettings) => {
    setGameState(prev => ({ ...prev, settings: newSettings }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerPosition: { x: 2, y: 6 },
      stats: { lives: 3, score: 0, completedTasks: 0, accuracy: 0, sessionTime: '00:00' },
      kpis: { disponibilidade: 0, aceitacao: 0, tempoEntrega: 0, avaliacao: 0 },
      checkpoints: INITIAL_CHECKPOINTS.map((cp, i) => ({ ...cp, completed: false, status: i === 0 ? 'current' : 'locked' })),
      correctAnswers: 0,
      totalQuestions: 0,
      sessionStartTime: Date.now(),
    }));
  }, []);

  return { gameState, actions: { startGame, movePlayer, answerCheckpoint, updateSettings, resetGame } } as const;
}